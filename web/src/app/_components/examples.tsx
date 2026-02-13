'use client';

import Image from 'next/image';

import { cn } from '@/utils/cn';

interface ExamplesProps {
  className?: string;
}

export const Examples = ({ className }: ExamplesProps) => {
  return (
    <section className={cn('padding-global', className)}>
      <div className="padding-section-medium container">
        <div className="flex flex-col justify-between gap-6 md:flex-row">
          <h2 className="text-2xl font-medium md:w-1/2 md:text-3xl">
            Real output. Publish-ready from day one.
          </h2>
          <p className="text-muted-foreground leading-7 md:w-1/2">
            Every post is built around a buyer-intent keyword and written to
            naturally feature your products — structured, skimmable, and made to
            rank in Google and AI search. Tied to what you actually sell.
          </p>
        </div>

        <div className="bg-surface relative mt-10 overflow-hidden rounded-3xl p-3 !pb-0 md:p-8 lg:mt-16 lg:p-10">
          <div className="absolute inset-0 hidden">
            <Image
              src="/50ca8f27-85bf-436e-8515-98ad2ae40338.png"
              alt=""
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </div>

          <div className="relative z-10 aspect-video w-full">
            <Image
              src="https://cloviana-assets-czbfhwh7a2epccgb.z01.azurefd.net/landing/published-blog.png?v=2"
              alt="Cloviana draft preview"
              fill
              priority
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAECAYAAACzzX7wAAAAkElEQVR4AQCEAHv/AvLy8v/z8/P/9vb2/+7t7f/t7ez/7+/v//Dw8P/y9vn/Avz8+wD29fUAAwMDAPb18ADt5+AAvaSVAPXr3wAD/fcAAot2bQCjgWkA6eXiAPz27wDx3s4A9t7FAMetmwDx6+UAAnyQmQBrjKIAGx4hAAMIDwD+DBoAMVt8ACE+VAAIDRQAAAAA//+N0ecSAAAABklEQVQDAMXCSgEYS6BtAAAAAElFTkSuQmCC"
              className="rounded-t-2xl object-cover ring-6 ring-gray-300/30"
              sizes="(min-width: 1024px) 900px, 100vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
