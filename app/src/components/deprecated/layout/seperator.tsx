export const Seperator = () => {
  return (
    <div className="relative inline-flex w-full items-center justify-center">
      <hr className="h-px w-full border-0 bg-gray-200" />
      <span className="text-foreground-lighter/70 absolute left-1/2 -translate-x-1/2 bg-white px-3 text-sm">
        OR
      </span>
    </div>
  );
};
