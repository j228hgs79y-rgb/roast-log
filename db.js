export const STORES=['batches','inputs','events','tests','feedback','attachments','greenLots'];
const DBNAME='roastlog-personal-v1';
let dbPromise;
export function openDb(){
  if(dbPromise) return dbPromise;
  dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DBNAME,2);
    req.onupgradeneeded=()=>{
      const db=req.result;
      for(const name of STORES){if(!db.objectStoreNames.contains(name)){const store=db.createObjectStore(name,{keyPath:'id'});if(name!=='batches' && name!=='attachments' && name!=='greenLots')store.createIndex('roastId','roastId',{unique:false});}}
      if(!db.objectStoreNames.contains('settings'))db.createObjectStore('settings',{keyPath:'key'});
    };
    req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>db.close();resolve(db);};
    req.onerror=()=>reject(req.error);
  });
  return dbPromise;
}
export function uid(){return typeof crypto.randomUUID==='function'?crypto.randomUUID():`id-${Date.now()}-${Math.random().toString(36).slice(2)}`;}
export async function getAll(store){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly');const r=tx.objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function getOne(store,id){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readonly');const r=tx.objectStore(store).get(id);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function setting(key,fallback=null){const obj=await getOne('settings',key);return obj?.value??fallback;}
export async function setSetting(key,value){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction('settings','readwrite');tx.objectStore('settings').put({key,value});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
export async function write(store,record){return transact([{store,kind:'put',value:record}]);}
export async function erase(store,id){return transact([{store,kind:'delete',key:id}]);}
export async function transact(actions,{markModified=true}={}){
  const db=await openDb(); const names=[...new Set([...actions.map(a=>a.store),...(markModified?['settings']:[])])];
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(names,'readwrite');
    for(const a of actions){const store=tx.objectStore(a.store);if(a.kind==='put')store.put(a.value);else if(a.kind==='delete')store.delete(a.key);else if(a.kind==='clear')store.clear();}
    if(markModified)tx.objectStore('settings').put({key:'lastModifiedAt',value:Date.now()});
    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
  });
}
export async function dump(){const items=await Promise.all(STORES.map(x=>getAll(x)));return Object.fromEntries(STORES.map((name,i)=>[name,items[i]]));}
export async function replaceAll(data){const actions=[];for(const s of STORES){actions.push({store:s,kind:'clear'});for(const val of (data[s]||[]))actions.push({store:s,kind:'put',value:val});}await transact(actions);}
export async function removeBatches(ids){const idSet=new Set(ids);const all=await dump();const actions=[];
  for(const b of all.batches.filter(x=>idSet.has(x.id)))actions.push({store:'batches',kind:'delete',key:b.id});
  const related=[...all.inputs,...all.events,...all.tests,...all.feedback].filter(x=>idSet.has(x.roastId));
  for(const r of related){const store= r._store|| (all.inputs.includes(r)?'inputs':all.events.includes(r)?'events':all.tests.includes(r)?'tests':'feedback');actions.push({store,kind:'delete',key:r.id});}
  const attachmentIds=new Set(related.flatMap(x=>x.attachmentIds||[]).concat(all.batches.filter(x=>idSet.has(x.id)).flatMap(x=>x.attachmentIds||[])));
  for(const a of all.attachments.filter(a=>attachmentIds.has(a.id)))actions.push({store:'attachments',kind:'delete',key:a.id});
  if(actions.length)await transact(actions);
}
