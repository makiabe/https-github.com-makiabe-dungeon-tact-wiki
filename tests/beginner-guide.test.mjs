import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {beginnerGuide} from '../beginner-guide.js';
const D=JSON.parse(fs.readFileSync(new URL('../data/game.json',import.meta.url)));
for(const lang of ['ja','en']) test(`illustrated beginner guide and character greetings (${lang})`,()=>{
 const T=x=>x[lang==='ja'?0:1];
 const html=beginnerGuide({D,T,esc:String});
 assert.equal((html.match(/<figure/g)||[]).length,6);
 assert.ok(!html.includes('undefined'));
 if(lang==='en')assert.doesNotMatch(html,/[ぁ-んァ-ヶ一-龠]/);
 for(const [,src] of html.matchAll(/<img src="([^"]+)"/g))assert.ok(fs.existsSync(new URL('../'+src,import.meta.url)),src);
 for(const c of D.characters)assert.ok(c.greeting?.[lang]?.trim(),c.id);
 assert.equal(D.characters.find(c=>c.id==='limited_amberorchard').greeting.ja,'無事に帰ろう。それが、私たちの約束。');
});
