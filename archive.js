import {STORES,dump,replaceAll} from './db.js';
const VERSION=1;
const RELATED=['inputs','events','tests','feedback'];
export function subset(data,ids){if(!ids)return data;const selected=new Set(ids);const out={};for(const s of STORES){if(s==='batches')out[s]=data[s].filter(x=>selected.has(x.id));else if(RELATED.includes(s))out[s]=data[s].filter(x=>selected.has(x.roastId));else out[s]=[];}const attids=new Set([...out.batches,...RELATED.flatMap(s=>out[s])].flatMap(x=>x.attachmentIds||[]));out.attachments=data.attachments.filter(a=>attids.has(a.id));return out;}
export async function createZip(data,{kind='full'}={}){
  const zip=new JSZip();const normalized={};
  for(const s of STORES){normalized[s]=[];for(const record of (data[s]||[])){if(s==='attachments'){const {blob,...rest}=record;if(!(blob instanceof Blob))throw Error('附件缺少資料：'+record.name);zip.file(`attachments/${record.id}`,new Uint8Array(await blob.arrayBuffer()));normalized[s].push(rest);}else normalized[s].push(record);}}
  zip.file('manifest.json',JSON.stringify({format:'roast-log',schemaVersion:VERSION,kind,exportedAt:new Date().toISOString(),data:normalized},null,2));
  return zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:3}});
}
export async function parseZip(file){
  if(file.size>350*1024*1024)throw Error('檔案超過 350 MB，請先縮小照片後再操作。');
  const zip=await JSZip.loadAsync(new Uint8Array(await file.arrayBuffer()),{checkCRC32:true,createFolders:false});
  const entry=zip.file('manifest.json');if(!entry)throw Error('不是 Roast Log 備份檔：缺少 manifest.json。');
  let manifest;try{manifest=JSON.parse(await entry.async('string'));}catch{throw Error('備份資料 JSON 格式損壞。');}
  if(manifest.format!=='roast-log'||manifest.schemaVersion!==VERSION)throw Error('備份格式不相容，請使用對應版本的 App。');
  const data=manifest.data;if(!data||!STORES.every(s=>Array.isArray(data[s])))throw Error('備份資料結構不完整。');
  if(data.batches.length>100000||data.events.length>1000000)throw Error('備份資料超出安全處理範圍。');
  for(const s of STORES){const seen=new Set();for(const row of data[s]){if(!row || typeof row.id!=='string'||!/^[a-zA-Z0-9_-]{6,100}$/.test(row.id)||seen.has(row.id))throw Error(`${s} 有無效或重複 ID。`);seen.add(row.id);}}
  const roasts=new Set(data.batches.map(x=>x.id));for(const s of RELATED)for(const row of data[s])if(!roasts.has(row.roastId))throw Error(`發現無法對應批次的 ${s} 紀錄。`);
  const attachments=new Set(data.attachments.map(a=>a.id));for(const s of ['batches',...RELATED])for(const row of data[s])for(const id of (row.attachmentIds||[]))if(!attachments.has(id))throw Error('備份存在遺失的附件關聯。');
  for(const attachment of data.attachments){const entry=zip.file(`attachments/${attachment.id}`);if(!entry)throw Error('備份中缺少照片附件：'+attachment.name);attachment.blob=new Blob([await entry.async('uint8array')],{type:attachment.mime||'application/octet-stream'});}
  return {manifest,data};
}
export async function restoreZip(file){const parsed=await parseZip(file);await replaceAll(parsed.data);return parsed;}
// Deterministic field-aware comparison before archival deletion; blobs are validated by ZIP CRC on load.
function canonical(x){if(Array.isArray(x))return x.map(canonical);if(x&&typeof x==='object'){const o={};for(const k of Object.keys(x).sort()){if(k!=='blob')o[k]=canonical(x[k]);}return o;}return x;}
export function archiveMatchesCurrent(archive,current,ids){const a=subset(archive,ids),c=subset(current,ids);for(const s of STORES){const sort=v=>v.slice().sort((x,y)=>x.id.localeCompare(y.id));if(JSON.stringify(canonical(sort(a[s])))!==JSON.stringify(canonical(sort(c[s]))))return false;}return true;}
export function formatSize(n){return n>1024*1024?`${(n/1024/1024).toFixed(1)} MB`:`${Math.max(1,Math.ceil(n/1024))} KB`;}
export async function makeFullBackup(){return createZip(await dump());}
