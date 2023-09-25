import { useMemo, type FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import type { WebPage } from '@/stores/my';
import { Button } from '@/components/ui/button';
import { ChevronDown, ClipboardCopyIcon, DownloadCloudIcon, LoaderIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogClose } from '@radix-ui/react-dialog';
import { differenceInSeconds } from 'date-fns';
import { add } from 'date-fns';

export const Page = ({ page }: { page: WebPage }) => {
  const { toast } = useToast();

  const prettyUrl = useMemo(() => {
    const urlSlashes = page.url.split('/');

    return urlSlashes[2];
  }, [page.url]);

  const onCreateSignedUrl = async (
    duration: number = 60,
    options?: { download?: string | boolean; transform?: any }
  ) => {
    const { data, error } = await supabase.storage
      .from('resource')
      .createSignedUrl(page.url, duration, options);

    if (data && data.signedUrl) {
      await navigator.clipboard.writeText(data.signedUrl);
      toast({
        title: 'Copied url to clipboard',
        description: `${data.signedUrl.substring(0, 125)}...`,
      });
    }

    if (error) {
      console.error(error);
    }

    return {
      data,
      error,
    };
  };

  const onGetsignedDurationLinkEvent = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { duration } = Object.fromEntries(formData);

    await onCreateSignedUrl(Number(duration));
  };

  const onGenerateOneWeek = async () => {
    const cu = new Date();
    const result = add(cu, {
      weeks: 1,
    });
    await onCreateSignedUrl(differenceInSeconds(result, cu));
  };

  const onGenerateOneMonth = async () => {
    const cu = new Date();
    const result = add(cu, {
      months: 1,
    });
    await onCreateSignedUrl(differenceInSeconds(result, cu));
  };
  const onGenerateOneYear = async () => {
    const cu = new Date();
    const result = add(cu, {
      years: 1,
    });
    await onCreateSignedUrl(differenceInSeconds(result, cu));
  };

  const onDownloadEvent = async () => {
    const { data, error } = await supabase.storage.from('resource').download(page.url);

    const downloadName = page.url.split('/')[2];

    if (data) {
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.setAttribute('class', 'hidden');

      const url = window.URL.createObjectURL(data);
      a.href = url;
      a.download = downloadName;
      a.click();
      window.URL.revokeObjectURL(url);

      a.remove();
    }

    toast(
      error
        ? {
            title: error.name,
            description: error.message,
          }
        : {
            title: `Downloading ${downloadName}`,
            description: `File size ${data.size}kb`,
          }
    );
  };

  const urlCleanPath = prettyUrl.replaceAll('*_*', '/');
  const baseIndex = urlCleanPath.endsWith('index.html') ? '' : urlCleanPath;

  return (
    <li className="py-1.5 pr-2 gap-2 place-content-between flex flex-col md:flex md:flex-wrap md:flex-row md:place-items-center border-t">
      <a
        href={`https://${page.domain}${page.domain.endsWith('/') ? '' : '/'}${baseIndex.replace(
          '.html',
          ''
        )}`}
        className="text-base hover:underline hover:text-blue-500 scroll-m-20 tracking-tight truncate max-w-[19.5rem] block"
        target="_blank"
        rel="noopener noreferrer"
      >
        {page.pathname === '/'
          ? urlCleanPath.startsWith('/')
            ? `*/`
            : page.pathname
          : page.pathname}
      </a>

      <div className="gap-2 flex">
        <Button
          type={'button'}
          onClick={onDownloadEvent}
          variant={'secondary'}
          size={'sm'}
          className="gap-2 text-xs"
        >
          <>
            <DownloadCloudIcon size={14} />
            <span>Download</span>
          </>
        </Button>

        <Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type={'button'} variant={'outline'} size={'sm'} className="gap-2 text-xs">
                <>
                  <ClipboardCopyIcon size={14} />
                  <span>Get URL</span>
                  <ChevronDown size={14} />
                </>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onGenerateOneWeek}>Expire in 1 week</DropdownMenuItem>
              <DropdownMenuItem onClick={onGenerateOneMonth}>Expire in 1 month</DropdownMenuItem>
              <DropdownMenuItem onClick={onGenerateOneYear}>Expire in 1 Year</DropdownMenuItem>
              <DropdownMenuItem>
                <DialogTrigger asChild>
                  <span>Custom expiry</span>
                </DialogTrigger>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Custom expiry for signed URL</DialogTitle>
            </DialogHeader>
            <form onSubmit={onGetsignedDurationLinkEvent} noValidate>
              <div className="grid gap-4 py-4">
                <div className="grid gap-4">
                  <Label htmlFor="duration" className="text-right block">
                    Enter the duration for which the URL will be valid:
                  </Label>
                  <Input
                    id="duration"
                    name="duration"
                    className="block"
                    placeholder="seconds"
                    type="number"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose>
                  <Button type="button" variant={'secondary'}>
                    Cancel
                  </Button>
                </DialogClose>
                <DialogClose>
                  <Button type="submit">Get Signed URL</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </li>
  );
};
