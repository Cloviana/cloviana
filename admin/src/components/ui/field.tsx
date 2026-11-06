'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { useMemo } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

function FieldSet({ className, ...props }: React.ComponentProps<'fieldset'>) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        'flex flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=field-set-card]]:gap-3 has-[>[data-slot=radio-group]]:gap-3',
        className,
      )}
      {...props}
    />
  );
}

function FieldLegend({
  className,
  variant = 'legend',
  ...props
}: React.ComponentProps<'legend'> & {
  /** `section` is the compact title above a `FieldSetCard`. */
  variant?: 'legend' | 'label' | 'section';
}) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        'mb-3.5',
        variant === 'label' && 'text-body font-medium',
        variant === 'legend' && 'text-heading-small',
        variant === 'section' && 'text-heading-xsmall mb-1',
        className,
      )}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        'group/field-group @container/field-group flex w-full flex-col gap-5 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4',
        className,
      )}
      {...props}
    />
  );
}

const fieldVariants = cva(
  // While a field shows an error, the error takes the place of its helper text.
  'group/field flex w-full gap-1 data-[invalid=true]:text-text-danger has-[>[data-slot=field-error]]:[&>[data-slot=field-description]]:hidden',
  {
    variants: {
      orientation: {
        vertical:
          'flex-col *:w-full [&>.sr-only]:w-auto [&>[data-slot=field-label]+[data-slot=field-description]]:-mt-1',
        horizontal:
          'flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-0.5',
        responsive:
          'flex-col *:w-full @md/field-group:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-0.5',
      },
    },
    defaultVariants: {
      orientation: 'vertical',
    },
  },
);

function Field({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

function FieldContent({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-content"
      className={cn(
        'group/field-content flex flex-1 flex-col gap-0.5',
        className,
      )}
      {...props}
    />
  );
}

function FieldLabel({
  children,
  className,
  required = false,
  ...props
}: React.ComponentProps<typeof Label> & { required?: boolean }) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        'group/field-label peer/field-label group-data-[disabled=true]/field:text-text-disabled has-data-checked:border-border-selected has-data-checked:bg-background-selected has-data-[state=checked]:border-border-selected has-data-[state=checked]:bg-background-selected has-[>[data-slot=field]]:border-line has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-background-neutral-subtle-hovered has-data-checked:not-has-[:disabled,[data-disabled]]:hover:bg-background-selected-hovered has-data-[state=checked]:not-has-[:disabled,[data-disabled]]:hover:bg-background-selected-hovered has-[>[data-slot=field]]:has-[:focus-visible]:border-border-focused has-[>[data-slot=field]]:has-[:focus-visible]:ring-border-focused flex w-fit gap-[2px] text-sm has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:has-[:focus-visible]:ring-(length:--ds-border-width-focused) *:data-[slot=field]:p-3',
        'has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col',
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="text-text-danger">
          *
        </span>
      )}
    </Label>
  );
}

function FieldTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        'text-body group-data-[disabled=true]/field:text-text-disabled flex w-fit items-center gap-2 font-medium',
        className,
      )}
      {...props}
    />
  );
}

function FieldDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="field-description"
      className={cn(
        'text-text-subtlest text-left text-[13px] font-normal group-data-[orientation=horizontal]/field:text-balance [[data-variant=legend]+&]:-mt-1.5',
        '[&>a]:text-link-default [&>a:active]:text-link-pressed [&>a]:underline [&>a]:underline-offset-4',
        className,
      )}
      {...props}
    />
  );
}

function FieldSetDescription(props: React.ComponentProps<'p'>) {
  return (
    <FieldDescription
      data-slot="field-set-description"
      className="text-text-subtle text-sm"
      {...props}
    />
  );
}

/** The card around a field set's fields, below its legend and description. Give the field set an `aria-label` when it has no legend. */
function FieldSetCard({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card data-slot="field-set-card" className={className} {...props}>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  children?: React.ReactNode;
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        'text-body relative -my-2 h-5 group-data-[variant=outline]/field-group:-mb-2',
        className,
      )}
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="bg-surface text-text-subtlest relative mx-auto block w-fit px-2"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  );
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<'div'> & {
  errors?: Array<{ message?: string } | undefined>;
}) {
  const content = useMemo(() => {
    if (children) {
      return children;
    }

    if (!errors?.length) {
      return null;
    }

    const uniqueErrors = [
      ...new Map(errors.map((error) => [error?.message, error])).values(),
    ];

    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message;
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map(
          (error, index) =>
            error?.message && <li key={index}>{error.message}</li>,
        )}
      </ul>
    );
  }, [children, errors]);

  if (!content) {
    return null;
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn('text-text-danger text-[13px] font-medium', className)}
      {...props}
    >
      {content}
    </div>
  );
}

export {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldSetCard,
  FieldSetDescription,
  FieldContent,
  FieldTitle,
};
