/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import ArtworkActions from "./ArtworkActions";

type Work={id:number;title:string;imageUrl:string;tags:string;userId?:number;artistName?:string;viewCount?:number;favoriteCount?:number;likeCount?:number;imageCount?:string};
function count(value?:string){try{const parsed=JSON.parse(value||"[]");return Array.isArray(parsed)?parsed.length:0}catch{return 0}}
export default function ArtworkGrid({works,showArtist=true}:{works:Work[];showArtist?:boolean}){
  if(!works.length)return <div className="rounded-3xl border border-dashed border-stone-300 py-20 text-center text-stone-500">还没有公开作品，期待第一束灵感 ✦</div>;
  return <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4">{works.map(work=>{const imageCount=count(work.imageCount);return <article key={work.id} className="mb-5 break-inside-avoid overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(50,40,30,.08)] dark:bg-[#1a1a1a]"><Link href={`/artwork/${work.id}`} className="relative block"><img src={work.imageUrl} alt={work.title} className="block h-auto w-full bg-stone-100 object-cover"/>{imageCount>1&&<span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/70 px-2 py-1 text-xs text-white">多图 {imageCount}</span>}</Link><div className="p-4"><div className="flex items-start justify-between gap-3"><Link href={`/artwork/${work.id}`} className="font-semibold">{work.title}</Link><span className="whitespace-nowrap text-xs text-stone-400">👁 {work.viewCount||0}</span></div><div className="mt-2 flex flex-wrap gap-1">{work.tags.split(/[,，]/).filter(Boolean).slice(0,3).map(tag=><span key={tag} className="text-xs text-stone-500">#{tag.trim()}</span>)}</div><ArtworkActions id={work.id} initialLikes={work.likeCount} initialFavorites={work.favoriteCount}/>{showArtist&&work.userId&&<Link href={`/u/${work.userId}`} className="mt-4 block text-sm text-stone-600">{work.artistName}</Link>}</div></article>})}</div>
}
