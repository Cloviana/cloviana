import { Footer, Navbar } from '@/components/layout';

import {
  FinalCTA,
  HatchCard,
  Hero,
  LogoWall,
  Problem,
  Product,
  Testimonial,
} from './_components';

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <header className="bg-background sticky top-0 right-0 left-0 z-50">
        <Navbar />
      </header>
      <div role="main">
        <Hero />
        <LogoWall />
        <div className="border-dashed-wide h-8 w-full border-t border-b">
          <HatchCard />
        </div>
        <Problem />
        <section className="relative mt-0 flex flex-col bg-white">
          <div className="sticky top-[6.875rem] z-0 mb-[6rem]" />
          <Product
            className="top-[3.55rem] -mt-[6rem] mb-[15rem]"
            variant={'green'}
            title="Build custom workflows that adapt to every customer"
            paragraph="Trigger emails, update CRM records, and assign leads based on product usage, enrichment data, and more — all without writing code."
            image={{
              src: '/product-1.png',
              alt: 'product',
            }}
          />
          <Product
            className="top-[6.0075rem] -mt-[15rem] mb-[11rem] -translate-y-[1rem]"
            variant={'purple'}
            title="Build custom workflows that adapt to every customer"
            paragraph="Trigger emails, update CRM records, and assign leads based on product usage, enrichment data, and more — all without writing code."
            image={{
              src: '/product-1.png',
              alt: 'product',
            }}
          />
          <Product
            className="top-[8.2125rem] -mt-[11rem] mb-[7rem] -translate-y-[2rem]"
            variant={'blue'}
            title="Build custom workflows that adapt to every customer"
            paragraph="Trigger emails, update CRM records, and assign leads based on product usage, enrichment data, and more — all without writing code."
            image={{
              src: '/product-1.png',
              alt: 'product',
            }}
          />
          <Product
            className="top-[9.2875rem] -mt-[7rem] mb-[3rem] -translate-y-[3rem]"
            variant={'red'}
            title="Build custom workflows that adapt to every customer"
            paragraph="Trigger emails, update CRM records, and assign leads based on product usage, enrichment data, and more — all without writing code."
            image={{
              src: '/product-1.png',
              alt: 'product',
            }}
          />
        </section>
        <Testimonial />
        <FinalCTA />
      </div>
      <Footer />
    </div>
  );
}
