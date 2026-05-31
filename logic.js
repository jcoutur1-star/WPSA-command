// ─── STAT CALCULATIONS ────────────────────────────────────────────────────────
function sc(v,m){const p=v/m;return p>0.6?"#33ff88":p>0.3?"#ffaa00":"#ff3333";}
function clsColor(cls){return cls==="tank"?"#4488ff":cls==="support"?"#44ff88":"#ff8844";}
function threatColor(t){return P_COLORS[t.priority]||"#ffaa00";}

function effStats(hero,rom,dis){
  const m=CAREER[hero.career]?.mult||1;
  let power=hero.basePower*m;
  // Corvair veteran global buff: +0.5 power to every hero on the roster
  if(hero._corvairBuff)power+=0.5;
  // Ironside Command Aura: +0.3 power to all teammates (flag set at deploy/roll time)
  if(hero._ironsideAura)power+=0.3;
  let maxHP=Math.round(hero.baseHP*m)+(hero.mechaBonus||0);
  // IceBerg deployed bonus: +10 HP while IceBerg is on the same mission
  if(hero._icebergBonus)maxHP+=10;
  // Conductor Resonance: +15 HP to tank-class heroes on same mission
  if(hero._conductorBonus)maxHP+=15;
  let regenSec=hero.regenSec;
  if(rom){Object.keys(rom).forEach(k=>{const ids=k.split(",").map(Number);if(ids.includes(hero.id)){power*=1.1;maxHP=Math.round(maxHP*1.1);regenSec=Math.max(1,Math.floor(regenSec/2));}});}
  // Eclipso lonely penalty: -30% power if no positive affiliates on team (handled at rollMission via flag)
  if(dis&&dis[hero.id]?.length>0)power*=0.85;
  return{power,maxHP,regenSec};
}

function canDeploy(h){return h.status!=="deployed"&&h.status!=="gameLocked"&&h.status!=="shopLocked"&&h.status!=="kia"&&h.status!=="turned"&&h.status!=="exhausted"&&h.status!=="offworld";}

function isSuicide(hero,allH,pids){
  if(pids.length!==1)return false;
  if(hero.currentHP>=30)return false;
  const full=allH.filter(h=>h.status==="ready"&&!pids.includes(h.id));
  return full.filter(h=>{const{maxHP:m}=effStats(h,{},{});return h.currentHP>=m;}).length>=2;
}

function rollMission(heroes,threat,rom,dis){
  if(heroes.some(h=>h.isJohn)){
    if(threat.isCKJohnTeamUp)return heroes.length>=10&&heroes.filter(h=>effStats(h,rom,dis).power>7).length>=10?"success":"failure";
    return"success";
  }
  if(heroes.some(h=>h.title==="El Infinite")&&heroes.length<5)return Math.random()<0.25?"partial":"failure";

  // Eclipso lonely penalty: -30% power if no positive affiliates present
  const eclipso=heroes.find(h=>h.eclipsoLonelyPenalty);
  const eclipsoAlone=eclipso&&!heroes.some(h=>h.id!==eclipso.id&&(eclipso.affiliates||[]).includes(h.title));

  const ironsidePresent=heroes.some(h=>h.title==="Ironside");
  const stats=heroes.map(h=>{
    const decorated={...h,_ironsideAura:ironsidePresent&&h.title!=="Ironside"};
    const s=effStats(decorated,rom,dis);
    if(h.eclipsoLonelyPenalty&&eclipsoAlone)return{...s,power:s.power*0.7};
    return s;
  });
  const sumW=stats.reduce((a,s)=>a+s.power,0);
  let avgP=sumW>0?stats.reduce((a,s)=>a+(s.power*s.power),0)/sumW:0;
  const classes=new Set(heroes.map(h=>h.cls));
  if(classes.size>1)avgP*=1.04;
  heroes.forEach(h=>{heroes.forEach(h2=>{if(h.id!==h2.id&&h.affiliates?.includes(h2.title))avgP*=1.04;});});
  if(heroes.length===1&&heroes[0].title==="Shadowmere")avgP+=0.4;
  if(heroes.length>=2&&heroes.some(h=>h.title==="Greywulf"))avgP+=0.5;
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
  // Villain team-ups: add extra difficulty based on their combined power vs hero avg power
  let teamUpPenalty=0;
  if(threat.isTeamUp&&threat.teamUpPower){
    const combinedMight=threat.teamUpPower;
    const heroPower=stats.reduce((a,s)=>a+s.power,0)/stats.length;
    teamUpPenalty=Math.max(0,(combinedMight-heroPower*heroes.length)*0.015);
  }
  const chance=Math.min(0.93,Math.min(1,avgP/10)+bonus+diff-disP-teamUpPenalty);
  // The Sportsman: 1-in-20 chance of instant kill against any threat
  if(heroes.some(h=>h.title==="The Sportsman"&&Math.random()<0.05)&&!["red","purple"].includes(threat.priority))return"success";
  if(heroes.some(h=>h.critChance&&h.title!=="The Sportsman"&&Math.random()<h.critChance)&&!["red","purple"].includes(threat.priority))return"success";
  const r=Math.random();
  if(r<chance*0.55)return"success";
  if(r<chance)return"partial";
  return"failure";
}

