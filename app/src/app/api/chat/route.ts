import { NextResponse } from 'next/server';

type MessagePart = {
  type?: string;
  text?: string;
};

type ChatMessage = {
  role?: string;
  content?: MessagePart[];
};

type ChatRequestBody = {
  chatId?: string;
  messages?: ChatMessage[];
};

function getLastUserMessage(messages: ChatMessage[] = []) {
  const lastUserMessage = messages.findLast(
    (message) => message.role === 'user',
  );

  return (
    lastUserMessage?.content
      ?.filter((part) => part.type === 'text')
      .map((part) => part.text)
      .join('\n')
      .trim() || 'your message'
  );
}

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequestBody;
  const message = getLastUserMessage(body.messages);

  return NextResponse.json({
    content: [
      {
        type: 'text',
        text: `Mock response${body.chatId ? ` for chat ${body.chatId}` : ''}: I received "${message}".`,
      },
    ],
  });
}
