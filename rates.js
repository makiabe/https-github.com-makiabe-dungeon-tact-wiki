// Mirrors live-content.js. Verified against the source game by the sync test.
export function ratesAt(data,kind,now){
 const day=86400000,jst=9*3600000,d=new Date(now+jst),pool=data.characters.filter(c=>data.normalPool.includes(c.id));let featured=[],available=true;
 if(kind==='sunday'){featured=['rukiwa'];available=d.getUTCDay()===0;}
 if(kind==='doubles'){featured=['milena'];available=[11,22].includes(d.getUTCDate());}
 if(kind==='seven'){featured=['nonoa'];available=[7,17,27].includes(d.getUTCDate());}
 if(kind==='limited'){featured=[data.events.find(e=>e.month===d.getUTCMonth()+1&&e.half===(d.getUTCDate()<16?1:2)).characterId];}
 if(kind==='weekly'){const days=(d.getUTCDay()+3)%7;let start=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-days,6);if(start>now)start-=7*day;const week=Math.floor(start/(7*day));featured=[5,4].map(r=>{const group=pool.filter(c=>c.rarity===r);return group[((week+r*3)%group.length+group.length)%group.length].id;});}
 if(!available)return {available,rows:[]};
 const rows=[[5,.05],[4,.30],[3,.65]].flatMap(([rarity,rate])=>{const picks=featured.filter(id=>data.characters.some(c=>c.id===id&&c.rarity===rarity&&c.acquisition!=='story')).slice(0,1),normal=pool.filter(c=>c.rarity===rarity&&!picks.includes(c.id));return [...picks.map(id=>({id,rarity,probability:rate*.5,pickup:true})),...normal.map(c=>({id:c.id,rarity,probability:rate*(picks.length?.5:1)/normal.length,pickup:false}))];});return {available,rows};
}
