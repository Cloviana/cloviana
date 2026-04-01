'use client';

import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useState } from 'react';
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

const AI_LOGOS = [
  { src: '/logos/chatgpt-icon.svg', alt: 'ChatGPT' },
  { src: '/logos/perplexity-color.svg', alt: 'Perplexity' },
  { src: '/logos/gemini-color.svg', alt: 'Gemini' },
  { src: '/logos/copilot-color.svg', alt: 'Copilot' },
];

function CyclingLogo() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % AI_LOGOS.length);
    }, 1500);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className="relative mx-1 inline-flex items-center justify-center align-middle"
      style={{ width: '1em', height: '1em', verticalAlign: 'middle' }}
    >
      <AnimatePresence>
        <motion.span
          key={index}
          initial={{ opacity: 0, filter: 'blur(6px)', scale: 0.8 }}
          animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
          exit={{ opacity: 0, filter: 'blur(6px)', scale: 0.8 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Image
            src={AI_LOGOS[index].src}
            alt={AI_LOGOS[index].alt}
            width={22}
            height={22}
            className="h-full w-full object-contain"
          />
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

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
    <section
      className={cn(
        className,
        'padding-global relative overflow-hidden border-t border-b',
      )}
    >
      <div className="padding-section-medium relative container border-r border-l">
        <div className="flex flex-col items-center gap-x-8 gap-y-3 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: EASE }}
            className="flex w-full flex-wrap items-center justify-center gap-2.5 text-3xl md:text-4xl lg:w-1/2 lg:text-[40px]/12"
          >
            See where you appear in{' '}
            <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
              <CyclingLogo />
              AI search
            </span>
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
                      <p className="pt-2 text-center text-xs">
                        Free report · No credit card · Results in 60 seconds
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
