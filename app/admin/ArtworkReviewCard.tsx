"use client";/* eslint-disable @next/next/no-img-element */
export default function ArtworkReviewCard({item}:{item:Record<string,unknown>}){return <><img src={String(item.imageUrl)} className="aspect-square w-full rounded-2xl object-cover" alt=""/><b>{String(item.title)}</b>{item.copyrightRisk&&<p className="font-bold text-red-600">⚠ 侵权风险</p>}</>}
