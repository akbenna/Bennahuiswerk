import type { Deel, Game, Scherm, Soortdeel } from './soorten'

/* =============================================================================
   DE BOUWBANK — onderdelen om mee te oefenen

   punten = een ruwe maat voor snelheid, alleen bedoeld om te vergelijken.
   watt   = wat het onderdeel ongeveer trekt onder belasting.
   De prijzen zijn ordes van grootte uit 2025-2026 en veranderen constant; ze
   staan er om te leren kiezen, niet om mee te bestellen.
============================================================================= */
export const DELEN: Record<Soortdeel, Deel[]> = {
 cpu:[
  {id:'r5-5600',  n:'AMD Ryzen 5 5600',    d:'6 kernen · AM4 · zuinig',        prijs:105, punten:120, watt:65,  socket:'AM4', ram:'DDR4', ico:'🧠'},
  {id:'r5-7600',  n:'AMD Ryzen 5 7600',    d:'6 kernen · AM5 · nieuw platform',prijs:185, punten:170, watt:105, socket:'AM5', ram:'DDR5', ico:'🧠'},
  {id:'r7-7800',  n:'AMD Ryzen 7 7800X3D', d:'8 kernen · AM5 · gamekoning',    prijs:355, punten:230, watt:120, socket:'AM5', ram:'DDR5', ico:'🧠'},
  {id:'i5-12400', n:'Intel Core i5-12400F',d:'6 kernen · LGA1700 · goedkoop',  prijs:120, punten:130, watt:65,  socket:'LGA1700', ram:'DDR4', ico:'🧠'},
  {id:'i5-14600', n:'Intel Core i5-14600K',d:'14 kernen · LGA1700 · snel',     prijs:270, punten:210, watt:180, socket:'LGA1700', ram:'DDR5', ico:'🧠'}
 ],
 mobo:[
  {id:'b550',  n:'B550 (micro-ATX)',  d:'AM4 · DDR4 · 1× NVMe',   prijs:85,  socket:'AM4', ram:'DDR4', maat:'mATX', ico:'🟩'},
  {id:'b650',  n:'B650 (ATX)',        d:'AM5 · DDR5 · 2× NVMe',   prijs:150, socket:'AM5', ram:'DDR5', maat:'ATX',  ico:'🟩'},
  {id:'b650i', n:'B650I (mini-ITX)',  d:'AM5 · DDR5 · klein',     prijs:190, socket:'AM5', ram:'DDR5', maat:'ITX',  ico:'🟩'},
  {id:'b760',  n:'B760 (ATX)',        d:'LGA1700 · DDR5 · 2× NVMe',prijs:135,socket:'LGA1700', ram:'DDR5', maat:'ATX', ico:'🟩'},
  {id:'h610',  n:'H610 (micro-ATX)',  d:'LGA1700 · DDR4 · zuinig',prijs:80,  socket:'LGA1700', ram:'DDR4', maat:'mATX', ico:'🟩'}
 ],
 gpu:[
  {id:'geen',    n:'Geen losse kaart', d:'Alleen als je processor beeld kan geven', prijs:0, punten:25, watt:0, lengte:0, ico:'⬜'},
  {id:'rx6600',  n:'AMD RX 6600',      d:'8 GB · prima op 1080p',      prijs:190, punten:145, watt:132, lengte:200, ico:'🎮'},
  {id:'rtx4060', n:'NVIDIA RTX 4060',  d:'8 GB · zuinig · 1080p',      prijs:290, punten:175, watt:115, lengte:245, ico:'🎮'},
  {id:'rx7700',  n:'AMD RX 7700 XT',   d:'12 GB · 1440p',              prijs:400, punten:245, watt:245, lengte:276, ico:'🎮'},
  {id:'rtx4070', n:'NVIDIA RTX 4070 S',d:'12 GB · 1440p · sterk',      prijs:620, punten:305, watt:220, lengte:305, ico:'🎮'},
  {id:'rtx4080', n:'NVIDIA RTX 4080 S',d:'16 GB · 4K',                 prijs:1090,punten:430, watt:320, lengte:336, ico:'🎮'}
 ],
 ram:[
  {id:'d4-8',  n:'8 GB DDR4 (1× 8)',   d:'Krap · geen dual channel', prijs:22, punten:40,  watt:5,  soort:'DDR4', gb:8,  duo:false, ico:'📗'},
  {id:'d4-16', n:'16 GB DDR4 (2× 8)',  d:'De norm',                  prijs:38, punten:75,  watt:8,  soort:'DDR4', gb:16, duo:true,  ico:'📗'},
  {id:'d5-16', n:'16 GB DDR5 (2× 8)',  d:'Sneller',                  prijs:55, punten:90,  watt:9,  soort:'DDR5', gb:16, duo:true,  ico:'📘'},
  {id:'d5-32', n:'32 GB DDR5 (2× 16)', d:'Voor streamen en video',   prijs:98, punten:100, watt:11, soort:'DDR5', gb:32, duo:true,  ico:'📘'}
 ],
 opslag:[
  {id:'hdd1',   n:'1 TB harde schijf',  d:'Goedkoop en langzaam',    prijs:38, punten:10, watt:8, ico:'💽'},
  {id:'sata1',  n:'1 TB SATA-SSD',      d:'Snel genoeg',             prijs:55, punten:45, watt:4, ico:'💾'},
  {id:'nvme1',  n:'1 TB NVMe',          d:'De verstandige keuze',    prijs:65, punten:80, watt:6, ico:'⚡'},
  {id:'nvme2',  n:'2 TB NVMe',          d:'Ruimte voor veel spellen',prijs:115,punten:85, watt:7, ico:'⚡'}
 ],
 psu:[
  {id:'w450',  n:'450 W Bronze',  d:'Alleen voor lichte bouwen', prijs:45,  watt:450,  ico:'🔌'},
  {id:'w650',  n:'650 W Gold',    d:'De veilige middenweg',      prijs:75,  watt:650,  ico:'🔌'},
  {id:'w850',  n:'850 W Gold',    d:'Ruimte voor een zware kaart',prijs:110, watt:850, ico:'🔌'},
  {id:'w1000', n:'1000 W Platinum',d:'Alleen voor het topsegment',prijs:180, watt:1000, ico:'🔌'}
 ],
 kast:[
  {id:'itx',  n:'Mini-ITX kast',  d:'Klein · alleen ITX-borden · korte kaarten', prijs:70, maten:['ITX'],              maxLengte:210, ico:'📦'},
  {id:'matx', n:'Micro-ATX kast', d:'Compact · goede prijs',                     prijs:60, maten:['ITX','mATX'],       maxLengte:300, ico:'📦'},
  {id:'atx',  n:'ATX midtower',   d:'De gewone maat · past bijna alles',         prijs:80, maten:['ITX','mATX','ATX'], maxLengte:360, ico:'📦'}
 ]
};
export const DEELNAMEN: Record<Soortdeel, string> = { cpu:'Processor', mobo:'Moederbord', gpu:'Videokaart', ram:'Geheugen',
                    opslag:'Opslag', psu:'Voeding', kast:'Kast' };

