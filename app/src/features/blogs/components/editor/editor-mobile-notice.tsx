import { Tablet } from 'lucide-react';

export const EditorMobileNotice = () => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white md:hidden">
    <div className="flex w-full max-w-xl flex-col items-center p-4">
      <Tablet size={46} />
      <div className="mt-4 space-y-2 text-center">
        <h2 className="text-lg font-semibold">
          Editor not available on small screens
        </h2>
        <p className="text-foreground-light text-sm">
          Please switch to a tablet or desktop device to access the full editing
          experience.
        </p>
      </div>
    </div>
  </div>
);
