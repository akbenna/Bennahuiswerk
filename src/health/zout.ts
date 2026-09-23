/**
 * ZOUT: één omrekening, en waarom hij op één plek hoort
 *
 * De database levert natrium in milligram; op een etiket staat zout in gram. Dat
 * zijn twee schrijfwijzen van hetzelfde, en wie ze door elkaar haalt zit er een
 * factor tweeënhalf naast, ruim genoeg om een advies om te draaien.
 *
 * De omrekening is vastgelegd in de Europese etiketteringsverordening
 * 1169/2011, bijlage I: het zoutgehalte is het natriumgehalte maal 2,5. Dat is
 * een afspraak en geen meting; de zuivere molaire verhouding tussen
 * natriumchloride en natrium is 2,54. De verordening rondt af op 2,5 en dat is
 * het getal dat op elk pak in de supermarkt staat. Deze app volgt het etiket,
 * want daar vergelijkt de gebruiker mee.
 *
 * WAT ER OP HET SCHERM KOMT
 *
 * Zout, niet natrium. Niet omdat het nauwkeuriger is (het is dezelfde waarde) 
 * maar omdat het het woord is dat op de verpakking staat en in de spreekkamer
 * valt. "Twee gram zout" zegt iemand iets; "achthonderd milligram natrium" niet.
 *
 * WAAROM DIT EEN EIGEN BESTAND IS VOOR ÉÉN FORMULE
 *
 * Omdat de verleiding is om hem twee keer op te schrijven: één keer in de
 * database bij het ophalen en één keer in het scherm bij het tonen. Twee
 * implementaties van dezelfde som lopen uiteen zodra er één verandert, en dan
 * staat er ergens een getal dat nergens meer bij hoort. Bestand
 * `health/database/30-natrium-in-het-zoeken.sql` levert daarom natrium zoals het
 * in de tabel staat, en het omrekenen gebeurt hier.
 */

/** Etiketteringsverordening (EU) 1169/2011, bijlage I: zout = natrium x 2,5. */
export const ZOUTFACTOR = 2.5

/**
 * Milligram natrium naar gram zout.
 *
 * Null blijft null. Een product waarvan het natrium niet bekend is heeft geen
 * zoutwaarde van nul, het heeft er geen, en dat is iets anders. Het scherm
 * hoort daar een streepje te tonen en geen 0,0.
 */
export function zoutGram(natriumMg: number | null | undefined): number | null {
  if (natriumMg == null || !Number.isFinite(natriumMg)) return null
  return (natriumMg * ZOUTFACTOR) / 1000
}
