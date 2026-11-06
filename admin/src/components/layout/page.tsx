import type { ComponentProps } from 'react';

import { TabsList } from '@/components/ui/tabs';
import { Heading, Text } from '@/components/ui/typography';
import { cn } from '@/lib/utils';

function Page({
  width = 'default',
  scroll = 'content',
  className,
  ...props
}: ComponentProps<'div'> & {
  width?: 'default' | 'narrow' | 'full';
  scroll?: 'content' | 'page';
}) {
  const page = (
    <div
      data-slot="page"
      data-scroll={scroll}
      className={cn(
        'group/page mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col gap-1.5 pt-1',
        width === 'default' && 'max-w-5xl',
        width === 'narrow' && 'max-w-3xl',
        width === 'full' && 'max-w-none',
        className,
      )}
      {...props}
    />
  );

  return scroll === 'page' ? (
    <div className="no-scrollbar min-h-0 w-full min-w-0 flex-1 overflow-y-auto">
      {page}
    </div>
  ) : (
    page
  );
}

function PageHeader({ className, ...props }: ComponentProps<'header'>) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        'flex flex-col pt-2 group-data-[scroll=page]/page:shrink-0',
        className,
      )}
      {...props}
    />
  );
}

function PageHeaderRow({
  children,
  size = 'default',
  layout = 'inline',
  className,
  ...props
}: ComponentProps<'div'> & {
  size?: 'default' | 'compact';
  layout?: 'inline' | 'stacked';
}) {
  return (
    <div
      data-slot="page-header-row"
      className={cn(
        'flex shrink-0 pr-4 pl-6',
        layout === 'stacked'
          ? 'flex-col items-start gap-1 py-2'
          : 'items-center gap-2 py-0',
        size === 'compact' ? 'min-h-8' : 'min-h-(--app-header-height)',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

function PageBreadcrumbs(props: ComponentProps<'div'>) {
  return <div data-slot="page-breadcrumbs" {...props} />;
}

function PageTitle({ className, ...props }: ComponentProps<'h1'>) {
  return (
    <Heading
      as="h1"
      variant="page"
      data-slot="page-title"
      className={className}
      {...props}
    />
  );
}

function PageDescription({ className, ...props }: ComponentProps<'p'>) {
  return (
    <Text
      variant="description"
      data-slot="page-description"
      className={className}
      {...props}
    />
  );
}

function PageActions({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-actions"
      className={cn('ml-auto flex items-center gap-2', className)}
      {...props}
    />
  );
}

function PageTabs({
  className,
  ...props
}: Omit<ComponentProps<typeof TabsList>, 'variant' | 'className'> & {
  className?: string;
}) {
  return (
    <PageHeaderRow
      data-slot="page-tabs"
      className={cn(
        'border-b-line border-border-default w-full min-w-0',
        className,
      )}
    >
      <TabsList
        variant="line"
        className="-mb-(--ds-border-width) min-w-0 flex-1 justify-start gap-6 overflow-x-auto p-0 group-data-[orientation=horizontal]/tabs:h-(--app-header-height) [&>[data-slot=tabs-trigger]]:h-full [&>[data-slot=tabs-trigger]]:flex-none [&>[data-slot=tabs-trigger]]:rounded-none [&>[data-slot=tabs-trigger]]:px-0 [&>[data-slot=tabs-trigger]]:py-0 [&>[data-slot=tabs-trigger]]:after:-bottom-(--ds-border-width) [&>[data-slot=tabs-trigger]]:focus-visible:ring-inset"
        {...props}
      />
    </PageHeaderRow>
  );
}

// A div, not a main: SidebarInset already renders the page's <main>.
// The bottom padding keeps the last content clear of the floating action bar, which sits 16px
// from the bottom edge and is about 48px tall.
function PageContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="page-content"
      className={cn(
        'no-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-4 pb-24 pl-6 group-data-[scroll=page]/page:flex-none group-data-[scroll=page]/page:overflow-visible',
        className,
      )}
      {...props}
    />
  );
}

export {
  Page,
  PageActions,
  PageBreadcrumbs,
  PageContent,
  PageDescription,
  PageHeader,
  PageHeaderRow,
  PageTabs,
  PageTitle,
};
