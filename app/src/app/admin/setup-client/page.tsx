/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
'use client';

import {
  Copy,
  ImagePlus,
  Link2,
  Plus,
  Search,
  Trash2,
  UserX,
  X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import {
  DragEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  type AdminUser,
  deleteAdminUser,
  getAdminUsers,
  toggleMonitoring,
} from '@/features/admin/api/admin-users';
import {
  type SetupClientRequest,
  type SetupClientResponse,
  setupClient,
} from '@/features/admin/api/setup-client';
import type { PromptAwarenessStage } from '@/features/monitoring/types';
import { useUser } from '@/hooks/use-user';

const ADMIN_EMAIL = 'samuel@cloviana.com';
const INDUSTRIES = [
  'SaaS',
  'E-commerce',
  'Agency',
  'Fintech',
  'Healthcare',
  'Professional Services',
  'Other',
] as const;

type TopicDraft = {
  id: string;
  name: string;
  promptsText: string;
};

const emptyTopic = (): TopicDraft => ({
  id: crypto.randomUUID(),
  name: '',
  promptsText: '',
});

const generateSecurePassword = () => {
  const chars =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~';
  let pass = '';
  pass += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  pass += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  pass += '0123456789'[Math.floor(Math.random() * 10)];
  pass += '!@#$%^&*()_+~'[Math.floor(Math.random() * 13)];
  for (let i = 0; i < 14; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
};

export default function SetupClientAdminPage() {
  const { user, isLoading } = useUser();
  const [activeTab, setActiveTab] = useState<'provision' | 'manage'>(
    'provision',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SetupClientResponse | null>(null);
  const [topics, setTopics] = useState<TopicDraft[]>([emptyTopic()]);
  const [form, setForm] = useState({
    email: '',
    password: '',
    brandName: '',
    domain: '',
    profileUrl: '',
    location: 'United States',
    timezone: 'America/New_York',
    description: '',
    industry: 'SaaS',
    category: '',
    distributionChannels: 'Website, Blog, Reddit, LinkedIn',
    searchIntentCommercial: 70,
    searchIntentInformational: 30,
    competitorsText: '',
  });

  /* ── Manage-clients state ───────────────────────────────────── */
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm((prev) => ({ ...prev, password: generateSecurePassword() }));
  }, []);

  /* ── Fetch users (manage tab) ───────────────────────────────── */
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const data = await getAdminUsers(searchQuery || undefined);
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab !== 'manage') return;
    const timeout = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(timeout);
  }, [activeTab, fetchUsers]);

  const handleDelete = useCallback(
    async (profileId: string) => {
      setIsDeleting(true);
      try {
        const res = await deleteAdminUser(profileId);
        if (res.deleted) {
          setError(null);
          setResult(null);
          // Inline success toast via banner
          setDeleteConfirmId(null);
          fetchUsers();
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to delete client.',
        );
      } finally {
        setIsDeleting(false);
      }
    },
    [fetchUsers],
  );

  const handleToggleMonitoring = useCallback(
    async (businessId: string, enabled: boolean) => {
      try {
        const res = await toggleMonitoring(businessId, enabled);
        if (res.success) {
          setError(null);
          fetchUsers();
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to update monitoring status.',
        );
      }
    },
    [fetchUsers],
  );

  const handleFileToBase64 = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be under 5 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setForm((prev) => ({ ...prev, profileUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    },
    [setForm, setError],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) handleFileToBase64(file);
    },
    [handleFileToBase64],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const applyLogoUrl = useCallback(() => {
    const trimmed = logoUrlInput.trim();
    if (trimmed) {
      setForm((prev) => ({ ...prev, profileUrl: trimmed }));
    }
  }, [logoUrlInput, setForm]);

  const clearLogo = useCallback(() => {
    setForm((prev) => ({ ...prev, profileUrl: '' }));
    setLogoUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [setForm]);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;
  const promptCount = useMemo(
    () =>
      topics.reduce(
        (count, topic) => count + parsePrompts(topic.promptsText).length,
        0,
      ),
    [topics],
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-500">
        Loading admin session...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="max-w-md rounded-xl border border-slate-200 p-6">
          <h1 className="text-lg font-semibold text-slate-950">Admin only</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            This provisioning screen is restricted to Samuel&apos;s Cloviana
            account.
          </p>
        </div>
      </div>
    );
  }

  const updateTopic = (id: string, patch: Partial<TopicDraft>) => {
    setTopics((current) =>
      current.map((topic) =>
        topic.id === id ? { ...topic, ...patch } : topic,
      ),
    );
  };

  const addTopic = () => setTopics((current) => [...current, emptyTopic()]);
  const removeTopic = (id: string) => {
    setTopics((current) => current.filter((topic) => topic.id !== id));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    const payload = buildPayload(form, topics);
    const validationError = validatePayload(payload);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await setupClient(payload);
      setResult(response);

      // Clear form and ready for next submission
      setForm({
        email: '',
        password: generateSecurePassword(),
        brandName: '',
        domain: '',
        profileUrl: '',
        location: 'United States',
        timezone: 'America/New_York',
        description: '',
        industry: 'SaaS',
        category: '',
        distributionChannels: 'Website, Blog, Reddit, LinkedIn',
        searchIntentCommercial: 70,
        searchIntentInformational: 30,
        competitorsText: '',
      });
      setTopics([emptyTopic()]);
      setLogoUrlInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Client setup failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 border-b border-slate-200 pb-5">
          <p className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Cloviana Admin
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">
            Provision client workspace
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Creates the Supabase client account with a secure random password,
            writes the business/profile/topics/prompts, marks setup complete,
            and queues the initial monitoring run.
          </p>
        </div>

        {/* ── Tabs ───────────────────────────────────────────── */}
        <div className="mb-6 flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('provision')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'provision'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Provision Client
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'manage'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Manage Clients
          </button>
        </div>

        {/* ── Provision tab ─────────────────────────────────── */}
        {activeTab === 'provision' && (
          <>
            {result ? (
              <section className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-emerald-950">
                      Client workspace created successfully!
                    </h2>
                    <p className="mt-1 text-sm text-emerald-800">
                      {result.business.name} · {result.counts.topics} topics ·{' '}
                      {result.counts.prompts} prompts · monitoring{' '}
                      {result.monitoring.enqueued
                        ? 'queued'
                        : result.monitoring.reason}
                    </p>
                    <div className="mt-3 rounded-lg border border-emerald-200 bg-white p-3 text-sm">
                      <p>
                        <span className="font-semibold">Email:</span>{' '}
                        {result.client.email}
                      </p>
                      <p className="mt-1 break-all">
                        <span className="font-semibold">Password:</span>{' '}
                        {result.client.password}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(result.client.password);
                      }}
                    >
                      <Copy className="size-4" />
                      Copy password
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setResult(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </section>
            ) : null}

            {error ? (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <section className="space-y-4 rounded-xl border border-slate-200 p-5">
                <SectionTitle
                  title="Client and business"
                  description="Use the client work email. Customize or generate the secure password below."
                />
                <Field label="Client work email">
                  <Input
                    value={form.email}
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                    placeholder="founder@company.com"
                    className="focus-visible:ring-1 focus-visible:ring-blue-600"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <Field label="Password">
                    <Input
                      value={form.password}
                      onChange={(event) =>
                        setForm({ ...form, password: event.target.value })
                      }
                      placeholder="Enter or generate password"
                      className="focus-visible:ring-1 focus-visible:ring-blue-600"
                    />
                  </Field>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          password: generateSecurePassword(),
                        }))
                      }
                      className="h-8"
                    >
                      Generate
                    </Button>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Brand name">
                    <Input
                      value={form.brandName}
                      onChange={(event) =>
                        setForm({ ...form, brandName: event.target.value })
                      }
                      placeholder="Acme"
                    />
                  </Field>
                  <Field label="Domain">
                    <Input
                      value={form.domain}
                      onChange={(event) =>
                        setForm({ ...form, domain: event.target.value })
                      }
                      placeholder="acme.com"
                    />
                  </Field>
                </div>

                {/* Business Logo */}
                <Field label="Business logo (optional)">
                  <div className="mb-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setLogoMode('upload')}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                        logoMode === 'upload'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <ImagePlus className="mr-1 inline-block size-3" />
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setLogoMode('url')}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                        logoMode === 'url'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <Link2 className="mr-1 inline-block size-3" />
                      URL
                    </button>
                  </div>

                  {logoMode === 'upload' ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
                        isDragging
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <ImagePlus className="mb-2 size-8 text-slate-400" />
                      <p className="text-sm font-medium text-slate-600">
                        Drop an image here or click to browse
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        PNG, JPG, SVG, WebP · max 5 MB
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) handleFileToBase64(file);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={logoUrlInput}
                        onChange={(event) => setLogoUrlInput(event.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={applyLogoUrl}
                        disabled={!logoUrlInput.trim()}
                      >
                        Apply
                      </Button>
                    </div>
                  )}

                  {form.profileUrl ? (
                    <div className="mt-3 flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                        {}
                        <img
                          src={form.profileUrl}
                          alt="Logo preview"
                          className="size-full object-contain"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-slate-500">
                          {form.profileUrl.startsWith('data:')
                            ? `Base64 image (${Math.round(form.profileUrl.length / 1024)} KB)`
                            : form.profileUrl}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={clearLogo}
                        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : null}
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Location">
                    <Input
                      value={form.location}
                      onChange={(event) =>
                        setForm({ ...form, location: event.target.value })
                      }
                    />
                  </Field>
                  <Field label="Time zone">
                    <Input
                      value={form.timezone}
                      onChange={(event) =>
                        setForm({ ...form, timezone: event.target.value })
                      }
                      placeholder="America/New_York"
                    />
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm({ ...form, description: event.target.value })
                    }
                    placeholder="What the company sells, who it serves, and why buyers choose it."
                    className="min-h-28 focus-visible:ring-1 focus-visible:ring-blue-600"
                  />
                </Field>
              </section>

              <section className="space-y-4 rounded-xl border border-slate-200 p-5">
                <SectionTitle
                  title="Profile and competitors"
                  description="This maps directly to the monitoring profile and competitor set."
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Industry">
                    <select
                      value={form.industry}
                      onChange={(event) =>
                        setForm({ ...form, industry: event.target.value })
                      }
                      className="h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                    >
                      {INDUSTRIES.map((industry) => (
                        <option key={industry}>{industry}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Category">
                    <Input
                      value={form.category}
                      onChange={(event) =>
                        setForm({ ...form, category: event.target.value })
                      }
                      placeholder="AI visibility monitoring"
                    />
                  </Field>
                </div>
                <Field label="Distribution channels">
                  <Input
                    value={form.distributionChannels}
                    onChange={(event) =>
                      setForm({ ...form, distributionChannels: event.target.value })
                    }
                    placeholder="Website, Blog, Reddit, LinkedIn"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Commercial intent %">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={form.searchIntentCommercial}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          searchIntentCommercial: Number(event.target.value),
                        })
                      }
                    />
                  </Field>
                  <Field label="Informational intent %">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={form.searchIntentInformational}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          searchIntentInformational: Number(event.target.value),
                        })
                      }
                    />
                  </Field>
                </div>
                <Field label="Competitors">
                  <Textarea
                    value={form.competitorsText}
                    onChange={(event) =>
                      setForm({ ...form, competitorsText: event.target.value })
                    }
                    placeholder={
                      'Competitor name | competitor.com\nAnother | another.com'
                    }
                    className="min-h-28 focus-visible:ring-1 focus-visible:ring-blue-600"
                  />
                </Field>
              </section>

              <section className="space-y-4 rounded-xl border border-slate-200 p-5 lg:col-span-2">
                <div className="flex items-start justify-between gap-4">
                  <SectionTitle
                    title="Topics and prompts"
                    description="One topic per block. Prompt lines can use optional stage prefixes: EXPLORE | ..., EVALUATE | ..., DECIDE | ..."
                  />
                  <div className="text-right text-xs text-slate-500">
                    {promptCount} prompts
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  {topics.map((topic, index) => (
                    <div
                      key={topic.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-950">
                          Topic {index + 1}
                        </p>
                        {topics.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTopic(topic.id)}
                          >
                            <Trash2 className="size-4" />
                            Remove
                          </Button>
                        ) : null}
                      </div>
                      <Field label="Topic name">
                        <Input
                          value={topic.name}
                          onChange={(event) =>
                            updateTopic(topic.id, { name: event.target.value })
                          }
                          placeholder="AI automation platforms"
                        />
                      </Field>
                      <div className="mt-3">
                        <Field label="Prompts">
                          <Textarea
                            value={topic.promptsText}
                            onChange={(event) =>
                              updateTopic(topic.id, {
                                promptsText: event.target.value,
                              })
                            }
                            placeholder={
                              'EVALUATE | Best AI automation platform for agencies\nDECIDE | Compare Acme vs competitors for AI workflows'
                            }
                            className="min-h-40 focus-visible:ring-1 focus-visible:ring-blue-600"
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <Button type="button" variant="outline" onClick={addTopic}>
                    <Plus className="size-4" />
                    Add topic
                  </Button>
                  <Button type="submit" loading={isSubmitting}>
                    Create & Monitor Workspace
                  </Button>
                </div>
              </section>
            </form>
          </>
        )}

        {/* ── Manage clients tab ──────────────────────────────── */}
        {activeTab === 'manage' && (
          <>
            {error ? (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {/* Search bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by email, business name, or domain…"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-600"
              />
            </div>

            {/* Loading */}
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-20 text-sm text-slate-500">
                Loading clients…
              </div>
            ) : users.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 py-20">
                <UserX className="mb-3 size-10 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">
                  {searchQuery ? 'No clients match your search' : 'No clients provisioned yet'}
                </p>
              </div>
            ) : (
              /* Client list */
              <div className="space-y-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="rounded-xl border border-slate-200 bg-white p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-950">
                          {u.email}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Joined{' '}
                          {new Date(u.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>

                      {deleteConfirmId === u.id ? (
                        <div className="flex flex-col items-end gap-2">
                          <p className="max-w-sm text-right text-xs leading-5 text-red-600">
                            Are you sure? This will permanently delete this
                            client, their workspace, all monitoring data, and
                            their login account.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setDeleteConfirmId(null)}
                              disabled={isDeleting}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="bg-red-600 text-white hover:bg-red-700"
                              onClick={() => handleDelete(u.id)}
                              loading={isDeleting}
                            >
                              Confirm
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => setDeleteConfirmId(u.id)}
                        >
                          <Trash2 className="size-3.5" />
                          Delete
                        </Button>
                      )}
                    </div>

                    {/* Business cards */}
                    {u.businesses.length > 0 ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {u.businesses.map((biz) => (
                          <div
                            key={biz.id}
                            className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-slate-950">
                                {biz.name}
                              </p>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                                  biz.status === 'ACTIVE'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : biz.status === 'SETUP'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {biz.status}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {biz.domain}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {biz.promptCount} prompt{biz.promptCount !== 1 ? 's' : ''}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleToggleMonitoring(biz.id, !biz.monitoringEnabled)}
                              className={`mt-3 w-full rounded-md py-1.5 px-3 text-xs font-semibold border transition-colors ${
                                biz.monitoringEnabled
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                               {biz.monitoringEnabled ? 'Monitoring: Active' : 'Monitoring: Disabled'}
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs text-slate-400">
                        No businesses provisioned
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">
        {label}
      </span>
      {children}
    </label>
  );
}

function buildPayload(
  form: {
    email: string;
    password: string;
    brandName: string;
    domain: string;
    profileUrl: string;
    location: string;
    timezone: string;
    description: string;
    industry: string;
    category: string;
    distributionChannels: string;
    searchIntentCommercial: number;
    searchIntentInformational: number;
    competitorsText: string;
  },
  topics: TopicDraft[],
): SetupClientRequest {
  const competitors = parseCompetitors(form.competitorsText);
  const payload: SetupClientRequest = {
    email: form.email.trim().toLowerCase(),
    password: form.password,
    brandName: form.brandName.trim(),
    domain: form.domain.trim(),
    location: form.location.trim(),
    timezone: form.timezone.trim(),
    description: form.description.trim(),
    industry: form.industry as SetupClientRequest['industry'],
    category: form.category.trim(),
    distributionChannels: form.distributionChannels
      .split(',')
      .map((channel) => channel.trim())
      .filter(Boolean),
    searchIntentCommercial: form.searchIntentCommercial,
    searchIntentInformational: form.searchIntentInformational,
    competitors,
    topics: topics
      .map((topic) => ({
        name: topic.name.trim(),
        prompts: parsePrompts(topic.promptsText, form.brandName, competitors),
      }))
      .filter((topic) => topic.name && topic.prompts.length),
  };

  const trimmedProfileUrl = form.profileUrl.trim();
  if (trimmedProfileUrl) {
    payload.profileUrl = trimmedProfileUrl;
  }

  return payload;
}

function parseCompetitors(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [nameOrDomain, domainMaybe] = line
        .split('|')
        .map((part) => part.trim());
      const domain = domainMaybe || nameOrDomain;
      return {
        name: domainMaybe ? nameOrDomain : domain.replace(/\..*$/, ''),
        domain,
      };
    });
}

function parsePrompts(
  value: string,
  brandName?: string,
  competitors?: Array<{ name: string; domain: string }>,
) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|').map((part) => part.trim());
      const hasPrefix =
        parts.length > 1 &&
        ['EXPLORE', 'EVALUATE', 'DECIDE'].includes(parts[0].toUpperCase());

      let stage: PromptAwarenessStage = 'EVALUATE';
      let text = line;

      if (hasPrefix) {
        stage = parts[0].toUpperCase() as PromptAwarenessStage;
        text = parts.slice(1).join(' | ');
      } else if (brandName) {
        const lowerText = line.toLowerCase();
        const brandLower = brandName.toLowerCase();
        const hasBrand = brandLower && lowerText.includes(brandLower);
        const competitorNames = competitors?.map((c) => c.name) ?? [];
        const hasCompetitor = competitorNames.some(
          (c) => c && lowerText.includes(c.toLowerCase()),
        );
        const isComparison =
          lowerText.includes(' vs ') ||
          lowerText.includes(' versus ') ||
          lowerText.includes('compare ') ||
          lowerText.includes('comparison');
        const isPricingOrReviews =
          lowerText.includes('pricing') ||
          lowerText.includes('cost') ||
          lowerText.includes('reviews') ||
          lowerText.includes('review') ||
          lowerText.includes('alternative to');

        if (hasBrand || (hasCompetitor && isComparison) || isPricingOrReviews) {
          stage = 'DECIDE';
        } else {
          const isInformational =
            lowerText.startsWith('how ') ||
            lowerText.startsWith('what ') ||
            lowerText.startsWith('why ') ||
            lowerText.startsWith('guide ') ||
            lowerText.startsWith('tutorial') ||
            lowerText.includes('best practices') ||
            lowerText.includes('trends');

          if (isInformational) {
            stage = 'EXPLORE';
          }
        }
      }

      return { text, stage };
    });
}

function validatePayload(payload: SetupClientRequest) {
  if (!payload.email || !payload.email.includes('@'))
    return 'Enter a client email.';
  if (!payload.password || payload.password.length < 12)
    return 'Password must be at least 12 characters.';
  if (!payload.brandName || !payload.domain)
    return 'Enter brand name and domain.';
  if (payload.description.length < 20)
    return 'Description must be at least 20 characters.';
  if (!payload.category) return 'Enter a category.';
  if (payload.distributionChannels.length === 0) {
    return 'Enter at least one distribution channel.';
  }
  if (
    payload.searchIntentCommercial + payload.searchIntentInformational !==
    100
  ) {
    return 'Commercial and informational intent must total 100.';
  }
  if (payload.topics.length === 0) return 'Add at least one topic.';
  const promptCount = payload.topics.reduce(
    (count, topic) => count + topic.prompts.length,
    0,
  );
  if (promptCount < 3) return 'Add at least 3 prompts.';
  return null;
}
