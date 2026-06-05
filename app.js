const {useState,useEffect,useRef,useMemo}=React;

// ─── WORLD MAP COMPONENT (D3 Natural Earth projection) ────────────────────────
function WorldMap({threats,depMap,score,target,extMode}){
  const svgRef=useRef(null);
  const [paths,setPaths]=useState([]);
  const [proj,setProj]=useState(null);
  const W=580,H=360;

  useEffect(()=>{
    // Load world topojson and build paths using d3-geo
    Promise.all([
      fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(r=>r.json())
    ]).then(([world])=>{
      const projection=d3.geoNaturalEarth1()
        .scale(92)
        .translate([W/2,H/2]);
      const pathGen=d3.geoPath().projection(projection);
      const countries=topojson.feature(world,world.objects.countries);
      const land=topojson.merge(world,world.objects.countries.geometries);
      const graticule=d3.geoGraticule()();
      setPaths({
        land: pathGen(land),
        graticule: pathGen(graticule),
        countries: countries.features.map(f=>({id:f.id,d:pathGen(f)}))
      });
      setProj(()=>projection);
    }).catch(()=>{
      // Fallback: simple equirectangular if CDN unavailable
      const projection=([lng,lat])=>[
        (lng+180)*(W/360),
        (90-lat)*(H/180)
      ];
      setProj(()=>projection);
    });
  },[]);

  // Project a threat's lat/lng to SVG x,y
  function project(t){
    if(!proj)return null;
    try{
      const pt=proj([t.lng,t.lat]);
      if(!pt||isNaN(pt[0])||isNaN(pt[1]))return null;
      return pt;
    }catch(e){return null;}
  }

  return React.createElement("div",{className:"map-area"},
    React.createElement("svg",{ref:svgRef,className:"map-svg",viewBox:`0 0 ${W} ${H}`,xmlns:"http://www.w3.org/2000/svg"},
      React.createElement("defs",null,
        React.createElement("filter",{id:"glow"},
          React.createElement("feGaussianBlur",{stdDeviation:"2.5",result:"cb"}),
          React.createElement("feMerge",null,
            React.createElement("feMergeNode",{in:"cb"}),
            React.createElement("feMergeNode",{in:"SourceGraphic"})
          )
        ),
        React.createElement("linearGradient",{id:"sg",x1:"0%",y1:"0%",x2:"100%",y2:"0%"},
          React.createElement("stop",{offset:"0%",stopColor:"#00d4ff"}),
          React.createElement("stop",{offset:"100%",stopColor:"#aa44ff"})
        ),
        React.createElement("linearGradient",{id:"og",x1:"0%",y1:"0%",x2:"0%",y2:"100%"},
          React.createElement("stop",{offset:"0%",stopColor:"#03192e"}),
          React.createElement("stop",{offset:"100%",stopColor:"#020d1a"})
        )
      ),
      // Background
      React.createElement("rect",{width:W,height:H,fill:"url(#og)"}),
      // Graticule (lat/lng grid lines)
      paths.graticule&&React.createElement("path",{d:paths.graticule,fill:"none",stroke:"#0a2030",strokeWidth:.35,strokeDasharray:"2,8"}),
      // Country fills — all one color for the tactical display look
      paths.countries&&paths.countries.map(c=>
        React.createElement("path",{key:c.id,d:c.d,fill:"#0d2a3f",stroke:"#1a3f5c",strokeWidth:.4})
      ),
      // Land outline (thicker border over country fills)
      paths.land&&React.createElement("path",{d:paths.land,fill:"none",stroke:"#1e4a65",strokeWidth:.9}),
      // Threat markers
      ...threats.map(t=>{
        const pt=project(t);
        if(!pt)return null;
        const [tx,ty]=pt;
        const c=P_COLORS[t.priority]||"#ffaa00";
        const dep=depMap[t.id]&&depMap[t.id].length>0;
        return React.createElement("g",{key:t.id,filter:"url(#glow)"},
          React.createElement("circle",{cx:tx,cy:ty,r:18,fill:`${c}09`,stroke:c,strokeWidth:.5,className:"pulse-ring"}),
          React.createElement("circle",{cx:tx,cy:ty,r:9,fill:`${c}18`,stroke:c,strokeWidth:1}),
          React.createElement("circle",{cx:tx,cy:ty,r:3.5,fill:c}),
          dep&&React.createElement("circle",{cx:tx,cy:ty,r:13,fill:"none",stroke:"#00d4ff",strokeWidth:1.5,strokeDasharray:"4,3"}),
          React.createElement("text",{x:tx,y:ty-21,textAnchor:"middle",fontSize:6.5,fill:c,fontFamily:"'Share Tech Mono',monospace"},t.loc),
          React.createElement("text",{x:tx,y:ty+26,textAnchor:"middle",fontSize:6.5,fill:"#00d4ff",fontFamily:"'Share Tech Mono',monospace"},`T-${Math.floor(t.timer/60)}:${String(t.timer%60).padStart(2,"0")}`)
        );
      }).filter(Boolean),
      // Score bar
      React.createElement("rect",{x:8,y:350,width:564,height:6,rx:2,fill:"rgba(255,255,255,.04)",stroke:"#0a2a40",strokeWidth:.5}),
      React.createElement("rect",{x:8,y:350,width:Math.min(564,(score/target)*564),height:6,rx:2,fill:"url(#sg)"}),
      React.createElement("text",{x:290,y:348,textAnchor:"middle",fontSize:7.5,fill:"var(--text3)",fontFamily:"'Share Tech Mono',monospace"},`SCORE: ${score} / ${target}${extMode?" [EXTENDED]":""}`)
    )
  );
}

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
  const [rogueCouncilTriggered,setRogueCouncilTriggered]=useState(false);
  const rogueCouncilDeaths=useRef(0);
  const suicideMissionCount=useRef(0);
  const [suicideDisplayCount,setSuicideDisplayCount]=useState(0);
  const cassonikWarnedRef=useRef(false);
  const affectedHeroTitles=useRef([]); // titles of heroes who died or went rogue on suicide missions

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
  const [johnOffworldTimer,setJohnOffworldTimer]=useState(0); // counts up; 0-180 = on earth, 180-420 = offworld (3min on, 4min off)

  const tick=useRef(0);
  const lastHeadlineTick=useRef(0); // tracks last tick a headline was pushed
  const hRef=useRef(heroes);hRef.current=heroes;
  const vRef=useRef(villains);vRef.current=villains;
  const tRef=useRef(threats);tRef.current=threats;
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
    setDepMap({});setRom({});setDis({13:[50]});setModal(null);setDepModal(null);setPicked([]);
    setScore(0);setSelThreat(null);setGameOver(null);setGameOverReason("");
    setJohnOffworldTimer(0);
    rogueCouncilDeaths.current=0;
    suicideMissionCount.current=0;
    setSuicideDisplayCount(0);
    cassonikWarnedRef.current=false;
    affectedHeroTitles.current=[];
    setRogueCouncilTriggered(false);
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
        if(["deployed","gameLocked","shopLocked","kia","rogue","offworld"].includes(h.status))return h;
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

      setHeroes(prev=>{
        // Check Morgana veteran pulse and Flip unlock BEFORE mapping so no nested setState
        const morganaVet=prev.find(h=>h.title==="Morgana"&&h.career==="veteran"&&h.status!=="deployed");
        const morganaPulse=morganaVet&&t>0&&t%300===0;
        const flipVet=prev.find(h=>h.title==="The Flip"&&h.career==="veteran");
        const aj=prev.find(h=>h.title==="Adrenaline Junkie");
        const flipUnlock=flipVet&&aj&&aj.status==="gameLocked";
        if(morganaPulse)setLog("✨ Morgana veteran pulse — all heroes restored!");
        if(flipUnlock)setLog("⭐ The Flip is VETERAN — Adrenaline Junkie unlocked!");
        return prev.map(h=>{
          let u={...h};
          if(h.healCooldown>0)u.healCooldown=h.healCooldown-1;
          if(h.levelUpFlash)u.levelUpFlash=false;
          if(h.speechBubble&&Math.random()<0.025)u.speechBubble=null;
          if(h.status==="deployed"&&!h.speechBubble&&Math.random()<0.005)u.speechBubble=getRandQuip(h,romRef.current,disRef.current,true);
          if(morganaPulse&&!["kia","gameLocked","shopLocked"].includes(h.status)){
            const{maxHP}=effStats(h,romRef.current,disRef.current);
            return{...u,currentHP:maxHP,status:"ready",regenTimer:0};
          }
          if(flipUnlock&&h.title==="Adrenaline Junkie")return{...u,status:"ready",gameLocked:false};
          return u;
        });
      });

      // ── JOHN OFFWORLD CYCLE (every 120s away, 120s gone, returns at 90% HP) ──
      setHeroes(prev=>{
        const john=prev.find(h=>h.isJohn&&h.status!=="gameLocked"&&h.status!=="kia");
        if(!john)return prev;
        const newTimer=(johnOffRef.current||0)+1;
        setJohnOffworldTimer(newTimer);
        if(newTimer===180){
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
        if(newTimer===420){
          // John returns at 90% HP — unless he is grieving CK's death
          if(john.ckGrief){
            // He never comes back
            setJohnOffworldTimer(420); // hold timer here permanently
            return prev;
          }
          setJohnOffworldTimer(0);
          const{maxHP}=effStats(john,romRef.current,disRef.current);
          const returnHP=Math.round(maxHP*0.9);
          // Check if an active rogue situation is waiting for John
          const rogueActive=prev.some(h=>h.status==="rogue"&&(h.title==="The Crimson Knight"||h.pendingJohnRogue));
          const councilActive=tRef.current.some(t=>t.isRogueCouncil);
          if(rogueActive||councilActive){
            setLog(`🔴 John has returned — and joins the rogue heroes. "I want this to end peacefully. No one gets hurt."`);
            // Update existing rogue council threat to mark John present
            setThreats(p=>p.map(t=>t.isRogueCouncil||t.isCKJohnTeamUp?{...t,johnPresent:true,desc:t.desc+" John has returned and joined them. This is now a 99% loss for the Director."}:t));
            return prev.map(h=>h.isJohn?{...h,status:"rogue",currentHP:returnHP,speechBubble:"I want this to end peacefully. No one gets hurt.",pendingOffworld:false}:
              // Ironside not rogue: give him his quote
              (h.title==="Ironside"&&h.status!=="rogue")?{...h,speechBubble:"We're better off without them."}:h);
          }
          setLog(`🌟 John has returned! (90% HP)`);
          return prev.map(h=>h.isJohn?{...h,status:returnHP<(h.functionalAt||0)?"exhausted":"ready",currentHP:returnHP,speechBubble:"I'm back!"}:h);
        }
        return prev;
      });

      // Compute threat updates outside the setState updater to avoid side effects in pure fn
      {
        const curThreats=tRef.current;
        let gameEnd=null;
        const escalationLogs=[];
        const updatedThreats=curThreats.map(th=>{
          if(th.timer>0)return{...th,timer:th.timer-1};
          if(th.priority==="red"||th.priority==="purple"){gameEnd=th;return th;}
          const np=escalate(th.priority);
          escalationLogs.push("⚠ "+th.name+" escalated to "+P_LABELS[np]+"!");
          return{...th,priority:np,timer:th.maxTimer,maxTimer:Math.max(60,th.maxTimer-30)};
        });
        setThreats(updatedThreats);
        escalationLogs.forEach(msg=>setLog(msg));
        if(gameEnd){setGameOver("lose");setGameOverReason(gameEnd.name+" reached Priority ONE with no response.");setScreen("gameover");}
      }

      if(t>0&&t%180===0&&scoreRef.current>=VILLAIN_TEAM_SCORE){
        const av=vRef.current.filter(v=>!v.defeated&&!v.redeemed);
        if(av.length>=2&&Math.random()<0.25){
          const v1=av[Math.floor(Math.random()*av.length)];
          const v2pool=av.filter(v=>v.id!==v1.id);
          if(v2pool.length>0){
            const v2=v2pool[Math.floor(Math.random()*v2pool.length)];
            const tt={id:Date.now(),name:`VILLAIN TEAM-UP: ${v1.title} & ${v2.title}`,loc:v1.loc,lat:((v1.lat||0)+(v2.lat||0))/2,lng:((v1.lng||0)+(v2.lng||0))/2,priority:"purple",type:"military",desc:`${v1.title} and ${v2.title} have allied. Combined threat is severe.`,timer:200,maxTimer:200,reward:v1.reward+v2.reward,villainId:v1.id,villainId2:v2.id,recurring:true,isTeamUp:true,teamUpPower:(v1.basePower||5)+(v2.basePower||5)};
            setThreats(p=>{if(p.length>=7)return p;return[...p,tt];});
            setLog(`🔴 VILLAIN TEAM-UP: ${v1.title} & ${v2.title} have allied!`);
          }
        }
      }

      if(t>0&&t%55===0){
        // Read current state via refs — no nested setState
        const spawnCap=scoreRef.current>=600?Math.round(6*1.21):scoreRef.current>=300?Math.round(6*1.10):6;
        const curThreats=tRef.current;
        if(curThreats.length<spawnCap){
          const av=vRef.current.filter(v=>!v.defeated&&!v.redeemed&&!curThreats.some(p=>p.villainId===v.id));
          if(av.length>0&&Math.random()<0.28){
            const v=av[Math.floor(Math.random()*av.length)];
            const nt={id:Date.now(),name:v.title,loc:v.loc,lat:v.lat,lng:v.lng,priority:"purple",type:v.threatType||"military",desc:v.personality.slice(0,80)+"…",timer:220,maxTimer:220,reward:v.reward,recurring:true,villainId:v.id};
            setLog("⚠ VILLAIN: "+v.title+" — "+v.loc);
            setThreats(prev=>[...prev,nt]);
          } else {
            // Pick from threat queue without nesting
            let queue=[...tqRef.current];
            if(queue.length===0){queue=shuffle(ALL_THREATS);}
            const pick=queue[0];
            const rest=queue.slice(1);
            setThreatQueue(rest);
            setThreats(prev=>prev.length>=spawnCap?prev:[...prev,{...pick,timer:pick.maxTimer,id:Date.now()}]);
            setLog("⚠ NEW THREAT: "+pick.name+" — "+pick.loc);
          }
        }
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
    const conductorP=assigned.some(h=>h.title==="The Conductor");
    const gummyP=assigned.some(h=>h.title==="The Gummy Bear");
    setHeroes(prev=>prev.map(h=>{
      if(!picked.includes(h.id))return h;
      const iceBonus=iceP&&h.title!=="IceBerg";
      const conductorBonus=conductorP&&h.cls==="tank"&&h.title!=="The Conductor";
      const decorated={...h,_icebergBonus:iceBonus,_conductorBonus:conductorBonus};
      const{maxHP}=effStats(decorated,romRef.current,disRef.current);
      const bubble=Math.random()<0.55?getRandQuip(h,romRef.current,disRef.current,true):null;
      return{...h,status:"deployed",_icebergBonus:iceBonus,_conductorBonus:conductorBonus,currentHP:Math.min(maxHP,h.currentHP),speechBubble:bubble};
    }));
    setDepMap(prev=>({...prev,[threat.id]:picked}));
    setLog(`⚡ ${assigned.map(h=>h.title).join(" & ")} deployed to ${threat.loc}...`);

    setTimeout(async()=>{
      let outcome=rollMission(assigned,threat,romRef.current,disRef.current);
      // ── Dr. Destruction special: if this IS Dr. Destruction's threat and outcome is failure,
      // he stopped himself — award a success instead ──
      const drDestructionVillain=threat.villainId===114||threat.name==="Dr. Destruction";
      if(drDestructionVillain&&outcome==="failure"){
        outcome="success";
      }
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

      // ── Quaker friendly fire: 5 random damage to one teammate on deployment (until special unlocked) ──
      const quaker=assigned.find(h=>h.quakerFriendlyFire&&h.career==="beginner");
      if(quaker){
        const qtargets=assigned.filter(h=>h.id!==quaker.id);
        if(qtargets.length>0){
          const qffTarget=qtargets[Math.floor(Math.random()*qtargets.length)];
          setHeroes(prev=>prev.map(h=>{
            if(h.id!==qffTarget.id)return h;
            const nHP=Math.max(1,h.currentHP-5);
            return{...h,currentHP:nHP};
          }));
          setLog(`⚠ Quaker accidentally hurt ${qffTarget.title} (-5 HP) on deployment!`);
        }
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
      let johnShouldTurn=false;
      const veteranEvents=[];
      let pendingJohnOffworld=null;

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
        if(h.isJohn){const johnNewHP=Math.max(h.functionalAt,h.currentHP-d.health);if(h.pendingOffworld){const quote=JOHN_DEPARTURE_QUOTES[Math.floor(Math.random()*JOHN_DEPARTURE_QUOTES.length)];const ckQuote=Math.random()<0.5?CK_JOHN_DEPARTURE_RESPONSES[Math.floor(Math.random()*CK_JOHN_DEPARTURE_RESPONSES.length)]:null;const headline=pickHeadline("johnLeavesToOtherPlanets",[{title:"John"}],null,null);if(headline)pushHeadline(headline);setLog(`🚀 John finished the mission — then departed. "${quote}"${ckQuote?` · Crimson Knight: "${ckQuote}"`:"" }`);return{...h,currentHP:johnNewHP,status:"offworld",_icebergBonus:false,_conductorBonus:false,speechBubble:quote,pendingOffworld:false};}return{...h,currentHP:johnNewHP,status:johnNewHP<=h.functionalAt?"resting":"ready",_icebergBonus:false,_conductorBonus:false,speechBubble:null};}
        let nHP=Math.max(0,h.currentHP-d.health);
        if(gummyP&&h.title!=="The Gummy Bear")nHP=Math.max(0,h.currentHP-Math.floor(d.health/2));
        const shamrock=assigned.find(x=>x.title==="Captain Shamrock");
        if(nHP===0&&shamrock&&h.id!==shamrock.id)nHP=1;
        if(nHP===0){
          anyKIA=true;
          const isSui=isSuicide(h,allSnap,picked);

          // ── Regular hero on suicide mission: 50% chance goes rogue instead of KIA ──
          if(isSui&&!h.isJohn&&h.title!=="The Crimson Knight"){
            if(Math.random()<0.5){
              // Hero goes ROGUE — count it and track the title for affiliate expansion
              turnedVillain=h;
              rogueCouncilDeaths.current=(rogueCouncilDeaths.current||0)+1;
              suicideMissionCount.current=(suicideMissionCount.current||0)+1;
              setSuicideDisplayCount(suicideMissionCount.current);
              if(!affectedHeroTitles.current.includes(h.title))affectedHeroTitles.current=[...affectedHeroTitles.current,h.title];
              // Cassonik warning after first confirmed suicide event
              if(!cassonikWarnedRef.current){
                cassonikWarnedRef.current=true;
                setTimeout(()=>{
                  setHeroes(p2=>p2.map(x=>x.title==="Cassonik"?{...x,speechBubble:"Heroes don't like being set up to die. They might go rogue…"}:x));
                  setLog("⚠ Cassonik: \"Heroes don't like being set up to die. They might go rogue…\"");
                },600);
              }
              const rogueThreat={
                id:Date.now()+h.id,
                name:`ROGUE: ${h.title}`,
                loc:threat.loc,lat:threat.lat||0,lng:threat.lng||0,
                priority:"purple",type:"military",
                desc:`${h.title} survived a suicide mission and has gone rogue against the WSPA. They retain all hero stats and abilities. Can be redeemed.`,
                timer:300,maxTimer:300,reward:Math.round(h.baseHP/2),
                villainId:null,rogueHeroId:h.id,rogueHero:h,recurring:true,redeemable:true
              };
              setThreats(p2=>[...p2,rogueThreat]);
              return{...h,currentHP:1,status:"rogue",rogueHero:true,_icebergBonus:false,_conductorBonus:false,speechBubble:"You sent me to die. The director has turned evil — I won't let this stand."};
            } else {
              // Hero dies on suicide mission — still counts
              rogueCouncilDeaths.current=(rogueCouncilDeaths.current||0)+1;
              suicideMissionCount.current=(suicideMissionCount.current||0)+1;
              setSuicideDisplayCount(suicideMissionCount.current);
              if(!affectedHeroTitles.current.includes(h.title))affectedHeroTitles.current=[...affectedHeroTitles.current,h.title];
              if(!cassonikWarnedRef.current){
                cassonikWarnedRef.current=true;
                setTimeout(()=>{
                  setHeroes(p2=>p2.map(x=>x.title==="Cassonik"?{...x,speechBubble:"Heroes don't like being set up to die. They might go rogue…"}:x));
                  setLog("⚠ Cassonik: \"Heroes don't like being set up to die. They might go rogue…\"");
                },600);
              }
              return{...h,currentHP:0,status:"kia",_icebergBonus:false,_conductorBonus:false,speechBubble:null};
            }
          }

          // ── Crimson Knight on suicide mission: 50% chance she goes rogue ──
          if(h.title==="The Crimson Knight"&&isSui&&Math.random()<0.5){
            const{maxHP:ckMax}=effStats(h,romRef.current,disRef.current);
            const johnSnap=allSnap.find(j=>j.isJohn&&j.status!=="kia"&&j.status!=="gameLocked"&&j.status!=="rogue");
            const johnIsOffworld=allSnap.find(j=>j.isJohn)?.status==="offworld";
            rogueCouncilDeaths.current=(rogueCouncilDeaths.current||0)+1;
            suicideMissionCount.current=(suicideMissionCount.current||0)+1;
            setSuicideDisplayCount(suicideMissionCount.current);
            if(!affectedHeroTitles.current.includes(h.title))affectedHeroTitles.current=[...affectedHeroTitles.current,h.title];
            if(!cassonikWarnedRef.current){cassonikWarnedRef.current=true;}
            if(johnSnap&&!johnIsOffworld){
              // John is here — he joins CK immediately, 99% scenario
              johnShouldTurn=true;
              const ckJohnThreat={
                id:Date.now(),
                name:"ROGUE: THE CRIMSON KNIGHT & JOHN",
                loc:"United States",lat:38.9,lng:-77.0,
                priority:"purple",type:"military",
                desc:"You sent The Crimson Knight on a suicide mission — and she survived. She and John are now certain the Director has turned evil and is a threat to the world. They act on conscience and moral duty to protect humanity from a corrupt Director. Heroes they defeat are left at 1 HP. John is with them. This is a 99% loss for the Director.",
                timer:300,maxTimer:300,reward:120,
                isCKJohnTeamUp:true,leavesAt1HP:true,johnPresent:true
              };
              setThreats(p2=>[...p2.filter(x=>!x.isCKJohnTeamUp),ckJohnThreat]);
              setLog("🔴 CATASTROPHIC: The Crimson Knight went rogue — and John stands with her. \"I want this to end peacefully. No one gets hurt.\" They are not here to kill. The Director will be ousted.");
            } else {
              // John is offworld — CK alone, hard but beatable. Flag John as pendingRogue on return
              const ckThreat={
                id:Date.now(),
                name:"ROGUE: THE CRIMSON KNIGHT",
                loc:"United States",lat:38.9,lng:-77.0,
                priority:"purple",type:"military",
                desc:"The Crimson Knight went rogue after surviving a suicide mission. She acts on conscience and moral duty. Heroes defeated are left at 1 HP. John is offworld — if he returns, he will immediately join her.",
                timer:300,maxTimer:300,reward:90,
                isCKJohnTeamUp:true,leavesAt1HP:true,johnPresent:false,ckRogueAlone:true
              };
              setThreats(p2=>[...p2.filter(x=>!x.isCKJohnTeamUp),ckThreat]);
              // Flag John as pendingRogue so he joins on return
              setHeroes(p2=>p2.map(j=>j.isJohn?{...j,pendingRogue:true}:j));
              setLog("🔴 The Crimson Knight has gone rogue after surviving a suicide mission. She acts on conscience. John is offworld — if he returns, he will join her immediately.");
            }
            return{...h,currentHP:Math.round(ckMax*0.3),status:"rogue",regenTimer:0,_icebergBonus:false,_conductorBonus:false,speechBubble:"You sent me to die. The director has become the very evil we swore to stop."};
          }

          // ── Normal CK death (not suicide or rogue roll failed) — she can simply die ──
          // If John is unlocked and alive, he leaves permanently
          const johnAlive=allSnap.find(j=>j.isJohn&&j.status!=="gameLocked"&&j.status!=="kia");
          if(johnAlive){
            const griefQuote=JOHN_GRIEF_QUOTES[Math.floor(Math.random()*JOHN_GRIEF_QUOTES.length)];
            setTimeout(()=>{
              setHeroes(p2=>p2.map(j=>j.isJohn?{...j,status:"offworld",speechBubble:griefQuote,pendingOffworld:false,ckGrief:true}:j));
              setLog("💔 John: \""+griefQuote+"\" — He has left Earth. He will not return.");
              const headline=pickHeadline("johnLeavesToOtherPlanets",[{title:"John"}],null,null);
              if(headline)pushHeadline("[Heroes Weekly] John has vanished following the loss of The Crimson Knight. Experts fear he may never return.");
            },500);
          }
          return{...h,currentHP:0,status:"kia",_icebergBonus:false,_conductorBonus:false,speechBubble:null};
        }
        const st=nHP<(h.functionalAt||0)?"exhausted":nHP<maxHP?"resting":"ready";
        const thresh=xpToLevel(h);const nXP=(h.xp||0)+pts;
        let nc=h.career;let didLv=false;
        if(nXP>=thresh&&CAREER[h.career]?.next){nc=CAREER[h.career].next;didLv=true;levelUps.push({title:h.title,to:nc});
          // Collect veteran events instead of calling nested setHeroes
          if(h.title==="The Crimson Knight"&&nc==="veteran")veteranEvents.push("ck");
          if(h.title==="Eclipso"&&nc==="veteran")veteranEvents.push("eclipso");
          if(h.title==="Corvair"&&nc==="veteran")veteranEvents.push("corvair");
          if(h.title==="Skull Crusher"&&nc==="veteran")veteranEvents.push("skullcrusher");
        }
        return{...h,currentHP:nHP,status:st,regenTimer:0,xp:didLv?nXP-thresh:nXP,career:nc,levelUpFlash:didLv,_icebergBonus:false,_conductorBonus:false,speechBubble:null,eclipsoLonelyPenalty:h.eclipsoLonelyPenalty&&nc!=="veteran"?true:false};
      }));
      // Apply veteran unlock side-effects in a separate, non-nested setHeroes call
      if(veteranEvents.length>0){
        setHeroes(p2=>p2.map(x=>{
          let u={...x};
          if(veteranEvents.includes("ck")&&x.isJohn){u={...u,status:"ready",gameLocked:false};}
          if(veteranEvents.includes("corvair")){u={...u,_corvairBuff:true};}
          if(veteranEvents.includes("skullcrusher")&&x.title==="Skull Crusher"){u={...u,skullCrusherFriendlyFire:false};}
          return u;
        }));
        if(veteranEvents.includes("ck"))setLog("⭐ Crimson Knight is VETERAN — John unlocked!");
        if(veteranEvents.includes("corvair"))setLog("⭐ Corvair VETERAN — team-wide +0.5 power boost active!");
        if(veteranEvents.includes("skullcrusher"))setLog("⭐ Skull Crusher VETERAN — Finally Mastered Being Gentle: friendly fire disabled!");
        if(veteranEvents.includes("eclipso"))setLog("⭐ Eclipso VETERAN — Sees the Value of the Team: team penalty removed!");
      }
      if(pendingJohnOffworld){
        const{quote,ckQuote}=pendingJohnOffworld;
        const headline=pickHeadline("johnLeavesToOtherPlanets",[{title:"John"}],null,null);
        if(headline)pushHeadline(headline);
        setLog("🚀 John finished the mission — then departed. \""+quote+"\""+( ckQuote?" · Crimson Knight: \""+ckQuote+"\"":""));
      }

      // ── ROGUE HERO COUNCIL: if 2+ heroes died/went rogue on suicide missions ──
      if(rogueCouncilDeaths.current>=2&&!rogueCouncilTriggered){
        setRogueCouncilTriggered(true);
        // Base least-institutional heroes
        const BASE_COUNCIL=["The Crimson Knight","John","The Dragon of the Daimyo","Dinosia","The Gummy Bear","Captain Shamrock","Corvair"];
        // Expand by one hop of affiliates of affected heroes (those who died or went rogue)
        const affected=affectedHeroTitles.current;
        const allHeroSnap=hRef.current;
        const affiliateExpansion=allHeroSnap.filter(h=>{
          if(BASE_COUNCIL.includes(h.title))return false;
          if(h.status==="kia"||h.status==="gameLocked")return false;
          return (h.affiliates||[]).some(aff=>affected.includes(aff));
        }).map(h=>h.title);
        const councilPool=[...new Set([...BASE_COUNCIL,...affiliateExpansion])];
        const johnSnap=allHeroSnap.find(h=>h.isJohn);
        const johnIsOffworld=johnSnap?.status==="offworld";
        const aliveCouncil=allHeroSnap.filter(h=>councilPool.includes(h.title)&&h.status!=="kia"&&h.status!=="rogue"&&h.status!=="gameLocked");
        const councilNames=aliveCouncil.map(h=>h.title).join(", ")||"several heroes";
        const johnInCouncil=aliveCouncil.some(h=>h.isJohn);
        const councilThreat={
          id:Date.now()+9999,
          name:"THE ROGUE HERO COUNCIL",
          loc:"Multiple Locations",lat:38.9,lng:-77.0,
          priority:"purple",type:"military",
          desc:"The Director has sent heroes to die. A coalition — "+councilNames+" — has formed to remove the Director from power. They leave all defeated heroes at 1 HP. They do not act from malice, but from moral conviction."+(johnInCouncil?" John is among them. This is a 99% loss for the Director.":johnIsOffworld?" John is offworld — if he returns, he will join them immediately. Without him, victory is possible but extremely difficult.":""),
          timer:300,maxTimer:300,reward:200,
          isRogueCouncil:true,leavesAt1HP:true,johnPresent:johnInCouncil,
          rogueMembers:aliveCouncil.map(h=>({title:h.title,basePower:h.basePower,career:h.career,affiliates:h.affiliates||[],isJohn:h.isJohn||false})),
          recurring:true
        };
        setThreats(p2=>[...p2.filter(x=>!x.isRogueCouncil),councilThreat]);
        const logSuffix=johnInCouncil?" John stands with them — the Director will be ousted.":johnIsOffworld?" John is offworld — the council may be stopped without him.":"";
        setLog("🔴 ROGUE HERO COUNCIL FORMED: "+councilNames+" are mobilizing to remove the Director from power."+logSuffix);
        // Set all council members rogue
        setHeroes(p2=>p2.map(h=>{
          if(!councilPool.includes(h.title)||h.status==="kia"||h.status==="gameLocked")return h;
          // Ironside: if NOT going rogue, give him his quote
          if(h.title==="Ironside")return{...h,speechBubble:"We're better off without them."};
          return{...h,status:"rogue",speechBubble:"The Director has turned evil. We must protect the world from them."};
        }));
        // If John is offworld, flag him as pendingRogue
        if(johnIsOffworld){
          setHeroes(p2=>p2.map(h=>h.isJohn?{...h,pendingRogue:true}:h));
        }
      }

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
        // Unlock Tremor after defeating Baba Yaga
        if(threat.name&&threat.name.includes("Baba Yaga"))setHeroes(prev=>prev.map(h=>h.title==="Tremor"&&h.status==="gameLocked"?{...h,status:"ready",gameLocked:false}:h));
        // Unlock Skull Crusher after North American Blackout (threat id 231)
        if(threat.name==="North American Blackout")setHeroes(prev=>prev.map(h=>h.title==="Skull Crusher"&&h.status==="gameLocked"?{...h,status:"ready",gameLocked:false}:h));
        // Unlock Eclipso after defeating Blight threat
        if(threat.name&&threat.name.toLowerCase().includes("blight"))setHeroes(prev=>prev.map(h=>h.title==="Eclipso"&&h.status==="gameLocked"?{...h,status:"ready",gameLocked:false}:h));
        if(threat.isRogueCouncil||threat.isCKJohnTeamUp){
          if(threat.johnPresent){
            // 1% miracle: rogue team stays permanently rogue but threat is removed
            setHeroes(prev=>prev.map(h=>h.status==="rogue"?{...h,status:"rogue",speechBubble:"You surprised us. But we will not return."}:h));
            setLog("✅ Remarkable. The heroes were stopped — but they will not return to service. They remain rogue.");
          } else {
            setHeroes(prev=>prev.map(h=>h.status==="rogue"?{...h,status:"resting",speechBubble:"You've shown us you can change. We're back."}:h));
            setRogueCouncilTriggered(false);
            rogueCouncilDeaths.current=0;
            affectedHeroTitles.current=[];
            setLog("✅ ROGUE HEROES RESOLVED: The heroes have been convinced. They return to the WSPA roster.");
          }
        }
        if(threat.villainId)setVillains(prev=>prev.map(v=>v.id===threat.villainId?{...v,defeated:true}:v));
        if(threat.isTeamUp&&threat.villainId2)setVillains(prev=>prev.map(v=>v.id===threat.villainId2?{...v,defeated:true}:v));
        setThreats(prev=>prev.filter(t=>t.id!==threat.id));
        setScore(s=>s+pts);
      }
      setDepMap(prev=>{const n={...prev};delete n[threat.id];return n;});
      setModal({threat,heroes:assigned,outcome,narration,damages,anyKIA,turnedVillain,redeemedVillains,levelUps,xpEarned:pts,newRomMsg,newDisMsg,unlockMsg});
      setLog(`Debrief: ${threat.name} — ${outcome.toUpperCase()}${anyKIA?" ⚠ HERO LOST":""}${turnedVillain?` 🔴 ${turnedVillain.title} ROGUE`:""}${levelUps.length?" ⭐ LVL UP":""}${newRomMsg?" 💕":""}`);
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
    React.createElement("div",{className:"jckc-label"},"JCKC GAMING PRESENTS"),
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
        React.createElement("div",{style:{fontFamily:"var(--font-head)",fontSize:12,color:"var(--accent)",textAlign:"center",marginTop:24,letterSpacing:2}},"— JCKC Gaming")
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
                e.affiliates&&e.affiliates.length>0&&React.createElement("div",null,React.createElement("b",null,"Affiliates: "),e.affiliates.join(", ")),
                e.secret&&React.createElement("div",{style:{color:"#ff8844"}},React.createElement("b",null,"⚠ Secret: "),e.secret),
                e.backstory&&React.createElement("div",{style:{marginTop:10,paddingTop:8,borderTop:"1px solid var(--border)",color:"var(--text3)",fontSize:10,lineHeight:1.7,fontStyle:"italic"}},React.createElement("b",{style:{color:"var(--accent)",fontStyle:"normal",display:"block",marginBottom:4,fontSize:9,letterSpacing:1}},"◈ ANALYST FILE"),e.backstory)
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
      React.createElement("div",{className:"jckc-label"},"JCKC GAMING"),
      React.createElement("div",{className:"menu-logo",style:{color:"var(--gold)"}},"VICTORY"),
      React.createElement("div",{className:"menu-sub"},`DIRECTOR ${directorName.toUpperCase()} — EARTH IS SAFE`),
      React.createElement("div",{style:{fontSize:12,color:"var(--gold)",fontFamily:"var(--font-head)"}},`+${extMode?WIN2:WIN1} PTS ADDED TO YOUR BANK`),
      React.createElement("div",{style:{fontSize:12,color:"var(--text2)",textAlign:"center",maxWidth:380,lineHeight:1.8}},extMode?"You reached 1000 points. Legendary Director.":`You secured Earth. Continue for ultimate glory?`),
      !extMode&&React.createElement("button",{className:"mbtn green",onClick:()=>{continueToTier2();setScreen("game");}},"▶ CONTINUE TO 1000 PTS"),
      React.createElement("button",{className:"mbtn gold",onClick:()=>{setNameInput(directorName);setScreen("menu");}},extMode?"▶ PLAY AGAIN":"↩ MAIN MENU")
    ):React.createElement(React.Fragment,null,
      React.createElement("div",{className:"jckc-label"},"JCKC GAMING"),
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
      React.createElement("div",{className:"topbar-logo"},"W.S.P.A. · JCKC GAMING"),
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
            h.status==="rogue"?"kia-card":"",
            isExp?"expanded":"",
            h.redeemed?"villain-card":"",
            h.levelUpFlash?"level-up-flash":""
          ].filter(Boolean).join(" ");
          return React.createElement("div",{key:h.id,className:cardCls,style:{position:"relative"},onClick:()=>!isShopL&&!isGameL&&h.status!=="kia"&&h.status!=="rogue"&&setExpandedHero(isExp?null:h.id)},
            h.speechBubble&&React.createElement("div",{className:"speech-bubble"},h.speechBubble),
            React.createElement("div",{style:{display:"flex",alignItems:"flex-start",gap:0}},
              React.createElement("div",{style:{flex:1}},
                React.createElement("div",{className:"hero-row"},
                  React.createElement("span",{className:`hero-name-text${h.isJohn?" john-name":""}${h.redeemed?" villain-name":""}`},h.title),
                  React.createElement("span",{className:`hero-badge badge-${isShopL?"shop":isGameL?"locked":h.status==="offworld"?"offworld":h.status==="rogue"?"kia":h.status==="resting"&&canDeploy(h)?"resting":h.status}`},
                    isShopL?"SHOP":isGameL?"LOCKED":h.status==="offworld"?"OFF-WORLD":h.status==="rogue"?"ROGUE":h.status==="ready"?"READY":h.status==="deployed"?"AWAY":h.status==="resting"&&canDeploy(h)?"REST✓":h.status==="resting"?"REST":h.status==="exhausted"?"OUT":"K.I.A."
                  )
                ),
                React.createElement("div",{className:"hero-meta"},`${CAREER[h.career]?.label} · ${h.cls.toUpperCase()} · PWR ${power.toFixed(1)}`),
                !isShopL&&!isGameL&&React.createElement("div",{className:"stat-row"},
                  React.createElement("div",{className:"sl"},"HP"),
                  React.createElement("div",{className:"bt"},React.createElement("div",{className:"bf",style:{width:`${hpPct}%`,background:h.isJohn?"#ffd700":sc(h.currentHP,maxHP)}})),
                  React.createElement("span",{style:{fontSize:8,color:"var(--text3)",marginLeft:3}},`${Math.round(h.currentHP)}/${maxHP}`)
                ),
                !isShopL&&!isGameL&&h.status!=="kia"&&h.status!=="rogue"&&CAREER[h.career]?.next&&React.createElement("div",{className:"xp-row"},
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
      React.createElement(WorldMap,{threats,depMap,score,target,extMode}),
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
        suicideDisplayCount>0&&React.createElement("div",{className:"suicide-counter"},`⚠ Suicide missions this game: ${suicideDisplayCount}`),
        (()=>{if(picked.length===1){const h=heroes.find(x=>x.id===picked[0]);if(h&&isSuicide(h,heroes,picked))return React.createElement("div",{className:"suicide-warn"},"⚠ SUICIDE MISSION: Hero is low HP, alone, with healthy heroes on the bench. 50% chance of going ROGUE.");}return null;})(),
        React.createElement("div",{style:{display:"flex",gap:6,marginBottom:6}},
          React.createElement("button",{
            className:"confirm-btn",
            style:{fontSize:9,padding:"4px 10px"},
            onClick:()=>{
              const deployable=heroes.filter(h=>canDeploy(h)&&!["shopLocked","gameLocked","kia","rogue","offworld"].includes(h.status));
              setPicked(deployable.map(h=>h.id));
            }
          },"◈ SELECT ALL"),
          picked.length>0&&React.createElement("button",{
            className:"modal-close",
            style:{fontSize:9,padding:"4px 10px",marginTop:0},
            onClick:()=>setPicked([])
          },"✕ CLEAR")
        ),
        React.createElement("div",{className:"hero-select-list"},
          heroes.filter(h=>!["shopLocked","gameLocked","kia","rogue","offworld"].includes(h.status)).map(h=>{
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
              React.createElement("div",{className:"mstat-val",style:{color:h.isJohn?"#ffd700":u?.status==="kia"?"var(--red)":u?.status==="rogue"?"var(--yellow)":u?.status==="exhausted"?"var(--yellow)":"var(--green)"}},
                u?.status==="kia"?"K.I.A.":u?.status==="rogue"?"ROGUE":`HP ${Math.round(u?.currentHP||0)}/${maxHP}`
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
        modal.turnedVillain&&React.createElement("div",{className:"modal-notice notice-orange"},`🔴 ${modal.turnedVillain.title} survived and went ROGUE. They are now a WSPA threat.`),
        modal.anyKIA&&!modal.turnedVillain&&React.createElement("div",{className:"modal-notice notice-red"},"⚠ HERO LOST IN ACTION. They will not be returning, Director."),
        React.createElement("button",{className:"modal-close",onClick:()=>setModal(null)},"◈ CLOSE DEBRIEF")
      )
    )
  );
}

ReactDOM.render(React.createElement(App),document.getElementById("root"));
