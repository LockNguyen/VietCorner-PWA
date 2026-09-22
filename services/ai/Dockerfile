# VietCorner AI service as a container image.
#
# What it does:   Packages Python, the dependencies, the bge-m3 model and our code into one image that runs the
#                 same way on your PC, on a Hugging Face Space, and later on the Oracle VM.
# Concept:        An image is a stack of read-only LAYERS, one per instruction below. Docker caches each layer and
#                 reuses it until that instruction or the files it copies change. A change invalidates that layer
#                 and every layer after it. So instructions are ordered from "changes almost never" (Python,
#                 torch, the model) to "changes all the time" (our code).
# Why this file lives here and not in deploy/: Hugging Face Spaces only look for a Dockerfile at the repo root,
#                 and .dockerignore only works at the root of the build context. Both are services/ai.
# Build:          docker build -t vietcorner-ai services/ai
# Run:            docker run --rm -p 8000:8000 --env-file services/ai/.env vietcorner-ai

# Start from Debian slim with Python 3.12 preinstalled (the same Python as your venv). "slim" drops compilers and
# docs: every wheel we use ships prebuilt for Linux, so nothing needs compiling.
FROM python:3.12-slim

# PYTHONDONTWRITEBYTECODE: don't write .pyc files into the image (the image is read-only in spirit).
# PYTHONUNBUFFERED: print logs immediately, so `docker logs` and the Space's log tab show them live.
# PIP_NO_CACHE_DIR: pip's download cache is useless inside an image and would add hundreds of MB.
# HF_HOME: where Hugging Face stores downloaded models. A fixed path so the model we bake in below is found at run time.
# DISABLE_SAFETENSORS_CONVERSION: bge-m3 publishes only pytorch_model.bin. When transformers sees that, it starts a
#   background download of a converted model.safetensors "for next time": a second 2.2 GB copy of the same weights.
#   Offline (at run time) it can't use that copy anyway, so it was pure dead weight. This switch turns it off.
#   Why we don't switch to .safetensors instead: see architecture.md, Key Decisions ("Load bge-m3 from its official .bin").
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/models \
    DISABLE_SAFETENSORS_CONVERSION=1

# Every later relative path (COPY, CMD) is relative to /app.
WORKDIR /app

# --- Layer 1: PyTorch, CPU build ------------------------------------------------------------------------
# Plain `pip install torch` on Linux pulls the CUDA build (~3 GB of GPU libraries a free CPU host can't use).
# The CPU index serves a ~200 MB build instead. Installing it first means sentence-transformers (next layer)
# finds torch already satisfied and does not fetch the CUDA one.
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu

# --- Layer 2: the other dependencies --------------------------------------------------------------------
# Copy ONLY requirements.txt, not the whole folder. This layer is then rebuilt only when requirements.txt
# changes, not when you edit a .py file. This is the most important caching trick in any Dockerfile.
COPY requirements.txt .
RUN pip install -r requirements.txt

# --- Layer 3: the embedding model, baked into the image -------------------------------------------------
# Downloading bge-m3 (~2.3 GB) here, at BUILD time, means a container starts with the model already on disk.
# Downloading at run time instead would repeat the download on every cold start (every Space wake-up).
# ARG = a build-time variable; ENV makes the same value visible to config.py at run time, so the model we
# downloaded and the model the code loads can never differ.
ARG EMBEDDING_MODEL=BAAI/bge-m3
ENV EMBEDDING_MODEL=${EMBEDDING_MODEL}
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('${EMBEDDING_MODEL}')"

# From here on, forbid Hugging Face downloads. If the code ever asks for a model that isn't baked in,
# it fails loudly at startup instead of silently downloading 2 GB on a production box.
ENV HF_HUB_OFFLINE=1

# --- Layer 4: our code (changes most often, so it comes last) --------------------------------------------
# Run as an unprivileged user, not root: if the app is ever compromised, the attacker is not root in the
# container. Hugging Face Spaces run containers as user id 1000, so we create exactly that user.
RUN useradd --create-home --uid 1000 app
# .dockerignore decides what "." means here: secrets (.env), private PDFs (data/) and the Windows venv stay out.
COPY --chown=app . .
USER app

# Documentation only: tells readers (and Hugging Face, via app_port in README.md) which port the app listens on.
EXPOSE 8000

# The process the container runs. Exec form (a JSON list) makes uvicorn PID 1, so it receives Ctrl+C / stop
# signals directly and shuts down cleanly. --host 0.0.0.0: listen on every interface, because inside a
# container 127.0.0.1 is unreachable from outside. One worker: each worker loads its own 2.3 GB model copy.
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
