// ─── STAT CALCULATIONS ────────────────────────────────────────────────────────
function sc(v,m){const p=v/m;return p>0.6?"#33ff88":p>0.3?"#ffaa00":"#ff3333";}
function clsColor(cls){return cls==="tank"?"#4488ff":cls==="support"?"#44ff88":"#ff8844";}
function threatColor(t){return P_COLORS[t.priority]||"#ffaa00";}

function effStats(hero,rom,dis){
  const m=CAREER[hero.career]?.mult||1;
  let power=hero.basePower*m;
  let maxHP=Math.round(hero.baseHP*m)+(hero.mechaBonus||0);
  let regenSec=hero.regenSec;
  if(rom){Object.keys(rom).forEach(k=>{const ids=k.split(",").map(Number);if(ids.includes(hero.id)){power*=1.1;maxHP=Math.round(maxHP*1.1);regenSec=Math.max(1,Math.floor(regenSec/2));}});}
  if(dis&&dis[hero.id]?.length>0)power*=0.85;
  return{power,maxHP,regenSec};
}

function canDeploy(h){return h.status!=="deployed"&&h.status!=="gameLocked"&&h.status!=="shopLocked"&&h.status!=="kia"&&h.status!=="exhausted";}

function isSuicide(hero,allH,pids){
  if(pids.length!==1)return false;
  const{maxHP}=effStats(hero,{},{});
  if(hero.currentHP>=10)return false;
  const full=allH.filter(h=>h.status==="ready"&&!pids.includes(h.id));
  return full.filter(h=>{const{maxHP:m}=effStats(h,{},{});return h.currentHP>=m;}).length>=2;
}

function rollMission(heroes,threat,rom,dis){
  if(heroes.some(h=>h.isJohn)){
    if(threat.isCKJohnTeamUp)return heroes.length>=10&&heroes.filter(h=>effStats(h,rom,dis).power>5).length>=10?"success":"failure";
    return"success";
  }
  if(heroes.some(h=>h.title==="El Infinite")&&heroes.length<5)return Math.random()<0.25?"partial":"failure";
  const stats=heroes.map(h=>effStats(h,rom,dis));
  let avgP=stats.reduce((a,s)=>a+s.power,0)/stats.length;
  const classes=new Set(heroes.map(h=>h.cls));
  if(classes.size>1)avgP*=1.04;
  heroes.forEach(h=>{heroes.forEach(h2=>{if(h.id!==h2.id&&h.affiliates?.includes(h2.title))avgP*=1.04;});});
  if(heroes.length===1&&heroes[0].title==="Shadowmere")avgP+=0.4;
  if(heroes.length>=2&&heroes.some(h=>h.title==="Greywulf"))avgP+=0.5;
  if(heroes.some(h=>h.title==="Ironside"))avgP+=0.3;
  if(threat.isOcean&&heroes.some(h=>h.title==="Hydrothylre"))avgP+=3.4;
  if(heroes.some(h=>h.title==="Captain Shamrock"))avgP+=1.0;
  let bonus=0;
  if(threat.type==="kaiju")bonus+=0.08;
  if(threat.type==="mystic"&&heroes.some(h=>["Seraph","Morgana","The Crimson Knight"].includes(h.title)))bonus+=0.12;
  if(threat.type==="tech"&&heroes.some(h=>["Adrenaline Junkie","Dr. Voidance"].includes(h.title)))bonus+=0.1;
  if(threat.type==="military"&&heroes.some(h=>["Ironside","The Sportsman"].includes(h.title)))bonus+=0.1;
  const euroLocs=["Europe","Italy","France","Germany","Belgium","Monaco","Switzerland","Austria","Romania","Transylvania","Scotland","Ireland","Iceland"];
  if(heroes.some(h=>h.title==="Golgotha")&&euroLocs.some(e=>threat.loc?.includes(e)))bonus+=0.15;
  let disP=0;
  heroes.forEach(h=>{if(dis[h.id])heroes.forEach(h2=>{if(dis[h.id].includes(h2.id))disP+=0.07;});});
  const diff=threat.priority==="red"?-0.18:threat.priority==="orange"?-0.10:threat.priority==="yellow"?-0.02:-0.22;
  const chance=Math.min(0.93,Math.min(1,avgP/10)+bonus+diff-disP);
  if(heroes.some(h=>h.critChance&&Math.random()<h.critChance)&&!["red","purple"].includes(threat.priority))return"success";
  const r=Math.random();
  if(r<chance*0.55)return"success";
  if(r<chance)return"partial";
  return"failure";
}

function calcDmg(outcome,hero){
  if(hero.isJohn){const base=outcome==="success"?[3,10]:outcome==="partial"?[8,20]:[15,30];const raw=Math.floor(Math.random()*(base[1]-base[0])+base[0]);return{health:Math.floor(raw/2)};}
  const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
  return{health:Math.floor(Math.random()*(base[1]-base[0])+base[0])};
}

const WIN1=500,WIN2=1000,VILLAIN_TEAM_SCORE=120;