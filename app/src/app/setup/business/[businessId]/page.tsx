import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';

export default function BusinessSetupDetailPage() {
  redirect(paths.business.getHref());
}
