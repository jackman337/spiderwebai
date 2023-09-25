import { cn } from '@/lib/utils';
// import { ExternalLink } from '@/components/react/chat/external-link';

type FooterProps = {
  domain?: string; // the target url
};

export function FooterText({
  className,
  domain,
  ...props
}: React.ComponentProps<'p'> & FooterProps) {
  return (
    <p
      className={cn('px-2 text-center text-xs leading-normal text-muted-foreground', className)}
      {...props}
    >
      Ask any question about {domain ?? 'your data'}.
    </p>
  );
}
