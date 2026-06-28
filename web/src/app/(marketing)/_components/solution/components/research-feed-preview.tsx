import Image from 'next/image';
import { FC } from 'react';

type ResearchItem = {
  text: string;
  thumbnailSrc: string;
  thumbnailBlurDataUrl: string;
  source: string;
  time: string;
  opacity: number;
  iconSrc: string;
};

const RESEARCH_ITEMS: ResearchItem[] = [
  {
    text: 'The 2026 CRM Benchmark for Founder-Led SaaS Sales Teams',
    thumbnailSrc: '/images/thumbnails/crm-benchmark-report.webp',
    thumbnailBlurDataUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAFCAYAAAB4ka1VAAAAsUlEQVR4AQClAFr/Avj17v/49e7/9cSz//BbNf/vTCP/70wj//BMI//wYDv/AgAAAAAAAAAA/uzoAP39/QD3JTIA8x8rAAAAAAABGR4AAgD//wD59vYA3RgqAMxfiADLQmIA5Cw/AAEdIwACIysAAvl9YgD3akwA5I99AK2fnAAS1MEAJFBVAAaLpwAEWGgAAv/b1AAH9/MADwMAABn37QAb6t4ADQ0KAAEBAQABAQIAAAAA//8rXWToAAAABklEQVQDAIwMP2ANm9DtAAAAAElFTkSuQmCC',
    source: 'ChatGPT',
    time: '1 hour ago',
    opacity: 1,
    iconSrc: '/logos/chatgpt-icon.svg',
  },
  {
    text: 'Which CRM Is Fastest to Launch Without a RevOps Hire?',
    thumbnailSrc: '/images/thumbnails/crm-onboarding-data.webp',
    thumbnailBlurDataUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAFCAYAAAB4ka1VAAAAsUlEQVR4AQClAFr/Av3z6P/947v//NKZ//vkyP/98+n//fPp//3v3f/88eP/AgD89QD+1KIA9caYAMOpgACZnaEA9/f3AP8AAgAAAAEAAsPH9AD26/IA7vHzAL7TzADBt7kAfnu6AG+B+ACut/oAAvr7AAABEQYA+RgnACAgRgAWLk8A/A8LAOvv7gD3+P8AAhYYDgDYAmMA9RZrACUxZAA0MjQAPDkdAEI8BwAmIgUAAAAA//+FzTM3AAAABklEQVQDAIYsT62QgbGSAAAAAElFTkSuQmCC',
    source: 'Claude',
    time: '2 hour ago',
    opacity: 0.66,
    iconSrc: '/logos/claude-color.svg',
  },
  {
    text: 'Best HubSpot Alternatives for Early-Stage SaaS Companies',
    thumbnailSrc: '/images/thumbnails/crm-comparison-methodology.webp',
    thumbnailBlurDataUrl:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAFCAYAAAB4ka1VAAAAsUlEQVR4AQClAFr/Avzp0//84rz/+ubQ/66jlv+OiYP/w8Or/3u+h/9PsG3/AgD//QAA8+MA/uLMAPLv5wATFxsA5OziAO369QAAAAAAAgD9AAAA0OcA+MzHACUiJwA5OjsAGwsgAFgGGwAX+v4AAgDt6wAA6eUAABQiAA8aIwAUExAAIBkRADwfMQCQNmAAAgD9/AAAAAAACxwmAB/78gAN3tIAGhofAAANDwAGCgwAAAAA///ik2/tAAAABklEQVQDAFEvPhpKZeBzAAAAAElFTkSuQmCC',
    source: 'Gemini',
    time: '4 hour ago',
    opacity: 0.33,
    iconSrc: '/logos/gemini-color.svg',
  },
];

export const ResearchFeedPreview: FC = () => {
  return (
    <div className="@container flex h-[385px] w-full flex-col items-center justify-center gap-[10px]">
      {RESEARCH_ITEMS.map((item) => (
        <div
          key={item.source}
          className="flex w-full max-w-[335px] items-center gap-[12px] rounded-[6px] bg-white/70 p-[6px] @[300px]:gap-[16px] @[300px]:p-[8px]"
          style={{ opacity: item.opacity }}
        >
          <Image
            src={item.thumbnailSrc}
            alt=""
            width={72}
            height={72}
            placeholder="blur"
            blurDataURL={item.thumbnailBlurDataUrl}
            className="size-[56px] shrink-0 rounded-[3px] object-cover @[300px]:size-[72px]"
          />

          <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch py-[4px]">
            <p
              className="line-clamp-6 text-[11px] leading-[1.3] font-medium text-black/80 @[300px]:line-clamp-4 @[300px]:text-[12px] @[300px]:leading-[1.35]"
              style={{ fontFeatureSettings: '"ss04" 1, "ss15" 1' }}
            >
              {item.text}
            </p>

            <div className="flex w-full items-center justify-between gap-2 pr-[4px] @[300px]:pr-[8px]">
              <div className="flex min-w-0 items-center gap-[1.697px]">
                <SourceIcon item={item} />

                <span className="block min-w-0 truncate px-[3.394px] text-[10px] leading-[1.25] font-medium tracking-[0.0085px] text-black/60 @[300px]:text-[11px]">
                  {item.source}
                </span>
              </div>

              <span className="shrink-0 text-[10px] leading-[1.25] font-medium tracking-[0.0085px] text-black/60 @[300px]:text-[11px]">
                {item.time}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const SourceIcon: FC<{ item: ResearchItem }> = ({ item }) => (
  <Image
    src={item.iconSrc}
    alt=""
    width={12}
    height={12}
    className="size-[12px] shrink-0 object-contain"
  />
);
