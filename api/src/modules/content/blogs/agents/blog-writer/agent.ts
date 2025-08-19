import { Injectable } from "@nestjs/common";
import { NodePayload } from "./schemas/node";
import { graph } from "./workflow";

export interface BlogPayload {
  title: string;
  brandVoice?: string | null;
  blogginKeyword: string;
  businessKeyword: string;
}

@Injectable()
export class BlogWriterAgent {
  async run(payload: BlogPayload): Promise<{
    nodes: NodePayload[];
    image: { url: string; altText: string };
    metadata: { description: string };
  }> {
    const controller = new AbortController();

    try {
      const result = await graph.invoke(
        {
          _payload: payload,
        },
        { configurable: { thread_id: "blog-123" } },
      );

      if (!result) {
        throw new Error("No result returned from graph.invoke");
      }

      const { _image, _nodes, _outline } = result;

      return {
        nodes: _nodes,
        image: {
          url: _image,
          altText: _outline.thumbnail.altText,
        },
        metadata: {
          description: _outline.description,
        },
      };
    } catch (error) {
      throw new Error(
        `BlogWriterAgent failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      controller.abort();
    }
  }
}
