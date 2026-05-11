"""
AviLearn — AI model configuration.
All model names MUST be referenced from this file. Never hardcode model strings.
"""
import os

# Primary AI model (OpenAI)
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.5")

# Gemini model (Google)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")

# Agent cluster models
AGENT_SUPERVISOR_MODEL = OPENAI_MODEL
AGENT_RESEARCHER_MODEL = OPENAI_MODEL
AGENT_SIM_DESIGNER_MODEL = OPENAI_MODEL
AGENT_VERIFIER_MODEL = OPENAI_MODEL
