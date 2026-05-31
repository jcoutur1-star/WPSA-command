const {useState,useEffect,useRef,useMemo}=React;

function App(){
  const [bank,setBank]=useState(loadBank);
  const [ownedShop,setOwnedShop]=useState(loadOwned);
  const [codexUnlocked,setCodexUnlocked]=useState(loadCodex);

  const [screen,setScreen]=useState("menu");
  const [nameInput,setNameInput]=useState("");
  const [directorName,setDirectorName]=useState("");
  const [gameOver,setGameOver]=useState(null);
  const [gameOverReason,setGameOverReason]=useState("");
  const [extMode,setExtMode]=useState(false);

  const [heroes,setHeroes]=useState([]);
  const [villains,setVillains]=useState([]);
  const [threats,setThreats]=useState([]);
  const [threatQueue,setThreatQueue]=useState([]);
  const [selThreat,setSelThreat]=useState(null);
  const [depMap,setDepMap]=useState({});
  const [log,setLog]=useState("");
  const [logTime,setLogTime]=useState("00:00");
  const [modal,setModal]=useState(null);
  const [depModal,setDepModal]=useState(null);
  const [picked,setPicked]=useState([]);
  const [score,setScore]=useState(0);
  const [expandedHero,setExpandedHero]=useState(null);
  const [rom,setRom]=useState({});
  const [dis,setDis]=useState({});
  const [codexTab,setCodexTab]=useState("hero");
  const [shopMsg,setShopMsg]=useState("");
  const [tickerMsg,setTickerMsg]=useState("◈ W.S.P.A. GLOBAL NEWS TICKER ◈ Monitoring all threats worldwide. Stay alert, Director.");
  const tickerQueue=useRef([]);
  const tickerBusy=useRef(false);
  const TICKER_DURATION=32000; // ms — must match CSS animation duration
  const [johnOffworldTimer,setJohnOffworldTimer]=useState(0); // counts up; 0-120 = on earth, 120-240 = offworld

  const tick=useRef(0);
  const lastHeadlineTick=useRef(0); // tracks last tick a headline was pushed
  const hRef=useRef(heroes);hRef.current=heroes;
  const vRef=useRef(villains);vRef.current=villains;
  const scoreRef=useRef(score);scoreRef.current=score;
  const romRef=useRef(rom);romRef.current=rom;
  const disRef=useRef(dis);disRef.current=dis;
  const extRef=useRef(extMode);extRef.current=extMode;
  const tqRef=useRef(threatQueue);tqRef.current=threatQueue;
  const johnOffRef=useRef(johnOffworldTimer);johnOffRef.current=johnOffworldTimer;

  function saveAndUpdateBank(n){setBank(n);saveBank(n);}
  function saveAndUpdateOwned(a){setOwnedShop(a);saveOwned(a);}
  function saveAndUpdateCodex(a){setCodexUnlocked(a);saveCodex(a);}
  function pushHeadline(msg){
    lastHeadlineTick.current=tick.current;
    tickerQueue.current.push(msg);
    if(!tickerBusy.current){
      tickerBusy.current=true;
      const advance=()=>{
        const next=tickerQueue.current.shift();
        if(!next){tickerBusy.current=false;return;}
        setTickerMsg(next);
        setTimeout(advance,TICKER_DURATION);
      };
      advance();
    }
  }
  function buyShopHero(title){
    if(bank<SHOP_PRICE||ownedShop.includes(title))return;
    const nb=bank-SHOP_PRICE;saveAndUpdateBank(nb);
    const no=[...ownedShop,title];saveAndUpdateOwned(no);
    setShopMsg(`✓ ${title} purchased! They will be available in your next game.`);
  }
  function buyShopVillain(title){
    if(bank<SHOP_VILLAIN_PRICE||ownedShop.includes("v_"+title))return;
    const nb=bank-SHOP_VILLAIN_PRICE;saveAndUpdateBank(nb);
    const no=[...ownedShop,"v_"+title];saveAndUpdateOwned(no);
    setShopMsg(`✓ ${title} purchased! They may appear in your next game.`);
  }
  function buyCodexEntry(id){
    if(bank<1||codexUnlocked.includes(id))return;
    const nb=bank-1;saveAndUpdateBank(nb);
    const nc=[...codexUnlocked,id];saveAndUpdateCodex(nc);
  }

  function buildInitHeroes(){
    return ALL_HERO_DEFS.map(h=>{
      const isShopLocked=h.shopLocked&&!ownedShop.includes(h.title);
      const isGameLocked=h.gameLocked;
      const status=isShopLocked?"shopLocked":isGameLocked?"gameLocked":"ready";
      const{maxHP}=effStats({...h,status:"ready"},{},{});
      return{...h,currentHP:maxHP,status,regenTimer:0,xp:0,levelUpFlash:false,speechBubble:null,romancePartner:null};
    });
  }

  function startGame(ext=false){
    const n=directorName||nameInput.trim();
    if(!n)return;
    setDirectorName(n);
    const ih=buildInitHeroes();
    setHeroes(ih);
    const ownedVillainTitles=SHOP_VILLAIN_TITLES.filter(t=>ownedShop.includes("v_"+t));
    const baseVillains=VILLAIN_DEFS.filter(v=>!v.shopVillain||ownedVillainTitles.includes(v.title));
    setVillains(baseVillains.map(v=>({...v,defeated:false,redeemed:false})));
    const shuffled=shuffle(ALL_THREATS);
    setThreats(shuffled.slice(0,4).map(t=>({...t,timer:t.maxTimer})));
    setThreatQueue(shuffled.slice(4));
    setDepMap({});setRom({});setDis({});setModal(null);setDepModal(null);setPicked([]);
    setScore(0);setSelThreat(null);setGameOver(null);setGameOverReason("");
    setJohnOffworldTimer(0);
    setExtMode(ext);setLog(`Welcome, Director ${n}. WSPA Command online.`);setLogTime("00:00");
    tick.current=0;
    setScreen("game");
  }

  function exitToMenu(keepScore=false){
    if(keepScore&&score>=WIN1){const nb=bank+WIN1;saveAndUpdateBank(nb);}
    setScreen("menu");setGameOver(null);
  }

  function continueToTier2(){setExtMode(true);setGameOver(null);setLog(`Continuing to 1000 points! The world still needs you, Director.`);}

  function handleWin(){
    const pts=extMode?WIN2:WIN1;
    const nb=bank+pts;saveAndUpdateBank(nb);
    setGameOver("win");setScreen("gameover");
  }

  useEffect(()=>{
    if(screen!=="game"||gameOver)return;
    const iv=setInterval(()=>{
      tick.current++;const t=tick.current;
      setLogTime(`${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`);

      setHeroes(prev=>prev.map(h=>{
        if(["deployed","gameLocked","shopLocked","kia","turned","offworld"].includes(h.status))return h;
        const{maxHP,regenSec:rs}=effStats(h,romRef.current,disRef.current);
        if(h.currentHP>=maxHP)return h.status==="ready"?h:{...h,status:"ready"};
        const nt=(h.regenTimer||0)+1;
        if(nt>=rs){
          const nHP=Math.min(maxHP,h.currentHP+1);
          const st=nHP>=maxHP?"ready":nHP<(h.functionalAt||0)?"exhausted":"resting";
          const bubble=nHP>=maxHP?READY_QUIPS[Math.floor(Math.random()*READY_QUIPS.length)]:null;
          return{...h,currentHP:nHP,regenTimer:0,status:st,speechBubble:bubble};
        }
        return{...h,regenTimer:nt};
      }));

      setHeroes(prev=>prev.map(h=>{
        let u={...h};
        if(h.healCooldown>0)u.healCooldown=h.healCooldown-1;
        if(h.levelUpFlash)u.levelUpFlash=false;
        if(h.speechBubble&&Math.random()<0.025)u.speechBubble=null;
        if(h.status==="deployed"&&!h.speechBubble&&Math.random()<0.005)u.speechBubble=getRandQuip(h,romRef.current,disRef.current,true);
        if(h.title==="Morgana"&&h.career==="veteran"&&h.status!=="deployed"&&t>0&&t%300===0){
          setHeroes(p2=>p2.map(h2=>{if(["kia","gameLocked","shopLocked"].includes(h2.status))return h2;const{maxHP}=effStats(h2,romRef.current,disRef.current);return{...h2,currentHP:maxHP,status:"ready",regenTimer:0};}));
          setLog("✨ Morgana veteran pulse — all heroes restored!");
        }
        if(h.title==="The Flip"&&h.career==="veteran"){
          const aj=prev.find(x=>x.title==="Adrenaline Junkie");
          if(aj&&aj.status==="gameLocked"){setHeroes(p2=>p2.map(x=>x.title==="Adrenaline Junkie"?{...x,status:"ready",gameLocked:false}:x));setLog("⭐ The Flip is VETERAN — Adrenaline Junkie unlocked!");}
        }
        return u;
      }));

      // ── JOHN OFFWORLD CYCLE (every 120s away, 120s gone, returns at 90% HP) ──
      setHeroes(prev=>{
        const john=prev.find(h=>h.isJohn&&h.status!=="gameLocked"&&h.status!=="kia");
        if(!john)return prev;
        const newTimer=(johnOffRef.current||0)+1;
        setJohnOffworldTimer(newTimer);
        if(newTimer===120){
          // John should go offworld — if deployed, queue it for after the mission
          if(john.status==="deployed"){
            setLog("🚀 John's offworld cycle triggered — will depart immediately after current mission.");
            return prev.map(h=>h.isJohn?{...h,pendingOffworld:true}:h);
          }
          const quote=JOHN_DEPARTURE_QUOTES[Math.floor(Math.random()*JOHN_DEPARTURE_QUOTES.length)];
          const ckQuote=Math.random()<0.5?CK_JOHN_DEPARTURE_RESPONSES[Math.floor(Math.random()*CK_JOHN_DEPARTURE_RESPONSES.length)]:null;
          const headline=pickHeadline("johnLeavesToOtherPlanets",[{title:"John"}],null,null);
          if(headline)pushHeadline(headline);
          setLog(`🚀 John: "${quote}"${ckQuote?` · The Crimson Knight: "${ckQuote}"`:""  }`);
          return prev.map(h=>h.isJohn?{...h,status:"offworld",speechBubble:quote,pendingOffworld:false}:
            (h.title==="The Crimson Knight"&&ckQuote)?{...h,speechBubble:ckQuote}:h);
        }
        if(newTimer===240){
          // John returns at 90% HP
          setJohnOffworldTimer(0);
          const{maxHP}=effStats(john,romRef.current,disRef.current);
          const returnHP=Math.round(maxHP*0.9);
          setLog(`🌟 John has returned! (90% HP)`);
          return prev.map(h=>h.isJohn?{...h,status:returnHP<(h.functionalAt||0)?"exhausted":"ready",currentHP:returnHP,speechBubble:"I'm back!"}:h);
        }
        return prev;
      });

      setThreats(prev=>{
        let gameEnd=null;
        const updated=prev.map(th=>{
          if(th.timer>0)return{...th,timer:th.timer-1};
          if(th.priority==="red"||th.priority==="purple"){gameEnd=th;return th;}
          const np=escalate(th.priority);
          setLog(`⚠ ${th.name} escalated to ${P_LABELS[np]}!`);
          return{...th,priority:np,timer:th.maxTimer,maxTimer:Math.max(60,th.maxTimer-30)};
        });
        if(gameEnd){setGameOver("lose");setGameOverReason(`${gameEnd.name} reached Priority ONE with no response.`);setScreen("gameover");}
        return updated;
      });

      if(t>0&&t%180===0&&scoreRef.current>=VILLAIN_TEAM_SCORE){
        const av=vRef.current.filter(v=>!v.defeated&&!v.redeemed);
        if(av.length>=2&&Math.random()<0.25){
          const v1=av[Math.floor(Math.random()*av.length)];
          const v2pool=av.filter(v=>v.id!==v1.id);
          if(v2pool.length>0){
            const v2=v2pool[Math.floor(Math.random()*v2pool.length)];
            const tt={id:Date.now(),name:`VILLAIN TEAM-UP: ${v1.title} & ${v2.title}`,loc:v1.loc,x:Math.round((v1.x+v2.x)/2),y:Math.round((v1.y+v2.y)/2),priority:"purple",type:"military",desc:`${v1.title} and ${v2.title} have allied. Combined threat is severe.`,timer:200,maxTimer:200,reward:v1.reward+v2.reward,villainId:v1.id,villainId2:v2.id,recurring:true,isTeamUp:true,teamUpPower:(v1.basePower||5)+(v2.basePower||5)};
            setThreats(p=>{if(p.length>=7)return p;return[...p,tt];});
            setLog(`🔴 VILLAIN TEAM-UP: ${v1.title} & ${v2.title} have allied!`);
          }
        }
      }

      if(t>0&&t%55===0){
        const spawnCap=scoreRef.current>=600?Math.round(6*1.21):scoreRef.current>=300?Math.round(6*1.10):6;
        setThreats(prev=>{
          if(prev.length>=spawnCap)return prev;
          const av=vRef.current.filter(v=>!v.defeated&&!v.redeemed&&!prev.some(p=>p.villainId===v.id));
          if(av.length>0&&Math.random()<0.28){
            const v=av[Math.floor(Math.random()*av.length)];
            const nt={id:Date.now(),name:v.title,loc:v.loc,x:v.x,y:v.y,priority:"purple",type:v.threatType||"military",desc:v.personality.slice(0,80)+"…",timer:220,maxTimer:220,reward:v.reward,recurring:true,villainId:v.id};
            setLog(`⚠ VILLAIN: ${v.title} — ${v.loc}`);
            return[...prev,nt];
          }
          setThreatQueue(q=>{
            let queue=[...q];
            if(queue.length===0){queue=shuffle(ALL_THREATS);}
            const pick=queue[0];
            const rest=queue.slice(1);
            setThreats(p2=>{if(p2.length>=spawnCap)return p2;return[...p2,{...pick,timer:pick.maxTimer,id:Date.now()}];});
            setLog(`⚠ NEW THREAT: ${pick.name} — ${pick.loc}`);
            return rest;
          });
          return prev;
        });
      }

      const target=extRef.current?WIN2:WIN1;
      if(scoreRef.current>=target)handleWin();

      // ── IDLE HEADLINE: fire generic headline if none pushed for 10+ seconds ──
      if(t-lastHeadlineTick.current>=10){
        const all=hRef.current.filter(h=>!["gameLocked","shopLocked","kia"].includes(h.status));
        const av=vRef.current.filter(v=>!v.defeated&&!v.redeemed);
        const randH=all[Math.floor(Math.random()*all.length)];
        const randV=av[Math.floor(Math.random()*av.length)];
        let idle=GENERIC_IDLE_HEADLINES[Math.floor(Math.random()*GENERIC_IDLE_HEADLINES.length)];
        if(randH)idle=idle.replace(/\bX\b/g,randH.title);
        if(randV)idle=idle.replace(/\bY\b/g,randV.title);
        const src=NEWS_SOURCES[Math.floor(Math.random()*NEWS_SOURCES.length)];
        pushHeadline(`[${src}] ${idle}`);
      }
    },1000);
    return()=>clearInterval(iv);
  },[screen,gameOver]);

  function openDep(t){setDepModal(t);setPicked([]);}
  function toggleH(id){const h=hRef.current.find(x=>x.id===id);if(!h||!canDeploy(h))return;setPicked(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);}

  async function confirmDep(){
    if(!depModal||!picked.length)return;
    const threat=depModal;
    const assigned=hRef.current.filter(h=>picked.includes(h.id));
    setDepModal(null);
    const iceP=assigned.some(h=>h.title==="IceBerg");
    const gummyP=assigned.some(h=>h.title==="The Gummy Bear");
    setHeroes(prev=>prev.map(h=>{
      if(!picked.includes(h.id))return h;
      const{maxHP}=effStats(h,romRef.current,disRef.current);
      const hpBoost=(iceP&&h.title!=="IceBerg")?10:0;
      const bubble=Math.random()<0.55?getRandQuip(h,romRef.current,disRef.current,true):null;
      return{...h,status:"deployed",currentHP:Math.min(maxHP+hpBoost,h.currentHP+hpBoost),speechBubble:bubble};
    }));
    setDepMap(prev=>({...prev,[threat.id]:picked}));
    setLog(`⚡ ${assigned.map(h=>h.title).join(" & ")} deployed to ${threat.loc}...`);

    setTimeout(async()=>{
      const outcome=rollMission(assigned,threat,romRef.current,disRef.current);
      let narration="Awaiting field report...";
      try{
        const relNotes=getRelNotes(assigned,romRef.current,disRef.current);
        const villain=threat.villainId?vRef.current.find(v=>v.id===threat.villainId):null;
        const loc=threat.loc;const tname=threat.name;
        const heroList=assigned.map(h=>h.title).join(", ");
        const outStr=outcome==="success"?"achieved a decisive victory":outcome==="partial"?"secured a partial success":"suffered a defeat";
        let rel="";if(relNotes.length)rel=" "+relNotes.join(" ");
        let vNote="";if(villain)vNote=` They faced off against ${villain.title}.`;
        narration=`${heroList} deployed to ${loc} to confront ${tname} and ${outStr}.${vNote}${rel}`;
      }catch(e){narration=`${assigned[0].title} engaged ${threat.name} at ${threat.loc}. Outcome: ${outcome}.`;}
      const damages={};let anyKIA=false;let turnedVillain=null;let redeemedVillains=[];const levelUps=[];let newRomMsg=null;let newDisMsg=null;let unlockMsg=null;
      const newRom={...romRef.current};const newDis={...disRef.current};

      // ── Blink: 1/5 chance to halve damage to all OTHER teammates ──
      const blinkPresent=assigned.some(h=>h.title==="Blink");
      const blinkActivates=blinkPresent&&Math.random()<0.2;

      // ── Dragon of the Daimyo: +10 HP to positive affiliates/romance on same mission, -10 to mutual disdain ──
      const dragonPresent=assigned.find(h=>h.dragonDaimyoEffect);
      if(dragonPresent){
        setHeroes(prev=>prev.map(h=>{
          if(!picked.includes(h.id)||h.id===dragonPresent.id)return h;
          const isAffiliate=(dragonPresent.affiliates||[]).includes(h.title);
          const rk=[dragonPresent.id,h.id].sort().join(",");
          const isRomance=!!(romRef.current[rk]);
          const dragonDisdainsH=(disRef.current[dragonPresent.id]||[]).includes(h.id);
          const hDisdainsDragon=(disRef.current[h.id]||[]).includes(dragonPresent.id);
          const isMutualDisdain=dragonDisdainsH||hDisdainsDragon;
          if(isAffiliate||isRomance){const{maxHP}=effStats(h,romRef.current,disRef.current);return{...h,currentHP:Math.min(maxHP,h.currentHP+10)};}
          if(isMutualDisdain){return{...h,currentHP:Math.max(1,h.currentHP-10)};}
          return h;
        }));
      }

      // ── Skull Crusher friendly fire: 5 extra damage to one random teammate per mission (until special unlocked) ──
      const skullCrusher=assigned.find(h=>h.skullCrusherFriendlyFire&&h.career==="beginner");
      if(skullCrusher){
        const targets=assigned.filter(h=>h.id!==skullCrusher.id);
        if(targets.length>0){
          const ffTarget=targets[Math.floor(Math.random()*targets.length)];
          setHeroes(prev=>prev.map(h=>{
            if(h.id!==ffTarget.id)return h;
            const nHP=Math.max(1,h.currentHP-5);
            return{...h,currentHP:nHP};
          }));
          setLog(`⚠ Skull Crusher accidentally hurt ${ffTarget.title} (-5 HP)!`);
        }
      }

      const johnHero=assigned.find(h=>h.isJohn);
      if(johnHero&&outcome!=="failure"){
        const cands=[];
        if(threat.villainId){const v=vRef.current.find(x=>x.id===threat.villainId);if(v&&v.redeemable&&!v.redeemed&&v.id!==102)cands.push(v);}
        if(threat.isTeamUp&&threat.villainId2){const v2=vRef.current.find(x=>x.id===threat.villainId2);if(v2&&v2.redeemable&&!v2.redeemed&&v2.id!==102)cands.push(v2);}
        cands.forEach(villain=>{
          if(Math.random()<0.2){
            redeemedVillains.push(villain);
            // Mark redeemed in villain list
            setVillains(prev=>prev.map(v=>v.id===villain.id?{...v,redeemed:true}:v));
            // Add or update hero roster
            const{maxHP:rdMaxHP}=effStats(villain,romRef.current,disRef.current);
            setHeroes(hp=>{
              const already=hp.find(x=>x.id===villain.id);
              if(already)return hp.map(x=>x.id===villain.id?{...x,status:"resting",gameLocked:false,redeemed:true,currentHP:rdMaxHP}:x);
              return[...hp,{...villain,currentHP:rdMaxHP,status:"resting",gameLocked:false,redeemed:true,xp:0,speechBubble:null,defeated:false}];
            });
          }
        });
      }

      const pts=outcome!=="failure"?(outcome==="success"?threat.reward:Math.floor(threat.reward/2)):0;
      const allSnap=hRef.current;

      setHeroes(prev=>prev.map(h=>{
        if(!picked.includes(h.id))return h;
        let d=calcDmg(outcome,h,threat,assigned);
        if(threat.villainId===110&&h.title==="The Sportsman")d={health:Math.min(d.health*5,(effStats(h,romRef.current,disRef.current).maxHP))};
        // Silphana redeemed: mace deals 10× damage to villains (she becomes a hero, so the threat she faces IS the villain)
        if(h.title==="Silphana"&&h.redeemed&&threat.villainId){d={health:Math.max(0,d.health-Math.floor(d.health*9))};} // 10× applied as massive damage bonus — lower her own damage taken
        damages[h.id]=d;
        const{maxHP}=effStats(h,romRef.current,disRef.current);
        // Apply Blink flashing lights — halve damage to all teammates except Blink herself
        if(blinkActivates&&h.title!=="Blink")d={health:Math.floor(d.health/2)};
        if(h.isJohn){const johnNewHP=Math.max(h.functionalAt,h.currentHP-d.health);if(h.pendingOffworld){const quote=JOHN_DEPARTURE_QUOTES[Math.floor(Math.random()*JOHN_DEPARTURE_QUOTES.length)];const ckQuote=Math.random()<0.5?CK_JOHN_DEPARTURE_RESPONSES[Math.floor(Math.random()*CK_JOHN_DEPARTURE_RESPONSES.length)]:null;const headline=pickHeadline("johnLeavesToOtherPlanets",[{title:"John"}],null,null);if(headline)pushHeadline(headline);setLog(`🚀 John finished the mission — then departed. "${quote}"${ckQuote?` · Crimson Knight: "${ckQuote}"`:"" }`);return{...h,currentHP:johnNewHP,status:"offworld",speechBubble:quote,pendingOffworld:false};}return{...h,currentHP:johnNewHP,status:johnNewHP<=h.functionalAt?"resting":"ready",speechBubble:null};}
        let nHP=Math.max(0,h.currentHP-d.health);
        if(gummyP&&h.title!=="The Gummy Bear")nHP=Math.max(0,h.currentHP-Math.floor(d.health/2));
        const shamrock=assigned.find(x=>x.title==="Captain Shamrock");
        if(nHP===0&&shamrock&&h.id!==shamrock.id)nHP=1;
        if(nHP===0){
          anyKIA=true;
          if(isSuicide(h,allSnap,picked)&&Math.random()<0.5&&!h.isJohn&&h.title!=="The Crimson Knight"){
            // Hero survived and turned villain — becomes a new redeemable supervillain threat
            turnedVillain=h;
            const turnedThreat={
              id:Date.now()+h.id,
              name:`ROGUE HERO: ${h.title}`,
              loc:threat.loc,x:threat.x,y:threat.y,
              priority:"purple",type:"military",
              desc:`${h.title} survived a suicide mission and has turned against the WSPA. They retain all hero stats and abilities. Can be redeemed.`,
              timer:200,maxTimer:200,reward:Math.round(h.baseHP/2),
              villainId:null,rogueHeroId:h.id,rogueHero:h,recurring:true,redeemable:true
            };
            setThreats(p2=>[...p2,turnedThreat]);
            return{...h,currentHP:1,status:"turned",turnedVillain:true,speechBubble:"You used me. I won't forget."};
          }
          // Crimson Knight on a suicide mission: 50% chance she AND John go rogue to stop the Director
          if(h.title==="The Crimson Knight"&&isSuicide(h,allSnap,picked)&&Math.random()<0.5){
            const{maxHP:ckMax}=effStats(h,romRef.current,disRef.current);
            const johnSnap=allSnap.find(j=>j.isJohn&&j.status!=="kia"&&j.status!=="gameLocked"&&j.status!=="turned");
            if(johnSnap){
              const{maxHP:johnMax}=effStats(johnSnap,romRef.current,disRef.current);
              setHeroes(p2=>p2.map(j=>j.isJohn?{...j,currentHP:johnMax,status:"turned",speechBubble:"The Director has lost their way. We cannot stand by."}:j));
            }
            const ckJohnThreat={
              id:Date.now(),
              name:"ROGUE: THE CRIMSON KNIGHT & JOHN",
              loc:"United States",x:88,y:118,
              priority:"purple",type:"military",
              desc:"You sent The Crimson Knight on a suicide mission — and she survived. She and John believe the Director has turned evil and are now fighting to protect the world FROM you. They are acting on conscience, not malice. Heroes they defeat are left at 1 HP rather than killed. Requires 10 heroes with power level above 5 to stop them. They will not be stopped easily.",
              timer:20,maxTimer:20,reward:120,
              isCKJohnTeamUp:true,leavesAt1HP:true
            };
            setThreats(p2=>[...p2.filter(x=>x.isCKJohnTeamUp!==true),ckJohnThreat]);
            setLog("🔴 CATASTROPHIC: The Crimson Knight survived the suicide mission and believes YOU are the real threat. She and John have gone rogue to protect the world from you. They leave fallen heroes at 1 HP — they are not here to kill, but to WIN.");
            return{...h,currentHP:Math.round(ckMax*0.3),status:"turned",regenTimer:0,speechBubble:"You sent me to die. Now I know what you are."};
          }
          // Normal CK death (not suicide or rogue roll failed) — she can simply die
          return{...h,currentHP:0,status:"kia",speechBubble:null};
        }
        const st=nHP<(h.functionalAt||0)?"exhausted":nHP<maxHP?"resting":"ready";
        const thresh=xpToLevel(h);const nXP=(h.xp||0)+pts;
        let nc=h.career;let didLv=false;
        if(nXP>=thresh&&CAREER[h.career]?.next){nc=CAREER[h.career].next;didLv=true;levelUps.push({title:h.title,to:nc});
          if(h.title==="The Crimson Knight"&&nc==="veteran"){setHeroes(p2=>p2.map(j=>j.isJohn?{...j,status:"ready",gameLocked:false}:j));setLog("⭐ Crimson Knight is VETERAN — John unlocked!");}
          if(h.title==="Eclipso"&&nc==="veteran"){setLog("⭐ Eclipso VETERAN — Sees the Value of the Team: team penalty removed!");}
        }
        return{...h,currentHP:nHP,status:st,regenTimer:0,xp:didLv?nXP-thresh:nXP,career:nc,levelUpFlash:didLv,speechBubble:null,eclipsoLonelyPenalty:h.eclipsoLonelyPenalty&&nc!=="veteran"?true:false};
      }));

      if(assigned.length>=2&&Math.random()<0.05){
        const elig=assigned.filter(h=>!h.romanceLocked&&!h.romancePartner);
        if(elig.length>=2){
          const a=elig[Math.floor(Math.random()*elig.length)];
          const bp=elig.filter(x=>x.id!==a.id&&!x.romancePartner);
          if(bp.length){
            const b=bp[Math.floor(Math.random()*bp.length)];
            const rk=[a.id,b.id].sort().join(",");
            if(!newRom[rk]){
              newRom[rk]=true;
              setHeroes(p2=>p2.map(h=>h.id===a.id?{...h,romancePartner:b.id}:h.id===b.id?{...h,romancePartner:a.id}:h));
              newRomMsg=`💕 ${a.title} and ${b.title} have developed romantic feelings!`;
              const rhl=pickHeadline("heroesDevelopRelationship",[a,b],null,null);
              if(rhl)pushHeadline(rhl);
            }
          }
        }
      }
      assigned.forEach(h=>{
        if(Math.random()<0.04){
          const others=assigned.filter(x=>x.id!==h.id&&!(h.affiliates||[]).includes(x.title));
          const el=others.filter(x=>{const rk=[h.id,x.id].sort().join(",");return!newRom[rk]&&!x.romanceLocked;});
          if(el.length){const target=el[Math.floor(Math.random()*el.length)];const cur=newDis[h.id]||[];if(!cur.includes(target.id)&&cur.length<2){newDis[h.id]=[...cur,target.id];newDisMsg=`😤 ${h.title} has developed a disdain for ${target.title}.`;}}
        }
      });
      setRom(newRom);setDis(newDis);

      if(outcome!=="failure"){
        if(threat.unlockHero){setHeroes(prev=>prev.map(h=>h.title===threat.unlockHero?{...h,gameLocked:false,status:"ready"}:h));unlockMsg=`🔓 ${threat.unlockHero} unlocked!`;}
        if(threat.isOcean)setHeroes(prev=>prev.map(h=>h.title==="Hydrothylre"&&h.status==="gameLocked"?{...h,status:"ready",gameLocked:false}:h));
        if(threat.isKaiju)setHeroes(prev=>prev.map(h=>h.title==="Dinosia"&&h.status==="gameLocked"?{...h,status:"ready",gameLocked:false}:h));
        if(threat.isRome)setHeroes(prev=>prev.map(h=>h.title==="El Infinite"&&h.status==="gameLocked"?{...h,status:"ready",gameLocked:false}:h));
        if(threat.isNorthAmerica)setHeroes(prev=>prev.map(h=>h.title==="The Gummy Bear"&&h.status==="gameLocked"?{...h,status:"ready",gameLocked:false}:h));
        // Unlock Blink after defeating Cult of Fashion (threat id 228)
        if(threat.name==="Cult of Fashion")setHeroes(prev=>prev.map(h=>h.title==="Blink"&&h.status==="gameLocked"?{...h,status:"ready",gameLocked:false}:h));
        // Unlock Skull Crusher after North American Blackout (threat id 231)
        if(threat.name==="North American Blackout")setHeroes(prev=>prev.map(h=>h.title==="Skull Crusher"&&h.status==="gameLocked"?{...h,status:"ready",gameLocked:false}:h));
        // Unlock Eclipso after defeating Blight threat
        if(threat.name&&threat.name.toLowerCase().includes("blight"))setHeroes(prev=>prev.map(h=>h.title==="Eclipso"&&h.status==="gameLocked"?{...h,status:"ready",gameLocked:false}:h));
        if(threat.villainId)setVillains(prev=>prev.map(v=>v.id===threat.villainId?{...v,defeated:true}:v));
        if(threat.isTeamUp&&threat.villainId2)setVillains(prev=>prev.map(v=>v.id===threat.villainId2?{...v,defeated:true}:v));
        setThreats(prev=>prev.filter(t=>t.id!==threat.id));
        setScore(s=>s+pts);
      }
      setDepMap(prev=>{const n={...prev};delete n[threat.id];return n;});
      setModal({threat,heroes:assigned,outcome,narration,damages,anyKIA,turnedVillain,redeemedVillains,levelUps,xpEarned:pts,newRomMsg,newDisMsg,unlockMsg});
      setLog(`Debrief: ${threat.name} — ${outcome.toUpperCase()}${anyKIA?" ⚠ HERO LOST":""}${turnedVillain?` 🔴 ${turnedVillain.title} TURNED`:""}${levelUps.length?" ⭐ LVL UP":""}${newRomMsg?" 💕":""}`);
      // ── Generate news headline ──
      {
        const villain=threat.villainId?vRef.current.find(v=>v.id===threat.villainId):null;
        const vname=villain?.title||threat.name;  // Y = villain name or threat name if no villain
        const tname=threat.name;                  // Z = always threat name
        let hline=null;
        if(anyKIA&&!turnedVillain){const deadH=assigned.filter(h=>hRef.current.find(x=>x.id===h.id)?.status==="kia");if(deadH.length)hline=pickHeadline("heroDies",deadH,vname,tname);}
        else if(redeemedVillains.length>0)hline=pickHeadline("johnRedeemsVillain",assigned,vname,tname);
        else if(assigned.some(h=>h.isJohn)&&outcome!=="failure")hline=pickHeadline("johnStopsVillainOrThreat",assigned,vname,tname);
        else if(outcome==="failure"&&villain)hline=pickHeadline("villainDefeatsHeroes",assigned,vname,tname);
        else if(outcome==="failure")hline=pickHeadline("threatDefeatsHeroes",assigned,vname,tname);
        else if(newRomMsg)hline=pickHeadline("heroesWinRomantic",assigned,vname,tname);
        else if(newDisMsg)hline=pickHeadline("heroesWinDisdain",assigned,vname,tname);
        else if(assigned.length===1&&outcome!=="failure")hline=pickHeadline("heroWinsSolo",assigned,vname,tname);
        else if(assigned.length>=2&&outcome!=="failure")hline=pickHeadline("heroesWinNoRel",assigned,vname,tname);
        if(!hline)hline=pickHeadline("generic",assigned,vname,tname);
        if(hline)pushHeadline(hline);
      }    },4000+Math.random()*2000);
  }

  const sortedHeroes=useMemo(()=>{
    const active=heroes.filter(h=>!["shopLocked","gameLocked","kia"].includes(h.status));
    const shopL=heroes.filter(h=>h.status==="shopLocked");
    const gameL=heroes.filter(h=>h.status==="gameLocked");
    const kia=heroes.filter(h=>h.status==="kia");
    const sort=arr=>[...arr].sort((a,b)=>effStats(b,rom,dis).power-effStats(a,rom,dis).power);
    return[...sort(active),...sort(shopL),...sort(gameL),...kia];
  },[heroes,rom,dis]);

  const allDeployable=heroes.filter(canDeploy);
  const target=extMode?WIN2:WIN1;

  // ── MENU ──
  if(screen==="menu")return React.createElement("div",{className:"menu"},
    React.createElement("div",{className:"jk-label"},"JK GAMING PRESENTS"),
    React.createElement("div",{className:"menu-logo"},"W.S.P.A."),
    React.createElement("div",{className:"menu-sub"},"WORLD SECURITY & PROTECTION AGENCY"),
    React.createElement("div",{className:"menu-pts"},`BANK: ${bank} PTS`),
    React.createElement("div",{style:{textAlign:"center",marginTop:4}},
      React.createElement("div",{style:{fontSize:10,color:"var(--text3)",marginBottom:4}},"ENTER YOUR NAME, DIRECTOR"),
      React.createElement("input",{className:"menu-input",value:nameInput,onChange:e=>setNameInput(e.target.value),onKeyDown:e=>e.key==="Enter"&&nameInput.trim()&&startGame(),placeholder:"Director Name...",autoFocus:true})
    ),
    React.createElement("button",{className:"mbtn",onClick:()=>startGame(),disabled:!nameInput.trim()},"▶ BEGIN COMMAND"),
    React.createElement("button",{className:"mbtn gold",onClick:()=>setScreen("shop")},"🛒 HERO SHOP"),
    React.createElement("button",{className:"mbtn purple",onClick:()=>setScreen("codex")},"📖 INFORMATION CODEX"),
    React.createElement("button",{className:"mbtn",style:{background:"var(--bg3)",borderColor:"var(--text3)",color:"var(--text2)"},onClick:()=>setScreen("acknowledgements")},"◈ ACKNOWLEDGEMENTS"),
    shopMsg&&React.createElement("div",{style:{fontSize:9,color:"var(--green)",textAlign:"center",maxWidth:300}},shopMsg)
  );

  // ── ACKNOWLEDGEMENTS ──
  if(screen==="acknowledgements")return React.createElement("div",{className:"full-panel"},
    React.createElement("div",{className:"full-panel-header"},
      React.createElement("div",{className:"full-panel-title"},"◈ ACKNOWLEDGEMENTS"),
      React.createElement("button",{className:"mbtn",style:{padding:"4px 12px"},onClick:()=>setScreen("menu")},"← BACK")
    ),
    React.createElement("div",{className:"full-panel-body"},
      React.createElement("div",{style:{maxWidth:600,margin:"0 auto",padding:"20px 12px"}},
        React.createElement("div",{style:{fontFamily:"var(--font-head)",fontSize:13,color:"var(--gold)",letterSpacing:2,marginBottom:16,textAlign:"center"}},"FROM THE DEVELOPER"),
        React.createElement("div",{style:{fontSize:13,color:"var(--text2)",lineHeight:2,whiteSpace:"pre-wrap",textAlign:"center"}},
          "Hello, and thank you for playing my very first videogame. WSPA was a trial run in trying to learn more about coding, AI, and a chance to create a fun superhero universe as I prepare for larger and more unique projects. I hope you enjoy the humor, the scaling, and the strategy.\n\nThis project uses AI for the coding and the art, and it certainly snuck in help on the creative side as well, but I did my best to limit this. Because of this, and more particularly because of the AI use of art, I do not feel comfortable charging anything for this work at this time.\n\nInstead, my sincere hope is that you enjoy the game, explore different strategies, and have fun with the lore. The single greatest payment I could receive is engagement, feedback, and peoples favorite and least favorite aspects of the game.\n\nThank you for playing! Go save the world!"
        ),
        React.createElement("div",{style:{fontFamily:"var(--font-head)",fontSize:12,color:"var(--accent)",textAlign:"center",marginTop:24,letterSpacing:2}},"— JK Gaming")
      )
    )
  );

  // ── SHOP ──
  if(screen==="shop")return React.createElement("div",{className:"full-panel"},
    React.createElement("div",{className:"full-panel-header"},
      React.createElement("div",{className:"full-panel-title"},"🛒 HERO SHOP"),
      React.createElement("div",{style:{display:"flex",gap:8,alignItems:"center"}},
        React.createElement("div",{style:{fontFamily:"var(--font-head)",fontSize:11,color:"var(--gold)"}},"BANK: "+bank+" PTS"),
        React.createElement("button",{className:"mbtn",style:{padding:"4px 12px"},onClick:()=>setScreen("menu")},"← BACK")
      )
    ),
    React.createElement("div",{className:"full-panel-body"},
      React.createElement("div",{style:{fontSize:12,color:"var(--text3)",marginBottom:12}},`Purchase locked heroes for ${SHOP_PRICE} points each. Purchased heroes are unlocked in all future games.`),
      React.createElement("div",{className:"shop-grid"},
        SHOP_LOCK_TITLES.map(title=>{
          const hdef=ALL_HERO_DEFS.find(h=>h.title===title);
          if(!hdef)return null;
          const owned=ownedShop.includes(title);
          return React.createElement("div",{key:title,className:"shop-card"+(owned?" owned":"")},
            React.createElement("div",{className:"shop-card-name"},hdef.title),
            React.createElement("div",{className:"shop-card-meta"},`${hdef.cls.toUpperCase()} · PWR ${hdef.basePower} · HP ${hdef.baseHP}`),
            React.createElement("div",{style:{fontSize:11,color:"var(--text3)",marginBottom:8,lineHeight:1.5}},hdef.personality.slice(0,80)+"…"),
            React.createElement("div",{className:"shop-card-price"},owned?"✓ OWNED":bank>=SHOP_PRICE?`${SHOP_PRICE} PTS`:`${SHOP_PRICE} PTS (need ${SHOP_PRICE-bank} more)`),
            React.createElement("button",{className:"shop-buy-btn",disabled:owned||bank<SHOP_PRICE,onClick:()=>buyShopHero(title)},owned?"OWNED":"PURCHASE")
          );
        })
      ),
      React.createElement("div",{style:{fontFamily:"var(--font-head)",fontSize:12,color:"var(--purple)",letterSpacing:2,margin:"18px 0 8px",borderBottom:"1px solid var(--border)",paddingBottom:4}},"◈ VILLAIN ROSTER — UNLOCK FOR 100 PTS"),
      React.createElement("div",{style:{fontSize:11,color:"var(--text3)",marginBottom:10}},"Unlocked villains may appear as threats or become redeemable heroes."),
      React.createElement("div",{className:"shop-grid"},
        SHOP_VILLAIN_TITLES.map(title=>{
          const vdef=VILLAIN_DEFS.find(v=>v.title===title);
          if(!vdef)return null;
          const owned=ownedShop.includes("v_"+title);
          return React.createElement("div",{key:title,className:"shop-card villain-shop-card"+(owned?" owned":"")},
            React.createElement("div",{className:"shop-card-name",style:{color:"var(--purple)"}},vdef.title),
            React.createElement("div",{className:"shop-card-meta"},`${vdef.cls.toUpperCase()} · PWR ${vdef.basePower} · HP ${vdef.baseHP}`),
            React.createElement("div",{style:{fontSize:11,color:"var(--text3)",marginBottom:8,lineHeight:1.5}},vdef.personality.slice(0,80)+"…"),
            React.createElement("div",{className:"shop-card-price"},owned?"✓ OWNED":bank>=SHOP_VILLAIN_PRICE?`${SHOP_VILLAIN_PRICE} PTS`:`${SHOP_VILLAIN_PRICE} PTS (need ${SHOP_VILLAIN_PRICE-bank} more)`),
            React.createElement("button",{className:"shop-buy-btn",style:{borderColor:"var(--purple)",color:"var(--purple)"},disabled:owned||bank<SHOP_VILLAIN_PRICE,onClick:()=>buyShopVillain(title)},owned?"OWNED":"PURCHASE")
          );
        })
      )
    )
  );

  // ── CODEX ──
  if(screen==="codex")return React.createElement("div",{className:"full-panel"},
    React.createElement("div",{className:"full-panel-header"},
      React.createElement("div",{className:"full-panel-title"},"📖 INFORMATION CODEX"),
      React.createElement("div",{style:{display:"flex",gap:8,alignItems:"center"}},
        React.createElement("div",{style:{fontFamily:"var(--font-head)",fontSize:11,color:"var(--gold)"}},"BANK: "+bank+" PTS"),
        React.createElement("button",{className:"mbtn",style:{padding:"4px 12px"},onClick:()=>setScreen("menu")},"← BACK")
      )
    ),
    React.createElement("div",{className:"full-panel-body"},
      React.createElement("div",{style:{fontSize:9,color:"var(--text3)",marginBottom:10}},"Unlock any entry for 1 point. Entries remain unlocked permanently."),
      React.createElement("div",{className:"tabs"},
        ["hero","villain","threat"].map(tab=>React.createElement("button",{key:tab,className:"tab"+(codexTab===tab?" active":""),onClick:()=>setCodexTab(tab)},tab==="hero"?"HEROES":tab==="villain"?"SUPERVILLAINS":"THREATS"))
      ),
      React.createElement("div",{className:"codex-grid"},
        CODEX_ENTRIES.filter(e=>e.category===codexTab).map(e=>{
          const unlocked=codexUnlocked.includes(e.id);
          return React.createElement("div",{key:e.id,className:"codex-card"+(unlocked?"":" locked-codex"),onClick:()=>!unlocked&&buyCodexEntry(e.id)},
            React.createElement("div",{className:"codex-card-title"},
              React.createElement("span",null,e.name),
              !unlocked&&React.createElement("span",{className:"codex-unlock-cost"},"1 PT")
            ),
            unlocked?React.createElement("div",{className:"codex-card-body"},
              e.category==="hero"&&React.createElement("div",null,
                e.portrait&&React.createElement("img",{src:e.portrait,alt:e.name,style:{width:"100%",maxWidth:160,height:"auto",display:"block",margin:"0 auto 10px",borderRadius:4,border:"1px solid var(--border2)",objectFit:"cover"}}),
                React.createElement("div",null,React.createElement("b",null,"Real Name: "),e.realName),
                React.createElement("div",null,React.createElement("b",null,"Class: "),e.cls?.toUpperCase()," · PWR ",e.power," · HP ",e.hp),
                React.createElement("div",null,React.createElement("b",null,"Bio: "),e.personality),
                React.createElement("div",null,React.createElement("b",null,"Abilities: "),e.abilities),
                React.createElement("div",null,React.createElement("b",null,"Weaknesses: "),e.weaknesses),
                e.special&&React.createElement("div",null,React.createElement("b",null,"Special: "),e.special),
                e.secret&&React.createElement("div",{style:{color:"#ff8844"}},React.createElement("b",null,"⚠ Secret: "),e.secret)
              ),
              e.category==="villain"&&React.createElement("div",null,
                e.portrait&&React.createElement("img",{src:e.portrait,alt:e.name,style:{width:"100%",maxWidth:160,height:"auto",display:"block",margin:"0 auto 10px",borderRadius:4,border:"1px solid var(--purple)",objectFit:"cover",opacity:0.85}}),
                React.createElement("div",null,React.createElement("b",null,"Real Name: "),e.realName),
                React.createElement("div",null,React.createElement("b",null,"Class: "),e.cls?.toUpperCase()," · PWR ",e.power," · HP ",e.hp),
                React.createElement("div",null,React.createElement("b",null,"Bio: "),e.personality),
                React.createElement("div",null,React.createElement("b",null,"Abilities: "),e.abilities),
                React.createElement("div",null,React.createElement("b",null,"Weaknesses: "),e.weaknesses),
                e.special&&React.createElement("div",null,React.createElement("b",null,"Special: "),e.special)
              ),
              e.category==="threat"&&React.createElement("div",null,
                React.createElement("div",null,React.createElement("b",null,"Location: "),e.loc),
                React.createElement("div",null,React.createElement("b",null,"Priority: "),P_LABELS[e.priority]||e.priority," · ",e.type?.toUpperCase()),
                React.createElement("div",null,e.desc),
                React.createElement("div",null,React.createElement("b",null,"Reward: "),e.reward+" pts")
              )
            ):React.createElement("div",{className:"codex-card-body",style:{color:"var(--text3)",fontStyle:"italic"}},"[LOCKED — click to unlock for 1 pt]")
          );
        })
      )
    )
  );

  // ── GAME OVER ──
  if(screen==="gameover")return React.createElement("div",{className:"menu"},
    gameOver==="win"?React.createElement(React.Fragment,null,
      React.createElement("div",{className:"jk-label"},"JK GAMING"),
      React.createElement("div",{className:"menu-logo",style:{color:"var(--gold)"}},"VICTORY"),
      React.createElement("div",{className:"menu-sub"},`DIRECTOR ${directorName.toUpperCase()} — EARTH IS SAFE`),
      React.createElement("div",{style:{fontSize:12,color:"var(--gold)",fontFamily:"var(--font-head)"}},`+${extMode?WIN2:WIN1} PTS ADDED TO YOUR BANK`),
      React.createElement("div",{style:{fontSize:12,color:"var(--text2)",textAlign:"center",maxWidth:380,lineHeight:1.8}},extMode?"You reached 1000 points. Legendary Director.":`You secured Earth. Continue for ultimate glory?`),
      !extMode&&React.createElement("button",{className:"mbtn green",onClick:()=>{continueToTier2();setScreen("game");}},"▶ CONTINUE TO 1000 PTS"),
      React.createElement("button",{className:"mbtn gold",onClick:()=>{setNameInput(directorName);setScreen("menu");}},extMode?"▶ PLAY AGAIN":"↩ MAIN MENU")
    ):React.createElement(React.Fragment,null,
      React.createElement("div",{className:"jk-label"},"JK GAMING"),
      React.createElement("div",{className:"menu-logo",style:{color:"var(--red)",fontSize:"22px"}},"MISSION FAILED"),
      React.createElement("div",{className:"menu-sub",style:{color:"var(--red)"}},"YOU HAVE FAILED TO PROTECT THE PLANET."),
      React.createElement("div",{style:{fontSize:13,color:"var(--gold)",fontFamily:"var(--font-head)"}},"You scored "+score+" points."),
      React.createElement("div",{style:{fontSize:10,color:"var(--text3)",textAlign:"center",maxWidth:360,lineHeight:1.6,margin:"0 20px"}},gameOverReason),
      React.createElement("button",{className:"mbtn red",onClick:()=>{setNameInput(directorName);setScreen("menu");}},"↺ TRY AGAIN")
    )
  );

  if(screen!=="game")return null;

  return React.createElement("div",{className:"app"},
    React.createElement("div",{className:"topbar"},
      React.createElement("div",{className:"topbar-logo"},"W.S.P.A. · JK GAMING"),
      React.createElement("div",{className:"topbar-divider"}),
      React.createElement("div",{className:"topbar-director"},`DIR. ${directorName.toUpperCase()}`),
      React.createElement("div",{className:"topbar-divider"}),
      React.createElement("div",{className:"topbar-stat"},"SCORE ",React.createElement("b",null,`${score}/${target}`)),
      React.createElement("div",{className:"topbar-stat"},"THREATS ",React.createElement("b",null,threats.length)),
      React.createElement("div",{className:"topbar-stat"},"READY ",React.createElement("b",null,allDeployable.length)),
      React.createElement("div",{className:"topbar-stat"},"KIA ",React.createElement("b",{style:{color:"#ff3333"}},heroes.filter(h=>h.status==="kia").length)),
      threats.some(t=>t.priority==="red"||t.priority==="purple")&&React.createElement("div",{className:"topbar-alert"},"⚠ PRIORITY ONE"),
      React.createElement("button",{className:"exit-btn",onClick:()=>{if(confirm("Exit to menu? You keep points only if you've already won 500+.")){exitToMenu(true);}}},"► EXIT")
    ),
    React.createElement("div",{className:"news-ticker-bar"},
      React.createElement("div",{className:"news-ticker-label"},"NEWS"),
      React.createElement("div",{className:"news-ticker-track"},
        React.createElement("div",{key:tickerMsg,className:"news-ticker-text"},tickerMsg)
      )
    ),
    React.createElement("div",{className:"main"},
      // HERO PANEL
      React.createElement("div",{className:"heroes-panel"},
        React.createElement("div",{className:"panel-header"},"◈ HERO ROSTER"),
        sortedHeroes.map(h=>{
          const{power,maxHP}=effStats(h,rom,dis);
          const hpPct=(h.currentHP/maxHP)*100;
          const thresh=xpToLevel(h);const xpPct=Math.min(100,((h.xp||0)/thresh)*100);
          const isExp=expandedHero===h.id;
          const rk=Object.keys(rom).find(k=>k.split(",").map(Number).includes(h.id));
          const rpId=rk?Number(rk.split(",").find(x=>Number(x)!==h.id)):null;
          const rp=rpId?heroes.find(x=>x.id===rpId):null;
          const disTitles=(dis[h.id]||[]).map(id=>heroes.find(x=>x.id===id)?.title).filter(Boolean);
          const isShopL=h.status==="shopLocked";const isGameL=h.status==="gameLocked";
          const cardCls=["hero-card",`${h.cls}-card`,
            isShopL?"shop-locked":isGameL?"game-locked":"",
            h.status==="kia"?"kia-card":"",
            h.status==="turned"?"kia-card":"",
            isExp?"expanded":"",
            h.redeemed?"villain-card":"",
            h.levelUpFlash?"level-up-flash":""
          ].filter(Boolean).join(" ");
          return React.createElement("div",{key:h.id,className:cardCls,style:{position:"relative"},onClick:()=>!isShopL&&!isGameL&&h.status!=="kia"&&h.status!=="turned"&&setExpandedHero(isExp?null:h.id)},
            h.speechBubble&&React.createElement("div",{className:"speech-bubble"},h.speechBubble),
            React.createElement("div",{style:{display:"flex",alignItems:"flex-start",gap:0}},
              React.createElement("div",{style:{flex:1}},
                React.createElement("div",{className:"hero-row"},
                  React.createElement("span",{className:`hero-name-text${h.isJohn?" john-name":""}${h.redeemed?" villain-name":""}`},h.title),
                  React.createElement("span",{className:`hero-badge badge-${isShopL?"shop":isGameL?"locked":h.status==="offworld"?"offworld":h.status==="turned"?"kia":h.status==="resting"&&canDeploy(h)?"resting":h.status}`},
                    isShopL?"SHOP":isGameL?"LOCKED":h.status==="offworld"?"OFF-WORLD":h.status==="turned"?"TURNED":h.status==="ready"?"READY":h.status==="deployed"?"AWAY":h.status==="resting"&&canDeploy(h)?"REST✓":h.status==="resting"?"REST":h.status==="exhausted"?"OUT":"K.I.A."
                  )
                ),
                React.createElement("div",{className:"hero-meta"},`${CAREER[h.career]?.label} · ${h.cls.toUpperCase()} · PWR ${power.toFixed(1)}`),
                !isShopL&&!isGameL&&React.createElement("div",{className:"stat-row"},
                  React.createElement("div",{className:"sl"},"HP"),
                  React.createElement("div",{className:"bt"},React.createElement("div",{className:"bf",style:{width:`${hpPct}%`,background:h.isJohn?"#ffd700":sc(h.currentHP,maxHP)}})),
                  React.createElement("span",{style:{fontSize:8,color:"var(--text3)",marginLeft:3}},`${Math.round(h.currentHP)}/${maxHP}`)
                ),
                !isShopL&&!isGameL&&h.status!=="kia"&&h.status!=="turned"&&CAREER[h.career]?.next&&React.createElement("div",{className:"xp-row"},
                  React.createElement("div",{className:"xp-label"},"XP"),
                  React.createElement("div",{className:"xp-bar-track"},React.createElement("div",{className:"xp-bar-fill",style:{width:`${xpPct}%`}})),
                  React.createElement("span",{style:{fontSize:7,color:"var(--gold)",marginLeft:3}},`${h.xp||0}/${thresh}`)
                ),
                isShopL&&React.createElement("div",{style:{fontSize:8,color:"var(--gold)",marginTop:3}},`Unlock in Shop for ${SHOP_PRICE} pts`)
              ),
              React.createElement("div",{className:"hero-pic-placeholder"},
                h.portrait?React.createElement("img",{src:h.portrait,alt:h.title}):null
              )
            ),
            isExp&&React.createElement("div",{className:"hero-detail"},
              React.createElement("div",{className:"detail-section"},React.createElement("b",null,"Real Name: "),h.realName),
              React.createElement("div",{className:"detail-section"},React.createElement("b",null,"Bio: "),h.personality),
              React.createElement("div",{className:"detail-section"},React.createElement("b",null,"Abilities: "),h.abilities),
              React.createElement("div",{className:"detail-section"},React.createElement("b",null,"Weaknesses: "),h.weaknesses),
              h.specialAbility&&React.createElement("div",{className:"detail-section"},React.createElement("b",null,"Special: "),h.specialAbility),
              h.secretTrait&&!h.hiddenTraits&&React.createElement("div",{className:"detail-section",style:{color:"#ff8844"}},React.createElement("b",null,"⚠ Secret: "),h.secretTrait),
              h.affiliates?.length>0&&React.createElement("div",{className:"detail-section"},React.createElement("b",null,"Affiliates: "),h.affiliates.join(", ")),
              React.createElement("div",{className:"detail-section"},React.createElement("b",null,"Romance: "),React.createElement("span",{className:"romance-tag"},h.romanceStatus||(rp?`💕 ${rp.title}`:"Single"))),
              disTitles.length>0&&React.createElement("div",{className:"detail-section"},React.createElement("b",null,"Disdains: "),React.createElement("span",{className:"disdain-tag"},`😤 ${disTitles.join(", ")}`)),
              React.createElement("div",{className:"detail-section"},React.createElement("b",null,"Deployable at: "),`${h.functionalAt} HP · Regen: ${h.regenSec}s/pt`),
              h.unlockCondition&&React.createElement("div",{className:"detail-section",style:{color:"var(--gold)"}},React.createElement("b",null,"Unlock: "),h.unlockCondition)
            )
          );
        })
      ),
      // MAP
      React.createElement("div",{className:"map-area"},
        React.createElement("svg",{className:"map-svg",viewBox:"0 0 580 360",xmlns:"http://www.w3.org/2000/svg"},
          React.createElement("defs",null,
            React.createElement("filter",{id:"glow"},React.createElement("feGaussianBlur",{stdDeviation:"2.5",result:"cb"}),React.createElement("feMerge",null,React.createElement("feMergeNode",{in:"cb"}),React.createElement("feMergeNode",{in:"SourceGraphic"}))),
            React.createElement("linearGradient",{id:"sg",x1:"0%",y1:"0%",x2:"100%",y2:"0%"},React.createElement("stop",{offset:"0%",stopColor:"#00d4ff"}),React.createElement("stop",{offset:"100%",stopColor:"#aa44ff"})),
            React.createElement("linearGradient",{id:"og",x1:"0%",y1:"0%",x2:"0%",y2:"100%"},React.createElement("stop",{offset:"0%",stopColor:"#03192e"}),React.createElement("stop",{offset:"100%",stopColor:"#020d1a"}))
          ),
          React.createElement("rect",{width:580,height:360,fill:"url(#og)"}),
          [90,180,270].map(y=>React.createElement("line",{key:y,x1:0,y1:y,x2:580,y2:y,stroke:"#0a2030",strokeWidth:.4,strokeDasharray:"4,14"})),
          [116,232,348,464].map(x=>React.createElement("line",{key:x,x1:x,y1:0,x2:x,y2:360,stroke:"#0a2030",strokeWidth:.4,strokeDasharray:"4,14"})),
          React.createElement("path",{d:"M36,22 L50,16 L66,14 L80,16 L94,14 L108,16 L122,18 L134,22 L144,28 L150,36 L156,46 L160,58 L162,70 L162,84 L160,96 L156,108 L150,118 L144,126 L136,134 L126,140 L116,144 L108,150 L100,156 L92,162 L86,168 L82,174 L80,180 L78,186 L74,190 L70,188 L66,182 L62,172 L58,160 L54,148 L50,136 L46,122 L43,108 L40,94 L37,78 L35,62 L35,46 L35,34 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:1}),
          React.createElement("path",{d:"M82,174 L86,180 L88,190 L86,200 L82,204 L78,200 L76,190 L76,180 L78,174 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.7}),
          React.createElement("path",{d:"M50,136 L54,140 L56,152 L54,164 L50,168 L46,162 L46,150 L48,140 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.6}),
          React.createElement("path",{d:"M36,22 L26,20 L16,24 L10,32 L14,40 L24,42 L34,36 L36,28 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.7}),
          React.createElement("path",{d:"M152,8 L168,4 L184,6 L192,14 L192,24 L186,32 L176,36 L164,34 L154,26 L150,16 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.7}),
          React.createElement("path",{d:"M80,200 L86,206 L90,216 L88,224 L84,228 L80,222 L78,212 L78,204 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.6}),
          React.createElement("path",{d:"M88,228 L98,222 L112,218 L126,218 L140,222 L152,230 L160,242 L164,256 L164,272 L160,288 L154,304 L144,318 L130,328 L116,332 L102,328 L90,316 L82,300 L78,282 L78,264 L80,248 L84,236 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:1}),
          React.createElement("path",{d:"M216,28 L228,24 L240,22 L252,24 L260,28 L268,34 L274,42 L276,52 L274,62 L268,70 L260,76 L250,80 L240,80 L230,76 L222,70 L216,62 L212,52 L212,42 L214,34 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:1}),
          React.createElement("path",{d:"M214,62 L224,60 L232,64 L236,74 L232,84 L222,86 L214,80 L210,70 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.8}),
          React.createElement("path",{d:"M206,28 L214,24 L218,30 L216,40 L210,46 L204,42 L202,34 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.6}),
          React.createElement("path",{d:"M198,32 L204,28 L208,34 L206,42 L200,44 L196,38 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.5}),
          React.createElement("path",{d:"M240,8 L252,4 L264,8 L270,18 L268,30 L260,38 L250,40 L240,34 L234,24 L234,14 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.8}),
          React.createElement("path",{d:"M248,72 L256,68 L264,72 L266,82 L262,94 L256,102 L250,98 L246,88 L246,78 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.6}),
          React.createElement("path",{d:"M264,76 L272,74 L278,80 L276,90 L270,94 L264,88 L260,80 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.5}),
          React.createElement("path",{d:"M218,88 L234,84 L250,82 L264,86 L276,92 L284,102 L290,114 L294,128 L294,144 L292,160 L288,178 L280,196 L270,212 L256,224 L240,232 L224,234 L210,226 L200,212 L194,196 L190,178 L190,160 L192,142 L196,124 L202,108 L210,98 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:1}),
          React.createElement("path",{d:"M292,150 L306,148 L318,154 L322,164 L314,170 L300,168 L292,160 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.7}),
          React.createElement("ellipse",{cx:298,cy:206,rx:4,ry:8,fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.5}),
          React.createElement("path",{d:"M294,102 L310,98 L328,100 L338,108 L340,120 L334,130 L318,136 L302,132 L292,120 L290,110 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.8}),
          React.createElement("path",{d:"M306,132 L322,130 L334,138 L336,152 L328,166 L316,170 L304,162 L300,148 L300,138 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.7}),
          React.createElement("path",{d:"M278,18 L300,12 L326,8 L354,6 L382,6 L408,10 L432,16 L452,24 L466,34 L474,46 L478,60 L476,74 L470,88 L460,100 L446,110 L428,118 L408,124 L386,126 L364,122 L342,116 L320,108 L300,98 L284,86 L274,72 L270,56 L272,42 L274,30 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:1}),
          React.createElement("path",{d:"M338,118 L356,114 L370,118 L378,132 L378,148 L370,162 L356,172 L342,170 L330,158 L326,144 L328,130 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.9}),
          React.createElement("ellipse",{cx:358,cy:178,rx:4,ry:6,fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.4}),
          React.createElement("path",{d:"M404,118 L422,114 L438,118 L448,130 L444,144 L430,150 L414,148 L404,136 L400,126 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.8}),
          React.createElement("path",{d:"M418,144 L426,150 L430,162 L428,174 L422,178 L416,172 L414,160 L414,150 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.6}),
          React.createElement("path",{d:"M434,154 L452,150 L464,156 L468,170 L462,184 L448,190 L434,184 L426,172 L428,160 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.7}),
          React.createElement("path",{d:"M458,62 L468,56 L476,60 L478,70 L474,80 L464,84 L456,78 L454,68 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.7}),
          React.createElement("path",{d:"M448,82 L458,78 L464,86 L460,96 L452,100 L444,94 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.6}),
          React.createElement("ellipse",{cx:454,cy:110,rx:4,ry:7,fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.4}),
          React.createElement("path",{d:"M462,128 L468,124 L474,130 L472,140 L464,144 L458,138 L460,130 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.5}),
          React.createElement("path",{d:"M416,200 L438,192 L460,190 L480,194 L494,202 L502,214 L504,230 L500,244 L490,256 L474,264 L456,268 L438,266 L422,256 L410,242 L406,226 L408,212 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:1}),
          React.createElement("path",{d:"M508,250 L516,244 L522,250 L520,262 L512,268 L506,262 L506,254 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.5}),
          React.createElement("path",{d:"M190,18 L202,14 L214,16 L218,24 L214,30 L202,32 L190,28 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.6}),
          React.createElement("path",{d:"M156,334 L200,328 L248,324 L296,322 L344,324 L392,328 L432,334 L420,344 L380,348 L328,350 L276,350 L224,348 L180,344 Z",fill:"#0d2a3f",stroke:"#1e4a65",strokeWidth:.7}),
          ...threats.map(t=>{
            const c=threatColor(t);const dep=depMap[t.id]&&depMap[t.id].length>0;
            return React.createElement("g",{key:t.id,filter:"url(#glow)"},
              React.createElement("circle",{cx:t.x,cy:t.y,r:20,fill:`${c}09`,stroke:c,strokeWidth:.5,className:"pulse-ring"}),
              React.createElement("circle",{cx:t.x,cy:t.y,r:10,fill:`${c}18`,stroke:c,strokeWidth:1}),
              React.createElement("circle",{cx:t.x,cy:t.y,r:4,fill:c}),
              dep&&React.createElement("circle",{cx:t.x,cy:t.y,r:15,fill:"none",stroke:"#00d4ff",strokeWidth:1.5,strokeDasharray:"4,3"}),
              React.createElement("text",{x:t.x,y:t.y-23,textAnchor:"middle",fontSize:7,fill:c,fontFamily:"'Share Tech Mono',monospace"},t.loc),
              React.createElement("text",{x:t.x,y:t.y+28,textAnchor:"middle",fontSize:7,fill:"#00d4ff",fontFamily:"'Share Tech Mono',monospace"},`T-${Math.floor(t.timer/60)}:${String(t.timer%60).padStart(2,"0")}`)
            );
          }),
          React.createElement("rect",{x:8,y:342,width:564,height:6,rx:2,fill:"rgba(255,255,255,.04)",stroke:"#0a2a40",strokeWidth:.5}),
          React.createElement("rect",{x:8,y:342,width:Math.min(564,(score/target)*564),height:6,rx:2,fill:"url(#sg)"}),
          React.createElement("text",{x:290,y:340,textAnchor:"middle",fontSize:7.5,fill:"var(--text3)",fontFamily:"'Share Tech Mono',monospace"},`SCORE: ${score} / ${target}${extMode?" [EXTENDED]":""}`)
        )
      ),
      // THREATS PANEL
      React.createElement("div",{className:"threats-panel"},
        React.createElement("div",{style:{padding:"7px 7px 0"}},React.createElement("div",{className:"panel-header"},"◈ ACTIVE THREATS")),
        React.createElement("div",{className:"threat-list"},
          threats.length===0&&React.createElement("div",{style:{fontSize:9,color:"var(--text3)",padding:12,textAlign:"center"}},"No active threats."),
          [...threats].sort((a,b)=>{const pOrder={purple:0,red:1,orange:2,yellow:3};const pa=pOrder[a.priority]??4;const pb=pOrder[b.priority]??4;if(pa!==pb)return pa-pb;return a.timer-b.timer;}).map(t=>{
            const dep=depMap[t.id]&&depMap[t.id].length>0;const c=threatColor(t);
            return React.createElement("div",{key:t.id,className:`threat-card priority-${t.priority}${selThreat===t.id?" sel":""}`,onClick:()=>setSelThreat(selThreat===t.id?null:t.id)},
              React.createElement("div",{className:"threat-name"},t.name),
              React.createElement("div",{className:"threat-loc"},t.loc),
              React.createElement("div",{className:"threat-meta-row"},
                React.createElement("span",{className:"t-timer"},`T-${Math.floor(t.timer/60)}:${String(t.timer%60).padStart(2,"0")}`),
                React.createElement("span",{style:{color:c}},P_LABELS[t.priority]||t.priority),
                dep&&React.createElement("span",{style:{color:"#00d4ff"}},"● ACTIVE"),
                React.createElement("span",{style:{color:"var(--gold)"}},`+${t.reward}`)
              ),
              selThreat===t.id&&React.createElement("div",null,
                React.createElement("div",{className:"threat-desc"},t.desc),
                React.createElement("button",{className:"deploy-btn",disabled:dep||!allDeployable.length,onClick:e=>{e.stopPropagation();openDep(t);}},dep?"HEROES DEPLOYED":"▶ DEPLOY HEROES")
              )
            );
          })
        )
      )
    ),
    React.createElement("div",{className:"mission-log"},
      React.createElement("div",{className:"log-prefix"},"INTEL //"),
      React.createElement("div",{className:"log-text"},log),
      React.createElement("div",{className:"log-time"},logTime)
    ),
    // DEPLOY MODAL
    depModal&&React.createElement("div",{className:"modal-overlay",onClick:()=>setDepModal(null)},
      React.createElement("div",{className:"modal",onClick:e=>e.stopPropagation()},
        React.createElement("div",{className:"modal-title"},`DEPLOY: ${depModal.name}`),
        React.createElement("div",{className:"modal-sub"},`${depModal.loc} · ${P_LABELS[depModal.priority]||""}`),
        (()=>{if(picked.length===1){const h=heroes.find(x=>x.id===picked[0]);if(h&&isSuicide(h,heroes,picked))return React.createElement("div",{className:"suicide-warn"},"⚠ SUICIDE MISSION: <30 HP, alone, 2+ heroes at full. 50% chance of turning villain if KIA.");}return null;})(),
        React.createElement("div",{className:"hero-select-list"},
          heroes.filter(h=>!["shopLocked","gameLocked","kia","turned","offworld"].includes(h.status)).map(h=>{
            const{power,maxHP}=effStats(h,rom,dis);const dep=canDeploy(h);const pk=picked.includes(h.id);
            return React.createElement("div",{key:h.id,className:`hsi${pk?" picked":""}${!dep?" unavailable":""}`,onClick:()=>dep&&toggleH(h.id)},
              React.createElement("div",null,
                React.createElement("div",{style:{fontFamily:"var(--font-head)",fontSize:10,color:h.isJohn?"#ffd700":clsColor(h.cls),marginBottom:2}},h.title),
                React.createElement("div",{style:{fontSize:9,color:"var(--text3)"}},`${h.cls.toUpperCase()} · PWR ${power.toFixed(1)} · HP ${Math.round(h.currentHP)}/${maxHP}`),
                h.status==="resting"&&dep&&React.createElement("div",{className:"hsi-warn"},"⚠ Not at full HP")
              ),
              React.createElement("div",{style:{display:"flex",gap:5,alignItems:"center"}},
                !dep&&React.createElement("span",{className:`hero-badge badge-${h.status}`},h.status.toUpperCase()),
                pk&&React.createElement("span",{style:{color:"var(--accent)",fontSize:14}},"✓")
              )
            );
          })
        ),
        React.createElement("button",{className:"confirm-btn",disabled:!picked.length,onClick:confirmDep},`▶ DEPLOY ${picked.length} HERO${picked.length!==1?"ES":""}`),
        React.createElement("button",{className:"modal-close",onClick:()=>setDepModal(null)},"✕ CANCEL")
      )
    ),
    // RESULT MODAL
    modal&&React.createElement("div",{className:"modal-overlay",onClick:()=>setModal(null)},
      React.createElement("div",{className:"modal",onClick:e=>e.stopPropagation()},
        React.createElement("div",{className:"modal-title"},"MISSION DEBRIEF"),
        React.createElement("div",{className:"modal-sub"},`${modal.threat.name} · ${modal.threat.loc}`),
        React.createElement("div",{className:`modal-outcome outcome-${modal.outcome}`},modal.outcome==="success"?"▲ MISSION SUCCESS":modal.outcome==="partial"?"◈ PARTIAL SUCCESS":"▼ MISSION FAILED"),
        React.createElement("div",{className:"modal-narration"},modal.narration),
        React.createElement("div",{className:"modal-stats"},
          modal.heroes.map(h=>{
            const u=heroes.find(x=>x.id===h.id);const d=modal.damages?.[h.id];
            const{maxHP}=effStats(h,rom,dis);const lv=modal.levelUps?.find(l=>l.title===h.title);
            return React.createElement("div",{key:h.id,className:"mstat"},
              React.createElement("div",{className:"mstat-label"},h.title),
              React.createElement("div",{className:"mstat-val",style:{color:h.isJohn?"#ffd700":u?.status==="kia"?"var(--red)":u?.status==="turned"?"var(--yellow)":u?.status==="exhausted"?"var(--yellow)":"var(--green)"}},
                u?.status==="kia"?"K.I.A.":u?.status==="turned"?"TURNED":`HP ${Math.round(u?.currentHP||0)}/${maxHP}`
              ),
              d&&React.createElement("div",{style:{fontSize:8,color:"var(--text3)",marginTop:2}},`-${d.health}hp`),
              modal.xpEarned>0&&!["kia"].includes(u?.status)&&React.createElement("div",{className:"mstat-xp"},`+${modal.xpEarned} XP`),
              lv&&React.createElement("div",{style:{fontSize:8,color:"var(--gold)",marginTop:2}},`⭐ → ${CAREER[lv.to].label}`)
            );
          })
        ),
        modal.levelUps?.length>0&&React.createElement("div",{className:"modal-notice notice-gold"},`⭐ LEVEL UP: ${modal.levelUps.map(l=>`${l.title} → ${CAREER[l.to].label}`).join(" · ")}`),
        modal.newRomMsg&&React.createElement("div",{className:"modal-notice notice-pink"},modal.newRomMsg),
        modal.newDisMsg&&React.createElement("div",{className:"modal-notice notice-red"},modal.newDisMsg),
        modal.unlockMsg&&React.createElement("div",{className:"modal-notice notice-green"},`🔓 ${modal.unlockMsg}`),
        modal.redeemedVillains?.length>0&&React.createElement("div",{className:"modal-notice notice-purple"},`✨ JOHN redeemed: ${modal.redeemedVillains.map(v=>v.title).join(" & ")}! They join the WSPA roster.`),
        modal.turnedVillain&&React.createElement("div",{className:"modal-notice notice-orange"},`🔴 ${modal.turnedVillain.title} survived and turned villain. They are now a WSPA threat.`),
        modal.anyKIA&&!modal.turnedVillain&&React.createElement("div",{className:"modal-notice notice-red"},"⚠ HERO LOST IN ACTION. They will not be returning, Director."),
        React.createElement("button",{className:"modal-close",onClick:()=>setModal(null)},"◈ CLOSE DEBRIEF")
      )
    )
  );
}

ReactDOM.render(React.createElement(App),document.getElementById("root"));
