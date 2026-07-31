import type { QueryClient, QueryKey } from '@tanstack/react-query';

import { documentKeys, folderKeys } from '@/lib/react-query';
import type { Document, Folder } from '@/types/api';

type FolderMutationResult = Omit<Folder, '_count'>;

export type KnowledgeCacheSnapshot = {
  documentLists: Array<[QueryKey, Document[] | undefined]>;
  folders?: Folder[];
  documentDetails: Array<[QueryKey, Document | undefined]>;
};

export async function cancelKnowledgeQueries(
  queryClient: QueryClient,
  businessId: string,
) {
  await Promise.all([
    queryClient.cancelQueries({
      queryKey: documentKeys.lists(businessId),
    }),
    queryClient.cancelQueries({
      queryKey: folderKeys.list(businessId),
      exact: true,
    }),
    queryClient.cancelQueries({
      queryKey: documentKeys.details(businessId),
    }),
  ]);
}

export function snapshotKnowledgeCache(
  queryClient: QueryClient,
  businessId: string,
): KnowledgeCacheSnapshot {
  return {
    documentLists: queryClient.getQueriesData<Document[]>({
      queryKey: documentKeys.lists(businessId),
    }),
    folders: queryClient.getQueryData<Folder[]>(folderKeys.list(businessId)),
    documentDetails: queryClient.getQueriesData<Document>({
      queryKey: documentKeys.details(businessId),
    }),
  };
}

export function restoreKnowledgeCache(
  queryClient: QueryClient,
  businessId: string,
  snapshot: KnowledgeCacheSnapshot,
) {
  for (const [queryKey, documents] of snapshot.documentLists) {
    queryClient.setQueryData(queryKey, documents);
  }
  if (snapshot.folders) {
    queryClient.setQueryData(folderKeys.list(businessId), snapshot.folders);
  }
  for (const [queryKey, document] of snapshot.documentDetails) {
    queryClient.setQueryData(queryKey, document);
  }
}

export function revalidateKnowledgeCache(
  queryClient: QueryClient,
  businessId: string,
) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: documentKeys.lists(businessId),
    }),
    queryClient.invalidateQueries({
      queryKey: folderKeys.list(businessId),
      exact: true,
    }),
  ]);
}

function sortDocuments(documents: Document[]) {
  return documents.sort(
    (a, b) =>
      a.folderId.localeCompare(b.folderId) ||
      a.position - b.position ||
      b.createdAt.localeCompare(a.createdAt) ||
      b.id.localeCompare(a.id),
  );
}

function positionDocuments(documents: Document[]) {
  return [...documents]
    .sort(
      (a, b) =>
        a.position - b.position ||
        b.createdAt.localeCompare(a.createdAt) ||
        b.id.localeCompare(a.id),
    )
    .map((document, position) =>
      document.position === position ? document : { ...document, position },
    );
}

export function findCachedDocument(
  queryClient: QueryClient,
  businessId: string,
  documentId: string,
) {
  for (const [, documents] of queryClient.getQueriesData<Document[]>({
    queryKey: documentKeys.lists(businessId),
  })) {
    const document = documents?.find((item) => item.id === documentId);
    if (document) return document;
  }
  return undefined;
}

function changeFolderCounts(
  queryClient: QueryClient,
  businessId: string,
  changes: Array<{
    folderId: string | null | undefined;
    field: keyof Folder['_count'];
    amount: number;
  }>,
) {
  queryClient.setQueryData<Folder[]>(folderKeys.list(businessId), (folders) => {
    if (!folders) return folders;

    const deltas = new Map<string, { children: number; documents: number }>();
    for (const { folderId, field, amount } of changes) {
      if (!folderId) continue;
      const delta = deltas.get(folderId) ?? { children: 0, documents: 0 };
      delta[field] += amount;
      deltas.set(folderId, delta);
    }

    return folders.map((folder) => {
      const delta = deltas.get(folder.id);
      if (!delta) return folder;

      return {
        ...folder,
        _count: {
          children: Math.max(0, folder._count.children + delta.children),
          documents: Math.max(0, folder._count.documents + delta.documents),
        },
      };
    });
  });
}

function cacheDocumentDetail(
  queryClient: QueryClient,
  businessId: string,
  document: Document,
) {
  queryClient.setQueriesData<Document>(
    {
      queryKey: documentKeys.detail(businessId, document.id),
      exact: true,
    },
    document,
  );
}

export function cacheCreatedFolder(
  queryClient: QueryClient,
  businessId: string,
  folder: FolderMutationResult,
) {
  let inserted = false;
  queryClient.setQueryData<Folder[]>(folderKeys.list(businessId), (folders) => {
    if (!folders || folders.some((item) => item.id === folder.id)) {
      return folders;
    }
    inserted = true;
    return [...folders, { ...folder, _count: { children: 0, documents: 0 } }];
  });

  if (inserted) {
    changeFolderCounts(queryClient, businessId, [
      { folderId: folder.parentId, field: 'children', amount: 1 },
    ]);
  }
}

