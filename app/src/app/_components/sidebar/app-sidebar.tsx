'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { paths } from '@/config/paths';
import { useGetBusiness } from '@/features/businesses/api/get-business';
import { cn } from '@/utils/cn';

/* ─── Inline SVG icons matching the template exactly ─── */

function IconOverview({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.33301 10.667C9.33301 9.9306 8.7364 9.33301 8 9.33301C7.26363 9.33305 6.667 9.93062 6.667 10.667V12.667H9.33301V10.667ZM10.667 12.6641C10.9638 12.662 11.1969 12.6576 11.3926 12.6416C11.6846 12.6177 11.8342 12.5746 11.9385 12.5215C12.1893 12.3937 12.3937 12.1894 12.5215 11.9385C12.5746 11.8342 12.6178 11.6846 12.6416 11.3926C12.6661 11.0926 12.667 10.7046 12.667 10.1338V6.85645C12.667 6.26094 12.6615 6.08669 12.6201 5.93458C12.5784 5.78186 12.5092 5.63747 12.417 5.5088C12.3251 5.38053 12.1932 5.26661 11.7305 4.89063L9.59766 3.15723C9.23039 2.85886 8.98228 2.65741 8.77735 2.51466C8.57961 2.37693 8.45924 2.32093 8.35938 2.29298C8.12434 2.22719 7.87567 2.22718 7.64063 2.29298C7.54076 2.32094 7.42044 2.3769 7.22266 2.51466C7.01773 2.65741 6.76958 2.85886 6.40235 3.15723L4.26954 4.89063C3.8068 5.2666 3.67495 5.38053 3.58301 5.5088C3.49082 5.63745 3.42255 5.78188 3.38086 5.93458C3.33937 6.08673 3.33301 6.26067 3.33301 6.85645V10.1338C3.33301 10.7046 3.33391 11.0926 3.3584 11.3926C3.38226 11.6846 3.42546 11.8342 3.47852 11.9385C3.60635 12.1894 3.81064 12.3937 4.06153 12.5215C4.16579 12.5746 4.31528 12.6177 4.60743 12.6416C4.80307 12.6576 5.03618 12.662 5.33301 12.6641V10.667C5.33301 9.19429 6.52727 8.00004 8 8.00001C9.47274 8.00001 10.667 9.19427 10.667 10.667V12.6641ZM14 10.1338C14 10.6825 14.0007 11.1342 13.9707 11.501C13.9401 11.8757 13.8739 12.2204 13.709 12.544C13.4533 13.0456 13.0456 13.4533 12.5439 13.709C12.2203 13.8739 11.8757 13.9401 11.501 13.9707C11.1342 14.0007 10.6825 14 10.1338 14H5.86719C5.31823 14 4.86595 14.0007 4.49903 13.9707C4.1243 13.9401 3.77961 13.8739 3.45606 13.709C2.95439 13.4533 2.54666 13.0456 2.29102 12.544C2.12616 12.2204 2.05992 11.8757 2.0293 11.501C1.99935 11.1342 2 10.6825 2 10.1338V6.85645C2 6.33372 1.99414 5.94803 2.09375 5.58301C2.17718 5.27746 2.3145 4.98888 2.49903 4.73145C2.71952 4.42387 3.02294 4.18518 3.42872 3.85548L5.56153 2.12208C5.91354 1.83607 6.2053 1.59834 6.45997 1.42091C6.72155 1.23866 6.98139 1.09274 7.28125 1.0088C7.75132 0.877225 8.24869 0.877247 8.71875 1.0088C9.01862 1.09274 9.27844 1.23866 9.54004 1.42091C9.7947 1.59835 10.0864 1.83603 10.4385 2.12208L12.5713 3.85548C12.9771 4.18516 13.2805 4.42389 13.501 4.73145C13.6855 4.98888 13.8229 5.27746 13.9063 5.58301C14.0059 5.94803 14 6.33371 14 6.85645V10.1338Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconPrompts({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M5.33333 2.66667H4.66666C3.5621 2.66667 2.66666 3.56211 2.66666 4.66667V5.33334"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6667 2.66667H11.3333C12.4379 2.66667 13.3333 3.56211 13.3333 4.66667V5.33334"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.3333 10.6667V11.3333C13.3333 12.4379 12.4379 13.3333 11.3333 13.3333H10.6667"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.33333 13.3333H4.66666C3.5621 13.3333 2.66666 12.4379 2.66666 11.3333V10.6667"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 6.66667H10"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 9.33333H8.66667"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconDomains({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M14 8C14 11.3137 11.3137 14 8 14M14 8C14 4.68629 11.3137 2 8 2M14 8H2M8 14C4.68629 14 2 11.3137 2 8M8 14C6.52724 14 5.33333 11.3137 5.33333 8C5.33333 4.68629 6.52724 2 8 2M8 14C9.47273 14 10.6667 11.3137 10.6667 8C10.6667 4.68629 9.47273 2 8 2M8 2C4.68629 2 2 4.68629 2 8"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="square"
      />
    </svg>
  );
}

function IconUrls({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M4.31152 6.08203C5.61257 4.78155 7.72151 4.78138 9.02246 6.08203L9.25195 6.31054V6.31152C9.79546 6.85538 10.1123 7.54225 10.2012 8.25097C10.2468 8.61524 9.98822 8.94733 9.62402 8.99316C9.2597 9.0387 8.92752 8.78033 8.88183 8.41601C8.82839 7.9901 8.63894 7.57852 8.31152 7.25097V7.25195L8.08203 7.02246C7.30048 6.24121 6.0336 6.24137 5.25195 7.02246L3.02246 9.25195C2.24123 10.0336 2.24117 11.3004 3.02246 12.082L3.25195 12.3105V12.3115C4.03358 13.0925 5.30051 13.0926 6.08203 12.3115V12.3105L6.19726 12.1963C6.45706 11.9372 6.87823 11.9377 7.13769 12.1973C7.39664 12.457 7.39609 12.8782 7.13671 13.1377L7.02246 13.2519C5.72154 14.5525 3.61254 14.5523 2.31152 13.2519L2.08203 13.0225C0.781349 11.7215 0.781399 9.61256 2.08203 8.31152L4.31152 6.08203ZM8.97753 3.41504C10.2786 2.11438 12.3885 2.11422 13.6894 3.41504L13.918 3.64453C15.2188 4.94551 15.2186 7.05439 13.918 8.35546L11.6894 10.585C10.3884 11.8858 8.27856 11.8858 6.97753 10.585L6.74902 10.3555C6.20523 9.8116 5.88764 9.12488 5.79882 8.41601C5.75334 8.05182 6.01184 7.71965 6.37597 7.67382C6.74013 7.62845 7.07337 7.88684 7.11913 8.25097C7.17256 8.67675 7.36207 9.08759 7.68945 9.41504L7.91796 9.64453C8.6996 10.426 9.96735 10.4259 10.749 9.64453L12.9775 7.41504C13.7588 6.63335 13.7589 5.36654 12.9775 4.58496L12.749 4.35547C11.9674 3.57405 10.6996 3.57421 9.91796 4.35547L9.80371 4.46972C9.54411 4.72942 9.12304 4.73019 8.86328 4.4707C8.60361 4.21114 8.6039 3.79004 8.86328 3.53027L8.97753 3.41504Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconGap({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.196 10.1963C10.4557 9.93659 10.8777 9.93659 11.1374 10.1963L13.1374 12.1963C13.1682 12.2271 13.1952 12.2615 13.2195 12.2979C13.344 12.4843 13.3649 12.7193 13.281 12.9219C13.2746 12.9373 13.2651 12.951 13.2575 12.9658C13.2265 13.0271 13.1886 13.0865 13.1374 13.1377L11.1374 15.1377C10.8778 15.3972 10.4557 15.3972 10.196 15.1377C9.93637 14.878 9.93646 14.456 10.196 14.1963L11.0603 13.332H5.99974C5.6327 13.3319 5.33487 13.034 5.3347 12.667C5.3347 12.2998 5.63259 12.0021 5.99974 12.002H11.0603L10.196 11.1377C9.93637 10.878 9.93646 10.456 10.196 10.1963ZM3.35911 2.66992C3.38601 2.67095 3.41255 2.67444 3.43919 2.67871C3.45463 2.68119 3.47002 2.683 3.48509 2.68652C3.51336 2.6931 3.54072 2.70258 3.5681 2.71289C3.57786 2.71659 3.58785 2.7195 3.59739 2.72363C3.67227 2.75597 3.74329 2.80117 3.80442 2.8623L5.80442 4.8623C6.06398 5.12189 6.06377 5.54399 5.80442 5.80371C5.54473 6.0634 5.12272 6.06339 4.86302 5.80371L3.99876 4.93945V10C3.99858 10.367 3.70071 10.6648 3.33372 10.665C2.96656 10.665 2.66886 10.3671 2.66868 10V4.93945L1.80442 5.80371C1.54473 6.0634 1.12272 6.06339 0.863017 5.80371C0.603319 5.54401 0.603319 5.122 0.863017 4.8623L2.86302 2.8623L2.96751 2.77734C3.03495 2.73287 3.109 2.70291 3.18528 2.68555C3.2013 2.6819 3.21768 2.6802 3.23411 2.67773C3.25979 2.67387 3.28536 2.67079 3.31126 2.66992C3.31861 2.66968 3.32631 2.66797 3.33372 2.66797C3.34224 2.66797 3.35067 2.6696 3.35911 2.66992ZM12.6667 6.66797C13.0339 6.668 13.3316 6.96591 13.3318 7.33301V8.66602C13.3318 9.03326 13.034 9.33102 12.6667 9.33105C12.2995 9.33105 12.0017 9.03329 12.0017 8.66602V7.33301C12.0019 6.96589 12.2996 6.66797 12.6667 6.66797ZM10.7068 3.22559C10.8292 2.87943 11.2092 2.69794 11.5554 2.82031C12.3129 3.08819 12.9126 3.68776 13.1804 4.44531C13.3025 4.79134 13.121 5.17139 12.7751 5.29395C12.429 5.41629 12.049 5.23467 11.9265 4.88867C11.7926 4.50992 11.4907 4.20818 11.112 4.07422C10.7658 3.9518 10.5844 3.57184 10.7068 3.22559ZM8.66673 2.66797C9.03372 2.66817 9.33159 2.96601 9.33177 3.33301C9.33177 3.70015 9.03383 3.99785 8.66673 3.99805H7.33372C6.96645 3.99805 6.66868 3.70028 6.66868 3.33301C6.66886 2.96589 6.96656 2.66797 7.33372 2.66797H8.66673Z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconCrawlability({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 5.33333V8L10 10"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconInsights({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M2 12.6667L6.11111 8.55556L8.88889 11.3333L14 6"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.6667 6H14V9.33333"
        stroke="currentColor"
        strokeWidth="1.33"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M5.11779 3.55026L4.8701 3.4931C4.48435 3.40408 4.07994 3.52006 3.8 3.8C3.52006 4.07994 3.40408 4.48434 3.4931 4.8701L3.55026 5.11779C3.70055 5.76905 3.432 6.44533 2.87588 6.81607L2.49923 7.0672C2.18734 7.27513 2 7.62513 2 8C2 8.37487 2.18734 8.72487 2.49923 8.9328L2.87588 9.18393C3.432 9.55467 3.70055 10.2309 3.55026 10.8822L3.4931 11.1299C3.40408 11.5157 3.52006 11.9201 3.8 12.2C4.07994 12.4799 4.48434 12.5959 4.8701 12.5069L5.11779 12.4497C5.76905 12.2995 6.44533 12.568 6.81607 13.1241L7.0672 13.5008C7.27513 13.8127 7.62513 14 8 14C8.37487 14 8.72487 13.8127 8.9328 13.5008L9.18393 13.1241C9.55467 12.568 10.2309 12.2995 10.8822 12.4497L11.1299 12.5069C11.5157 12.5959 11.9201 12.4799 12.2 12.2C12.4799 11.9201 12.5959 11.5157 12.5069 11.1299L12.4497 10.8822C12.2995 10.2309 12.568 9.55467 13.1241 9.18393L13.5008 8.9328C13.8127 8.72487 14 8.37487 14 8C14 7.62513 13.8127 7.27513 13.5008 7.0672L13.1241 6.81607C12.568 6.44533 12.2995 5.76905 12.4497 5.11779L12.5069 4.8701C12.5959 4.48435 12.4799 4.07994 12.2 3.8C11.9201 3.52006 11.5157 3.40408 11.1299 3.4931L10.8822 3.55026C10.2309 3.70055 9.55467 3.432 9.18393 2.87588L8.9328 2.49923C8.72487 2.18734 8.37487 2 8 2C7.62513 2 7.27513 2.18734 7.0672 2.49923L6.81607 2.87588C6.44533 3.432 5.76905 3.70055 5.11779 3.55026Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinejoin="round"
      />
      <path
        d="M10 8C10 9.1046 9.1046 10 8 10C6.8954 10 6 9.1046 6 8C6 6.8954 6.8954 6 8 6C9.1046 6 10 6.8954 10 8Z"
        stroke="currentColor"
        strokeWidth="1.33333"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─── Types ─── */

type NavItemType = {
  title: string;
  href: string;
  icon: React.FC<{ className?: string }>;
};

type NavSectionType = {
  title: string;
  items: NavItemType[];
};

/* ─── Sidebar ─── */

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { businessId } = useParams<{ businessId: string }>();
  const pathname = usePathname();
  const { data: business } = useGetBusiness(businessId);

  const basePath = paths.business.getHref(businessId);
  const businessName = business?.name ?? 'Cloviana';
  const businessInitial = businessName[0]?.toUpperCase() ?? 'C';
  const businessLogo =
    business?.profileUrl ||
    (business?.domain
      ? `https://www.google.com/s2/favicons?domain=${business.domain}&sz=64`
      : undefined);

  const isActive = (href: string) => {
    if (href === '') return pathname === basePath;
    return pathname === `${basePath}${href}`;
  };

  const navSections: NavSectionType[] = [
    {
      title: 'General',
      items: [
        { title: 'Overview', href: '', icon: IconOverview },
        { title: 'Prompts', href: '/prompts', icon: IconPrompts },
      ],
    },
    {
      title: 'Sources',
      items: [
        { title: 'Domains', href: '/domains', icon: IconDomains },
        { title: 'URLs', href: '/urls', icon: IconUrls },
        { title: 'Gap analysis', href: '/gap', icon: IconGap },
        {
          title: 'Crawlability',
          href: '/crawlability',
          icon: IconCrawlability,
        },
      ],
    },
    {
      title: 'Brand',
      items: [{ title: 'Insights', href: '/insights', icon: IconInsights }],
    },
  ];

  const footerItems: NavItemType[] = [
    { title: 'Settings', href: '/settings', icon: IconSettings },
  ];

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        'peec-bg-sidebar peec-text-primary peec-border-stroke-primary',
        props.className,
      )}
      {...props}
    >
      {/* Header: Business selector */}
      <SidebarHeader className="peec-border-stroke-primary flex h-12 flex-row items-center gap-2 border-b px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="text-body-m peec-text-primary hover:peec-bg-tertiary h-8 rounded-xl px-2 py-1">
              {businessLogo ? (
                <span className="relative flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-sm">
                  <img
                    src={businessLogo}
                    alt={businessName}
                    className="size-full object-contain"
                  />
                </span>
              ) : (
                <span className="peec-bg-tertiary peec-text-secondary relative flex size-4 shrink-0 items-center justify-center rounded-sm text-[10px] font-bold select-none">
                  {businessInitial}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <span className="peec-text-primary max-w-[100px] truncate">
                  {businessName}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="peec-text-tertiary size-4"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation sections */}
      <SidebarContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto transition-all duration-300">
        {navSections.map((section) => (
          <SidebarGroup
            key={section.title}
            className="relative flex w-full min-w-0 flex-col gap-px px-2 py-0"
          >
            <SidebarGroupLabel className="text-body-s peec-text-tertiary flex h-7 shrink-0 items-center gap-2 rounded-md px-2 duration-200">
              <span>{section.title}</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="flex w-full min-w-0 flex-col gap-px">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={active}
                        className={cn(
                          'text-body-m peec-text-primary hover:peec-bg-tertiary h-8 rounded-xl px-2 py-0 transition-[width,height,padding]',
                          active && 'peec-bg-tertiary',
                        )}
                      >
                        <Link href={`${basePath}${item.href}`}>
                          <Icon
                            className={cn(
                              'size-4',
                              active
                                ? 'peec-text-primary'
                                : 'peec-text-tertiary',
                            )}
                          />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="flex flex-col gap-2 p-2">
        <SidebarMenu className="flex w-full min-w-0 flex-col gap-0.5">
          {footerItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={active}
                  className={cn(
                    'text-body-m peec-text-primary hover:peec-bg-tertiary h-8 rounded-xl px-2 py-0 transition-[width,height,padding]',
                    active && 'peec-bg-tertiary',
                  )}
                >
                  <Link href={`${basePath}${item.href}`}>
                    <Icon className="peec-text-tertiary size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
