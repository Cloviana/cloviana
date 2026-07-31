'use client';

import { Globe, Plus, X } from 'lucide-react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { SheetFooter } from '@/components/ui/sheet';
import { getCompetitorError } from '@/features/competitors/api/competitor-error';
import { useCreateCompetitor } from '@/features/competitors/api/create-competitor';

type AddCompetitorFormValues = {
  displayName: string;
  domain: string;
  trackedName: string;
  aliases: Array<{ value: string }>;
};

const DOMAIN_PATTERN = /^(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,63}$/;

type AddCompetitorFormProps = {
  businessId: string;
  onCancel: () => void;
  onCreated: () => void;
};

export function AddCompetitorForm({
  businessId,
  onCancel,
  onCreated,
}: AddCompetitorFormProps) {
  const form = useForm<AddCompetitorFormValues>({
    mode: 'onChange',
    defaultValues: {
      displayName: '',
      domain: '',
      trackedName: '',
      aliases: [],
    },
  });
  const aliases = useFieldArray({
    control: form.control,
    name: 'aliases',
  });
  const createCompetitor = useCreateCompetitor();
  const [displayName, domainValue, trackedName] = useWatch({
    control: form.control,
    name: ['displayName', 'domain', 'trackedName'],
  });
  const domain = domainValue.trim().toLowerCase();
  const faviconUrl = DOMAIN_PATTERN.test(domain)
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
        domain,
      )}&sz=64`
    : undefined;
  const displayNameField = form.register('displayName', {
    required: 'Display name is required',
    maxLength: {
      value: 100,
      message: 'Display name must be 100 characters or fewer',
    },
  });

  function submitForm(values: AddCompetitorFormValues) {
    const trackedNames = Array.from(
      new Map(
        [values.trackedName, ...values.aliases.map((alias) => alias.value)]
          .map((name) => name.trim().replace(/\s+/g, ' '))
          .filter(Boolean)
          .map((name) => [name.toLocaleLowerCase(), name]),
      ).values(),
    );

    createCompetitor.mutate(
      {
        businessId,
        name: values.displayName.trim().replace(/\s+/g, ' '),
        domain: values.domain.trim().toLocaleLowerCase(),
        aliases: trackedNames,
      },
      {
        onSuccess: () => {
          toast.success('Competitor added');
          form.reset();
          onCreated();
        },
        onError: (error) =>
          toast.error(getCompetitorError(error, 'Could not add competitor')),
      },
    );
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={form.handleSubmit(submitForm)}
    >
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4">
        <section className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="competitor-display-name">Display name</Label>
            <InputGroup
              aria-invalid={Boolean(form.formState.errors.displayName)}
            >
              <InputGroupInput
                id="competitor-display-name"
                placeholder="e.g. Acme"
                aria-invalid={Boolean(form.formState.errors.displayName)}
                {...displayNameField}
                onChange={(event) => {
                  void displayNameField.onChange(event);
                  if (!form.getFieldState('trackedName').isDirty) {
                    form.setValue('trackedName', event.target.value, {
                      shouldValidate: true,
                    });
                  }
                }}
              />
              {displayName && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    onClick={() => {
                      form.setValue('displayName', '', {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      if (!form.getFieldState('trackedName').isDirty) {
                        form.setValue('trackedName', '', {
                          shouldValidate: true,
                        });
                      }
                    }}
                    aria-label="Clear display name"
                  >
                    <X />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
            {form.formState.errors.displayName && (
              <p className="text-destructive text-xs">
                {form.formState.errors.displayName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="competitor-domain">Domain</Label>
            <InputGroup aria-invalid={Boolean(form.formState.errors.domain)}>
              <InputGroupAddon className="px-2">
                {faviconUrl ? (
                  <Avatar className="bg-muted size-5 rounded-sm">
                    <AvatarImage src={faviconUrl} alt={`${domain} favicon`} />
                    <AvatarFallback className="rounded-sm">
                      <Globe className="size-3.5" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <Globe className="size-4" />
                )}
              </InputGroupAddon>
              <InputGroupInput
                id="competitor-domain"
                placeholder="e.g. acme.com"
                aria-invalid={Boolean(form.formState.errors.domain)}
                {...form.register('domain', {
                  required: 'Domain is required',
                  maxLength: {
                    value: 253,
                    message: 'Domain must be 253 characters or fewer',
                  },
                  pattern: {
                    value: DOMAIN_PATTERN,
                    message: 'Enter a valid domain without http or paths',
                  },
                })}
              />
              {domain && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    onClick={() =>
                      form.setValue('domain', '', {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    aria-label="Clear domain"
                  >
                    <X />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
            {form.formState.errors.domain && (
              <p className="text-destructive text-xs">
                {form.formState.errors.domain.message}
              </p>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="competitor-tracked-name">Tracked names</Label>
              <p className="text-muted-foreground text-xs">
                Names used to identify mentions in AI answers.
              </p>
            </div>
            <InputGroup
              aria-invalid={Boolean(form.formState.errors.trackedName)}
            >
              <InputGroupInput
                id="competitor-tracked-name"
                placeholder="e.g. Acme"
                aria-invalid={Boolean(form.formState.errors.trackedName)}
                {...form.register('trackedName', {
                  required: 'Tracked name is required',
                  maxLength: {
                    value: 100,
                    message: 'Tracked name must be 100 characters or fewer',
                  },
                })}
              />
              {trackedName && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    onClick={() =>
                      form.setValue('trackedName', '', {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    aria-label="Clear tracked name"
                  >
                    <X />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
            {form.formState.errors.trackedName && (
              <p className="text-destructive text-xs">
                {form.formState.errors.trackedName.message}
              </p>
            )}
          </div>

          {aliases.fields.map((field, index) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={`competitor-alias-${field.id}`}>
                Alias {index + 1}
              </Label>
              <InputGroup
                aria-invalid={Boolean(
                  form.formState.errors.aliases?.[index]?.value,
                )}
              >
                <InputGroupInput
                  id={`competitor-alias-${field.id}`}
                  placeholder="e.g. Acme Inc."
                  aria-invalid={Boolean(
                    form.formState.errors.aliases?.[index]?.value,
                  )}
                  {...form.register(`aliases.${index}.value`, {
                    required: 'Alias cannot be empty',
                    maxLength: {
                      value: 100,
                      message: 'Alias must be 100 characters or fewer',
                    },
                  })}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    onClick={() => aliases.remove(index)}
                    aria-label={`Remove alias ${index + 1}`}
                  >
                    <X />
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {form.formState.errors.aliases?.[index]?.value && (
                <p className="text-destructive text-xs">
                  {form.formState.errors.aliases[index]?.value?.message}
                </p>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => aliases.append({ value: '' })}
            disabled={aliases.fields.length >= 19}
          >
            <Plus />
            Add alias
          </Button>
        </section>
      </div>

      <SheetFooter className="flex-row justify-end border-t">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={createCompetitor.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="sm"
          loading={createCompetitor.isPending}
          disabled={!form.formState.isValid || createCompetitor.isPending}
        >
          Add competitor
        </Button>
      </SheetFooter>
    </form>
  );
}
