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
function canDeploy(h){return h.status!=="deployed"&&h.status!=="gameLocked"&&h.status!=="shopLocked"&&h.status!=="kia"&&h.status!=="rogue"&&h.status!=="exhausted"&&h.status!=="offworld"&&h.status!=="bonding";}

function isSuicide(hero,allH,pids){
  if(pids.length!==1)return false;
  if(hero.currentHP>=30)return false;
  const full=allH.filter(h=>h.status==="ready"&&!pids.includes(h.id));
  return full.filter(h=>{const{maxHP:m}=effStats(h,{},{});return h.currentHP>=m;}).length>=2;
}

// ── MISSION SUCCESS FORMULA (v2) ─────────────────────────────────────────────
// TeamPower: sort deployed heroes by effective power, strongest to weakest.
// The strongest (anchor) counts in full; each hero after that counts at
// POWER_DECAY× the weight of the hero ranked just above them.
// PowerScore = TeamPower ^ POWER_EXPONENT (stretches the gap between weak and
// strong teams — this is what makes raw power feel like it compounds).
// Final Score = PowerScore + Class Synergy + Team Size + Relationship
// Success % = clamp(0,100, FinalScore × ThreatMultiplier) + Hero Specials
const POWER_DECAY=0.3;
const POWER_EXPONENT=1.3;
const THREAT_SUCCESS_MULT={yellow:3.5,orange:3,red:2,purple:1.5};

// Villain starting priority, derived from their own power level — this is what
// lets weak villains (e.g. Mrs. Peanut) chain yellow→orange→red like any other
// threat, while the strongest villains (Maniac, Silphana, Niera) start pinned
// at purple with no escalation runway, same as any other purple threat.
function villainStartPriority(basePower){
  if(basePower>=7)return"purple";
  if(basePower>=5)return"red";
  if(basePower>=3)return"orange";
  return"yellow";
}

// Applies Ironside's Command Aura and Eclipso's loneliness penalty — the same
// decoration rollMission has always applied before reading power — then
// returns a plain sorted-descending array of numbers for TeamPower to consume.
function decoratedPowers(heroes,rom,dis){
  const eclipso=heroes.find(h=>h.eclipsoLonelyPenalty);
  const eclipsoAlone=eclipso&&!heroes.some(h=>h.id!==eclipso.id&&(eclipso.affiliates||[]).includes(h.title));
  const ironsidePresent=heroes.some(h=>h.title==="Ironside");
  return heroes.map(h=>{
    const decorated={...h,_ironsideAura:ironsidePresent&&h.title!=="Ironside"};
    let power=effStats(decorated,rom,dis).power;
    if(h.eclipsoLonelyPenalty&&eclipsoAlone)power*=0.7;
    return power;
  }).sort((a,b)=>b-a);
}

