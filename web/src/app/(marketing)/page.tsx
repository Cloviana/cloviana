import type { Metadata } from 'next';
import { Fragment } from 'react';

import { FinalCta, Hero, Problem, Solution } from './_components';

export const metadata: Metadata = {
  alternates: { canonical: 'https://cloviana.com' },
};

export default function HomePage() {
  return (
    <Fragment>
      <Hero />
      <Problem />
      <Solution />
      <FinalCta />
    </Fragment>
  );
}
