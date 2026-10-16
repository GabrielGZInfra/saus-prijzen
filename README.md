# saus-prijzen

Prijzen van SAUS (bijsaus.nl), elk uur gelezen uit de openbare bestelsite van SiteDish (besluit 60).

- Uitkomst: https://gabrielgzinfra.github.io/saus-prijzen/prijzen.json
- Bron: repo-variabele `PRIJZEN_BRON`, sinds 16 oktober 2026 https://bestellen.bijsaus.nl/ (www.anytymeveldwijk.nl geeft sinds de koppeling van SiteDish een 404).
- De taak draait elk uur en kan met de hand gestart worden (Actions > Prijzen ophalen > Run workflow).
- Commit alleen bij een wijziging, en minstens eens per 12 uur een nieuw tijdstip. De site toont geen prijzen als de data ouder is dan 48 uur.
- Bij een fout of minder dan 50 gerechten faalt de taak en blijft de vorige versie staan.

Deze repo bevat alleen prijzen, geen andere gegevens.
