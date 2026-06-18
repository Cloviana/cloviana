import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';

export default function StartBusinessSetupPage() {
  redirect(paths.business.getHref());
}
