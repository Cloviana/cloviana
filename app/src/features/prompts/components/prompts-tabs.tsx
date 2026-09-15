import { paths } from '@/config/paths';
import { PageTabs } from '@/features/dashboard/components/page-tabs';

type PromptsTabsProps = {
  businessId: string;
};

export function PromptsTabs({ businessId }: PromptsTabsProps) {
  return (
    <PageTabs
      tabs={[
        {
          value: 'prompts',
          label: 'Prompts',
          href: paths.business.prompts.getHref(businessId),
        },
        {
          value: 'responses',
          label: 'Responses',
          href: paths.business.prompts.responses.getHref(businessId),
        },
      ]}
    />
  );
}
