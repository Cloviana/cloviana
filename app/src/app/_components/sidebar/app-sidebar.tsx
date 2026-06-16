'use client';

import {
  Hexagon,
  PanelLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  Mail,
  GitFork,
  Users,
  Disc,
  FileText,
  BarChart3,
  FlaskConical,
  Inbox,
  RefreshCw,
  MoreHorizontal,
  User,
  Building2,
  Coins,
  Folder,
} from 'lucide-react';
import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, toggleSidebar } = useSidebar();
  const businessName = 'Lavender Data';

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-200 bg-[hsl(0,0%,97%)]" {...props}>
      {/* Header Section */}
      <SidebarHeader className="px-4 py-3 group-data-[state=collapsed]:px-2 border-b border-gray-200/60">
        <div className="flex items-center justify-between w-full group-data-[state=collapsed]:justify-center">
          <div className="flex items-center gap-2.5 overflow-hidden group-data-[state=collapsed]:hidden">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#d946ef] text-white">
              <Hexagon className="size-4 fill-white text-white" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[14px] font-semibold text-gray-900 truncate">
                {businessName}
              </span>
              <ChevronDown className="size-3.5 text-gray-400 shrink-0" />
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:text-gray-800 hover:bg-gray-50 shadow-2xs transition-all"
            title={state === 'collapsed' ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft className="size-4" />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 pb-4 pt-1.5 space-y-4">
        {/* Chat Action Button */}
        <div className="px-1">
          <button className="flex w-full items-center justify-start gap-2.5 rounded-xl border border-gray-200 bg-white py-2 px-3 shadow-2xs transition-colors hover:bg-gray-50/80">
            <div className="flex size-5 items-center justify-center rounded-full bg-gray-400 text-white shrink-0">
              <Plus className="size-3.5 stroke-[3]" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-data-[state=collapsed]:hidden">
              Chat
            </span>
          </button>
        </div>

        {/* Navigation Categories */}
        <div className="space-y-4">
          {/* Workspace Category */}
          <div className="space-y-0.5">
            <CategoryHeader label="Workspace" isOpen />
            <div className="space-y-0.5 pl-3.5 group-data-[state=collapsed]:pl-0">
              <NavItem icon={Mail} label="Emails" />
              <NavItem icon={GitFork} label="Workflows" />
              <NavItem icon={Users} label="Audiences" />
              <NavItem icon={Disc} label="Campaigns" />
              <NavItem icon={FileText} label="Forms" />
              <NavItem icon={BarChart3} label="Ads" />
            </div>
          </div>

          {/* Agents Category */}
          <div className="space-y-0.5">
            <CategoryHeader label="Agents" isOpen />
            <div className="space-y-0.5 pl-3.5 group-data-[state=collapsed]:pl-0">
              <NavItem icon={FlaskConical} label="Campaign QA Agent" iconColor="text-red-400" />
              <NavItem icon={Inbox} label="Deliverability Agent" iconColor="text-emerald-400" />
              <NavItem icon={RefreshCw} label="Form Conversions Agent" iconColor="text-sky-400" />
              <NavItem icon={MoreHorizontal} label="More agents" />
            </div>
          </div>

          {/* Records Category */}
          <div className="space-y-0.5">
            <CategoryHeader label="Records" isOpen />
            <div className="space-y-0.5 pl-3.5 group-data-[state=collapsed]:pl-0">
              <NavItem icon={User} label="Contacts" />
              <NavItem icon={Building2} label="Companies" />
              <NavItem icon={Coins} label="Opportunities" />
            </div>
          </div>

          {/* Folders Category */}
          <div className="space-y-0.5">
            <CategoryHeader label="Folders" isOpen={false} />
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

function CategoryHeader({ label, isOpen }: { label: string; isOpen?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-gray-400 group-data-[state=collapsed]:hidden">
      {isOpen ? (
        <ChevronDown className="size-3.5 text-gray-400 shrink-0" />
      ) : (
        <ChevronRight className="size-3.5 text-gray-400 shrink-0" />
      )}
      <span>{label}</span>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  isActive,
  iconColor = 'text-gray-400',
}: {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  iconColor?: string;
}) {
  return (
    <div
      className={`flex w-full items-center gap-3.5 rounded-lg px-2.5 py-1.5 text-sm transition-all group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-0 cursor-pointer group/item ${
        isActive
          ? 'bg-gray-200/50 font-medium text-gray-900'
          : 'text-gray-600 hover:bg-gray-200/50 hover:text-gray-900 hover:font-medium'
      }`}
    >
      <Icon className={`size-4 shrink-0 transition-colors ${
        isActive 
          ? 'text-gray-600' 
          : `${iconColor} group-hover/item:text-gray-600`
      }`} />
      <span className="group-data-[state=collapsed]:hidden">{label}</span>
    </div>
  );
}
