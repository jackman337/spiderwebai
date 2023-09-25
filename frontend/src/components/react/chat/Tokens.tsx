import { useEffect, useMemo } from 'react';
import { moneyFormater } from '@/lib/utils/format-money';
import type { Message } from 'ai';
import type { ChatMessage } from 'gpt-tokenizer/esm/GptEncoding';

let tokenizer: any;

export const TokensUsage = ({ chat, text }: { chat: Message[]; text: string }) => {
  useEffect(() => {
    if (!tokenizer) {
      (async () => {
        tokenizer = (await import('gpt-tokenizer')).default;
      })();
    }
  }, []);

  const encodedTokens = tokenizer?.encode(text);
  const chatTokens = tokenizer?.encodeChat(chat as ChatMessage[], 'gpt-3.5-turbo');

  const decodedTokens = useMemo(() => {
    const tokens = [];
    if (tokenizer) {
      for (const token of tokenizer?.decodeGenerator(encodedTokens)) {
        tokens.push(token);
      }
    }
    return tokens;
  }, [encodedTokens]);

  const decodedChatTokens = useMemo(() => {
    const tokens = [];

    if (tokenizer) {
      for (const token of tokenizer?.decodeGenerator(
        chatTokens.length === 3 ? chatTokens.filter((_: any, i: number) => i > 3) : chatTokens
      )) {
        tokens.push(token);
      }
    }
    return tokens;
  }, [chatTokens]);

  const tokenTotal = decodedTokens.length + decodedChatTokens.length;

  const numberFormatter = useMemo(
    () =>
      moneyFormater('en', {
        minimumFractionDigits: 3,
        style: 'currency',
        currency: 'USD',
      }),
    []
  );

  const maxNumber = tokenTotal ? Math.max(Math.round(tokenTotal) / 10, 1) : 0;

  return (
    <div className="text-gray-600 dark:text-gray-300 text-xs text-center">
      Tokens: {tokenTotal} ({numberFormatter.format(maxNumber / 2000)})
    </div>
  );
};