/* De spellen waarop je bouw getoetst wordt. `zwaarte` is hoeveel de game vraagt;
   het getal is zo gekozen dat de uitkomsten in de buurt komen van wat je in
   echte tests ziet. Het is een schatting om mee te leren kiezen — geen belofte. */
export const GAMES: Game[] = [
 {id:'fifa',    n:'EA FC',           ico:'⚽', zwaarte:1.1, cpuDeel:.35},
 {id:'fortnite',n:'Fortnite',        ico:'🏝️', zwaarte:1.5, cpuDeel:.35},
 {id:'minecraft',n:'Minecraft (shaders)',ico:'⛏️',zwaarte:1.3,cpuDeel:.45},
 {id:'rocket',  n:'Rocket League',   ico:'🚗', zwaarte:.7,  cpuDeel:.4},
 {id:'cs',      n:'Counter-Strike 2',ico:'🔫', zwaarte:1.0, cpuDeel:.5},
 {id:'cyber',   n:'Cyberpunk 2077',  ico:'🌆', zwaarte:3.2, cpuDeel:.2}
];
export const SCHERMEN: Scherm[] = [ {id:'1080', n:'1080p', f:1}, {id:'1440', n:'1440p', f:1.75}, {id:'4k', n:'4K', f:3.3} ];

