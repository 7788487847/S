import type { InferSelectModel } from "drizzle-orm";
import type { artworks } from "@/db/schema";
import { getArtworkAllUrls } from "@/lib/image";
import { remoteStorageEnabled, removeObjects } from "@/lib/object-storage";
import { removeUnused } from "@/lib/upload-cleanup";

type Artwork = InferSelectModel<typeof artworks>;

export function artworkObjectNames(work: Artwork) {
  return [...new Set(getArtworkAllUrls(work).map(url => {
    const raw = url.split("/").pop()?.split("?")[0] || "";
    try { return decodeURIComponent(raw); } catch { return raw; }
  }).filter(name => /^[a-zA-Z0-9.-]+$/.test(name)))];
}

export async function removeArtworkFiles(work: Artwork) {
  const names = artworkObjectNames(work);
  if (!names.length) return 0;
  if (remoteStorageEnabled()) {
    await removeObjects(names);
    return names.length;
  }
  return removeUnused(names);
}
