'use client';

import { MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, useEffect, useId, useState } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Table,
  TableBody,
  TableCell,
  TableFrame,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateBrandKitRule,
  useDeleteBrandKitRule,
  useUpdateBrandKitRule,
} from '@/features/brand-kit/api/rules';
import { useBrandKitDraft } from '@/features/brand-kit/context/brand-kit-draft-context';
import type { BrandKitRule, RuleScope } from '@/features/brand-kit/types';
import { useDeleteConfirmation } from '@/hooks/use-delete-confirmation';

type ScopedRuleTarget = {
  scope: Exclude<RuleScope, 'GLOBAL'>;
  scopeId: string;
};

type WritingRulesWidgetProps = {
  className?: string;
} & ({ scope: 'GLOBAL'; scopeId?: never } | ScopedRuleTarget);

type RuleDialogState = { mode: 'add' } | { mode: 'edit'; rule: BrandKitRule };

const TARGET_ID_FIELDS = {
  AUDIENCE: 'audienceId',
  REGION: 'regionId',
  CONTENT_TYPE: 'contentTypeId',
} as const;

export function WritingRulesWidget({
  scope,
  scopeId,
  className,
}: WritingRulesWidgetProps) {
  const { businessId, draft, setDraft } = useBrandKitDraft();
  const createRule = useCreateBrandKitRule();
  const updateRule = useUpdateBrandKitRule();
  const deleteRule = useDeleteBrandKitRule();
  const confirmDelete = useDeleteConfirmation();
  const [dialogState, setDialogState] = useState<RuleDialogState | null>(null);
  const target = getRuleTarget(draft, scope, scopeId);
  const scopedRules = draft.rules.filter((rule) =>
    isRuleInScope(rule, scope, scopeId),
  );
  const visibleRules =
    scope === 'GLOBAL'
      ? scopedRules
      : draft.rules.filter(
          (rule) =>
            rule.scope === 'GLOBAL' || isRuleInScope(rule, scope, scopeId),
        );

  function addRule(content: string) {
    const rule: BrandKitRule = {
      id: crypto.randomUUID(),
      scope,
      content,
      position: scopedRules.length,
      audienceId: null,
      regionId: null,
      contentTypeId: null,
      ...(scope !== 'GLOBAL' && {
        [TARGET_ID_FIELDS[scope]]: scopeId,
      }),
    };

    createRule.mutate(
      { businessId, ...rule },
      {
        onSuccess: ({ item }) => {
          setDraft((previous) => ({
            ...previous,
            rules: [...previous.rules, item],
          }));
        },
      },
    );
  }

  function saveRule(ruleId: string, content: string) {
    updateRule.mutate(
      { businessId, ruleId, content },
      {
        onSuccess: ({ item }) => {
          setDraft((previous) => ({
            ...previous,
            rules: previous.rules.map((rule) =>
              rule.id === item.id ? item : rule,
            ),
          }));
        },
      },
    );
  }

  async function removeRule(ruleId: string) {
    await deleteRule.mutateAsync({ businessId, ruleId });
    setDraft((previous) => ({
      ...previous,
      rules: previous.rules.filter((rule) => rule.id !== ruleId),
    }));
  }

  function confirmRemoveRule(rule: BrandKitRule) {
    confirmDelete({
      title: 'Delete rule?',
      description:
        'Are you sure you want to delete this rule? This action cannot be undone.',
      confirmLabel: 'Delete rule',
      onConfirm: () => removeRule(rule.id),
    });
  }

  function handleDialogSubmit(content: string) {
    if (dialogState?.mode === 'edit') {
      saveRule(dialogState.rule.id, content);
      return;
    }

    addRule(content);
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <CardTitle>{target.title}</CardTitle>
          <CardDescription>{target.description}</CardDescription>
          <CardAction>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setDialogState({ mode: 'add' })}
            >
              <Plus />
              Add Rule
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <RulesTable
            rules={visibleRules}
            scopeLabels={
              target.scopeLabel ? { [scope]: target.scopeLabel } : undefined
            }
            canManage={(rule) => rule.scope === scope}
            onEdit={(rule) => setDialogState({ mode: 'edit', rule })}
            onDelete={confirmRemoveRule}
            emptyTitle={target.emptyTitle}
            emptyDescription={target.emptyDescription}
          />
        </CardContent>
      </Card>

      <RuleDialog
        open={dialogState !== null}
        onOpenChange={(open) => {
          if (!open) setDialogState(null);
        }}
        mode={dialogState?.mode ?? 'add'}
        initialContent={
          dialogState?.mode === 'edit' ? dialogState.rule.content : undefined
        }
        onSubmit={handleDialogSubmit}
      />
    </>
  );
}

const SCOPE_LABELS: Record<RuleScope, string> = {
  GLOBAL: 'Global',
  AUDIENCE: 'Audience',
  REGION: 'Region',
  CONTENT_TYPE: 'Content Type',
};

