"""
HealthConnect — Crowd Detection Flask API
=========================================
Wraps the crowd detector as a REST API so each hospital can
start/stop their detector via the dashboard.

Run:
  python api_server.py --port 6000

Then the hospital dashboard can POST to:
  http://localhost:6000/start  { hospital_id, camera_id, zone, source }
  http://localhost:6000/stop   { camera_id }
  http://localhost:6000/status
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import subprocess
import sys
import os

app = Flask(__name__)
CORS(app)

# Active detector processes: { camera_id: subprocess.Popen }
active_detectors = {}

BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:5000')
DETECTOR_SCRIPT = os.path.join(os.path.dirname(__file__), '..', 'crowd_detection', 'crowd_detector.py')


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'HealthConnect ML Crowd Detection API',
        'active_cameras': list(active_detectors.keys()),
        'backend': BACKEND_URL
    })


@app.route('/start', methods=['POST'])
def start_detector():
    """Start a detector process for a specific hospital camera."""
    data = request.json
    required = ['hospital_id', 'camera_id']
    for f in required:
        if not data.get(f):
            return jsonify({'error': f'{f} is required'}), 400

    camera_id = data['camera_id']
    if camera_id in active_detectors:
        proc = active_detectors[camera_id]
        if proc.poll() is None:
            return jsonify({'error': f'Detector for {camera_id} already running'}), 400

    cmd = [
        sys.executable, DETECTOR_SCRIPT,
        '--hospital-id', data['hospital_id'],
        '--camera-id', camera_id,
        '--zone', data.get('zone', 'Camera Zone'),
        '--source', str(data.get('source', '0')),
        '--backend', BACKEND_URL,
        '--confidence', str(data.get('confidence', 0.3)),
        '--interval', str(data.get('interval', 2.0))
    ]

    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
        active_detectors[camera_id] = proc
        return jsonify({
            'message': f'Detector started for {camera_id}',
            'pid': proc.pid,
            'camera_id': camera_id
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/stop', methods=['POST'])
def stop_detector():
    """Stop a running detector."""
    camera_id = request.json.get('camera_id')
    if not camera_id:
        return jsonify({'error': 'camera_id is required'}), 400

    proc = active_detectors.get(camera_id)
    if not proc:
        return jsonify({'error': f'No detector running for {camera_id}'}), 404

    proc.terminate()
    del active_detectors[camera_id]
    return jsonify({'message': f'Detector stopped for {camera_id}'})


@app.route('/status', methods=['GET'])
def status():
    """Get status of all running detectors."""
    statuses = {}
    for cam_id, proc in list(active_detectors.items()):
        if proc.poll() is None:
            statuses[cam_id] = 'running'
        else:
            statuses[cam_id] = 'stopped'
            del active_detectors[cam_id]
    return jsonify({'detectors': statuses})


@app.route('/stop-all', methods=['POST'])
def stop_all():
    """Stop all running detectors."""
    for cam_id, proc in list(active_detectors.items()):
        proc.terminate()
    active_detectors.clear()
    return jsonify({'message': 'All detectors stopped'})


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=6000)
    parser.add_argument('--backend', default='http://localhost:5000')
    args = parser.parse_args()
    BACKEND_URL = args.backend
    print(f"ML API server running on port {args.port}")
    print(f"Backend: {BACKEND_URL}")
    app.run(host='0.0.0.0', port=args.port, debug=False)
