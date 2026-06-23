# Material-Katalog (Referenz)

**Produktiv:** `materialCatalog.ts` · **Stand:** v0.60 (2026-06-17)  
**71 Einträge** · Quelle: Excel „Notfallrucksack Inventar Haltbarkeit“ (nur Material, kein Ampullarium)

Legende:

| Modus | In der App |
|-------|------------|
| **Variante** | Name + Dropdown für Größe/Variante |
| **Mit MHD** | Name + optionaler Ablaufmonat + Menge |
| **Ohne MHD** | Name + Menge |

---

## 1. Mit Größe / Variante (11)

| Name | Preset | Dropdown |
|------|--------|----------|
| Venflon | `venflon` | Orange 14G, Grau 16G, Grün 18G, Pink 20G, Blau 22G, Gelb 24G, Violett 26G |
| ET-Tubus | `tubus_mm` | 1,0 – 10,0 mm (0,5-Schritte) |
| Guedel | `guedel_groesse` | 000, 00, 0, 1, 2, 3, 4, 5 |
| Magill | `magill_cm` | 15 cm, 20 cm, 25 cm |
| Larynxmaske AuraGain | `larynxmaske_auragain` | 1, 1,5, 2, 2,5, 3, 4, 5, 6 |
| I-Gel | `igel_groesse` | 1, 1,5, 2, 2,5, 3, 4, 5 |
| Spritze | `spritze_ml` | 1, 2, 5, 10, 20, 50 ml |
| Spatel Macintosh | `spatel_macintosh` | 0, 1, 2, 3, 4 |
| Spatel Miller | `spatel_miller` | 00, 0, 1, 2, 3, 4 |
| Maske | `maske_groesse` | 0, 1, 2, 3, 4, 5 |
| Absaugkatheter | `absaugkatheter_ch` | 6 CH hellgrün, 8 CH blau, 10 CH schwarz, 12 CH weiß, 14 CH grün, 16 CH orange |

**Hinweise:**

- Maske (`maske_groesse`): Beatmungsmaske BVM, **ohne Pflicht-MHD**
- Absaugkatheter ersetzt früheren Eintrag „Schleimabsauger“ (Katheter, nicht Handpumpe)

---

## 2. Mit MHD (23)

### Infusion

- Elo-Mel 500ml
- Gelofusin 500ml
- NaCl 100ml
- Infusionsbesteck
- Mini-Spike
- Rückschlagventil

### Venenzugang

- Venflonpflaster groß
- Venflonpflaster braun/quer
- Rote Stöpsel
- Aufziekanülen
- 3-Weg-Hahn kurz
- 3-Weg-Hahn lang
- Stepty
- Spritze i.m. Erw. (30–45 mm)
- Spritze i.m. Kind (15–25 mm)
- NaCl 10ml Omniflush

### Verbände / Abdeckung

- Kompressen groß
- Kompressen klein
- Israeli-Druckverband
- Opsite-Folie
- Tubusfixierung Pflaster

### Beatmung / Invasiv

- CO2-Detektor
- PEEP-Ventil

---

## 3. Ohne MHD (37)

### Beatmung

- Ambubeutel
- Ambubeutel Kinder
- Wendel
- Gleitgel

### Intubation / Laryngoskop

- Griff
- Tubusfixierung Schlauch
- Blockerspritze
- Mandrin klein
- Mandrin mittel
- O2-Flasche
- O2-Schlauch

### Diagnostik

- Stethoskop
- RR Manschette
- Pulsoxymeter
- Blutzuckermessgerät
- Diagnostikleuchte

### Trauma / Verband

- Splint
- Peha Haft
- Peha-Haft klein
- Mullbinde
- Z-Fold Gauze
- Tourniquet
- Aludecke
- Dreiecktuch

### Werkzeug / Verbrauch

- Rettungsschere
- Verbandsschere
- Sterile Schere
- Einmalskalpell
- Klemme
- Klemme unsteril
- Stapler
- Sterile Handschuhe Gr. 7,5
- Stauschlauch
- Unsterile Tupfer
- Alkotupfer
- Kugelschreiber
- Edding dünn
- Edding dick

---

## Bewusst nicht im Katalog

- Beatmungsfilter (oft am BVM montiert)
- Cuffdruckmesser
- LTS-D / weiterer Larynx-Tubus (AuraGain + I-Gel abgedeckt)

---

## Später

- Medikamenten-Katalog aus Ampullarium (nach Dosierungs-Bereinigung)

Technische Implementierung: `src/utils/materialVariants.ts`, `src/data/materialCatalog.ts`
