export default async function HomePage() {
  const { redirect } = await import('next/navigation');
  const { paths } = await import('@/config/paths');
  redirect(paths.business.getHref());
}
