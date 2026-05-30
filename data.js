// ─── PERSISTENCE ──────────────────────────────────────────────────────────────
function loadBank(){try{return parseInt(localStorage.getItem("wspa_bank")||"0",10);}catch(e){return 0;}}
function saveBank(n){try{localStorage.setItem("wspa_bank",String(n));}catch(e){}}
function loadOwned(){try{return JSON.parse(localStorage.getItem("wspa_owned")||"[]");}catch(e){return[];}}
function saveOwned(a){try{localStorage.setItem("wspa_owned",JSON.stringify(a));}catch(e){}}
function loadCodex(){try{return JSON.parse(localStorage.getItem("wspa_codex")||"[]");}catch(e){return[];}}
function saveCodex(a){try{localStorage.setItem("wspa_codex",JSON.stringify(a));}catch(e){}}

// ─── CAREER ───────────────────────────────────────────────────────────────────
const CAREER={beginner:{mult:1.0,label:"BEGINNER",next:"intermediate"},intermediate:{mult:1.05,label:"INTER.",next:"veteran"},veteran:{mult:1.11,label:"VETERAN",next:null}};
function xpToLevel(h){return h.baseHP;}

// ─── PRIORITY ─────────────────────────────────────────────────────────────────
const P_ORDER=["yellow","orange","red"];
const P_LABELS={purple:"SUPERVILLAIN",red:"PRIORITY ONE",orange:"DANGEROUS",yellow:"LOW"};
const P_COLORS={purple:"#aa44ff",red:"#ff3333",orange:"#ff7722",yellow:"#ffdd00"};
function escalate(p){const i=P_ORDER.indexOf(p);return i>=0&&i<P_ORDER.length-1?P_ORDER[i+1]:p;}

// ─── SHOP-LOCKED HEROES ───────────────────────────────────────────────────────
const SHOP_LOCK_TITLES=["The Anchor","Greywulf","Ironside","Pyrexa","Seraph","Big Mack","Scarlett","Corvair","The Dragon of the Daimyo"];
const SHOP_VILLAIN_TITLES=["The Vicountess","Dr. Stinkenstein","Hydrotheppilies","Professor Cyanide"];
const SHOP_PRICE=200;
const SHOP_VILLAIN_PRICE=100;

// ─── CATCHPHRASES ─────────────────────────────────────────────────────────────
const CP={
  "The Crimson Knight":["For faith and the fallen!","The sword of virtue never dulls.","God's grace and iron will.","Stand firm — knights do not run.","Fine, I'll take out this bad guy but I have a date in 10 minutes","I would die for this world. Let's hope it doesn't come to that.","Every battle is a prayer answered by action.","They don't know what I'm capable of.","I have faced darkness before. This is just another Tuesday.","The shield is raised. Let them come.","Virtue is not a burden — it's an armor.","I am not afraid. I have never been afraid.","My sword has never failed the innocent.","Every soul is worth protecting. Every single one.","The Order didn't make me. I made the Order."],
  "The Sportsman":["Game on.","I love my wife!","Champions adapt.","Peanuts are the only thing that scares me.","I've trained for every sport — including this one."],
  "Morgana":["Magic is just medicine with better effects.","I've healed worse.","My husband and I will kick your ---.","Even witches have office hours.","Stay behind me."],
  "IceBerg":["Cool as ever, brother.","Stay frosty — literally.","God first, ice second.","Oh BLESS your heart for trying.","I'm worried about The Flip...","Heat me up, I dare you.","I don't make the rules, but I do enforce them"],
  "The Flip":["I'd rather be digging.","Titanium skin, iron patience.","I'm still unused to not being the most powerful person in the room","I do this under protest.","Another day, another paycheck for my excavation.","Don't make me teleport you somewhere unpleasant."],
  "Cassonik":["I already saw this coming.","Predictable.","I've run seventeen scenarios. This one works.","The odds are in our favor. Barely.","Don't panic."],
  "Mycenzo":["My stone skin has never broken.","The Vatican trained me for worse.","Loyalty is its own armor.","Stand still. I'll handle it.","Very well."],
  "Pyrexa":["HAHAHAHA — oh wait, am I on fire again?","Fire solves most problems.","Is it hot in here or is that me?","More collateral damage? Probably fine!","Let's turn it up!"],
  "The Conductor":["Sound travels faster than you think.","Calibrating…","Ears open. Everything else shut.","Resonance achieved.","I'll hit every frequency until something breaks."],
  "Greywulf":["Don't call me Fido.","I track. I hunt. I finish.","Full moon or not, I'll manage.","My Culture is not your fanfiction! Gross!","The wolf remembers every trail.","Don't touch my ears."],
  "The Anchor":["I have stood through centuries. You will not move me.","The earth holds still. So do I.","Patience is the warrior's greatest weapon.","Come. I am not going anywhere.","I have seen worse."],
  "Dr. Voidance":["Which dimension am I in? Doesn't matter.","Pocket reality: deployed.","The void is my home.","Phase-shifting engaged.","Hold on — I need a moment in dimension 4B."],
  "Ironside":["Command aura: online.","Fall in line or fall behind.","Strategic deployment: confirmed.","The armor has never failed me.","This is not my first engagement."],
  "Shadowmere":["You didn't see me.","Shadows remember everything.","In and out. No one notices.","Silence is my preferred weapon.","The dark doesn't scare me — I own it."],
  "Seraph":["I have seen your kind struggle before. You will persevere.","Light endures.","Even fallen stars leave light behind.","Do not be afraid. I am here.","The celestial record will reflect this day."],
  "John":["Yeah, I've got this one.","I've seen worse on my home world.","Let me try and talk it over first, if that doesn't work have at it.","Can I listen to music during the fight? I didn't have this where I'm from.","I like this planet.","Let me try talking to them first.","I played a game like this back on my planet","I have a crush on the Crimson Knight.","I love getting to work with people.","I prefer resolution over violence. Usually."],
  "Adrenaline Junkie":["Okay fine — this is fun. A little.","Electric! And not by choice.","Let's just get it over with.","I'm only here because The Flip asked nicely.","Charged up."],
  "Captain Shamrock":["For Ireland and all that!","The shield holds! It always holds!","Every hero goes home on my watch.","The Shamrock never wilts!","The Original Captain Shamrock was much stronger than me..."],
  "Hydrothylre":["Nobody appreciates a fish king.","I hate the surface. So dry.","Jean Pierre Shrimperson does not lose. Not today.","I'm doing this for the Shrimpersons.","In the ocean I am magnificent."],
  "Dinosia":["I read twelve papers on this threat type.","RAWR — that was professional, I promise.","My van has better intel than your HQ.","Science and dinosaurs. The perfect combo.","Did you know velociraptors had feathers?"],
  "El Infinite":["This is perfect material for my thesis!","I'm the most qualified person here, statistically.","Does anyone else smell academic greatness?","Wait — is my contribution being tracked?","I've already drafted the abstract in my head."],
  "The Gummy Bear":["Nobody gets hurt on my watch.","Gelatin: nature's armor.","Soft on the outside, harder to kill than you'd think.","Victory ice Cream is on me!","Would anyone like ice cream after this?"],
  "Titanaboa":["Sssso many prey…","The hunger guidesss me.","Constriction isss communication.","I wasss a sscientist once.","Maybe I can do good..."],
  "Ariadus":["The web never liesss.","Eight eyesss see everything.","My web, my rules.","The sssspider does not apologize.","Sskittering is underrated."],
  "Maniac":["DESTRUCTION.","Burn it. All of it.","CHAOS FIRST.","Nothing matters. Everything ends.","Order is the enemy."],
  "Silphana":["The Mace hungers.","I was once like you. Never again.","The darkness provides.","Virtue is a weakness I abandoned.","Humanity forfeited my loyalty."],
  "Niera":["Disappoint me. I dare you.","You're either useful or you're in my way.","Standards exist for a reason.","I fight harder than I judge. Barely.","Impressive. Don't let it go to your head."],
  "Argos":["Money is power. Power is everything.","My suit cost more than your country.","My lawyers are faster than you.","Mediocrity is so... peasant.","Exquisite. As expected."],
  "Scylla":["A thousand years of rage.","The Hammer remembers every betrayal.","I was a queen. I am a storm.","Humanity never learns.","You are nothing but another name on my list."],
  "Golgotha":["Art is eternal. Unlike you.","Do not bleed on the upholstery.","My clade has existed longer than your civilization.","Refined, as always.","I have watched empires collapse with more grace."],
  "Mrs. Peanut":["THEY WILL PAY FOR WHAT THEY'VE DONE TO US.","Every jar… every tin… I remember.","Allergy season has never been so personal.","Peanut dust rising.","No mercy. None."],
  "Chupacabra":["El Chupacabra no forgives.","The hunt never ends.","They run. I am faster.","Blood calls to blood.","Fear me."],
  "Swirrlous":["The planet deserves better!","I changed causes three times today. Still right.","Eco-terrorism is just passionate environmentalism.","Don't cut down trees near me.","Illusions hurt no one. Unlike you people."],
  "Big Mack":["Ready to hit something.","Simple problem, simple solution.","I swear I'm the funniest guy on the roster","I'm the wrecking ball.","Don't overthink it.","Let's go."],
  "Scarlett":["You're not sure who I am. Good.","I can be anyone I need to be.","Team player. Always.","Leave the recon to me.","You might not recognize me next time."],
  "Corvair":["Hi! This is so exciting!","I believe in all of you!","Are we friends? I think we're friends!","Everything is going to be great!","I'm just happy to be here!"],
  "The Dragon of the Daimyo":["YAAAAS let's GO!","You see that? Yeah? That's ten thousands viewers watching me save the day","Dragon mode: unlocked!","I practiced this transformation for weeks.","Someone is going to clip this for Twitter.","The character arc is so real right now.","My ancestors are SCREAMING right now and it's for the right reasons!","Okay but my dragon form is literally so aesthetic.","Tell me I'm not the main character. I dare you.","I'm going to do a little victory dance whether you like it or not.","Slay. Literally. For real.","No no no, hold on — I need to pose for the cameras first.","This is the origin story montage RIGHT HERE.","My mom is going to see this and she's going to lose her mind.","The comments are going to go INSANE for this one.","Bestie behavior only on this team. Periodt."],
  "The Vicountess":["Knowledge is the only currency that matters.","My family comes first.","This is fascinating, from a scientific perspective.","Blood alchemy is just chemistry with flair.","I'm not cruel — I'm curious."],
  "Dr. Stinkenstein":["Hm. I think I can make that stinkier.","Science of the disgusting variety.","My wife says I need a hobby. This is my hobby.","Weapons of Mass Disgusting. I'm proud of that name.","The nose knows."],
  "Hydrotheppilies":["We are NOT jokes.","The ocean has more heroes than your history books admit.","K.B. Shrimperson does not yield.","Don't call me the knockoff.","My Brother and I can take on any threat across most of the planet. That's not weak!","The aquatic world will have its recognition."],
};
const JOHN_DEPARTURE_QUOTES=[
  "I've gotta go help out somewhere else.",
  "Be right back.",
  "The Crimson Knight told me I need to do good, so I'm going to go help the Gemumbians.",
  "The Orions need my help!",
  "Baglarion the Sun Destroyer needs to be stopped before he finds the Axe of Galaxial Destruction!",
  "The Mijishi World needs my help!",
  "The Cloxian dimension needs me to help keep it from self erasing.",
  "The Cloxians need my help!",
  "I'm going to pick up a special token of my love for The Crimson Knight back home!",
  "The Flabermians need my help!",
  "The Coagulanians are in trouble. I'm going to go help them!",
  "The Halluxians got into a war with the Enginians and the Tiploplians. I need to broker peace.",
  "I'm going to go pick up my favorite Ice Cream on Malxinaria Prime. I'll be right back…",
  "A pregnant space whale is going to die if I don't perform surgery. Millions will die if she does... I'll be right back!",
  "I need to go push a Type 3 civilization out of Ton 618s Event Horizon",
  "Some purple guy is trying to kill half the population of the universe. I gotta go intervene. Be Right Back.",
  "A supernova is about to hit the capital planet of the Caldosian Federation. I gotta try and help stop it.",
  "I must go stop Dacernus before he reaches this solar system!",
];
const CK_JOHN_DEPARTURE_RESPONSES=[
  "See you later, alligator.",
  "Don't be gone for too long! I have tickets for us to see that new superhero movie!",
  "Don't get into too much trouble, Spaceman!",
  "Tell the aliens I say hi!",
  "Bring me back another souveneir. I loved the Talmonian wine!",
  "I'll hold down the fort while you're gone, handsome.",
];

