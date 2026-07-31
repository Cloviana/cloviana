# Cloviana Agent

Cloviana is a headless FastAPI agent for B2B workloads. Every request is scoped
to a validated `businessId`; session history, files, and tenant skills remain
under that business's storage root.

## Run

```bash
docker build -t cloviana-agent .
docker run --rm -p 8000:8000 \
  -e OPENAI_API_KEY \
  -e KNOWLEDGE_BASE_URL=http://host.docker.internal:8080 \
  -v cloviana-data:/data \
  cloviana-agent
```

```bash
curl http://localhost:8000/health
curl -X POST http://localhost:8000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"businessId":"acme","sessionId":"demo","message":"What do we know about our ICP?"}'
```

Supported providers are `openai`, `deepseek`, `groq`, `openrouter`, and any
OpenAI-compatible endpoint supplied with both `baseUrl` and `apiKey`.

`businessId` is a storage-routing identifier, not authentication. Keep this
service behind your authenticated B2B API and derive `businessId` from that
trusted identity rather than accepting it directly from an end user.

## Test

```bash
python -m unittest discover -s tests -v
```
