# backend/simulate_grid.py
import time
import random
import requests
from datetime import datetime, timedelta

# Endpoint target matching your clean routing structure
API_URL = "http://127.0.0.1:8000/api/v1/ingest/"

FACILITIES = [
    {"id": "SOLAR_FARM_ZEERUST", "type": "solar", "capacity_mw": 75.0, "meter": "METER_ZR_01"},
    {"id": "WIND_FARM_COOKHOUSE", "type": "wind", "capacity_mw": 140.0, "meter": "METER_CH_02"}
]

def calculate_yield(facility_type, hour, capacity):
    """Generates realistic generation curves based on the time of day."""
    if facility_type == "solar":
        # Bell curve peaking between 11:00 and 14:00
        if 6 <= hour <= 18:
            # Simple parabolic profile modeling sunlight curve
            factor = max(0, -0.028 * (hour - 12)**2 + 1)
            return round(capacity * factor * random.uniform(0.85, 1.0), 4)
        return 0.0
    
    elif facility_type == "wind":
        # Wind peaks during off-peak night hours and morning/evening grid spikes
        if hour < 6 or hour > 17:
            return round(capacity * random.uniform(0.60, 0.95), 4)
        return round(capacity * random.uniform(0.20, 0.55), 4)
    
    return 0.0

def run_simulation():
    print("⚡ Starting NOA High-Velocity Grid Data Simulator...")
    print(f"📡 Target Ingestion Gate: {API_URL}")
    print("--------------------------------------------------")

    # Start the simulated clock at midnight today
    simulated_time = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    while True:
        current_hour = simulated_time.hour
        
        for facility in FACILITIES:
            generation = calculate_yield(facility["type"], current_hour, facility["capacity_mw"])
            
            # Construct the exact data layout our Django view expects
            payload = {
                "ipp_id": facility["id"],
                "readings": [
                    {
                        "meter_id": facility["meter"],
                        "timestamp": simulated_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                        "mw_delivered": str(generation)
                    }
                ]
            }
            
            try:
                response = requests.post(API_URL, json=payload, timeout=2)
                if response.status_code == 202:
                    print(f"✅ [{simulated_time.strftime('%H:%M')}] Sent {facility['id']}: {generation} MW")
                else:
                    print(f"❌ Failed to dispatch payload for {facility['id']}: {response.status_code}")
            except requests.exceptions.RequestException as e:
                print(f"⚠️ Network error connecting to ingestion gate: {e}")

        # Advance the simulated grid clock forward by a 30-minute settlement interval
        simulated_time += timedelta(minutes=30)
        
        # Reset clock back to midnight if we complete a full 24-hour cycle rotation
        if simulated_time.date() > datetime.utcnow().date():
            simulated_time = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            print("\n🔄 Completed 24-hour cycle. Resetting timeline...\n")

        # Sleep for 2 seconds to accelerate the data rendering updates on the UI dashboard
        time.sleep(2)

if __name__ == "__main__":
    run_simulation()