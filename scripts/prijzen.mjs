// Leest de openbare bestelsite van SiteDish en schrijft site/prijzen.json (besluit 60).
// Bij een fout of minder dan 50 gerechten stopt het script met een fout; de vorige prijzen.json blijft dan staan.
import { mkdir, readFile, writeFile } from "node:fs/promises"

const BRON = process.env.PRIJZEN_BRON || "https://www.anytymeveldwijk.nl/"
const BESTAND = "site/prijzen.json"
const MINIMUM = 50
// Ook zonder prijswijziging minstens eens per 12 uur een nieuw tijdstip, zodat de site de prijzen niet als verouderd (48 uur) ziet
const HARTSLAG_UUR = 12

function decodeer(tekst) {
    return tekst
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
        .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
        .trim()
}

const antwoord = await fetch(BRON, { headers: { "User-Agent": "saus-prijzen (bijsaus.nl)" } })
if (!antwoord.ok) throw new Error(`Bron gaf ${antwoord.status}`)
const html = await antwoord.text()

// Elk gerecht is een div.dish met data-productId, data-productNaam, data-productCategorie en data-prijs
const gerechten = []
const gezien = new Set()
for (const m of html.matchAll(/<div\s+class="dish\b[^"]*"([^>]*)>/g)) {
    const a = {}
    for (const x of m[1].matchAll(/data-([a-zA-Z]+)="([^"]*)"/g)) a[x[1].toLowerCase()] = x[2]
    const prijs = Number(a.prijs)
    if (!a.productid || gezien.has(a.productid) || !Number.isFinite(prijs)) continue
    gezien.add(a.productid)
    gerechten.push({ id: a.productid, naam: decodeer(a.productnaam || ""), categorie: decodeer(a.productcategorie || ""), prijs })
}
if (gerechten.length < MINIMUM) throw new Error(`Maar ${gerechten.length} gerechten gevonden, minimaal ${MINIMUM}`)
gerechten.sort((p, q) => Number(p.id) - Number(q.id))

let vorige = null
try { vorige = JSON.parse(await readFile(BESTAND, "utf8")) } catch {}
const gewijzigd = !vorige || vorige.bron !== BRON || JSON.stringify(vorige.gerechten) !== JSON.stringify(gerechten)
const oud = !vorige || Date.now() - Date.parse(vorige.bijgewerkt) > HARTSLAG_UUR * 3600 * 1000

if (gewijzigd || oud) {
    const data = { bijgewerkt: new Date().toISOString(), bron: BRON, aantal: gerechten.length, gerechten }
    await mkdir("site", { recursive: true })
    await writeFile(BESTAND, JSON.stringify(data, null, 1) + "\n")
    console.log(`${gerechten.length} gerechten geschreven (${gewijzigd ? "gewijzigd" : "nieuw tijdstip"})`)
} else {
    console.log(`${gerechten.length} gerechten, geen wijziging`)
}
