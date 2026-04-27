import random
import time
from typing import Optional, List
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="HealthConnect AI IoT Intelligence",
    description="Edge-computing simulation for CCTV/IoT crowd analytics.",
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── IOT CAMERA REGISTRY ──────────────────────────────────────────
# Simulated hardware state for clinic/hospital cameras
iot_cameras = {
    "default": {"people_count": 12, "status": "active", "last_pulse": time.time(), "fps": 24},
}

class CameraUpdate(BaseModel):
    hospital_id: str
    count: int
    zone: str = "Main Entrance"

@app.get("/iot/sync/{hospital_id}")
def sync_camera_feed(hospital_id: str):
    """
    Simulates a CCTV/IoT camera installed in a hospital.
    Automatically fluctuates count to mimic real-world visual traffic.
    """
    if hospital_id not in iot_cameras:
        iot_cameras[hospital_id] = {
            "people_count": random.randint(5, 45),
            "status": "online",
            "last_pulse": time.time(),
            "fps": random.randint(15, 30)
        }
    
    # Simulate real-time CCTV fluctuation
    camera = iot_cameras[hospital_id]
    drift = random.choice([-2, -1, 0, 1, 2])
    camera["people_count"] = max(0, camera["people_count"] + drift)
    camera["last_pulse"] = time.time()
    
    density = "low"
    if camera["people_count"] > 35: density = "high"
    elif camera["people_count"] > 15: density = "moderate"

    return {
        "hospital_id": hospital_id,
        "live_count": camera["people_count"],
        "density": density,
        "camera_metadata": {
            "model": "HC-Vision-Pro-X1",
            "ip": f"192.168.1.{random.randint(10, 255)}",
            "uptime": f"{random.randint(100, 2000)}h",
            "status": camera["status"]
        }
    }

@app.post("/iot/broadcast")
def broadcast_manual_detection(data: CameraUpdate):
    """
    Allows the frontend (browser CV) to broadcast detected counts to the IoT Hub.
    """
    iot_cameras[data.hospital_id] = {
        "people_count": data.count,
        "status": "broadcasting",
        "last_pulse": time.time(),
        "zone": data.zone
    }
    return {"status": "broadcast_received", "synced_count": data.count}

# ── ML DIAGNOSTICS ──────────────────────────────────────────────
class DiagnosticRequest(BaseModel):
    symptoms: List[str]
    vitals: Optional[dict] = None

@app.post("/ml/diagnose")
def diagnose_ai(req: DiagnosticRequest):
    """
    Basic NLP/Rule-based triage prediction.
    """
    critical_keywords = ["chest pain", "breathing", "unconscious", "bleeding"]
    is_critical = any(kw in " ".join(req.symptoms).lower() for kw in critical_keywords)
    
    return {
        "triage_category": "Emergency" if is_critical else "General",
        "confidence": 0.89 if is_critical else 0.75,
        "priority": 1 if is_critical else 3,
        "recommended_dept": "Cardiology" if "chest" in " ".join(req.symptoms).lower() else "OPD"
    }

@app.get("/health")
def health():
    return {"status": "AI Intelligence Engine Online", "opencv": "Ready", "iot_sync": "Active"}

@app.get("/")
def root():
    return {"name": "HealthConnect AI Hub", "active_iot_nodes": len(iot_cameras)}
