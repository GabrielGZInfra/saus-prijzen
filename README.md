# saus-prijzen

Prijzen en acties van SAUS (bijsaus.nl), elk uur gelezen uit de openbare bestelsite van SiteDish (besluit 60).

- Uitkomst: https://gabrielgzinfra.github.io/saus-prijzen/prijzen.json
- Bron: repo-variabele `PRIJZEN_BRON`. Op 14 november 2026 staat die nog op https://www.anytymeveldwijk.nl/; dat adres stuurt door naar https://bestellen.bijsaus.nl/, dus de gegevens komen van de bestelsite. Zonder variabele leest het script https://bestellen.bijsaus.nl/.
- De taak draait elk uur en kan met de hand gestart worden (Actions > Prijzen ophalen > Run workflow).
- Commit alleen bij een wijziging, en minstens eens per 12 uur een nieuw tijdstip. De site toont geen prijzen als de data ouder is dan 48 uur.
- Bij een fout of minder dan 50 gerechten faalt de taak en blijft de vorige versie staan.

## Wat er in prijzen.json staat

- `gerechten`: per gerecht `id`, `naam`, `categorie` en `prijs`, en waar van toepassing:
  - `foto`: de foto van de bestelsite;
  - `uitverkocht`: `true` als het gerecht op de bestelsite op uitverkocht staat;
  - `actie`: het actielabel uit SiteDish (`label`, bijvoorbeeld "1 kopen, 1 gratis."), een korte versie voor de site (`kort`: "1+1 gratis" of "2e halve prijs"), de `soort` (gratis, half of anders) en de `titel` en `omschrijving` van de actiebalk die erbij hoort.
- `acties`: de actiebalken van de bestelsite met `titel`, `omschrijving`, `soort`, `doel` (het product of de categorie waar de balk naar springt) en de `gerechten` die eronder vallen.

Sinds 14 november 2026 (optie C uit "SAUS aanbiedingen op bijsaus.nl"). Een actie aanpassen gaat in SiteDish; binnen een uur staat het in prijzen.json. Lukt het lezen van de acties niet, dan gaan de prijzen gewoon door, zonder acties.

Het lezen van de bestelsite staat in `scripts/bestelsite.mjs`; `node scripts/test-bestelsite.mjs` controleert het zonder internet.

Deze repo bevat alleen prijzen en acties, geen andere gegevens.