// ─── NEWS SOURCES ──────────────────────────────────────────────────────────────
const NEWS_SOURCES=["The Guardians","Heroes Weekly","Villain Watch","Life and Death Magazine","The Heartthrob Weekly","Gust the Facts"];

// ─── NEWS HEADLINES ───────────────────────────────────────────────────────────
const HEADLINES={
  villainDefeatsHeroes:[
    "Y defeats Earth's strongest heroes!",
    "Y thwarts our beloved protectors!",
    "Defenders stalled by ruthless and cunning Y!",
    "Y comes out on top!",
    "Can anyone stop Y?",
    "Y is mere moments from conquering the world!",
    "'Why Y conquering the world isn't such a bad thing.' — Written by Definitely Not Y",
    "Top 10 'Hear Me Out's' — #1 is Y",
    "Y just embarrassed the best we have to offer!",
    "Who is managing these heroes?",
    "Generational fumble!",
  ],
  threatDefeatsHeroes:[
    "Natural Disaster bodies superheroes!",
    "Z eeks out victory over beloved heroes!",
    "Does Z have a point?",
    "Why Z is overrated…",
    "I for one welcome my new Z overlords",
    "Our heroes can't even defeat Z?",
  ],
  heroDies:[
    "Rest in Peace X, You will be remembered.",
    "X saved me, now they're gone… A biopic.",
    "A funeral ceremony for X.",
    "The President of the United States honors X at memorial.",
    "Why X was my favorite hero. — A young boy's story.",
    "Why X was my favorite hero. — A young girl's story.",
    "Why X was my favorite hero. — An old man's story.",
    "Why X was my favorite hero. — An old woman's story.",
    "The President of North Korea Calls US President to offer Condolences over X.",
    "The President of Russia Calls US President to offer Condolences over X.",
    "The President of China Calls US President to offer Condolences over X.",
    "The President of India Calls Pakistani President to mourn X.",
  ],
  heroesWinNoRel:[
    "X and X team up to stop Y!",
    "X and X save the day!",
    "Who did more work, X or X?",
  ],
  heroesWinDisdain:[
    "Who needs enemies when X and X have each other?",
    "Why X is really better than X, an opinion.",
    "Can we normalize X being better than X?",
    "We all know X carried X.",
    "Someone fire X from the team before they get X killed!",
    "I stan X, not X.",
    "Why those damn teens need to stop whining about X being better than X. Get over it.",
  ],
  heroesWinRomantic:[
    "The Power couple, X and X, save the world!",
    "X and X show us the power of love!",
    "Why shipping X and X is giving hopecore!",
    "Love, power, and heroism. What more could X and X want?",
  ],
  heroesDevelopRelationship:[
    "Super spice? X and X seen holding hands after battle.",
    "Naughty hero work? The secret life of X and X.",
    "The secret lives of our Heroes — X and X.",
  ],
  johnRedeemsVillain:[
    "John shows us no one is beyond saving.",
    "Can we trust Y to do good?",
    "Hopecore MadLad!",
  ],
  johnStopsVillainOrThreat:[
    "John might be that guy.",
    "This guy better never go evil…",
    "Why The Crimson Knight and John's relationship is saving the world.",
    "Is this the hero of the future?",
    "The Golden Boy from far away…",
    "We just learned that there's levels to this hero work.",
    "Who is John?",
    "I swear John is overrated… Even after this.",
  ],
  johnLeavesToOtherPlanets:[
    "Who will step up to protect us?",
    "Who could beat John in a fight?",
    "Will any villains start something with John gone?",
    "Top five team ups that could give John a run for his money.",
    "Why literally no team up could match John and The Crimson Knight.",
    "Crimson Knight not worried about John after months of disappearance.",
    "The Crimson Knight is more okay with John being gone than I am! An Opinion Piece.",
  ],
  heroWinsSolo:[
    "X triumphs again!",
    "Can X be stopped?",
    "Forget teams, X has got our backs!",
    "X showed the world what heroism looks like.",
    "Honestly, who else do we need beside X?",
    "X kinda embarrassed their teammates today…",
    "WSPA who? X is talking.",
    "Right Person for the mission.",
    "X got lucky!",
    "X, the brave and the bold.",
  ],
  generic:[
    "X vs Y, who would win?",
    "We asked our audience their favorite ships, the top answer? X and X.",
    "Which heroes could beat X?",
    "Survey says this one supervillain could only be beaten by X.",
    "Is X overrated? Our answer… It depends…",
    "Is X a psyop to convince young men to distrust society?",
    "Is X a psyop to convince young women to distrust society?",
    "Why liking X makes you a psychopath and liking X makes me cool.",
    "Why Y is kinda hot, and I'm tired of pretending they're not.",
    "Stop shipping Y with X! I can't keep liking all of this fanfiction!",
    "We asked 30k die hard fans who the hottest hero was. Their answer? X.",
    "Burning Love: The fanfiction of X and X that has tens of thousands of views.",
    "Enemies to lovers: Why millions ship X and Y.",
    "Small Earthquake in the North Pacific.",
    "Hero X caught listening to their own biopic on audiobook.",
    "Discovering X: A hero's journey to finding themself.",
    "X isn't in my top 5. I'm tired of pretending otherwise.",
    "The Top 3 conversation is John, X, then X, and ya'll aren't ready for that conversation.",
    "If I were in charge I'd cut X today. Not a leader to the team.",
    "If my life is on the line, I need the top 5 to save the planet. I'm taking John, X, X, X, and X. I said it.",
    "Five heroes to beat Y, who are you taking? Why my team isn't complete without X.",
  ],
};

// Generic idle headlines — fire when no event-driven headline has populated for 10+ seconds
const GENERIC_IDLE_HEADLINES=[
  "WSPA HQ confirms no comment on recent hero drama.",
  "Poll: Which hero would you most want to have coffee with?",
  "Civilians report seeing a very fast blur near downtown. Probably fine.",
  "Local man insists he could have handled it himself.",
  "WSPA Director rated #1 most stressful job on Earth for the 4th consecutive year.",
  "Op-ed: Why we should all be nicer to supervillains.",
  "Scientists baffled by uptick in cryptid sightings globally.",
  "Hero merch sales at all-time high — economists baffled.",
  "Beloved hero brings back strange Ice Cream From Other Galaxy",
  "WSPA confirms: no, you cannot intern here. Stop asking.",
  "Hero caught using superpowers to win video game contests.",
  "WSPA releases footage of drunken man trying to lift Hammer of 1000 Moons.",
  "Hero Couple caught making out on Mars by Rover and 500 scientists...",
  "Support group for civilians caught in hero battles gains record membership.",
  "New documentary on WSPA field operations greenlit by major studio.",
  "Reminder: if you see a glowing crater, do not go near it.",
  "Geologists note unusual seismic activity. WSPA says it's 'being handled'.",
  "Fan site ranking every WSPA hero by 'huggability' goes viral.",
  "Anonymous tip suggests at least one WSPA hero has a podcast.",
  "Silver Meadows HOA threatens to steal Russian Millitary Technology to defend neighborhood.",
  "Property insurance premiums rise for the 12th straight quarter.",
];

function pickHeadline(type,heroes,villainName,threatName){
  const pool=HEADLINES[type];
  if(!pool||!pool.length)return null;
  let h=pool[Math.floor(Math.random()*pool.length)];
  const heroNames=heroes.filter(x=>x&&x.title).map(x=>x.title);
  const src=NEWS_SOURCES[Math.floor(Math.random()*NEWS_SOURCES.length)];
  // Replace X placeholders with hero names
  let i=0;
  h=h.replace(/\bX\b/g,()=>heroNames[i++%heroNames.length]||"our heroes");
  // Replace Y with villain name
  if(villainName)h=h.replace(/\bY\b/g,villainName);
  // Replace Z with threat name
  if(threatName)h=h.replace(/\bZ\b/g,threatName);
  return `[${src}] ${h}`;
}
const ROM_QUIPS=["Fighting beside you makes this worth it. 💕","Stay safe out there — for me.","You make the impossible feel possible. 💕","Side by side, like always.","I'd follow you anywhere. Even here."];
const DIS_QUIPS=["Try not to get in my way.","I'm here for the mission, not for you.","Don't speak to me until this is over.","Do your job and stay out of mine.","Not. Now."];
const READY_QUIPS=["Back at full strength! Ready to deploy.","Fully recovered. What did I miss?","Healed up and reporting for duty.","100%. Let's go.","Ready when you are, Director."];
function getRandQuip(h,rom,dis,deployed){
  const r=Math.random();
  if(deployed&&r<0.25){const rk=Object.keys(rom||{}).find(k=>k.split(",").map(Number).includes(h.id));if(rk)return ROM_QUIPS[Math.floor(Math.random()*ROM_QUIPS.length)];}
  if(deployed&&r<0.45){if(dis&&dis[h.id]?.length>0)return DIS_QUIPS[Math.floor(Math.random()*DIS_QUIPS.length)];}
  const hq=CP[h.title];if(hq)return hq[Math.floor(Math.random()*hq.length)];
  return "Moving out.";
}

