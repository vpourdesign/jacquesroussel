// Récupère les statistiques de marché Centris par ville et écrit site/data/market.json.
// Source : https://www.centris.ca/fr/outils/statistiques-immobilieres/<region>/<ville>
// Le tableau est rendu côté serveur : on parse la structure (h3 de section + libellé de ligne),
// pas les id="statNN" qui bougent d'une ville à l'autre.
//
//   node scripts/fetch-market-stats.mjs
//
// À relancer chaque trimestre (Centris publie ~6 semaines après la fin du trimestre).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'site', 'data', 'market.json');

// Territoire Équipe Jacques-Roussel — slug local → slug Centris
export const MARKET_CITIES = [
  ['saint-eustache',            'Saint-Eustache',            'laurentides', 'saint-eustache'],
  ['deux-montagnes',            'Deux-Montagnes',            'laurentides', 'deux-montagnes'],
  ['sainte-marthe-sur-le-lac',  'Sainte-Marthe-sur-le-Lac',  'laurentides', 'sainte-marthe-sur-le-lac'],
  ['mirabel',                   'Mirabel',                   'laurentides', 'mirabel'],
  ['boisbriand',                'Boisbriand',                'laurentides', 'boisbriand'],
  ['sainte-therese',            'Sainte-Thérèse',            'laurentides', 'sainte-therese'],
  ['blainville',                'Blainville',                'laurentides', 'blainville'],
  ['rosemere',                  'Rosemère',                  'laurentides', 'rosemere'],
  ['lorraine',                  'Lorraine',                  'laurentides', 'lorraine'],
  ['sainte-anne-des-plaines',   'Sainte-Anne-des-Plaines',   'laurentides', 'sainte-anne-des-plaines']
];

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const SECTION_KEYS = [
  [/^total\s+r[ée]sidentiel/i, 'total'],
  [/^unifamiliale/i,           'unifamiliale'],
  [/^copropri[ée]t[ée]/i,      'copropriete'],
  [/^plex/i,                   'plex']
];

const ROW_KEYS = [
  [/^ventes/i,                        'ventes'],
  [/^nouvelles\s+inscriptions/i,      'nouvellesInscriptions'],
  [/^inscriptions\s+en\s+vigueur/i,   'inscriptionsActives'],
  [/^volume/i,                        'volume'],
  [/^prix\s+m[ée]dian/i,              'prixMedian'],
  // Centris libelle « Moyenne de jours sur le marché » (moyenne, pas médiane)
  [/jours?\s+sur\s+le\s+march[ée]/i,  'joursSurLeMarche']
];

const decode = (s) => (s || '')
  .replace(/<sup>(.*?)<\/sup>/gi, '$1')   // "2<sup>e</sup> trimestre" → "2e trimestre"
  .replace(/<[^>]+>/g, ' ')
  .replace(/&#xA0;|&nbsp;|&#160;/gi, ' ')
  .replace(/&eacute;?/gi, 'é').replace(/&egrave;?/gi, 'è').replace(/&agrave;?/gi, 'à')
  .replace(/&ecirc;?/gi, 'ê').replace(/&#xE9;/gi, 'é').replace(/&#xE8;/gi, 'è')
  .replace(/&amp;/gi, '&')
  .replace(/\s+/g, ' ')
  .trim();

// "**" = donnée non publiée (trop peu de transactions) → null
const cleanVal = (s) => {
  const t = decode(s);
  return (!t || t === '**' || t === '-' || t === '—') ? null : t;
};

const keyFor = (label, table) => {
  for (const [re, key] of table) if (re.test(label)) return key;
  return null;
};

// Une cellule de période = <table><tr><td>valeur</td><td><i class="…arrow-up|down"/></td><td>%</td>…
function parseCell(html) {
  const tds = [...html.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => m[1]);
  if (!tds.length) return null;
  const value = cleanVal(tds[0]);
  if (value === null) return null;
  const arrow = /arrow-alt-up/i.test(html) ? 'up' : (/arrow-alt-down/i.test(html) ? 'down' : null);
  const variation = tds.length > 2 ? cleanVal(tds[2]) : null;
  const unit = tds.length > 3 ? cleanVal(tds[3]) : null;
  return { value, variation, direction: arrow, unit: unit || null };
}

function parseCity(html) {
  const period = decode((html.match(/<span id="trimestre1"[^>]*>([\s\S]*?)<\/span>/i) || [])[1] || '') || null;
  const sections = {};

  // Chaque section : <div class="row"> <h3>Titre</h3> <table> … </table> </div>
  const blocks = [...html.matchAll(/<div class="row">\s*<h3>([\s\S]*?)<\/h3>([\s\S]*?)<\/table>\s*<\/div>/gi)];
  for (const [, rawTitle, rawBody] of blocks) {
    const title = decode(rawTitle);
    const skey = keyFor(title, SECTION_KEYS);
    if (!skey) continue;

    const rows = {};
    // Une ligne de données commence toujours par <td><span>Libellé</span></td>.
    // On découpe le corps de la section sur ces ancres : tout ce qui suit, jusqu'à
    // l'ancre suivante, contient les deux cellules de période (nested <table>).
    const anchors = [...rawBody.matchAll(/<td><span>([^<]*)<\/span><\/td>/gi)];
    for (let i = 0; i < anchors.length; i++) {
      const label = decode(anchors[i][1]);
      const rkey = keyFor(label, ROW_KEYS);
      if (!rkey) continue;
      const start = anchors[i].index + anchors[i][0].length;
      const end = i + 1 < anchors.length ? anchors[i + 1].index : rawBody.length;
      const body = rawBody.slice(start, end);
      // Deux cellules de période : trimestre courant, puis cumul 4 trimestres
      const cells = [...body.matchAll(/<table>([\s\S]*?)<\/table>/gi)].map(c => parseCell(c[1]));
      rows[rkey] = { label, trimestre: cells[0] || null, cumul: cells[1] || null };
    }
    if (Object.keys(rows).length) sections[skey] = { label: title, rows };
  }
  return { period, sections };
}

async function fetchCity(region, citySlug) {
  const url = `https://www.centris.ca/fr/outils/statistiques-immobilieres/${region}/${citySlug}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'fr-CA,fr;q=0.9' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const parsed = parseCity(html);
  if (!Object.keys(parsed.sections).length) throw new Error('aucune section trouvée (structure Centris modifiée ?)');
  return { url, ...parsed };
}

async function main() {
  const cities = {};
  for (const [localSlug, name, region, centrisSlug] of MARKET_CITIES) {
    try {
      const data = await fetchCity(region, centrisSlug);
      cities[localSlug] = { name, ...data };
      const uni = data.sections.unifamiliale?.rows?.prixMedian?.trimestre?.value;
      console.log(`✓ ${name.padEnd(26)} ${data.period || '—'}  unifamiliale ${uni || '—'}`);
    } catch (err) {
      console.log(`✗ ${name.padEnd(26)} ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 1200)); // on reste poli avec Centris
  }

  if (!Object.keys(cities).length) {
    console.error('Aucune ville récupérée — market.json inchangé.');
    process.exit(1);
  }

  const payload = {
    source: 'Centris.ca — Statistiques immobilières',
    fetchedAt: new Date().toISOString().slice(0, 10),
    cities
  };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
  console.log(`\n→ ${path.relative(process.cwd(), OUT)} (${Object.keys(cities).length} villes)`);
}

main();
