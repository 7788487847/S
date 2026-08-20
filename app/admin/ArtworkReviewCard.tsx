"use client";
import ImageLightbox from "@/components/ImageLightbox";
import { getArtworkDisplays } from "@/lib/image";
export default function ArtworkReviewCard({item}:{item:Record<string,unknown>}){const images=getArtworkDisplays({imageUrl:String(item.imageUrl||""),thumbnailUrl:String(item.thumbnailUrl||""),displayUrl:String(item.displayUrl||""),images:String(item.images||"[]"),imageVariants:String(item.imageVariants||"[]")});return <><ImageLightbox images={images} title={String(item.title||"作品")}/><b className="mt-3 block">{String(item.title)}</b><p className="text-xs text-stone-500">共 {images.length} 张图片</p>{item.copyrightRisk&&<p className="font-bold text-red-600">⚠ 侵权风险</p>}</>}
