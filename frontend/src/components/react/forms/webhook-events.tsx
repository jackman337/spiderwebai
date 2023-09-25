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
import { Input } from '@/components/ui/input';
import type { Dispatch, FC, PropsWithChildren, SetStateAction } from 'react';
import { supabase } from '@/lib/supabase';
import { session, type Website } from '@/stores/my';
import { useStore } from '@nanostores/react';
import { DialogFooter } from '@/components/ui/dialog';
import { DialogClose } from '@radix-ui/react-dialog';
import { getWebhooks } from '@/lib/utils/get-webhooks';

const items = [
  {
    id: 'on_credits_depleted',
    label: 'Credits.Depleted',
  },
  //   {
  //     id: 'on_credits_half_depleted',
  //     label: 'Credits.Half_Depleted',
  //   },
  {
    id: 'on_find',
    label: 'Find',
  },
  {
    id: 'on_find_metadata',
    label: 'Find.MetaData',
  },
  {
    id: 'on_website_status',
    label: 'Website.Status',
  },
] as const;

const FormSchema = z.object({
  events: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: 'You have to select at least one item.',
  }),
  destination: z.string().url({ message: 'You need a valid webhook url destination.' }),
});

export const WebhookEventsForm: FC<
  PropsWithChildren<{
    website?: Website;
    dialogFooter?: boolean;
    user_id?: string;
    setOpen?: Dispatch<SetStateAction<boolean>>;
  }>
> = ({ children, website, dialogFooter, user_id, setOpen }) => {
  const $session = useStore(session);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: async () => {
      return await getWebhooks({ supabase, website, user_id: website?.user_id || user_id });
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    toast({
      title: 'You submitted the following values:',
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });

    const hookData = {
      destination: data?.destination,
      domain: website?.domain || null,
      user_id: $session?.user.id,
      on_credits_depleted: data.events.includes('on_credits_depleted'),
      on_credits_half_depleted: data.events.includes('on_credits_half_depleted'),
      on_find: data.events.includes('on_find'),
      on_find_metadata: data.events.includes('on_find_metadata'),
      on_website_status: data.events.includes('on_website_status'),
    };

    const builder = supabase.from('webhooks');

    if (website) {
      await builder
        .upsert(hookData, { onConflict: 'user_id,domain' })
        .match({ user_id: $session?.user?.id, domain: hookData.domain });
    } else {
      try {
        // perfetch raw record matching
        const updateValue = await builder
          .update(hookData)
          .eq('user_id', $session?.user.id)
          .is('domain', null)
          .select('*');
        // insert new
        if (!updateValue?.data?.length) {
          await builder.insert(hookData);
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (setOpen) {
      setOpen(false);
    }
    //   .match({ user_id: $session?.user?.id, domain: hookData.domain });
  };

  const onClearWebhook = async () => {
    const builder = supabase.from('webhooks');

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
          name="destination"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://mywebsite.com/webhooks"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>This is the webhook destination.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="events"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Events</FormLabel>
                <FormDescription>Select the events you want to listen to.</FormDescription>
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
                                : field.onChange(field.value?.filter((value) => value !== item.id));
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
              <FormDescription>All events are sent as POST request.</FormDescription>
            </FormItem>
          )}
        />
        {children ? (
          children
        ) : dialogFooter ? (
          <>
            <DialogFooter>
              {form.getValues()?.destination ? (
                <DialogClose asChild>
                  <Button type="button" variant={'ghost'} onClick={onClearWebhook}>
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
