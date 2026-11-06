'use client';

import { MoreVerticalIcon } from 'lucide-react';
import { useState, type Dispatch, type SetStateAction } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { ProductFormValues } from '../use-product-form';

import {
  ProductOptionDialog,
  type ProductOption,
} from './product-option-dialog';
import { VariantOptionPicker } from './variant-option-picker';
import { VariantsTable, type VariantEdits } from './variants-table';

export function ProductOptions({
  edits,
  setEdits,
}: {
  edits: VariantEdits;
  setEdits: Dispatch<SetStateAction<VariantEdits>>;
}) {
  const { control, trigger } = useFormContext<ProductFormValues>();
  const { fields, append, update, remove } = useFieldArray({
    control,
    name: 'options',
  });
  const options = useWatch({ control, name: 'options' }) ?? [];
  const [editing, setEditing] = useState<{
    index?: number;
    option: ProductOption;
  } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {fields.length > 0 && (
        <Card size="sm" className="gap-0 py-0">
          <CardContent className="divide-border-default divide-y-(length:--ds-border-width) p-0">
            {fields.map((field, index) => {
              const option = options[index] ?? field;
              return (
                <div key={field.id} className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="font-medium">{option.name}</p>
                    <div className="flex flex-wrap gap-1">
                      {option.values.map((value) => (
                        <Badge key={value} variant="muted">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${option.name} option`}
                      >
                        <MoreVerticalIcon aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => setEditing({ index, option })}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => {
                          remove(index);
                          void trigger('options');
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
      <VariantOptionPicker
        variant="ghost"
        label={fields.length ? 'Add another option' : 'Add option'}
        onSelect={(option) =>
          setEditing({
            option: {
              name: option.name,
              values: option.values.map((value) => value.name),
            },
          })
        }
        onCreateCustomOption={() =>
          setEditing({ option: { name: '', values: [] } })
        }
      />
      <VariantsTable edits={edits} setEdits={setEdits} />
      {editing && (
        <ProductOptionDialog
          option={editing.option}
          index={editing.index}
          onClose={() => setEditing(null)}
          onSave={(option) => {
            if (editing.index === undefined)
              append(option, { shouldFocus: false });
            else update(editing.index, option);
            setEditing(null);
            void trigger('options');
          }}
        />
      )}
    </div>
  );
}
