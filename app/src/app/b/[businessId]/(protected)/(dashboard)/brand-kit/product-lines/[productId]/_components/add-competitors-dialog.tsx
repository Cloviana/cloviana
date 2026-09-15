'use client';

import { Globe, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { getBrandKitError } from '@/features/brand-kit/api/brand-kit-error';
import {
  useCreateCompetitor,
  useGetCompetitors,
} from '@/features/brand-kit/api/competitors';
import { useAddProductCompetitor } from '@/features/brand-kit/api/product-competitors';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import { COMPETITOR_DOMAIN_PATTERN } from '@/features/brand-kit/utils/competitor';
import type { Competitor } from '@/types/api';
import { getFaviconUrl, normalizeDomain } from '@/utils/domain';

type NewCompetitorForm = {
  name: string;
  domain: string;
};

type AddCompetitorsDialogProps = {
  businessId: string;
  productId: string;
};

export function AddCompetitorsDialog({
  businessId,
  productId,
}: AddCompetitorsDialogProps) {
  const { draft, setDraft } = useBrandKitDraft();
  const competitorsQuery = useGetCompetitors(businessId);
  const competitors = competitorsQuery.data ?? [];
  const product = draft.products.find((item) => item.id === productId);
  const attachedCompetitorIds = new Set(product?.competitorBrandIds ?? []);
  const comboboxAnchor = useComboboxAnchor();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCompetitors, setSelectedCompetitors] = useState<Competitor[]>(
    [],
  );
  const [isAdding, setIsAdding] = useState(false);
  const form = useForm<NewCompetitorForm>({
    mode: 'onSubmit',
    defaultValues: { name: '', domain: '' },
  });
  const domainValue = useWatch({ control: form.control, name: 'domain' });
  const faviconDomain = normalizeDomain(domainValue.trim().toLowerCase());
  const faviconUrl = COMPETITOR_DOMAIN_PATTERN.test(domainValue.trim())
    ? getFaviconUrl(faviconDomain)
    : undefined;
  const addProductCompetitor = useAddProductCompetitor({
    mutationConfig: {
      onSuccess: ({ item }) => {
        setDraft((previous) => ({
          ...previous,
          products: previous.products.map((currentProduct) =>
            currentProduct.id === item.id ? item : currentProduct,
          ),
        }));
      },
    },
  });
  const createCompetitor = useCreateCompetitor();
  const isPending =
    isAdding || addProductCompetitor.isPending || createCompetitor.isPending;

  function resetDialog() {
    setCreating(false);
    setSearch('');
    setSelectedCompetitors([]);
    form.reset();
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && isPending) return;

    setOpen(nextOpen);
    if (!nextOpen) resetDialog();
  }

  async function attachCompetitor(competitorId: string) {
    await addProductCompetitor.mutateAsync({
      businessId,
      productId,
      brandId: competitorId,
    });
  }

  async function addSelectedCompetitors() {
    setIsAdding(true);

    try {
      for (const competitor of selectedCompetitors) {
        await attachCompetitor(competitor.id);
        setSelectedCompetitors((current) =>
          current.filter((item) => item.id !== competitor.id),
        );
      }

      toast.success(
        selectedCompetitors.length === 1
          ? 'Competitor added'
          : `${selectedCompetitors.length} competitors added`,
      );
      setOpen(false);
      resetDialog();
    } catch (error) {
      toast.error(getBrandKitError(error, 'Could not add competitors'));
    } finally {
      setIsAdding(false);
    }
  }

  async function createAndAttachCompetitor(values: NewCompetitorForm) {
    const name = values.name.trim().replace(/\s+/g, ' ');
    const domain = normalizeDomain(values.domain.trim().toLowerCase());
    const existingCompetitor = competitors.find(
      (competitor) => normalizeDomain(competitor.domain) === domain,
    );

    setIsAdding(true);

    try {
      if (existingCompetitor) {
        if (!attachedCompetitorIds.has(existingCompetitor.id)) {
          await attachCompetitor(existingCompetitor.id);
          toast.success('Existing competitor added');
        } else {
          toast.info('This competitor is already added to the product');
        }
      } else {
        const result = await createCompetitor.mutateAsync({
          businessId,
          name,
          domain,
          aliases: [name],
        });
        await attachCompetitor(result.item.id);
        toast.success('Competitor created and added');
      }

      setOpen(false);
      resetDialog();
    } catch (error) {
      toast.error(
        getBrandKitError(error, 'Could not create and add competitor'),
      );
    } finally {
      setIsAdding(false);
    }
  }

  function showCreateForm() {
    form.reset({ name: search.trim(), domain: '' });
    setCreating(true);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="primary">
          <Plus />
          Add Competitor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {creating ? 'Create Competitor' : 'Add Competitors'}
          </DialogTitle>
          <DialogDescription>
            {creating
              ? 'Create a competitor and add it to this product.'
              : 'Add competitors already tracked in this Brand Kit, or create a new one.'}
          </DialogDescription>
        </DialogHeader>

        {creating ? (
          <form onSubmit={form.handleSubmit(createAndAttachCompetitor)}>
            <DialogBody>
              <FieldGroup className="gap-5">
                <Field data-invalid={Boolean(form.formState.errors.name)}>
                  <FieldLabel htmlFor="new-competitor-name">
                    Display name
                  </FieldLabel>
                  <Input
                    id="new-competitor-name"
                    placeholder="e.g. Acme"
                    aria-invalid={Boolean(form.formState.errors.name)}
                    {...form.register('name', {
                      required: 'Display name is required',
                      maxLength: {
                        value: 200,
                        message: 'Display name must be 200 characters or fewer',
                      },
                    })}
                  />
                  <FieldError errors={[form.formState.errors.name]} />
                </Field>

                <Field data-invalid={Boolean(form.formState.errors.domain)}>
                  <FieldLabel htmlFor="new-competitor-domain">
                    Domain
                  </FieldLabel>
                  <InputGroup
                    aria-invalid={Boolean(form.formState.errors.domain)}
                  >
                    <InputGroupAddon className="px-2">
                      {faviconUrl ? (
                        <Avatar className="bg-muted size-5 rounded-sm">
                          <AvatarImage
                            src={faviconUrl}
                            alt={`${faviconDomain} favicon`}
                          />
                          <AvatarFallback className="rounded-sm">
                            <Globe className="size-3.5" />
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <Globe className="size-4" />
                      )}
                    </InputGroupAddon>
                    <InputGroupInput
                      id="new-competitor-domain"
                      placeholder="e.g. acme.com"
                      aria-invalid={Boolean(form.formState.errors.domain)}
                      {...form.register('domain', {
                        required: 'Domain is required',
                        maxLength: {
                          value: 253,
                          message: 'Domain must be 253 characters or fewer',
                        },
                        pattern: {
                          value: COMPETITOR_DOMAIN_PATTERN,
                          message: 'Enter a valid domain without http or paths',
                        },
                      })}
                    />
                  </InputGroup>
                  <FieldDescription>
                    Used to identify the brand and display its logo.
                  </FieldDescription>
                  <FieldError errors={[form.formState.errors.domain]} />
                </Field>
              </FieldGroup>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setCreating(false)}
              >
                Back
              </Button>
              <Button
                type="submit"
                size="sm"
                loading={isPending}
                disabled={isPending}
              >
                Create and Add
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <CompetitorPicker
            competitors={competitors}
            loading={competitorsQuery.isPending}
            attachedCompetitorIds={attachedCompetitorIds}
            selectedCompetitors={selectedCompetitors}
            isPending={isPending}
            anchor={comboboxAnchor}
            onSelectedCompetitorsChange={setSelectedCompetitors}
            onSearchChange={setSearch}
            onCreate={showCreateForm}
            onCancel={() => handleOpenChange(false)}
            onAdd={addSelectedCompetitors}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type CompetitorPickerProps = {
  competitors: Competitor[];
  loading: boolean;
  attachedCompetitorIds: Set<string>;
  selectedCompetitors: Competitor[];
  isPending: boolean;
  anchor: ReturnType<typeof useComboboxAnchor>;
  onSelectedCompetitorsChange: (competitors: Competitor[]) => void;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
  onCancel: () => void;
  onAdd: () => void;
};

function CompetitorPicker({
  competitors,
  loading,
  attachedCompetitorIds,
  selectedCompetitors,
  isPending,
  anchor,
  onSelectedCompetitorsChange,
  onSearchChange,
  onCreate,
  onCancel,
  onAdd,
}: CompetitorPickerProps) {
  return (
    <>
      <DialogBody>
        <Field>
          <FieldLabel htmlFor="competitor-picker">Competitors</FieldLabel>
          <Combobox
            multiple
            items={competitors}
            value={selectedCompetitors}
            onValueChange={onSelectedCompetitorsChange}
            onInputValueChange={onSearchChange}
            itemToStringLabel={(competitor: Competitor) =>
              `${competitor.name} ${normalizeDomain(competitor.domain)}`
            }
            isItemEqualToValue={(competitor: Competitor, value: Competitor) =>
              competitor.id === value.id
            }
          >
            <ComboboxChips ref={anchor}>
              {selectedCompetitors.map((competitor) => (
                <ComboboxChip key={competitor.id}>
                  {competitor.name}
                </ComboboxChip>
              ))}
              <ComboboxChipsInput
                id="competitor-picker"
                placeholder={
                  selectedCompetitors.length === 0
                    ? 'Search by name or domain...'
                    : undefined
                }
              />
            </ComboboxChips>
            <ComboboxContent anchor={anchor} className="z-[60]">
              <ComboboxEmpty>
                {loading ? 'Loading competitors...' : 'No competitors found.'}
              </ComboboxEmpty>
              <ComboboxList>
                {(competitor: Competitor) => {
                  const attached = attachedCompetitorIds.has(competitor.id);

                  return (
                    <ComboboxItem
                      key={competitor.id}
                      value={competitor}
                      disabled={attached}
                      className="py-2"
                    >
                      <Avatar className="size-6 shrink-0 rounded-md">
                        <AvatarImage
                          src={getFaviconUrl(competitor.domain)}
                          alt=""
                        />
                        <AvatarFallback className="rounded-md text-xs font-medium">
                          {competitor.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium">
                          {competitor.name}
                        </div>
                        <div className="text-muted-foreground truncate text-xs">
                          {normalizeDomain(competitor.domain)}
                        </div>
                      </div>
                      {attached && (
                        <Badge variant="muted" size="sm">
                          Added
                        </Badge>
                      )}
                    </ComboboxItem>
                  );
                }}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <FieldDescription>
            Search competitors already tracked in this Brand Kit.
          </FieldDescription>
        </Field>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={onCreate}
        >
          <Plus />
          Create New Competitor
        </Button>
      </DialogBody>
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          loading={isPending}
          disabled={selectedCompetitors.length === 0 || isPending}
          onClick={onAdd}
        >
          Add {selectedCompetitors.length || ''}{' '}
          {selectedCompetitors.length === 1 ? 'competitor' : 'competitors'}
        </Button>
      </DialogFooter>
    </>
  );
}
