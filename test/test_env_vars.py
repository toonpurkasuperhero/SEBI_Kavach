import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend import model_runner


def test_env_vars_present():
    """Ensure the model runner loads the expected environment variables."""
    assert isinstance(model_runner.GEMINI_API_KEY, str)
    assert isinstance(model_runner.HF_API_TOKEN, str)


def test_at_least_one_api_key_is_enabled():
    """Verify at least one external model API key is configured."""
    enabled = bool(model_runner.GEMINI_API_KEY) or bool(model_runner.HF_API_TOKEN)
    assert enabled, (
        "Neither GEMINI_API_KEY nor HF_API_TOKEN is configured. "
        "Set at least one in the environment before running full AI scans."
    )
