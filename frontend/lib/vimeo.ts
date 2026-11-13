export function toVimeoEmbedUrl(url: string | null | undefined): string | null {
  if (url == null) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const patterns = [
    /^https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/i,
    /^https?:\/\/player\.vimeo\.com\/video\/(\d+)/i,
    /^(\d+)$/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(trimmed);
    if (match?.[1]) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
  }

  return trimmed;
}
