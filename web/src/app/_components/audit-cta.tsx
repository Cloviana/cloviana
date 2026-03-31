'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { FC } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { ShinyButton } from '@/components/ui/shiny-button';
import { cn } from '@/utils/cn';

const EASE = [0.22, 1, 0.36, 1] as const;

function validateUrl(input: string): true | string {
  try {
    new URL(input.trim());
    return true;
  } catch {
    return 'Enter a valid URL, e.g. https://yoursite.com';
  }
}

export const AuditCta: FC<{ className?: string }> = ({ className }) => {
  const router = useRouter();
  const form = useForm<{ domain: string }>({
    defaultValues: { domain: '' },
  });

  const onSubmit = ({ domain }: { domain: string }) => {
    router.push(`/audits?domain=${encodeURIComponent(domain.trim())}`);
  };

  return (
    <section className={cn(className, 'padding-global')}>
      <div className="padding-section-medium container">
        <div className="flex flex-col gap-x-8 gap-y-3 lg:flex-row lg:items-end lg:justify-between lg:gap-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: EASE }}
            className="w-full text-3xl lg:w-1/2 lg:max-w-[22ch] lg:text-4xl"
          >
            Your competitors are already showing up. Are you?
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.1 }}
            className="w-full lg:w-1/2 lg:pt-2"
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
                <FormField
                  control={form.control}
                  name="domain"
                  rules={{ required: 'Enter your URL.', validate: validateUrl }}
                  render={({ field }) => (
                    <FormItem>
                      <div className="border-border bg-background focus-within:ring-ring flex items-center rounded-full border p-1.5 focus-within:ring-2">
                        <FormControl>
                          <input
                            {...field}
                            type="text"
                            placeholder="https://yoursite.com"
                            className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                          />
                        </FormControl>
                        <ShinyButton>
                          <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            onClick={form.handleSubmit(onSubmit)}
                            className="shrink-0"
                          >
                            Run my free audit
                          </Button>
                        </ShinyButton>
                      </div>
                      <FormMessage className="pt-1 pl-3" />
                      <p className="text-muted-foreground hidden pt-2 pl-3 text-xs">
                        Free. No signup. See your results in 60 seconds.
                      </p>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
