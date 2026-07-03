// ─── STAT CALCULATIONS ────────────────────────────────────────────────────────
function sc(v,m){const p=v/m;return p>0.6?"#33ff88":p>0.3?"#ffaa00":"#ff3333";}
function clsColor(cls){return cls==="tank"?"#4488ff":cls==="support"?"#44ff88":"#ff8844";}
function threatColor(t){return P_COLORS[t.priority]||"#ffaa00";}

function effStats(hero,rom,dis){
  const m=CAREER[hero.career]?.mult||1;
  let power=hero.basePower*m;
  if(hero._corvairBuff)power+=0.5;
  if(hero._ironsideAura)power+=0.3;
  let maxHP=Math.round(hero.baseHP*m)+(hero.mechaBonus||0);
  if(hero._icebergBonus)maxHP+=10;
  if(hero._conductorBonus)maxHP+=15;
  let regenSec=hero.regenSec;
  if(rom){Object.keys(rom).forEach(k=>{const ids=k.split(",").map(Number);if(ids.includes(hero.id)){power*=1.1;maxHP=Math.round(maxHP*1.1);regenSec=Math.max(1,Math.floor(regenSec/2));}});}
  if(dis&&dis[hero.id]?.length>0)power*=0.85;
  return{power,maxHP,regenSec};
}

// Note: Hospital heroes are additionally blocked at the App layer (hospitalIds set).
// Heroes in hospital have status "exhausted" so canDeploy already returns false for them.
function canDeploy(h){return h.status!=="deployed"&&h.status!=="gameLocked"&&h.status!=="shopLocked"&&h.status!=="kia"&&h.status!=="rogue"&&h.status!=="exhausted"&&h.status!=="offworld";}

function isSuicide(hero,allH,pids){
  if(pids.length!==1)return false;
  if(hero.currentHP>=30)return false;
  const full=allH.filter(h=>h.status==="ready"&&!pids.includes(h.id));
  return full.filter(h=>{const{maxHP:m}=effStats(h,{},{});return h.currentHP>=m;}).length>=2;
}

function rollMission(heroes,threat,rom,dis){
  // ── TUTORIAL: scripted missions are always a guaranteed win ──
  if(threat.tutorialGuaranteed)return"success";
  // ── HERO vs HERO: ratio-based equation ──
  if(threat.isRogueCouncil||threat.isCKJohnTeamUp){
    const rogueMembers=threat.rogueMembers||[];
    const affected=rogueMembers.map(r=>r.title);
    // Build Resistance Score (R)
    let R=rogueMembers.reduce((sum,r)=>{
      const m=CAREER[r.career]?.mult||1;
      let p=r.basePower*m;
      // Conviction bonus: rogue member whose affiliate is also rogue
      if((r.affiliates||[]).some(aff=>affected.includes(aff)))p*=1.15;
      return sum+p;
    },0);
    // John multiplier — if John is in the rogue members or threat.johnPresent
    const johnInRogue=threat.johnPresent||rogueMembers.some(r=>r.isJohn);
    if(johnInRogue)R*=3.5;
    // 99% guarantee when John is present
    if(johnInRogue)return Math.random()<0.01?"success":"failure";
    // Build Suppression Score (S)
    const S=heroes.reduce((sum,h)=>{
      const m=CAREER[h.career]?.mult||1;
      let p=h.basePower*m;
      // Relationship penalty: deployed hero has a rogue member in their affiliates
      if((h.affiliates||[]).some(aff=>affected.includes(aff)))p*=0.75;
      return sum+p;
    },0);
    const rawChance=R>0?S/(S+R):0.93;
    const chance=Math.min(0.93,Math.max(0.01,rawChance));
    const r=Math.random();
    if(r<chance*0.55)return"success";
    if(r<chance)return"partial";
    return"failure";
  }
  if(heroes.some(h=>h.isJohn)){
    return"success";
  }
  if(heroes.some(h=>h.title==="El Infinite")&&heroes.length<5)return Math.random()<0.25?"partial":"failure";

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
  if(threat.isOcean&&heroes.some(h=>h.title==="Hydrotheppilies"))avgP+=3.4;
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
  let teamUpPenalty=0;
  if(threat.isTeamUp&&threat.teamUpPower){
    const combinedMight=threat.teamUpPower;
    const heroPower=stats.reduce((a,s)=>a+s.power,0)/stats.length;
    teamUpPenalty=Math.max(0,(combinedMight-heroPower*heroes.length)*0.015);
  }
  const chance=Math.min(0.93,Math.min(1,avgP/10)+bonus+diff-disP-teamUpPenalty);
  if(heroes.some(h=>h.title==="The Sportsman"&&Math.random()<0.05)&&!["red","purple"].includes(threat.priority))return"success";
  if(heroes.some(h=>h.critChance&&h.title!=="The Sportsman"&&Math.random()<h.critChance)&&!["red","purple"].includes(threat.priority))return"success";
  const r=Math.random();
  if(r<chance*0.55)return"success";
  if(r<chance)return"partial";
  return"failure";
}

