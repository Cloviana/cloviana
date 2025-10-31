import FooterSection from '@/components/sections/footer/default';
import { Navbar } from '@/components/sections/navbar';

import {
  Comparison,
  FinalCTA,
  Hero,
  PartneredBy,
  Testimonial,
} from './_components';

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <header className="bg-background sticky top-0 right-0 left-0 z-50">
        <Navbar />
      </header>
      <main className="bg-background">
        <Hero />
        <PartneredBy />
        <Testimonial />
        <Comparison className="bg-[#f9f9f9]" />
        <FinalCTA />
      </main>
      <FooterSection />
    </div>
  );
}
