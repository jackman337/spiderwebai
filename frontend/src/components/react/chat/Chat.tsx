import { type FC, Fragment, useState, useCallback } from 'react';
import type { Message } from 'ai';
import type { Website } from '@/stores/my';
import { useChat } from 'ai/react';
import { Button } from 'spiderwebai-components/react/components/ui/button';
import { onErrorEvent } from '../Errors';
import { ChatCompletions } from './Completions';
import { ArchiveIcon } from 'lucide-react';
import { Skeleton } from 'spiderwebai-components/react/components/ui/skeleton';
import { ChatList } from './chat-list';
import { ChatScrollAnchor } from './chat-scroll-anchor';
import { ChatPanel } from './chat-panel';

interface ChatProps {
  hideHeader?: boolean;
  website?: Website;
  initialInput?: string;
}

const Chat: FC<ChatProps> = ({ hideHeader, initialInput, website }) => {
  const [messageSentIndex, setMessageIndex] = useState<number>(0);

  const onFinishEvent = useCallback(() => {
    setMessageIndex((x) => x + 2);
  }, [setMessageIndex]);

  const chatProps = useChat({
    api: '/api/chat',
    initialInput,
    body: website
      ? {
          url: website.domain,
        }
      : undefined,
    onError: onErrorEvent,
    onFinish: onFinishEvent,
  });

  const { messages, handleSubmit, isLoading, setMessages, append } = chatProps;

  const onSubmitEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
    onFinishEvent();
  };

  const onSetMessage = useCallback(
    (message: Message[]) => {
      setMessages([...messages, ...message]);
    },
    [setMessages, messages]
  );

  const onClearMessagesEvent = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  return (
    <div className={hideHeader ? undefined : 'mx-auto max-w-xl'}>
      <ChatCompletions
        website={website}
        onSubmit={onSubmitEvent}
        setMessages={onSetMessage}
        append={append}
      />

      {hideHeader ? null : (
        <Fragment>
          <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-5xl text-center capitalize">
            Chat with your data
          </h1>
          <p className="leading-7 [&:not(:first-child)]:mt-6 text-center">
            Ask detailed questions about your websites.
          </p>
        </Fragment>
      )}

      <div
        className={`py-4 px-1 space-y-2 w-full max-w-2xl ${
          messages?.length ? 'py-12' : 'hidden'
        } overflow-hidden`}
      >
        <ChatList messages={messages} />
        <ChatScrollAnchor trackVisibility={isLoading} />
        {isLoading && messages.length < messageSentIndex ? (
          <div className="space-y-2">
            <Skeleton className={`w-[49px] h-[22px] rounded-full`} />
            <Skeleton className={`w-[200px] h-[30px]`} />
          </div>
        ) : null}
      </div>

      <div className="flex gap-3 place-content-between w-full place-items-center relative">
        {messages.length ? (
          <Button
            type="button"
            onClick={onClearMessagesEvent}
            variant={'ghost'}
            size={'icon'}
            className="absolute right-3 -bottom-0.5"
          >
            <>
              <ArchiveIcon size={'16px'} />
              <span className="sr-only">Archive Messages</span>
            </>
          </Button>
        ) : null}
      </div>

      <ChatPanel {...chatProps} domain={website?.domain} />
    </div>
  );
};

export default Chat;
