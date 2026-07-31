# Cloviana Knowledge Base

Internal FastAPI service for document ingestion and RAG retrieval.

PDF and DOCX parsing is handled by Unstructured Transform's local-file job API.
Markdown and TXT are decoded locally. Documents are split into section-aware
chunks, then each document's chunks are submitted together to Voyage Context 4
for contextual dense embeddings. Local BM25 sparse embeddings and Voyage dense
embeddings are stored in Qdrant for hybrid retrieval, with optional Cohere
reranking through OpenRouter.

## Configuration

Required:

- `UNSTRUCTURED_API_KEY`
- `VOYAGE_API_KEY`

See `.env.example` for provider URLs, model settings, retrieval tuning, and
ingestion limits.

The default `QDRANT_COLLECTION_PREFIX=kb_voyage_context_4` deliberately creates
a new index namespace. Existing BGE vectors are incompatible with Voyage's
vectors, so existing documents must be re-ingested after this migration.

## Storage model

Each business has one Qdrant collection named
`{QDRANT_COLLECTION_PREFIX}_{businessId}`. Folder names are metadata, not
collection names. Deterministic point IDs make ingestion idempotent; uploading
an existing `documentId` replaces its points and removes stale chunks.

Every point contains named `dense` and `sparse` vectors plus its document,
business, folder, filename, chunk, section, and available OKF metadata.

## API

### Upload a document

```bash
curl -X POST http://localhost:8080/documents \
  -F "file=@knowledge.pdf" \
  -F "documentId=2fd470c7-8f55-4bce-8969-8105e8b40380" \
  -F "businessId=cm123business" \
  -F "folderId=58e8d67c-a3e9-4f42-9802-f4ce1cb89f52" \
  -F "folderName=Customer Research"
```

### Search

```bash
curl -X POST http://localhost:8080/search \
  -H "Content-Type: application/json" \
  -d '{
    "businessId":"cm123business",
    "query":"Who is our ideal customer?",
    "folderIds":["58e8d67c-a3e9-4f42-9802-f4ce1cb89f52"],
    "limit":5
  }'
```
