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
            title="Win the right keywords — fast"
            paragraph="Cloviana scans your niche, competitors, and catalog to surface terms you can rank for now—complete with intent, difficulty, and product fit."
            image={{
              src: 'https://cloviana-assets.azureedge.net/assets/keywords.png',
              alt: 'Keywords',
              blurDataURL:
                'data:image/webp;base64,UklGRi4AAABXRUJQVlA4ICIAAAAwAQCdASoKAAUAAUAmJaQAA3AA/vyrVJGf/ianLyzyAgAA',
            }}
          />
          <Product
            className="top-[6.0075rem] -mt-[15rem] mb-[11rem] -translate-y-[1rem]"
            variant={'purple'}
            title="On-brand blogs, written for you"
            paragraph="Cloviana drafts full articles fast—headings, meta, links, and alt text—optimized to read well for people and rank in search."
            image={{
              src: 'https://cloviana-assets.azureedge.net/assets/blog-editor.png',
              alt: 'Blog Editor',
              blurDataURL:
                'data:image/webp;base64,UklGRjgAAABXRUJQVlA4ICwAAACQAQCdASoKAAUAAUAmJaQAAtzDOzQA/v4SK3aniNukq8QzdfL9kw/YoAAAAA==',
            }}
          />
          <Product
            className="top-[8.2125rem] -mt-[11rem] mb-[7rem] -translate-y-[2rem]"
            variant={'blue'}
            title="Publish to Shopify in one click"
            paragraph="Publish directly to Shopify—posts, images, SEO fields, and product links sync automatically, with clean slugs and updates as you grow."
            image={{
              src: 'https://cloviana-assets.azureedge.net/assets/integration.png',
              alt: 'Integration',
              blurDataURL:
                'data:image/webp;base64,UklGRioAAABXRUJQVlA4IB4AAACQAQCdASoKAAUAAUAmJaQAAudFrAAA/v70RI80AAA=',
            }}
          />
          <Product
            className="top-[9.2875rem] -mt-[7rem] mb-[3rem] -translate-y-[3rem]"
            variant={'red'}
            title="Ultra-realistic images, on brand"
            paragraph="Generate studio-grade blog visuals in your brand style—realistic, SEO-ready images with alt text and Shopify-fit sizes."
            image={{
              src: 'https://cloviana-assets.azureedge.net/assets/images.png',
              alt: 'Product Images',
              blurDataURL:
                'data:image/webp;base64,UklGRmQAAABXRUJQVlA4IFgAAADQAQCdASoKAAUAAUAmJaACdAEfUBkzIAD+raXg+bMbK2h3znQ+7vAc2SmuLw+Gw1XwPo/s87aOU5Fe+t7FCbKWdBuv35v5J8qnwqzl+TyHRB3Jge4ZAAAA',
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
