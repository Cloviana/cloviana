'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Globe, Plus, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { PageLoading } from '@/components/fallbacks/page-loading';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Page, PageContent, PageHeader } from '@/components/ui/page';

import { useGetBusiness } from '@/features/businesses/api/get-business';
import { api } from '@/lib/api-client';
import { businessKeys } from '@/lib/react-query';
import { getAuthHeaders } from '@/lib/supabase/get-auth-headers';


export default function SettingsPage() {
  const { businessId } = useParams() as { businessId: string };
  const { data: business, isLoading } = useGetBusiness(businessId);
  const queryClient = useQueryClient();

  // Company Profile State
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');

  // Competitors State
  const [newCompetitor, setNewCompetitor] = useState('');



  useEffect(() => {
    if (business) {
      setName(business.name || '');
      setDomain(business.domain || '');
      setCategory(business.category || '');
      setLocation(business.location || '');
    }
  }, [business]);



  const updateMutation = useMutation({
    mutationFn: async (payload: {
      name?: string;
      domain?: string;
      category?: string;
      location?: string;
      competitors?: string[];
    }) => {
      const headers = await getAuthHeaders();
      return api.patch(`/businesses/${businessId}`, payload, { headers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: businessKeys.detail(businessId),
      });
      toast.success('Settings saved successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update settings');
    },
  });

  if (isLoading || !business) {
    return <PageLoading />;
  }

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ name, domain, category, location });
  };

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDomain = newCompetitor.trim().toLowerCase();
    if (!cleanDomain) return;

    // Basic domain validation
    if (!cleanDomain.includes('.') || cleanDomain.length < 4) {
      toast.error('Please enter a valid domain');
      return;
    }

    const currentDomains = business.competitors.map((c) =>
      c.domain.toLowerCase(),
    );
    if (currentDomains.includes(cleanDomain)) {
      toast.error('Competitor domain already exists');
      return;
    }

    const newDomains = [
      ...business.competitors.map((c) => c.domain),
      cleanDomain,
    ];
    updateMutation.mutate(
      { competitors: newDomains },
      {
        onSuccess: () => {
          setNewCompetitor('');
        },
      },
    );
  };

  const handleRemoveCompetitor = (domainToRemove: string) => {
    const newDomains = business.competitors
      .map((c) => c.domain)
      .filter((d) => d !== domainToRemove);
    updateMutation.mutate({ competitors: newDomains });
  };



  return (
    <Page>
      <PageHeader
        title="Settings"
        description="Configure your company details, competitors, and notification preferences."
      />
      <PageContent className="max-w-4xl">
        <div className="grid gap-6">
          {/* Card 1: Company Profile */}
          <Card>
            <form onSubmit={handleProfileSubmit}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="size-5 text-slate-500" />
                  Company Profile
                </CardTitle>
                <CardDescription>
                  Edit company details, domain, and classification location.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Cloviana"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-domain">Domain</Label>
                    <Input
                      id="company-domain"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="e.g. cloviana.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-category">Category</Label>
                    <Input
                      id="company-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. B2B SaaS"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-location">Location</Label>
                    <Input
                      id="company-location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end border-t bg-slate-50/50 py-3">
                <Button
                  type="submit"
                  variant="primary"
                  loading={updateMutation.isPending && newCompetitor === ''}
                >
                  Save changes
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Card 2: Competitors Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Globe className="size-5 text-slate-500" />
                Competitors
              </CardTitle>
              <CardDescription>
                Manage the competitor domains that are tracked in your
                monitoring dashboards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Competitor */}
              <form onSubmit={handleAddCompetitor} className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="Enter competitor domain (e.g. competitor.com)"
                    value={newCompetitor}
                    onChange={(e) => setNewCompetitor(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  loading={updateMutation.isPending && newCompetitor !== ''}
                >
                  <Plus className="mr-1 size-4" />
                  Add
                </Button>
              </form>

              {/* Competitors List */}
              <div className="mt-4 space-y-2">
                {business.competitors.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No competitors added yet.
                  </p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {business.competitors.map((comp) => (
                      <div
                        key={comp.id}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3 shadow-xs"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${comp.domain}&sz=64`}
                            alt=""
                            className="size-4 shrink-0 rounded-sm bg-slate-50"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {comp.name}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {comp.domain}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleRemoveCompetitor(comp.domain)}
                          disabled={updateMutation.isPending}
                          className="rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>


        </div>
      </PageContent>
    </Page>
  );
}
