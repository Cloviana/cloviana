import Image from 'next/image';
import React from 'react';

import { Globe } from '@/components/ui/globe';
import { cn } from '@/lib/utils';

export function HowItWorks({ className }: { className?: string }) {
  return (
    <section className={cn('padding-global', className)}>
      <div className="padding-section-medium container">
        <div className="mx-auto mb-8 flex flex-col items-center gap-y-3 text-center">
          <h2 className="max-w-[27ch] text-2xl font-medium md:text-3xl lg:text-4xl">
            Set it up once. Let it run.
          </h2>
          <p className="text-muted-foreground max-w-[60ch] text-base">
            Three steps to get your SEO engine running. After that, Cloviana
            handles everything — while you focus on the rest of your business.
          </p>
        </div>
        <div className="mx-auto grid gap-10 lg:grid-cols-3">
          <div className="bg-surface order-1 flex aspect-[4/5] h-full items-center overflow-hidden rounded-lg lg:order-none">
            <Image
              src="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/how-it-works/connect.png?v=2"
              alt="Connect your Shopify store to Cloviana and sync your product catalog"
              width={720}
              height={900}
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAKCAYAAACJxx+AAAAAwUlEQVR4AZTOsQsBURwHcHccdfWS8iKDwaYM6jIxvOXKdJMom+X+AuUfYBPFLTdaZdMrZfDK8P4DNxjIpPTK5Eo43uCl3qD71W/49vv07adG/kw4YC8NvTc3kr+losF2DQ0GwH6q+qw1LhW/SIBMHparhUYfaNAKXkpNAqko1EEiHffvN+UDkAQO1+Nu5bld34MnoGb3Epg2t5eBtZnUK+2zmeuYCKEYR+IHHvg6jjOklK4JIQ+eJYAxXjDGRvzI9w0AAP//rQAL8wAAAAZJREFUAwCTTTM1ww2apAAAAABJRU5ErkJggg=="
              className="h-auto"
            />
          </div>
          <div className="bg-surface order-3 flex aspect-[4/5] h-full items-center overflow-hidden rounded-lg lg:order-none">
            <Image
              src="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/how-it-works/autopilot.png?v=3"
              alt="Cloviana autopilot scheduling interface for automated SEO content publishing"
              width={720}
              height={900}
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAKCAYAAACJxx+AAAAAnUlEQVR4AYSPSQoEIQxFo9QIurEv0vdoqJv2ou7iylsoggMObQLVUKsKvIX68hM5PNSz4Jx7GWM+Wusjxnj03m/weZ7fUsqvUuqstf4ppZwIjdj3nQkhYF1X2ohzDtM0ESQwxuiQcwYkpQQXJIxouhjjYNs2AtMQjlHLslDCWBJCCNBag6soAaWxByAo4+P4DSAkYJe1Frz3t24UfwAAAP//J8jwFQAAAAZJREFUAwAI5F12a07M7QAAAABJRU5ErkJggg=="
              className="h-auto"
            />
          </div>

          <div className="bg-surface relative order-5 flex aspect-[4/5] h-full min-h-[220px] items-center overflow-hidden rounded-lg lg:order-none">
            <Globe className="inset-auto top-1/2 left-1/2 w-[130%] -translate-x-1/2 -translate-y-1/2 p-10" />
          </div>
          <div className="order-2 -mt-6 max-w-[412px] lg:order-none">
            <h3 className="mb-3 text-2xl font-medium lg:mb-6">
              Connect your Shopify store
            </h3>
            <p className="mb-6">
              Sync your products and collections in minutes. Cloviana uses your
              catalog to create content that matches what you actually sell.
            </p>
          </div>
          <div className="order-4 -mt-6 max-w-[412px] lg:order-none">
            <h3 className="mb-3 text-2xl font-medium lg:mb-6">
              Set up autopilot
            </h3>
            <p className="mb-6">
              Choose what to promote, your posting days, and content type.
              Cloviana handles keyword selection and planning automatically.
            </p>
          </div>
          <div className="order-6 -mt-6 max-w-[412px] lg:order-none">
            <h3 className="mb-3 text-2xl font-medium lg:mb-6">
              Watch your rankings grow
            </h3>
            <p className="mb-6">
              New drafts arrive on your schedule. Spend a few minutes reviewing,
              publish with one click, then get back to work. Cloviana keeps
              writing and ranking — every week, without you.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
