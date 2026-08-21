export type StoredAccount={token:string;user:{id?:number;displayName?:string;username?:string;role?:"artist"|"seeker"}};
const KEY="palette_accounts";
export function accounts():StoredAccount[]{try{const value=JSON.parse(localStorage.getItem(KEY)||"[]");return Array.isArray(value)?value.filter(item=>item?.token&&item?.user):[]}catch{return[]}}
export function rememberAccount(account:StoredAccount){const next=[account,...accounts().filter(item=>item.user.id!==account.user.id&&item.token!==account.token)].slice(0,5);localStorage.setItem(KEY,JSON.stringify(next));}
export function activateAccount(account:StoredAccount){localStorage.setItem("palette_auth_version","2");localStorage.setItem("palette_token",account.token);localStorage.setItem("palette_user",JSON.stringify(account.user));rememberAccount(account);dispatchEvent(new Event("palette-auth"));}
export function forgetAccount(token:string){localStorage.setItem(KEY,JSON.stringify(accounts().filter(item=>item.token!==token)));dispatchEvent(new Event("palette-auth"));}
export function clearAllAccounts(){localStorage.removeItem(KEY);localStorage.removeItem("palette_token");localStorage.removeItem("palette_user");dispatchEvent(new Event("palette-auth"));}
