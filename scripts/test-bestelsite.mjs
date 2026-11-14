// Test voor scripts/bestelsite.mjs met een klein stukje HTML zoals de SiteDish-bestelsite het levert.
// Draaien: node scripts/test-bestelsite.mjs (geen internet nodig)
import assert from "node:assert/strict"
import { leesGerechten, leesActies, opgeschoond } from "./bestelsite.mjs"

const balk = (doel, titel, tekst) => `<div class="col-lg-12"> <div class="message banner-overlay-wrapper jumpto theme" data-jumptarget="${doel}"> <svg></svg> <section> <header> <h4>${titel}</h4> </header> <p> ${tekst} </p> </section> </div> </div>`
const gerecht = (id, naam, categorie, prijs, { label, uit, foto = true } = {}) => `<div class="dish " data-productId="${id}" data-productNaam="${naam}" data-productCategorie="${categorie}" data-prijs="${prijs}"> <div class="card "> ${foto ? `<picture> <source type="image/webp" srcset="//cdn.sitedish.nl/test/${id}.png-c.webp"> <img src="https://cdn.sitedish.nl/test/${id}.png" alt="${naam}" class="img-fluid"> </picture>` : ""} <section> <header> <div class="product-header"> <h3>${naam}</h3> </div> </header> <nav> <button ${uit ? "disabled " : ""}class="button theme price ${uit ? "sold-out " : ""}small${uit ? "" : " add"}">€ ${prijs}</button>${uit ? " <span>Uitverkocht</span>" : ""} </nav> ${label ? `<div class="promo-banner promo-banner-text-green"> ${label} </div>` : ""} </section> </div> </div>`

const html = `<style>.banner-overlay-wrapper { display: block }</style>`
    + balk("product967", "1+1 gratis: loaded mac &amp; cheese", "Bestel een Dirty Smash Mac of The Original Mac en krijg dezelfde gratis.")
    + balk("product926", "Tweede halve prijs", "Milkshake Deluxe: de tweede voor de halve prijs.")
    + balk("categorie82", "Actie", "&#127789;HOTDOGS, LOADED FRIES , LOADED ONION RINGS + 1 met 50.00% korting")
    + `<section id="categorie82">`
    + gerecht(917, "THE TURKEY DOG", "Hotdogs", 8.95, { label: "1 kopen, 1 met 50% korting." })
    + gerecht(962, "THE TEX-MEX DOG", "Hotdogs", 11.95, { label: "1 kopen, 1 met 50% korting.", uit: true })
    + `</section><section id="categorie90">`
    + gerecht(868, "JALAPE&#209;O CRUNCHY CHICKEN", "Burgers", 8.95, { label: "1 kopen, 1 met 50% korting." })
    + gerecht(850, "VEGAN SMASH BURGER", "Burgers", 10.95, { foto: false })
    + `</section><section id="categorie95">`
    + gerecht(967, "THE ORIGINAL MAC", "Loaded mac &amp; cheese", 9.95, { label: "1 kopen, 1 gratis." })
    + gerecht(969, "DIRTY SMASH MAC", "Loaded mac &amp; cheese", 12.95, { label: "1 kopen, 1 gratis." })
    + `</section><section id="categorie99">`
    + gerecht(861, "THE ORIGINAL", "Loaded fries", 9.95, { label: "1 kopen, 1 met 50% korting." })
    + gerecht(926, "MILKSHAKE DELUXE KLEIN", "IJs &amp; Shakes", 3.95, { label: "1 kopen, 1 met 50% korting." })
    + gerecht(926, "MILKSHAKE DELUXE KLEIN", "IJs &amp; Shakes", 3.95)
    + `</section>`

const ruw = leesGerechten(html)
const acties = leesActies(html, ruw)
const gerechten = opgeschoond(ruw)
const per = Object.fromEntries(gerechten.map(g => [g.id, g]))

assert.equal(gerechten.length, 8, "dubbel gerecht telt één keer")
assert.equal(per[868].naam, "JALAPEÑO CRUNCHY CHICKEN")
assert.equal(per[967].categorie, "Loaded mac & cheese")
assert.equal(per[917].foto, "https://cdn.sitedish.nl/test/917.png-c.webp")
assert.equal(per[850].foto, undefined)
assert.equal(per[850].actie, undefined)
assert.equal(per[962].uitverkocht, true)
assert.equal(per[917].uitverkocht, undefined)
assert.ok(!("_blok" in per[917]) && !("_start" in per[917]), "hulpvelden weg")

assert.equal(acties.length, 3, "stijlregel is geen actie")
assert.deepEqual(acties.map(b => b.doel), ["product967", "product926", "categorie82"])
assert.equal(acties[0].titel, "1+1 gratis: loaded mac & cheese")
assert.equal(acties[2].omschrijving, "🌭HOTDOGS, LOADED FRIES, LOADED ONION RINGS + 1 met 50% korting")

assert.deepEqual(per[967].actie, { label: "1 kopen, 1 gratis.", kort: "1+1 gratis", soort: "gratis", titel: acties[0].titel, omschrijving: acties[0].omschrijving })
assert.equal(per[926].actie.kort, "2e halve prijs")
assert.equal(per[926].actie.omschrijving, "Milkshake Deluxe: de tweede voor de halve prijs.", "op naam")
assert.equal(per[861].actie.titel, "Actie", "THE ORIGINAL (fries) niet bij de mac-actie")
assert.equal(per[868].actie.titel, "Actie", "enige brede actie van dezelfde soort")
assert.deepEqual(acties[0].gerechten.sort(), ["967", "969"])
assert.deepEqual(acties[1].gerechten, ["926"])
assert.deepEqual(acties[2].gerechten.sort(), ["861", "868", "917", "962"])

console.log("bestelsite.mjs: alle controles goed")
