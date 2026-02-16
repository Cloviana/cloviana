'use client';

import { MinimalHeader } from '@/app/_components/header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShopifyOnboardForm } from '@/features/shopify/components/shopify-onboard-form';

export default function OnboardingPage() {
  return (
    <main className="bg-studio flex min-h-screen flex-col">
      <header>
        <MinimalHeader />
      </header>
      <ScrollArea className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="mx-auto flex min-h-[500px] max-w-md flex-col gap-16">
          <div className="space-y-[2px] text-center font-semibold">
            <h1 className="text-center text-[21px]/7 font-semibold tracking-tight">
              Connect your store
            </h1>
            <div className="text-foreground/40 text-center text-[21px]/7 font-semibold tracking-tight">
              We'll set everything up for you automatically
            </div>
          </div>
          <div className="space-y-2">
            <Dialog>
              <DialogTrigger asChild>
                <Item variant="outline" className="cursor-pointer">
                  <ItemMedia>
                    <Avatar className="size-10">
                      <AvatarImage src="/icons/shopify.svg" />
                      <AvatarFallback delayMs={500}>S</AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>Shopify</ItemTitle>
                    <ItemDescription>
                      Connect your Shopify store to get started
                    </ItemDescription>
                  </ItemContent>
                </Item>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect Shopify</DialogTitle>
                </DialogHeader>
                <ShopifyOnboardForm />
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-foreground-lighter text-center text-xs">
            You'll be redirected to Shopify to authorize Cloviana. Your store,
            catalog, and settings will be synced automatically.
          </p>
        </div>
      </ScrollArea>
    </main>
  );
}
