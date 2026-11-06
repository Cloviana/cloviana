'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AtSignIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useId } from 'react';
import { type Control, Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { UnsavedChangesBar } from '@/components/forms/unsaved-changes-bar';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldSetCard,
  FieldSetDescription,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { paths } from '@/config/paths';

import { createStoreAction } from '../../actions/create-store';
import { sellerKeys } from '../../api/sellers-query-options';
import {
  CURRENCY_CODES,
  currencyLabels,
  DEFAULT_CURRENCY,
} from '../../lib/currencies';
import {
  createStoreRequestSchema,
  type CreateStoreFormInput,
  type CreateStoreRequest,
} from '../../schemas/create-store.schema';

type TextFieldName = 'name' | 'handle' | 'email' | 'phone' | 'adminEmail';

/** One labelled text input bound to the form, with its error. */
function TextField({
  control,
  id,
  name,
  label,
  required,
  type = 'text',
  maxLength,
  description,
  addon,
}: {
  control: Control<CreateStoreFormInput, unknown, CreateStoreRequest>;
  id: string;
  name: TextFieldName;
  label: string;
  required?: boolean;
  type?: 'text' | 'email' | 'tel';
  maxLength: number;
  description?: string;
  /** Fixed content before the input, such as the "@" icon of a handle. */
  addon?: ReactNode;
}) {
  const inputId = `${id}-${name}`;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const inputProps = {
          ...field,
          value: field.value ?? '',
          id: inputId,
          type,
          maxLength,
          required,
          // These hold someone else's details, so the browser must not fill in the user's own.
          autoComplete: 'off',
          'aria-invalid': fieldState.invalid,
          'aria-describedby':
            [
              description ? `${inputId}-help` : undefined,
              fieldState.invalid ? `${inputId}-error` : undefined,
            ]
              .filter(Boolean)
              .join(' ') || undefined,
        };
        return (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={inputId} required={required}>
              {label}
            </FieldLabel>
            {addon ? (
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>{addon}</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput {...inputProps} className="pl-1" />
              </InputGroup>
            ) : (
              <Input {...inputProps} />
            )}
            {description && (
              <FieldDescription id={`${inputId}-help`}>
                {description}
              </FieldDescription>
            )}
            <FieldError id={`${inputId}-error`} errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}

/** The create-store page's form. Saving is from the unsaved-changes bar, as on the product page. */
export function CreateStoreForm({ slug }: { slug: string }) {
  const id = useId();
  const formId = `${id}-form`;
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<CreateStoreFormInput, unknown, CreateStoreRequest>({
    resolver: zodResolver(createStoreRequestSchema),
    mode: 'onSubmit',
    defaultValues: {
      name: '',
      handle: '',
      email: '',
      phone: '',
      currencyCode: DEFAULT_CURRENCY,
      adminEmail: '',
    },
  });
  const { isDirty } = form.formState;

  const create = useMutation({
    mutationFn: (values: CreateStoreRequest) => createStoreAction(slug, values),
    onSuccess: async (result, values) => {
      if (!result.success) {
        if (result.field)
          form.setError(
            result.field,
            { message: result.message },
            { shouldFocus: true },
          );
        else toast.error(result.message);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: sellerKeys.all(slug) });
      toast.success('Store added', {
        description: `Invitation sent to ${values.adminEmail}.`,
      });
      router.push(paths.mp.stores.detail.getHref(slug, result.store.id));
    },
    onError: () => toast.error('Could not add the store. Try again.'),
  });

  return (
    <form
      id={formId}
      className="flex flex-col gap-8"
      noValidate
      onSubmit={form.handleSubmit(
        (values) => create.mutate(values),
        () => toast.error('Check the highlighted fields and try again.'),
      )}
    >
      <UnsavedChangesBar
        open={isDirty}
        form={formId}
        onDiscard={() => form.reset()}
        isSaving={create.isPending}
      />
      <FieldSet aria-label="Store details">
        <FieldSetCard>
          <FieldGroup>
            <TextField
              control={form.control}
              id={id}
              name="name"
              label="Store name"
              required
              maxLength={100}
              description="The name shoppers and your team see."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                control={form.control}
                id={id}
                name="handle"
                label="Handle"
                addon={
                  <AtSignIcon
                    className="size-3 translate-y-px"
                    aria-hidden="true"
                  />
                }
                maxLength={40}
                description="Lowercase letters, numbers and hyphens. Generated from the name if left empty."
              />
              <Controller
                control={form.control}
                name="currencyCode"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${id}-currency`} required>
                      Currency
                    </FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        if (value !== null) field.onChange(value);
                      }}
                    >
                      <SelectTrigger
                        id={`${id}-currency`}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        aria-invalid={fieldState.invalid}
                        aria-describedby={`${id}-currency-help`}
                        className="w-full"
                      >
                        <SelectValue>
                          {
                            currencyLabels[
                              field.value as keyof typeof currencyLabels
                            ]
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent align="start">
                        <SelectGroup>
                          {CURRENCY_CODES.map((code) => (
                            <SelectItem key={code} value={code}>
                              {currencyLabels[code]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldDescription id={`${id}-currency-help`}>
                      You can't change this after the store is added.
                    </FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <TextField
                control={form.control}
                id={id}
                name="email"
                label="Contact email"
                type="email"
                required
                maxLength={254}
                description="The store's main contact address."
              />
              <TextField
                control={form.control}
                id={id}
                name="phone"
                label="Phone"
                type="tel"
                maxLength={32}
                description="Include the country code, for example +1 555 0100."
              />
            </div>
          </FieldGroup>
        </FieldSetCard>
      </FieldSet>
      <FieldSet>
        <FieldLegend variant="section">Store admin</FieldLegend>
        <FieldSetDescription>
          We'll send an invitation to this address once the store is added.
        </FieldSetDescription>
        <FieldSetCard>
          <FieldGroup>
            <TextField
              control={form.control}
              id={id}
              name="adminEmail"
              label="Admin email"
              type="email"
              required
              maxLength={254}
            />
          </FieldGroup>
        </FieldSetCard>
      </FieldSet>
    </form>
  );
}
