import FooterSection from '@/components/sections/footer/default';
import { Navbar } from '@/components/sections/navbar';

import { FinalCTA, Hero, Overview, Testimonial } from './_components';

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 right-0 left-0 z-50">
        <Navbar />
      </header>
      <main className="bg-background">
        <Hero />
        <Overview />
        <Testimonial />
        {/*<Comparison /> */}
        <FinalCTA />
      </main>
      <FooterSection />
    </div>
  );
}
