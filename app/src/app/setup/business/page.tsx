import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';

export default function WelcomePage() {
  redirect(paths.business.getHref());
}
