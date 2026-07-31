# syntax=docker/dockerfile:1
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FASTEMBED_CACHE_PATH=/models

ARG SPARSE_EMBEDDING_MODEL=Qdrant/bm25
ENV SPARSE_EMBEDDING_MODEL=${SPARSE_EMBEDDING_MODEL}

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.9.17 /uv /uvx /usr/local/bin/

COPY pyproject.toml README.md ./
COPY src /app/src

RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install --system .

# Download models as the runtime user so /models stays writable for runtime
# lockfiles without a layer-doubling chown -R afterwards.
RUN mkdir -p /models && chown 10001:10001 /models
USER 10001

RUN python -c "import os; from fastembed import SparseTextEmbedding; SparseTextEmbedding(model_name=os.environ['SPARSE_EMBEDDING_MODEL'], cache_dir=os.environ['FASTEMBED_CACHE_PATH'])"

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/health', timeout=2)"]

CMD ["uvicorn", "knowledge_base.main:app", "--host", "0.0.0.0", "--port", "8080"]
