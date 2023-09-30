import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from 'spiderwebai-components/react/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from 'spiderwebai-components/react/components/ui/form';
import { toast } from 'spiderwebai-components/react/components/ui/use-toast';
import { Input } from 'spiderwebai-components/react/components/ui/input';
import type { Dispatch, FC, PropsWithChildren, SetStateAction } from 'react';
import { supabase } from '@/lib/supabase';
import { session, type Website } from '@/stores/my';
import { useStore } from '@nanostores/react';
import { DialogFooter } from 'spiderwebai-components/react/components/ui/dialog';
import { Textarea } from 'spiderwebai-components/react/components/ui/textarea';

const FormSchema = z.object({
  title: z.string().min(5, 'Title must contain at least 5 character(s)'),
  body: z.string().min(15, 'Feedback must contain at least 15 character(s)'),
});

export const FeedbackEventsForm: FC<
  PropsWithChildren<{
    website?: Website;
    dialogFooter?: boolean;
    user_id?: string;
    setOpen?: Dispatch<SetStateAction<boolean>>;
    defaultTitle?: string;
    hideTitle?: boolean;
    limitIncrease?: boolean;
  }>
> = ({ children, website, dialogFooter, setOpen, defaultTitle, hideTitle, limitIncrease }) => {
  const $session = useStore(session);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: async () => {
      return {
        title: defaultTitle ?? '',
        body: '',
      };
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    toast({
      title: 'Feedback sent.',
      description:
        'Thank you for the feedback! It may take a couple days to get back to you depending on the response.',
    });

    const formData = {
      feature_request: data?.title,
      feature_body: data?.body,
      feature_type: 'general',
      user_id: $session?.user.id,
      email: $session?.user.email,
    };

    const builder = supabase.from('report_feature');

    if (website) {
      await builder
        .upsert(formData, { onConflict: 'user_id,feature_request' })
        .match({ user_id: $session?.user?.id });
    } else {
      try {
        // perfetch raw record matching
        const updateValue = await builder
          .update(formData)
          .eq('user_id', $session?.user.id)
          .select('*');
        // insert new
        if (!updateValue?.data?.length) {
          await builder.insert(formData);
        }
      } catch (e) {
        console.error(e);
      }
    }

    setOpen && setOpen(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem className={hideTitle ? 'hidden' : undefined}>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Tell us what you like, features, or anything else!"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {limitIncrease ? (
          <>
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Describe your reason for requesting more quota</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="I want a limit increase because...."
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Tell us in little details or a lot why you want an increase and up to how much.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        ) : (
          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Feedback</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="The feedback to give, good or bad."
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormDescription>
                  Leaving feedback can greatly help us improve our system and make the experience
                  better for everyone.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {children ? (
          children
        ) : dialogFooter ? (
          <>
            <DialogFooter>
              <Button type="submit">Send</Button>
            </DialogFooter>
          </>
        ) : (
          <Button type="submit">Submit</Button>
        )}
      </form>
    </Form>
  );
};
