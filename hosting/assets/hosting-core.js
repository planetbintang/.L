/* HOSTING REIC client. Production data is server-owned; browser storage is never the source of truth. */
(()=>{"use strict";
const API= String(window.PB_HOSTING_API_BASE || document.querySelector('meta[name="hosting-api"]')?.content || "/api/hosting/v1").replace(/\/+$/, "");
const sessionKey="pb.hosting.session";
const readSession=()=>{try{return JSON.parse(sessionStorage.getItem(sessionKey)||"null")}catch{return null}};
const saveSession=s=>{if(s?.accessToken)sessionStorage.setItem(sessionKey,JSON.stringify(s));else sessionStorage.removeItem(sessionKey)};
async function request(path,{method="GET",body,auth=true}={}){const s=readSession();const headers={"Accept":"application/json"};if(body!==undefined)headers["Content-Type"]="application/json";if(auth&&s?.accessToken)headers.Authorization="Bearer "+s.accessToken;
let r;try{r=await fetch(API+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),credentials:"same-origin"});}catch(e){throw new Error("BACKEND_TIDAK_TERHUBUNG: API Hosting belum tersedia atau belum dikonfigurasi.");}
const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.message||("Permintaan gagal ("+r.status+")"));return data;}
const log=async(action,resource,metadata={})=>{try{await request("/activity",{method:"POST",body:{action,resource,metadata}})}catch(e){console.warn("Hosting activity:",e.message)}};
window.HostingREIC={API,request,readSession,saveSession,logout:()=>saveSession(null),log};
})();