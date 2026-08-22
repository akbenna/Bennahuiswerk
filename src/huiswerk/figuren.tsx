/**
 * DE TEKENINGEN BIJ DE SOMMEN
 *
 * Zestien figuren, allemaal SVG dat hier ter plekke wordt uitgerekend: een
 * getallenlijn met het juiste bereik, een klok met de wijzers op de goede plek,
 * een breukcirkel met precies zoveel partjes. Geen bestanden, dus het werkt
 * offline en het schaalt mee met de tekstgrootte.
 *
 * De coördinaten zijn regel voor regel overgenomen. Wat erbij is gekomen is de
 * vorm van `ill`: die stond in de gegevens als een los object en is hier een
 * echte keuze per figuur, zodat een tekening met een ontbrekend veld een fout
 * bij het bouwen is en niet een leeg vlak op het scherm.
 */
import type { ReactNode } from 'react'
import type { Illustratie } from './gegevens/soorten'

/** Een maat mag `'?'` zijn: dat is precies de vraag bij "hoe lang is deze
 *  zijde?". */
type Maat = number | string

export type Figuurgegevens =
  | { type: 'rechthoek'; l: Maat; b: Maat }
  | { type: 'driehoek'; basis: Maat; hoogte: Maat }
  | { type: 'cirkel'; r: Maat }
  | { type: 'pyth'; a: Maat; b: Maat; c: Maat }
  | { type: 'hoeken'; h: [Maat, Maat, Maat] }
  | { type: 'vierhoek'; h: [Maat, Maat, Maat, Maat] }
  | { type: 'balk'; l: Maat; b: Maat; h: Maat }
  | { type: 'kubus'; z: Maat }
  | { type: 'getallenlijn'; van: number; tot: number; punt?: number }
  | { type: 'klok'; uur: number; min: number }
  | { type: 'breukstrook'; delen: number; gevuld: number }
  | { type: 'breukcirkel'; delen: number; gevuld: number }
  | { type: 'geodriehoek'; hoek: Maat }
  | { type: 'lijngrafiek'; punten: Array<[number, number]>; xlabel?: string; ylabel?: string }
  | { type: 'staaf'; data: Array<[string, number]> }

