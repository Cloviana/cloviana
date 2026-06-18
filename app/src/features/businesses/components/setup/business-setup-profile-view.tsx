'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, RefreshCw, Search, Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';

import { retryBusinessBrandResearch } from '../../api/business-setup';
import {
  BUSINESS_INDUSTRIES,
  setupBusinessProfileSchema,
} from '../../schemas/business-setup';

import { BusinessSetupActions } from './business-setup-actions';
import { useBusinessSetup } from './business-setup-context';
import { BusinessSetupHeading } from './business-setup-heading';

const fieldClassName =
  'rounded-md border-slate-200 bg-white text-slate-900 focus-visible:border-blue-600 focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:ring-offset-0';

export function BusinessSetupProfileView() {
  const { back, isSaving, save, setup, refresh } = useBusinessSetup();
  const business = setup!.business;
  const brandResearch = setup!.brandResearch;

  const form = useForm<z.infer<typeof setupBusinessProfileSchema>>({
    resolver: zodResolver(setupBusinessProfileSchema),
    mode: 'onChange',
    defaultValues: {
      description: business.description ?? '',
      industry: (business.industry || undefined) as z.infer<
        typeof setupBusinessProfileSchema
      >['industry'],
      category: business.category ?? '',
      distributionChannels: business.distributionChannels?.join(', ') ?? '',
      searchIntentCommercial: business.searchIntentCommercial ?? 70,
      searchIntentInformational: business.searchIntentInformational ?? 30,
    },
  });

  const isResearching =
    !brandResearch || ['PENDING', 'RUNNING'].includes(brandResearch.status);
  const progress = brandResearch?.progress ?? null;
  const progressPercent =
    typeof progress?.percent === 'number'
      ? Math.min(Math.max(progress.percent, 0), 100)
      : null;

  useEffect(() => {
    if (!isResearching) return;
    const timer = window.setInterval(() => void refresh(), 2500);
    return () => window.clearInterval(timer);
  }, [isResearching, refresh]);

  useEffect(() => {
    if (business.description || business.category) {
      form.reset({
        description: business.description ?? '',
        industry: (business.industry || undefined) as z.infer<
          typeof setupBusinessProfileSchema
        >['industry'],
        category: business.category ?? '',
        distributionChannels: business.distributionChannels?.join(', ') ?? '',
        searchIntentCommercial: business.searchIntentCommercial ?? 70,
        searchIntentInformational: business.searchIntentInformational ?? 30,
      });
    }
  }, [business, form]);

  async function retry() {
    try {
      await retryBusinessBrandResearch(setup!.business.id);
      await refresh();
      toast.success('Brand research restarted.');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Unable to retry research.',
      );
    }
  }

  if (isResearching) {
    return (
      <>
        <BusinessSetupHeading
          eyebrow="Profile, step 2 of 4"
          title="Researching the brand"
          subtitle="Cloviana is reading public sources and scraping the site to prepare the market profile draft."
        />
        <div className="border-y border-slate-200 py-6">
          <div className="flex items-start gap-4">
            <Spinner className="text-foreground mt-0.5 size-5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">
                {progress?.title ?? 'Analyzing website content'}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                This can take a few minutes. You can leave and resume later
                without losing progress.
              </p>
              {progressPercent !== null ? (
                <div className="mt-4">
                  <div className="bg-border h-1 rounded-full">
                    <div
                      className="bg-foreground h-1 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-foreground-lighter mt-2 text-xs">
                    {progressPercent}% complete
                  </p>
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              [Search, 'Analyze Site', 'Reading homepage and core pages'],
              [Sparkles, 'Competitors', 'Identifying market alternatives'],
              [Check, 'Profile Draft', 'Extracting categories and details'],
            ].map(([Icon, title, copy]) => (
              <div
                key={String(title)}
                className="border-l border-slate-200 pl-3"
              >
                <Icon className="text-slate-550 mb-2 size-4" />
                <p className="text-slate-805 text-xs font-medium">
                  {String(title)}
                </p>
                <p className="text-slate-550 mt-1 text-[11px] leading-4">
                  {String(copy)}
                </p>
              </div>
            ))}
          </div>
        </div>
        <BusinessSetupActions
          onBack={back}
          isContinueDisabled
          continueLabel="Researching brand"
        />
      </>
    );
  }

  if (brandResearch?.status === 'FAILED') {
    return (
      <>
        <BusinessSetupHeading
          eyebrow="Profile, step 2 of 4"
          title="Research needs another run"
          subtitle={
            brandResearch?.error ||
            'The brand research job did not return a usable profile.'
          }
        />
        <div className="border-y border-slate-200 py-6">
          <Button type="button" variant="outline" onClick={retry}>
            <RefreshCw className="mr-2 size-4" />
            Retry research
          </Button>
        </div>
        <BusinessSetupActions onBack={back} isContinueDisabled />
      </>
    );
  }

  return (
    <>
      <BusinessSetupHeading
        eyebrow="Profile, step 2 of 4"
        title="Review the market profile"
        subtitle="Cloviana prepared this draft from public sources. Correct anything that would change who the buyer is or which alternatives they compare."
      />

      <Form {...form}>
        <form
          className="space-y-5"
          onSubmit={form.handleSubmit((values) => save(values))}
        >
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={5}
                    className={fieldClassName}
                    placeholder="What the product does, for whom, and the outcome it creates."
                  />
                </FormControl>
                <FormDescription>
                  This context guides topic generation.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className={`h-10 ${fieldClassName}`}>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent align="start">
                      {BUSINESS_INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buyer-facing category</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className={`h-10 ${fieldClassName}`}
                      placeholder="AI search visibility platform"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="distributionChannels"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Distribution channels</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className={`h-10 ${fieldClassName}`}
                    placeholder="e.g. SEO, LinkedIn, G2 Reviews, Cold Email"
                  />
                </FormControl>
                <FormDescription>
                  How buyers discover your product, e.g. organic search, partner
                  referrals, paid ads.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4 rounded-md border border-slate-200 bg-slate-50 p-5">
            <div>
              <h3 className="text-sm font-medium text-slate-900">
                Audience distribution
              </h3>
              <p className="text-xs text-slate-500">
                Define your audience across user types.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="searchIntentCommercial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commercial Intent (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          field.onChange(val);
                          form.setValue(
                            'searchIntentInformational',
                            100 - val,
                            { shouldValidate: true },
                          );
                        }}
                        className={`h-10 ${fieldClassName}`}
                      />
                    </FormControl>
                    <FormDescription>
                      Looking for a solution/shortlist.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="searchIntentInformational"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Informational Intent (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          field.onChange(val);
                          form.setValue('searchIntentCommercial', 100 - val, {
                            shouldValidate: true,
                          });
                        }}
                        className={`h-10 ${fieldClassName}`}
                      />
                    </FormControl>
                    <FormDescription>
                      Looking for guides/how-tos.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="border-y border-slate-200 py-4 text-xs leading-5 text-slate-500">
            Continuing will generate a comprehensive taxonomy of topics and
            buying conversations based on your profile.
          </div>

          <BusinessSetupActions
            onBack={back}
            continueLabel="Generate topics"
            isSubmitting={isSaving}
            isContinueDisabled={isSaving}
          />
        </form>
      </Form>
    </>
  );
}
