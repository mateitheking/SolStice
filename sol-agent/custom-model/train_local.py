"""
Local fine-tuning WITHOUT Unsloth (works on Windows).

Uses: transformers + peft (LoRA) + bitsandbytes
GPU: RTX 4070 Super (12GB VRAM)
Model: Phi-3.5-mini-instruct (3.8B params, 4-bit quantized)
Time: ~60-90 min
"""

import json
import sys
from pathlib import Path

try:
    import torch
    from transformers import (
        AutoTokenizer,
        AutoModelForCausalLM,
        BitsAndBytesConfig,
        TrainingArguments,
    )
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from trl import SFTTrainer
    from datasets import Dataset
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("\nInstall:")
    print("  py -3.12 -m pip install transformers peft trl datasets accelerate bitsandbytes")
    sys.exit(1)

TRAIN_FILE = Path("training_data.jsonl")
OUTPUT_DIR = Path("solstice-model")
BASE_MODEL = "microsoft/Phi-3.5-mini-instruct"


def check_gpu():
    if not torch.cuda.is_available():
        print("ERROR: CUDA not available!")
        print(f"PyTorch version: {torch.__version__}")
        print("Install CUDA torch: py -3.12 -m pip install torch --index-url https://download.pytorch.org/whl/cu124")
        sys.exit(1)

    gpu = torch.cuda.get_device_name(0)
    vram = torch.cuda.get_device_properties(0).total_mem / 1e9
    print(f"GPU: {gpu} ({vram:.1f} GB VRAM)")
    return True


def load_training_data():
    if not TRAIN_FILE.exists():
        print(f"ERROR: {TRAIN_FILE} not found. Run generate_training.py first.")
        sys.exit(1)

    examples = []
    with open(TRAIN_FILE, encoding="utf-8") as f:
        for line in f:
            data = json.loads(line)
            msgs = data["messages"]
            text = (
                f"<|system|>\n{msgs[0]['content']}<|end|>\n"
                f"<|user|>\n{msgs[1]['content']}<|end|>\n"
                f"<|assistant|>\n{msgs[2]['content']}<|end|>"
            )
            examples.append({"text": text})

    print(f"Loaded {len(examples)} training examples")
    return Dataset.from_list(examples)


def train():
    print("=== SolStice Local Fine-Tuning (Windows) ===\n")
    check_gpu()

    # 4-bit quantization config (fits in 12GB VRAM)
    print(f"\nLoading {BASE_MODEL} in 4-bit...")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, trust_remote_code=True)
    tokenizer.pad_token = tokenizer.eos_token
    tokenizer.padding_side = "right"

    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL,
        quantization_config=bnb_config,
        device_map="auto",
        trust_remote_code=True,
        torch_dtype=torch.float16,
    )

    # Prepare for LoRA training
    model = prepare_model_for_kbit_training(model)

    # LoRA config — only train ~1-2% of parameters
    print("Adding LoRA adapters...")
    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        target_modules=["qkv_proj", "o_proj", "gate_up_proj", "down_proj"],
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
    )

    model = get_peft_model(model, lora_config)
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"Trainable: {trainable:,} / {total:,} ({100*trainable/total:.1f}%)")

    # Load data
    dataset = load_training_data()

    # Training
    print("\nStarting training...\n")
    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="text",
        max_seq_length=2048,
        args=TrainingArguments(
            output_dir=str(OUTPUT_DIR),
            per_device_train_batch_size=1,
            gradient_accumulation_steps=8,
            warmup_steps=10,
            num_train_epochs=3,
            learning_rate=2e-4,
            fp16=True,
            logging_steps=5,
            save_strategy="epoch",
            save_total_limit=2,
            seed=42,
            report_to="none",
        ),
    )

    stats = trainer.train()
    print(f"\nTraining complete! Loss: {stats.training_loss:.4f}")

    # Save
    print(f"Saving to {OUTPUT_DIR}/...")
    trainer.save_model(str(OUTPUT_DIR))
    tokenizer.save_pretrained(str(OUTPUT_DIR))

    print(f"\n=== DONE ===")
    print(f"Model saved to: {OUTPUT_DIR.absolute()}")
    print(f"\nNext step — export to GGUF:")
    print(f"  py -3.12 export_gguf.py")


if __name__ == "__main__":
    train()
