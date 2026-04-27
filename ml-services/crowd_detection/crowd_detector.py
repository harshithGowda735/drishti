"""
HealthConnect — Per-Hospital OpenCV HOG+SVM Crowd Detection Service
====================================================================
Uses OpenCV's built-in HOG (Histogram of Oriented Gradients) +
pretrained SVM people detector — no external model files needed.

HOG+SVM is OpenCV's default, accurate, and runs entirely in-process.

Usage:
  python crowd_detector.py --hospital-id <MONGODB_ID> \
                           --camera-id CAM-01 \
                           --zone "Main Entrance" \
                           --source 0 \
                           --backend http://localhost:5000

Requirements:
  pip install opencv-python requests
"""

import cv2
import requests
import time
import argparse
from datetime import datetime


class CrowdDetector:
    def __init__(self, hospital_id, camera_id, zone, source,
                 backend_url, win_stride=(8, 8), padding=(4, 4),
                 scale=1.05, confidence_threshold=0.3, interval=2.0):

        self.hospital_id   = hospital_id
        self.camera_id     = camera_id
        self.zone          = zone
        self.source        = source
        self.backend_url   = backend_url.rstrip('/')
        self.win_stride    = win_stride
        self.padding       = padding
        self.scale         = scale
        self.conf_thresh   = confidence_threshold
        self.interval      = interval
        self.last_count    = 0

        # ── OpenCV built-in HOG people detector ──────────────────────────
        self.hog = cv2.HOGDescriptor()
        self.hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        print("[OK]   HOG+SVM people detector loaded (built-in OpenCV)")

    # ── Detect people in a single frame ──────────────────────────────────
    def detect_people(self, frame):
        """
        Returns (count, annotated_frame).
        Runs multi-scale HOG detection; NMS is applied automatically.
        """
        # Resize for speed (640px wide keeps accuracy)
        h, w = frame.shape[:2]
        target_w = 640
        scale_f   = target_w / w
        small     = cv2.resize(frame, (target_w, int(h * scale_f)))

        rects, weights = self.hog.detectMultiScale(
            small,
            winStride=self.win_stride,
            padding=self.padding,
            scale=self.scale
        )

        # Filter by confidence weight
        people = [(r, wt) for r, wt in zip(rects, weights) if wt >= self.conf_thresh]

        # Draw boxes scaled back to original frame
        for (x, y, bw, bh), wt in people:
            # Scale coords back to original resolution
            x_  = int(x  / scale_f)
            y_  = int(y  / scale_f)
            bw_ = int(bw / scale_f)
            bh_ = int(bh / scale_f)
            cv2.rectangle(frame, (x_, y_), (x_ + bw_, y_ + bh_), (0, 255, 0), 2)
            cv2.putText(frame, f'{wt:.2f}',
                        (x_, y_ - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 0), 1)

        # Overlay: count + zone
        count = len(people)
        cv2.putText(frame, f'People: {count}',
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)
        cv2.putText(frame, f'Zone: {self.zone}',
                    (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 0), 2)
        cv2.putText(frame, f'HOG+SVM | Cam: {self.camera_id}',
                    (10, 85), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (180, 180, 180), 1)

        return count, frame

    # ── Simulation fallback (no camera) ──────────────────────────────────
    def simulate_count(self):
        import random
        delta = random.randint(-3, 5)
        self.last_count = max(0, self.last_count + delta)
        return self.last_count

    # ── POST count to Node.js backend ────────────────────────────────────
    def push_count(self, count):
        payload = {
            'hospitalId':  self.hospital_id,
            'cameraId':    self.camera_id,
            'zone':        self.zone,
            'peopleCount': int(count)
        }
        try:
            resp = requests.post(
                f'{self.backend_url}/api/crowd/update',
                json=payload, timeout=5
            )
            if resp.status_code == 200:
                data = resp.json()
                print(f"[{datetime.now().strftime('%H:%M:%S')}] "
                      f"{self.zone}: {count} people | "
                      f"Hospital total: {data.get('totalCount', '?')} | "
                      f"Density: {data.get('density', '?')}")
            else:
                print(f"[WARN] Backend {resp.status_code}: {resp.text[:80]}")
        except requests.exceptions.ConnectionError:
            print(f"[ERROR] Cannot reach backend at {self.backend_url}")
        except Exception as e:
            print(f"[ERROR] {e}")

    # ── Main loop ─────────────────────────────────────────────────────────
    def run(self):
        # Open camera source
        src = int(self.source) if str(self.source).isdigit() else self.source
        cap = cv2.VideoCapture(src)
        use_camera = cap.isOpened()

        if not use_camera:
            print(f"[WARN] Cannot open source '{self.source}' — running in simulation mode")
            cap = None

        print(f"\n{'='*60}")
        print(f"  Hospital : {self.hospital_id}")
        print(f"  Camera   : {self.camera_id}")
        print(f"  Zone     : {self.zone}")
        print(f"  Source   : {self.source}")
        print(f"  Mode     : {'HOG+SVM Live Detection' if use_camera else 'Simulation'}")
        print(f"  Backend  : {self.backend_url}")
        print(f"{'='*60}")
        print("Press Ctrl+C or 'q' to quit.\n")

        last_push = 0
        try:
            while True:
                if use_camera:
                    ret, frame = cap.read()
                    if not ret:
                        print("[WARN] Frame read failed — retrying...")
                        time.sleep(1)
                        continue

                    count, annotated = self.detect_people(frame)
                    cv2.imshow(f'HealthConnect [{self.camera_id}] — {self.zone}', annotated)
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
                else:
                    count = self.simulate_count()
                    time.sleep(0.5)

                now = time.time()
                if now - last_push >= self.interval:
                    self.push_count(count)
                    self.last_count = count
                    last_push = now

        except KeyboardInterrupt:
            print("\n[INFO] Stopped by user.")
        finally:
            if cap:
                cap.release()
            cv2.destroyAllWindows()
            print("[INFO] Detector shut down cleanly.")


def main():
    parser = argparse.ArgumentParser(
        description='HealthConnect Crowd Detector — OpenCV HOG+SVM'
    )
    parser.add_argument('--hospital-id', required=True)
    parser.add_argument('--camera-id',   required=True)
    parser.add_argument('--zone',        default='Entrance')
    parser.add_argument('--source',      default='0',
                        help='Camera index (0) or RTSP URL')
    parser.add_argument('--backend',     default='http://localhost:5000')
    parser.add_argument('--interval',    type=float, default=2.0,
                        help='Seconds between API pushes')
    parser.add_argument('--confidence',  type=float, default=0.3,
                        help='HOG detection weight threshold')
    args = parser.parse_args()

    CrowdDetector(
        hospital_id=args.hospital_id,
        camera_id=args.camera_id,
        zone=args.zone,
        source=args.source,
        backend_url=args.backend,
        confidence_threshold=args.confidence,
        interval=args.interval
    ).run()


if __name__ == '__main__':
    main()
