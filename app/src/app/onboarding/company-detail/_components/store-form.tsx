'use client';

import { SubmitHandler, UseFormReturn } from 'react-hook-form';

import { Form, TextField } from '@/components/input';
import { FormLayout } from '@/components/layout';
import { Button } from '@/components/legacy';

type FormValues = {
  name: string;
  domainUrl: string;
};

export function StoreForm({
  form,
  onSubmit,
}: {
  form: UseFormReturn<FormValues>;
  onSubmit: SubmitHandler<FormValues>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = form;

  return (
    <Form onSubmit={handleSubmit(onSubmit)} className="h-full">
      <div className="flex h-full flex-col justify-between gap-y-4">
        <FormLayout>
          <TextField
            label="Store Name"
            placeholder="My Online Store"
            variant="surface"
            error={errors.name?.message}
            {...register('name', { required: 'Store name is required' })}
          />

          <TextField
            label="Domain URL"
            placeholder="example.com"
            variant="surface"
            error={errors.domainUrl?.message}
            {...register('domainUrl', {
              required: 'Domain URL is required',
              pattern: {
                value: /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                message: 'Enter a valid domain, e.g. example.com',
              },
            })}
          />
        </FormLayout>

        <div className="flex justify-end">
          <Button
            submit
            variant="primary"
            loading={isSubmitting}
            disabled={!isValid || isSubmitting}
          >
            Save and Continue
          </Button>
        </div>
      </div>
    </Form>
  );
}
