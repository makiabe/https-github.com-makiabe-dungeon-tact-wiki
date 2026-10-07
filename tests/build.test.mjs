import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root=new URL('../_site/',import.meta.url);
const built=fs.existsSync(new URL('data/core.json',root));
test('published initial data excludes gear but preserves all cards and equipment details',{skip:!built},()=>{
 const read=p=>JSON.parse(fs.readFileSync(new URL(p,root)));
 const core=read('data/core.json'),gear=read('data/equipment.json');
 const source=JSON.parse(fs.readFileSync(new URL('../data/game.json',import.meta.url)));
 assert.deepEqual(gear.map(x=>x.id),source.equipment.map(x=>x.id));
 assert.deepEqual(core.equipment.map(x=>x.id),source.equipment.filter(x=>x.abilityCard||x.slot==='card').map(x=>x.id));
 assert.ok(fs.statSync(new URL('data/core.json',root)).size<3_000_000);
 for(const group of ['characters','skills','quests','events','missions','dungeons'])assert.deepEqual(core[group].map(x=>x.id),source[group].map(x=>x.id));
 const check=value=>{if(typeof value==='string'&&value.startsWith('assets/'))assert.ok(fs.existsSync(new URL(value,root)),value);else if(value&&typeof value==='object')Object.values(value).forEach(check);};
 check(core);check(gear);
 const hero=fs.statSync(new URL(core.hero,root)).size,original=fs.statSync(new URL('../'+source.hero,import.meta.url)).size;
 assert.ok(hero<original/2);
 // CSS positions require the original sprite dimensions and bytes.
 assert.deepEqual(fs.readFileSync(new URL(core.portraitAtlas,root)),fs.readFileSync(new URL('../'+source.portraitAtlas,import.meta.url)));
});
