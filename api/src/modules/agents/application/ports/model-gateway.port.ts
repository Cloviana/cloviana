export abstract class ModelGateway {
  abstract forward(
    runId: string,
    bearerToken: string,
    body: unknown,
    signal: AbortSignal,
  ): Promise<{ contentType: string; body: ReadableStream<Uint8Array> }>;
}
