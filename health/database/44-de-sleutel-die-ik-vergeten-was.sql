-- ===========================================================================
-- 44 — DE SLEUTEL DIE IK VERGETEN WAS
-- ===========================================================================
--
-- TOEGEPAST: nee.
--
-- WAAROM DIT BESTAND BESTAAT
--
-- `kal_inspanning` uit bestand 43 heeft een `gebruiker_id`, en verder niets dat
-- zegt waar dat naar verwijst. Alle vijftien andere tabellen met zo'n kolom
-- hebben hem wél:
--
--   alter table public.kal_training
--     add constraint kal_training_gebruiker_id_fkey
--     foreign key (gebruiker_id) references kal_gebruikers(id) on delete cascade;
--
-- Vijftien van de zestien is geen conventie meer maar een uitzondering, en een
-- uitzondering die niemand heeft gekozen is een vergissing.
--
-- WAT HET VERSCHIL UITMAAKT
--
-- Twee dingen, en het tweede is het ergste.
--
-- Een gebruiker wissen laat zijn inspanningsrijen staan. Overal elders ruimt
-- `on delete cascade` ze op; hier blijven ze liggen met een `gebruiker_id` die
-- nergens meer naar wijst. Dat is geen lek — de functies vragen altijd naar een
-- sessie, en die bestaat dan niet meer — maar het is wel bewaarde gezondheids-
-- informatie van iemand die verwijderd is. Dat is precies wat je níet wilt.
--
-- En een typfout in een `gebruiker_id` wordt nergens tegengehouden. Overal
-- elders weigert de database een rij die naar een niet-bestaande gebruiker
-- wijst; in deze tabel zou hij er stil bijkomen. Dat is de soort fout die pas
-- opvalt als iemand zijn eigen lijst niet meer terugvindt.
--
-- WAAROM EERST GETELD EN DAN PAS GEKOPPELD
--
-- Een `alter table ... add constraint` valt om als er al een rij staat die er
-- niet doorheen komt, met een melding die niet zegt wélke. Deze doet dat
-- andersom: eerst tellen, en als er wezen zijn dan stoppen met een tekst die
-- zegt hoeveel. Dan kun je beslissen in plaats van raden.
--
-- Twee keer draaien voegt niets toe: staat de sleutel er al, dan doet dit
-- bestand niets.
--
-- TERUGDRAAIEN
--
--   alter table public.kal_inspanning drop constraint kal_inspanning_gebruiker_id_fkey;
--
-- Er gaat geen rij verloren; alleen de bewaking verdwijnt weer.
-- ===========================================================================

BEGIN;

do $$
declare v_wezen integer;
begin
  if exists (select 1 from pg_constraint
              where conname = 'kal_inspanning_gebruiker_id_fkey'
                and conrelid = 'public.kal_inspanning'::regclass) then
    raise notice 'De sleutel staat er al; dit bestand doet niets.';
    return;
  end if;

  select count(*) into v_wezen
    from kal_inspanning i
   where not exists (select 1 from kal_gebruikers g where g.id = i.gebruiker_id);

  if v_wezen > 0 then
    raise exception
      '% rij(en) in kal_inspanning wijzen naar een gebruiker die niet bestaat. '
      'Kijk ze na voordat je koppelt: select distinct gebruiker_id from kal_inspanning i '
      'where not exists (select 1 from kal_gebruikers g where g.id = i.gebruiker_id);', v_wezen;
  end if;

  alter table public.kal_inspanning
    add constraint kal_inspanning_gebruiker_id_fkey
    foreign key (gebruiker_id) references kal_gebruikers(id) on delete cascade;

  raise notice 'Sleutel toegevoegd; % wees gevonden.', v_wezen;
end $$;

COMMIT;


-- ===========================================================================
-- NAKIJKEN
-- ===========================================================================
--
--   select conname, confdeltype from pg_constraint
--    where conrelid = 'public.kal_inspanning'::regclass and contype = 'f';
--
--     verwacht: kal_inspanning_gebruiker_id_fkey · c   (c = cascade)
--
-- En nog eens draaien hoort "De sleutel staat er al" te zeggen en verder niets.
-- ===========================================================================
