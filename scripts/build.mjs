import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
const root=fileURLToPath(new URL('../',import.meta.url)),out=path.join(root,'_site');
await fs.rm(out,{recursive:true,force:true});await fs.mkdir(out,{recursive:true});
const mapping=new Map();let before=0,after=0,count=0;
async function copyImages(dir){for(const entry of await fs.readdir(path.join(root,dir),{withFileTypes:true})){
 const rel=dir+'/'+entry.name,dest=path.join(out,rel);
 if(entry.isDirectory()){await fs.mkdir(dest,{recursive:true});await copyImages(rel);continue;}
 const bytes=await fs.readFile(path.join(root,rel));let output=bytes,target=dest;
 // Atlas/sprite dimensions are used by CSS coordinates; preserve those assets.
 if(/\.(png|jpe?g|webp)$/i.test(rel)&&!/(portraits|characters\/|guide-sprites\/|favicon|apple-touch|screenshots\/)/.test(rel)){
  const compressed=await sharp(bytes).rotate().resize({width:1440,height:1440,fit:'inside',withoutEnlargement:true}).webp({quality:80,effort:5}).toBuffer();
  if(compressed.length<bytes.length){output=compressed;target=dest.replace(/\.[^.]+$/,'.webp');mapping.set(rel,path.relative(out,target));count++;}
 }
 await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,output);before+=bytes.length;after+=output.length;
}}
await copyImages('assets');
const rewrite=text=>{for(const [from,to] of mapping)text=text.split(from).join(to);return text;};
for(const file of await fs.readdir(root))if(/\.(html|css|js)$/.test(file))await fs.writeFile(path.join(out,file),rewrite(await fs.readFile(path.join(root,file),'utf8')));
await fs.mkdir(path.join(out,'data'));
const data=JSON.parse(rewrite(await fs.readFile(path.join(root,'data/game.json'),'utf8')));
const equipment=data.equipment;data.equipment=equipment.filter(e=>e.abilityCard||e.slot==='card');
await fs.writeFile(path.join(out,'data/core.json'),JSON.stringify(data));
await fs.writeFile(path.join(out,'data/equipment.json'),JSON.stringify(equipment));
await fs.writeFile(path.join(out,'.nojekyll'),'');
console.log(`Images: ${count} optimized; ${(before/1e6).toFixed(1)} MB → ${(after/1e6).toFixed(1)} MB. Initial JSON: ${(Buffer.byteLength(JSON.stringify(data))/1e6).toFixed(2)} MB.`);
