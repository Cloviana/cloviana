'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateBrandKitWriterPersona } from '@/features/brand-kit/api/update-foundations';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import { useAutosave } from '@/features/brand-kit/hooks/use-autosave';

type WriterPersonaWidgetProps = {
  className?: string;
};

export function WriterPersonaWidget({ className }: WriterPersonaWidgetProps) {
  const { businessId, draft, setDraft } = useBrandKitDraft();
  const updateWriterPersona = useUpdateBrandKitWriterPersona();
  const saveWriterPersona = useAutosave(
    draft.writerPersona ?? '',
    (writerPersona) =>
      updateWriterPersona.mutateAsync({
        businessId,
        writerPersona: writerPersona || null,
      }),
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Writer Profile</CardTitle>
        <CardDescription>
          Define the expertise and point of view behind your content. This
          describes the writer, not the target audience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Field>
          <FieldLabel htmlFor="brand-writer-persona" className="sr-only">
            Writer Profile
          </FieldLabel>
          <Textarea
            id="brand-writer-persona"
            placeholder="e.g. An experienced B2B SaaS strategist who understands technical products and writes for busy decision-makers."
            rows={6}
            value={draft.writerPersona ?? ''}
            onBlur={saveWriterPersona}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                writerPersona: event.target.value,
              }))
            }
          />
        </Field>
      </CardContent>
    </Card>
  );
}
