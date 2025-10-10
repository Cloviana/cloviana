import { Footer, Navbar } from '@/components/layout';

import {
  Benefits,
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
        <PartneredBy className="border-b" />
        <Benefits />
        <Comparison className="bg-[#f9f9f9]" />
        <Testimonial />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
