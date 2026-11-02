const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function mountFeatureLayer(app,feature){
 const code=String(feature.id).padStart(3,'0');
 const manifestUrl=new URL('../../../layers/feature-'+code+'/manifest.json',location.href);
 const response=await fetch(manifestUrl,{cache:'no-store'});
 if(!response.ok)throw new Error('Manifest lapisan '+code+' tidak ditemukan');
 const manifest=await response.json();
 const serviceResponse=await fetch(new URL(manifest.service,manifestUrl),{cache:'no-store'});
 if(!serviceResponse.ok)throw new Error('Kontrak layanan '+code+' tidak ditemukan');
 const service=await serviceResponse.json();
 const controllerModule=await import(new URL(manifest.controller,manifestUrl).href);
 if(typeof controllerModule.default!=='function')throw new Error('Controller '+code+' tidak memiliki entrypoint');
 return controllerModule.default({app,feature,manifest,service});
}
