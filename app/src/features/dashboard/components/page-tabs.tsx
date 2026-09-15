'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export type PageTab = {
  value: string;
  label: string;
  href: string;
};

type PageTabsProps = {
  tabs: PageTab[];
};

export function PageTabs({ tabs }: PageTabsProps) {
  const pathname = usePathname();
  const activeTab = tabs.find((tab) => tab.href === pathname)?.value;

  return (
    <Tabs value={activeTab} className="gap-0">
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} asChild>
            <Link href={tab.href}>{tab.label}</Link>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
