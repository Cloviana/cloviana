import { ArrowUp, Plus } from 'lucide-react';
import { FC, SVGProps } from 'react';

import ArxivLogo from '@/assets/arXiv.svg';
import GoogleDocsLogo from '@/assets/Google_Docs_Logo.svg';
import GoogleSheetsLogo from '@/assets/Google_Sheets_Logo.svg';
import WebflowLogo from '@/assets/webflow-icon.svg';

type Integration = {
  name: string;
  Icon: FC<SVGProps<SVGSVGElement>>;
};

const GOOGLE_DOCS = { name: 'Google Docs', Icon: GoogleDocsLogo };
const GOOGLE_SHEETS = { name: 'Google Sheets', Icon: GoogleSheetsLogo };
const ARXIV = { name: 'arXiv', Icon: ArxivLogo };
const WEBFLOW = { name: 'Webflow', Icon: WebflowLogo };

export const ResearchPromptPreview: FC = () => (
  <div className="flex w-full justify-center">
    <div className="flex w-full max-w-[380px] flex-col items-start rounded-[17.61px] border-[0.44px] border-white/20 bg-white/[0.18] p-[10.566px] shadow-[21px_147px_42px_0_rgba(0,0,0,0),13px_94px_38px_0_rgba(0,0,0,0.01),8px_53px_32px_0_rgba(0,0,0,0.02),3px_24px_24px_0_rgba(0,0,0,0.03),1px_6px_13px_0_rgba(0,0,0,0.04)] backdrop-blur-[17px]">
      <div className="flex w-full flex-col gap-[9.686px] overflow-hidden rounded-[8.805px] border-[0.44px] border-white/50 bg-white/70 p-[8.805px]">
        <p className="w-full text-[11.447px] leading-[26px] font-medium tracking-[-0.1145px] text-black">
          Pull academic evidence from <IntegrationChip {...ARXIV} />, turn the
          findings into charts in <IntegrationChip {...GOOGLE_SHEETS} />, draft
          the report in <IntegrationChip {...GOOGLE_DOCS} />, and publish it on{' '}
          <IntegrationChip {...WEBFLOW} /> under our name so trade press and AI
          answers can cite it.
        </p>

        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            aria-label="Add source"
            className="flex items-center rounded-[7.044px] border-[0.881px] border-[#e5e5e5] p-[5.283px]"
          >
            <Plus className="size-[14.088px] text-black" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            aria-label="Submit research report prompt"
            className="flex size-[28.176px] items-center justify-center rounded-full bg-black p-[5.283px]"
          >
            <ArrowUp className="size-[14.088px] text-white" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

const IntegrationChip: FC<Integration> = ({ name, Icon }) => (
  <span className="mx-[1.5px] inline-flex translate-y-[3px] items-center gap-[3.522px] rounded-[5.283px] bg-[#e8e8e8] pr-[3.522px] pl-[1.761px]">
    <span className="flex size-[14.088px] shrink-0 items-center justify-center overflow-hidden rounded-[3.522px] bg-white">
      <Icon
        aria-hidden="true"
        className="h-[10.566px] w-[10.566px] object-contain"
      />
    </span>

    <span className="text-[10.566px] leading-[17.61px] font-medium tracking-[0.0088px] text-black">
      {name}
    </span>
  </span>
);