function computeTeamPower(heroes,rom,dis){
  if(!heroes.length)return 0;
  const powers=decoratedPowers(heroes,rom,dis);
  return powers.reduce((sum,p,i)=>sum+p*Math.pow(POWER_DECAY,i),0);
}
function computeClassSynergyScore(heroes){
  const classes=new Set(heroes.map(h=>h.cls));
  return classes.size>=3?2:classes.size===2?1:0;
}
function computeTeamSizeScore(n){
  if(n<=1)return 0;
  if(n===2)return 1;
  if(n>=3&&n<=7)return 3;
  return 1; // 8+
}
// +1 per affiliated pair, +3 per romantic pair (romance takes priority over the
// affiliate bonus for that same pair), −2 per disdaining pair. Each pair is
// only counted once (i<j), unlike the old formula's directional double-count.
function computeRelationshipScore(heroes,rom,dis){
  let score=0;
  for(let i=0;i<heroes.length;i++){
    for(let j=i+1;j<heroes.length;j++){
      const a=heroes[i],b=heroes[j];
      const romKey=[a.id,b.id].sort().join(",");
      if(rom&&rom[romKey]){score+=3;continue;}
      if((a.affiliates||[]).includes(b.title)||(b.affiliates||[]).includes(a.title))score+=1;
      if((dis&&dis[a.id]&&dis[a.id].includes(b.id))||(dis&&dis[b.id]&&dis[b.id].includes(a.id)))score-=2;
    }
  }
  return score;
}
function missionFinalScore(heroes,rom,dis){
  const powerScore=Math.pow(computeTeamPower(heroes,rom,dis),POWER_EXPONENT);
  return powerScore+computeClassSynergyScore(heroes)+computeTeamSizeScore(heroes.length)+computeRelationshipScore(heroes,rom,dis);
}
// Hero Specials — applied at the very end, after the threat multiplier, as a
// flat percentage-point adjustment to Success %. These are the same named-hero
// and location/type flavor bonuses the old formula had, converted to this
// scale (old value × 10, since the old formula divided power by 10 before
// treating it as a 0–1 chance) so their relative weight is preserved.
function heroSpecialsAdjustment(heroes,threat,rom,dis){
  let adj=0;
  if(heroes.length===1&&heroes[0].title==="Shadowmere")adj+=4;
  if(heroes.length>=2&&heroes.some(h=>h.title==="Greywulf"))adj+=5;
  if(threat.isOcean&&heroes.some(h=>h.title==="Hydrothylre"))adj+=34;
  if(threat.isOcean&&heroes.some(h=>h.title==="Hydrotheppilies"))adj+=34;
  if(heroes.some(h=>h.title==="Captain Shamrock"))adj+=10;
  if(threat.type==="kaiju")adj+=0.8;
  if(threat.type==="mystic"&&heroes.some(h=>["Seraph","Morgana","The Crimson Knight"].includes(h.title)))adj+=1.2;
  if(threat.type==="tech"&&heroes.some(h=>["Adrenaline Junkie","Dr. Voidance"].includes(h.title)))adj+=1;
  if(threat.type==="military"&&heroes.some(h=>["Ironside","The Sportsman"].includes(h.title)))adj+=1;
  const euroLocs=["Europe","Italy","France","Germany","Belgium","Monaco","Switzerland","Austria","Romania","Transylvania","Scotland","Ireland","Iceland"];
  if(heroes.some(h=>h.title==="Golgotha")&&euroLocs.some(e=>threat.loc?.includes(e)))adj+=1.5;
  if(threat.isTeamUp&&threat.teamUpPower){
    const powers=decoratedPowers(heroes,rom,dis);
    const heroPowerAvg=powers.reduce((a,b)=>a+b,0)/Math.max(1,powers.length);
    const teamUpPenalty=Math.max(0,(threat.teamUpPower-heroPowerAvg*heroes.length)*0.015);
    adj-=teamUpPenalty*100;
  }
  return adj;
}
// Returns 0–1, the actual probability rollMission uses to resolve the dice roll.
function missionSuccessChance01(heroes,threat,rom,dis){
  const finalScore=missionFinalScore(heroes,rom,dis);
  const mult=THREAT_SUCCESS_MULT[threat.priority]??3.5;
  let pct=finalScore*mult;
  pct+=heroSpecialsAdjustment(heroes,threat,rom,dis);
  return Math.max(0,Math.min(100,pct))/100;
}

function rollMission(heroes,threat,rom,dis){
  // ── TUTORIAL: scripted missions are always a guaranteed win ──
  if(threat.tutorialGuaranteed)return"success";
  // ── HERO vs HERO: ratio-based equation (unchanged) ──
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
    return Math.random()<chance*0.55?"success":"failure";
  }
  if(heroes.some(h=>h.isJohn)){
    return"success";
  }
  if(heroes.some(h=>h.title==="El Infinite")&&heroes.length<5)return Math.random()<0.25?"success":"failure";

  // ── Hero crit-chance overrides — unchanged, still bypass the formula entirely ──
  if(heroes.some(h=>h.title==="The Sportsman"&&Math.random()<0.05)&&!["red","purple"].includes(threat.priority))return"success";
  if(heroes.some(h=>h.critChance&&h.title!=="The Sportsman"&&Math.random()<h.critChance)&&!["red","purple"].includes(threat.priority))return"success";

  const pct=missionSuccessChance01(heroes,threat,rom,dis);
  return Math.random()<pct?"success":"failure";
}

