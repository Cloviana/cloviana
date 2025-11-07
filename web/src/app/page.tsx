import FooterSection from '@/components/sections/footer/default';
import { Navbar } from '@/components/sections/navbar';

import {
  FinalCTA,
  Hero,
  Benefits,
  Testimonial,
  HowItWorks,
} from './_components';

export default function HomePage() {
  return (
    <div className="relative min-h-screen">
      <header className="sticky top-0 right-0 left-0 z-50">
        <Navbar />
      </header>
      <main className="bg-background">
        <Hero />
        <Benefits />
        <Testimonial />
        <HowItWorks />
        <FinalCTA />
      </main>
      <FooterSection />
    </div>
  );
}