function calcDmg(outcome,hero,threat,allDeployed){
  const allHeroes=allDeployed||[hero];

  if(threat&&threat.leavesAt1HP){
    return{health:Math.max(0,hero.currentHP-1)};
  }

  // ── Silphana's Mace: 10× damage to Seraph ──
  if(threat&&threat.villainId===103&&hero.title==="Seraph"){
    const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
    const raw=Math.floor(Math.random()*(base[1]-base[0])+base[0]);
    return{health:raw*10};
  }

  if(threat&&threat.typhonEffect){
    const share=Math.round(280/allHeroes.length);
    if(hero.isJohn)return{health:Math.min(50,share)};
    return{health:share};
  }

  if(threat&&threat.maniacEffect){
    if(hero.isJohn)return{health:50};
    const immune=["The Crimson Knight","The Dragon of the Daimyo","Captain Shamrock","IceBerg"];
    if(immune.includes(hero.title))return{health:0};
    return{health:40};
  }

  if(threat&&threat.catTreeEffect){
    if(hero.isJohn)return{health:60};
  }

  if(threat&&threat.reaperEffect&&hero.cls==="support")return{health:45};
  if(threat&&threat.calaxesEffect&&hero.cls==="tank")return{health:30};
  if(threat&&threat.archonoisEffect&&hero.cls==="cannon")return{health:30};

  if(threat&&threat.leviathanEffect){
    const extra=Math.max(0,allHeroes.length-4)*10;
    const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
    const raw=Math.floor(Math.random()*(base[1]-base[0])+base[0])+extra;
    return{health:raw};
  }

  if(threat&&threat.hoaEffect){
    const extra=Math.max(0,allHeroes.length-4)*10;
    const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
    const raw=Math.floor(Math.random()*(base[1]-base[0])+base[0])+extra;
    return{health:raw};
  }

  if(threat&&threat.demonicEffect){
    const extra=Math.max(0,allHeroes.length-4)*10;
    const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
    const raw=Math.floor(Math.random()*(base[1]-base[0])+base[0])+extra;
    return{health:raw};
  }

  if(threat&&threat.mummyEffect&&hero.isMale){
    const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
    return{health:Math.floor(Math.random()*(base[1]-base[0])+base[0])*2};
  }

  if(threat&&threat.videoGameEffect&&hero.isFemale){
    const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
    return{health:Math.floor(Math.random()*(base[1]-base[0])+base[0])*2};
  }

  if(threat&&threat.sevenDragonEffect&&hero.cls==="cannon"){
    const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
    return{health:Math.round(Math.floor(Math.random()*(base[1]-base[0])+base[0])*1.05)};
  }

  if(threat&&threat.zombieHornetEffect&&hero.bugAllergy){
    const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
    return{health:Math.floor(Math.random()*(base[1]-base[0])+base[0])*4};
  }

  // ── Nilocythian Dragons: ×2 damage to specific heroes ──
  if(threat&&threat.nilocythianEffect){
    const niloTargets=["Dinosia","Titanaboa","Ariadus","Greywulf","The Dragon of the Daimyo"];
    const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
    const raw=Math.floor(Math.random()*(base[1]-base[0])+base[0]);
    if(niloTargets.includes(hero.title))return{health:raw*2};
    return{health:raw};
  }

  // ── Omniviporix Killbot: 90 damage if hero is alone, much less in teams ──
  if(threat&&threat.omniviporixEffect){
    if(allHeroes.length===1)return{health:90};
    const base=outcome==="success"?[3,10]:outcome==="partial"?[8,18]:[15,25];
    return{health:Math.floor(Math.random()*(base[1]-base[0])+base[0])};
  }

  // ── Pincerless Pinster: +10% damage per hero over 1 ──
  if(threat&&threat.pinsterEffect){
    const extra=Math.max(0,allHeroes.length-1)*0.10;
    const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
    const raw=Math.floor(Math.random()*(base[1]-base[0])+base[0]);
    return{health:Math.round(raw*(1+extra))};
  }

  if(hero.isJohn){
    const base=outcome==="success"?[3,10]:outcome==="partial"?[8,20]:[15,30];
    const raw=Math.floor(Math.random()*(base[1]-base[0])+base[0]);
    return{health:Math.floor(raw/2)};
  }
  const base=outcome==="success"?[5,18]:outcome==="partial"?[15,28]:[28,45];
  return{health:Math.floor(Math.random()*(base[1]-base[0])+base[0])};
}

const WIN1=500,WIN2=1000,VILLAIN_TEAM_SCORE=120;
