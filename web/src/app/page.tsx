import { Footer, Navbar } from '@/components/layout';

import {
  Hero,
  Features,
  Trusted,
  ValueProposition,
  Testimonial,
  FinalCTA,
} from './_components';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="py-14">
        <Hero />
        <Trusted className="mb-8" storeCount={100} />
        <div className={'my-16 border-y bg-white py-8 shadow-inner'}>
          <ValueProposition />
        </div>
        <Features className="my-24" />
        <Testimonial
          testimonials={[
            {
              displayName: 'Tom Gray',
              logo: { url: '/logos/New Scientist_idGmamynOX_1.svg' },
              title: 'E‑commerce Manager, New Scientist Shop',
              testimonial:
                'Our two‑person web team used the beta to generate science‑gift keyword clusters and draft blog posts in minutes. Organic impressions are already up 8 % and we’re feeding real‑world feedback straight to the devs.',
              avatar: { url: '/person/person-001.png', alignment: 'top' },
            },
            {
              displayName: 'Evan Miller',
              logo: { url: '/logos/casper.png', height: 28 },
              title: 'Growth Analyst, Casper (Accessories Store)',
              testimonial:
                'We trialed the AI writer on a small Shopify microsite for bedding add‑ons. It cut content production from days to hours and got a new mattress‑protector article indexed inside a week.',
              avatar: { url: '/person/person-002.png', alignment: 'top' },
            },
            {
              displayName: 'Diego Sanchez',
              logo: { url: '/logos/overtone.png', height: 28 },
              title: 'Digital Marketing Lead, oVertone',
              testimonial:
                'With a four‑person team, targeting long‑tail color‑care queries was tough. The beta’s keyword engine surfaced niches we’d missed and early data shows a 10 % lift in organic clicks.',
              avatar: { url: '/person/person-003.jpg', alignment: 'center' },
            },
            {
              displayName: 'Mark Adams',
              logo: { url: '/logos/Christianity Today_Logo_0.svg' },
              title: 'E‑commerce Specialist, Christianity Today Store',
              testimonial:
                'The agent built keyword clusters for our Bible‑study guides and drafted preview articles we can embed on product pages—already saving hours each week while we help shape new features.',
              avatar: { url: '/person/person-004.jpg', alignment: 'top' },
            },
          ]}
        />
        <FinalCTA className="mt-24" />
      </main>
      <Footer />
    </div>
  );
}
