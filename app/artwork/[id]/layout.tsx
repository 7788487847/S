import type { Metadata } from "next";
import { artworks } from "@/db/schema";
import { getDb } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { getArtworkDisplay } from "@/lib/image";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!/^\d+$/.test(id)) return {};
  try {
    const db = await getDb();
    const [work] = await db.select({ title: artworks.title, displayUrl: artworks.displayUrl, imageUrl: artworks.imageUrl }).from(artworks).where(and(eq(artworks.id, Number(id)), eq(artworks.status, 1))).limit(1);
    if (!work) return {};
    const image = getArtworkDisplay(work);
    return { title: work.title, openGraph: { title: work.title, images: image ? [image] : [], type: "article" }, twitter: { card: "summary_large_image", title: work.title, images: image ? [image] : [] } };
  } catch { return {}; }
}
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
