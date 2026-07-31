import { User } from '@supabase/auth-js';
import { User as IUser } from 'lucide-react';

import { cn } from '@/utils/cn';

const getInitials = (user: User) => {
  const displayName = (
    user.user_metadata.full_name ??
    user.user_metadata.name ??
    ''
  ).trim();

  if (displayName) {
    const names = displayName.split(/\s+/);

    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }

    return names[0].slice(0, 2).toUpperCase();
  }

  return user.email?.split('@')[0].slice(0, 2).toUpperCase() ?? '';
};

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
        'flex size-[30px] items-center justify-center rounded-full bg-[oklch(94.34%_0.0142_148.97)] text-[oklch(45.46%_0.068_143.58)] dark:bg-[oklch(45.46%_0.068_143.58)] dark:text-[oklch(94.34%_0.0142_148.97)]',
        isLoading && 'animate-pulse',
      )}
    >
      {user ? (
        <span className="text-xs font-medium">{getInitials(user)}</span>
      ) : !isLoading ? (
        <IUser className="size-3.5" />
      ) : null}
    </div>
  );
};
