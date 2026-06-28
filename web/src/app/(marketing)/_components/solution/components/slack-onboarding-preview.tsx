import { Hash } from 'lucide-react';
import Image from 'next/image';
import { FC, ReactNode } from 'react';

type ChatMessageProps = {
  sender: string;
  time: string;
  children: ReactNode;
};

export const SlackOnboardingPreview: FC = () => (
  <div className="@container w-full overflow-hidden rounded-xl border border-black/6 bg-white">
    <div className="flex items-center gap-1.5 border-b border-[rgba(29,28,29,0.1)] px-3.5 py-2.5">
      <Hash
        className="size-[13px] text-[#1d1c1d]"
        strokeWidth={2.5}
        aria-hidden="true"
      />
      <span className="text-[13px] font-bold text-[#1d1c1d]">growth</span>
    </div>

    <div className="flex flex-col gap-3.5 px-3.5 py-3.5">
      <UserMessage sender="You" time="9:01 AM">
        Here's everything you need to get started.
        <DocumentAttachment name="ICP & Buyer Personas.pdf" size="84 KB" />
      </UserMessage>

      <AgentMessage sender="Cloviana" time="9:01 AM">
        Got it. Briefed on your ICP, top competitors, and positioning. I'll
        start optimising your AI search presence now.
        <div className="mt-2.5">
          <button className="inline-flex items-center rounded-lg bg-[#007a5a] px-3 py-2 text-[13px] leading-none font-bold text-white transition-colors hover:bg-[#006048]">
            Start optimising
          </button>
        </div>
      </AgentMessage>
    </div>
  </div>
);

const UserMessage: FC<ChatMessageProps> = ({ sender, time, children }) => (
  <div className="flex w-full gap-2">
    <UserAvatar />
    <MessageBody sender={sender} time={time}>
      {children}
    </MessageBody>
  </div>
);

const AgentMessage: FC<ChatMessageProps> = ({ sender, time, children }) => (
  <div className="flex w-full gap-2">
    <AgentAvatar />
    <MessageBody sender={sender} time={time} badge={<AppBadge />}>
      {children}
    </MessageBody>
  </div>
);

const MessageBody: FC<ChatMessageProps & { badge?: ReactNode }> = ({
  sender,
  time,
  badge,
  children,
}) => (
  <div className="min-w-0 flex-1">
    <div className="flex min-w-0 items-center gap-1.5 leading-none">
      <span className="text-[13px] font-bold text-[#1d1c1d]">{sender}</span>
      {badge}
      <span className="hidden shrink-0 text-[11px] font-normal text-[#616061] @[270px]:inline">
        {time}
      </span>
    </div>
    <div className="mt-0.5 text-[13px] leading-[1.46] text-[#1d1c1d]">
      {children}
    </div>
  </div>
);

const UserAvatar: FC = () => (
  <span className="flex size-[36px] shrink-0 overflow-hidden rounded-[8px]">
    <Image
      src="/images/avatars/avatar-1.jpg"
      alt="You"
      width={36}
      height={36}
      className="object-cover object-top"
    />
  </span>
);

const AgentAvatar: FC = () => (
  <span className="flex size-[36px] shrink-0 items-center justify-center rounded-[8px] border border-black/6 bg-white">
    <Image
      src="/logo-icon.png"
      alt="Cloviana"
      width={22}
      height={22}
      className="object-contain"
    />
  </span>
);

const AppBadge: FC = () => (
  <span className="rounded-[2px] bg-[#e8e8e8] px-[3px] pt-[2px] pb-[1px] text-[9px] leading-none font-bold tracking-[0.3px] text-[#616061] uppercase">
    App
  </span>
);

const DocumentAttachment: FC<{ name: string; size: string }> = ({
  name,
  size,
}) => (
  <div className="mt-1.5 flex items-center gap-2 rounded-[6px] border border-[rgba(29,28,29,0.13)] bg-white px-2.5 py-2">
    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e01e5a]">
      <span className="text-[9px] font-bold text-white uppercase">PDF</span>
    </div>
    <div className="min-w-0 flex-1">
      <div className="truncate text-[13px] font-medium text-[#1d1c1d]">
        {name}
      </div>
      <div className="text-[11px] text-[#616061]">{size}</div>
    </div>
  </div>
);
