import {
  type AttachmentAdapter,
  type CompleteAttachment,
  CompositeAttachmentAdapter,
  type PendingAttachment,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
} from '@assistant-ui/react';

const DOCUMENT_ACCEPT_TYPES =
  'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

const readFileAsDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

class DocumentAttachmentAdapter implements AttachmentAdapter {
  accept = DOCUMENT_ACCEPT_TYPES;

  async add(state: { file: File }): Promise<PendingAttachment> {
    return {
      id: state.file.name,
      type: 'document',
      name: state.file.name,
      contentType: state.file.type,
      file: state.file,
      status: { type: 'requires-action', reason: 'composer-send' },
    };
  }

  async send(attachment: PendingAttachment): Promise<CompleteAttachment> {
    const file = attachment.file as File;
    const data = await readFileAsDataURL(file);

    return {
      ...attachment,
      status: { type: 'complete' },
      content: [
        { type: 'file', data, mimeType: file.type, filename: file.name },
      ],
    };
  }

  async remove() {}
}

export const chatAttachmentAdapter = new CompositeAttachmentAdapter([
  new SimpleImageAttachmentAdapter(),
  new SimpleTextAttachmentAdapter(),
  new DocumentAttachmentAdapter(),
]);
