'use client';

import { useFormContext } from 'react-hook-form';

import { TextArea } from '@/components/input';
import { Card } from '@/components/layout';

import { CreateArticleFormValues } from '../provider';

export const BrandVoicePicker = () => {
  const {
    register,
    formState: { errors },
  } = useFormContext<CreateArticleFormValues>();

  return (
    <Card>
      <TextArea
        label="Brand Voice"
        placeholder="e.g. friendly and conversational, or formal and authoritative..."
        size="md"
        rows={5}
        className="max-h-24 min-h-24 overflow-y-auto"
        {...register('brandVoice')}
        error={errors.brandVoice?.message}
        helpText="Optional. Define your brand’s tone to ensure the AI matches it when generating content. In the near future, you’ll be able to save and manage your custom brand voice profiles."
      />
    </Card>
  );
};
