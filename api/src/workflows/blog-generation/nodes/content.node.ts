import { StateAnnotation } from "@/workflows/blog-generation/blog-generation.state";
import { loadPrompt } from "@/workflows/blog-generation/utils/load-prompt.util";
import { markdownToEditorState } from "@/workflows/blog-generation/utils/markdown-to-editor-state";
import { ClaudeClient } from "@/clients/claude/claude.client";

export async function content(
  state: typeof StateAnnotation.State
): Promise<Partial<typeof StateAnnotation.State>> {
  const claude = new ClaudeClient();

  const payload = {
    context: state._context,
    outline: {
      title: state._outline.title,
      sections: [
        { type: "introduction", heading: null, ...state._outline.introduction },
        ...state._outline.sections.map((s) => ({ type: "section", ...s })),
        { type: "conclusion", ...state._outline.conclusion },
      ],
    },
  };

  const systemPrompt = loadPrompt("content.md");

  const markdown = await claude.chat({
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: JSON.stringify(payload, null, 2),
      },
    ],
    reasoningEffort: "medium",
  });

  const editorState = markdownToEditorState(markdown);

  return {
    _nodes: editorState.root.children,
  };
}