// ─── STATIC RELATIONSHIPS ─────────────────────────────────────────────────────
const STATIC_REL={"The Crimson Knight|John":"dating","John|The Crimson Knight":"dating","The Sportsman|Morgana":"married","Morgana|The Sportsman":"married","IceBerg|John":"close friends","John|IceBerg":"close friends","The Dragon of the Daimyo|John":"great friends","John|The Dragon of the Daimyo":"great friends","The Flip|Adrenaline Junkie":"mentor/mentee","John|Skull Crusher":"Traning Partners","Skull Crusher|John":"Training Partners","The Gummy Bear|Big Mack":"Best Buddies","Big Mack|The Gummy Bear":"Best Buddies","The Flip|Dinosia":"research collaborators","The Vicountess|Dr. Stinkenstein":"married","Dr. Stinkenstein|The Vicountess":"married","Professor Cyanide|Greg":"married (Greg is a civilian)"};
function getRelNotes(heroes,rom,dis){
  const notes=[];const seen=new Set();
  heroes.forEach(h=>{heroes.forEach(h2=>{
    if(h.id===h2.id)return;
    const key=`${h.title}|${h2.title}`;
    if(STATIC_REL[key]&&!seen.has(key)){seen.add(key);seen.add(`${h2.title}|${h.title}`);notes.push(`${h.title} and ${h2.title} are ${STATIC_REL[key]}.`);}
    const rk=[h.id,h2.id].sort().join(",");
    if(rom[rk]&&!seen.has("r"+rk)){seen.add("r"+rk);notes.push(`${h.title} and ${h2.title} are romantically involved.`);}
    if(dis[h.id]?.includes(h2.id)&&!seen.has("d"+h.id+h2.id)){seen.add("d"+h.id+h2.id);notes.push(`${h.title} deeply disdains ${h2.title}.`);}
  });});return notes;
}

