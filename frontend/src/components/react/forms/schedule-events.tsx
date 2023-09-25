import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from '@/components/ui/use-toast';
import type { Dispatch, FC, PropsWithChildren, SetStateAction } from 'react';
import { supabase } from '@/lib/supabase';
import { session, type Website } from '@/stores/my';
import { useStore } from '@nanostores/react';
import { DialogFooter } from '@/components/ui/dialog';
import { DialogClose } from '@radix-ui/react-dialog';
import { getCrons } from '@/lib/utils/get-crons';

const items = [
  {
    id: 'daily',
    label: 'Daily',
  },
  {
    id: 'weekly',
    label: 'Weekly',
  },
  {
    id: 'monthly',
    label: 'Monthly',
  },
] as const;

const FormSchema = z.object({
  events: z.array(z.string()).refine((value) => value.length === 1, {
    message: 'You have to select one item.',
  }),
});

export const ScheduleEventsForm: FC<
  PropsWithChildren<{
    website?: Website;
    dialogFooter?: boolean;
    setOpen?: Dispatch<SetStateAction<boolean>>;
  }>
> = ({ children, website, dialogFooter, setOpen }) => {
  const $session = useStore(session);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: async () => {
      return await getCrons({ supabase, website, user_id: website?.user_id });
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    toast({
      title: 'Frequency Update',
      description: `${website?.domain || 'All websites'} set to crawl ${data.events[0]}`,
    });

    const cronData = {
      domain: website?.domain || null,
      user_id: $session?.user.id,
      cron_frequency: data.events[0],
    };

    const builder = supabase.from('crons');

    if (website) {
      await builder
        .upsert(cronData, { onConflict: 'user_id,domain' })
        .match({ user_id: $session?.user?.id, domain: cronData.domain });
    } else {
      try {
        // perfetch raw record matching
        const updateValue = await builder
          .update(cronData)
          .eq('user_id', $session?.user.id)
          .is('domain', null)
          .select('*');
        // insert new
        if (!updateValue?.data?.length) {
          await builder.insert(cronData);
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (setOpen) {
      setOpen(false);
    }
  };

  const onClearSchedule = async () => {
    const builder = supabase.from('crons');

    if (website) {
      await builder.delete().match({ user_id: $session?.user?.id, domain: website.domain });
    } else {
      try {
        // perfetch raw record matching
        await builder
          .delete()
          .eq('user_id', $session?.user.id)
          .is('domain', null)
          .select('*');
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="events"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Frequency</FormLabel>
                <FormDescription>Set the frequency of how often.</FormDescription>
              </div>
              {items.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="events"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                    field?.value?.filter((value) => value !== item.id)
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal">{item.label}</FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        {children ? (
          children
        ) : dialogFooter ? (
          <>
            <DialogFooter>
              {form.getValues()?.events?.length ? (
                <DialogClose asChild>
                  <Button type="button" variant={'ghost'} onClick={onClearSchedule}>
                    Remove
                  </Button>
                </DialogClose>
              ) : null}
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </>
        ) : (
          <Button type="submit">Submit</Button>
        )}
      </form>
    </Form>
  );
};
