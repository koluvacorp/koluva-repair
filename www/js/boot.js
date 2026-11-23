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
 }catch(err){document.body.innerHTML='';const box=document.createElement('main');box.style.cssText='padding:32px;font:16px system-ui';box.textContent='Koluva Repair no pudo iniciar. Tus archivos locales no se modificaron.';document.body.append(box);console.error(err);}
})();
