'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetBusinessCompetitorSuggestions } from '@/features/businesses/api/business-setup';
import { BusinessSetupActions } from '@/features/businesses/components/setup/business-setup-actions';
import { useBusinessSetup } from '@/features/businesses/components/setup/business-setup-context';
import { BusinessSetupHeading } from '@/features/businesses/components/setup/business-setup-heading';
import { businessSetupStepConfig } from '@/features/businesses/components/setup/business-setup-steps';
import type { SetupBusinessCompetitorsData } from '@/features/businesses/schemas/business-setup';

const COMPETITOR_FIELD_COUNT = 5;
const REQUIRED_COMPETITOR_COUNT = 3;
const SUGGESTION_SKELETON_COUNT = 8;

const domainSchema = z
  .string()
  .trim()
  .regex(/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i, 'Enter a valid domain');

const competitorsFormSchema = z.object({
  competitors: z
    .array(z.string())
    .length(COMPETITOR_FIELD_COUNT)
    .superRefine((competitors, ctx) => {
      competitors.forEach((competitor, index) => {
        const value = competitor.trim();

        if (index < REQUIRED_COMPETITOR_COUNT && !value) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Enter a valid domain',
            path: [index],
          });
          return;
        }

        if (!value) {
          return;
        }

        const parsed = domainSchema.safeParse(value);

        if (!parsed.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: parsed.error.issues[0]?.message ?? 'Enter a valid domain',
            path: [index],
          });
        }
      });
    }),
});

type CompetitorsFormValues = z.infer<typeof competitorsFormSchema>;

function createEmptyCompetitors() {
  return Array.from({ length: COMPETITOR_FIELD_COUNT }, () => '');
}

function normalizeDomain(value: string) {
  return value.trim().toLowerCase();
}

function buildCompetitorValues(domains: string[] = []) {
  return Array.from(
    { length: COMPETITOR_FIELD_COUNT },
    (_, index) => domains[index] ?? '',
  );
}

export function BusinessSetupCompetitorsView() {
  const { back, isSaving, save, setup } = useBusinessSetup();
  const config = businessSetupStepConfig.competitors;
  const businessId = setup?.business.id ?? '';

  const {
    data: competitorSuggestions,
    isLoading: isSuggestionsLoading,
    isFetching: isSuggestionsFetching,
  } = useGetBusinessCompetitorSuggestions(businessId);

  const form = useForm<CompetitorsFormValues>({
    resolver: zodResolver(competitorsFormSchema),
    mode: 'onChange',
    defaultValues: {
      competitors: createEmptyCompetitors(),
    },
  });

  const competitors =
    useWatch({
      control: form.control,
      name: 'competitors',
    }) ?? createEmptyCompetitors();

  useEffect(() => {
    const domains =
      setup?.business.competitors.map((competitor) => competitor.domain) ?? [];

    form.reset({
      competitors: buildCompetitorValues(domains),
    });
  }, [form, setup?.business.competitors]);

  const selectedCompetitors = useMemo(() => {
    return new Set(
      competitors
        .map((competitor) => normalizeDomain(competitor))
        .filter(Boolean),
    );
  }, [competitors]);

  const suggestions = competitorSuggestions?.suggestions ?? [];
  const showSuggestionSkeletons =
    (isSuggestionsLoading || isSuggestionsFetching) && suggestions.length === 0;

  function handleSuggestedCompetitor(domain: string) {
    const normalizedDomain = normalizeDomain(domain);

    if (selectedCompetitors.has(normalizedDomain)) {
      return;
    }

    const nextEmptyIndex = competitors.findIndex((competitor) => {
      return !competitor.trim();
    });

    if (nextEmptyIndex === -1) {
      return;
    }

    form.setValue(`competitors.${nextEmptyIndex}`, domain, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  async function onSubmit(values: CompetitorsFormValues) {
    const competitors: SetupBusinessCompetitorsData['competitors'] =
      values.competitors.map((competitor) => competitor.trim()).filter(Boolean);

    await save({ competitors });
  }

  return (
    <div className="space-y-8">
      <BusinessSetupHeading title={config.title} subtitle={config.subtitle} />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="w-full space-y-4"
        >
          {Array.from({ length: COMPETITOR_FIELD_COUNT }, (_, index) => {
            const isOptional = index >= REQUIRED_COMPETITOR_COUNT;

            return (
              <FormField
                key={index}
                control={form.control}
                name={`competitors.${index}`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        size="lg"
                        inputMode="url"
                        autoCapitalize="none"
                        autoCorrect="off"
                        autoComplete="off"
                        placeholder={
                          isOptional ? 'Optional' : 'e.g. competitor.com'
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          })}

          {(showSuggestionSkeletons || suggestions.length > 0) && (
            <div className="mt-4 space-y-3">
              <p className="text-foreground-light text-[13px]">
                Suggested competitors
              </p>

              <div className="flex flex-wrap gap-2">
                {showSuggestionSkeletons
                  ? Array.from(
                      { length: SUGGESTION_SKELETON_COUNT },
                      (_, index) => (
                        <Skeleton key={index} className="h-6 w-24 rounded-md" />
                      ),
                    )
                  : suggestions.map(({ domain }) => {
                      const isSelected = selectedCompetitors.has(
                        normalizeDomain(domain),
                      );

                      return (
                        <Button
                          key={domain}
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => handleSuggestedCompetitor(domain)}
                          disabled={isSelected}
                        >
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`}
                            alt=""
                            className="size-4 rounded-sm"
                          />
                          <span>{domain}</span>
                        </Button>
                      );
                    })}
              </div>
            </div>
          )}

          <BusinessSetupActions
            canGoBack={false}
            isSubmitting={isSaving}
            isContinueDisabled={isSaving || !form.formState.isValid}
            onBack={back}
          />
        </form>
      </Form>
    </div>
  );
}