function calcDmgRaw(outcome,hero,threat,allDeployed){
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

// ── CLASS PROTECTION TRIANGLE ────────────────────────────────────────────────
// Tank present → Cannons take 10% less damage. Cannon present → Supports take
// 10% less damage. Support present → Tanks take 10% less damage. Presence-based,
// not stacking — two Tanks don't double a Cannon's protection. Everything else
// about damage is untouched; this is a flat multiplier applied on top of
// whatever calcDmgRaw already computed.
function calcDmg(outcome,hero,threat,allDeployed){
  const result=calcDmgRaw(outcome,hero,threat,allDeployed);
  if(result==null||typeof result.health!=="number")return result;
  const allHeroes=allDeployed||[hero];
  const classesPresent=new Set(allHeroes.map(h=>h.cls));
  const protectedClass=(hero.cls==="cannon"&&classesPresent.has("tank"))||
                        (hero.cls==="support"&&classesPresent.has("cannon"))||
                        (hero.cls==="tank"&&classesPresent.has("support"));
  if(protectedClass)return{...result,health:Math.round(result.health*0.9)};
  return result;
}

const WIN1=500,WIN2=1000,VILLAIN_TEAM_SCORE=120;

// ── LIVE MISSION-SUCCESS CALCULATOR ───────────────────────────────────────────
// Returns a whole-number 0–100 "Projected Mission Success" percentage for the
// deploy screen. Shares the exact same formula as rollMission's real dice roll
// (missionSuccessChance01 above) so the number on screen always matches the
// team's actual odds — the only thing it doesn't reflect is the hidden
// crit-chance "success saves" (Sportsman, hero crits), which are meant to feel
// like lucky rescues, not a number the player plans around.
function computeMissionSuccessPercent(heroes,threat,rom,dis){
  if(!heroes||heroes.length===0||!threat)return 0;

  // ── TUTORIAL: scripted missions are always a guaranteed win ──
  if(threat.tutorialGuaranteed)return 100;

  // ── HERO vs HERO: ratio-based equation (unchanged) ──
  if(threat.isRogueCouncil||threat.isCKJohnTeamUp){
    const rogueMembers=threat.rogueMembers||[];
    const affected=rogueMembers.map(r=>r.title);
    let R=rogueMembers.reduce((sum,r)=>{
      const m=CAREER[r.career]?.mult||1;
      let p=r.basePower*m;
      if((r.affiliates||[]).some(aff=>affected.includes(aff)))p*=1.15;
      return sum+p;
    },0);
    const johnInRogue=threat.johnPresent||rogueMembers.some(r=>r.isJohn);
    if(johnInRogue)R*=3.5;
    if(johnInRogue)return 1; // flat 1% success roll, no partial outcome
    const S=heroes.reduce((sum,h)=>{
      const m=CAREER[h.career]?.mult||1;
      let p=h.basePower*m;
      if((h.affiliates||[]).some(aff=>affected.includes(aff)))p*=0.75;
      return sum+p;
    },0);
    const rawChance=R>0?S/(S+R):0.93;
    const chance=Math.min(0.93,Math.max(0.01,rawChance));
    return Math.round(chance*0.55*100);
  }

  if(heroes.some(h=>h.isJohn))return 100;
  // El Infinite under-5 fight — matches the 25% success chance rollMission actually rolls.
  if(heroes.some(h=>h.title==="El Infinite")&&heroes.length<5)return 25;

  return Math.round(missionSuccessChance01(heroes,threat,rom,dis)*100);
}

// ── WIN TIERS: Easy (250) / Normal (500) / Legendary (1000) ──────────────────
// winTier index (0,1,2) tracks which target the player is currently pursuing.
const TIER_TARGETS=[250,WIN1,WIN2];
const TIER_LABELS=["Easy","Normal","Legendary"];
const TIER_ACHIEVEMENTS=["easy_does_it","normal_operations","beat_a_game"];

// ── TEAM BONDING ───────────────────────────────────────────────────────────
const BOND_DURATION=60; // seconds
