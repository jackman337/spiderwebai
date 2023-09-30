import {
  type SetStateAction,
  type Dispatch,
  useCallback,
  useEffect,
  useState,
  useMemo,
  useRef,
} from 'react';
import { type UseChatHelpers, useChat } from 'ai/react';
import { onErrorEvent } from '../Errors';
import type { Website } from '@/stores/my';
import type { Message } from 'ai';
import { Skeleton } from 'spiderwebai-components/react/components/ui/skeleton';
import { Button } from 'spiderwebai-components/react/components/ui/button';

export type QA = { q: string; a: string; id?: string; disabled?: boolean };

const skeletonCount = new Array(5).fill(0);
const PUMP_FRAME = 30;

export const ChatComplete = ({
  message,
  setMessages,
  append,
  setQuestionsAndAnswers,
}: {
  message: QA;
  setMessages: UseChatHelpers['setMessages'];
  append: UseChatHelpers['append'];
  setQuestionsAndAnswers: Dispatch<SetStateAction<QA[]>>;
}) => {
  const onQuestionAnswerEvent = async () => {
    let target = '';

    // perform chatGPC question prompt
    if (typeof message === 'string') {
      try {
        await append({ role: 'user', content: message });
      } catch (e) {
        console.error(e);
      }
      target = message;
    } else {
      target = message.q;
      setMessages([
        {
          role: 'user',
          content: message.q,
          id: `q-${message.q?.replaceAll(' ', '')}`,
        },
        {
          role: 'system',
          content: message.a,
          id: `a-${message.a?.replaceAll(' ', '')}`,
        },
      ]);
    }

    setQuestionsAndAnswers((prev) =>
      prev.map((item) =>
        item.q !== target
          ? item
          : {
              ...item,
              disabled: true,
            }
      )
    );
  };

  return (
    <Button
      type={'button'}
      onClick={onQuestionAnswerEvent}
      size={'sm'}
      className={`py-2 text-left h-auto${message?.disabled ? ' hidden' : ''}`}
    >
      {typeof message === 'string' ? message : message?.q}
    </Button>
  );
};

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export const ChatCompletions = ({
  website,
  setMessages,
  append,
}: {
  website?: Website;
  onSubmit: UseChatHelpers['handleSubmit'];
  setMessages: UseChatHelpers['setMessages'];
  append: UseChatHelpers['append'];
}) => {
  // TODO: map to object KEYS
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState<QA[]>([]);
  const completed = useRef<boolean>(false);

  const onFinishEvent = useCallback(
    (e: Partial<Message>) => {
      let parsedOneValid = false;

      if (e.content) {
        const q: string =
          typeof e.content === 'string'
            ? e.content
            : typeof e.content === 'object' && 'question' in e.content
            ? (e.content as any)?.question
            : '';

        const lines = q.split('\n');

        // prevent iteration if line is too small.
        for (const line of lines) {
          // valid json line to parse data
          if (line.startsWith('{') && line.endsWith('}')) {
            try {
              const obj = JSON.parse(line);
              parsedOneValid = true;
              setQuestionsAndAnswers((prev) => {
                if (prev.some((item) => item.q === obj.q)) {
                  return prev.map((item) =>
                    item.q !== q
                      ? item
                      : {
                          ...item,
                          disabled: true,
                        }
                  );
                } else {
                  return [...prev, obj];
                }
              });
            } catch (e) {
              console.error(e);
            }
          }
        }
      }

      return parsedOneValid;
      // todo: allow single retry if chat fails to provide questions
    },
    [setQuestionsAndAnswers]
  );

  const onCompleteEvent = useCallback(
    async (e: Partial<Message>) => {
      const valid = onFinishEvent(e);

      if (!valid && !completed.current) {
        completed.current = true;
        try {
          await appendCompletion({ role: 'user', content: 'next' });
        } catch (e) {
          console.error(e);
        }
      }
    },
    [onFinishEvent, questionsAndAnswers, completed]
  );

  const {
    isLoading,
    append: appendCompletion,
    messages,
  } = useChat({
    api: '/api/completion',
    body: website
      ? {
          url: website.domain,
        }
      : undefined,
    onError: onErrorEvent,
    onFinish: onCompleteEvent,
  });

  useEffect(() => {
    appendCompletion({ role: 'user', content: '' }).catch((e) => {
      console.error(e);
    });
  }, []);

  useEffect(() => {
    // determine the pump freq for streams and average it for pumping
    if (messages && messages.length >= 2) {
      const time = setTimeout(async () => {
        await delay(PUMP_FRAME);
        onFinishEvent({ content: messages[messages.length - 1].content });
      }, PUMP_FRAME);

      return () => {
        clearTimeout(time);
      };
    }
  }, [messages, onFinishEvent]);

  const validQAList = useMemo(
    () =>
      Array.isArray(questionsAndAnswers) &&
      questionsAndAnswers.length &&
      questionsAndAnswers.some((items) => !items.disabled),
    [questionsAndAnswers]
  );

  return (
    <>
      {isLoading ? (
        <div className="flex gap-1 overflow-x-auto flex-wrap py-2">
          {skeletonCount.map((_, i) =>
            i > skeletonCount.length - questionsAndAnswers.length ? null : (
              <Skeleton
                key={`loader-${i}`}
                className={`p-1 ${i === 0 ? 'w-1/6' : i % 2 ? 'w-2/6' : 'w-2/6'} h-[30px]`}
              />
            )
          )}
        </div>
      ) : null}

      {validQAList ? (
        <ul className="flex gap-1 overflow-x-auto flex-wrap py-2">
          {questionsAndAnswers?.map((message, i) => (
            <ChatComplete
              key={`chat-qa-${i}`}
              message={message}
              setMessages={setMessages}
              append={append}
              setQuestionsAndAnswers={setQuestionsAndAnswers}
            />
          ))}
        </ul>
      ) : null}
    </>
  );
};
