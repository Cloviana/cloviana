'use client';

import { ArrowUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { FC } from 'react';
import { useForm } from 'react-hook-form';

import {
  Avatar,
  AvatarGroup,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { cn } from '@/utils/cn';

const AI_LOGOS = [
  { src: '/logos/openai.png', alt: 'ChatGPT' },
  { src: '/logos/perplexity.png', alt: 'Perplexity' },
  { src: '/logos/gemini.webp', alt: 'Gemini' },
];

const EASE = [0.22, 1, 0.36, 1] as const;

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function validateUrl(input: string): true | string {
  try {
    const { hostname } = new URL(normalizeUrl(input));
    if (!hostname.includes('.') || hostname.endsWith('.'))
      return 'Enter a valid domain, e.g. yoursite.com';
    return true;
  } catch {
    return 'Enter a valid domain, e.g. yoursite.com';
  }
}

export const AuditCta: FC<{ className?: string }> = ({ className }) => {
  const router = useRouter();
  const form = useForm<{ domain: string }>({
    defaultValues: { domain: '' },
  });

  const domain = form.watch('domain');
  const isValid = validateUrl(domain) === true;

  const onSubmit = ({ domain }: { domain: string }) => {
    router.push(`/audits?domain=${encodeURIComponent(normalizeUrl(domain))}`);
  };

  return (
    <>
      <div className="h-15 w-full" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE, delay: 0.6 }}
        className={cn(
          'fixed bottom-6 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 px-4',
          className,
        )}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FormField
              control={form.control}
              name="domain"
              rules={{ required: 'Enter your URL.', validate: validateUrl }}
              render={({ field }) => (
                <FormItem>
                  <div className="border-border/60 bg-background/90 rounded-full border p-2">
                    <div className="bg-background flex items-center rounded-full border p-1.5 shadow-lg shadow-black/10 backdrop-blur-md">
                      <FormControl>
                        <input
                          {...field}
                          type="text"
                          placeholder="Enter your site URL to get a free audit..."
                          className="placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                        />
                      </FormControl>
                      <AvatarGroup className="mr-1">
                        {AI_LOGOS.map((logo) => (
                          <Avatar key={logo.alt} size="sm" className="size-5!">
                            <AvatarImage src={logo.src} alt={logo.alt} />
                            <AvatarFallback>{logo.alt[0]}</AvatarFallback>
                          </Avatar>
                        ))}
                      </AvatarGroup>
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!isValid || form.formState.isSubmitting}
                        className="h-8 w-8 shrink-0 rounded-full"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <FormMessage className="pt-1 pl-4 text-xs" />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </motion.div>
    </>
  );
};