const ruleContentComponents: Components = {
  p: ({ children }) => <p className="my-1 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="my-1 list-disc space-y-1 pl-4">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="my-1 list-decimal space-y-1 pl-4">{children}</ol>
  ),
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold">{children}</strong>
  ),
};

type RulesTableProps = {
  rules: BrandKitRule[];
  onEdit: (rule: BrandKitRule) => void;
  onDelete: (rule: BrandKitRule) => void;
  canManage?: (rule: BrandKitRule) => boolean;
  scopeLabels?: Partial<Record<RuleScope, string>>;
  emptyTitle?: string;
  emptyDescription?: string;
};

function RulesTable({
  rules,
  onEdit,
  onDelete,
  canManage = () => true,
  scopeLabels,
  emptyTitle = 'No global rules yet',
  emptyDescription = 'Add a rule that applies to every output.',
}: RulesTableProps) {
  return (
    <TableFrame variant="bordered">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rule</TableHead>
            <TableHead className="w-32">Applies to</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell className="py-4 align-top text-xs whitespace-normal">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={ruleContentComponents}
                >
                  {rule.content}
                </ReactMarkdown>
              </TableCell>
              <TableCell className="align-middle">
                <Badge variant="muted">
                  {scopeLabels?.[rule.scope] ?? SCOPE_LABELS[rule.scope]}
                </Badge>
              </TableCell>
              <TableCell className="align-middle">
                {canManage(rule) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Rule actions"
                      >
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => onEdit(rule)}>
                        <Pencil />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => {
                          window.setTimeout(() => onDelete(rule), 0);
                        }}
                      >
                        <Trash2 />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {rules.length === 0 && (
        <Empty className="bg-surface min-h-0 rounded-none">
          <EmptyHeader>
            <EmptyTitle className="text-xs">{emptyTitle}</EmptyTitle>
            <EmptyDescription className="text-xs">
              {emptyDescription}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </TableFrame>
  );
}

type RuleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'add' | 'edit';
  initialContent?: string;
  onSubmit: (content: string) => void;
};

function RuleDialog({
  open,
  onOpenChange,
  mode,
  initialContent = '',
  onSubmit,
}: RuleDialogProps) {
  const contentId = useId();
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    if (open) setContent(initialContent);
  }, [initialContent, open]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    onSubmit(trimmed);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === 'add' ? 'Add Rule' : 'Edit Rule'}
            </DialogTitle>
            <DialogDescription>
              Add one clear instruction per rule.
            </DialogDescription>
          </DialogHeader>

          <DialogBody>
            <Field>
              <FieldLabel htmlFor={contentId} className="sr-only">
                Instruction
              </FieldLabel>
              <Textarea
                id={contentId}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="min-h-48"
                placeholder="No em dashes. Use a comma, parentheses, or a period instead."
                autoFocus
              />
            </Field>
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!content.trim()}>
              {mode === 'add' ? 'Add Rule' : 'Save Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function isRuleInScope(
  rule: BrandKitRule,
  scope: RuleScope,
  scopeId: string | undefined,
) {
  if (rule.scope !== scope) return false;
  if (scope === 'GLOBAL') return true;
  return rule[TARGET_ID_FIELDS[scope]] === scopeId;
}

function getRuleTarget(
  draft: ReturnType<typeof useBrandKitDraft>['draft'],
  scope: RuleScope,
  scopeId: string | undefined,
) {
  switch (scope) {
    case 'GLOBAL':
      return {
        title: 'Global Writing Rules',
        description:
          'Set instructions that apply to every output. Add one instruction per rule.',
        emptyTitle: 'No global rules yet',
        emptyDescription: 'Add a rule that applies to every output.',
        scopeLabel: undefined,
      };
    case 'AUDIENCE': {
      const name =
        draft.audiences.find((item) => item.id === scopeId)?.name ?? 'Audience';
      return {
        title: `Writing Rules for ${name}`,
        description:
          'These instructions apply only to this audience. Global rules are shown below for context.',
        emptyTitle: 'No writing rules yet',
        emptyDescription: 'Add a rule for this audience.',
        scopeLabel: name,
      };
    }
    case 'REGION': {
      const name =
        draft.regions.find((item) => item.id === scopeId)?.name ?? 'Region';
      return {
        title: `Writing Rules for ${name}`,
        description:
          'These instructions apply only to this region. Global rules are shown below for context.',
        emptyTitle: 'No writing rules yet',
        emptyDescription: 'Add a rule for this region.',
        scopeLabel: name,
      };
    }
    case 'CONTENT_TYPE': {
      const name =
        draft.contentTypes.find((item) => item.id === scopeId)?.name ??
        'Content Type';
      return {
        title: `Writing Rules for ${name}`,
        description:
          'These instructions apply whenever this format is created or refreshed. Global rules are shown below for context.',
        emptyTitle: 'No writing rules yet',
        emptyDescription: 'Add a rule for this content type.',
        scopeLabel: name,
      };
    }
  }
}
