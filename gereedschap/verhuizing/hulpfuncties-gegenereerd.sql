-- Hulpfuncties die de hub aanroept maar die niet naar de hub heten.

CREATE OR REPLACE FUNCTION public.bh_ouder_ok(p_gezin text, p_wachtwoord text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare g public.bennahub_gezin;
begin
  select * into g from public.bennahub_gezin where gezin = lower(trim(p_gezin));
  if not found then return false; end if;
  return g.wachtwoord_hash = extensions.crypt(p_wachtwoord, g.wachtwoord_hash);
end $function$
;

revoke all on function public.bh_ouder_ok(p_gezin text, p_wachtwoord text) from public, anon, authenticated;