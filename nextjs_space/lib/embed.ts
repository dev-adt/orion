// Shared helpers for embedding videos and raw embed codes.

// Normalize a user-provided video URL into an embeddable iframe src.
// Supports YouTube (youtu.be, watch?v=, /embed/, /shorts/), Vimeo, and
// falls back to the raw URL for anything else (e.g. an mp4 or an already
// embeddable player URL).
export function toEmbedUrl(input?: string | null): string {
  const url = (input || '').trim();
  if (!url) return '';

  // YouTube short link: https://youtu.be/VIDEOID?si=...
  const short = url.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
  if (short) return 'https://www.youtube.com/embed/' + short[1];

  // YouTube watch: https://www.youtube.com/watch?v=VIDEOID
  const watch = url.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  if (watch && /youtube\.com/.test(url)) return 'https://www.youtube.com/embed/' + watch[1];

  // YouTube shorts: https://www.youtube.com/shorts/VIDEOID
  const shorts = url.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/);
  if (shorts) return 'https://www.youtube.com/embed/' + shorts[1];

  // Already an embed url
  if (/youtube\.com\/embed\//.test(url)) return url;

  // Vimeo: https://vimeo.com/123456789
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return 'https://player.vimeo.com/video/' + vimeo[1];

  // Fallback: return the raw URL (works for direct player/embed links)
  return url;
}

// True when the given URL points directly to a video file we should render
// with a native <video> element instead of an <iframe>.
export function isDirectVideoFile(input?: string | null): boolean {
  const url = (input || '').trim().toLowerCase();
  return /\.(mp4|webm|ogg|mov|m4v)(\?|$)/.test(url);
}
