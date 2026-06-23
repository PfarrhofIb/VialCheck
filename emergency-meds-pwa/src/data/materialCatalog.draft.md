# Material-Katalog (Entwurf zur Review)

Quelle: Excel „Notfallrucksack Inventar Haltbarkeit“ — **nur Material**, kein Ampullarium.  
**70 Katalog-Einträge** · keine Taschen-Vorschläge · **Entscheidungen eingearbeitet**.

Legende:

| Modus | In der App |
|-------|------------|
| **Variante** | Name + **Dropdown** für Größe/Variante |
| **Mit MHD** | Name + Ablaufmonat + Menge |
| **Ohne MHD** | Name + Menge |

> **Hinweis App:** Heute gibt es nur `tubus_mm` und `venflon`.  
> Für diesen Katalog werden **5 neue Presets** geplant (Abschnitt 1).

---

## 1. Mit Größe / Variante — Dropdown (9)

### Bereits in der App

| Name | Dropdown |
|------|----------|
| Venflon | Orange 14G … Violett 26G |
| ET-Tubus | 1,0 – 10,0 mm |
| Guedel | 1,0 – 10,0 mm |
| Magill | 1,0 – 10,0 mm |

### Neu geplant (Preset noch zu bauen)

| Name | Dropdown | Preset-ID |
|------|----------|-----------|
| **Larynxmaske AuraGain** | 1 · 1,5 · 2 · 2,5 · 3 · 4 · 5 | `larynxmaske_auragain` |
| **Spritze** | 1 · 2 · 5 · 10 · 20 ml | `spritze_ml` |
| **Spatel Macintosh** | 2 · 3 · 4 | `spatel_macintosh` |
| **Spatel Miller** | 0 · 1 | `spatel_miller` |
| **Maske** | groß · klein · mittel | `maske_groesse` |

*(Larynxmaske AuraGain: LMA = Larynxmaske, AuraGain = Hersteller.)*  
*(Maske: Dropdown Größe; typischerweise **ohne MHD** — bei Umsetzung Preset ohne Pflicht-Ablaufdatum.)*

---

## 2. Mit MHD (24)

### Infusion

- Elomel 500ml  
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
- **3-Weg-Hahn kurz** *(zwei Einträge)*  
- **3-Weg-Hahn lang** *(zwei Einträge)*  
- Stepty  
- **Spritze i.m. Erw.** (30–45 mm) *(zwei Einträge)*  
- **Spritze i.m. Kind** (15–25 mm) *(zwei Einträge)*  
- NaCl 10ml Omniflush  

### Verbände / Abdeckung

- Kompressen groß  
- Kompressen klein  
- Isareli-Bandage  
- Opsite-Folie  
- Tubusfixierung Pflaster  

### Beatmung / Invasiv

- CO2-Detektor  
- **Schleimabsauger** *(mit MHD)*  
- **PEEP-Ventil** *(mit MHD)*  

---

## 3. Ohne MHD (37)

### Beatmung

- **Ambubeutel** *(zwei Einträge)*  
- **Ambubeutel Kinder** *(zwei Einträge)*  
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

## Getroffene Entscheidungen

| Frage | Entscheidung |
|-------|----------------|
| Schleimabsauger / PEEP-Ventil | **Mit MHD** |
| Spritze i.m. Erw. / Kind | **Zwei Einträge** |
| Maske groß/klein/mittel | **Eine Maske**, Dropdown |
| Ambubeutel Erw. / Kinder | **Zwei Einträge** |
| 3-Weg-Hahn kurz / lang | **Zwei Einträge** |

---

## Entfernt / zusammengeführt

- Intubationsbesteck, Absaugkatheter grün + Schwarz  
- Einzelne LMA-Größen → Larynxmaske AuraGain  
- Einzelne Spritzen ml → Spritze  
- Einzelne Spatel → Spatel Macintosh / Miller  
- Drei Masken-Einträge → **Maske** (Dropdown)  
- Kl. Kompresse, doppelte Opsite, Blockerspritze 20ml  

---

## Später

Medikamenten-Katalog (Ampullarium) — **erst Dosierungen bereinigen**.

Technische Datei: `materialCatalog.draft.ts`