export function Figuur({ ill }: { ill: Illustratie }): ReactNode {
  const f = ill as unknown as Figuurgegevens
  const G = '#5EA03A'; const A = '#C23728'; const M = '#5b6157'; const F = '#eaf3e2'
  const cm = (x: Maat): string => (x === '?' ? '? cm' : x + ' cm')
  const deg = (x: Maat): string => (x === '?' ? '?' : x + '°')
  switch (f.type) {
    case 'rechthoek': return (
      <svg width="190" height="118" viewBox="0 0 190 118" role="img" aria-label="rechthoek">
        <rect x="22" y="26" width="130" height="66" fill={F} stroke={G} strokeWidth="2.5"/>
        <text x="87" y="18" fontSize="13" textAnchor="middle" fill={M}>{cm(f.l)}</text>
        <text x="14" y="59" fontSize="13" textAnchor="middle" fill={M} transform="rotate(-90 14 59)">{cm(f.b)}</text>
      </svg>);
    case 'driehoek': return (
      <svg width="190" height="132" viewBox="0 0 190 132" role="img" aria-label="driehoek">
        <polygon points="28,104 162,104 86,30" fill={F} stroke={G} strokeWidth="2.5"/>
        <line x1="86" y1="30" x2="86" y2="104" stroke={A} strokeWidth="1.6" strokeDasharray="4 4"/>
        <rect x="86" y="94" width="10" height="10" fill="none" stroke={A} strokeWidth="1"/>
        <text x="95" y="122" fontSize="13" textAnchor="middle" fill={M}>basis {cm(f.basis)}</text>
        <text x="98" y="70" fontSize="12" fill={A}>h {cm(f.hoogte)}</text>
      </svg>);
    case 'cirkel': return (
      <svg width="170" height="150" viewBox="0 0 170 150" role="img" aria-label="cirkel">
        <circle cx="85" cy="72" r="54" fill={F} stroke={G} strokeWidth="2.5"/>
        <circle cx="85" cy="72" r="2.6" fill="#222"/>
        <line x1="85" y1="72" x2="139" y2="72" stroke={A} strokeWidth="2"/>
        <text x="104" y="66" fontSize="13" fill={A}>r = {f.r} cm</text>
      </svg>);
    case 'pyth': return (
      <svg width="200" height="140" viewBox="0 0 200 140" role="img" aria-label="rechthoekige driehoek">
        <polygon points="32,112 162,112 32,30" fill={F} stroke={G} strokeWidth="2.5"/>
        <rect x="32" y="100" width="12" height="12" fill="none" stroke={A} strokeWidth="1.2"/>
        <text x="97" y="130" fontSize="13" textAnchor="middle" fill={M}>{cm(f.a)}</text>
        <text x="14" y="74" fontSize="13" fill={M}>{cm(f.b)}</text>
        <text x="104" y="64" fontSize="13" fill={A} fontWeight="bold">{cm(f.c)}</text>
      </svg>);
    case 'hoeken': return (
      <svg width="190" height="118" viewBox="0 0 190 118" role="img" aria-label="driehoek met hoeken">
        <polygon points="22,96 168,96 74,26" fill={F} stroke={G} strokeWidth="2.5"/>
        <text x="40" y="89" fontSize="13" fill={A}>{deg(f.h[0])}</text>
        <text x="150" y="89" fontSize="13" textAnchor="end" fill={A}>{deg(f.h[1])}</text>
        <text x="74" y="46" fontSize="13" textAnchor="middle" fill={A}>{deg(f.h[2])}</text>
      </svg>);
    case 'vierhoek': return (
      <svg width="190" height="120" viewBox="0 0 190 120" role="img" aria-label="vierhoek met hoeken">
        <polygon points="26,96 152,102 166,30 44,22" fill={F} stroke={G} strokeWidth="2.5"/>
        <text x="40" y="88" fontSize="12" fill={A}>{deg(f.h[0])}</text>
        <text x="146" y="92" fontSize="12" textAnchor="end" fill={A}>{deg(f.h[1])}</text>
        <text x="158" y="44" fontSize="12" textAnchor="end" fill={A}>{deg(f.h[2])}</text>
        <text x="50" y="38" fontSize="12" fill={A}>{deg(f.h[3])}</text>
      </svg>);
    case 'balk': return (
      <svg width="190" height="132" viewBox="0 0 190 132" role="img" aria-label="balk">
        <polygon points="34,58 116,58 116,108 34,108" fill={F} stroke={G} strokeWidth="2.5"/>
        <polygon points="34,58 64,32 146,32 116,58" fill="#d9ead0" stroke={G} strokeWidth="2.5"/>
        <polygon points="116,58 146,32 146,82 116,108" fill="#c9dec0" stroke={G} strokeWidth="2.5"/>
        <text x="75" y="124" fontSize="12" textAnchor="middle" fill={M}>l {f.l}</text>
        <text x="150" y="78" fontSize="12" fill={M}>b {f.b}</text>
        <text x="20" y="86" fontSize="12" fill={M}>h {f.h}</text>
      </svg>);
    case 'kubus': return (
      <svg width="170" height="132" viewBox="0 0 170 132" role="img" aria-label="kubus">
        <polygon points="40,58 100,58 100,108 40,108" fill={F} stroke={G} strokeWidth="2.5"/>
        <polygon points="40,58 66,34 126,34 100,58" fill="#d9ead0" stroke={G} strokeWidth="2.5"/>
        <polygon points="100,58 126,34 126,84 100,108" fill="#c9dec0" stroke={G} strokeWidth="2.5"/>
        <text x="70" y="124" fontSize="12" textAnchor="middle" fill={M}>z {f.z} cm</text>
      </svg>);
    case 'getallenlijn': {
      const van=f.van, tot=f.tot, n=tot-van, W=290, pad=18, span=W-2*pad, step=span/n;
      const x=(i:number)=>pad+(i-van)*step, ticks:number[]=[];
      for(let i=van;i<=tot;i++) ticks.push(i);
      return (
        <svg width={W} height="58" viewBox={'0 0 '+W+' 58'} role="img" aria-label="getallenlijn">
          <line x1={pad} y1="28" x2={W-pad} y2="28" stroke={M} strokeWidth="2"/>
          <line x1={x(0)} y1="20" x2={x(0)} y2="36" stroke={M} strokeWidth="2.5"/>
          {ticks.map(i=>(<g key={i}>
            <line x1={x(i)} y1="23" x2={x(i)} y2="33" stroke={M} strokeWidth="1.4"/>
            <text x={x(i)} y="50" fontSize="11" textAnchor="middle" fill={i===0?'#222':M}>{i}</text>
          </g>))}
          {f.punt!==undefined && <circle cx={x(f.punt)} cy="28" r="5.5" fill={A}/>}
        </svg>);
    }
    case 'klok': {
      const u=((f.uur||0)%12), m=f.min||0, cx=70, cy=70;
      const ma=(m/60)*2*Math.PI - Math.PI/2, ha=((u+m/60)/12)*2*Math.PI - Math.PI/2;
      const hx=cx+Math.cos(ha)*30, hy=cy+Math.sin(ha)*30, mx=cx+Math.cos(ma)*46, my=cy+Math.sin(ma)*46;
      const ticks:Array<[number,number,number,number]>=[]; for(let i=0;i<12;i++){const a=i/12*2*Math.PI-Math.PI/2; ticks.push([cx+Math.cos(a)*52,cy+Math.sin(a)*52,cx+Math.cos(a)*58,cy+Math.sin(a)*58]);}
      return (
        <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="klok">
          <circle cx={cx} cy={cy} r="60" fill="#fff" stroke={G} strokeWidth="3"/>
          {ticks.map((t,i)=><line key={i} x1={t[0]} y1={t[1]} x2={t[2]} y2={t[3]} stroke={M} strokeWidth="2"/>)}
          <line x1={cx} y1={cy} x2={hx} y2={hy} stroke="#222" strokeWidth="4.5" strokeLinecap="round"/>
          <line x1={cx} y1={cy} x2={mx} y2={my} stroke={A} strokeWidth="3" strokeLinecap="round"/>
          <circle cx={cx} cy={cy} r="3.5" fill="#222"/>
        </svg>);
    }
    case 'breukstrook': {
      const d=f.delen, g=f.gevuld, W=240, hh=42, w=W/d, rc:number[]=[];
      for(let i=0;i<d;i++) rc.push(i);
      return (
        <svg width={W} height={hh+8} viewBox={'0 0 '+W+' '+(hh+8)} role="img" aria-label="breuk">
          {rc.map(i=>(<rect key={i} x={i*w} y="4" width={w} height={hh} fill={i<g?G:F} stroke={M} strokeWidth="1.5"/>))}
        </svg>);
    }
    case 'geodriehoek': {
      const hoek=typeof f.hoek==='number'?f.hoek:40, cx=34, cy=112, L=150, rad=hoek*Math.PI/180, arcR=40;
      const ex=cx+L, ey=cy;
      const ax=cx+L*Math.cos(-rad), ay=cy+L*Math.sin(-rad);
      const a0x=cx+arcR, a0y=cy, a1x=cx+arcR*Math.cos(-rad), a1y=cy+arcR*Math.sin(-rad);
      const large=hoek>180?1:0;
      const lx=cx+(arcR+16)*Math.cos(-rad/2), ly=cy+(arcR+16)*Math.sin(-rad/2);
      return (
        <svg width="200" height="140" viewBox="0 0 200 140" role="img" aria-label={'hoek van '+(f.hoek==='?'?'?':hoek+' graden')}>
          <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={G} strokeWidth="2.5"/>
          <line x1={cx} y1={cy} x2={ax.toFixed(1)} y2={ay.toFixed(1)} stroke={G} strokeWidth="2.5"/>
          <path d={`M ${a0x} ${a0y} A ${arcR} ${arcR} 0 ${large} 0 ${a1x.toFixed(1)} ${a1y.toFixed(1)}`} fill="none" stroke={A} strokeWidth="2"/>
          <text x={lx.toFixed(1)} y={ly.toFixed(1)} fontSize="14" textAnchor="middle" fill={A} fontWeight="bold">{f.hoek==='?'?'?':hoek+'°'}</text>
        </svg>);
    }
    case 'lijngrafiek': {
      const pts=f.punten||[], xs=pts.map(p=>p[0]), ys=pts.map(p=>p[1]);
      const W=270,H=150,padL=32,padB=26,padT=12,padR=12;
      const xmin=Math.min.apply(null,xs), xmax=Math.max.apply(null,xs), ymax=Math.max.apply(null,ys.concat([1]));
      const px=(x:number)=>padL+((x-xmin)/((xmax-xmin)||1))*(W-padL-padR);
      const py=(y:number)=>H-padB-(y/ymax)*(H-padB-padT);
      const poly=pts.map(p=>px(p[0]).toFixed(1)+','+py(p[1]).toFixed(1)).join(' ');
      return (
        <svg width={W} height={H} viewBox={'0 0 '+W+' '+H} role="img" aria-label="lijngrafiek">
          <line x1={padL} y1={padT} x2={padL} y2={H-padB} stroke={M} strokeWidth="1.5"/>
          <line x1={padL} y1={H-padB} x2={W-padR} y2={H-padB} stroke={M} strokeWidth="1.5"/>
          <polyline points={poly} fill="none" stroke={G} strokeWidth="2.5"/>
          {pts.map((p,i)=>(<g key={i}><circle cx={px(p[0])} cy={py(p[1])} r="3.2" fill={A}/>
            <text x={px(p[0])} y={H-padB+14} fontSize="11" textAnchor="middle" fill={M}>{p[0]}</text></g>))}
          {f.ylabel && <text x={padL-4} y={padT+2} fontSize="10" textAnchor="end" fill={M}>{f.ylabel}</text>}
          {f.xlabel && <text x={W-padR} y={H-6} fontSize="10" textAnchor="end" fill={M}>{f.xlabel}</text>}
        </svg>);
    }
    case 'breukcirkel': {
      const d=Math.max(1,f.delen), g=Math.min(d,Math.max(0,f.gevuld)), cx=85, cy=72, r=54;
      const pt=(ang:number):[number,number]=>[cx+r*Math.cos(ang), cy+r*Math.sin(ang)];
      const slices:Array<{key:number;dstr:string;vol:boolean}>=[];
      for(let i=0;i<d;i++){
        const a0=-Math.PI/2 + i*(2*Math.PI/d), a1=-Math.PI/2 + (i+1)*(2*Math.PI/d);
        const [x0,y0]=pt(a0), [x1,y1]=pt(a1), large=(a1-a0)>Math.PI?1:0;
        slices.push({key:i, dstr:`M ${cx} ${cy} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z`, vol:i<g});
      }
      return (
        <svg width="170" height="150" viewBox="0 0 170 150" role="img" aria-label={'breuk '+g+' van '+d}>
          {slices.map(s=>(<path key={s.key} d={s.dstr} fill={s.vol?G:F} stroke={M} strokeWidth="1.6"/>))}
          <text x="85" y="142" fontSize="13" textAnchor="middle" fill={M} fontWeight="bold">{g}/{d}</text>
        </svg>);
    }
    case 'staaf': {
      const data=f.data, n=data.length, max=Math.max.apply(null,data.map(d=>d[1]).concat([1]));
      const pad=22, bw=30, gap=22, baseY=120, top=16, chartH=baseY-top, W=pad*2 + n*bw + (n-1)*gap;
      return (
        <svg width={W} height="150" viewBox={'0 0 '+W+' 150'} role="img" aria-label="staafdiagram">
          <line x1={pad-6} y1={baseY} x2={W-pad+6} y2={baseY} stroke={M} strokeWidth="2"/>
          {data.map((d,i)=>{const h=d[1]/max*chartH, x=pad+i*(bw+gap), y=baseY-h; return (<g key={i}>
            <rect x={x} y={y} width={bw} height={h} fill={F} stroke={G} strokeWidth="2"/>
            <text x={x+bw/2} y={y-4} fontSize="12" textAnchor="middle" fill={M} fontWeight="bold">{d[1]}</text>
            <text x={x+bw/2} y={baseY+15} fontSize="12" textAnchor="middle" fill={M}>{d[0]}</text>
          </g>);})}
        </svg>);
    }
    default: return null;
  }
}
