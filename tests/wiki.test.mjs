import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath,pathToFileURL} from 'node:url';import {ratesAt} from '../rates.js';import {strings} from '../strings.js';import {guides} from '../guides.js';
const root=fileURLToPath(new URL('../',import.meta.url)),D=JSON.parse(fs.readFileSync(new URL('../data/game.json',import.meta.url)));
test('snapshot is identified and all content has unique stable IDs',()=>{assert.ok(D.meta.updated);assert.ok(!JSON.stringify(D).match(/github\.com|\"source\"|\"commit\"|\"repository\"/));for(const key of ['characters','skills','equipment','missions','quests','events','dungeons','camp']){assert.ok(D[key].length>0);assert.equal(new Set(D[key].map(x=>x.id)).size,D[key].length);}});
test('all internal references resolve',()=>{const has=(key,id)=>D[key].some(x=>x.id===id);for(const c of D.characters)for(const s of c.skills)assert.ok(has('skills',s.id),s.id);for(const q of D.quests)assert.ok(has('equipment',q.cardId));for(const e of D.events)assert.ok(has('characters',e.characterId));for(const m of D.missions)for(const e of m.enemies)for(const id of e.skills)assert.ok(has('skills',id),id);});
test('every referenced original image ships locally',()=>{for(const g of ['characters','equipment','missions','events'])for(const x of D[g])if(x.art)assert.ok(fs.existsSync(path.join(root,x.art)),x.art);assert.ok(fs.existsSync(path.join(root,D.portraitAtlas)));});
test('all localized fields and interface strings are bilingual without Japanese fallback in English',()=>{const walk=x=>{if(!x||typeof x!=='object')return;if(typeof x.ja==='string'){assert.equal(typeof x.en,'string');assert.doesNotMatch(x.en,/[ぁ-んァ-ヶ一-龯]/);}for(const v of Object.values(x))walk(v);};walk(D);for(const [key,pair]of Object.entries(strings)){assert.equal(pair.length,2,key);assert.ok(pair.every(Boolean),key);}for(const g of Object.values(guides))for(const s of g.sections){assert.equal(s[0].length,2);assert.equal(s[1].length,2);}});
test('45 distinct quest rewards and all second-chapter entries are present',()=>{assert.equal(D.quests.length,45);assert.equal(D.equipment.filter(e=>e.permanentQuest).length,45);assert.equal(D.missions.filter(m=>m.arc===2).length,24);assert.equal(D.missions.find(m=>m.id==='chapter2-23').phases,10);assert.equal(D.missions.find(m=>m.id==='chapter2-24').phases,5);});
test('summon probabilities sum to one and never include story-only units',()=>{for(const day of [7,11,17,20,22,27])for(const kind of ['normal','weekly','limited','sunday','doubles','seven']){const result=ratesAt(D,kind,Date.parse(`2026-09-${String(day).padStart(2,'0')}T12:00:00+09:00`));if(!result.available){assert.deepEqual(result.rows,[]);continue;}assert.ok(Math.abs(result.rows.reduce((n,r)=>n+r.probability,0)-1)<1e-12);assert.ok(result.rows.every(r=>D.characters.find(c=>c.id===r.id).acquisition!=='story'));}});
test('summon formula matches actual game for date boundaries and all six banners',{skip:!process.env.GAME_SOURCE},async()=>{const {summonRates}=await import(pathToFileURL(path.join(process.env.GAME_SOURCE,'dist/live-content.js')));for(const time of ['2026-09-06T00:00:00+09:00','2026-09-07T00:00:00+09:00','2026-09-11T14:59:59+09:00','2026-09-11T15:00:00+09:00','2026-09-15T23:59:59+09:00','2026-09-16T00:00:00+09:00','2026-09-22T00:00:00+09:00','2027-01-27T12:00:00+09:00'])for(const kind of ['normal','weekly','limited','sunday','doubles','seven'])assert.deepEqual(ratesAt(D,kind,Date.parse(time)).rows,summonRates(kind,Date.parse(time)),time+' '+kind);});

test('editorial guides are bilingual and link to existing destinations',async()=>{
 const {articles}=await import('../articles.js');
 const routes=new Set([...Object.keys(articles),'story','combat','camp','dungeons','quests','cards','equipment','events','schedule','recommendations','characters','growth','summons']);
 assert.ok(Object.keys(articles).length>=10);
 for(const [id,a] of Object.entries(articles)){
  for(const pair of [a.title,a.intro,...a.sections.flatMap(s=>s)]){assert.equal(pair.length,2,id);assert.ok(pair.every(Boolean),id);assert.doesNotMatch(pair[1],/[ぁ-んァ-ヶ一-龯]/,id);}
  for(const route of a.links)assert.ok(routes.has(route),id+' -> '+route);
 }
});
test('published UI contains no game source links or commit identifiers',()=>{
 for(const file of ['app.js','strings.js','guides.js','articles.js','index.html']){
  const s=fs.readFileSync(path.join(root,file),'utf8');assert.doesNotMatch(s,/github\.com\/makiabe\/dungeon-tact-ios|D\.meta\.(commit|repository)|\/blob\//,file);
 }
});
test('browser entry scripts parse',async()=>{
 const {execFileSync}=await import('node:child_process');for(const file of ['app.js','articles.js'])execFileSync(process.execPath,['--check',path.join(root,file)]);
});

test('weapon ranks cover all weapons and use matching primary-stat ranges',()=>{
 const grades=['F','E','D','C','B','A','S'];
 for(const type of ['sword','bow','spear','sling','staff']){
  const stat=type==='staff'?'mag':'atk',items=D.equipment.filter(e=>e.slot==='weapon'&&e.weaponType===type),min=Math.min(...items.map(e=>e.stats[stat])),max=Math.max(...items.map(e=>e.stats[stat]));
  assert.ok(items.length);
  for(const e of items){assert.deepEqual(e.statRankBasis,{version:1,method:'primary-stat-equal-bands',weaponType:type,stat,value:e.stats[stat],min,max});assert.equal(e.statRank,grades[Math.min(6,Math.floor((e.stats[stat]-min)/(max-min)*7))]);}
 }
 assert.equal(D.equipment.filter(e=>e.statRank).length,D.equipment.filter(e=>e.slot==='weapon').length);
});
