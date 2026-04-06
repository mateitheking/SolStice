"""
Step 3: Fine-tune GPT-4o-mini on Solana trading data.

Uses OpenAI Fine-tuning API.
Cost: ~$0.30-1.00 for the dataset we generate (very cheap).
Time: 15-60 minutes.

Requirements:
  pip install openai
  Set OPENAI_API_KEY in environment or .env
"""

import os
import sys
import time
import json
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv(Path(__file__).parent.parent / ".env")

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("ERROR: OPENAI_API_KEY not found in .env")
    sys.exit(1)

client = OpenAI(api_key=OPENAI_API_KEY)

TRAIN_FILE = Path("training_data.jsonl")
VAL_FILE = Path("validation_data.jsonl")
BASE_MODEL = "gpt-4o-mini-2024-07-18"


def validate_data():
    """Check training data format before uploading."""
    if not TRAIN_FILE.exists():
        print(f"ERROR: {TRAIN_FILE} not found. Run generate_training.py first.")
        sys.exit(1)

    with open(TRAIN_FILE) as f:
        lines = f.readlines()

    print(f"Training file: {len(lines)} examples")

    errors = 0
    for i, line in enumerate(lines):
        try:
            data = json.loads(line)
            msgs = data["messages"]
            assert len(msgs) == 3
            assert msgs[0]["role"] == "system"
            assert msgs[1]["role"] == "user"
            assert msgs[2]["role"] == "assistant"
            # Validate assistant response is valid JSON
            resp = json.loads(msgs[2]["content"])
            assert resp["action"] in ("BUY", "SELL", "HOLD")
            assert 0 <= resp["confidence"] <= 1
        except Exception as e:
            errors += 1
            if errors <= 3:
                print(f"  Line {i+1} error: {e}")

    if errors > 0:
        print(f"WARNING: {errors} invalid examples found")
    else:
        print("All examples valid!")

    return errors == 0


def upload_files():
    """Upload training and validation files to OpenAI."""
    print("\nUploading training file...")
    train_response = client.files.create(
        file=open(TRAIN_FILE, "rb"),
        purpose="fine-tune",
    )
    print(f"  Training file ID: {train_response.id}")

    val_id = None
    if VAL_FILE.exists():
        print("Uploading validation file...")
        val_response = client.files.create(
            file=open(VAL_FILE, "rb"),
            purpose="fine-tune",
        )
        val_id = val_response.id
        print(f"  Validation file ID: {val_id}")

    return train_response.id, val_id


def start_finetune(train_file_id, val_file_id=None):
    """Start fine-tuning job."""
    print(f"\nStarting fine-tuning on {BASE_MODEL}...")

    params = {
        "training_file": train_file_id,
        "model": BASE_MODEL,
        "suffix": "solstice-trader",
        "hyperparameters": {
            "n_epochs": 3,
        },
    }

    if val_file_id:
        params["validation_file"] = val_file_id

    job = client.fine_tuning.jobs.create(**params)
    print(f"  Job ID: {job.id}")
    print(f"  Status: {job.status}")

    return job.id


def wait_for_completion(job_id):
    """Poll until fine-tuning is complete."""
    print("\nWaiting for fine-tuning to complete...")
    print("(This usually takes 15-60 minutes)\n")

    while True:
        job = client.fine_tuning.jobs.retrieve(job_id)
        status = job.status

        if status == "succeeded":
            model_id = job.fine_tuned_model
            print(f"\n=== FINE-TUNING COMPLETE ===")
            print(f"Model ID: {model_id}")
            print(f"\nAdd this to your .env:")
            print(f"  CUSTOM_MODEL_ID={model_id}")
            print(f"\nOr set in agent via API:")
            print(f'  POST /set-model {{"model": "custom"}}')

            # Save model ID
            (Path("model_id.txt")).write_text(model_id)
            return model_id

        elif status == "failed":
            print(f"\nFine-tuning FAILED!")
            print(f"Error: {job.error}")
            sys.exit(1)

        elif status == "cancelled":
            print(f"\nFine-tuning was cancelled.")
            sys.exit(1)

        else:
            # Show progress
            events = client.fine_tuning.jobs.list_events(fine_tuning_job_id=job_id, limit=1)
            last_event = events.data[0].message if events.data else ""
            print(f"  [{time.strftime('%H:%M:%S')}] Status: {status} — {last_event}")
            time.sleep(30)


def test_model(model_id):
    """Quick test of the fine-tuned model."""
    print(f"\nTesting {model_id}...")

    test_prompt = (
        "SOL/USDC prices (last 12 hours, oldest→newest): "
        "[142.5, 143.1, 143.8, 144.2, 143.9, 144.5, 145.1, 145.8, 146.2, 146.0, 146.5, 147.1]. "
        "Strategy: conservative. "
        "Technical: change=3.23%, SMA(6h)=$146.12, SMA(full)=$144.56, "
        "volatility=1.35, range=3.23%, momentum=1.45%. "
        "Solana ecosystem TVL: $8.2B (up from $7.9B last week). "
        "Analyze and return your trading decision as JSON."
    )

    response = client.chat.completions.create(
        model=model_id,
        max_tokens=256,
        messages=[
            {"role": "system", "content": "You are SolStice AI — a specialized autonomous trading agent for Solana. Respond with valid JSON: {\"action\": \"BUY\"|\"SELL\"|\"HOLD\", \"reason\": \"string\", \"confidence\": float}."},
            {"role": "user", "content": test_prompt},
        ],
    )

    result = response.choices[0].message.content
    print(f"Response: {result}")

    try:
        parsed = json.loads(result)
        print(f"Action: {parsed['action']}, Confidence: {parsed['confidence']}")
        print("Model is working correctly!")
    except:
        print("WARNING: Response is not valid JSON. May need more training data.")


# ============================================================
#  MAIN
# ============================================================

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        # Test existing model
        model_file = Path("model_id.txt")
        if model_file.exists():
            test_model(model_file.read_text().strip())
        else:
            print("No model_id.txt found. Run fine-tuning first.")
        sys.exit(0)

    if len(sys.argv) > 1 and sys.argv[1] == "status":
        # Check status of last job
        jobs = client.fine_tuning.jobs.list(limit=1)
        if jobs.data:
            job = jobs.data[0]
            print(f"Last job: {job.id}")
            print(f"Status: {job.status}")
            print(f"Model: {job.fine_tuned_model or 'not ready'}")
        sys.exit(0)

    print("=== SolStice Model Fine-Tuning ===\n")

    # Step 1: Validate
    validate_data()

    # Step 2: Upload
    train_id, val_id = upload_files()

    # Step 3: Start fine-tuning
    job_id = start_finetune(train_id, val_id)

    # Step 4: Wait
    model_id = wait_for_completion(job_id)

    # Step 5: Test
    test_model(model_id)
