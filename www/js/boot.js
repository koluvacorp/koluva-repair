'use strict';
(async()=>{
 const L=window.Repair,S=window.RepairStore;
 const hostQuit=ok=>window.repairHost.quitAfterFlush(ok);
 window.repairHost.onRequestFlush(async()=>{try{await S.flush();hostQuit(true)}catch{L.toast(L.t('saveError'));hostQuit(false)}});
 try{
  const preferred=(navigator.language||'es').slice(0,2),r=await S.load(['es','en','pt','fr'].includes(preferred)?preferred:'es');
  await L.loadLicense();L.applyPrefs();document.getElementById('app').hidden=false;L.render();
  if(r.corrupt)L.toast(L.t('corrupt'));else if(r.recovered)L.toast(L.t('recovered'));
  await L.opening();
  if(r.fresh||!S.state.shop.name)L.showSetup();else if(!S.state.settings.tourDone)L.showTour(0);
  L.scheduleUpdateChecks();
  S.onStatus(status=>{const el=document.getElementById('save');if(el)el.textContent=status==='saving'?'…':status==='saved'?L.t('saved'):status==='error'?L.t('saveError'):'';});
 }catch(err){
  console.error('Koluva Repair startup failed',err);
  document.body.replaceChildren();
  const box=document.createElement('main');
  box.setAttribute('role','alert');
  box.style.cssText='box-sizing:border-box;min-height:100vh;display:grid;place-content:center;justify-items:start;gap:14px;padding:32px;font:16px/1.5 system-ui,sans-serif;color:#f4f4f5;background:#141416';
  const title=document.createElement('h1');title.textContent='Koluva Repair no pudo iniciar';title.style.cssText='margin:0;font-size:22px';
  const message=document.createElement('p');message.textContent='Tus archivos locales no se modificaron. Volvé a intentar abrir la aplicación.';message.style.cssText='max-width:480px;margin:0;color:#c8c8cc';
  const retry=document.createElement('button');retry.type='button';retry.textContent='Reintentar';retry.style.cssText='margin-top:4px;padding:10px 18px;border:0;border-radius:8px;background:#8a0f24;color:white;font:inherit;cursor:pointer';retry.addEventListener('click',()=>location.reload());
  box.append(title,message,retry);document.body.append(box);
 }
})();
