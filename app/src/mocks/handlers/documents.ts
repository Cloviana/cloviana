import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import type { Document } from '@/types/api';

const db: Document[] = [];

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function now() {
  return new Date().toISOString();
}

export const documentHandlers = [
  http.get(`${env.API_URL}/businesses/:businessId/documents`, ({ params }) => {
    const docs = db.filter((d) => d.businessId === params.businessId);
    return HttpResponse.json(docs);
  }),

  http.post(
    `${env.API_URL}/businesses/:businessId/documents`,
    async ({ params, request }) => {
      const formData = await request.formData();
      const files = formData.getAll('files') as File[];
      const tags = formData.getAll('tags') as string[];

      const created: Document[] = files.map((file, i) => {
        const extension = file.name.split('.').pop() ?? '';
        const doc: Document = {
          id: makeId(),
          businessId: params.businessId as string,
          name: file.name,
          extension,
          tag: (tags[i] as Document['tag']) ?? 'business',
          createdAt: now(),
          updatedAt: now(),
        };
        db.push(doc);
        return doc;
      });

      return HttpResponse.json(created, { status: 201 });
    },
  ),

  http.patch(
    `${env.API_URL}/businesses/:businessId/documents/:documentId`,
    async ({ params, request }) => {
      const body = (await request.json()) as { tag: Document['tag'] };
      const doc = db.find((d) => d.id === params.documentId);
      if (!doc)
        return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      doc.tag = body.tag;
      doc.updatedAt = now();
      return HttpResponse.json(doc);
    },
  ),

  http.delete(
    `${env.API_URL}/businesses/:businessId/documents/:documentId`,
    ({ params }) => {
      const idx = db.findIndex((d) => d.id === params.documentId);
      if (idx === -1)
        return HttpResponse.json({ message: 'Not found' }, { status: 404 });
      db.splice(idx, 1);
      return new HttpResponse(null, { status: 204 });
    },
  ),
];
