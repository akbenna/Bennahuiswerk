/**
 * DE GETEKENDE HOUDINGEN EN TAFERELEN
 *
 * Geen foto's en geen video van buitenaf: alles is hier getekend, zodat het
 * offline werkt, scherp blijft op elk scherm en meebeweegt met licht en
 * donker. De figuur staat opzij, met de qibla naar rechts.
 *
 * Profeten worden niet afgebeeld. Dat is geen technische beperking maar een
 * uitgangspunt, en het is precies wat kinderboeken in deze traditie al eeuwen
 * doen: teken de plek, niet de persoon. De ark, het vuur dat koel werd, de
 * twee heuvels, de put onder de sterren.
 */

/* Het kleed met, aan de rechterkant, de kant waar je je naartoe richt. */
export const KLEED ='<path class="fig-kleed" d="M24 205 h268 a7 7 0 0 1 0 14 H24 a7 7 0 0 1 0-14 z"/>'
  + '<path class="fig-mihrab" d="M262 196 h22 m-7-6 7 6-7 6"/>'
  + '<text x="273" y="182" text-anchor="middle" class="fig-qibla">قبلة</text>';

/* De figuur staat opzij, met de qibla naar rechts. Twee benen en twee armen,
   licht uit elkaar getekend, zodat je ziet dat het een mens is en geen streep. */
