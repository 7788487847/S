export type ArtworkImages = {
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  displayUrl?: string | null;
  originalUrl?: string | null;
  images?: string | null;
  imageVariants?: string | null;
};

export function getArtworkDisplay(artwork: ArtworkImages) { return artwork.displayUrl || artwork.thumbnailUrl || artwork.imageUrl || ""; }
export function getArtworkThumbnail(artwork: ArtworkImages) { return artwork.thumbnailUrl || artwork.imageUrl || ""; }
export function getArtworkOriginal(artwork: ArtworkImages) { return artwork.originalUrl || artwork.displayUrl || artwork.thumbnailUrl || artwork.imageUrl || ""; }
export function countArtworkImages(artwork: ArtworkImages) {
  for (const value of [artwork.imageVariants, artwork.images]) {
    if (!value) continue;
    try { const parsed = JSON.parse(value); if (Array.isArray(parsed) && parsed.length) return parsed.length; } catch {}
  }
  return artwork.imageUrl || artwork.thumbnailUrl || artwork.displayUrl ? 1 : 0;
}
