import { lazy, Suspense } from 'react';
import type { Message } from 'ai';
import { Separator } from '@/components/ui/separator';

const ChatMessage = lazy(() => import('./chat-message'));

export interface ChatList {
  messages: Message[];
}

export function ChatList({ messages }: ChatList) {
  if (!messages.length) {
    return null;
  }

  return (
    <ul className="relative">
      {messages.map((message, index) => (
        <li key={index}>
          <Suspense fallback={<div>Loading...</div>}>
            <ChatMessage message={message} />
          </Suspense>
          {index < messages.length - 1 && <Separator className="my-4 md:my-8" />}
        </li>
      ))}
    </ul>
  );
}
