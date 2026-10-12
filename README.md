# saus-prijzen

Prijzen van SAUS (bijsaus.nl), elk uur gelezen uit de openbare bestelsite van SiteDish (besluit 60).

- Uitkomst: https://gabrielgzinfra.github.io/saus-prijzen/prijzen.json
- Bron: repo-variabele `PRIJZEN_BRON` (tot de omzetdag https://www.anytymeveldwijk.nl/, daarna https://bestellen.bijsaus.nl/).
- De taak draait elk uur en kan met de hand gestart worden (Actions > Prijzen ophalen > Run workflow).
- Commit alleen bij een wijziging, en minstens eens per 12 uur een nieuw tijdstip. De site toont geen prijzen als de data ouder is dan 48 uur.
- Bij een fout of minder dan 50 gerechten faalt de taak en blijft de vorige versie staan.

Deze repo bevat alleen prijzen, geen andere gegevens.
