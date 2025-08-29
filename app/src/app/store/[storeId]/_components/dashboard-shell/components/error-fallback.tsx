export function ErrorFallback() {
  return (
    <div className="flex size-full items-center justify-center">
      <p className="text-sm text-foreground">
        Something went wrong, please refresh or contact support at{' '}
        <a className="underline" href="mailto:support@cloviana.com">
          support@cloviana.com
        </a>
        .
      </p>
    </div>
  );
}
