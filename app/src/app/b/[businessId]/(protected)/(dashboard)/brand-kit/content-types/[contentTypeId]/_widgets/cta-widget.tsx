'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useUpdateBrandKitContentType } from '@/features/brand-kit/api/content-types';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import { useAutosave } from '@/features/brand-kit/hooks/use-autosave';

type CtaWidgetProps = {
  contentTypeId: string;
  className?: string;
};

export function CtaWidget({ contentTypeId, className }: CtaWidgetProps) {
  const { businessId, draft, setDraft } = useBrandKitDraft();
  const contentType = draft.contentTypes.find(
    (item) => item.id === contentTypeId,
  );
  const updateContentType = useUpdateBrandKitContentType();
  const saveCtaText = useAutosave(contentType?.ctaText ?? '', (ctaText) =>
    updateContentType.mutateAsync({
      businessId,
      contentTypeId,
      ctaText: ctaText || null,
    }),
  );
  const saveCtaUrl = useAutosave(contentType?.ctaUrl ?? '', (ctaUrl) =>
    updateContentType.mutateAsync({
      businessId,
      contentTypeId,
      ctaUrl: ctaUrl || null,
    }),
  );

  if (!contentType) return null;

  function updateContentTypeDraft(field: 'ctaText' | 'ctaUrl', value: string) {
    setDraft((previous) => ({
      ...previous,
      contentTypes: previous.contentTypes.map((item) =>
        item.id === contentTypeId ? { ...item, [field]: value } : item,
      ),
    }));
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Call to Action</CardTitle>
        <CardDescription>
          Set the default call to action for this content type. Leave both
          fields blank if it does not need one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="content-type-cta-text">CTA Text</FieldLabel>
            <Input
              id="content-type-cta-text"
              value={contentType.ctaText ?? ''}
              placeholder="Book a demo"
              onBlur={saveCtaText}
              onChange={(event) =>
                updateContentTypeDraft('ctaText', event.target.value)
              }
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="content-type-cta-url">
              Destination URL
            </FieldLabel>
            <Input
              id="content-type-cta-url"
              type="url"
              value={contentType.ctaUrl ?? ''}
              placeholder="https://example.com/demo"
              onBlur={saveCtaUrl}
              onChange={(event) =>
                updateContentTypeDraft('ctaUrl', event.target.value)
              }
            />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
