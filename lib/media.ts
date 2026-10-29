import { prisma } from '@/lib/db';

export type ImageSize = 'thumb' | 'grid' | 'semi-large' | 'large' | 'full';

export async function getAttachmentUrlById(
  id: string | number | bigint | null | undefined,
  size: ImageSize = 'full'
): Promise<string> {
  if (!id) return '/assets/frontend/img/no-image.png';

  if (typeof id === 'string' && (id.startsWith('/') || id.startsWith('http') || id.startsWith('data:'))) {
    return id;
  }

  if (!process.env.DATABASE_URL) {
    return '/assets/frontend/img/no-image.png';
  }

  try {
    const numId = typeof id === 'bigint' ? id : BigInt(id);
    const media = await prisma.mediaUpload.findUnique({
      where: { id: numId },
      select: { path: true, alt: true },
    });

    if (!media?.path) return '/assets/frontend/img/no-image.png';

    const prefix = size && size !== 'full' ? `${size}-` : '';
    return `/assets/uploads/media-uploader/${prefix}${media.path}`;
  } catch {
    return '/assets/frontend/img/no-image.png';
  }
}

export async function getAttachmentAltById(
  id: string | number | bigint | null | undefined
): Promise<string> {
  if (!id) return 'Image';

  if (!process.env.DATABASE_URL) {
    return 'Image';
  }

  try {
    const numId = typeof id === 'bigint' ? id : BigInt(id);
    const media = await prisma.mediaUpload.findUnique({
      where: { id: numId },
      select: { alt: true, title: true },
    });

    return media?.alt || media?.title || 'Image';
  } catch {
    return 'Image';
  }
}
