/**
 * FRANS VOOR 5 VWO: DE PASSÉ COMPOSÉ
 *
 * Dit kwam uit de eerste proef met de planlezer: een toets Frans over de passé
 * composé, en in de app stonden er voor Amaani twee vragen over, allebei over
 * wat het betekent en geen enkele waarin je hem zelf maakt. Voor 5 vwo is dat
 * de kern: het hulpwerkwoord kiezen, het participe passé goed hebben, en de
 * overeenkomst (accord) waar die hoort.
 *
 * Drie treden, zoals overal in deze aanvulling:
 *
 *   1  een regelmatig werkwoord met avoir, één stap
 *   2  een onregelmatig participe, of een werkwoord met être
 *   3  de accord: bij être, bij een wederkerend werkwoord, bij een lijdend
 *      voorwerp dat vóór avoir staat, en de gevallen waar hij juist níet hoort
 *
 * Het onderwerp heet `Passé composé`, precies zoals het al in de app stond, zodat
 * deze vragen op dezelfde tegel landen in plaats van ernaast.
 *
 * WAAROM `metVarianten`
 *
 * De nakijker vergelijkt letterlijk, op hoofdletters en spaties na. Een kind dat
 * op een telefoon "mange" typt in plaats van "mangé", of "j'ai" met een rechte
 * apostrof in plaats van "j’ai", heeft het in een toets op papier goed. Dus
 * krijgt elk antwoord die varianten erbij. De nakijker zelf blijft zoals hij is:
 * die wordt door de gouden waarden gelijk gehouden met de oude app.
 */
import type { Opgave } from './soorten'

type Ruw = Omit<Opgave, 'id'>

const zonderAccent = (s: string): string => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Een antwoord met de spellingen die een toetsenbord oplevert: zonder accenten,
 *  met een rechte of een gekrulde apostrof, en œ als oe. */
