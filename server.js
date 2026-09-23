const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (_, res) => res.json({ ok: true, game: 'Signal & Noise' }));
const rooms = new Map();
const packs = [
  {q:'Which animal has three hearts?', a:['Octopus','Blue whale','Penguin','Sea turtle'], c:0, fact:'Two hearts pump blood to the gills; the third serves the body.'},
  {q:'Which planet has the shortest day?', a:['Mars','Jupiter','Mercury','Venus'], c:1, fact:'Jupiter spins once in about 9 hours and 56 minutes.'},
  {q:'What is the only mammal capable of true flight?', a:['Flying squirrel','Sugar glider','Bat','Colugo'], c:2, fact:'Bats are the only mammals that sustain powered flight.'},
  {q:'Which came first: Oxford University or the Aztec Empire?', a:['The Aztec Empire','Oxford University','Same century','Neither'], c:1, fact:'Teaching at Oxford began around 1096; the Aztec Empire formed in 1428.'},
  {q:'How many bones does a shark have?', a:['206','About 50','Zero','Over 1,000'], c:2, fact:'A shark’s skeleton is made of cartilage, not bone.'},
  {q:'Which food never spoils when stored properly?', a:['Honey','Rice','Salted butter','Dark chocolate'], c:0, fact:'Honey’s low moisture and acidity make it remarkably shelf-stable.'},
  {q:'What is the dot over a lowercase i called?', a:['Tittle','Dingbat','Diacritic','Minim'], c:0, fact:'That tiny mark has a name: a tittle.'},
  {q:'Which country has a town named Å?', a:['Norway','Japan','Chile','Morocco'], c:0, fact:'Å means “river” in Old Norse; several Scandinavian places use the name.'},
  {q:'What color is a polar bear’s skin?', a:['White','Pink','Black','Blue'], c:2, fact:'Black skin helps absorb heat beneath translucent fur.'},
  {q:'Which is technically a berry?', a:['Strawberry','Raspberry','Banana','Blackberry'], c:2, fact:'Botanically, bananas are berries; strawberries are aggregate accessory fruits.'},
  {q:'What is the world’s largest desert?', a:['Sahara','Gobi','Antarctica','Arabian'], c:2, fact:'Deserts are defined by low precipitation. Antarctica is the largest.'},
  {q:'How many letters are in the Hawaiian alphabet?', a:['12','13','14','16'], c:1, fact:'Hawaiian uses 13 letters: five vowels and eight consonants.'},
  {q:'Which bird can fly backwards?', a:['Kingfisher','Hummingbird','Swift','Puffin'], c:1, fact:'Hummingbirds can hover and fly backwards thanks to their unique wing rotation.'},
  {q:'What is the smallest bone in the human body?', a:['Stapes','Patella','Coccyx','Incus'], c:0, fact:'The stapes in your middle ear is only about 3 mm long.'},
  {q:'Which metal is liquid at room temperature?', a:['Gallium','Mercury','Cesium','All three'], c:1, fact:'Mercury stays liquid at ordinary room temperature; gallium melts just above it.'},
  {q:'A group of flamingos is called a…', a:['Flamboyance','Bouquet','Parade','Flockade'], c:0, fact:'The wonderfully apt collective noun is a flamboyance.'},
  {q:'Which city is farther west?', a:['Reno, Nevada','Los Angeles','Same longitude','Depends on the season'], c:0, fact:'Reno is slightly farther west than Los Angeles.'},
  {q:'What is the national animal of Scotland?', a:['Red deer','Highland cow','Unicorn','Golden eagle'], c:2, fact:'The unicorn has been a Scottish symbol since the 12th century.'},
  {q:'How many sides does a snowflake usually have?', a:['Four','Five','Six','Eight'], c:2, fact:'Water molecules form hexagonal ice crystals, giving snowflakes six-fold symmetry.'},
  {q:'Which language has the most native speakers?', a:['English','Spanish','Mandarin Chinese','Hindi'], c:2, fact:'Mandarin Chinese has the most native speakers worldwide.'},
  {q:'What is the fear of long words jokingly called?', a:['Sesquipedalophobia','Hippopotomonstrosesquipedaliophobia','Logophobia','Verbophobia'], c:1, fact:'The tongue-twisting name is itself a long word.'},
  {q:'Which came first?', a:['The fax machine','The telephone','The camera','The light bulb'], c:0, fact:'A primitive fax machine was patented in 1843, decades before the telephone.'},
  {q:'What is the only continent in all four hemispheres?', a:['Africa','Asia','South America','Europe'], c:0, fact:'Africa is crossed by both the Equator and the Prime Meridian.'},
  {q:'How long is a “jiffy”?', a:['A fixed unit: 1/100th second','About 1/100th of a second in computing','One minute','It has no fixed duration'], c:3, fact:'“Jiffy” is informal; different technical fields assign it different durations.'}
];
function publicRoom(r){return {code:r.code, status:r.status, round:r.round, total:r.total, players:[...r.players.values()].map(p=>({id:p.id,name:p.name,score:p.score,online:p.online,host:p.id===r.host})), question:['question','reveal'].includes(r.status)?{q:r.questions[r.round].q,options:r.questions[r.round].a,endsAt:r.endsAt}:null, answers:r.status==='reveal'?r.lastAnswers:null, correct:r.status==='reveal'?r.questions[r.round].c:null, fact:r.status==='reveal'?r.questions[r.round].fact:null, leaderboard:r.status==='finished'?rank(r):null};}
function emit(r){io.to(r.code).emit('state',publicRoom(r));}
function rank(r){return [...r.players.values()].sort((a,b)=>b.score-a.score).map((p,i)=>({...p,rank:i+1}));}
function startQuestion(r){clearTimeout(r.timer); if(r.round>=r.total){r.status='finished';emit(r);return;} r.status='question';r.answers=new Map();r.lastAnswers=[];r.endsAt=Date.now()+16000;emit(r);r.timer=setTimeout(()=>reveal(r),16000);}
function reveal(r){if(!r||r.status!=='question')return;clearTimeout(r.timer);r.status='reveal';const q=r.questions[r.round];r.lastAnswers=[...r.players.values()].filter(p=>p.online).map(p=>{const a=r.answers.get(p.id);return{id:p.id,name:p.name,correct:a===q.c,answer:a??null};}); for(const p of r.players.values()){const a=r.answers.get(p.id);if(a===q.c)p.score+=100;}emit(r);r.timer=setTimeout(()=>{r.round++;startQuestion(r);},5200);}
function safeName(v){return String(v||'').replace(/[<>\u0000-\u001f]/g,'').trim().slice(0,18)||'Player';}
io.on('connection',socket=>{
 socket.on('create',({name},cb)=>{let code;do{code=Math.random().toString(36).slice(2,6).toUpperCase()}while(rooms.has(code));const p={id:socket.id,name:safeName(name),score:0,online:true};const r={code,host:p.id,players:new Map([[p.id,p]]),status:'lobby',round:0,total:8,questions:shuffle(packs).slice(0,8),answers:new Map(),timer:null};rooms.set(code,r);socket.join(code);cb({ok:true,code});emit(r);});
 socket.on('join',({code,name},cb)=>{code=String(code||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);const r=rooms.get(code);if(!r)return cb({ok:false,error:'That room code isn’t live. Check it and try again.'});if(r.status!=='lobby')return cb({ok:false,error:'This game has already started. Ask the host to start a new room.'});if(r.players.size>=12)return cb({ok:false,error:'This room is full (12 players max).'});const p={id:socket.id,name:safeName(name),score:0,online:true};r.players.set(socket.id,p);socket.join(code);cb({ok:true,code});emit(r);});
 socket.on('start',()=>{const r=find(socket);if(!r||r.host!==socket.id||r.status!=='lobby'||r.players.size<1)return;r.round=0;r.players.forEach(p=>p.score=0);startQuestion(r);});
 socket.on('answer',i=>{const r=find(socket);if(!r||r.status!=='question'||r.answers.has(socket.id))return;if(Number.isInteger(i)&&i>=0&&i<4){r.answers.set(socket.id,i);if([...r.players.values()].filter(p=>p.online).every(p=>r.answers.has(p.id)))reveal(r);}});
 socket.on('next',()=>{const r=find(socket);if(r&&r.host===socket.id&&r.status==='reveal'){clearTimeout(r.timer);r.round++;startQuestion(r);}});
 socket.on('rematch',()=>{const r=find(socket);if(r&&r.host===socket.id&&r.status==='finished'){r.status='lobby';r.round=0;r.questions=shuffle(packs).slice(0,8);r.players.forEach(p=>p.score=0);emit(r);}});
 socket.on('disconnect',()=>{for(const r of rooms.values()){const p=r.players.get(socket.id);if(p){p.online=false;emit(r);setTimeout(()=>{if(r.players.get(socket.id)?.online===false){r.players.delete(socket.id);if(r.host===socket.id){r.host=r.players.keys().next().value;}emit(r);if(!r.players.size){clearTimeout(r.timer);rooms.delete(r.code);}}},60000);}}});
});
function find(s){for(const r of rooms.values())if(r.players.has(s.id))return r;}
function shuffle(a){return [...a].sort(()=>Math.random()-.5);}
const port=process.env.PORT||3000;server.listen(port,'0.0.0.0',()=>console.log(`Signal & Noise is live on port ${port}`));
