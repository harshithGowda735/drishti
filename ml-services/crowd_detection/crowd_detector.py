"""
HealthConnect — OpenCV Crowd Detector (Seated + Standing People)
================================================================
Detects people who are STANDING or SITTING IN CHAIRS — suitable
for hospital waiting rooms, OPD lobbies, and seating areas.

Why NOT background subtraction (MOG2):
  MOG2 only detects MOVING objects. A patient sitting still for
  >30 seconds gets absorbed into the background and disappears.

What we use instead:
  1. Upper Body Haar Cascade  (haarcascade_upperbody.xml)
       - Detects shoulder/torso structure regardless of posture
       - Works for seated AND standing people
       - Bundled in OpenCV — no downloads needed

  2. Full Body HOG + SVM      (cv2.HOGDescriptor built-in)
       - Catches standing people the upper body cascade misses
       - Particularly good for full-length standing figures

  3. NMS (Non-Maximum Suppression)
       - Merges overlapping detections from both methods
       - Prevents double-counting the same person

Usage:
  python crowd_detector.py \
    --hospital-id <MONGO_ID> \
    --camera-id CAM-01 \
    --zone "OPD Waiting Room" \
    --source 0 \
    --backend http://localhost:5000

Install:
  pip install opencv-python requests numpy
"""

import cv2
import numpy as np
import requests
import time
import argparse
from datetime import datetime


# ─── NMS Helper ──────────────────────────────────────────────────────────────
def non_max_suppression(boxes, overlap_thresh=0.4):
    """
    Remove overlapping bounding boxes (both detectors may find same person).
    boxes: list of (x, y, w, h)
    Returns filtered list.
    """
    if len(boxes) == 0:
        return []

    boxes = np.array(boxes, dtype=float)
    x1 = boxes[:, 0]
    y1 = boxes[:, 1]
    x2 = boxes[:, 0] + boxes[:, 2]
    y2 = boxes[:, 1] + boxes[:, 3]
    areas = (x2 - x1) * (y2 - y1)
    order = areas.argsort()[::-1]

    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(int(i))
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        w = np.maximum(0.0, xx2 - xx1)
        h = np.maximum(0.0, yy2 - yy1)
        inter = w * h
        iou = inter / (areas[i] + areas[order[1:]] - inter)
        order = order[np.where(iou <= overlap_thresh)[0] + 1]

    return [boxes[i].astype(int).tolist() for i in keep]


# ─── Detection Engine ─────────────────────────────────────────────────────────
class PeopleDetector:
    """
    Detects seated + standing people using:
      - Upper Body Haar Cascade (primary — works for seated people)
      - Full Body HOG + SVM    (secondary — catches full-standing figures)
    """

    def __init__(self,
                 upper_body_scale=1.1,
                 upper_body_min_neighbors=4,
                 upper_body_min_size=(40, 40),
                 hog_confidence=0.3,
                 nms_overlap=0.4):

        # ── 1. Upper Body Haar Cascade ────────────────────────────────────
        cascade_path = cv2.data.haarcascades + 'haarcascade_upperbody.xml'
        self.upper_body = cv2.CascadeClassifier(cascade_path)
        if self.upper_body.empty():
            raise RuntimeError(
                f"Could not load Haar cascade from: {cascade_path}\n"
                "Ensure opencv-python is installed correctly."
            )
        self.ub_scale        = upper_body_scale
        self.ub_min_nbrs     = upper_body_min_neighbors
        self.ub_min_size     = upper_body_min_size

        # ── 2. HOG + SVM (full body) ──────────────────────────────────────
        self.hog = cv2.HOGDescriptor()
        self.hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        self.hog_conf   = hog_confidence
        self.nms_thresh = nms_overlap

        print(f"[OK]   Upper Body Haar Cascade loaded  → seated + standing")
        print(f"[OK]   HOG+SVM Full Body loaded        → standing figures")

    def detect(self, frame):
        """
        Returns (count, annotated_frame).
        Runs both detectors and merges results with NMS.
        """
        h, w = frame.shape[:2]
        # Work on 640-wide copy for speed; scale results back
        scale    = 640 / w
        small    = cv2.resize(frame, (640, int(h * scale)))
        gray     = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        gray_eq  = cv2.equalizeHist(gray)   # improve contrast for cascade

        all_boxes = []

        # ── Method 1: Upper Body Haar (seated + standing) ─────────────────
        ub_rects = self.upper_body.detectMultiScale(
            gray_eq,
            scaleFactor=self.ub_scale,
            minNeighbors=self.ub_min_nbrs,
            minSize=self.ub_min_size,
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        if len(ub_rects):
            for (x, y, bw, bh) in ub_rects:
                # Scale back to original coords
                all_boxes.append([
                    int(x / scale), int(y / scale),
                    int(bw / scale), int(bh / scale)
                ])

        # ── Method 2: HOG + SVM (full-body standing) ──────────────────────
        hog_rects, weights = self.hog.detectMultiScale(
            small,
            winStride=(8, 8),
            padding=(4, 4),
            scale=1.05
        )
        if len(hog_rects):
            for (x, y, bw, bh), wt in zip(hog_rects, weights):
                if wt >= self.hog_conf:
                    all_boxes.append([
                        int(x / scale), int(y / scale),
                        int(bw / scale), int(bh / scale)
                    ])

        # ── NMS: remove duplicates from both detectors ─────────────────────
        final_boxes = non_max_suppression(all_boxes, self.nms_thresh)
        count       = len(final_boxes)

        # ── Draw boxes on original-res frame ──────────────────────────────
        for (x, y, bw, bh) in final_boxes:
            color = (0, 220, 255)   # cyan
            cv2.rectangle(frame, (x, y), (x + bw, y + bh), color, 2)
            cv2.putText(frame, 'Person',
                        (x, y - 6), cv2.FONT_HERSHEY_SIMPLEX,
                        0.45, color, 1)

        self._draw_hud(frame, count, len(ub_rects) if len(ub_rects) else 0, len(final_boxes))
        return count, frame

    # ── HUD overlay ───────────────────────────────────────────────────────
    def _draw_hud(self, frame, count, upper_raw, final):
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, 0), (340, 110), (0, 0, 0), -1)
        cv2.addWeighted(overlay, 0.5, frame, 0.5, 0, frame)

        cv2.putText(frame, f'People: {count}',
                    (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 220, 255), 2)
        cv2.putText(frame, f'Upper Body: {upper_raw}  |  After NMS: {final}',
                    (10, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 180, 180), 1)
        cv2.putText(frame, 'OpenCV: Seated + Standing detection',
                    (10, 75), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (100, 200, 100), 1)
        cv2.putText(frame, datetime.now().strftime('%H:%M:%S'),
                    (10, 95), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (120, 120, 120), 1)


