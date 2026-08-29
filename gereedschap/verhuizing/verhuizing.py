#!/usr/bin/env python3
"""
DE VERHUIZING VAN BENNAHUB

Brengt het schema en de gegevens van de hub uit het gedeelde ProVita-project
naar de eigen database. Draait op deze machine, want alleen hier komen de twee
kanten samen.

De DDL wordt niet hier verzonnen. Het bronproject levert hem zelf, via de
functie `hub_verhuis_ddl()`, en dit script voert hem uit aan de doelkant. Er
wordt dus niets overgetypt en er kan bij het overtypen ook niets wegvallen. De
gegenereerde SQL gaat wel naar schema-gegenereerd.sql, zodat er een leesbaar
verslag van blijft.

Sleutels staan in `verhuizing.local` in de wortel van de repo. Die naam valt
onder de regel `*.local` in .gitignore en kan dus niet mee een commit in.

    BRON_URL=https://jnlvvdaisyerhxucxnuu.supabase.co
    BRON_KEY=<service_role-sleutel van het gedeelde project>

Voor de doelkant zijn er twee wegen. De eerste heeft geen databasewachtwoord
nodig en is daarom de eenvoudigste:

    DOEL_REF=huiuvnjrvvoybbzwfrfp
    DOEL_PAT=<persoonlijk toegangstoken, account settings -> access tokens>

De tweede gaat rechtstreeks naar Postgres, langs de pooler:

    DOEL_DSN=postgresql://postgres.<ref>:<wachtwoord>@<pooler-host>:5432/postgres

Staat het token er, dan wint dat. Zet `chmod 600` op het bestand; en trek het
token na afloop weer in.

    python3 gereedschap/verhuizing/verhuizing.py --schema
    python3 gereedschap/verhuizing/verhuizing.py --data
    python3 gereedschap/verhuizing/verhuizing.py --controle
    python3 gereedschap/verhuizing/verhuizing.py --alles
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

HIER = os.path.dirname(os.path.abspath(__file__))
WORTEL = os.path.dirname(os.path.dirname(HIER))
ENV = os.path.join(WORTEL, "verhuizing.local")
SCHEMABESTAND = os.path.join(HIER, "schema-gegenereerd.sql")
RECHTENBESTAND = os.path.join(HIER, "rechten-gegenereerd.sql")
PAGINA = 1000
BATCH = 100

# Volgorde is de volgorde van de sleutels: waar naar verwezen wordt gaat eerst.
# Bij cultural_dishes gaan alleen de gevalideerde basisrecepten mee; een
# persoonlijke variant van een patient hoort in de zorgdatabase te blijven.
TABELLEN = [
    ("nevo_versies", None),
    ("nevo_foods", None),
    ("voeding_portiematen", None),
    ("cultural_dishes", "owner_patient_id=is.null"),
    ("dish_ingredients", "kinderen_van_gerecht"),
    ("dish_portions", "kinderen_van_gerecht"),
    ("kal_gebruikers", None),
    ("kal_sessies", None),
    ("kal_profiel", None),
    ("kal_dagen", None),
    ("kal_regels", None),
    ("kal_producten", None),
    ("kal_recepten", None),
    ("kal_recept_regels", None),
    ("kal_metingen", None),
    ("kal_labs", None),
    ("kal_vragenlijsten", None),
    ("kal_training", None),
    ("kal_ai_log", None),
    ("kal_config", None),
    ("kal_prikkel_log", None),
    ("kal_koppelingen", None),
    ("kal_beweging_peilingen", None),
    ("kal_modelstand", None),
    ("bennahub_gezin", None),
    ("bennahub_leden", None),
    ("bennahub_state", None),
    ("oefenapp_state", None),
    ("oefenapp_challenges", None),
]

# Kolommen die aan de bronkant naar de zorgdatabase wijzen en daarginds niets
# betekenen. Ze gaan als NULL mee; de verwijzing zelf staat niet in het schema.
LEEG_MAKEN = {
    "cultural_dishes": ["created_by", "reviewed_by_clinician_id", "owner_patient_id"],
    "voeding_portiematen": ["gecontroleerd_door"],
}


def omgeving():
    if not os.path.exists(ENV):
        sys.exit("Geen " + ENV + ". Zie de kop van dit bestand voor wat erin hoort.")
    uit = {}
    for regel in open(ENV):
        regel = regel.strip()
        if not regel or regel.startswith("#") or "=" not in regel:
            continue
        k, v = regel.split("=", 1)
        uit[k.strip()] = v.strip()
    for k in ("BRON_URL", "BRON_KEY"):
        if not uit.get(k):
            sys.exit("Ontbreekt in " + ENV + ": " + k)
    if not (uit.get("DOEL_PAT") and uit.get("DOEL_REF")) and not uit.get("DOEL_DSN"):
        sys.exit("Zet in " + ENV + " ofwel DOEL_REF en DOEL_PAT, ofwel DOEL_DSN.")
    return uit


# ---------------------------------------------------------------- bronkant

def bron(o, pad, methode="GET", lichaam=None, extra=None):
    kop = {"apikey": o["BRON_KEY"], "Authorization": "Bearer " + o["BRON_KEY"],
           "Content-Type": "application/json"}
    if extra:
        kop.update(extra)
    data = json.dumps(lichaam).encode() if lichaam is not None else None
    r = urllib.request.Request(o["BRON_URL"] + pad, data=data, headers=kop, method=methode)
    try:
        with urllib.request.urlopen(r, timeout=180) as a:
            tekst = a.read().decode()
            return a.headers, (json.loads(tekst) if tekst else None)
    except urllib.error.HTTPError as e:
        sys.exit("\nbron " + methode + " " + pad + "\n  " + str(e.code) + ": " + e.read().decode()[:400])


def bron_telling(o, tabel, filter_):
    pad = "/rest/v1/" + tabel + "?select=*&limit=1" + (("&" + filter_) if filter_ else "")
    kop, _ = bron(o, pad, extra={"Prefer": "count=exact"})
    return int(kop.get("Content-Range", "*/0").split("/")[-1])


def bron_pagina(o, tabel, filter_, van, hoeveel):
    pad = "/rest/v1/" + tabel + "?select=*&offset=" + str(van) + "&limit=" + str(hoeveel)
    if filter_:
        pad += "&" + filter_
    _, rijen = bron(o, pad)
    return rijen or []


# ---------------------------------------------------------------- doelkant
# Twee wegen naar dezelfde database. De beheer-API is dezelfde weg die de
# SQL-editor in het dashboard gebruikt: geen wachtwoord, geen pooler, en hij
# slikt een heel script in een keer. De pooler blijft als terugval staan.

class DoelViaToken:
    naam = "beheer-API"

    def __init__(self, o):
        self.url = "https://api.supabase.com/v1/projects/" + o["DOEL_REF"] + "/database/query"
        self.pat = o["DOEL_PAT"]

    def sql(self, opdracht):
        data = json.dumps({"query": opdracht}).encode()
        r = urllib.request.Request(self.url, data=data, method="POST", headers={
            "Authorization": "Bearer " + self.pat,
            "Content-Type": "application/json",
            # Zonder herkenbare User-Agent weigert de rand van api.supabase.com
            # het verzoek met een 403 en foutcode 1010.
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                          "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"})
        try:
            with urllib.request.urlopen(r, timeout=300) as a:
                tekst = a.read().decode()
                return json.loads(tekst) if tekst else []
        except urllib.error.HTTPError as e:
            raise RuntimeError(str(e.code) + ": " + e.read().decode()[:600])

    def sluit(self):
        pass


class DoelViaPooler:
    naam = "pooler"

    def __init__(self, o):
        import pg8000.dbapi
        u = urllib.parse.urlparse(o["DOEL_DSN"])
        self.c = pg8000.dbapi.connect(
            user=urllib.parse.unquote(u.username or ""),
            password=urllib.parse.unquote(u.password or ""),
            host=u.hostname, port=u.port or 5432,
            database=(u.path or "/postgres").lstrip("/") or "postgres",
            ssl_context=True, timeout=60)
        self.c.autocommit = True

    def sql(self, opdracht):
        uit = []
        cur = self.c.cursor()
        for deel in splits_sql(opdracht):
            cur.execute(deel)
            if cur.description:
                namen = [k[0] for k in cur.description]
                uit = [dict(zip(namen, rij)) for rij in cur.fetchall()]
            else:
                uit = []
        return uit

    def sluit(self):
        self.c.close()


def doel(o):
    if o.get("DOEL_PAT") and o.get("DOEL_REF"):
        return DoelViaToken(o)
    return DoelViaPooler(o)


def splits_sql(tekst):
    """Knipt een script in losse opdrachten. De pooler praat het uitgebreide
    protocol en slikt maar een opdracht tegelijk; naief op de puntkomma knippen
    breekt elke functie met een $$-lichaam. Vandaar dat tekst tussen
    aanhalingstekens, dollartekens en commentaar hier wordt overgeslagen."""
    uit, huidig = [], []
    i, n = 0, len(tekst)
    while i < n:
        c = tekst[i]
        if c == "-" and tekst[i:i + 2] == "--":
            j = tekst.find("\n", i); j = n if j == -1 else j
            huidig.append(tekst[i:j]); i = j; continue
        if c == "/" and tekst[i:i + 2] == "/*":
            j = tekst.find("*/", i + 2); j = n if j == -1 else j + 2
            huidig.append(tekst[i:j]); i = j; continue
        if c == "'":
            j = i + 1
            while j < n:
                if tekst[j] == "'":
                    if tekst[j:j + 2] == "''":
                        j += 2; continue
                    j += 1; break
                j += 1
            huidig.append(tekst[i:j]); i = j; continue
        if c == '"':
            j = tekst.find('"', i + 1); j = n if j == -1 else j + 1
            huidig.append(tekst[i:j]); i = j; continue
        if c == "$":
            j = i + 1
            while j < n and (tekst[j].isalnum() or tekst[j] == "_"):
                j += 1
            if j < n and tekst[j] == "$":
                merk = tekst[i:j + 1]
                eind = tekst.find(merk, j + 1)
                eind = n if eind == -1 else eind + len(merk)
                huidig.append(tekst[i:eind]); i = eind; continue
        if c == ";":
            opdracht = "".join(huidig).strip()
            if opdracht:
                uit.append(opdracht)
            huidig = []; i += 1; continue
        huidig.append(c); i += 1
    rest = "".join(huidig).strip()
    if rest:
        uit.append(rest)
    return uit


# ---------------------------------------------------------------- waarden

def citeer(tekst):
    return "'" + str(tekst).replace("'", "''") + "'"


def sql_waarde(waarde, soort):
    """Een waarde uit de bron als SQL-fragment, met de cast naar het echte
    kolomtype erbij. Bij een verschil levert dat een duidelijke fout op in
    plaats van een stille verminking."""
    if waarde is None:
        return "null"
    if soort in ("json", "jsonb"):
        return citeer(json.dumps(waarde, ensure_ascii=False)) + "::" + soort
    if soort.endswith("[]"):
        if not isinstance(waarde, list):
            waarde = [waarde]
        delen = []
        for el in waarde:
            if el is None:
                delen.append("NULL")
            else:
                delen.append('"' + str(el).replace("\\", "\\\\").replace('"', '\\"') + '"')
        return citeer("{" + ",".join(delen) + "}") + "::" + soort
    if isinstance(waarde, bool):
        return ("true" if waarde else "false") + "::" + soort
    if isinstance(waarde, (int, float)) and soort not in ("text", "character varying"):
        return str(waarde) + "::" + soort
    if isinstance(waarde, (dict, list)):
        return citeer(json.dumps(waarde, ensure_ascii=False)) + "::" + soort
    return citeer(waarde) + "::" + soort


def kolomtypen(d, tabel):
    rijen = d.sql(
        "select column_name, udt_name, data_type from information_schema.columns "
        "where table_schema='public' and table_name=" + citeer(tabel) + " order by ordinal_position")
    uit = {}
    for r in rijen:
        naam, udt, soort = r["column_name"], r["udt_name"], r["data_type"]
        if soort == "ARRAY":
            uit[naam] = udt.lstrip("_") + "[]"
        elif soort == "USER-DEFINED":
            uit[naam] = udt
        else:
            uit[naam] = soort
    return uit


# ---------------------------------------------------------------- stappen

def stap_schema(o):
    print("Schema ophalen bij de bron ...", end=" ", flush=True)
    _, ddl = bron(o, "/rest/v1/rpc/hub_verhuis_ddl", "POST", {})
    if not isinstance(ddl, str) or len(ddl) < 1000:
        sys.exit("hub_verhuis_ddl() gaf niets bruikbaars terug.")
    open(SCHEMABESTAND, "w").write(ddl)
    print(str(len(ddl)) + " tekens, bewaard in " + os.path.basename(SCHEMABESTAND))

    # Postgres geeft nieuwe functies standaard uitvoerrecht aan PUBLIC, dus in
    # een verse database staat alles open tot dit erbij komt.
    print("Rechten ophalen bij de bron ...", end=" ", flush=True)
    _, rechten = bron(o, "/rest/v1/rpc/hub_verhuis_rechten", "POST", {})
    if not isinstance(rechten, str) or len(rechten) < 100:
        sys.exit("hub_verhuis_rechten() gaf niets bruikbaars terug.")
    open(RECHTENBESTAND, "w").write(rechten)
    ddl = ddl + "\n\n" + rechten
    print(str(len(rechten)) + " tekens, bewaard in " + os.path.basename(RECHTENBESTAND))

    d = doel(o)
    print("Uitvoeren op de doeldatabase via de " + d.naam + " ...", end=" ", flush=True)
    try:
        if isinstance(d, DoelViaToken):
            d.sql(ddl)                      # het hele script in een keer
        else:
            for k, opdracht in enumerate(splits_sql(ddl), 1):
                try:
                    d.sql(opdracht)
                except Exception as fout:
                    sys.exit("\n\nOpdracht " + str(k) + " ging mis:\n  " +
                             " ".join(opdracht.split())[:160] + "\n\n  " + str(fout))
        # pg_trgm komt in een vers project in het schema public terecht, en
        # daarmee staan de eenendertig functies die de uitbreiding meebrengt
        # via PostgREST open voor de anon-sleutel. Ze lezen niets, maar ze
        # horen daar niet. De index op naam_nl blijft na de verhuizing heel.
        d.sql("""
        do $verhuizing$
        begin
          if exists (select 1 from pg_extension e join pg_namespace n on n.oid = e.extnamespace
                     where e.extname = 'pg_trgm' and n.nspname = 'public') then
            alter extension pg_trgm set schema extensions;
          end if;
        end
        $verhuizing$;""")
    except Exception as fout:
        sys.exit("\n\nmislukt:\n  " + str(fout))
    finally:
        d.sluit()
    print("gedaan")


def stap_data(o):
    d = doel(o)
    gerecht_ids = []
    breed = max(len(t) for t, _ in TABELLEN) + 2
    try:
        for tabel, filter_ in TABELLEN:
            f = filter_
            if filter_ == "kinderen_van_gerecht":
                if not gerecht_ids:
                    print(tabel.ljust(breed) + "overgeslagen (geen gerechten)")
                    continue
                f = "dish_id=in.(" + ",".join(gerecht_ids) + ")"

            totaal = bron_telling(o, tabel, f)
            typen = kolomtypen(d, tabel)
            if not typen:
                sys.exit(tabel + " bestaat niet aan de doelkant - draai eerst --schema.")

            gedaan = 0
            while gedaan < totaal:
                rijen = bron_pagina(o, tabel, f, gedaan, PAGINA)
                if not rijen:
                    break
                if tabel == "cultural_dishes":
                    gerecht_ids.extend(r["id"] for r in rijen if r.get("id"))
                kolommen = [k for k in rijen[0].keys() if k in typen]
                kop = ", ".join('"' + k + '"' for k in kolommen)
                for i in range(0, len(rijen), BATCH):
                    stuk, waarden = rijen[i:i + BATCH], []
                    for r in stuk:
                        velden = []
                        for k in kolommen:
                            w = None if k in LEEG_MAKEN.get(tabel, []) else r.get(k)
                            velden.append(sql_waarde(w, typen[k]))
                        waarden.append("(" + ", ".join(velden) + ")")
                    d.sql('insert into public."' + tabel + '" (' + kop + ") values " +
                          ", ".join(waarden) + " on conflict do nothing")
                gedaan += len(rijen)
                print(tabel.ljust(breed) + str(gedaan) + "/" + str(totaal), end="\r", flush=True)
            print(tabel.ljust(breed) + str(gedaan) + "/" + str(totaal) + " gekopieerd" + " " * 12)
    finally:
        d.sluit()


def stap_controle(o):
    d = doel(o)
    gerecht_ids = []
    breed = max(len(t) for t, _ in TABELLEN) + 2
    mist = 0
    try:
        for tabel, filter_ in TABELLEN:
            f = filter_
            if filter_ == "kinderen_van_gerecht":
                if not gerecht_ids:
                    _, rijen = bron(o, "/rest/v1/cultural_dishes?select=id&owner_patient_id=is.null")
                    gerecht_ids = [r["id"] for r in (rijen or [])]
                f = "dish_id=in.(" + ",".join(gerecht_ids) + ")" if gerecht_ids else None
            bron_n = bron_telling(o, tabel, f)
            rij = d.sql('select count(*) as n from public."' + tabel + '"')
            doel_n = int(list(rij[0].values())[0]) if rij else 0
            if doel_n < bron_n:
                mist += 1
                oordeel = "MIST"
            else:
                oordeel = "gelijk"
            print(tabel.ljust(breed) + "bron " + str(bron_n).rjust(6) +
                  "   doel " + str(doel_n).rjust(6) + "   " + oordeel)
    finally:
        d.sluit()
    if mist:
        sys.exit("\n" + str(mist) + " tabel(len) mist rijen aan de doelkant.")
    print("\nAlles staat er.")


def main():
    o = omgeving()
    keuzes = set(sys.argv[1:])
    if not keuzes or keuzes == {"--alles"}:
        keuzes = {"--schema", "--data", "--controle"}
    if "--schema" in keuzes:
        stap_schema(o)
    if "--data" in keuzes:
        stap_data(o)
    if "--controle" in keuzes:
        stap_controle(o)


if __name__ == "__main__":
    main()
