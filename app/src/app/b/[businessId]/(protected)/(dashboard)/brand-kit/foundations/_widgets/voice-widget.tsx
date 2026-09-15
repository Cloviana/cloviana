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
import { useUpdateBrandKitVoice } from '@/features/brand-kit/api/update-foundations';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import { useAutosave } from '@/features/brand-kit/hooks/use-autosave';

type VoiceWidgetProps = {
  className?: string;
};

export function VoiceWidget({ className }: VoiceWidgetProps) {
  const { businessId, draft, setDraft } = useBrandKitDraft();
  const updateVoice = useUpdateBrandKitVoice();
  const saveVoice = useAutosave(draft.voice ?? '', (voice) =>
    updateVoice.mutateAsync({ businessId, voice: voice || null }),
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Voice</CardTitle>
        <CardDescription>
          Set the tone, personality, sentence style, and language used across
          your content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Field>
          <FieldLabel htmlFor="brand-voice" className="sr-only">
            Voice
          </FieldLabel>
          <Textarea
            id="brand-voice"
            placeholder="e.g. Clear, confident, practical, and direct. Use plain language and avoid hype."
            rows={6}
            value={draft.voice ?? ''}
            onBlur={saveVoice}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, voice: event.target.value }))
            }
          />
        </Field>
      </CardContent>
    </Card>
  );
}
