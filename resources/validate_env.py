import os
import sys

REQUIRED_VARS = [
    "GEMINI_API_KEY",
    # Add all required vars here
]

def validate():
    missing = [v for v in REQUIRED_VARS if not os.getenv(v)]
    if missing:
        print(f"[ERROR] Missing required env vars: {', '.join(missing)}")
        print("Copy env/.env.example to env/.env and fill in values.")
        sys.exit(1)
    print("[OK] All required environment variables present.")

if __name__ == "__main__":
    validate()
