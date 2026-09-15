'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateBrandKitAudience } from '@/features/brand-kit/api/audiences';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import { useAutosave } from '@/features/brand-kit/hooks/use-autosave';

type AudienceDetailsWidgetProps = {
  audienceId: string;
  className?: string;
};

export function AudienceDetailsWidget({
  audienceId,
  className,
}: AudienceDetailsWidgetProps) {
  const { businessId, draft, setDraft } = useBrandKitDraft();
  const audience = draft.audiences.find((item) => item.id === audienceId);
  const nameMutation = useUpdateBrandKitAudience();
  const descriptionMutation = useUpdateBrandKitAudience();
  const saveName = useAutosave(audience?.name ?? '', (name) => {
    if (!name.trim()) return Promise.resolve();
    return nameMutation.mutateAsync({ businessId, audienceId, name });
  });
  const saveDescription = useAutosave(
    audience?.description ?? '',
    (description) =>
      descriptionMutation.mutateAsync({
        businessId,
        audienceId,
        description: description || null,
      }),
  );

  if (!audience) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Audience Definition</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Field>
          <FieldLabel htmlFor="audience-name">Name</FieldLabel>
          <Input
            id="audience-name"
            maxLength={200}
            value={audience.name}
            onBlur={saveName}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                audiences: previous.audiences.map((item) =>
                  item.id === audienceId
                    ? { ...item, name: event.target.value }
                    : item,
                ),
              }))
            }
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="audience-description">
            Audience Context
          </FieldLabel>
          <FieldDescription>
            Include their role, goals, pain points, objections, existing
            knowledge, and the language they use.
          </FieldDescription>
          <Textarea
            id="audience-description"
            rows={7}
            maxLength={2_000}
            value={audience.description ?? ''}
            onBlur={saveDescription}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                audiences: previous.audiences.map((item) =>
                  item.id === audienceId
                    ? { ...item, description: event.target.value }
                    : item,
                ),
              }))
            }
          />
        </Field>
      </CardContent>
    </Card>
  );
}
