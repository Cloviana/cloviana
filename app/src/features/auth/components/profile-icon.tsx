import { User } from '@supabase/auth-js';
import { User as IUser } from 'lucide-react';

import { cn } from '@/utils/cn';

export const ProfileIcon = ({
  user,
  isLoading,
}: {
  user: User | null;
  isLoading: boolean;
}) => {
  return (
    <div
      className={cn(
        'border-secondary-100 bg-secondary-200 text-secondary-dark flex size-8 items-center justify-center rounded-full ring-gray-100 hover:ring-3',
        isLoading && 'animate-pulse',
      )}
    >
      {user ? (
        <span className="text-sm font-medium">
          {user.email!.slice(0, 1).toUpperCase()}
        </span>
      ) : !isLoading ? (
        <IUser className="size-3.5" />
      ) : null}
    </div>
  );
};
