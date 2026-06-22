import { Fragment } from 'react';

import { FinalCta, Hero, Problem, Solution } from './_components';

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
