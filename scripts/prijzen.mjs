// Leest de openbare bestelsite van SiteDish en schrijft site/prijzen.json (besluit 60).
// Sinds 14-11-2026 ook foto's en acties (optie C, keuze Gabriël): per gerecht het actielabel uit SiteDish
// en de actie die erbij hoort (titel en omschrijving uit de actiebalk), plus een lijst met alle acties.
// Bij een fout of minder dan 50 gerechten stopt het script met een fout; de vorige prijzen.json blijft dan staan.
// Lukt alleen het lezen van de acties niet, dan gaan de prijzen gewoon door, zonder acties.
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { leesGerechten, leesActies, opgeschoond } from "./bestelsite.mjs"

const BRON = process.env.PRIJZEN_BRON || "https://bestellen.bijsaus.nl/"
const BESTAND = "site/prijzen.json"
const MINIMUM = 50
// Ook zonder prijswijziging minstens eens per 12 uur een nieuw tijdstip, zodat de site de prijzen niet als verouderd (48 uur) ziet
const HARTSLAG_UUR = 12

const antwoord = await fetch(BRON, { headers: { "User-Agent": "saus-prijzen (bijsaus.nl)" } })
if (!antwoord.ok) throw new Error(`Bron gaf ${antwoord.status}`)
const html = await antwoord.text()

const ruw = leesGerechten(html)
if (ruw.length < MINIMUM) throw new Error(`Maar ${ruw.length} gerechten gevonden, minimaal ${MINIMUM}`)

let acties = []
try {
    acties = leesActies(html, ruw, antwoord.url || BRON)
} catch (fout) {
    console.warn(`Acties niet gelezen, prijzen gaan door: ${fout.message}`)
    for (const g of ruw) { delete g.foto; delete g.uitverkocht; delete g.actie }
    acties = []
}

// Gerechten op id; binnen een actie blijven de gerechten in de volgorde van de bestelsite (zo toont de carrousel ze)
const gerechten = opgeschoond(ruw).sort((p, q) => Number(p.id) - Number(q.id))

let vorige = null
try { vorige = JSON.parse(await readFile(BESTAND, "utf8")) } catch {}
const gewijzigd = !vorige || vorige.bron !== BRON
    || JSON.stringify(vorige.gerechten) !== JSON.stringify(gerechten)
    || JSON.stringify(vorige.acties || []) !== JSON.stringify(acties)
const oud = !vorige || Date.now() - Date.parse(vorige.bijgewerkt) > HARTSLAG_UUR * 3600 * 1000

if (gewijzigd || oud) {
    const data = { bijgewerkt: new Date().toISOString(), bron: BRON, aantal: gerechten.length, gerechten, acties }
    await mkdir("site", { recursive: true })
    await writeFile(BESTAND, JSON.stringify(data, null, 1) + "\n")
    const metActie = gerechten.filter(g => g.actie).length
    console.log(`${gerechten.length} gerechten en ${acties.length} acties (${metActie} gerechten met een actie) geschreven (${gewijzigd ? "gewijzigd" : "nieuw tijdstip"})`)
} else {
    console.log(`${gerechten.length} gerechten, geen wijziging`)
}
