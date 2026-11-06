'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { paths } from '@/config/paths';

import type { Selection } from '../chat/model/run-context';
import type { SlashCommandId } from '../chat/model/slash-commands';
import { useAgentThread } from '../hooks/use-agent-thread';
import { useEditorWorkspace } from '../hooks/use-editor-workspace';
import { useRevisionHistory } from '../hooks/use-revision-history';
import { useRunContext } from '../hooks/use-run-context';
import { useThemeSource } from '../hooks/use-theme-source';
import { previewRoutes } from '../lib/preview-routes';
import type { EditorState } from '../types';

import { AgentChat } from './chat/agent-chat';
import { CodePane } from './code/code-pane';
import { EditorTopBar, type EditorTab } from './editor-top-bar';
import { HistoryPanel } from './history/history-panel';
import { PreviewPane, type PreviewDevice } from './preview/preview-pane';

const HOME_ROUTE = '/';

export function ThemeEditor({
  slug,
  themeId,
  themeName,
  initialState,
}: {
  slug: string;
  themeId: string;
  themeName: string;
  initialState: EditorState;
}) {
  const [tab, setTab] = useState<EditorTab>('preview');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [route, setRoute] = useState(HOME_ROUTE);
  const [reloadKey, setReloadKey] = useState(0);
  const [openFile, setOpenFile] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);

  const workspace = useEditorWorkspace(
    slug,
    themeId,
    initialState,
    tab === 'preview',
  );
  const history = useRevisionHistory(slug, themeId, workspace.refresh);

  // What the user is looking at: the page in the preview, or the file and lines in the code view.
  const sources = useMemo(
    () =>
      tab === 'preview'
        ? { page: route }
        : {
            file: openFile ?? undefined,
            selection: selection ?? undefined,
          },
    [tab, route, openFile, selection],
  );
  const runContext = useRunContext(sources);
  const thread = useAgentThread({
    slug,
    themeId,
    onRevisionSaved: workspace.refresh,
    getContext: () => runContext.context,
    onSent: runContext.afterSend,
  });

  const revisionId = workspace.state?.revisionId ?? initialState.revisionId;
  const source = useThemeSource(slug, themeId, revisionId, thread.isRunning);

  const routes = useMemo(() => {
    const found = previewRoutes(source.files);
    return found.includes(HOME_ROUTE) ? found : [HOME_ROUTE, ...found];
  }, [source.files]);

  const busy = thread.isRunning || history.isNavigating;

  const runCommand = useCallback(
    (id: SlashCommandId) => {
      if (id === 'new') thread.newConversation();
      else if (id === 'history') setHistoryOpen(true);
      else if (id === 'undo' && history.canUndo && !busy) history.undo();
      else if (id === 'redo' && history.canRedo && !busy) history.redo();
    },
    [busy, history, thread],
  );

  return (
    <div className="bg-surface flex h-dvh flex-col">
      <EditorTopBar
        slug={slug}
        themeName={themeName}
        tab={tab}
        onTabChange={setTab}
        historyOpen={historyOpen}
        onToggleHistory={() => setHistoryOpen(!historyOpen)}
        canUndo={history.canUndo && !busy}
        canRedo={history.canRedo && !busy}
        onUndo={history.undo}
        onRedo={history.redo}
        device={device}
        onDeviceChange={setDevice}
        route={route}
        routes={routes}
        onRouteChange={setRoute}
        onReload={() => setReloadKey((key) => key + 1)}
        previewUrl={workspace.preview?.ready ? workspace.preview.url : null}
      />

      <ResizablePanelGroup className="min-h-0 flex-1">
        <ResizablePanel defaultSize="30%" minSize={320} maxSize="50%">
          {/* The chat stays mounted under the history so a running stream isn't dropped. */}
          <div className={historyOpen ? 'hidden' : 'h-full'}>
            <AgentChat
              thread={thread}
              chips={runContext.chips}
              onDismissChip={runContext.dismiss}
              files={source.files}
              onMention={runContext.addMention}
              onCommand={runCommand}
            />
          </div>
          {historyOpen && <HistoryPanel history={history} disabled={busy} />}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel>
          {tab === 'preview' ? (
            <PreviewPane
              workspace={workspace}
              device={device}
              route={route}
              reloadKey={reloadKey}
              pictureUrl={`${paths.mp.themes.editor.getHref(slug, themeId)}/source/revisions/${encodeURIComponent(revisionId)}/picture`}
            />
          ) : (
            <CodePane
              slug={slug}
              themeId={themeId}
              source={source}
              onFileChange={setOpenFile}
              onSelectionChange={setSelection}
            />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
