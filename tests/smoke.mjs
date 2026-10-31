// 靜態流程測試。模擬 IndexedDB 存取與畫面輸出，非 iPhone Safari 實機測試。
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
const src=fs.readFileSync(new URL('../app.js', import.meta.url),'utf8').replace(/^import .*\n/gm,'').replace(/\(async\(\)=>\{try\{await openDb\(\);await migrateLegacyDropNotes\(\);[\s\S]*$/,'');
const db={batches:[],events:[],inputs:[],tests:[],feedback:[],attachments:[]};
const records={};
const root={innerHTML:'',append(){}};
const toast={style:{},classList:{add(){},remove(){}},textContent:''};
const context={
  console,Date,Number,Math,String,Set,Map,Promise,crypto:webcrypto,
  setTimeout,clearTimeout,setInterval:()=>0,
  document:{getElementById(id){return id==='app'?root:id==='toast'?toast:null;},querySelector(){return null;},addEventListener(){}},
  window:{addEventListener(){},scrollTo(){}},
  navigator:{},location:{protocol:'https:'},
  getAll:async s=>structuredClone(db[s]),getOne:async(s,id)=>structuredClone(db[s].find(x=>x.id===id)??null),
  dump:async()=>structuredClone(db),
  setting:async()=>0,openDb:async()=>{},
  transact:async actions=>{for(const a of actions){const store=db[a.store];if(a.kind==='put'){const pos=store.findIndex(x=>x.id===a.value.id);if(pos>=0)store[pos]=structuredClone(a.value);else store.push(structuredClone(a.value));}if(a.kind==='delete')store.splice(store.findIndex(x=>x.id===a.key),1);}},
  write:async(s,r)=>{db[s].push(structuredClone(r));},
  erase:async()=>{},uid:()=>`uuid-${Math.random().toString(36).slice(2)}`,
  createZip:async()=>{},subset:()=>{},parseZip:async()=>{},restoreZip:async()=>{},archiveMatchesCurrent:()=>true,formatSize:()=>''
};
vm.createContext(context);
vm.runInContext(src+'\nglobalThis.test={S,newForm,live,detail,eventAdd,migrateLegacyDropNotes,render,elapsed};',context);
const api=context.test;
assert.match(api.newForm(),/建立批次，進入操作頁/);
assert.doesNotMatch(api.newForm(),/立即入豆並開始計時/);
const b={id:'test1',batchCode:'20261031-01',productName:'試驗豆',roastDateTime:Date.now(),status:'draft',chargeTime:null,roastedWeight:null,dropReason:'',resultObservation:'',colorDescription:'',notes:''};
db.batches.push(b);api.S.page='live';api.S.batchId=b.id;
await api.render();
assert.match(root.innerHTML,/尚未入豆/);
assert.match(root.innerHTML,/00:00/);
assert.equal((root.innerHTML.match(/class="milestone-row /g)||[]).length,8);
assert.ok(root.innerHTML.indexOf('入豆')<root.innerHTML.indexOf('回溫點'));
assert.ok(root.innerHTML.indexOf('回溫點')<root.innerHTML.indexOf('140°C'));
assert.ok(root.innerHTML.indexOf('140°C')<root.innerHTML.indexOf('155°C'));
assert.ok(root.innerHTML.indexOf('155°C')<root.innerHTML.indexOf('170°C'));
assert.ok(root.innerHTML.indexOf('170°C')<root.innerHTML.indexOf('一爆'));
assert.ok(root.innerHTML.indexOf('一爆')<root.innerHTML.indexOf('二爆'));
assert.ok(root.innerHTML.indexOf('二爆')<root.innerHTML.indexOf('下豆'));
assert.match(root.innerHTML,/data-type="gas"/);
assert.match(root.innerHTML,/data-type="air"/);
assert.match(root.innerHTML,/data-type="sample"/);
await assert.rejects(api.eventAdd('turn'),/請先按「入豆」/);
await api.eventAdd('charge');
assert.equal(db.batches[0].status,'roasting');
assert.equal(db.events.filter(x=>x.eventType==='charge').length,1);
await api.eventAdd('t170');
assert.equal(db.events.find(x=>x.eventType==='t170').beanTemperature,170);
await api.eventAdd('t170');
assert.equal(db.events.filter(x=>x.eventType==='t170').length,1);
await api.eventAdd('gas');
await api.eventAdd('gas');
assert.equal(db.events.filter(x=>x.eventType==='gas').length,2);
await api.eventAdd('drop');
assert.equal(db.batches[0].status,'completed');
assert.equal(db.events.filter(x=>x.eventType==='drop').length,1);
assert.match(root.innerHTML,/烘焙成果觀察/);
assert.match(root.innerHTML,/下豆判斷/);
assert.match(root.innerHTML,/data-recordstore="events"/);
// 既有 v1.1 下豆判斷可轉移到下豆事件，不刪除舊欄位。
db.batches.push({...b,id:'legacy',batchCode:'old',status:'completed',dropReason:'老資料的下豆判斷'});
db.events.push({id:'legacy-drop',roastId:'legacy',eventType:'drop',elapsedSeconds:600,note:''});
await api.migrateLegacyDropNotes();
assert.equal(db.events.find(x=>x.id==='legacy-drop').note,'老資料的下豆判斷');
db.events.find(x=>x.id==='legacy-drop').note='';
await api.migrateLegacyDropNotes();
assert.equal(db.events.find(x=>x.id==='legacy-drop').note,'');
console.log('PASS: 建立未計時批次、單欄八節點、啟動／結束、特殊事件、舊資料下豆判斷相容性');
