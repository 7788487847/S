"use client";
import { useCallback, useEffect, useState } from "react";
import AdminLogin from "./AdminLogin";
import AdminTabs, { Tab } from "./AdminTabs";
import ArtworkReviewCard from "./ArtworkReviewCard";
import VerificationReviewCard from "./VerificationReviewCard";
import ReportCard from "./ReportCard";
import ComplaintCard from "./ComplaintCard";
import ContactCard from "./ContactCard";
import AdminLogCard from "./AdminLogCard";
import SiteManager from "./SiteManager";

type Item = Record<string, unknown> & { id: number };
const tabs: Tab[] = [["artworks","作品审核"],["applications","认证审核"],["profiles","资料审核"],["reports","举报处理"],["complaints","侵权投诉"],["contacts","联系留言"],["logs","操作日志"],["site","站点与公告"]];

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [active, setActive] = useState("artworks");
  const [data, setData] = useState<Record<string, Item[]>>(Object.fromEntries(tabs.map(([key]) => [key, []])));
  const [notice, setNotice] = useState("");
  const [acting, setActing] = useState<number | null>(null);

  const load = useCallback(async (currentToken: string) => {
    const results = await Promise.all(tabs.filter(([key])=>key!=="site").map(async ([key, name]) => {
      try {
        const response = await fetch(`/api/admin/${key}`, { headers: { authorization: `Bearer ${currentToken}` } });
        if (response.status === 401 || response.status === 403) return { key, name, forbidden: true, ok: false, error: "", items: [] as Item[] };
        if (!response.ok) { const result=await response.json().catch(()=>({error:""})); return { key, name, forbidden: false, ok: false, error:String(result.error||""), items: [] as Item[] }; }
        return { key, name, forbidden: false, ok: true, items: await response.json() as Item[] };
      } catch { return { key, name, forbidden: false, ok: false, error:"", items: [] as Item[] }; }
    }));
    if (results.some(result => result.forbidden)) {
      sessionStorage.removeItem("palette_admin_token"); setToken(""); setNotice("登录已过期，请重新登录"); return;
    }
    setData(current => ({ ...current, ...Object.fromEntries(results.filter(result => result.ok).map(result => [result.key, result.items])) }));
    const failed = results.filter(result => !result.ok).map(result => result.name);
    const detail=results.find(result=>!result.ok&&result.error)?.error;
    setNotice(failed.length ? `${failed.join("、")}数据加载失败${detail?`：${detail}`:"，其余模块仍可使用"}` : "");
  }, []);

  useEffect(() => { const timer=setTimeout(()=>{const saved=sessionStorage.getItem("palette_admin_token")||"";setToken(saved);setReady(true);if(saved)void load(saved)},0);return()=>clearTimeout(timer); }, [load]);
  async function act(item: Item, action: string) {
    if (acting !== null) return;
    let body: Record<string, unknown> = { action };
    if (action === "edit" && active === "artworks") { const title=prompt("修改作品标题",String(item.title||""));if(title===null)return;const tags=prompt("修改标签",String(item.tags||""));if(tags===null)return;const description=prompt("修改作品简介",String(item.description||""));if(description===null)return;body={action,title,tags,description}; }
    if (action === "edit" && active === "profiles") { const displayName=prompt("修改画师昵称",String(item.displayName||""));if(displayName===null)return;const bio=prompt("修改画师简介",String(item.bio||""));if(bio===null)return;body={action,displayName,bio}; }
    if (active === "contacts") { const reply = prompt("请输入回复内容（最多2000字）", String(item.adminReply || "")); if (!reply) return; body = { action: "reply", reply }; }
    if (active === "complaints" && action === "take-down") body = { action, artworkId: Number(prompt("请输入需要侵权下线的作品ID")) };
    setActing(item.id); setNotice("正在处理，请稍候…");
    const response = await fetch(`/api/admin/${active}/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    if (response.status === 401 || response.status === 403) { sessionStorage.removeItem("palette_admin_token"); setToken(""); setActing(null); return; }
    const result=await response.json().catch(()=>({error:""}));
    if (!response.ok) { setNotice(result.error||"操作失败，请稍后重试"); setActing(null); return; }
    setNotice(result.message||"操作成功");
    await load(token); setActing(null);
  }
  if (!ready) return null;
  if (!token) return <AdminLogin onSuccess={async current => { setToken(current); await load(current); }} />;

  return <main className="min-h-screen p-8"><h1 className="text-3xl font-bold">灵犀合规审核中心</h1>{notice&&<p className="mt-4 rounded-xl bg-orange-100 p-3 text-orange-800">{notice}</p>}<AdminTabs tabs={tabs} active={active} data={data} onChange={setActive}/>{active==="site"?<SiteManager token={token}/>:<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data[active].map(item=><article key={item.id} className="rounded-3xl bg-white p-5 shadow"><Card tab={active} item={item}/>{active!=="logs"&&<div className="mt-5 grid grid-cols-2 gap-2">{(active==="artworks"||active==="profiles")&&<button disabled={acting!==null} onClick={()=>act(item,"edit")} className="col-span-2 rounded-full border py-3">编辑资料</button>}<button disabled={acting!==null} onClick={()=>act(item,active==="contacts"?"resolve":active==="reports"?"resolve":"reject")} className="rounded-full border py-3">{active==="contacts"?"回复用户":active==="reports"?"标记处理":"驳回"}</button>{active!=="contacts"&&<button disabled={acting!==null} onClick={()=>act(item,active==="reports"||active==="complaints"?"take-down":"approve")} className="btn">{active==="complaints"?"侵权下线":active==="reports"?"下线/封禁":active==="applications"?"通过认证":"通过"}</button>}{active==="profiles"&&<button disabled={acting!==null} onClick={()=>act(item,"reset-name")} className="col-span-2 text-red-600">重置违规昵称</button>}</div>}</article>)}</div>}</main>;
}
function Card({tab,item}:{tab:string;item:Item}) { if(tab==="artworks") return <ArtworkReviewCard item={item}/>; if(tab==="applications") return <VerificationReviewCard item={item}/>; if(tab==="reports") return <ReportCard item={item}/>; if(tab==="complaints") return <ComplaintCard item={item}/>; if(tab==="contacts") return <ContactCard item={item}/>; if(tab==="logs") return <AdminLogCard item={item}/>; return <><b>{String(item.displayName||item.title||"记录")}</b><p>{String(item.bio||item.realName||"")}</p></>; }