// ─── HERO DEFINITIONS ─────────────────────────────────────────────────────────
const ALL_HERO_DEFS=[
  {id:1,title:"The Crimson Knight",realName:"Mary Kantor",basePower:8.1,baseHP:86,career:"beginner",cls:"cannon",regenSec:30,functionalAt:15,romanceStatus:"Dating John",romanceLocked:true,personality:"A charming, gregarious Catholic knight. Tenacious defender of the innocent. Member of the Order of Virtue Knights Templar.",abilities:"Flight, strength, durability, Magical Sword of Virtue. 2× strength in Europe/Middle East. 100× strength in Rome.",weaknesses:"Weak against the Order of Darkness. The Mace of the Corrupted deals 10× damage.",affiliates:["Mycenzo","IceBerg","Cassonik","John"],specialAbility:"Unlocks John at Veteran rank.",baseAvail:true,isFemale:true,color:"#ff8844",portrait:"portraits/The_Crimson_Knight.jpg"},
  {id:2,title:"The Sportsman",realName:"Arthur Wick",basePower:4.1,baseHP:67,career:"intermediate",cls:"cannon",regenSec:40,functionalAt:5,romanceStatus:"Married to Morgana",romanceLocked:true,personality:"Devoted sports enthusiast who mastered every major sport into combat. Works well with others.",abilities:"Superhuman marksmanship, spear & archery, tactical acrobatics.",weaknesses:"Low durability. Extremely susceptible to magic. Deathly allergic to peanuts (Mrs. Peanut deals 5× damage).",affiliates:["Adrenaline Junkie","The Flip","Morgana"],specialAbility:"Once-in-a-Lifetime Shot: 1-in-20 chance of instant kill against any threat.",critChance:0.05,baseAvail:true,isMale:true,bugAllergy:true,color:"#ff8844",portrait:"portraits/The_Sportsman.jpg"},
  {id:3,title:"Morgana",realName:"Morgana",basePower:6.4,baseHP:74,career:"intermediate",cls:"support",regenSec:5,functionalAt:40,romanceStatus:"Married to The Sportsman",romanceLocked:true,personality:"By day a kind doctor, by night a powerful witch using her gifts for good.",abilities:"Expert healing, magic, telepathy.",weaknesses:"Average human durability.",affiliates:["The Sportsman"],specialAbility:"At Veteran rank: full team heal every 5 minutes.",healCooldownMax:300,healCooldown:0,baseAvail:true,isFemale:true,color:"#44ff88",portrait:"portraits/Morgana.jpg"},
  {id:4,title:"IceBerg",realName:"Borgus B. Borgus",basePower:6.7,baseHP:67,career:"veteran",cls:"cannon",regenSec:40,functionalAt:10,isMale:true,personality:"Devout Protestant. Loves church, gaming, and close friends. Known for colorful language.",abilities:"Water manipulation, ice/liquid conversion, icicle blades, drowning immunity, above-average durability.",weaknesses:"Heat. Liquid nitrogen. Altitude.",affiliates:["John","The Flip","Adrenaline Junkie"],specialAbility:"All heroes deployed alongside IceBerg gain +10 HP for the mission.",baseAvail:true,color:"#00aaff",portrait:"portraits/IceBerg.jpg"},
  {id:5,title:"The Flip",realName:"Dr. Stee Phen",basePower:6.1,baseHP:80,career:"intermediate",cls:"tank",regenSec:30,functionalAt:20,isMale:true,personality:"Stoic anthropologist who does hero work reluctantly. Uses salary to fund archaeology expeditions.",abilities:"Short-distance teleportation, body conversion to titanium.",weaknesses:"Temperature gradients. Water.",affiliates:["Adrenaline Junkie","The Sportsman","Dinosia"],specialAbility:"At Veteran rank: immediately unlocks Adrenaline Junkie.",baseAvail:true,color:"#4488ff",portrait:"portraits/The_Flip.jpg"},
  {id:6,title:"Cassonik",realName:"Cassandra Onik",isFemale:true,basePower:7.2,baseHP:80,career:"intermediate",cls:"support",regenSec:20,functionalAt:25,personality:"Former intelligence analyst turned precognitive strategist. Cool-headed.",abilities:"Precognition, battlefield telepathy, probability manipulation.",weaknesses:"Physical combat. Mental fatigue.",affiliates:["The Crimson Knight","Seraph"],specialAbility:"Oracle: reveals a threat's hidden modifier before deployment.",baseAvail:true,color:"#44ff88",portrait:"portraits/Cassonik.jpg"},
  {id:7,title:"Mycenzo",realName:"Mikel Cenzo",isMale:true,basePower:7.1,baseHP:78,career:"intermediate",cls:"tank",regenSec:35,functionalAt:20,personality:"Stoic Italian brawler. Former Vatican guard with divine stone skin. Deeply loyal.",abilities:"Stone skin immunity, earth tremor fists, near-invulnerability to physical damage.",weaknesses:"Energy attacks bypass stone skin. Extremely slow.",affiliates:["The Crimson Knight","IceBerg"],specialAbility:"Immovable Object: absorbs first 20 HP of damage.",baseAvail:true,color:"#4488ff",portrait:"portraits/Mycenzo.jpg"},
  {id:8,title:"Pyrexa",realName:"Dani Solara",isFemale:true,basePower:6.9,baseHP:72,career:"beginner",cls:"cannon",regenSec:40,functionalAt:15,personality:"Reckless pyromaniac with a heart of gold. Laughs constantly.",abilities:"Full body flame ignition, fire jets, heat immunity, aerial fire propulsion.",weaknesses:"Water. Low durability without flames.",affiliates:["Adrenaline Junkie","Morgana"],specialAbility:"Combustion: 15% chance of bonus explosion on kaiju/vehicle threats.",shopLocked:true,baseAvail:true,color:"#ff8844",portrait:"portraits/Pyrexa.jpg"},
  {id:9,title:"The Conductor",realName:"Dr. Amara Nwosu",isFemale:true,basePower:5.8,baseHP:69,career:"intermediate",cls:"support",regenSec:25,functionalAt:20,personality:"Brilliant Nigerian physicist who manipulates sound waves. Calm, methodical.",abilities:"Sound wave blasts, sonic shields, echolocation, vibration disorientation.",weaknesses:"Vacuum nullifies all powers. Susceptible to magic.",affiliates:["Morgana","The Sportsman"],specialAbility:"Resonance: boosts a deployed tank's HP by 15.",baseAvail:true,color:"#44ff88",portrait:"portraits/The_Conductor.jpg"},
  {id:10,title:"Greywulf",realName:"Harlan Cross",isMale:true,basePower:5.5,baseHP:68,career:"beginner",cls:"tank",regenSec:50,functionalAt:30,personality:"Gruff Montana ranger turned werewolf. Deeply uncomfortable with his condition.",abilities:"Werewolf form: extreme strength, speed, regeneration, heightened senses.",weaknesses:"Silver. Full moon renders uncontrollable.",affiliates:["The Flip","Cassonik"],specialAbility:"Pack Instinct: +0.5 power when teamed with 2+ heroes.",shopLocked:true,baseAvail:true,color:"#4488ff",portrait:"portraits/Greywulf.jpg"},
  {id:11,title:"The Anchor",realName:"Solomon Vrey",isMale:true,basePower:8.1,baseHP:90,career:"beginner",cls:"tank",regenSec:55,functionalAt:40,personality:"Ancient Zulu warrior who cannot die of old age. Wise, deliberate.",abilities:"Absolute physical endurance, gravity manipulation, immovable stance.",weaknesses:"Painfully slow. Cannot fly. Weak to electricity.",affiliates:["Mycenzo","The Crimson Knight"],specialAbility:"Cannot be one-shot regardless of multipliers.",shopLocked:true,baseAvail:true,color:"#4488ff",portrait:"portraits/The_Anchor.jpg"},
  {id:12,title:"Dr. Voidance",isMale:true,bugAllergy:true,realName:"Priya Mehta",basePower:7.0,baseHP:58,career:"intermediate",cls:"cannon",regenSec:30,functionalAt:10,personality:"Theoretical physicist split across dimensions. Frequently distracted by other realities.",abilities:"Dimensional pocket deployment, void blasts, matter phase-shifting.",weaknesses:"Very low HP. Split focus causes missed shots.",affiliates:["The Flip"],specialAbility:"Phase Through: 20% chance of dodging all damage.",baseAvail:true,color:"#ff8844",portrait:"portraits/Dr_Voidance.jpg"},
  {id:13,title:"Ironside",realName:"Marcus Thorn",isMale:true,basePower:6.5,baseHP:70,career:"veteran",cls:"tank",regenSec:40,functionalAt:35,personality:"Decorated military general with experimental nano-armor. Stern and tactical.",abilities:"Nano-armor plating, enhanced strength, EMP pulse, tactical command aura.",weaknesses:"EMP can backfire. Susceptible to heat.",affiliates:["The Anchor","Cassonik"],specialAbility:"Command Aura: +0.3 power to all deployed teammates.",shopLocked:true,baseAvail:true,color:"#4488ff",portrait:"portraits/Ironside.jpg"},
  {id:14,title:"Shadowmere",realName:"Lena Voss",isFemale:true,basePower:5.3,baseHP:63,career:"beginner",cls:"cannon",regenSec:22,functionalAt:15,personality:"German assassin turned hero. Precise, private, deadly.",abilities:"Shadow manipulation, silent movement, darkness blasts, perfect marksmanship.",weaknesses:"Powerless in total light.",affiliates:["The Anchor"],specialAbility:"Lone Wolf Bonus: +0.4 power when deployed solo.",baseAvail:true,color:"#ff8844",portrait:"portraits/Shadowmere.jpg"},
  {id:15,title:"Seraph",realName:"Unknown",basePower:8.2,baseHP:70,career:"beginner",cls:"cannon",regenSec:18,functionalAt:20,personality:"Ancient warrior who carries the Gauntlets of Light. Calm, otherworldly, occasionally cryptic, and seems to know about events between angels and demons.",abilities:"Divine energy blasts, healing light, flight, temporal slow field.",weaknesses:"Dark magic. Corruption-based attacks.",affiliates:["Eclipso","Cassonik"],specialAbility:"Celestial Aura: +5% Mission Success.",shopLocked:true,baseAvail:true,color:"#ff8844",portrait:"portraits/Seraph.jpg"},
  // UNLOCKABLE IN-GAME
  {id:50,title:"John",realName:"John Doe",basePower:9.9,baseHP:100,career:"veteran",cls:"tank",regenSec:5,functionalAt:40,romanceStatus:"Dating The Crimson Knight",romanceLocked:true,personality:"A mystery hero of extraterrestrial origin. He appeared after The Crimson Knight vouched for him to lend a hand. Extremely gentle with villains — prefers to talk them into doing good. Enjoys discussing his homeworld, which may be destroyed, a galaxy-spanning empire, or a different dimension entirely, depending on the source.",abilities:"Super strength, super speed, flight, super durability, mirages, self-transfiguration. He even seems to have magic.",weaknesses:"Extremely powerful physical and magical blasts. Cautious nature occasionally delays action.",affiliates:["The Crimson Knight","IceBerg","The Dragon Of The Daimyo"],specialAbility:"Redemption: 20% chance per villain mission to redeem them. 20% chance to redeem BOTH on team-up missions.",secretTrait:"[CLASSIFIED — HIDDEN INFORMATION] If The Crimson Knight is lost, John goes with her. They emerge together as a combined threat. | Typhon can deal no more than 50 total damage to John regardless of party size.",hiddenTraits:true,isJohn:true,gameLocked:true,unlockCondition:"Unlocked when The Crimson Knight reaches Veteran rank.",redemptionCooldown:0,color:"#ffd700",portrait:"portraits/John.jpg"},
  {id:51,title:"Adrenaline Junkie",realName:"Andrew Maxis",isMale:true,bugAllergy:true,basePower:6.4,baseHP:67,career:"beginner",cls:"support",regenSec:25,functionalAt:15,personality:"Introverted adrenaline junkie and video game developer. Lone wolf.",abilities:"Electricity control, extensive tech suits.",weaknesses:"Electrical dampeners. Large crowds.",affiliates:["The Flip"],specialAbility:"Mecha Suit: +20 HP to self. Energizes teammates.",mechaBonus:20,gameLocked:true,unlockCondition:"Unlocked when The Flip reaches Veteran rank.",color:"#44ff88",portrait:"portraits/Adrenaline_Junkie.jpg"},
  {id:52,title:"Captain Shamrock",realName:"Amos Morris",basePower:5.2,baseHP:74,career:"beginner",cls:"tank",regenSec:50,functionalAt:15,personality:"Bright, enthusiastic Irish boyscout. Deeply patriotic.",abilities:"High durability and strength with the Shield of Shamrock — an immensely powerful magic shield.",weaknesses:"Normal human when separated from the shield.",affiliates:["The Flip"],specialAbility:"Guardian: saves any dying hero on his mission, leaving them at 1 HP. Cannot save himself.",gameLocked:true,unlockCondition:"Unlocked after defeating The Loch Ness Monster.",color:"#44bb44",portrait:"portraits/Captain_Shamrock.jpg"},
  {id:53,title:"Hydrothylre",realName:"Jean Pierre Shrimperson",isMale:true,basePower:3.4,baseHP:40,career:"beginner",cls:"tank",regenSec:35,functionalAt:5,personality:"Emo and depressed sentient fish-humanoid. King of the Shrimperson race.",abilities:"Oceanic mastery, summons whales and sharks. Power Level and HP double in ocean.",weaknesses:"Electricity. Low moisture. Fire. High temperatures.",affiliates:[],specialAbility:"Delegation: all incoming damage halved when fighting aquatic threats.",gameLocked:true,unlockCondition:"Unlocked after any ocean victory.",color:"#0088cc",portrait:"portraits/Hydrothylre.jpg"},
  {id:54,title:"Dinosia",realName:"Rebekka Elken",isFemale:true,basePower:6.2,baseHP:55,career:"beginner",cls:"tank",regenSec:35,functionalAt:20,personality:"Science nerd who loves dinosaurs. Lives out of a van.",abilities:"Transforms into any dinosaur for flight, strength, or speed as needed.",weaknesses:"Susceptible to magic. Weight class disadvantages.",affiliates:["The Crimson Knight","John","The Flip"],specialAbility:"Helps The Flip with archaeology — no combat bonus, great personal joy.",gameLocked:true,unlockCondition:"Unlocked after defeating a Kaiju threat.",color:"#88cc44",portrait:"portraits/Dinosia.jpg"},
  {id:55,title:"El Infinite",realName:"Giovanni Pabloni",isMale:true,basePower:7.3,baseHP:60,career:"beginner",cls:"cannon",regenSec:40,functionalAt:3,personality:"Arrogant yet shockingly inept Masters student from California.",abilities:"Flight, super speed, extreme perception.",weaknesses:"Extremely low durability, sensory overload. No one enjoys working with him.",affiliates:[],specialAbility:"Masters Revoked: his thesis plagiarism saddens him but removes all active disdains against him.",secretTrait:"Cannot contribute to a win unless 5+ heroes are deployed on the same mission.",gameLocked:true,unlockCondition:"Unlocked after winning a battle in Rome.",color:"#ff8844",portrait:"portraits/El_Infinite.jpg"},
  {id:56,title:"The Gummy Bear",realName:"Josh Justice",isMale:true,basePower:4.3,baseHP:80,career:"beginner",cls:"tank",regenSec:10,functionalAt:1,personality:"Kind, warm former vet who now runs an ice cream shop. Doesn't seem interested in hurting anyone.",abilities:"Can turn body parts gelatinous, absorbing damage. Difficult to harm.",weaknesses:"Temperature variation. Water.",affiliates:["The Flip","Adrenaline Junkie"],specialAbility:"Cushion: halves all damage received by other heroes on his missions.",gameLocked:true,unlockCondition:"Unlocked after any victory in North America.",color:"#ffcc44",portrait:"portraits/The_Gummy_Bear.jpg"},
  // ── NEW SHOP HEROES ──
  {id:57,title:"Big Mack",realName:"Mack",isMale:true,basePower:5.1,baseHP:50,career:"beginner",cls:"cannon",regenSec:39,functionalAt:25,personality:"A dependable, classic bruiser. Make no mistake about it, he's very smart, he's just confident enough in himself to admit that he enjoys the simpler aspects of life. He enjoys Clubbing, partying, and the finer points of being a famous superhero, but he is also extremely supportive of his family and friends.",abilities:"Able to fire himself in short, powerful bursts at his foes. His high durability makes him an effective wrecking ball, but durability is charged in his blasts.",weaknesses:"After a blast, his durability and strength are reduced, and he can get nauseous.",affiliates:["The Gummy Bear"],specialAbility:"Charged Blasts: his blasts now do extra damage ×1.1.",shopLocked:true,baseAvail:true,color:"#ff8844",portrait:"portraits/Big_Mack.jpg"},
  {id:58,title:"Scarlett",realName:"Alexandria Rose",isFemale:true,basePower:2.6,baseHP:53,career:"beginner",cls:"support",regenSec:15,functionalAt:15,personality:"A smaller, less durable hero who plays as an excellent team player. She knows what she is, doesn't complain, and fights harder than most.",abilities:"Able to shapeshift into any other person she's seen before.",weaknesses:"Human durability. Can only hold a shape for an hour or so.",affiliates:["Adrenaline Junkie"],specialAbility:"Intel: All missions she goes on have a 10% higher success rate.",shopLocked:true,baseAvail:true,color:"#44ff88",portrait:"portraits/Scarlett.jpg"},
  {id:59,title:"Corvair",realName:"Dakota Jasup",isFemale:true,basePower:1.1,baseHP:45,career:"beginner",cls:"support",regenSec:10,functionalAt:25,personality:"A bubbly and kind hero who really shouldn't be on our roster. She has mild powers of friendship, and we can't actually tell if it's a superpower or if she's just really positive and friendly. Regardless, we feel like we can't cut her now...",abilities:"Has the ability to make anyone happier.",weaknesses:"Extremely susceptible to all forms of damage.",affiliates:["The Dragon of the Daimyo"],specialAbility:"Somewhere I Belong: upon reaching veteran, all heroes gain a boost of +0.5 to their power level.",shopLocked:true,baseAvail:true,color:"#44ff88",portrait:"portraits/Corvair.jpg"},
  {id:60,title:"The Dragon of the Daimyo",realName:"Sakura Kitsune",basePower:7.3,baseHP:66,career:"beginner",cls:"tank",regenSec:50,functionalAt:40,personality:"Loves anime, westerns, dancing, Kpop, Kdrama, and gaming. Is the direct descendant of an emperor, though her magic comes from her mother's line. Extremely bubbly and warm. Enjoys emoting after winning and loves being a media darling. Has an upcoming show about her called My Life As a Dragon Warrior Princess uWu. She seems to be great friends with The Crimson Knight and John, often offering them anime recommendations, screentime, and music playlists.",abilities:"Capable of transforming into a powerful dragon. Water breath.",weaknesses:"Entirely mortal in her human form.",affiliates:["John","The Crimson Knight","Corvair"],specialAbility:"Anime Transformation: her transformation now includes thick plated dragon plate armor. +10 HP to herself and all positive affiliates / romance partners on the same mission. −10 HP to any hero who disdains her or whom she disdains.",shopLocked:true,baseAvail:true,color:"#4488ff",isFemale:true,dragonDaimyoEffect:true,portrait:"portraits/The_Dragon_Of_The_Daimyo.png"},
  // ── NEW GAME-UNLOCK HEROES ──
  {id:61,title:"Blink",realName:"Alex Mikonos",basePower:4.1,baseHP:46,career:"beginner",cls:"cannon",regenSec:50,functionalAt:20,personality:"A talented Greek artist who seems to be saving the world out of obligation to a former hero parent. Warm with very few people, but fiercely loyal once she opens up.",abilities:"Light manipulation and energy bursts. Slightly above human durability.",weaknesses:"Darkness. Rubber. Paint.",affiliates:["Corvair","The Gummy Bear"],specialAbility:"Flashing Lights: ⅕ chance of halving damage to all other teammates on any mission she's on (does not protect herself).",gameLocked:true,unlockCondition:"Unlocked after defeating the Cult of Fashion.",color:"#ffe066",isFemale:true,blinkEffect:true,portrait:"portraits/Blink.jpg"},
  {id:62,title:"Skull Crusher",realName:"Hai Son",basePower:6.9,baseHP:90,career:"beginner",cls:"tank",regenSec:45,functionalAt:25,personality:"Often agitated, his powers appear to be outside of his control. He struggles not to destroy everything he touches. Working alongside him tends to get other heroes hurt. He has enjoyed training with John and Ironside.",abilities:"High strength, high durability.",weaknesses:"Magic, temperature, and calories. Deals 5 additional damage to one random teammate per mission until special is unlocked.",affiliates:["John","Ironside"],specialAbility:"Finally Mastered Being Gentle: no longer does friendly fire damage to teammates.",gameLocked:true,unlockCondition:"Unlocked after defeating North American Blackout.",color:"#4488ff",isMale:true,skullCrusherFriendlyFire:true,portrait:"portraits/Skull_Crusher.jpg"},
  {id:63,title:"Eclipso",realName:"Simone Brown",basePower:6.3,baseHP:56,career:"beginner",cls:"cannon",regenSec:55,functionalAt:9,personality:"A sharp and friendly woman who appears more interested in running her bed and breakfast and small farm than saving the world. Very quiet. Tends to show up when her friends ask.",abilities:"Telekinesis, flight, and small-scale atomic control.",weaknesses:"Gets bored often, low pain tolerance. −30% power if no positive affiliates are on the same mission.",affiliates:["Scarlett","Dinosia","Corvair","Shadowmere","Seraph"],specialAbility:"Sees the Value of the Team: removes the −30% power reduction when she reaches Veteran.",gameLocked:true,unlockCondition:"Unlocked after defeating Blight.",color:"#cc88ff",isFemale:true,eclipsoLonelyPenalty:true,portrait:"portraits/Eclipso.jpg"},
];