function calcDmg(outcome,hero,threat,allDeployed){
  const allHeroes=allDeployed||[hero];

  // ── CK & John Rogue: leaves every hero at exactly 1 HP (never kills) ──
  if(threat&&threat.leavesAt1HP){
    return{health:Math.max(0,hero.currentHP-1)};
  }

  // ── Typhon: 280 split evenly, max 50 to John ──
  if(threat&&threat.typhonEffect){
    const share=Math.round(280/allHeroes.length);
    if(hero.isJohn)return{health:Math.min(50,share)};
    return{health:share};
  }

  // ── Maniac: exact 50 to John, exact 40 to all others except immune heroes ──
  if(threat&&threat.maniacEffect){
    if(hero.isJohn)return{health:50};
    const immune=["The Crimson Knight","The Dragon of the Daimyo","Captain Shamrock","IceBerg"];
    if(immune.includes(hero.title))return{health:0};
    return{health:40};
  }

  // ── Cat Stuck in a Tree: exactly 60 to John, no special effect on others ──
  if(threat&&threat.catTreeEffect){
    if(hero.isJohn)return{health:60};
    // falls through to normal damage below
  }

  // ── Reaper: 45 damage to support class ──
  if(threat&&threat.reaperEffect&&hero.cls==="support")return{health:45};
  // ── Calaxes: 30 damage to tanks ──
  if(threat&&threat.calaxesEffect&&hero.cls==="tank")return{health:30};
  // ── Archonois: 30 damage to cannons ──
  if(threat&&threat.archonoisEffect&&hero.cls==="cannon")return{health:30};

  // ── Leviathan: +10 per hero over 4 ──
  if(threat&&threat.leviathanEffect){
    const extra=Math.max(0,allHeroes.length-4)*10;
    const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
    const raw=Math.floor(Math.random()*(base[1]-base[0])+base[0])+extra;
    return{health:raw};
  }

  // ── Silver Meadows HOA: +10 per hero over 4 ──
  if(threat&&threat.hoaEffect){
    const extra=Math.max(0,allHeroes.length-4)*10;
    const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
    const raw=Math.floor(Math.random()*(base[1]-base[0])+base[0])+extra;
    return{health:raw};
  }

  // ── Demonic Outbreak: +10 per hero over 4 ──
  if(threat&&threat.demonicEffect){
    const extra=Math.max(0,allHeroes.length-4)*10;
    const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
    const raw=Math.floor(Math.random()*(base[1]-base[0])+base[0])+extra;
    return{health:raw};
  }

  // ── Undead Mummy: ×2 to male heroes ──
  if(threat&&threat.mummyEffect&&hero.isMale){
    const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
    return{health:Math.floor(Math.random()*(base[1]-base[0])+base[0])*2};
  }

  // ── Sentient Video Game: ×2 to female heroes ──
  if(threat&&threat.videoGameEffect&&hero.isFemale){
    const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
    return{health:Math.floor(Math.random()*(base[1]-base[0])+base[0])*2};
  }

  // ── Seven-Headed Dragon: ×1.05 to cannons ──
  if(threat&&threat.sevenDragonEffect&&hero.cls==="cannon"){
    const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
    return{health:Math.round(Math.floor(Math.random()*(base[1]-base[0])+base[0])*1.05)};
  }

  // ── Zombified Asian Giant Hornets: ×4 to bugAllergy heroes ──
  if(threat&&threat.zombieHornetEffect&&hero.bugAllergy){
    const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
    return{health:Math.floor(Math.random()*(base[1]-base[0])+base[0])*4};
  }

  // ── Silphana's mace: 10× vs supervillains when redeemed ──
  // (handled in confirmDep via threat.villainId check — flag silphanaMaceEffect on villain threats)

  if(hero.isJohn){
    const base=outcome==="success"?[3,10]:outcome==="partial"?[8,20]:[15,30];
    const raw=Math.floor(Math.random()*(base[1]-base[0])+base[0]);
    return{health:Math.floor(raw/2)};
  }
  const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
  return{health:Math.floor(Math.random()*(base[1]-base[0])+base[0])};
}

const WIN1=500,WIN2=1000,VILLAIN_TEAM_SCORE=120;
