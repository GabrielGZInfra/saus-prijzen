// Leest de HTML van de openbare SiteDish-bestelsite: gerechten met prijs, foto en actielabel, en de actiebalken.
// Alleen pure functies, zodat dit los te testen is (zie scripts/test-bestelsite.mjs).

export function decodeer(tekst) {
    return tekst
        .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
        .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
        .replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'")
        .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
        .trim()
}

// Tekst uit een stuk HTML: tags eruit, entiteiten terug, spaties samengevoegd
function tekst(html) {
    return decodeer(html.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim()
}

// Kleine opschoning: 50.00% wordt 50%, geen spatie voor een komma
function netjes(t) {
    return t.replace(/(\d+)[.,]00\s*%/g, "$1%").replace(/\s+,/g, ",").replace(/\s+/g, " ").trim()
}

// Soort korting: gratis (1 kopen, 1 gratis), half (tweede halve prijs of 50%) of anders
function soort(t) {
    const x = t.toLowerCase()
    if (/gratis/.test(x)) return "gratis"
    if (/halve prijs|50\s*%/.test(x)) return "half"
    return "anders"
}

// Korte tekst voor het label op de site; zelfde actie, alleen korter opgeschreven
function kort(label, s) {
    if (s === "gratis") return "1+1 gratis"
    if (s === "half") return "2e halve prijs"
    return label.replace(/\.$/, "")
}

// Vergelijkingssleutel: kleine letters, zonder accenten en leestekens
function sleutel(t) {
    return t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim()
}

const LIDWOORDEN = new Set(["the", "de", "het", "een"])

function attributen(tag) {
    const a = {}
    for (const x of tag.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) a[x[1].toLowerCase()] = x[2]
    return a
}

// Gerechten: elk is een div.dish met data-productId, data-productNaam, data-productCategorie en data-prijs.
// Alles tot het volgende gerecht hoort bij dit gerecht: foto, prijsknop (sold-out) en promo-banner (actielabel).
export function leesGerechten(html) {
    const starts = [...html.matchAll(/<div\s+class="dish\b[^"]*"([^>]*)>/g)]
    const gerechten = []
    const gezien = new Set()
    starts.forEach((m, i) => {
        const a = attributen(m[1])
        const prijs = Number(a["data-prijs"])
        const id = a["data-productid"]
        if (!id || gezien.has(id) || !Number.isFinite(prijs)) return
        gezien.add(id)
        gerechten.push({
            id,
            naam: decodeer(a["data-productnaam"] || ""),
            categorie: decodeer(a["data-productcategorie"] || ""),
            prijs,
            _start: m.index,
            _blok: html.slice(m.index, i + 1 < starts.length ? starts[i + 1].index : m.index + 8000),
        })
    })
    return gerechten
}

// Fotoadressen staan soms zonder https: (//cdn.sitedish.nl/...) of relatief op de bestelsite
function absoluut(adres, basis) {
    try { return new URL(adres, basis).href } catch { return adres }
}

// Voegt foto, uitverkocht en actie toe aan de gerechten en geeft de lijst met acties terug.
// Gaat hier iets mis, dan blijven de prijzen gewoon staan (de aanroeper vangt de fout op).
export function leesActies(html, gerechten, basis = "https://bestellen.bijsaus.nl/") {
    // Ankers van de categorieën (id="categorie82"), om een gerecht aan zijn categorie te koppelen
    const secties = [...html.matchAll(/id="(categorie\d+)"/g)].map(m => ({ id: m[1], index: m.index }))

    // Actiebalken bovenaan de bestelsite: data-jumptarget, h4 (titel) en p (omschrijving)
    const acties = [...html.matchAll(/<div\b([^>]*\bbanner-overlay-wrapper\b[^>]*)>([\s\S]*?)<\/section>/g)]
        .map(m => {
            const titel = netjes(tekst((m[2].match(/<h4(?:\s[^>]*)?>([\s\S]*?)<\/h4>/) || [])[1] || ""))
            const omschrijving = netjes(tekst((m[2].match(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/) || [])[1] || ""))
            return { titel, omschrijving, soort: soort(`${titel} ${omschrijving}`), doel: attributen(m[1])["data-jumptarget"] || null, gerechten: [] }
        })
        .filter(b => b.titel || b.omschrijving)

    for (const g of gerechten) {
        const blok = g._blok
        const foto = (blok.match(/<picture>[\s\S]*?<source[^>]*srcset="([^"\s]+)/) || blok.match(/<picture>[\s\S]*?<img[^>]*src="([^"]+)"/) || [])[1]
        if (foto) g.foto = absoluut(decodeer(foto), basis)
        if (/<button[^>]*class="[^"]*\bsold-out\b/.test(blok)) g.uitverkocht = true
        const label = (blok.match(/<div class="promo-banner[^"]*">([\s\S]*?)<\/div>/) || [])[1]
        if (!label) continue
        const labelTekst = netjes(tekst(label))
        const s = soort(labelTekst)
        g.actie = { label: labelTekst, kort: kort(labelTekst, s), soort: s }

        // Welke actiebalk hoort erbij: eerst op product, dan op naam, dan op categorie.
        // Valt er niets, dan de enige brede actie (op een categorie) van dezelfde soort.
        const sectie = secties.filter(x => x.index < g._start).pop()
        const naam = sleutel(g.naam)
        const woorden = naam.split(" ").filter(w => !LIDWOORDEN.has(w))
        const tweeWoorden = woorden.length >= 2 ? woorden.slice(0, 2).join(" ") : ""
        const score = b => {
            const t = ` ${sleutel(`${b.titel} ${b.omschrijving}`)} `
            if (b.doel === `product${g.id}`) return 5
            if (naam && t.includes(` ${naam} `)) return 4
            if (tweeWoorden && t.includes(` ${tweeWoorden} `)) return 3
            if (sectie && b.doel === sectie.id) return 2
            if (g.categorie && t.includes(` ${sleutel(g.categorie)} `)) return 2
            return 0
        }
        const kandidaten = acties.filter(b => b.soort === s)
        let beste = null
        let hoogste = 0
        for (const b of kandidaten) {
            const x = score(b)
            if (x > hoogste) { hoogste = x; beste = b }
        }
        if (!beste) {
            const breed = kandidaten.filter(b => b.doel && b.doel.startsWith("categorie"))
            if (breed.length === 1) beste = breed[0]
        }
        if (beste) {
            g.actie.titel = beste.titel
            g.actie.omschrijving = beste.omschrijving
            beste.gerechten.push(g.id)
        }
    }
    return acties
}

// Haalt de hulpvelden weg die alleen voor het lezen nodig waren
export function opgeschoond(gerechten) {
    return gerechten.map(({ _start, _blok, ...g }) => g)
}
