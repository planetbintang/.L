/* REIC REGISTRY WORKER — bounded, pauseable, logical code materialization. */
(()=>{'use strict';
 if(window.REICRegistryWorker)return;
 const TOTAL=1000000,KEY='reic:registry-worker:v1';
 const state={cursor:0,processed:0,running:false,startedAt:null,finishedAt:null,batchSize:250,intervalMs:1000,maxUnits:5000};
 try{Object.assign(state,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(_){ }
 let timer=null;
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({...state,running:false}));}catch(_){}};
 const emit=()=>window.dispatchEvent(new CustomEvent('reic:registry-progress',{detail:{...state,total:TOTAL,percent:Number((state.processed/TOTAL*100).toFixed(4))}}));
 const tick=()=>{if(!state.running)return;const remaining=Math.min(state.batchSize,state.maxUnits-state.processed,TOTAL-state.cursor);if(remaining<=0){state.running=false;state.finishedAt=new Date().toISOString();save();emit();return;}state.cursor+=remaining;state.processed+=remaining;emit();if(state.processed>=state.maxUnits||state.cursor>=TOTAL){state.running=false;state.finishedAt=new Date().toISOString();save();emit();return;}timer=setTimeout(tick,Math.max(250,state.intervalMs));};
 const start=options=>{if(state.running)return false;const o=options||{};state.batchSize=Math.min(1000,Math.max(1,Number(o.batchSize)||state.batchSize));state.intervalMs=Math.max(250,Number(o.intervalMs)||state.intervalMs);state.maxUnits=Math.min(TOTAL,Math.max(state.processed+1,Number(o.maxUnits)||state.maxUnits));state.running=true;state.startedAt=state.startedAt||new Date().toISOString();state.finishedAt=null;emit();tick();return true;};
 const pause=()=>{state.running=false;if(timer)clearTimeout(timer);timer=null;save();emit();};
 const reset=()=>{pause();state.cursor=0;state.processed=0;state.startedAt=null;state.finishedAt=null;save();emit();};
 window.REICRegistryWorker=Object.freeze({start,pause,reset,status:()=>({...state,total:TOTAL,percent:Number((state.processed/TOTAL*100).toFixed(4))})});
 emit();
})();
