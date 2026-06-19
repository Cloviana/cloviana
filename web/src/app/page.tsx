'use client';

import { Footer } from '@/components/layout/footer';
import { Navbar } from '@/components/layout/navbar';

import { AuditCta, FinalCta, Hero, Problem, Solution } from './_components';

export default function HomePage() {
  return (
    <div className="bg-background relative flex min-h-screen flex-col">
      <header className="sticky top-0 right-0 left-0 z-50">
        <Navbar />
      </header>

      <main className="flex-1 space-y-0">
        <Hero />
        <Problem />
        <Solution />
        <FinalCta />
      </main>
      <Footer />
      <AuditCta />
    </div>
  );
}
