'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Check, RefreshCw, Search, Sparkles } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormField, FormMessage } from '@/components/ui/form';
import { Spinner } from '@/components/ui/spinner';

import { retryBusinessPromptResearch } from '../../api/business-setup';
import { setupBusinessTopicsSchema } from '../../schemas/business-setup';

import { BusinessSetupActions } from './business-setup-actions';
import { useBusinessSetup } from './business-setup-context';
import { BusinessSetupHeading } from './business-setup-heading';

export function BusinessSetupTopicsView() {
  const { back, businessId, isSaving, refresh, save, setup } =
    useBusinessSetup();
  const research = setup!.promptResearch;
  const universe = research?.promptUniverse;
  const clusters = useMemo(() => {
    if (!universe) return [];
    return universe.clusters
      .map((cluster) => {
        const promptCount =
          universe.prompts?.filter((prompt) => prompt.clusterId === cluster.id)
            .length || 0;
        const activeCount =
          universe.prompts?.filter(
            (prompt) => prompt.clusterId === cluster.id && prompt.active,
          ).length || 0;
        return {
          ...cluster,
          promptCount,
          activeCount,
        };
      })
      .sort(
        (a, b) =>
          b.activeCount - a.activeCount || b.promptCount - a.promptCount,
      );
  }, [universe]);
  const suggestedIds = useMemo(
    () =>
      setup!.business.selectedTopicIds.length
        ? setup!.business.selectedTopicIds
        : clusters.slice(0, 5).map((cluster) => cluster.id),
    [clusters, setup],
  );
  const form = useForm<z.infer<typeof setupBusinessTopicsSchema>>({
    resolver: zodResolver(setupBusinessTopicsSchema),
    mode: 'onChange',
    defaultValues: { topicIds: suggestedIds },
  });
  const selectedIds = form.watch('topicIds');
  const isResearching =
    !research || ['PENDING', 'RUNNING'].includes(research.status);
  const progress = research?.progress ?? null;
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
    if (clusters.length && form.getValues('topicIds').length === 0) {
      form.reset({ topicIds: suggestedIds });
    }
  }, [clusters, form, suggestedIds]);

  async function retry() {
    try {
      await retryBusinessPromptResearch(businessId);
      await refresh();
      toast.success('Prompt research restarted.');
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
          eyebrow="Topics, step 3 of 4"
          title="Researching the brand"
          subtitle="Cloviana is reading public sources, buyer language, and competitor context before it suggests the topics to monitor."
        />
        <div className="border-y border-slate-200 py-6">
          <div className="flex items-start gap-4">
            <Spinner className="text-foreground mt-0.5 size-5" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">
                {progress?.title ?? 'Building the topic set'}
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
              [Search, 'Public sources', 'Website, reviews, buyer discussions'],
              [Sparkles, 'Topic map', 'Recurring buying conversations'],
              [Check, 'Review set', 'Prompts ready for approval'],
            ].map(([Icon, title, copy]) => (
              <div
                key={String(title)}
                className="border-l border-slate-200 pl-3"
              >
                <Icon className="mb-2 size-4 text-slate-500" />
                <p className="text-xs font-medium text-slate-800">
                  {String(title)}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  {String(copy)}
                </p>
              </div>
            ))}
          </div>
        </div>
        <BusinessSetupActions
          onBack={back}
          isContinueDisabled
          continueLabel="Researching topics"
        />
      </>
    );
  }

  if (research?.status === 'FAILED' || !universe) {
    return (
      <>
        <BusinessSetupHeading
          eyebrow="Topics, step 3 of 4"
          title="Research needs another run"
          subtitle={
            research?.error ||
            'The topic generation job did not return a usable topic universe.'
          }
        />
        <div className="border-y border-slate-200 py-6">
          <Button type="button" variant="outline" onClick={retry}>
            <RefreshCw className="size-4" />
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
        eyebrow="Topics, step 3 of 4"
        title="Choose the topic universe"
        subtitle="These are recurring buying conversations found across the market. Select the ones this client should be measured against."
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => save(values))}>
          <FormField
            control={form.control}
            name="topicIds"
            render={({ field }) => (
              <div className="space-y-2">
                {clusters.map((cluster) => {
                  const checked = field.value.includes(cluster.id);
                  return (
                    <label
                      key={cluster.id}
                      htmlFor={`topic-${cluster.id}`}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border px-4 py-3 transition-colors ${
                        checked
                          ? 'border-foreground bg-black/[0.03]'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <Checkbox
                        id={`topic-${cluster.id}`}
                        checked={checked}
                        onCheckedChange={(next) => {
                          const value = next
                            ? [...field.value, cluster.id]
                            : field.value.filter((id) => id !== cluster.id);
                          field.onChange(value);
                        }}
                        className="mt-0.5 focus-visible:ring-1 focus-visible:ring-blue-600"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-slate-900">
                            {cluster.name}
                          </span>
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-500">
                          {cluster.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
                <FormMessage />
              </div>
            )}
          />

          <div className="mt-5 flex items-center justify-between border-y border-slate-200 py-3 text-xs text-slate-500">
            <span>
              {selectedIds.length} of {clusters.length} topics selected
            </span>
          </div>

          <BusinessSetupActions
            onBack={back}
            continueLabel="Generate prompts"
            isSubmitting={isSaving}
            isContinueDisabled={isSaving}
          />
        </form>
      </Form>
    </>
  );
}
