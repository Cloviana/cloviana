'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImageIcon, Upload, X, ChevronDown, Hexagon } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api-client';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';
import { cn } from '@/utils/cn';

import { useGetBusiness } from '../api/get-business';

const updateBusiness = async (
  businessId: string,
  payload: {
    name?: string;
    domain?: string;
    profileUrl?: string;
    description?: string;
    category?: string;
    icp?: string;
  },
): Promise<any> => {
  const headers = await getAuthHeaders();
  return api.patch(`/businesses/${businessId}`, payload, { headers });
};

export const BusinessChip = ({ className }: { className?: string }) => {
  const { businessId } = useParams() as { businessId: string };
  const { data: business, isLoading } = useGetBusiness(businessId);
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [icp, setIcp] = useState('');
  const [profileUrl, setProfileUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!business) return;
    setName(business.name || '');
    setDomain(business.domain || '');
    setCategory(business.category || '');
    setDescription(business.description || '');
    setIcp(business.icp || '');
    setProfileUrl(business.profileUrl || '');
  }, [business, isOpen]);

  const mutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateBusiness>[1]) =>
      updateBusiness(businessId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['businesses', 'detail', businessId], data);
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      toast.success('Workspace profile updated.');
      setIsOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update workspace profile');
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Company name is required');
      return;
    }

    mutation.mutate({
      name,
      domain,
      category,
      description,
      icp,
      profileUrl,
    });
  };

  if (isLoading || !business) {
    return <Skeleton className="h-[36px] w-[150px] rounded-md" />;
  }

  const initial = (business.name || 'C').charAt(0).toUpperCase();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            'flex h-8 items-center gap-1.5 overflow-hidden rounded-xl px-2 py-1 text-left text-sm text-gray-900 transition-all duration-300 outline-none group-data-[state=collapsed]:w-8 group-data-[state=collapsed]:justify-center group-data-[state=collapsed]:px-1 hover:bg-gray-200/50',
            className,
          )}
        >
          <span className="relative flex h-4 w-4 shrink-0 overflow-hidden rounded-sm transition-all duration-300">
            {business.profileUrl ? (
              <img
                className="aspect-square h-full w-full object-cover"
                alt={business.name}
                src={business.profileUrl}
              />
            ) : (
              <div className="flex size-4 shrink-0 items-center justify-center rounded-md bg-[#d946ef] text-white">
                <Hexagon className="size-2.5 fill-white text-white" />
              </div>
            )}
          </span>
          <span className="flex min-w-0 items-center gap-1.5 group-data-[state=collapsed]:hidden">
            <span className="max-w-[100px] truncate text-[14px] font-semibold text-gray-900">
              {business.name}
            </span>
            <ChevronDown className="size-4 shrink-0 text-gray-400" />
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl gap-0 overflow-hidden rounded-md border border-slate-200 bg-white p-0 ring-0">
        <DialogHeader className="border-b border-slate-200 px-6 py-5">
          <DialogTitle className="text-base font-medium text-slate-950">
            Workspace profile
          </DialogTitle>
          <DialogDescription className="max-w-xl text-sm leading-6 text-slate-500">
            Company facts Cloviana uses to frame buyer prompts, competitors, and
            source analysis for this workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[70vh] overflow-y-auto md:grid-cols-[220px_1fr]">
          <div className="border-b border-slate-200 bg-[#faf9f7] p-6 md:border-r md:border-b-0">
            <button
              type="button"
              className="group relative block focus:outline-none"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar className="size-28 border border-slate-200 bg-white">
                <AvatarImage
                  src={profileUrl || undefined}
                  className="object-cover"
                />
                <AvatarFallback className="bg-white text-3xl font-medium text-slate-900">
                  {name.charAt(0).toUpperCase() || initial}
                </AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                Change logo
              </span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="mt-5 space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full justify-center bg-white"
              >
                <Upload className="size-3.5" />
                Upload logo
              </Button>
              {profileUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setProfileUrl('')}
                  className="w-full justify-center text-slate-500 hover:text-slate-950"
                >
                  <X className="size-3.5" />
                  Remove
                </Button>
              )}
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Use a clean square logo or mark. PNG and JPG under 2MB work best.
            </p>
          </div>

          <div className="space-y-5 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs text-slate-600">
                  Company
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Acme"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="domain" className="text-xs text-slate-600">
                  Website
                </Label>
                <Input
                  id="domain"
                  value={domain}
                  onChange={(event) => setDomain(event.target.value)}
                  placeholder="acme.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs text-slate-600">
                Category
              </Label>
              <Input
                id="category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="B2B sales project management"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs text-slate-600">
                Positioning summary
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="resize-none"
                placeholder="What the product does, who it serves, and why buyers choose it."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="icp" className="text-xs text-slate-600">
                Buyer profile
              </Label>
              <Textarea
                id="icp"
                value={icp}
                onChange={(event) => setIcp(event.target.value)}
                rows={3}
                className="resize-none"
                placeholder="Target roles, company size, market, and buying triggers."
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="profileUrl"
                className="flex items-center gap-1.5 text-xs text-slate-600"
              >
                <ImageIcon className="size-3.5" />
                Logo image URL
              </Label>
              <Input
                id="profileUrl"
                value={profileUrl}
                onChange={(event) => setProfileUrl(event.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-200 px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : 'Save profile'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