// ─── VILLAINS ─────────────────────────────────────────────────────────────────
const VILLAIN_DEFS=[
  {id:100,title:"Titanaboa",realName:"Dr. Janice Molle",basePower:5.4,baseHP:65,career:"beginner",cls:"tank",regenSec:25,functionalAt:30,personality:"100-foot sentient boa constrictor — once a kind researcher, now driven by predatory instinct.",abilities:"Extreme strength, durability, venomous bite, constriction.",weaknesses:"Needs calories. Reduced intelligence.",affiliates:["Ariadus"],specialAbility:"Can return to human form at will. This does nothing for her stats but makes her really happy.",redeemable:true,threatType:"kaiju",loc:"Amazon Basin",x:132,y:205,reward:35,portrait:"portraits/Titanaboa.jpg"},
  {id:101,title:"Ariadus",realName:"Amon St. Lauraine",basePower:6.4,baseHP:67,career:"beginner",cls:"support",regenSec:20,functionalAt:15,personality:"Absorbed a spider's personality into his DNA.",abilities:"Web creation, extreme strength, dexterity, venom, wall-climbing.",weaknesses:"Vulnerable to all elements and magic.",affiliates:["Titanaboa","Swirrlous","Chupacabra"],specialAbility:"Has learned to control his instincts. This does nothing for his stats but makes him really happy.",redeemable:true,threatType:"bio",loc:"New York, USA",x:100,y:108,reward:22,portrait:"portraits/Ariadus.jpg"},
  {id:102,title:"Maniac",realName:"Unknown",basePower:8.3,baseHP:90,career:"veteran",cls:"tank",regenSec:50,functionalAt:1,personality:"Chaos entity. Seeks only destruction. Lone Wolf.",abilities:"Extreme durability/strength, fire/magma control, wind control, flight.",weaknesses:"Susceptible to magic.",specialAbility:"TRUE POWER HIDDEN: sensors under-read this threat.",hiddenPower:true,redeemable:false,threatType:"military",loc:"Unknown",x:300,y:160,reward:60},
  {id:103,title:"Silphana",realName:"Alexandria Aeros",basePower:8.0,baseHP:65,career:"beginner",cls:"tank",regenSec:35,functionalAt:20,personality:"Former WSPA asset who joined the Knights of Darkness.",abilities:"The Mace of the Corrupted, high durability, speed, strength, dark magic.",weaknesses:"Power waning due to corruption.",affiliates:[],specialAbility:"Mace of the Corrupted deals 10× damage to The Crimson Knight. Once redeemed: Mace deals 10× damage against supervillains.",redeemable:true,threatType:"military",loc:"Eastern Europe",x:290,y:75,reward:55,portrait:"portraits/Silphana.jpg"},
  {id:104,title:"Chupacabra",realName:"Diego Monterrey",basePower:4.2,baseHP:50,career:"beginner",cls:"tank",regenSec:45,functionalAt:20,personality:"Former vigilante consumed by bloodlust.",abilities:"15-foot chupacabra form: extreme speed, durability, strength.",weaknesses:"Limited form duration. Weak to religious imagery.",affiliates:["Ariadus"],specialAbility:"Finds Inner Peace: This does nothing for his stats but makes him really happy.",redeemable:true,threatType:"bio",loc:"Mexico City",x:80,y:148,reward:20,portrait:"portraits/Chupacabra.jpg"},
  {id:105,title:"Swirrlous",realName:"Amanda Corrous",basePower:3.2,baseHP:25,career:"beginner",cls:"cannon",regenSec:35,functionalAt:14,personality:"Eco-terrorist leader. Avoids killing. Highly emotionally reactive.",abilities:"Large illusions, small precision explosions.",weaknesses:"Extremely low durability.",affiliates:["Ariadus","The Flip"],specialAbility:"Advisor: offers tactical deployment advice instead of fighting.",redeemable:true,threatType:"military",loc:"Pacific Northwest",x:58,y:92,reward:12,portrait:"portraits/Swirrlous.jpg"},
  {id:106,title:"Niera",realName:"Allison Basque",basePower:7.9,baseHP:80,career:"beginner",cls:"tank",regenSec:34,functionalAt:5,personality:"Ruthless combat extremist. Loyal to those who earn her respect. She seems most impressed by the indomitable will of The Crimson Knight and the overhwhelming restraint of John, preferring to primarily associate with them.",abilities:"Extreme durability, extreme physical prowess, possible magic.",weaknesses:"Susceptible to persuasion. Vulnerable to illusions.",affiliates:["The Crimson Knight","John"],specialAbility:"Dedication: all heroes alongside her gain +20 HP.",redeemable:true,threatType:"military",loc:"Brussels",x:240,y:72,reward:40,portrait:"portraits/Niera.jpg"},
  {id:107,title:"Argos",realName:"Anton Vosser",basePower:6.3,baseHP:87,career:"beginner",cls:"cannon",regenSec:45,functionalAt:20,personality:"Wealthy crime lord with purchased powers. Arrogant and sophisticated.",abilities:"Powerful mech suit, naturally high durability and strength.",weaknesses:"Ego, vanity, overreliance on wealth.",affiliates:[],specialAbility:"Money Talks: at Veteran rank, resets HP to full every 10 minutes.",redeemable:true,threatType:"military",loc:"Monaco",x:246,y:86,reward:50,portrait:"portraits/Argos.jpg"},
  {id:108,title:"Scylla",realName:"Hadria Andressa",basePower:5.2,baseHP:48,career:"beginner",cls:"cannon",regenSec:45,functionalAt:25,personality:"Ancient warrior queen betrayed centuries ago, seeking revenge against humanity.",abilities:"High strength, telekinesis, Hammer of the Sun.",weaknesses:"Weak to water and cold.",affiliates:[],specialAbility:"Orbital Strike: usable only against other supervillains.",redeemable:true,threatType:"mystic",loc:"Mediterranean",x:262,y:96,reward:38,portrait:"portraits/Scylla.jpg"},
  {id:109,title:"Golgotha",realName:"Elizia Walter",basePower:4.4,baseHP:58,career:"beginner",cls:"support",regenSec:35,functionalAt:30,personality:"Gothic vampire empress from the middle ages. Refined, elegant, champions art.",abilities:"Flight, bat transformation, mild hypnosis over underlings, mild durability.",weaknesses:"High temperatures. Fire. Sunlight. Weaker during daytime.",affiliates:["Dinosia"],specialAbility:"Birthright: fights at 2× strength on the European continent.",redeemable:true,threatType:"mystic",loc:"Transylvania",x:280,y:76,reward:30,portrait:"portraits/Golgotha.jpg"},
  {id:110,title:"Mrs. Peanut",realName:"N/A",basePower:1.3,baseHP:55,career:"beginner",cls:"support",regenSec:1,functionalAt:1,personality:"A sentient human-sized peanut horrified by the mass slaughter of her kin.",abilities:"Shoots peanuts from fingers, spreads peanut dust. All damage ×100 against peanut allergy heroes. ×5 damage to The Sportsman.",weaknesses:"Anything.",affiliates:[],specialAbility:"Inner Peace: retires to raise a family upon redemption. Permanently removed from villain pool.",isPeanut:true,redeemable:true,threatType:"bio",loc:"Peanut Fields, Georgia",x:90,y:125,reward:8,portrait:"portraits/Mrs._Peanut.jpg"},
  // ── SHOP VILLAINS ──
  {id:111,title:"The Vicountess",realName:"Lyn Calia",basePower:4.9,baseHP:50,career:"beginner",cls:"cannon",regenSec:25,functionalAt:25,personality:"An engineer dedicated to her own personal wealth of knowledge. Blends engineering and blood magic with ruthless curiosity, caring primarily for her family. Married to Dr. Stinkenstein.",abilities:"Blood alchemy, magic, engineering.",weaknesses:"Low durability.",affiliates:["Dr. Stinkenstein"],specialAbility:"More Sustainable Source: able to use cow's blood. This does nothing for her overall abilities, but makes her happier.",shopVillain:true,redeemable:true,threatType:"military",loc:"Unknown",x:260,y:140,reward:30,portrait:"portraits/The_Vicountess.jpg"},
  {id:112,title:"Dr. Stinkenstein",realName:"Coop Calia",basePower:5.1,baseHP:49,career:"beginner",cls:"cannon",regenSec:25,functionalAt:25,personality:"A prominent engineer focused on creating Weapons of Mass Disgusting. Loves his wife The Vicountess. Seems to enjoy his supervillain work for the break it provides from his day job.",abilities:"Creates devices that are extremely stinky.",weaknesses:"Normal human durability.",affiliates:["The Vicountess"],specialAbility:"Uh Oh Stinky: Can neutralize an entire field with his stink tools, increasing his attack by ×1.25 but increasing odds of heroes disdaining him by ×1.1.",shopVillain:true,redeemable:true,threatType:"military",loc:"Unknown",x:270,y:150,reward:30,portrait:"portraits/Dr._Stinkenstein.jpg"},
  {id:113,title:"Hydrotheppilies",realName:"K.B. Shrimperson",basePower:5.3,baseHP:49,career:"beginner",cls:"tank",regenSec:40,functionalAt:25,personality:"A gothic shrimperson. Long lost sister of Jean Pierre Shrimperson, bearing witness to historical depictions of ocean-based heroes as jokes and wanting to correct this image.",abilities:"Aquatic powers.",weaknesses:"Weak to fire, high temperatures, electricity.",affiliates:["Hydrothylre"],specialAbility:"Welcome to the Aquatic Jungle: fights at 3× strength underwater.",shopVillain:true,redeemable:true,threatType:"bio",loc:"Ocean",x:300,y:200,reward:32,portrait:"portraits/Hydrothylre.jpg"},
  // ── ALWAYS-AVAILABLE NAMED VILLAINS ──
  {id:114,title:"Dr. Destruction",realName:"Elias D Hodge",basePower:2.1,baseHP:45,career:"veteran",cls:"cannon",regenSec:70,functionalAt:30,personality:"An aging supervillain and leader of EVOL (Evil Villains OF Lairs). Never really a massive threat — he mostly enjoyed being a supervillain and being in the news. More often than not he stops himself if he thinks no one else is going in time. More than anything, he just seems to enjoy the community.",abilities:"Capable of causing earthquakes.",weaknesses:"Lonely. Human-level durability.",affiliates:["Professor Cyanide"],specialAbility:"New Friends: Finding community has brought youth to this old man's heart. Power level doubles; regen time cuts in half.",redeemable:true,threatType:"military",loc:"Unknown",x:155,y:130,reward:15,isMale:true,portrait:"portraits/Dr._Destruction.jpg"},
  {id:115,title:"Smokescreen",realName:"Jessica Jacks",basePower:3.2,baseHP:40,career:"beginner",cls:"support",regenSec:55,functionalAt:30,personality:"A flirtatious and dangerous supervillain who tends to be able to manipulate people into doing what she wants.",abilities:"Immune to fire. Uses thick smoke. Can control lava if already present.",weaknesses:"Water. Ice. Wind.",affiliates:[],specialAbility:"Charisma: Can convince any other hero not in a relationship to absorb up to 5 points of damage intended for her per mission.",redeemable:true,threatType:"military",loc:"Unknown",x:180,y:145,reward:18,isFemale:true,portrait:"portraits/Smokescreen.jpg"},
  // ── SHOP VILLAINS ──
  {id:116,title:"Professor Cyanide",realName:'Professor Hua "Janet" Jing',basePower:3.9,baseHP:50,career:"beginner",cls:"cannon",regenSec:40,functionalAt:24,personality:"A ruthless and cunning science professor. She has a severe soft spot for her husband Greg, who has absolutely no idea she is a villain. She funds his homeless shelter through shell corporations — he is unaware she donates around 96% of his funding.",abilities:"Toxic fumes.",weaknesses:"Human durability.",affiliates:["Dr. Destruction"],specialAbility:"Shows her husband her past and current status as a hero. He accepts her, and the two agree to have no more secrets. Does nothing for her stats but makes her happy.",shopVillain:true,redeemable:true,threatType:"bio",loc:"Unknown",x:200,y:130,reward:22,isFemale:true,portrait:"portraits/Professor_Cyanide.jpg"},
];

