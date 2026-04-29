'use client';

type BusinessSetupHeadingProps = {
  title: string;
  subtitle: string;
};

export function BusinessSetupHeading({
  title,
  subtitle,
}: BusinessSetupHeadingProps) {
  return (
    <div className="space-y-[2px]">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <div className="text-foreground/40 text-base">{subtitle}</div>
    </div>
  );
}
