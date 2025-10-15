'use client';

import { ChevronRight, CircleCheck } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { SubmitHandler, useForm } from 'react-hook-form';

import { useGetStore } from '@/api/stores/get-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/utils/cn';

function IntegrationRow({
  title,
  imageUrl,
  isActive,
  className,
  ...props
}: React.ComponentProps<'button'> & {
  title: string;
  imageUrl: string;
  isActive?: boolean;
}) {
  return (
    <button
      {...props}
      className={cn(
        'hover:bg-surface-200/60 flex w-full cursor-pointer items-center justify-between px-6 py-4',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Image alt={title} src={imageUrl} height={22} width={22} />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="flex items-center gap-3">
        {isActive ? (
          <Badge variant={'success'} className="rounded-full">
            <CircleCheck className="mr-2 size-3" />
            Active
          </Badge>
        ) : (
          <Badge variant={'outline'} className="opacity-70">
            Inactive
          </Badge>
        )}
        <ChevronRight className="size-4" />
      </div>
    </button>
  );
}

type FormValues = { shop: string };

function ShopifyRow() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({ defaultValues: { shop: '' } });

  const { storeId } = useParams<{ storeId: string }>();
  const { data: store } = useGetStore(storeId);
  const connected = Boolean(store?.channel);

  const { push } = useRouter();

  const onSubmit: SubmitHandler<FormValues> = async ({ shop }) => {
    const q = new URLSearchParams({ shop }).toString();
    push(`/api/auth/shopify?${q}`);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <IntegrationRow
          title="Shopify"
          imageUrl="/icons/shopify.svg"
          isActive={connected}
        />
      </SheetTrigger>
      <SheetContent>
        <SheetHeader className="border-b">
          <div className="flex items-center gap-3">
            <Image
              alt={'Shopify'}
              src={'/icons/shopify.svg'}
              height={24}
              width={24}
            />
            <SheetTitle>Shopify</SheetTitle>
          </div>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 px-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="shopify-store-url">
                Shopify store URL
              </FieldLabel>
              <Input
                id="shopify-store-url"
                placeholder="your-store.myshopify.com"
                disabled={connected}
                {...register('shop', {
                  required: 'Store URL is required',
                  pattern: {
                    value: /^[a-z0-9-]+\.myshopify\.com$/,
                    message: 'Enter a valid Shopify store URL',
                  },
                })}
              />
              {errors.shop?.message && (
                <p className="text-destructive mt-1 text-sm">
                  {errors.shop.message}
                </p>
              )}
              <FieldDescription>
                This URL will be permanently linked to your store and cannot be
                changed later. If you need to update it in the future, please
                contact our support team.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
        <SheetFooter className="border-t">
          <div className="flex justify-end gap-3">
            <SheetClose asChild>
              <Button variant={'outline'} size={'xs'}>
                Cancel
              </Button>
            </SheetClose>
            <Button
              variant={'brand-secondary'}
              size={'xs'}
              disabled={isSubmitting || connected || !isValid}
              onClick={handleSubmit(onSubmit)}
              loading={isSubmitting}
            >
              Connect
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function IntegrationList() {
  return (
    <div className="rounded-lg border">
      <ShopifyRow />
      <IntegrationRow
        title="Google"
        imageUrl="/icons/google.svg"
        className="cursor-not-allowed"
      />
    </div>
  );
}
