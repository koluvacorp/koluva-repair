'use strict';
const {contextBridge,ipcRenderer}=require('electron');
const invoke=(name,...args)=>ipcRenderer.invoke(`repair:${name}`,...args);
contextBridge.exposeInMainWorld('repairHost',Object.freeze({
 version:ipcRenderer.sendSync('repair:version'),
 win:Object.freeze({cmd:c=>ipcRenderer.send('repair:win',String(c)),isMax:()=>invoke('win:isMax'),onState:cb=>{ipcRenderer.removeAllListeners('repair:win:state');ipcRenderer.on('repair:win:state',(_e,v)=>cb(!!v));}}),
 load:()=>invoke('load'),loadBak:()=>invoke('loadBak'),save:t=>invoke('save',t),saveFile:(n,t,m)=>invoke('saveFile',n,t,m),openFile:()=>invoke('openFile'),
 attach:()=>invoke('attach'),attachment:id=>invoke('attachment',id),saveAttachment:item=>invoke('saveAttachment',item),
 openExternal:u=>invoke('openExternal',u),systemTheme:()=>invoke('systemTheme'),onRequestFlush:cb=>ipcRenderer.on('repair:requestFlush',cb),quitAfterFlush:saved=>ipcRenderer.send('repair:quitAfterFlush',!!saved),
 account:Object.freeze({signIn:p=>invoke('account:signIn',p),google:p=>invoke('account:google',p),recover:p=>invoke('account:recover',p),resend:p=>invoke('account:resend',p),signOut:()=>invoke('account:signOut'),onGoogleError:cb=>{ipcRenderer.removeAllListeners('repair:account:google-error');ipcRenderer.on('repair:account:google-error',(_e,v)=>cb(v));}}),
 license:Object.freeze({info:()=>invoke('license:info'),activate:p=>invoke('license:activate',p),check:()=>invoke('license:check'),contact:()=>invoke('license:contact'),onChanged:cb=>{ipcRenderer.removeAllListeners('repair:license:changed');ipcRenderer.on('repair:license:changed',(_e,v)=>cb(v));}}),
 update:Object.freeze({check:()=>invoke('upd:check'),download:v=>invoke('upd:download',v),install:()=>invoke('upd:install'),onProgress:cb=>{ipcRenderer.removeAllListeners('repair:upd:progress');ipcRenderer.on('repair:upd:progress',(_e,p)=>cb(p));}})
}));
