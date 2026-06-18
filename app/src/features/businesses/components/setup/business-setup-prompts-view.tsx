'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Plus } from 'lucide-react';
import { useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { setupBusinessPromptsSchema } from '../../schemas/business-setup';

import { BusinessSetupActions } from './business-setup-actions';
import { useBusinessSetup } from './business-setup-context';
import { BusinessSetupHeading } from './business-setup-heading';

const stageConfig = {
  EXPLORE: { label: 'Explore', dotColor: 'bg-slate-500' },
  EVALUATE: { label: 'Evaluate', dotColor: 'bg-amber-500' },
  DECIDE: { label: 'Decide', dotColor: 'bg-emerald-500' },
} as const;

export function BusinessSetupPromptsView() {
  const { back, isSaving, save, setup } = useBusinessSetup();
  const universe = setup!.promptResearch?.promptUniverse;
  const selectedTopicIds = setup!.business.selectedTopicIds;
  const clusters = useMemo(
    () =>
      universe?.clusters.filter((cluster) =>
        selectedTopicIds.includes(cluster.id),
      ) ?? [],
    [selectedTopicIds, universe],
  );
  const generatedPrompts = useMemo(
    () =>
      universe?.prompts?.filter((prompt) =>
        selectedTopicIds.includes(prompt.clusterId),
      ) ?? [],
    [selectedTopicIds, universe],
  );
  const form = useForm<z.infer<typeof setupBusinessPromptsSchema>>({
    resolver: zodResolver(setupBusinessPromptsSchema),
    mode: 'onChange',
    defaultValues: {
      prompts: generatedPrompts.map((prompt) => ({
        clusterId: prompt.clusterId,
        text: prompt.text,
        stage: prompt.stage as 'EXPLORE' | 'EVALUATE' | 'DECIDE',
        selected: Boolean(prompt.active),
      })),
    },
  });
  const { fields, append } = useFieldArray({
    control: form.control,
    name: 'prompts',
  });
  const prompts = form.watch('prompts');
  const selectedCount = prompts.filter((prompt) => prompt.selected).length;

  if (!universe || clusters.length === 0) {
    return (
      <>
        <BusinessSetupHeading
          eyebrow="Prompts, step 4 of 4"
          title="No topic selected"
          subtitle="Go back and select at least one topic to generate prompts."
        />
        <BusinessSetupActions onBack={back} isContinueDisabled />
      </>
    );
  }

  if (generatedPrompts.length === 0) {
    return (
      <>
        <BusinessSetupHeading
          eyebrow="Prompts, step 4 of 4"
          title="Generating your prompts"
          subtitle="Cloviana is building a tailored prompt universe for your selected topics. This may take a moment."
        />
        <div className="border-y border-slate-200 py-8">
          <div className="flex items-start gap-4">
            <div className="relative mt-1">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">
                Drafting prompts
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Generating combinations of buyer queries based on your profile
                and topics.
              </p>
            </div>
          </div>
        </div>
        <BusinessSetupActions onBack={back} isContinueDisabled />
      </>
    );
  }

  return (
    <>
      <BusinessSetupHeading
        eyebrow="Prompts, step 4 of 4"
        title="Approve buyer prompts"
        subtitle="The checked prompts become the client’s active monitoring set. Edit wording to match how real buyers in this market ask for recommendations."
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => save(values))}>
          <div className="space-y-3">
            {clusters.map((cluster, clusterIndex) => {
              const indices = fields
                .map((field, index) => ({ field, index }))
                .filter(({ field }) => field.clusterId === cluster.id);
              const selectedInCluster = indices.filter(
                ({ index }) => prompts[index]?.selected,
              ).length;

              return (
                <Collapsible key={cluster.id} defaultOpen={clusterIndex === 0}>
                  <div className="rounded-md border border-slate-200 bg-white">
                    <CollapsibleTrigger className="group flex w-full items-center justify-between gap-4 px-4 py-3 text-left">
                      <span>
                        <span className="block text-sm font-medium text-slate-900">
                          {cluster.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {selectedInCluster} approved · {indices.length}{' '}
                          available
                        </span>
                      </span>
                      <ChevronDown className="size-4 text-slate-400 transition-transform group-data-[state=open]:rotate-180" />
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="border-t border-slate-200 px-4 py-2">
                        {indices.map(({ field, index }) => (
                          <div
                            key={field.id}
                            className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-start gap-3 border-b border-slate-100 py-3 last:border-0"
                          >
                            <FormField
                              control={form.control}
                              name={`prompts.${index}.selected`}
                              render={({ field: selectedField }) => (
                                <Checkbox
                                  checked={selectedField.value}
                                  onCheckedChange={selectedField.onChange}
                                  className="mt-2 focus-visible:ring-1 focus-visible:ring-blue-600"
                                />
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`prompts.${index}.text`}
                              render={({ field: textField }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      {...textField}
                                      className="h-9 border-transparent bg-transparent px-2 text-sm text-slate-800 hover:border-slate-200 focus-visible:border-blue-600 focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:ring-offset-0"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            {(() => {
                              const stage = prompts[index]?.stage ?? 'EVALUATE';
                              const conf =
                                stageConfig[stage] || stageConfig.EVALUATE;
                              return (
                                <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-slate-700 uppercase">
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${conf.dotColor}`}
                                  />
                                  {conf.label}
                                </span>
                              );
                            })()}
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-slate-600"
                          onClick={() =>
                            append({
                              clusterId: cluster.id,
                              text: '',
                              stage: 'EVALUATE',
                              selected: true,
                            })
                          }
                        >
                          <Plus className="size-3.5" />
                          Add custom prompt
                        </Button>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>

          <div className="mt-5 flex items-center justify-between border-y border-slate-200 py-3 text-xs text-slate-500">
            <span>{selectedCount} prompts approved</span>
            <span>Daily multi-engine monitoring</span>
          </div>
          {form.formState.errors.prompts?.root?.message ? (
            <p className="mt-2 text-sm text-red-600">
              {form.formState.errors.prompts.root.message}
            </p>
          ) : null}

          <BusinessSetupActions
            onBack={back}
            continueLabel="Start monitoring"
            isSubmitting={isSaving}
            isContinueDisabled={isSaving}
          />
        </form>
      </Form>
    </>
  );
}
