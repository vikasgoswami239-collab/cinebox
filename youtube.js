export function getYouTubeId(input = '') {
  try {
    const url = new URL(input.trim());
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || null;
    if (host.endsWith('youtube.com') || host === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') return url.searchParams.get('v');
      const parts = url.pathname.split('/').filter(Boolean);
      if (['embed', 'shorts', 'live'].includes(parts[0])) return parts[1] || null;
    }
  } catch {
    // A plain video ID is also accepted.
    if (/^[A-Za-z0-9_-]{11}$/.test(input.trim())) return input.trim();
  }
  return null;
}

export function getYouTubeEmbedUrl(input = '') {
  const id = getYouTubeId(input);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
}

export function getYouTubeThumbnail(input = '') {
  const id = getYouTubeId(input);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : '';
}