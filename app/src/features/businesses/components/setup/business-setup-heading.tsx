'use client';

type BusinessSetupHeadingProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
};

export function BusinessSetupHeading({
  title,
  subtitle,
  eyebrow,
}: BusinessSetupHeadingProps) {
  return (
    <div className="mb-8 space-y-2">
      {eyebrow ? (
        <p className="text-foreground-lighter text-xs font-medium tracking-wide uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="max-w-xl text-sm leading-6 text-slate-500">{subtitle}</p>
    </div>
  );
}