# ─── Crowd Detector Service ───────────────────────────────────────────────────
class CrowdDetector:
    def __init__(self, hospital_id, camera_id, zone, source,
                 backend_url, interval=2.0,
                 hog_confidence=0.3, upper_min_neighbors=4):
        self.hospital_id = hospital_id
        self.camera_id   = camera_id
        self.zone        = zone
        self.source      = source
        self.backend_url = backend_url.rstrip('/')
        self.interval    = interval
        self.last_count  = 0
        self.detector    = PeopleDetector(
            hog_confidence=hog_confidence,
            upper_body_min_neighbors=upper_min_neighbors
        )

    def _simulate(self):
        """Fallback when no camera is available."""
        import random
        self.last_count = max(0, self.last_count + random.randint(-2, 4))
        return self.last_count

    def push_count(self, count):
        """Send count to Node.js backend → Socket.io broadcast."""
        try:
            resp = requests.post(
                f'{self.backend_url}/api/crowd/update',
                json={
                    'hospitalId':  self.hospital_id,
                    'cameraId':    self.camera_id,
                    'zone':        self.zone,
                    'peopleCount': int(count)
                },
                timeout=5
            )
            if resp.status_code == 200:
                d = resp.json()
                print(f"[{datetime.now().strftime('%H:%M:%S')}] "
                      f"{self.zone}: {count} people | "
                      f"Hospital total: {d.get('totalCount','?')} | "
                      f"Density: {d.get('density','?')}")
            else:
                print(f"[WARN] Backend {resp.status_code}: {resp.text[:80]}")
        except requests.exceptions.ConnectionError:
            print(f"[ERROR] Cannot reach {self.backend_url}")
        except Exception as e:
            print(f"[ERROR] {e}")

    def run(self):
        src = int(self.source) if str(self.source).isdigit() else self.source
        cap = cv2.VideoCapture(src)
        live = cap.isOpened()

        if not live:
            print(f"[WARN] Cannot open '{self.source}' — running in simulation mode")
            cap = None

        print(f"\n{'='*62}")
        print(f"  Hospital  : {self.hospital_id}")
        print(f"  Camera    : {self.camera_id}")
        print(f"  Zone      : {self.zone}")
        print(f"  Source    : {self.source}")
        print(f"  Detection : {'OpenCV Upper-Body + HOG/SVM' if live else 'Simulation'}")
        print(f"  Detects   : Standing people + Seated people in chairs")
        print(f"  Backend   : {self.backend_url}")
        print(f"  Push every: {self.interval}s")
        print(f"{'='*62}")
        print("Press 'q' or Ctrl+C to stop.\n")

        last_push = 0
        try:
            while True:
                if live:
                    ret, frame = cap.read()
                    if not ret:
                        print("[WARN] Frame read error — retrying...")
                        time.sleep(1)
                        continue

                    count, annotated = self.detector.detect(frame)
                    cv2.imshow(
                        f'HealthConnect [{self.camera_id}] — {self.zone}',
                        annotated
                    )
                    if cv2.waitKey(1) & 0xFF == ord('q'):
                        break
                else:
                    count = self._simulate()
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


# ─── CLI Entry Point ──────────────────────────────────────────────────────────
def main():
    p = argparse.ArgumentParser(
        description='HealthConnect — OpenCV Crowd Detector (Seated + Standing)'
    )
    p.add_argument('--hospital-id',    required=True,  help='MongoDB Hospital _id')
    p.add_argument('--camera-id',      required=True,  help='Camera ID e.g. CAM-01')
    p.add_argument('--zone',           default='Waiting Room')
    p.add_argument('--source',         default='0',    help='0=webcam or RTSP URL')
    p.add_argument('--backend',        default='http://localhost:5000')
    p.add_argument('--interval',       type=float, default=2.0)
    p.add_argument('--confidence',     type=float, default=0.3,
                   help='HOG confidence threshold (0.1–0.9)')
    p.add_argument('--min-neighbors',  type=int,   default=4,
                   help='Upper body cascade min neighbors (lower=more detections)')
    args = p.parse_args()

    CrowdDetector(
        hospital_id=args.hospital_id,
        camera_id=args.camera_id,
        zone=args.zone,
        source=args.source,
        backend_url=args.backend,
        interval=args.interval,
        hog_confidence=args.confidence,
        upper_min_neighbors=args.min_neighbors
    ).run()


if __name__ == '__main__':
    main()