export function cacheUpdatedFolder(
  queryClient: QueryClient,
  businessId: string,
  folder: FolderMutationResult,
) {
  const previous = queryClient
    .getQueryData<Folder[]>(folderKeys.list(businessId))
    ?.find((item) => item.id === folder.id);

  queryClient.setQueryData<Folder[]>(folderKeys.list(businessId), (folders) =>
    folders?.map((item) =>
      item.id === folder.id ? { ...folder, _count: item._count } : item,
    ),
  );

  if (previous && previous.parentId !== folder.parentId) {
    changeFolderCounts(queryClient, businessId, [
      { folderId: previous.parentId, field: 'children', amount: -1 },
      { folderId: folder.parentId, field: 'children', amount: 1 },
    ]);
  }

  const updateDocumentFolder = (document: Document | undefined) =>
    document?.folder.id === folder.id
      ? {
          ...document,
          folder: {
            id: folder.id,
            name: folder.name,
            parentId: folder.parentId,
          },
        }
      : document;

  queryClient.setQueriesData<Document[]>(
    { queryKey: documentKeys.lists(businessId) },
    (documents) =>
      documents?.map((document) => updateDocumentFolder(document) ?? document),
  );
  queryClient.setQueriesData<Document>(
    { queryKey: documentKeys.details(businessId) },
    updateDocumentFolder,
  );
}

export function cacheDeletedFolder(
  queryClient: QueryClient,
  businessId: string,
  folderId: string,
) {
  const folder = queryClient
    .getQueryData<Folder[]>(folderKeys.list(businessId))
    ?.find((item) => item.id === folderId);

  queryClient.setQueryData<Folder[]>(folderKeys.list(businessId), (folders) =>
    folders?.filter((item) => item.id !== folderId),
  );
  if (folder) {
    changeFolderCounts(queryClient, businessId, [
      { folderId: folder.parentId, field: 'children', amount: -1 },
    ]);
  }
  queryClient.removeQueries({
    queryKey: documentKeys.list(businessId, folderId),
    exact: true,
  });
}

export function cacheUploadedDocuments(
  queryClient: QueryClient,
  businessId: string,
  uploaded: Document[],
) {
  const inserted: Document[] = [];
  const uploadsByFolder = new Map<string, Document[]>();
  for (const document of uploaded) {
    const documents = uploadsByFolder.get(document.folderId) ?? [];
    documents.push(document);
    uploadsByFolder.set(document.folderId, documents);
  }

  for (const [folderId, folderUploads] of uploadsByFolder) {
    queryClient.setQueryData<Document[]>(
      documentKeys.list(businessId, folderId),
      (documents) => {
        if (!documents) return documents;
        const existingIds = new Set(documents.map((document) => document.id));
        const newDocuments = folderUploads.filter(
          (document) => !existingIds.has(document.id),
        );
        inserted.push(...newDocuments);
        return sortDocuments([...documents, ...newDocuments]);
      },
    );
  }

  if (inserted.length > 0) {
    changeFolderCounts(
      queryClient,
      businessId,
      inserted.map((document) => ({
        folderId: document.folderId,
        field: 'documents',
        amount: 1,
      })),
    );
  }
}

export function cacheUpdatedDocument(
  queryClient: QueryClient,
  businessId: string,
  updated: Document,
) {
  const previous = findCachedDocument(queryClient, businessId, updated.id);

  if (previous && previous.folderId !== updated.folderId) {
    queryClient.setQueryData<Document[]>(
      documentKeys.list(businessId, previous.folderId),
      (documents) =>
        documents
          ? positionDocuments(
              documents.filter((document) => document.id !== updated.id),
            )
          : documents,
    );
  }

  queryClient.setQueryData<Document[]>(
    documentKeys.list(businessId, updated.folderId),
    (documents) => {
      if (!documents) return documents;
      const positioned = positionDocuments(
        documents.filter((document) => document.id !== updated.id),
      );
      positioned.splice(
        Math.min(updated.position, positioned.length),
        0,
        updated,
      );
      return positioned.map((document, position) =>
        document.position === position ? document : { ...document, position },
      );
    },
  );
  cacheDocumentDetail(queryClient, businessId, updated);

  if (previous && previous.folderId !== updated.folderId) {
    changeFolderCounts(queryClient, businessId, [
      { folderId: previous.folderId, field: 'documents', amount: -1 },
      { folderId: updated.folderId, field: 'documents', amount: 1 },
    ]);
  }
}

export function cacheDeletedDocument(
  queryClient: QueryClient,
  businessId: string,
  documentId: string,
) {
  const document = findCachedDocument(queryClient, businessId, documentId);

  queryClient.setQueriesData<Document[]>(
    { queryKey: documentKeys.lists(businessId) },
    (documents) =>
      documents?.some((item) => item.id === documentId)
        ? positionDocuments(documents.filter((item) => item.id !== documentId))
        : documents,
  );
  queryClient.removeQueries({
    queryKey: documentKeys.detail(businessId, documentId),
    exact: true,
  });
  if (document) {
    changeFolderCounts(queryClient, businessId, [
      { folderId: document.folderId, field: 'documents', amount: -1 },
    ]);
  }
}
