'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import { Textarea } from '@/components/ui/textarea';

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
  const { back, isSaving, save, setup } = useBusinessSetup();
  const business = setup!.business;
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
                  Where do buyers usually discover you? This helps the AI
                  understand your go-to-market motion so it can generate more
                  accurate market topics.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
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
