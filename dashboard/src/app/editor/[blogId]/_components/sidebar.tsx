import * as Tabs from '@radix-ui/react-tabs';
import debounce from 'lodash.debounce';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import React, {
  FC,
  ReactNode,
  SVGProps,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { SignatureIcon } from '@/components/icons';
import { TextArea, TextField } from '@/components/input';
import { useGetBlog } from '@/features/blogs/api/get-blog';
import { useUpdateBlog } from '@/features/blogs/api/update-blog';
import { cn } from '@/utils/cn';

interface SidebarItemProps {
  icon: FC<SVGProps<SVGSVGElement>>;
  active?: boolean;
}

const SidebarItem: FC<SidebarItemProps> = ({ icon: Icon, active = false }) => {
  return (
    <div
      className={cn(
        'flex w-full cursor-pointer items-center justify-center p-1.5 hover:bg-surface-200/70',
        active && 'bg-surface-200',
      )}
    >
      <Icon
        className={cn(
          'size-4',
          active ? 'fill-foreground' : 'fill-foreground-light',
        )}
      />
    </div>
  );
};

interface SidebarContentHeaderProps {
  children?: ReactNode;
}

const SidebarContentHeader: FC<SidebarContentHeaderProps> = ({ children }) => (
  <span className="text-[13px] font-medium">{children}</span>
);

const SettingsView = () => {
  const { blogId } = useParams<{ blogId: string }>();
  const { data: blog } = useGetBlog(blogId);

  const [slug, setSlug] = useState(blog?.slug || '');
  const [description, setDescription] = useState(blog?.description || '');

  const { mutate: saveBlog } = useUpdateBlog(blogId);

  const debouncedSave = useMemo(
    () =>
      debounce((newSlug: string, newDesc: string) => {
        if (newSlug && newDesc)
          saveBlog({ slug: newSlug, description: newDesc });
      }, 500),
    [saveBlog],
  );

  useEffect(() => {
    if (blog) {
      debouncedSave(slug, description);
    }
  }, [slug, description, blog, debouncedSave]);

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  return (
    <div className="flex flex-col gap-y-5">
      <TextField
        label="Slug"
        variant="default"
        value={slug}
        helpText="The slug appears in the URL and uniquely identifies the post."
        onChange={(e) => setSlug(e.currentTarget.value)}
        size="md"
      />
      <TextArea
        label="Description"
        variant="default"
        value={description}
        onChange={(e) => setDescription(e.currentTarget.value)}
        className="h-32"
        size="md"
        helpText="This a description of the post and will appear as preview in search results and social media."
      />
      {blog?.thumbnail?.srcUrl && (
        <Image
          src={blog.thumbnail.srcUrl}
          alt={blog.thumbnail.altText ?? ''}
          width={400} // small enough for preview
          height={225}
          className="h-auto w-full rounded-md object-cover"
          fetchPriority="high"
          quality={50} // reduces file size
        />
      )}
    </div>
  );
};

export const Sidebar: FC = () => {
  return (
    <Tabs.Root defaultValue="settings" className="flex h-full">
      <Tabs.List className="flex w-10 shrink-0 flex-col items-stretch border-r py-1.5">
        <Tabs.Trigger value="settings">
          <SidebarItem icon={SignatureIcon} active />
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content
        className="flex w-[400px] flex-col gap-y-4 px-4 py-2.5"
        value="settings"
      >
        <SidebarContentHeader>Settings</SidebarContentHeader>
        <SettingsView />
      </Tabs.Content>
    </Tabs.Root>
  );
};
