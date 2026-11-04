/* VMDESKTOPREIC ENVIRONMENT — centralized runtime profile. */
(()=> {
 'use strict';
 const root=window.VMDESKTOPREIC||(window.VMDESKTOPREIC={});
 const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const coarsePointer=window.matchMedia&&window.matchMedia('(pointer: coarse)').matches;
 const env=Object.freeze({
  name:'VMDESKTOPREIC',
  edition:'ELEGANT-MODERN',
  version:'1.0.0',
  mode:window.location.protocol==='file:'?'local':'web',
  platform:/Android/i.test(navigator.userAgent)?'android':/iPhone|iPad|iPod/i.test(navigator.userAgent)?'ios':/Win/i.test(navigator.platform)?'windows':/Mac/i.test(navigator.platform)?'macos':'web',
  viewport:Object.freeze({width:()=>window.innerWidth,height:()=>window.innerHeight}),
  capabilities:Object.freeze({touch:coarsePointer,reducedMotion:!!reduceMotion,online:navigator.onLine!==false,storage:!!window.localStorage}),
  paths:Object.freeze({root:'./',styles:'./',modules:'./',environment:'./environment/',integration:'./integration/'}),
  features:Object.freeze({componentRegistry:true,eventBridge:true,environmentProfile:true,legacyRuntimePreserved:true})
 });
 root.environment=env;
 document.documentElement.dataset.vmEnvironment=env.mode;
 document.documentElement.dataset.vmEdition=env.edition.toLowerCase();
 window.dispatchEvent(new CustomEvent('vmreic:environment-ready',{detail:env}));
})();