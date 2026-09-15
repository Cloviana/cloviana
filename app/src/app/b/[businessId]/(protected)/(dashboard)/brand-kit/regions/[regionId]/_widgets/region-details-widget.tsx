'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateBrandKitRegion } from '@/features/brand-kit/api/regions';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import { useAutosave } from '@/features/brand-kit/hooks/use-autosave';

type RegionDetailsWidgetProps = {
  regionId: string;
  className?: string;
};

export function RegionDetailsWidget({
  regionId,
  className,
}: RegionDetailsWidgetProps) {
  const { businessId, draft, setDraft } = useBrandKitDraft();
  const region = draft.regions.find((item) => item.id === regionId);
  const nameMutation = useUpdateBrandKitRegion();
  const descriptionMutation = useUpdateBrandKitRegion();
  const saveName = useAutosave(region?.name ?? '', (name) => {
    if (!name.trim()) return Promise.resolve();
    return nameMutation.mutateAsync({ businessId, regionId, name });
  });
  const saveDescription = useAutosave(
    region?.description ?? '',
    (description) =>
      descriptionMutation.mutateAsync({
        businessId,
        regionId,
        description: description || null,
      }),
  );

  if (!region) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Regional Context</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Field>
          <FieldLabel htmlFor="region-name">Name</FieldLabel>
          <Input
            id="region-name"
            maxLength={200}
            value={region.name}
            onBlur={saveName}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                regions: previous.regions.map((item) =>
                  item.id === regionId
                    ? { ...item, name: event.target.value }
                    : item,
                ),
              }))
            }
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="region-description">
            Localization Context
          </FieldLabel>
          <FieldDescription>
            Include language, spelling, terminology, cultural expectations,
            regulations, and other market-specific considerations.
          </FieldDescription>
          <Textarea
            id="region-description"
            rows={7}
            maxLength={2_000}
            value={region.description ?? ''}
            onBlur={saveDescription}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                regions: previous.regions.map((item) =>
                  item.id === regionId
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
