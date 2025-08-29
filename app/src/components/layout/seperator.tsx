export const Seperator = () => {
  return (
    <div className="relative inline-flex w-full items-center justify-center">
      <hr className="h-px w-full border-0 bg-gray-200" />
      <span className="absolute left-1/2 -translate-x-1/2 bg-white px-3 text-sm text-foreground-lighter/70">
        OR
      </span>
    </div>
  );
};
