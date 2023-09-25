import { CalendarDays, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

export const GithubLink = ({ stars }: { stars: number }) => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a
          className="text-gray-600 dark:text-gray-300 hover:text-blue-500 hover:underline"
          href="https://github.com/spider-rs"
          target="_blank"
          rel="noreferrer"
        >
          <span className="flex gap-1 place-items-center">
            <span>Github</span>
            {stars ? (
              <>
                <Star className="inline sr-only md:not-sr-only" size={'14px'} />
                <span className="sr-only md:not-sr-only">{stars}</span>
              </>
            ) : null}
          </span>
        </a>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src="https://github.com/spider-rs.png" />
            <AvatarFallback>SR</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <a
              className="text-sm font-semibold hover:text-blue-300"
              href="https://github.com/spider-rs"
              target="_blank"
              rel="noreferrer"
            >
              @spider-rs
            </a>
            <p className="text-sm">The fastest web crawler and indexer by @spider-rs.</p>
            <div className="flex items-center pt-2">
              <CalendarDays className="mr-2 h-4 w-4 opacity-70" />{' '}
              <span className="text-xs text-muted-foreground">Joined March 2022</span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