export const HOUDING: Record<string, string> = {
  staan: `<circle class="fig-kop" cx="152" cy="50" r="15"/>
    <path class="fig-lijn" d="M152 66 V138"/>
    <path class="fig-lijn fig-ver" d="M149 80 C141 102 140 120 142 136"/>
    <path class="fig-lijn" d="M156 80 C164 102 164 120 162 136"/>
    <path class="fig-lijn fig-ver" d="M152 138 L162 204 M162 204 H184"/>
    <path class="fig-lijn" d="M152 138 L146 204 M146 204 H168"/>`,
  takbir: `<circle class="fig-kop" cx="152" cy="50" r="15"/>
    <path class="fig-lijn" d="M152 66 V138"/>
    <path class="fig-lijn fig-ver" d="M150 80 L129 90 L127 62"/>
    <path class="fig-lijn" d="M155 80 L136 85 L134 56"/>
    <path class="fig-lijn fig-ver" d="M152 138 L162 204 M162 204 H184"/>
    <path class="fig-lijn" d="M152 138 L146 204 M146 204 H168"/>`,
  ruku: `<circle class="fig-kop" cx="216" cy="94" r="15"/>
    <path class="fig-lijn" d="M148 120 L200 102"/>
    <path class="fig-lijn fig-ver" d="M201 107 L164 162"/>
    <path class="fig-lijn" d="M198 103 L157 157"/>
    <path class="fig-lijn fig-ver" d="M150 121 L162 164 L164 204 M164 204 H186"/>
    <path class="fig-lijn" d="M148 120 L153 163 L151 204 M151 204 H173"/>`,
  sujud: `<circle class="fig-kop" cx="212" cy="189" r="15"/>
    <path class="fig-lijn" d="M148 156 L194 179"/>
    <path class="fig-lijn fig-ver" d="M196 183 L209 205"/>
    <path class="fig-lijn" d="M192 178 L202 205"/>
    <path class="fig-lijn fig-ver" d="M151 157 L161 204 L120 202 L112 206"/>
    <path class="fig-lijn" d="M148 156 L153 204 L112 203 L104 207"/>`,
  zitten: `<circle class="fig-kop" cx="166" cy="98" r="15"/>
    <path class="fig-lijn" d="M150 180 L163 114"/>
    <path class="fig-lijn fig-ver" d="M158 124 L188 176"/>
    <path class="fig-lijn" d="M161 120 L194 180"/>
    <path class="fig-lijn" d="M150 180 L198 187 L154 202 L128 205"/>`,
  salam: `<circle class="fig-kop" cx="181" cy="96" r="15"/>
    <path class="fig-lijn" d="M150 180 L166 113"/>
    <path class="fig-lijn fig-ver" d="M160 124 L188 176"/>
    <path class="fig-lijn" d="M164 119 L194 180"/>
    <path class="fig-lijn" d="M150 180 L198 187 L154 202 L128 205"/>
    <path class="fig-mark" d="M198 82 A30 30 0 0 1 211 104"/>`
};
export const TAFEREEL: Record<string, string> = {
  /* Adam — een tuin met één boom apart */
  l1501:`<rect class="t-lucht" x="0" y="0" width="400" height="150"/>
    <path class="t-grond" d="M0 150 h400 v70 H0 z"/>
    <path class="t-vorm" d="M70 150 v-34 M56 116 a14 14 0 0 1 28 0 a14 14 0 0 1-28 0" />
    <path class="t-vorm" d="M120 150 v-44 M104 106 a16 16 0 0 1 32 0 a16 16 0 0 1-32 0"/>
    <path class="t-vlak" d="M300 150 v-52 M274 98 a26 26 0 0 1 52 0 a26 26 0 0 1-52 0"/>
    <path class="t-vorm" d="M300 150 v-52 M274 98 a26 26 0 0 1 52 0 a26 26 0 0 1-52 0"/>
    <circle class="t-accent" cx="288" cy="96" r="5"/><circle class="t-accent" cx="310" cy="104" r="5"/>
    <path class="t-lijn" d="M0 176 C120 168 260 184 400 174"/>`,
  /* Nuh — een ark op hoog water, met regen */
  l1502:`<rect class="t-lucht" x="0" y="0" width="400" height="150"/>
    ${[...Array(16)].map((_,i)=>`<path class="t-lijn" d="M${18+i*24} 14 l-6 26"/>`).join('')}
    <path class="t-vlak" d="M0 150 c40-10 70 10 110 0 s70-12 110 0 s70 10 110 0 s60-8 70-2 V220 H0 z"/>
    <path class="t-vorm" d="M132 146 h140 l-18 30 H150 z"/>
    <path class="t-vorm" d="M168 146 v-30 h68 v30"/>
    <path class="t-vorm" d="M202 116 v-26"/>
    <path class="t-lijn" d="M0 186 c60-8 110 8 170 0 s110-10 230 0"/>`,
  /* Ibrahim — een vuur dat koel bleef: de vlam laait, het hart is koel */
  l1503:`<rect class="t-lucht" x="0" y="0" width="400" height="150"/>
    <path class="t-grond" d="M0 150 h400 v70 H0 z"/>
    <path class="t-vlak" d="M200 30 c8 30 30 40 34 66 a34 34 0 0 1-68 0 c0-16 10-24 14-40 c10 12 12 22 12 22 c4-20-2-34 8-48 z"/>
    <path class="t-vorm" d="M200 30 c8 30 30 40 34 66 a34 34 0 0 1-68 0 c0-16 10-24 14-40 c10 12 12 22 12 22 c4-20-2-34 8-48 z"/>
    <path class="t-vlak" d="M146 58 c6 22 22 30 22 50 a22 22 0 0 1-44 0 c0-12 7-17 10-28 c7 9 9 15 9 15 c3-14-2-24 3-37 z" opacity=".1"/>
    <path class="t-lijn" d="M146 58 c6 22 22 30 22 50 a22 22 0 0 1-44 0 c0-12 7-17 10-28 c7 9 9 15 9 15 c3-14-2-24 3-37 z"/>
    <path class="t-vlak" d="M262 68 c5 18 19 26 19 42 a19 19 0 0 1-38 0 c0-10 6-15 9-24 c6 8 7 13 7 13 c3-12-1-20 3-31 z" opacity=".1"/>
    <path class="t-lijn" d="M262 68 c5 18 19 26 19 42 a19 19 0 0 1-38 0 c0-10 6-15 9-24 c6 8 7 13 7 13 c3-12-1-20 3-31 z"/>
    <path class="t-accent" d="M200 92 c5 12 12 17 12 25 a12 12 0 0 1-24 0 c0-8 7-13 12-25 z" opacity=".35"/>
    <path class="t-lijn" d="M96 150 h208"/>`,
  /* Hajar — twee heuvels met een bron ertussen */
  l1504:`<rect class="t-lucht" x="0" y="0" width="400" height="150"/>
    <path class="t-vlak" d="M0 150 L96 62 L176 150 z"/><path class="t-vorm" d="M0 150 L96 62 L176 150"/>
    <path class="t-vlak" d="M224 150 L304 76 L400 150 z"/><path class="t-vorm" d="M224 150 L304 76 L400 150"/>
    <path class="t-grond" d="M0 150 h400 v70 H0 z"/>
    <path class="t-accent" d="M200 150 v34"/>
    <ellipse class="t-vlak" cx="200" cy="192" rx="46" ry="12"/>
    <ellipse class="t-vorm" cx="200" cy="192" rx="46" ry="12"/>
    <path class="t-lijn" d="M96 62 v-14 M304 76 v-14"/>`,
  /* Yusuf — een put onder elf sterren, de zon en de maan */
  l1505:`<rect class="t-lucht" x="0" y="0" width="400" height="150"/>
    ${[[40,34],[78,20],[116,40],[150,22],[188,36],[226,20],[262,40],[298,26],[330,44],[358,24],[64,58]]
      .map(([x,y])=>`<circle class="t-accent" cx="${x}" cy="${y}" r="3"/>`).join('')}
    <circle class="t-vlak" cx="320" cy="80" r="20"/><circle class="t-vorm" cx="320" cy="80" r="20"/>
    ${[0,45,90,135].map(a=>`<path class="t-lijn" d="M320 52 v-10" transform="rotate(${a} 320 80)"/>`).join('')}
    <path class="t-vlak" d="M96 56 A22 22 0 1 0 96 100 A17 17 0 1 1 96 56 Z"/>
    <path class="t-vorm" d="M96 56 A22 22 0 1 0 96 100 A17 17 0 1 1 96 56 Z"/>
    <path class="t-grond" d="M0 150 h400 v70 H0 z"/>
    <path class="t-vorm" d="M150 150 v-8 h100 v8"/>
    <path class="t-vlak" d="M158 150 h84 v58 h-84 z"/>
    <path class="t-vorm" d="M158 150 h84 v58 h-84 z M186 102 h28 M200 102 v10"/>
    <ellipse class="t-grond" cx="200" cy="150" rx="42" ry="9"/>
    <ellipse class="t-vorm" cx="200" cy="150" rx="42" ry="9"/>
    <path class="t-vorm" d="M186 102 v-6 h28 v6"/>
    <path class="t-accent" d="M200 112 v30"/>`,
  /* Musa — de zee die openging */
  l1506:`<rect class="t-lucht" x="0" y="0" width="400" height="150"/>
    <path class="t-vlak" d="M0 118 c40-8 70 6 100 2 c26-4 36 8 40 18 v82 H0 z"/>
    <path class="t-vlak" d="M400 118 c-40-8-70 6-100 2 c-26-4-36 8-40 18 v82 h140 z"/>
    <path class="t-vorm" d="M0 118 c40-8 70 6 100 2 c26-4 36 8 40 18 v82 M400 118 c-40-8-70 6-100 2 c-26-4-36 8-40 18 v82"/>
    <path class="t-grond" d="M140 220 h120 v-82 h-120 z"/>
    <path class="t-lijn" d="M170 214 v-58 M200 216 v-64 M230 214 v-58"/>
    <circle class="t-accent" cx="200" cy="46" r="16"/>`,
  /* Al-Khidr — de boot met het gat, en de muur */
  l1507:`<rect class="t-lucht" x="0" y="0" width="400" height="150"/>
    <path class="t-vlak" d="M0 150 c50-8 90 8 140 0 s90-10 140 0 s90 8 120 0 V220 H0 z"/>
    <path class="t-vorm" d="M40 142 h130 l-16 26 H56 z"/>
    <circle class="t-grond" cx="104" cy="152" r="9"/>
    <path class="t-vorm" d="M104 152 m-9 0 a9 9 0 1 0 18 0 a9 9 0 1 0 -18 0"/>
    <path class="t-vorm" d="M100 142 v-24"/>
    <path class="t-vlak" d="M250 176 h110 v44 H250 z"/>
    <path class="t-vorm" d="M250 176 h110 v44 H250 z M250 198 h110 M286 176 v22 M322 198 v22"/>
    <path class="t-accent" d="M300 214 a10 10 0 0 1 20 0" opacity=".6"/>`,
  /* Yunus — drie duisternissen: de nacht, de zee, en daaronder */
  l1508:`<rect class="t-lucht" x="0" y="0" width="400" height="88"/>
    <path class="t-vlak" d="M324 22 A19 19 0 1 0 324 60 A15 15 0 1 1 324 22 Z"/>
    <path class="t-vorm" d="M324 22 A19 19 0 1 0 324 60 A15 15 0 1 1 324 22 Z"/>
    <path class="t-vlak" d="M0 88 c50 8 90-6 140 0 s90 10 140 0 s90-8 120 0 V150 H0 z"/>
    <path class="t-grond" d="M0 150 h400 v70 H0 z" opacity=".5"/>
    <path class="t-grond" d="M0 186 h400 v34 H0 z" opacity=".7"/>
    <path class="t-lijn" d="M0 118 c60 8 110-6 170 0 s110 8 230 0 M0 158 c60 6 110-6 170 0 s110 8 230 0"/>
    <circle class="t-accent" cx="200" cy="200" r="4"/>`,
  /* Ayyub — een kale boom, en water bij de wortel */
  l1509:`<rect class="t-lucht" x="0" y="0" width="400" height="150"/>
    <path class="t-grond" d="M0 150 h400 v70 H0 z"/>
    <path class="t-vorm" d="M200 150 V70 M200 108 l-30-24 M200 96 l30-26 M200 128 l-24-16 M200 84 l16-20"/>
    <ellipse class="t-vlak" cx="200" cy="182" rx="54" ry="13"/>
    <ellipse class="t-vorm" cx="200" cy="182" rx="54" ry="13"/>
    <circle class="t-accent" cx="330" cy="52" r="18"/>
    <path class="t-lijn" d="M290 52 h-14 M330 12 v-8"/>`,
  /* Sulayman — een wijd dal met een smal pad */
  l1510:`<rect class="t-lucht" x="0" y="0" width="400" height="126"/>
    <path class="t-vlak" d="M0 126 c60-30 110 12 180-10 s130-28 220 6 V220 H0 z"/>
    <path class="t-vorm" d="M0 126 c60-30 110 12 180-10 s130-28 220 6"/>
    <path class="t-grond" d="M0 168 c80-16 150 18 240 4 s120-14 160-6 V220 H0 z"/>
    <path class="t-lijn" d="M60 220 C120 190 150 186 200 176 S300 166 360 150"/>
    <circle class="t-accent" cx="212" cy="188" r="3"/>
    <path class="t-lijn" d="M196 196 c8-4 16-6 26-8 M188 202 c10-5 22-8 34-10" opacity=".55"/>`,
  /* Maryam — de palm met dadels, en het beekje eronder */
  l1511:`<rect class="t-lucht" x="0" y="0" width="400" height="150"/>
    <path class="t-grond" d="M0 150 h400 v70 H0 z"/>
    <path class="t-vorm" d="M200 150 C196 120 198 96 200 74"/>
    <path class="t-vorm" d="M200 74 C170 62 146 66 132 82 M200 74 C230 62 254 66 268 82 M200 74 C176 54 152 50 138 56 M200 74 C224 54 248 50 262 56 M200 74 C194 50 190 40 194 30 M200 74 C206 50 210 40 206 30"/>
    <circle class="t-accent" cx="190" cy="86" r="4"/><circle class="t-accent" cx="208" cy="90" r="4"/><circle class="t-accent" cx="199" cy="98" r="4"/>
    <path class="t-vlak" d="M0 190 c60-10 110 10 170 4 s110-12 230-2 V220 H0 z"/>
    <path class="t-lijn" d="M0 194 c60-10 110 10 170 4 s110-12 230-2"/>`,
  /* De grot — een opening in de rots met licht dat naar binnen valt */
  l1512:`<rect class="t-lucht" x="0" y="0" width="400" height="220"/>
    <path class="t-vlak" d="M0 0 h400 v220 H0 z" opacity=".5"/>
    <path class="t-grond" d="M0 0 h400 v220 H0 z" opacity=".55"/>
    <path class="t-lucht" d="M200 46 c46 0 84 40 84 92 c0 34-18 62-42 76 h-84 c-24-14-42-42-42-76 c0-52 38-92 84-92 z"/>
    <path class="t-vorm" d="M200 46 c46 0 84 40 84 92 c0 34-18 62-42 76 h-84 c-24-14-42-42-42-76 c0-52 38-92 84-92 z"/>
    <path class="t-accent" d="M172 214 l28-96 l28 96 z" opacity=".35"/>
    <path class="t-lijn" d="M60 214 h280"/>`,
  /* Luqman — een opengeslagen boek onder een lamp, met het mosterdzaadje */
  l1513:`<rect class="t-lucht" x="0" y="0" width="400" height="150"/>
    <path class="t-grond" d="M0 150 h400 v70 H0 z"/>
    <path class="t-vorm" d="M200 16 v26 M182 42 h36 l10 22 h-56 z"/>
    <path class="t-accent" d="M200 64 v34" opacity=".4"/>
    <path class="t-vlak" d="M96 160 c34-20 68-20 104-6 c36-14 70-14 104 6 l-12 34 c-32-18-68-18-92-6 c-24-12-60-12-92 6 z"/>
    <path class="t-vorm" d="M96 160 c34-20 68-20 104-6 c36-14 70-14 104 6 M200 154 v34 M112 168 c28-12 54-12 74-2 M288 168 c-28-12-54-12-74-2"/>
    <circle class="t-accent" cx="344" cy="196" r="4"/>
    <path class="t-lijn" d="M344 196 m-15 0 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0" opacity=".45"/>`
};
