import { ChatOpenAI } from "@langchain/openai";
import { StateAnnotation } from "../blog-generation.state";
import { EditorStateSchema, Node } from "../schemas/node.schemas";
import { loadPromptHbs } from "../utils/load-prompt-hbs.util";
import path from "path";
import pRetry from "p-retry";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { Section } from "../schemas/outline.schemas";

function groupH2H3(sections: Section[]): Section[][] {
  console.info("[sections] grouping H2/H3 sections. Count:", sections.length);
  const grouped: Section[][] = [];
  let current: Section[] = [];
  for (const s of sections) {
    if (s.heading?.tag === "h2") {
      if (current.length) grouped.push(current);
      current = [s];
    } else if (s.heading?.tag === "h3" && current.length) {
      current.push(s);
    }
  }
  if (current.length) grouped.push(current);
  console.debug("[sections] grouped length:", grouped.length);
  return grouped;
}

async function writeSections(
  sections: Section[],
  state: typeof StateAnnotation.State,
): Promise<Node[]> {
  console.info("[writeSections] start. Sections:", sections.length);

  const llm = new ChatOpenAI({
    model: "gpt-5-nano",
    reasoning: { effort: "low" },
  }).withStructuredOutput(EditorStateSchema, { strict: true });

  const baseDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../prompts");
  const [editorStateSysPrompt, mainPrompt] = await Promise.all([
    loadPromptHbs("editor-state-system.prompt", undefined, { baseDir }),
    loadPromptHbs("sections.prompt", undefined, { baseDir }),
  ]);

  console.debug("[writeSections] prompts loaded:", {
    editorStateSysPromptLen: editorStateSysPrompt?.length ?? 0,
    mainPromptLen: mainPrompt?.length ?? 0,
  });

  const nodes: Node[] = [];
  let previousSection: Node[] | null = null;

  for (const s of sections) {
    console.info("[writeSections] generating section");
    const t0 = Date.now();
    const {
      root: { children },
    } = await pRetry(
      async () => {
        console.debug("[writeSections] invoking LLM");
        const res = await llm.invoke([
          {
            type: "system",
            content: [editorStateSysPrompt, mainPrompt].join("\n"),
          },
          {
            type: "human",
            content: JSON.stringify({
              metadata: state._metadata,
              section: s,
              previousSection,
            }),
          },
        ]);
        console.info("[writeSections] LLM completed in", Date.now() - t0, "ms");
        return res;
      },
      {
        retries: 3,
        minTimeout: 3000,
        maxTimeout: 5000,
        onFailedAttempt: (context) =>
          console.warn(
            `[writeSections] retry ${context.attemptNumber}/3 failed. Error: ${context.message}`,
          ),
      },
    );

    previousSection = children;
    nodes.push(...children);
    console.debug("[writeSections] section nodes appended:", children.length);
  }

  console.info("[writeSections] complete. Total nodes:", nodes.length);
  return nodes;
}

async function smoothContent(
  nodes: Node[],
  state: typeof StateAnnotation.State,
): Promise<Node[]> {
  console.info("[smoothContent] start. Input nodes:", nodes.length);

  const llm = new ChatOpenAI({
    model: "gpt-4.1-mini",
  }).withStructuredOutput(EditorStateSchema, { strict: true });

  const baseDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../prompts");
  const [editorStateSysPrompt, mainPrompt] = await Promise.all([
    loadPromptHbs("editor-state-system.prompt", undefined, { baseDir }),
    loadPromptHbs(
      "smooth-content.prompt",
      {
        minWords: state._metadata.blogLength.min,
        maxWords: state._metadata.blogLength.max,
      },
      { baseDir },
    ),
  ]);

  console.debug("[smoothContent] prompts loaded:", {
    editorStateSysPromptLen: editorStateSysPrompt?.length ?? 0,
    mainPromptLen: mainPrompt?.length ?? 0,
  });

  const t0 = Date.now();
  const {
    root: { children },
  } = await pRetry(
    async () => {
      console.debug("[smoothContent] invoking LLM");
      const res = await llm.invoke([
        {
          type: "system",
          content: [editorStateSysPrompt, mainPrompt].join("\n"),
        },
        {
          type: "human",
          content: JSON.stringify({
            metadata: state._metadata,
            nodes,
          }),
        },
      ]);
      console.info("[smoothContent] LLM completed in", Date.now() - t0, "ms");
      return res;
    },
    {
      retries: 3,
      minTimeout: 3000,
      maxTimeout: 5000,
      onFailedAttempt: (context) =>
        console.warn(
          `[smoothContent] retry ${context.attemptNumber}/3 failed. Error: ${context.message}`,
        ),
    },
  );

  console.info("[smoothContent] output nodes:", children.length);
  return children;
}

export async function sections(
  state: typeof StateAnnotation.State,
): Promise<Partial<typeof StateAnnotation.State>> {
  console.info("[sections] pipeline start");

  const Sections = state._outline.sections;
  console.debug("[sections] outline sections count:", Sections.length);

  const grouped = groupH2H3(Sections);

  const results = await Promise.all(
    grouped.map((group) => writeSections(group, state)),
  );

  const flatNodes = results.flat();
  console.info("[sections] flatNodes total:", flatNodes.length);

  const smoothNodes = await smoothContent(flatNodes, state);
  console.info("[sections] smoothNodes total:", smoothNodes.length);

  await fs.writeFile(
    "flat-nodes.json",
    JSON.stringify(flatNodes, null, 2),
    "utf-8",
  );
  console.debug("[sections] flat-nodes.json written");

  await fs.writeFile(
    "smooth-nodes.json",
    JSON.stringify(smoothNodes, null, 2),
    "utf-8",
  );
  console.debug("[sections] smooth-nodes.json written");

  console.info("[sections] pipeline success");
  return {
    _nodes: smoothNodes.slice(1)
  };
}
