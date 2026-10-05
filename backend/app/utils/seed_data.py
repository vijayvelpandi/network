"""
Seed the database with sample data on first launch.
Generates 200 synthetic network-flow records and corresponding alerts.
"""
import random
from datetime import datetime, timedelta

from app.database import SessionLocal
from app.models.database import NetworkFlow, Alert
from ml.inference import classify_flow

NORMAL_IPS = ["192.168.1.10", "192.168.1.11", "10.0.0.15", "172.16.0.50"]
SUSPICIOUS_IPS = ["45.227.89.12", "185.220.101.45", "203.0.113.7"]
COMMON_PORTS = [80, 443, 53, 22, 3389]
HIGH_PORTS = [13389, 22345, 31256, 40897]


def seed_sample_data():
    """Insert sample flows if the database is empty."""
    db = SessionLocal()
    try:
        if db.query(NetworkFlow).count() > 0:
            return

        now = datetime.utcnow()
        for i in range(200):
            is_suspicious = random.random() < 0.3
            src_ip = random.choice(SUSPICIOUS_IPS if is_suspicious else NORMAL_IPS)

            if is_suspicious:
                attack = random.choice(["portscan", "dos", "bruteforce", "other"])
                if attack == "portscan":
                    dst_port = random.choice(HIGH_PORTS)
                    duration = random.randint(10, 300)
                    pkt_count = random.randint(1, 3)
                    byte_count = random.randint(40, 160)
                    pps = random.uniform(100, 800)
                    bps = random.uniform(500, 5000)
                    tcp_flags = "SYN"
                elif attack == "dos":
                    dst_port = random.choice(COMMON_PORTS)
                    duration = random.randint(50, 800)
                    pkt_count = random.randint(100, 2000)
                    byte_count = random.randint(100000, 1000000)
                    pps = random.uniform(500, 5000)
                    bps = random.uniform(500000, 5000000)
                    tcp_flags = "SYN"
                elif attack == "bruteforce":
                    dst_port = random.choice([22, 3389, 23])
                    duration = random.randint(100, 2000)
                    pkt_count = random.randint(3, 20)
                    byte_count = random.randint(200, 4000)
                    pps = random.uniform(5, 50)
                    bps = random.uniform(500, 8000)
                    tcp_flags = "SYN"
                else:
                    dst_port = random.choice(HIGH_PORTS)
                    duration = random.randint(50, 1500)
                    pkt_count = random.randint(10, 500)
                    byte_count = random.randint(50000, 200000)
                    pps = random.uniform(50, 400)
                    bps = random.uniform(100000, 500000)
                    tcp_flags = random.choice(["SYN", "ACK", "RST"])
            else:
                dst_port = random.choice(COMMON_PORTS)
                duration = random.randint(1000, 60000)
                pkt_count = random.randint(5, 200)
                byte_count = random.randint(2000, 500000)
                pps = random.uniform(1, 80)
                bps = random.uniform(1000, 80000)
                tcp_flags = random.choice(["SYN-ACK", "ACK", "PSH-ACK", "FIN-ACK"])

            protocol = random.choice(["TCP", "TCP", "TCP", "UDP"])
            if is_suspicious and attack == "other":
                protocol = random.choice(["TCP", "UDP", "ICMP"])

            flow_data = {
                "source_ip": src_ip,
                "destination_ip": random.choice(NORMAL_IPS),
                "source_port": random.randint(1024, 65535),
                "destination_port": dst_port,
                "protocol": protocol,
                "flow_duration": duration,
                "packet_count": pkt_count,
                "byte_count": byte_count,
                "packets_per_second": round(pps, 2),
                "bytes_per_second": round(bps, 2),
                "tcp_flags": tcp_flags,
            }

            result = classify_flow(flow_data)

            flow = NetworkFlow(
                timestamp=now - timedelta(seconds=random.randint(0, 7200)),
                **flow_data,
                label=result["label"],
                detection_type=result["detection_type"],
                confidence=result["confidence"],
            )
            db.add(flow)

            if result["label"] == "SUSPICIOUS":
                alert = Alert(
                    timestamp=flow.timestamp,
                    source_ip=flow_data["source_ip"],
                    destination_ip=flow_data["destination_ip"],
                    source_port=flow_data["source_port"],
                    destination_port=flow_data["destination_port"],
                    protocol=flow_data["protocol"],
                    detection_type=result["detection_type"],
                    severity=result["severity"],
                    confidence=result["confidence"],
                    status="OPEN",
                )
                db.add(alert)

        db.commit()
        print(f"Seeded database with 200 sample flows and alerts.")
    finally:
        db.close()
