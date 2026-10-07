import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {eventPlans} from '../event-plans.js';import {fieldGuides} from '../field-guides.js';
const D=JSON.parse(fs.readFileSync(new URL('../data/game.json',import.meta.url)));
for(const lang of ['ja','en']){
 const L=x=>typeof x==='object'?x?.[lang]??'':x??'',T=x=>Array.isArray(x)?x[lang==='ja'?0:1]:L(x);
 const f=fieldGuides({D,L,T,esc:String,element:String,portrait:c=>c.id,itemCard:c=>c.id,link:(type,id,text)=>text,section:(title,body)=>title+body});
 test(`all 24 event articles render with valid assets and localized data (${lang})`,()=>{
  assert.equal(Object.keys(eventPlans).length,24);
  for(const e of D.events){assert.ok(eventPlans[e.id]);const html=f.event(e);assert.ok(html.length>6000);assert.ok(!html.includes('undefined'));if(lang==='en')assert.doesNotMatch(html,/[ぁ-んァ-ヶ一-龠]/);
   for(const id of eventPlans[e.id][0])assert.ok(D.characters.some(c=>c.id===id));
   for(const u of e.battleGuide.enemies){assert.ok(u.sprite,u.name.ja);assert.ok(fs.existsSync(new URL('../'+u.sprite,import.meta.url)));assert.ok(u.skills.length);}
   assert.equal(e.battleGuide.waves.length,3);assert.equal(e.battleGuide.enemies.filter(x=>x.boss).length,1);
  }
 });
 test(`dungeon and quest guides render (${lang})`,()=>{for(const html of [f.dungeon(),f.quests()]){assert.ok(html.includes('<figure'));assert.ok(!html.includes('undefined'));if(lang==='en')assert.doesNotMatch(html,/[ぁ-んァ-ヶ一-龠]/);}});
}
