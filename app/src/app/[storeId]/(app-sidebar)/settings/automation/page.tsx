'use client';

import { ChevronRight } from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldGroup,
} from '@/components/ui/field';
import { Page, PageContent, PageHeader } from '@/components/ui/page';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useGetAutopilot } from '@/features/autopilot/api/get-autopilot';
import { useUpdateAutopilot } from '@/features/autopilot/api/update-autopilot';
import { AutopilotContentMix, DayOfWeek } from '@/types/api';
import { cn } from '@/utils/cn';

import { CollectionsSheet } from './_components/collections-sheet';

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

type ContentMix = AutopilotContentMix;

type FormValues = {
  autopilotEnabled: boolean;
  publishDays: DayOfWeek[];
  autoPublishEnabled: boolean;
  contentMix: ContentMix;
  selectedCollectionIds: string[];
};

export default function AutomationPage() {
  const { storeId } = useParams<{ storeId: string }>();

  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);

  const defaultValues = useMemo<FormValues>(
    () => ({
      autopilotEnabled: false,
      publishDays: [],
      autoPublishEnabled: false,
      contentMix: 'BALANCED',
      selectedCollectionIds: [],
    }),
    [],
  );

  const form = useForm<FormValues>({
    defaultValues,
    mode: 'onChange',
  });

  const {
    data: settings,
    isLoading,
    isFetching,
  } = useGetAutopilot({
    storeId,
  });

  const { mutateAsync: updateAutopilot, isPending: isSaving } =
    useUpdateAutopilot();

  const autopilotEnabled = form.watch('autopilotEnabled');
  const publishDays = form.watch('publishDays');
  const autoPublishEnabled = form.watch('autoPublishEnabled');
  const contentMix = form.watch('contentMix');
  const selectedCollectionIds = form.watch('selectedCollectionIds');
  const handlePublishDaysChange = (days: DayOfWeek[]) => {
    const next = days.slice(-1); // enforce max 1 day selection for now
    form.setValue('publishDays', next, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  useEffect(() => {
    (window as any).$crisp?.push(['do', 'chat:hide']);
    return () => {
      (window as any).$crisp?.push(['do', 'chat:show']);
    };
  }, []);

  useEffect(() => {
    if (!settings) return;

    form.reset({
      autopilotEnabled: settings.enabled,
      publishDays: settings.blog?.publishDays ?? [],
      autoPublishEnabled: settings.blog?.autoPublish ?? false,
      contentMix: settings.blog?.contentMix ?? 'BALANCED',
      selectedCollectionIds: settings.blog?.collectionIds ?? [],
    });
  }, [form, settings]);

  const onSubmit = async (values: FormValues) => {
    await updateAutopilot({
      storeId,
      enabled: values.autopilotEnabled,
      blog: {
        collectionIds: values.selectedCollectionIds,
        contentMix: values.contentMix,
        publishDays: values.publishDays,
        autoPublish: values.autoPublishEnabled,
      },
    });

    toast.success('Your changes have been saved', { position: 'top-right' });
    form.reset(values);
  };

  return (
    <Page>
      <PageHeader
        title="Automation"
        description="Turn automation on or off, and control how Cloviana runs in the background—starting with your blog cadence and content rules."
      />
      <PageContent className="mt-8 max-w-2xl space-y-8">
        {isLoading ? (
          <Spinner className="text-foreground/65 size-5" strokeWidth={3.4} />
        ) : (
          <>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup>
                <section>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel htmlFor="switch-autopilot">
                        Enable autopilot
                      </FieldLabel>
                      <FieldDescription>
                        Pauses or resumes all automation across Cloviana.
                      </FieldDescription>
                    </FieldContent>
                    <Switch
                      id="switch-autopilot"
                      checked={autopilotEnabled}
                      onCheckedChange={(v) =>
                        form.setValue('autopilotEnabled', v, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                    />
                  </Field>
                </section>

                <section
                  className={cn(
                    'space-y-6', // Slightly more breath between fields
                    !autopilotEnabled && 'pointer-events-none opacity-50',
                  )}
                >
                  <div>
                    <h2 className="text-foreground text-sm font-medium">
                      Blogs
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      Configure how blog posts are generated and published when
                      autopilot is active.
                    </p>
                  </div>

                  {/* 1. SOURCE: Where are we getting products? */}
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLabel>Target collections</FieldLabel>
                      <FieldDescription>
                        Limit autopilot to specific collections.
                      </FieldDescription>
                    </FieldContent>
                    <Button
                      variant="ghost"
                      size="default"
                      className="font-normal"
                      type="button"
                      onClick={() => setIsCollectionsOpen(true)}
                    >
                      {selectedCollectionIds.length > 0
                        ? `${selectedCollectionIds.length} selected`
                        : 'All collections'}
                      <ChevronRight className="size-4 opacity-50" />
                    </Button>
                  </Field>

                  {/* 2. STRATEGY: What kind of content? */}
                  <Field orientation="responsive">
                    <FieldContent>
                      <FieldLabel>Content mix</FieldLabel>
                      <FieldDescription>
                        Controls which blog templates are prioritized.
                      </FieldDescription>
                    </FieldContent>
                    <Select
                      value={contentMix}
                      onValueChange={(v) =>
                        form.setValue('contentMix', v as ContentMix, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger variant="ghost" size="sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="end">
                        <SelectItem value="BALANCED">Balanced mix</SelectItem>
                        <SelectItem value="PROBLEM_SOLUTION">
                          Problem–solution
                        </SelectItem>
                        <SelectItem value="COMPARISON">
                          Comparison posts
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  {/* 3. SCHEDULE: When? */}
                  <Field>
                    <FieldLabel>Publish days</FieldLabel>
                    <ToggleGroup
                      type="multiple"
                      value={publishDays}
                      onValueChange={(v) =>
                        handlePublishDaysChange(v as DayOfWeek[])
                      }
                      className="flex flex-wrap gap-2"
                    >
                      {DAYS.map((day) => (
                        <ToggleGroupItem key={day} value={day}>
                          {day.charAt(0) + day.slice(1).toLowerCase()}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </Field>

                  {/* 4. EXECUTION: Draft or Live? */}
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldLabel htmlFor="switch-auto-publish">
                        Enable automatic publishing
                      </FieldLabel>
                      <FieldDescription>
                        If disabled, blogs are created as drafts.
                      </FieldDescription>
                    </FieldContent>
                    <Switch
                      id="switch-auto-publish"
                      checked={autoPublishEnabled}
                      onCheckedChange={(v) =>
                        form.setValue('autoPublishEnabled', v, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        })
                      }
                    />
                  </Field>
                </section>
              </FieldGroup>

              <div className="flex justify-start pt-8">
                <Button
                  type="submit"
                  variant="secondary"
                  size="default"
                  disabled={!form.formState.isDirty || isSaving || isFetching}
                  loading={isSaving}
                >
                  Save Changes
                </Button>
              </div>
            </form>

            <CollectionsSheet
              open={isCollectionsOpen}
              onOpenChange={setIsCollectionsOpen}
              selectedIds={selectedCollectionIds}
              onSelectionChange={(ids) =>
                form.setValue('selectedCollectionIds', ids, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                })
              }
              storeId={storeId}
            />
          </>
        )}
      </PageContent>
    </Page>
  );
}
