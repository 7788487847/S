"use client";
export type Tab=[string,string];
export default function AdminTabs({tabs,active,data,onChange}:{tabs:Tab[];active:string;data:Record<string,unknown[]>;onChange:(tab:string)=>void}){return <div className="my-6 flex flex-wrap gap-2">{tabs.map(([key,name])=><button key={key} onClick={()=>onChange(key)} className={active===key?"btn":"rounded-full border px-5 py-3"}>{name} {data[key]?.length||0}</button>)}</div>}