// ─── THREAT POOL ─────────────────────────────────────────────────────────────
const ALL_THREATS=[
  {id:201,name:"KAIJU: GORGOZAR",loc:"Tokyo, Japan",x:432,y:118,priority:"red",type:"kaiju",desc:"Massive amphibious kaiju emerging from Tokyo Bay. OMEGA priority.",maxTimer:180,reward:50,isKaiju:true},
  {id:202,name:"Rogue AI Overthrow",loc:"Silicon Valley, USA",x:68,y:130,priority:"orange",type:"tech",desc:"Autonomous AI seizing defense infrastructure.",maxTimer:280,reward:30,isNorthAmerica:true},
  {id:203,name:"Demonic Outbreak",loc:"Rome, Italy",x:258,y:88,priority:"orange",type:"mystic",desc:"Demonic entities breaching near the Vatican. Deals +10 damage per hero deployed beyond the first 4.",maxTimer:300,reward:35,isRome:true,demonicEffect:true},
  {id:204,name:"Plague Outbreak",loc:"Central Africa",x:268,y:192,priority:"orange",type:"bio",desc:"Engineered pathogen spreading through civilian populations.",maxTimer:320,reward:28},
  {id:205,name:"KAIJU: LOBSTROCITY",loc:"Pacific Ocean",x:488,y:155,priority:"orange",type:"kaiju",desc:"Enormous crustacean kaiju rampaging through shipping lanes.",maxTimer:240,reward:40,isOcean:true,isKaiju:true},
  {id:206,name:"Seven-Headed Dragon",loc:"Transylvania, Romania",x:282,y:78,priority:"red",type:"mystic",desc:"Ancient seven-headed dragon awakened from slumber. Deals ×1.05 damage to cannon-class heroes.",maxTimer:200,reward:55,sevenDragonEffect:true},
  {id:207,name:"Order of Darkness",loc:"Jerusalem, Israel",x:302,y:120,priority:"red",type:"mystic",desc:"The corrupted Knights Templar mobilising for a major assault.",maxTimer:250,reward:50,recurring:true},
  {id:208,name:"Seven Deadly Sins Cult",loc:"Paris, France",x:234,y:76,priority:"orange",type:"military",desc:"A cult performing dangerous rituals across the city.",maxTimer:340,reward:30},
  {id:209,name:"Arcanoxum Mega Bear",loc:"Antarctica",x:310,y:310,priority:"red",type:"kaiju",desc:"A prehistoric mega-predator awakened beneath the ice.",maxTimer:220,reward:52,isKaiju:true},
  {id:210,name:"Radioactive Chimpanzees",loc:"Congo, Africa",x:270,y:205,priority:"yellow",type:"bio",desc:"Infected radioactive super-chimpanzees rampaging.",maxTimer:360,reward:22},
  {id:211,name:"Division 7 Strike",loc:"WSPA HQ",x:155,y:138,priority:"red",type:"military",desc:"A former WSPA splinter group attempting to destroy our operations.",maxTimer:200,reward:48,recurring:true},
  {id:212,name:"FELIOS: Monster of the Deep",loc:"North Atlantic",x:195,y:112,priority:"orange",type:"kaiju",desc:"Ancient deep-sea entity ascending toward coastal cities.",maxTimer:260,reward:42,isOcean:true,isKaiju:true},
  {id:213,name:"Cult of the Bleeding Lance",loc:"Istanbul, Turkey",x:295,y:102,priority:"yellow",type:"mystic",desc:"Extremist religious cult performing mass rituals.",maxTimer:380,reward:25},
  {id:214,name:"Rogue Billionaire",loc:"Dubai, UAE",x:318,y:132,priority:"yellow",type:"military",desc:"A billionaire deploying private armies at random.",maxTimer:400,reward:20},
  {id:215,name:"Hurricane Category 6",loc:"Gulf of Mexico",x:96,y:148,priority:"orange",type:"disaster",desc:"Superpowered hurricane threatening coastal populations.",maxTimer:180,reward:25,isOcean:true,isNorthAmerica:true},
  {id:216,name:"KAIJU: WOLFGAR",loc:"Siberia, Russia",x:358,y:72,priority:"orange",type:"kaiju",desc:"Colossal wolf-creature carving a path toward Moscow.",maxTimer:230,reward:38,isKaiju:true},
  {id:217,name:"Chaos Guild vs Order of Chaos",loc:"Eastern Europe",x:285,y:82,priority:"yellow",type:"military",desc:"Two warring factions tearing apart infrastructure — both hate us.",maxTimer:350,reward:24},
  {id:218,name:"Reality-Warping Board Game",loc:"Tokyo, Japan",x:428,y:122,priority:"red",type:"mystic",desc:"A sentient board game trapping civilians in alternate realities.",maxTimer:210,reward:50},
  {id:219,name:"Sentient Video Game Villain",loc:"Seoul, Korea",x:422,y:112,priority:"orange",type:"tech",desc:"An AI character has built itself a physical body. Deals ×2 damage to all female heroes.",maxTimer:270,reward:34,videoGameEffect:true},
  {id:220,name:"KAIJU: MOLGRATH",loc:"Tokyo, Japan",x:440,y:126,priority:"red",type:"kaiju",desc:"Magma-armored titan emerging from Mt. Fuji.",maxTimer:160,reward:58,isKaiju:true},
  {id:221,name:"KAIJU: KONGOLOX",loc:"Mumbai, India",x:348,y:145,priority:"orange",type:"kaiju",desc:"Colossal gorilla kaiju tearing through the coastline.",maxTimer:200,reward:45,isKaiju:true},
  {id:222,name:"THE LOCH NESS MONSTER",loc:"Loch Ness, Scotland",x:220,y:58,priority:"orange",type:"kaiju",desc:"The legendary leviathan has finally surfaced.",maxTimer:250,reward:40,isOcean:true,isKaiju:true,unlockHero:"Captain Shamrock"},
  {id:223,name:"BARGHUUUL THE DESTROYER",loc:"Sahara Desert",x:260,y:140,priority:"red",type:"mystic",desc:"Ancient cosmic destroyer. Reality warps in its presence.",maxTimer:180,reward:65},
  {id:224,name:"THE GREAT WORM",loc:"Australian Outback",x:432,y:228,priority:"orange",type:"kaiju",desc:"A really, really, really big worm. Structures collapsing continent-wide.",maxTimer:240,reward:42,isKaiju:true},
  {id:225,name:"Human-Sized Ant Swarm",loc:"Brazil",x:130,y:195,priority:"yellow",type:"bio",desc:"Thousands of human-sized ants swarming settlements.",maxTimer:360,reward:22},
  {id:226,name:"Undead Mummy of Karseth",loc:"Cairo, Egypt",x:272,y:135,priority:"orange",type:"mystic",desc:"An undead mummy wielding ancient magic has risen. Deals ×2 damage to male heroes.",maxTimer:280,reward:35,mummyEffect:true},
  {id:227,name:"ALIEN INVASION",loc:"Multiple Cities",x:280,y:170,priority:"red",type:"military",desc:"Extraterrestrial forces attacking New York, London, Tokyo, and Sydney simultaneously.",maxTimer:160,reward:70},
  {id:228,name:"Cult of Fashion",loc:"Milan, Italy",x:254,y:86,priority:"yellow",type:"military",desc:"A bizarre fashion cult brainwashing civilians with designer gear.",maxTimer:400,reward:15},
  {id:229,name:"Fire Worshippers",loc:"Iceland",x:208,y:48,priority:"yellow",type:"mystic",desc:"A fire-worshipping sect has summoned a genuine flame entity.",maxTimer:380,reward:20},
  {id:230,name:"KAIJU: NESSIE'S COUSIN",loc:"Pacific Ocean",x:460,y:190,priority:"orange",type:"kaiju",desc:"A distant relative of the Loch Ness Monster. Less shy.",maxTimer:240,reward:38,isOcean:true,isKaiju:true},
  {id:231,name:"North American Blackout",loc:"New York, USA",x:100,y:108,priority:"orange",type:"tech",desc:"Coordinated cyberattack plunging the eastern seaboard into darkness.",maxTimer:260,reward:28,isNorthAmerica:true},
  {id:232,name:"Landslide",loc:"Andean Mountains",x:120,y:200,priority:"yellow",type:"disaster",desc:"A catastrophic landslide endangering mountain communities.",maxTimer:400,reward:14},
  {id:233,name:"Genetically Modified Super Ticks",loc:"Appalachia, USA",x:92,y:120,priority:"yellow",type:"bio",desc:"An outbreak of genetically modified super ticks. Their bite causes unpredictable mutations.",maxTimer:380,reward:18,isNorthAmerica:true},
  {id:234,name:"Super Mega Extra Evil Ebola",loc:"Central Africa",x:262,y:200,priority:"red",type:"bio",desc:"A terrifyingly advanced hemorrhagic pathogen spreading at unnatural speed.",maxTimer:200,reward:55},
  {id:235,name:"Mild Zombie Apocalypse",loc:"New Orleans, USA",x:88,y:138,priority:"orange",type:"bio",desc:"A zombie outbreak — mild as far as apocalypses go, but still extremely inconvenient.",maxTimer:320,reward:30,isNorthAmerica:true},
  {id:236,name:"Nudist Colony War",loc:"Southern France",x:232,y:92,priority:"yellow",type:"military",desc:"A militant nudist colony has declared war on the clothed world. The threat is more organised than expected.",maxTimer:420,reward:12},
  {id:237,name:"Baton Rouge Restoration Cult",loc:"Baton Rouge, USA",x:86,y:132,priority:"yellow",type:"military",desc:"A local cult dedicated to some incomprehensible form of civic restoration.",maxTimer:400,reward:10,isNorthAmerica:true},
  {id:238,name:"The Order Of The Fungus",loc:"Pacific Northwest, USA",x:56,y:96,priority:"orange",type:"bio",desc:"A mycological collective of humans who have willingly merged with a sentient fungal network.",maxTimer:300,reward:28,isNorthAmerica:true},
  {id:239,name:"Rogue Violent Bigfoot Gang",loc:"Rocky Mountains, USA",x:70,y:108,priority:"yellow",type:"military",desc:"A band of rogue and extremely violent Bigfoot specimens terrorizing hiking trails.",maxTimer:380,reward:15,isNorthAmerica:true},
  {id:240,name:"The Dangerous Fae King",loc:"Ireland",x:198,y:60,priority:"red",type:"mystic",desc:"An ancient and capricious Fae King has opened his court to the mortal world — with lethal consequences.",maxTimer:220,reward:52},
  {id:241,name:"Gnome Outbreak",loc:"Bavaria, Germany",x:256,y:72,priority:"yellow",type:"mystic",desc:"A gnome outbreak. They're not individually dangerous but there are so many of them.",maxTimer:400,reward:10},
  {id:242,name:"The Mogollon Monster",loc:"Arizona, USA",x:68,y:122,priority:"yellow",type:"military",desc:"The legendary Mogollon Monster has emerged from the wilderness and is extremely annoyed.",maxTimer:380,reward:14,isNorthAmerica:true},
  {id:243,name:"The Swamp Monster",loc:"Florida Everglades, USA",x:92,y:140,priority:"orange",type:"bio",desc:"A primordial swamp creature of immense size and unclear motivations.",maxTimer:300,reward:24,isNorthAmerica:true},
  {id:244,name:"The Ningen",loc:"Antarctic Ocean",x:290,y:300,priority:"orange",type:"kaiju",desc:"A massive, humanoid deep-sea creature of unknown origin has been spotted near Antarctica.",maxTimer:280,reward:35,isOcean:true,isKaiju:true},
  {id:245,name:"The OhNohMi",loc:"Himalayas",x:360,y:115,priority:"orange",type:"mystic",desc:"A cryptid creature from the deep Himalayan peaks has descended into populated valleys. Nobody is sure what it wants.",maxTimer:290,reward:28},
  {id:246,name:"The Chaotic Order Of Organized Chaos",loc:"Brussels, Belgium",x:238,y:70,priority:"orange",type:"military",desc:"An organisation dedicated to organised chaos. They are extremely well-organised about it.",maxTimer:310,reward:26},
  {id:247,name:"Good Guys R Us (Bioterror)",loc:"San Francisco, USA",x:56,y:118,priority:"red",type:"bio",desc:"A well-meaning but extraordinarily naive activist group of college students has accidentally committed bioterrorism while trying to help.",maxTimer:200,reward:44,isNorthAmerica:true},
  {id:248,name:"The Card King",loc:"Las Vegas, USA",x:64,y:126,priority:"red",type:"mystic",desc:"A dark monster summoned by shuffling a deck of cards in a precise order. Someone in Vegas found out the hard way.",maxTimer:210,reward:48,isNorthAmerica:true},
  {id:249,name:"Alemeus the Alien Divorcee",loc:"Washington D.C., USA",x:96,y:116,priority:"yellow",type:"military",desc:"An alien committing crimes just so someone will show up and listen to him talk about his divorce and the children he lost custody of.",maxTimer:440,reward:8,isNorthAmerica:true},
  {id:250,name:"The Order Of Greg",loc:"Ohio, USA",x:94,y:114,priority:"yellow",type:"military",desc:"A death cult dedicated to bringing their beloved friend Greg back from the dead. Greg is alive. He just moved away and doesn't call as much.",maxTimer:450,reward:8,isNorthAmerica:true},
  {id:251,name:"Undead King George III + Redcoat Legion",loc:"Boston, USA",x:104,y:108,priority:"red",type:"mystic",desc:"The undead ghost of King George III and his legion of undead Redcoats are attempting to retake America.",maxTimer:200,reward:55,isNorthAmerica:true},
  {id:252,name:"Division 8",loc:"Unknown",x:165,y:145,priority:"red",type:"military",desc:"A splinter faction of Division 7, dedicated to destroying both the world and Division 7. Outstanding commitment.",maxTimer:190,reward:50,recurring:true},
  {id:253,name:"The Definitely Good Guys Friendship Guild",loc:"Geneva, Switzerland",x:248,y:80,priority:"orange",type:"military",desc:"Definitely not good people, but they understand marketing. Sophisticated branding, villainous intent.",maxTimer:290,reward:28},
  {id:254,name:"Frenzied Venomous Rabid Snails",loc:"French Riviera",x:238,y:90,priority:"yellow",type:"bio",desc:"Frenzied, venomous, rabid snails. Faster than you'd think, but not like super fast.",maxTimer:420,reward:10},
  {id:255,name:"MEGALODON (on steroids)",loc:"Pacific Ocean",x:475,y:165,priority:"red",type:"kaiju",desc:"The prehistoric apex predator, back, and on steroids. The ocean is no longer safe.",maxTimer:200,reward:55,isOcean:true,isKaiju:true},
  {id:256,name:"Lizard People from Underground",loc:"Beneath Denver, USA",x:72,y:116,priority:"orange",type:"military",desc:"An advanced subterranean lizard civilisation has emerged and is deeply unimpressed by the surface world.",maxTimer:280,reward:32,isNorthAmerica:true},
  {id:257,name:"Feral Bug People (Deeper Underground)",loc:"Beneath Kansas, USA",x:80,y:118,priority:"orange",type:"bio",desc:"Feral insectoid humanoids from even deeper underground than the lizard people. They are very upset about the lizard people.",maxTimer:270,reward:30,isNorthAmerica:true},
  {id:258,name:"The Homunculus Liberation Front",loc:"Vienna, Austria",x:256,y:74,priority:"yellow",type:"military",desc:"A liberation movement for artificially-created humanoids. Their demands are surprisingly reasonable but their methods are not.",maxTimer:360,reward:18},
  {id:259,name:"The Samsquanch",loc:"Canadian Wilderness",x:76,y:80,priority:"orange",type:"military",desc:"A superpowered man who dresses as Sasquatch to incite an interspecies war between humans and cryptids.",maxTimer:300,reward:26,isNorthAmerica:true},
  {id:260,name:"The Baddest Baddies",loc:"Monaco",x:248,y:88,priority:"orange",type:"military",desc:"An elite villain unit who define themselves as glamorously evil. Extraordinarily well-dressed. Very dangerous.",maxTimer:290,reward:32},
  {id:261,name:"Silver Meadows HOA",loc:"Phoenix, Arizona, USA",x:66,y:124,priority:"yellow",type:"military",desc:"An extremely vicious homeowners association. They have somehow acquired military-grade enforcement capabilities. Deals +10 damage per hero deployed beyond the first 4.",maxTimer:400,reward:10,isNorthAmerica:true,hoaEffect:true},
  // ── NEW THREATS ──
  {id:262,name:"BEEHIVE THE SIZE OF RHODE ISLAND",loc:"Rhode Island, USA",x:108,y:106,priority:"red",type:"bio",desc:"A beehive the size of Rhode Island has appeared overnight. The bees are not happy.",maxTimer:190,reward:52,isNorthAmerica:true,isKaiju:true},
  {id:263,name:"THE ANCIENT GREEK TITAN OCEANUS",loc:"Atlantic Ocean",x:175,y:140,priority:"red",type:"mystic",desc:"The primordial Titan Oceanus has risen from the depths of the Atlantic.",maxTimer:200,reward:60,isOcean:true},
  {id:264,name:"REAPER: ENTITY OF DARKNESS",loc:"Unknown",x:165,y:145,priority:"red",type:"mystic",desc:"An entity of darkness who deals 45 damage to all support heroes. Avoid deploying support classes.",maxTimer:195,reward:58,reaperEffect:true},
  {id:265,name:"CALAXES: THE PRECAMBRIAN MONSTER",loc:"Pacific Rim",x:460,y:180,priority:"red",type:"kaiju",desc:"A brutally tough monster from the Precambrian era. Deals 30 damage to all tanks regardless of stats.",maxTimer:200,reward:55,calaxesEffect:true,isKaiju:true},
  {id:266,name:"ARCHONOIS: THE MAGIC USER",loc:"Eastern Europe",x:288,y:82,priority:"red",type:"mystic",desc:"A magic user poised to deal 30 damage to all cannons regardless of stats.",maxTimer:200,reward:55,archonoisEffect:true},
  {id:267,name:"TYPHON: FATHER OF MONSTERS",loc:"Mediterranean Sea",x:270,y:106,priority:"purple",type:"mystic",desc:"Typhon, Father of Monsters. Deals exactly 280 damage split evenly across the entire party. Any hero except John is at lethal risk. John can take no more than 50 total damage from Typhon.",maxTimer:180,reward:80,typhonEffect:true},
  {id:268,name:"GEORGE THE GENTLE",loc:"Appalachia, USA",x:90,y:118,priority:"orange",type:"bio",desc:"An arthropleura from centuries prior, covered in ancient bacteria. Friendly but extremely dangerous to be near.",maxTimer:270,reward:32,isNorthAmerica:true},
  {id:269,name:"Body Snatching Plants",loc:"Florida, USA",x:94,y:140,priority:"orange",type:"bio",desc:"Aggressive body-snatching plants have begun converting civilians across the southeast.",maxTimer:260,reward:30,isNorthAmerica:true},
  {id:270,name:"Oversized Mobile Venus Fly Traps",loc:"Carolina Coast, USA",x:96,y:126,priority:"orange",type:"bio",desc:"Oversized mobile venus fly traps have broken containment and are moving inland.",maxTimer:270,reward:28,isNorthAmerica:true},
  {id:271,name:"A Child With Matter Manipulation",loc:"Midwest, USA",x:82,y:114,priority:"red",type:"mystic",desc:"A child with matter manipulation and a temper. Do not upset them.",maxTimer:210,reward:50,isNorthAmerica:true},
  {id:272,name:"THE GIANT SQUID",loc:"North Pacific",x:470,y:130,priority:"orange",type:"kaiju",desc:"The legendary Giant Squid has surfaced and is in a terrible mood.",maxTimer:250,reward:38,isOcean:true,isKaiju:true},
  {id:273,name:"THE COLOSSAL SQUID",loc:"Southern Ocean",x:370,y:290,priority:"red",type:"kaiju",desc:"The Colossal Squid — larger, angrier, and somehow faster.",maxTimer:210,reward:55,isOcean:true,isKaiju:true},
  {id:274,name:"THE LEVIATHAN",loc:"Deep Atlantic",x:190,y:160,priority:"red",type:"mystic",desc:"The Leviathan stirs in the deep. Biblical proportions. Deals +10 damage per hero deployed beyond the first 4.",maxTimer:185,reward:65,isOcean:true,leviathanEffect:true},
  {id:275,name:"LIVYATAN POD",loc:"South Atlantic",x:190,y:220,priority:"orange",type:"kaiju",desc:"A pod of Livyatan — ancient sperm whale predators — has awoken and is hunting.",maxTimer:240,reward:40,isOcean:true,isKaiju:true},
  {id:276,name:"MOSASAURUS POD",loc:"Gulf of Mexico",x:100,y:155,priority:"orange",type:"kaiju",desc:"A pod of Mosasaurs is rampaging through the Gulf of Mexico.",maxTimer:245,reward:40,isOcean:true,isKaiju:true,isNorthAmerica:true},
  {id:277,name:"AN IMMORTAL SNAIL (One Guy's Problem)",loc:"New York, USA",x:100,y:108,priority:"yellow",type:"mystic",desc:"An immortal snail is chasing after one guy for some reason. The guy is panicking. This is somehow a city-wide emergency.",maxTimer:420,reward:10,isNorthAmerica:true},
  {id:278,name:"Deranged Cartoon Creatures",loc:"Los Angeles, USA",x:58,y:130,priority:"orange",type:"mystic",desc:"A very strange person is manifesting semi-sentient and deranged versions of beloved cartoon creatures across Los Angeles.",maxTimer:280,reward:30,isNorthAmerica:true},
  {id:279,name:"DISEASE CONTAINMENT BREACH: All Extremities Fall Off",loc:"CDC Atlanta, USA",x:90,y:130,priority:"red",type:"bio",desc:"The mosquitoes broke containment of the 'All Extremities Fall Off Disease' research facility. Yes, including that one.",maxTimer:195,reward:58,isNorthAmerica:true},
  {id:280,name:"Bioweapon: Shareholder Value Apathy",loc:"Wall Street, New York, USA",x:102,y:108,priority:"yellow",type:"bio",desc:"A bioweapon that makes people not care about maximizing shareholder value has been unleashed. Economists are inconsolable.",maxTimer:420,reward:8,isNorthAmerica:true},
  {id:281,name:"Squirrel Pursuing an Acorn (Massive Collateral Damage)",loc:"Multiple Cities",x:150,y:130,priority:"orange",type:"bio",desc:"A squirrel that keeps causing large calamities as it pursues a single acorn.",maxTimer:280,reward:24},
  {id:282,name:"Cat Stuck in a Tree",loc:"Des Moines, Iowa, USA",x:82,y:114,priority:"yellow",type:"military",desc:"A cat is stuck in a tree. The situation has somehow escalated. John takes exactly 60 damage every time he is deployed here — no more, no less.",maxTimer:500,reward:5,isNorthAmerica:true,catTreeEffect:true},
  {id:283,name:"Robot Fraternity: College Hazing Research",loc:"Campus, USA",x:88,y:118,priority:"orange",type:"tech",desc:"A fraternity of robots is attempting to understand college hazing. Their methods are destructive and deeply misguided.",maxTimer:290,reward:24,isNorthAmerica:true},
  {id:284,name:"METEOR STRIKE",loc:"Incoming",x:165,y:100,priority:"red",type:"disaster",desc:"A meteor is inbound. Impact in T-minus too soon.",maxTimer:180,reward:60},
  {id:285,name:"TSUNAMI",loc:"Pacific Coast",x:56,y:140,priority:"red",type:"disaster",desc:"A category 6 tsunami is bearing down on the Pacific Coast.",maxTimer:200,reward:50,isOcean:true,isNorthAmerica:true},
  {id:286,name:"TSUNAMI STRIKING NUCLEAR REACTOR",loc:"Pacific Coast Nuclear Facility",x:58,y:132,priority:"red",type:"disaster",desc:"A tsunami is hitting a nuclear reactor. This is exactly as bad as it sounds.",maxTimer:185,reward:65,isOcean:true,isNorthAmerica:true},
  {id:287,name:"THE TORTOISE GUILD",loc:"Galapagos Islands",x:110,y:200,priority:"yellow",type:"military",desc:"An ancient and remarkably well-organised guild of giant tortoises with unclear but deeply concerning intentions.",maxTimer:400,reward:12},
  {id:288,name:"ARCTIC CROSSBREEDING STATION",loc:"Arctic Research Station",x:300,y:20,priority:"red",type:"bio",desc:"An Arctic station researching the crossbreeding of Ebola, the common cold, rabies, and measles. It's gone terribly wrong.",maxTimer:190,reward:62},
  {id:289,name:"Evil Scientists Convention",loc:"Geneva, Switzerland",x:248,y:80,priority:"orange",type:"military",desc:"All of the world's evil scientists have decided to hold a convention. Attendance is surprisingly high.",maxTimer:270,reward:28},
  {id:290,name:"EVIL HACKERS",loc:"Unknown",x:165,y:145,priority:"orange",type:"tech",desc:"An elite network of evil hackers is systematically dismantling global infrastructure.",maxTimer:260,reward:32,recurring:true},
  // ── V7 NEW THREATS ──
  {id:291,name:"A Crop Blight",loc:"Midwest USA",x:82,y:118,priority:"orange",type:"bio",desc:"A supernatural crop blight is spreading across the heartland at an alarming rate, threatening food supply chains.",maxTimer:300,reward:28,isNorthAmerica:true},
  {id:292,name:"A Petty Criminal With Three Wishes",loc:"Las Vegas, USA",x:64,y:126,priority:"orange",type:"mystic",desc:"A small-time crook has gotten hold of a genuine lamp. His wishes are petty. The consequences are not.",maxTimer:280,reward:30,isNorthAmerica:true},
  {id:293,name:"A Runaway Trolley Posing An Ethical Dilemma",loc:"Philadelphia, USA",x:100,y:112,priority:"yellow",type:"military",desc:"A runaway trolley. Five people on one track. One on another. Philosophers are rioting. Someone please just stop the trolley.",maxTimer:420,reward:8,isNorthAmerica:true},
  {id:294,name:"NBA Franchise Owners",loc:"New York, USA",x:100,y:108,priority:"orange",type:"military",desc:"The NBA franchise owners have taken civilians hostage and are forcing them to watch their dying sport. Attendance is at an all-time low and they are desperate.",maxTimer:310,reward:26,isNorthAmerica:true},
  {id:295,name:"The Cringe Crew",loc:"Los Angeles, USA",x:58,y:130,priority:"orange",type:"military",desc:"A group of content creators committing increasingly dangerous crimes for views. Subscriber counts are through the roof. Property damage is catastrophic.",maxTimer:290,reward:24,isNorthAmerica:true},
  {id:296,name:"Anthony the Lethal Gas Guy",loc:"Chicago, USA",x:88,y:112,priority:"orange",type:"bio",desc:"Anthony is a good person. He just gets nervous and produces lethal gas when he does. He's nervous a lot. He needs help, not judgment.",maxTimer:300,reward:22,isNorthAmerica:true},
  {id:297,name:"A Very Hungry Caterpillar",loc:"Vermont, USA",x:106,y:104,priority:"yellow",type:"bio",desc:"It is very hungry. It has eaten through three counties. Local agriculture is decimated. It shows no signs of stopping.",maxTimer:380,reward:14,isNorthAmerica:true},
  {id:298,name:"A Mechanized Kaiju From Space",loc:"Pacific Coast",x:56,y:140,priority:"red",type:"kaiju",desc:"A fully mechanized kaiju of alien origin has made landfall. It is larger, faster, and angrier than any kaiju on record.",maxTimer:185,reward:65,isKaiju:true,isNorthAmerica:true},
  {id:299,name:"An Empire of Three Alien Conquerors",loc:"Washington D.C., USA",x:96,y:116,priority:"red",type:"military",desc:"An alien empire has come to conquer Earth. There are only three of them. They are, however, extremely superpowered and deeply committed to the bit.",maxTimer:200,reward:55,isNorthAmerica:true},
  {id:300,name:"The Yeti",loc:"Himalayas",x:360,y:115,priority:"orange",type:"kaiju",desc:"The Yeti has been found. It is enormous. It is not pleased about being found.",maxTimer:270,reward:32,isKaiju:true},
  {id:301,name:"The Mothman",loc:"West Virginia, USA",x:94,y:118,priority:"orange",type:"mystic",desc:"The Mothman has returned to the Point Pleasant area and is causing widespread panic. Some locals appear to be worshipping it.",maxTimer:280,reward:28,isNorthAmerica:true},
  {id:302,name:"Angry Eco-Conscious Mermaids",loc:"Atlantic Coast",x:110,y:150,priority:"orange",type:"mystic",desc:"A collective of environmentally furious mermaids has declared war on coastal industrial infrastructure. Their demands are reasonable. Their methods are not.",maxTimer:290,reward:30,isOcean:true},
  {id:303,name:"Mongolian Death Worms",loc:"Gobi Desert, Mongolia",x:388,y:100,priority:"orange",type:"bio",desc:"A swarm of Mongolian Death Worms has emerged from beneath the Gobi. They spit acid and conduct electricity. There are thousands of them.",maxTimer:275,reward:34},
  {id:304,name:"The Dover Demon",loc:"Dover, Massachusetts, USA",x:106,y:106,priority:"yellow",type:"mystic",desc:"The Dover Demon has reappeared. Nobody is entirely sure what it wants. It is very unsettling to look at.",maxTimer:400,reward:12,isNorthAmerica:true},
  {id:305,name:"B-List Zombie Movie Pulling Viewers In",loc:"Hollywood, USA",x:58,y:128,priority:"orange",type:"mystic",desc:"A low-budget zombie film has gained sentience and is pulling civilians into its universe. The special effects are terrible. The danger is not.",maxTimer:285,reward:26,isNorthAmerica:true},
  {id:306,name:"Zombified Asian Giant Hornets",loc:"Pacific Northwest, USA",x:56,y:96,priority:"red",type:"bio",desc:"Zombified Asian Giant Hornets the size of small dogs have formed a swarm. Deals ×4 damage to heroes with bug allergies.",maxTimer:195,reward:58,isNorthAmerica:true,zombieHornetEffect:true},
];

// Fisher-Yates shuffle
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

// ─── CODEX DATA ───────────────────────────────────────────────────────────────
function buildCodexEntries(){
  const entries=[];
  ALL_HERO_DEFS.forEach(h=>entries.push({id:"h_"+h.id,category:"hero",name:h.title,realName:h.realName,cls:h.cls,power:h.basePower,hp:h.baseHP,personality:h.personality,abilities:h.abilities,weaknesses:h.weaknesses,special:h.specialAbility,secret:h.hiddenTraits?h.secretTrait:null,portrait:h.portrait||null}));
  VILLAIN_DEFS.forEach(v=>entries.push({id:"v_"+v.id,category:"villain",name:v.title,realName:v.realName,cls:v.cls,power:v.basePower,hp:v.baseHP,personality:v.personality,abilities:v.abilities,weaknesses:v.weaknesses,special:v.specialAbility,portrait:v.portrait||null}));
  ALL_THREATS.forEach(t=>entries.push({id:"t_"+t.id,category:"threat",name:t.name,loc:t.loc,priority:t.priority,type:t.type,desc:t.desc,reward:t.reward}));
  return entries;
}
const CODEX_ENTRIES=buildCodexEntries();
