'use client';

import { CaptionPlugin } from '@platejs/caption/react';
import {
  AudioPlugin,
  FilePlugin,
  ImagePlugin,
  MediaEmbedPlugin,
  PlaceholderPlugin,
  VideoPlugin,
} from '@platejs/media/react';
import { KEYS } from 'platejs';

import { AudioElement } from '@/components/editor/components/media/media-audio-node';
import { MediaEmbedElement } from '@/components/editor/components/media/media-embed-node';
import { FileElement } from '@/components/editor/components/media/media-file-node';
import { ImageElement } from '@/components/editor/components/media/media-image-node';
import { PlaceholderElement } from '@/components/editor/components/media/media-placeholder-node';
import { MediaPreviewDialog } from '@/components/editor/components/media/media-preview-dialog';
import { MediaUploadToast } from '@/components/editor/components/media/media-upload-toast';
import { VideoElement } from '@/components/editor/components/media/media-video-node';

export const MediaKit = [
  ImagePlugin.configure({
    options: { disableUploadInsert: true },
    render: { afterEditable: MediaPreviewDialog, node: ImageElement },
  }),
  MediaEmbedPlugin.withComponent(MediaEmbedElement),
  VideoPlugin.withComponent(VideoElement),
  AudioPlugin.withComponent(AudioElement),
  FilePlugin.withComponent(FileElement),
  PlaceholderPlugin.configure({
    options: { disableEmptyPlaceholder: true },
    render: { afterEditable: MediaUploadToast, node: PlaceholderElement },
  }),
  CaptionPlugin.configure({
    options: {
      query: {
        allow: [KEYS.img, KEYS.video, KEYS.audio, KEYS.file, KEYS.mediaEmbed],
      },
    },
  }),
];
