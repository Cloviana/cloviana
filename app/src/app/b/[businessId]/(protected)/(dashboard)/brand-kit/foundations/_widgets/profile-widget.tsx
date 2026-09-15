'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateBrandKitProfile } from '@/features/brand-kit/api/update-foundations';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import { useAutosave } from '@/features/brand-kit/hooks/use-autosave';

type ProfileWidgetProps = {
  className?: string;
};

export function ProfileWidget({ className }: ProfileWidgetProps) {
  const { businessId, draft, setDraft } = useBrandKitDraft();
  const nameMutation = useUpdateBrandKitProfile();
  const domainMutation = useUpdateBrandKitProfile();
  const aboutMutation = useUpdateBrandKitProfile();
  const saveName = useAutosave(draft.brand.name, (name) => {
    if (!name.trim()) return Promise.resolve();
    return nameMutation.mutateAsync({ businessId, name });
  });
  const saveDomain = useAutosave(draft.brand.domain, (domain) => {
    if (!domain.trim()) return Promise.resolve();
    return domainMutation.mutateAsync({ businessId, domain });
  });
  const saveAbout = useAutosave(draft.about ?? '', (about) =>
    aboutMutation.mutateAsync({ businessId, about: about || null }),
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Brand Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="brand-name">Brand Name</FieldLabel>
            <Input
              id="brand-name"
              value={draft.brand.name}
              onBlur={saveName}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  brand: { ...prev.brand, name: event.target.value },
                }))
              }
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="brand-url">Website</FieldLabel>
            <Input
              id="brand-url"
              value={draft.brand.domain}
              onBlur={saveDomain}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  brand: { ...prev.brand, domain: event.target.value },
                }))
              }
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="brand-about">About the Brand</FieldLabel>
          <FieldDescription>
            Summarize what the company does, who it serves, and why customers
            choose it.
          </FieldDescription>
          <Textarea
            id="brand-about"
            rows={6}
            value={draft.about ?? ''}
            onBlur={saveAbout}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, about: event.target.value }))
            }
          />
        </Field>
      </CardContent>
    </Card>
  );
}