export function metVarianten(e: Ruw): Ruw {
  const basis = [e.a, ...(e.alt ?? [])]
  const erbij = new Set<string>()
  for (const b of basis) {
    for (const v of [b, b.replace(/’/g, "'"), b.replace(/'/g, '’')]) {
      erbij.add(v)
      erbij.add(zonderAccent(v))
      erbij.add(zonderAccent(v).replace(/œ/g, 'oe'))
    }
  }
  erbij.delete(e.a)
  return { ...e, alt: [...erbij] }
}

const HULP_ETRE = 'Met être: de werkwoorden van beweging en verandering van toestand (aller, venir, arriver, partir, entrer, sortir, monter, descendre, naître, mourir, rester, tomber, retourner, devenir) en alle wederkerende werkwoorden.'

const RUW: Ruw[] = [
  /* Trede 1: avoir en een regelmatig participe. */
  {p:'amaani',v:'frans',t:'Passé composé',lvl:1,q:'Zet in de passé composé: je parle',a:'j’ai parlé',h:['avoir + participe passé.','-er wordt -é.'],s:'parler is een -er-werkwoord: participe passé parlé.\nje + ai wordt j’ai.\nDus: j’ai parlé.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:1,q:'Zet in de passé composé: tu manges',a:'tu as mangé',h:['avoir + participe passé.','-er wordt -é.'],s:'tu as + mangé.\nDus: tu as mangé.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:1,q:'Zet in de passé composé: il finit',a:'il a fini',h:['avoir + participe passé.','-ir wordt -i.'],s:'finir: participe passé fini.\nil a + fini.\nDus: il a fini.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:1,q:'Zet in de passé composé: nous attendons',a:'nous avons attendu',h:['avoir + participe passé.','-re wordt -u.'],s:'attendre: participe passé attendu.\nnous avons + attendu.\nDus: nous avons attendu.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:1,q:'Zet in de passé composé: vous choisissez',a:'vous avez choisi',h:['avoir + participe passé.','choisir is een -ir-werkwoord.'],s:'choisir: participe passé choisi.\nvous avez + choisi.\nDus: vous avez choisi.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:1,q:'Zet in de passé composé: elles vendent',a:'elles ont vendu',h:['avoir + participe passé.','-re wordt -u.'],s:'vendre: participe passé vendu.\nelles ont + vendu.\nDus: elles ont vendu.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:1,q:'Wat is het participe passé van "regarder"?',a:'regardé',h:['-er wordt -é.'],s:'regarder → regardé.'},

  /* Trede 2: onregelmatige participes, en être als hulpwerkwoord. */
  {p:'amaani',v:'frans',t:'Passé composé',lvl:2,q:'Vul het participe passé in: nous avons ___ nos devoirs (faire)',a:'fait',h:['faire is onregelmatig.'],s:'faire → fait.\nnous avons fait nos devoirs.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:2,q:'Vul het participe passé in: tu as ___ le bus (prendre)',a:'pris',h:['prendre is onregelmatig.','Denk aan apprendre en comprendre: dezelfde uitgang.'],s:'prendre → pris.\ntu as pris le bus.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:2,q:'Vul het participe passé in: ils ont ___ le film (voir)',a:'vu',h:['voir is onregelmatig, en kort.'],s:'voir → vu.\nils ont vu le film.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:2,q:'Vul het participe passé in: j’ai ___ de la chance (avoir)',a:'eu',h:['Het participe van avoir is twee letters.'],s:'avoir → eu.\nj’ai eu de la chance.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:2,q:'Vul het participe passé in: il a ___ malade toute la semaine (être)',a:'été',h:['être zelf krijgt avoir als hulpwerkwoord.'],s:'être → été, en het hulpwerkwoord is avoir.\nil a été malade.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:2,q:'Vul het participe passé in: elle a ___ une lettre (écrire)',a:'écrit',h:['écrire is onregelmatig.','Zelfde uitgang als dire → dit.'],s:'écrire → écrit.\nelle a écrit une lettre.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:2,q:'Vul het participe passé in: vous avez ___ ce livre ? (lire)',a:'lu',h:['lire is onregelmatig, en kort.'],s:'lire → lu.\nvous avez lu ce livre ?'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:2,q:'Vul het hulpwerkwoord in: je ___ allé au cinéma.',a:'suis',h:[HULP_ETRE],s:'aller is een werkwoord van beweging: hulpwerkwoord être.\nje suis allé.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:2,q:'Vul het hulpwerkwoord in: nous ___ restés à la maison.',a:'sommes',h:[HULP_ETRE],s:'rester hoort bij de être-werkwoorden.\nnous sommes restés.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:2,q:'Vul het hulpwerkwoord in: ils ___ partis hier.',a:'sont',h:[HULP_ETRE],s:'partir: hulpwerkwoord être.\nils sont partis.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:2,q:'Vul het hulpwerkwoord in: tu ___ tombé dans l’escalier ?',a:'es',h:[HULP_ETRE],s:'tomber: hulpwerkwoord être.\ntu es tombé.'},

  /* Trede 3: de accord, en waar hij juist niet hoort. */
  {p:'amaani',v:'frans',t:'Passé composé',lvl:3,q:'Vul het participe passé in, met de juiste uitgang: elle est ___ hier soir (arriver)',a:'arrivée',h:['Bij être past het participe zich aan het onderwerp aan.','elle is vrouwelijk enkelvoud: + e.'],s:'arriver gaat met être, dus het participe krijgt de vorm van het onderwerp.\nelle (v. ev.) → arrivée.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:3,q:'Vul het participe passé in, met de juiste uitgang: mes sœurs sont ___ à Paris (partir)',a:'parties',h:['Bij être past het participe zich aan het onderwerp aan.','mes sœurs is vrouwelijk meervoud: + es.'],s:'partir gaat met être.\nmes sœurs (v. mv.) → parties.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:3,q:'Vul het participe passé in, met de juiste uitgang: ils se sont ___ tôt (lever)',a:'levés',h:['se lever is wederkerend: hulpwerkwoord être.','ils is mannelijk meervoud: + s.'],s:'Wederkerende werkwoorden gaan altijd met être.\nse is hier het lijdend voorwerp en staat vóór het werkwoord, dus accord.\nils (m. mv.) → levés.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:3,q:'Vul het participe passé in, met de juiste uitgang: elle s’est ___ (laver)',a:'lavée',h:['se laver is wederkerend: hulpwerkwoord être.','Wat wast ze? Zichzelf.'],s:'se is het lijdend voorwerp (ze wast zichzelf) en staat ervóór.\nDus accord: lavée.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:3,q:'Vul het participe passé in, met de juiste uitgang: elle s’est ___ les mains (laver)',a:'lavé',h:['Wat wast ze hier? Niet zichzelf, maar les mains.','Het lijdend voorwerp staat ná het werkwoord.'],s:'Het lijdend voorwerp is les mains, en dat staat achter het werkwoord.\nse is hier meewerkend voorwerp (ze wast de handen van zichzelf).\nDus géén accord: elle s’est lavé les mains.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:3,q:'Vul het participe passé in, met de juiste uitgang: les pommes ? Je les ai ___ (manger)',a:'mangées',h:['Bij avoir meestal geen accord, behalve als het lijdend voorwerp ervóór staat.','les verwijst naar les pommes: vrouwelijk meervoud.'],s:'Met avoir past het participe zich aan het lijdend voorwerp aan als dat vóór het werkwoord staat.\nles = les pommes (v. mv.), en staat ervóór.\nDus: je les ai mangées.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:3,q:'Zet in de passé composé, ontkennend: je ne mange pas',a:'je n’ai pas mangé',h:['ne ... pas staat om het hulpwerkwoord heen.','je ai wordt j’ai, en ne ai wordt n’ai.'],s:'De ontkenning komt om het hulpwerkwoord: ne + ai + pas.\nje n’ai pas mangé.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:3,q:'Zet in de passé composé: elle va au marché',a:'elle est allée au marché',h:['aller gaat met être.','Denk aan de accord met elle.'],s:'aller → être als hulpwerkwoord.\nelle est allée: accord met elle (v. ev.).\nDus: elle est allée au marché.'},
  {p:'amaani',v:'frans',t:'Passé composé',lvl:3,q:'Kies het hulpwerkwoord: il ___ descendu la valise.',a:'a',opties:['a','est'],h:['Kijk of er een lijdend voorwerp staat.','Met een lijdend voorwerp gaan monter, descendre, sortir en rentrer met avoir.'],s:'Hier staat een lijdend voorwerp: la valise. Hij brengt iets naar beneden.\nDan gaat descendre met avoir: il a descendu la valise.\nZonder lijdend voorwerp is het être: il est descendu (hij is naar beneden gegaan).'},
]

/** De passé composé voor 5 vwo, met de spellingvarianten erbij. Nog zonder id:
 *  die krijgt hij in `schooljaar2627.ts`, achter de rest, zodat geen enkele
 *  bestaande id verschuift. */
export const FRANS_5VWO: Ruw[] = RUW.map(metVarianten)
