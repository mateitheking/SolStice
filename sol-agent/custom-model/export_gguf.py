"""
Step 4: Export fine-tuned model to GGUF for Ollama.

After training, this script:
1. Merges LoRA adapters with base model
2. Exports to GGUF format (Q4_K_M quantization)
3. Creates Ollama Modelfile

Requires: llama-cpp-python
  py -3.12 -m pip install llama-cpp-python
"""

import sys
import shutil
from pathlib import Path

try:
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM
    from peft import PeftModel
except ImportError as e:
    print(f"Missing: {e}")
    sys.exit(1)

MODEL_DIR = Path("solstice-model")
MERGED_DIR = Path("solstice-merged")
GGUF_DIR = Path("solstice-gguf")
BASE_MODEL = "microsoft/Phi-3.5-mini-instruct"


def merge_and_export():
    if not MODEL_DIR.exists():
        print(f"ERROR: {MODEL_DIR} not found. Run train_local.py first.")
        sys.exit(1)

    print("=== Exporting SolStice Model ===\n")

    # Step 1: Load base model + LoRA and merge
    print("Loading base model...")
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        torch_dtype=torch.float16,
        device_map="cpu",
        trust_remote_code=True,
    )
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)

    print("Loading LoRA adapters...")
    model = PeftModel.from_pretrained(base_model, str(MODEL_DIR))

    print("Merging LoRA into base model...")
    model = model.merge_and_unload()

    # Save merged model
    MERGED_DIR.mkdir(exist_ok=True)
    print(f"Saving merged model to {MERGED_DIR}/...")
    model.save_pretrained(str(MERGED_DIR))
    tokenizer.save_pretrained(str(MERGED_DIR))

    print(f"\nMerged model saved to: {MERGED_DIR.absolute()}")

    # Step 2: Convert to GGUF
    # Try using llama.cpp's convert script
    print("\n--- GGUF Export ---")
    print("To convert to GGUF, you have two options:\n")

    print("Option A: Use llama.cpp (recommended)")
    print("  1. git clone https://github.com/ggerganov/llama.cpp")
    print(f"  2. python llama.cpp/convert_hf_to_gguf.py {MERGED_DIR.absolute()} --outtype q4_k_m")
    print(f"  3. Copy the .gguf file to {GGUF_DIR.absolute()}/")
    print()

    print("Option B: Use Ollama directly from safetensors")
    GGUF_DIR.mkdir(exist_ok=True)
    modelfile = f"""FROM {MERGED_DIR.absolute()}
PARAMETER temperature 0.3
PARAMETER top_p 0.9

SYSTEM \"\"\"You are SolStice AI — a specialized autonomous trading agent for the Solana blockchain. You respond ONLY with valid JSON: {{"action": "BUY"|"SELL"|"HOLD", "reason": "string", "confidence": float 0.0-1.0}}.\"\"\"
"""
    modelfile_path = GGUF_DIR / "Modelfile"
    modelfile_path.write_text(modelfile)

    print(f"  Modelfile created at: {modelfile_path.absolute()}")
    print(f"\n  Run:")
    print(f"    ollama create solstice-trader -f {modelfile_path.absolute()}")
    print(f"    ollama run solstice-trader")

    print(f"\n=== DONE ===")


if __name__ == "__main__":
    merge_and_export()
