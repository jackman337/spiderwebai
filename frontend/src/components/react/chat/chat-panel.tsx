import type { UseChatHelpers } from 'ai/react';

import { Button } from 'spiderwebai-components/react/components/ui/button';
import { PromptForm } from '@/components/react/chat/prompt-form';
import { ButtonScrollToBottom } from '@/components/react/chat/button-scroll-to-bottom';
import { IconRefresh, IconStop } from 'spiderwebai-components/react/components/ui/icons';
import { FooterText } from '@/components/react/chat/footer';
// import { TokensUsage } from './Tokens';
import { ArchiveIcon } from 'lucide-react';

export interface ChatPanelProps
  extends Pick<
    UseChatHelpers,
    'append' | 'isLoading' | 'reload' | 'messages' | 'stop' | 'input' | 'setInput' | 'setMessages'
  > {
  id?: string;
}

export function ChatPanel({
  id,
  isLoading,
  stop,
  append,
  reload,
  input,
  setInput,
  messages,
  domain,
  setMessages,
}: ChatPanelProps & { domain?: string }) {
  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-b from-muted/10 from-10% to-muted/30 to-50% z-20">
      <ButtonScrollToBottom />
      <div className="mx-auto sm:max-w-2xl sm:px-4">
        <div
          className={`flex h-10 gap-1 items-center justify-center ${
            messages?.length || isLoading ? 'visible' : 'hidden'
          }`}
        >
          {isLoading ? (
            <Button variant="outline" onClick={() => stop()} className="bg-background">
              <IconStop className="mr-2" />
              Stop generating
            </Button>
          ) : (
            messages?.length > 0 && (
              <>
                <Button variant="outline" onClick={() => setMessages([])} className="bg-background">
                  <ArchiveIcon className="mr-2" />
                  Clear Chat
                </Button>
                <Button variant="outline" onClick={() => reload()} className="bg-background">
                  <IconRefresh className="mr-2" />
                  Regenerate response
                </Button>
              </>
            )
          )}
        </div>

        <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:rounded-t-xl sm:border md:py-4">
          <PromptForm
            onSubmit={async (value: any) => {
              await append({
                id,
                content: value,
                role: 'user',
              });
            }}
            input={input}
            setInput={setInput}
            isLoading={isLoading}
          />
          <div className="space-y-1">
            <FooterText className="hidden sm:block" domain={domain} />
            {/* <TokensUsage chat={messages} text={input} /> */}
          </div>
        </div>
      </div>
    </div>
  );
}
