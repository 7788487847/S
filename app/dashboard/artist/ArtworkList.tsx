"use client";/* eslint-disable @next/next/no-img-element */
import { getArtworkThumbnail } from "@/lib/image";
export type Work={id:number;title:string;imageUrl:string;thumbnailUrl?:string|null;tags:string;status:number};
export default function ArtworkList({works}:{works:Work[]}){return <div className="grid gap-5 sm:grid-cols-3">{works.map(work=><article key={work.id} className="overflow-hidden rounded-3xl bg-white"><img src={getArtworkThumbnail(work)} className="aspect-square w-full object-cover" alt=""/><div className="p-4"><b>{work.title}</b><p className="text-sm text-stone-500">{work.status===1?"公开":work.status===2?"下架":"待审核"}</p></div></article>)}</div>}
