import { FC, HTMLAttributes } from 'react';
import { cva, VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const featureCardWrapper = cva('p-8 rounded-2xl', {
  variants: {
    background: {
      pink: 'bg-[#8b045c]',
      green: 'bg-[#02693e]',
      blue: 'bg-[#0667d9]',
    },
  },
});

interface FeatureCardProps
  extends VariantProps<typeof featureCardWrapper>,
    HTMLAttributes<HTMLDivElement> {
  imgUrl: string;
  caption: string;
  title: string;
  description: string;
}

export const FeatureCard: FC<FeatureCardProps> = ({
  background,
  imgUrl,
  caption,
  title,
  description,
  className,
  ...props
}) => (
  <div
    className={cn(
      featureCardWrapper({ background }),
      'border bg-surface-100 shadow',
      className,
    )}
    {...props}
  >
    <img
      className="mb-5 w-full rounded-2xl border-l border-r border-t"
      src={imgUrl}
      alt={caption}
    />
    <div className="flex flex-col gap-y-3">
      <span className="text-xs font-semibold">{caption}</span>
      <h3 className="text-3xl font-semibold">{title}</h3>
      <p className="max-w-sm text-foreground-light">{description}</p>
    </div>
  </div>
);

interface FeaturesProps extends HTMLAttributes<HTMLDivElement> {}

export const Features: FC<FeaturesProps> = ({ className, ...props }) => {
  const featuresData = [
    {
      background: 'blue' as const,
      imgUrl: '/feature-001.png',
      caption: 'AI KEYWORD RESEARCH',
      title: 'Find High‑Value Keywords Instantly',
      description:
        'Uncover profitable, buyer‑intent keywords tailored to your Shopify catalog—complete with volume, trends & competition metrics, all in one click.',
    },
    {
      background: 'green' as const,
      imgUrl: '/feature-002.png',
      caption: 'AI BLOG WRITER',
      title: 'Publish SEO‑Optimized Content Fast',
      description:
        'Generate long‑form blog posts packed with meta tags, internal links, and image suggestions—ready to publish with zero manual editing.',
    },
  ];

  return (
    <div className={cn('container relative space-y-8', className)} {...props}>
      <div className="space-y-2">
        <h2 className="text-2xl font-medium lg:text-4xl">
          The growth engine for AI‑powered Shopify SEO
        </h2>
        <p className="text-base text-foreground-light lg:text-lg">
          Scale SEO with AI keyword insights and automated content—fully
          integrated with Shopify.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {featuresData.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </div>
  );
};
