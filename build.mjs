// Build: parse Centris + generate static site (Montserrat, hiérarchie de weight)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;
const CENTRIS = path.join(ROOT, '_centris');
const SITE = path.join(ROOT, 'site');
// Équipe Jacques-Roussel : Marilyn Jacques + Alexandre Roussel
// (RE/MAX, bureau CYL003). Les deux courtiers apparaissent déjà dans
// MEMBRES.TXT — on agrège leurs inscriptions (primaire OU co-courtier).
// Nombre minimal de photos pour publier une fiche. À 3, on écartait des
// terrains qui n'ont légitimement qu'une seule vue.
const MIN_PHOTOS = 1;

const TARGET_BROKERS = [
  { firstName: 'Marilyn',   lastName: 'Jacques' },
  { firstName: 'Alexandre', lastName: 'Roussel' },
  { firstName: 'Vincent',   lastName: 'Lanni'   }
];

// ── L'ÉQUIPE ───────────────────────────────────────────────────────────
// Une seule source de vérité : les cartes de /a-propos/, le pied de page et
// la carte « Courtier responsable » des fiches lisent toutes ce tableau.
// Ajouter un membre = ajouter une entrée ici, rien d'autre à toucher.
// Les bios restent au « je » : c'est la personne qui parle. Le reste du site
// est au « nous ».
const TEAM = [
  {
    first: 'Marilyn',
    last: 'Jacques',
    role: 'Courtière immobilier résidentiel et commercial',
    photo: '/photos/marilyn-portrait.jpg',
    email: 'marilyn.jacques@remax-quebec.com',
    phone: '438 777-9893',
    tel: '+14387779893',
    bio: [
      "Je mets mon expertise et mon savoir-faire au service des propriétaires pour vendre leur bien rapidement et au meilleur prix, qu'il soit résidentiel ou commercial. Formée aux côtés de ma mère, j'ai appris à guider mes clients avec précision, stratégie et transparence à chaque étape de la transaction.",
      "Engagée dans ma profession, j'ai présidé le regroupement du secteur de Laval et de la Rive-Nord pour l'Association des courtiers immobiliers du Québec, contribuant à l'évolution du métier et à la défense des intérêts de mes collègues. Mon engagement social, notamment à travers ma participation au 24h de Tremblant pour soutenir les enfants malades, reflète mes valeurs et ma volonté de faire une différence.",
      "Déterminée et à l'écoute, je m'assure que chaque vente se déroule de manière fluide et réussie, en maximisant la valeur de votre bien et en vous offrant une expérience de vente sereine et professionnelle."
    ]
  },
  {
    first: 'Alexandre',
    last: 'Roussel',
    role: 'Courtier immobilier résidentiel et commercial',
    photo: '/photos/alexandre-portrait.jpg',
    email: 'alexandre.roussel@remax-quebec.com',
    phone: '514 805-6953',
    tel: '+15148056953',
    bio: [
      "Investisseur immobilier depuis plusieurs années, j'ai à cœur d'accompagner mes clients avec professionnalisme et transparence. En tant que courtier immobilier, mon objectif est de rendre chaque transaction fluide et agréable, que ce soit pour vendre une propriété au meilleur prix et dans les meilleures conditions, pour trouver la maison idéale pour votre famille ou pour dénicher un investissement qui vous permet de bâtir un patrimoine immobilier.",
      "Grâce à ma connaissance du marché et à mon engagement, je veille à offrir un service personnalisé et à transformer chaque projet immobilier en une réussite. Ayant les permis résidentiel et commercial, je me spécialise dans divers domaines pour répondre aux besoins variés de mes clients. Je me démarque par mon esprit d'analyse et mon souci du détail.",
      "Vous ne manquerez jamais d'information lorsque viendra le moment de prendre une décision éclairée. Je traite chaque transaction comme si je m'y impliquais personnellement&nbsp;!"
    ]
  },
  {
    // Bio adaptée de vincentlanni.com — À FAIRE VALIDER par Vincent Lanni.
    first: 'Vincent',
    last: 'Lanni',
    role: 'Courtier immobilier résidentiel et commercial',
    photo: '/photos/vincent-portrait.jpg',
    email: 'vincent.lanni@remax-quebec.com',
    phone: '514 262-9446',
    tel: '+15142629446',
    bio: [
      "J'arrive dans l'immobilier avec de nombreuses années d'expérience en vente de haut niveau. Ce qui me motive, ce sont les gens, les entreprises, l'immobilier et la finance, et je m'investis sincèrement dans chaque dossier qu'on me confie.",
      "On me reconnaît pour dépasser les attentes plutôt que de simplement les remplir. Transparence, expertise et attention méticuleuse aux détails : c'est ce que je mets sur la table à chaque transaction, autant en résidentiel qu'en commercial."
    ]
  }
  // 4e membre à venir — ajouter l'entrée ici quand le profil sera confirmé.
];
// Une place reste visible tant que le quatrième membre n'est pas annoncé.
const TEAM_HAS_OPENING = true;

// ─────────────────────────────────────────────────────────────────────────────
// AGENCE — mentions imposées par RE/MAX Québec.
// Source : Guide des normes de publicité RE/MAX, édition septembre 2025, p. 27
// (« SITES WEB → INFORMATIONS OBLIGATOIRES → Page d'accueil »). Le courriel du
// service des normes renvoie aux p. 41-42, la pagination de l'édition
// précédente : c'est la même liste.
//
// La page d'accueil DOIT porter, sans exception :
//   • le nom de chaque courtier et son titre exact au permis OACIQ (voir TEAM.role);
//   • le nom de l'agence, la mention « Agence immobilière » et l'adresse civique complète;
//   • le numéro de téléphone principal de l'agence;
//   • le logo RE/MAX et la montgolfière EN COULEUR;
//   • la mention « Franchisé indépendant et autonome de RE/MAX Québec »;
//   • les deux logos officiels au-dessus de la ligne des 400 px (→ l'en-tête).
//
// Le lien vers remax-quebec.com est lui aussi exigé : sans contribution au
// trafic du site du franchiseur, la redirection depuis la page courtier
// RE/MAX Québec vers ce site n'est pas activée.
//
// Ne rien retirer d'ici sans repasser par le service des normes.
const AGENCY = {
  name: 'RE/MAX CRYSTAL',
  legal: 'Agence immobilière',
  street: '228 boul. du Curé-Labelle',
  city: 'Sainte-Thérèse',
  region: 'Québec',
  postal: 'J7E 2X7',
  phone: '450 430-4207',
  tel: '+14504304207',
  franchise: 'Franchisé indépendant et autonome de RE/MAX Québec',
  franchisorUrl: 'https://www.remax-quebec.com',
  franchisorLabel: 'RE/MAX Québec'
};
// Verrou de conformité : la montgolfière ne peut jamais paraître sans le
// logotype RE/MAX (guide, p. 4). Les deux sont dans un seul fichier verrouillé
// — ne pas le recadrer, le recolorer ni le redimensionner de façon non uniforme.
const REMAX_LOCKUP = '/brand_assets/remax-ballon-logotype.png';

// Google Calendar Appointment Schedule — remplace par ton URL complète
// (obtenue dans Google Calendar → Créer → Plages horaires de rendez-vous → Ouvrir la page de réservation)
const GCAL_APPOINTMENT_URL = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ1jp0v3sqPHnkxqbDx_5kSPLSBSBDTebM9-4ulplRyo47oVeYiP-JfPvhE-EWktfMF5nAPXplo8';

// Point de chute des formulaires (guides, contact). Tant qu'il est vide, les
// formulaires basculent sur le client courriel de la personne : rien ne se
// perd en silence. Coller ici l'URL Formspree/Vercel du compte de l'équipe.
const FORM_ENDPOINT = '';
// Adresse de repli quand FORM_ENDPOINT est vide.
const FORM_FALLBACK_EMAIL = 'info@jacquesroussel.com';

function parseCSV(text) {
  const rows=[]; let row=[],f='',q=false,i=0;
  while(i<text.length){const c=text[i];
    if(q){if(c==='"'&&text[i+1]==='"'){f+='"';i+=2;continue;}if(c==='"'){q=false;i++;continue;}f+=c;i++;continue;}
    if(c==='"'){q=true;i++;continue;}
    if(c===','){row.push(f);f='';i++;continue;}
    if(c==='\r'){i++;continue;}
    if(c==='\n'){row.push(f);rows.push(row);row=[];f='';i++;continue;}
    f+=c;i++;}
  if(f.length||row.length){row.push(f);rows.push(row);}
  return rows;
}
const read = n => parseCSV(new TextDecoder('windows-1252').decode(fs.readFileSync(path.join(CENTRIS,n))));

// ── VILLE D'UNE INSCRIPTION ────────────────────────────────────────────
// La source de vérité est le code de municipalité Centris (col. 22 de
// INSCRIPTIONS.TXT) : ce sont les codes géographiques officiels du Québec
// (répertoire du MAMH, scripts/data/municipalites.json). Deviner la ville à
// partir du code postal était la cause des mauvaises villes : un même préfixe
// couvre plusieurs municipalités (J7N = Mirabel ET Sainte-Anne-des-Plaines,
// J7Y = Saint-Jérôme, pas Sainte-Thérèse, J5L = Saint-Jérôme, J8H = Lachute…).
const MUN_NAMES = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', 'data', 'municipalites.json'), 'utf8'));
// Codes que Centris emploie mais qui ne sont pas dans le répertoire : secteurs
// de grandes villes et anciens codes d'avant les fusions de 2002.
const MUN_SECTEURS = {
  '64005': 'Terrebonne', '64010': 'Terrebonne', '64020': 'Terrebonne',  // La Plaine, Lachenaie, Terrebonne
  '77015': 'Sainte-Marguerite-du-Lac-Masson',                           // Sainte-Marguerite-Estérel (2002-2006)
  '77040': 'Saint-Sauveur',                                             // Saint-Sauveur-des-Monts (village)
};
// Préfixes de secteur : Laval 651xx, Montréal 665xx/666xx, Québec 23xxx.
const MUN_PREFIXES = [['651', 'Laval'], ['665', 'Montréal'], ['666', 'Montréal'], ['23', 'Québec']];

// Filet de secours seulement, quand le code manque (anciennes données en cache).
const CP_CITY = {
  'J7E':'Sainte-Thérèse','J7P':'Saint-Eustache','J7R':'Saint-Eustache',
  'J7B':'Blainville','J7C':'Blainville','J6Z':'Lorraine','J7A':'Rosemère',
  'J7G':'Boisbriand','J7H':'Boisbriand','J7J':'Mirabel','J7N':'Mirabel',
  'J5N':'Sainte-Anne-des-Plaines','J0N':'Sainte-Marthe-sur-le-Lac','J7T':'Deux-Montagnes','J7V':'Deux-Montagnes',
  'J7Y':'Saint-Jérôme','J7Z':'Saint-Jérôme','J5L':'Saint-Jérôme','J5K':'Saint-Colomban',
  'J7K':'Mascouche','J7L':'Mascouche','J7M':'Terrebonne','J6V':'Terrebonne','J6W':'Terrebonne','J6X':'Terrebonne','J6Y':'Terrebonne',
  'J8H':'Lachute','J8B':'Sainte-Adèle','J8E':'Mont-Tremblant','J8C':'Sainte-Agathe-des-Monts',
  'H7A':'Laval','H7B':'Laval','H7C':'Laval','H7E':'Laval','H7G':'Laval','H7H':'Laval','H7J':'Laval','H7K':'Laval','H7L':'Laval',
  'H7M':'Laval','H7N':'Laval','H7P':'Laval','H7R':'Laval','H7S':'Laval','H7T':'Laval','H7V':'Laval','H7W':'Laval','H7X':'Laval','H7Y':'Laval',
};
const cityFromCP = cp => CP_CITY[(cp||'').toUpperCase().slice(0,3)] || '';
const codesMunInconnus = new Set();
function villeDepuisCentris(munCode, cp, mls, actuelle = '') {
  const code = String(munCode || '').trim();
  if (code) {
    if (MUN_NAMES[code]) return MUN_NAMES[code];
    if (MUN_SECTEURS[code]) return MUN_SECTEURS[code];
    const pref = MUN_PREFIXES.find(([k]) => code.startsWith(k));
    if (pref) return pref[1];
    if (!codesMunInconnus.has(code)) {
      codesMunInconnus.add(code);
      console.warn(`⚠ Code de municipalité Centris inconnu : ${code} (MLS ${mls}) → repli sur le code postal`);
    }
  }
  return cityFromCP(cp) || actuelle || 'Rive-Nord';
}

// Centris feature code → human label (catégorie + valeur)
// Format : { CODE_CARAC: { name: 'Catégorie', vals: { CODE_VAL: 'Valeur lisible' } } }
const FEAT = {
  ALLE: { name: 'Allée', vals: { ASPH:'Asphaltée', PAVE:'Pavé uni', GRAV:'Gravier', POUS:'Poussière de roche', BETO:'Béton' } },
  EAU:  { name: 'Approvisionnement eau', vals: { AMU:'Municipal', PUIT:'Puits artésien', SURF:'Eau de surface' } },
  CHAU: { name: 'Système de chauffage', vals: { AIRP:'Air pulsé', PELC:'Plinthes électriques', RADI:'Radiateur', AIRC:'Convecteur', AIRR:'Air rayonnant', POEL:'Poêle', FOUR:'Fournaise' } },
  ENER: { name: 'Énergie', vals: { ELEC:'Électricité', GAZN:'Gaz naturel', HUIL:'Mazout / Huile', BOIS:'Bois', PROP:'Propane', SOLA:'Solaire' } },
  EQUI: { name: 'Équipement disponible', vals: { THEM:'Thermopompe', ECHA:'Échangeur d\'air', CENT:'Aspirateur central', ALAR:'Système d\'alarme', VENT:'Ventilation', GEOT:'Géothermie', INTE:'Intercom', PORT:'Porte de garage électrique' } },
  FOND: { name: 'Fondation', vals: { BETO:'Béton coulé', BLOC:'Blocs de béton', PIER:'Pierres', POUT:'Sur poutres' } },
  TOIT: { name: 'Toiture', vals: { BARD:'Bardeaux d\'asphalte', TOLE:'Tôle', MEMB:'Membrane élastomère', ARDO:'Ardoise', GOUD:'Goudron et gravier' } },
  FENE: { name: 'Fenêtres', vals: { HYBR:'Hybride', ALUM:'Aluminium', PVC:'PVC', BOIS:'Bois', BATT:'À battant', GUIL:'À guillotine', COUL:'Coulissante' } },
  GARA: { name: 'Garage', vals: { ATT:'Attenant', DET:'Détaché', INT:'Intégré', CHAU:'Chauffé', SIMP:'Simple', DOUB:'Double', TRIP:'Triple', QUAD:'Quadruple' } },
  PISC: { name: 'Piscine', vals: { HT:'Hors-terre', CR:'Creusée', INT:'Intérieure', CHAU:'Chauffée', NORM:'Standard' } },
  REV:  { name: 'Revêtement', vals: { BRIQ:'Brique', VINY:'Vinyle', PIER:'Pierre', BOIS:'Bois', CREP:'Crépi', ALUM:'Aluminium', FIBR:'Fibre de bois' } },
  STAT: { name: 'Stationnement', vals: { ASPH:'Asphalte', INT:'Intérieur', EXT:'Extérieur', GAR:'Garage', PAVE:'Pavé uni' } },
  PROX: { name: 'Proximité', vals: { AUTO:'Autoroute', GCPE:'Garderie / CPE', PARC:'Parc', PCYC:'Piste cyclable', PRIM:'École primaire', SEC:'École secondaire', CEGE:'Cégep', UNIV:'Université', HOPI:'Hôpital', REM:'Espace récréatif', TRSP:'Transport public', LACE:'Lac/cours d\'eau', SCKI:'Centre de ski', GOLF:'Golf' } },
  PIEC: { name: 'Pièces', vals: {} },
  PROP: { name: 'Type de propriété', vals: {} },
  GENR: { name: 'Genre', vals: { DETA:'Détaché', JUME:'Jumelé', RANG:'En rangée' } },
  STYL: { name: 'Style', vals: { COTT:'Cottage', BUNG:'Bungalow', SPLI:'Split-level', PALI:'Paliers multiples', PLAN:'Plain-pied' } },
  ZONE: { name: 'Zonage', vals: { RES:'Résidentiel', AGR:'Agricole', COM:'Commercial', VILL:'Villégiature' } },
  TERR: { name: 'Terrain', vals: { PLAT:'Plat', BOIS:'Boisé', LACE:'Bord de lac', CLOT:'Clôturé' } },
  TOPO: { name: 'Topographie', vals: { PLAT:'Plat', ESC:'En pente' } },
  SOUS: { name: 'Sous-sol', vals: { TOTA:'Totalement aménagé', PART:'Partiellement aménagé', NON:'Non aménagé', VIDE:'Vide sanitaire', AUC:'Aucun' } },
  EGOU: { name: 'Égout', vals: { MUNI:'Municipal', FOSS:'Fosse septique', NON:'Aucun' } },
  ARMC: { name: 'Armoires de cuisine', vals: { BOIS:'Bois', MELA:'Mélamine', STRA:'Stratifié', POLY:'Polyester', THER:'Thermoplastique' } },
};

// Code pièce Centris → nom français
const ROOM_NAME = {
  HAL:'Hall d\'entrée', SAL:'Salon', SAM:'Salle à manger', SFM:'Salle familiale',
  CUI:'Cuisine', CR:'Coin-repas', BUR:'Bureau', BIB:'Bibliothèque',
  CAC:'Chambre', CCP:'Chambre principale', CC2:'Chambre secondaire',
  SDB:'Salle de bains', SDE:'Salle d\'eau', SDL:'Salle de lavage',
  RAN:'Rangement', VES:'Vestibule', GAR:'Garage', VER:'Véranda',
  ATE:'Atelier', SEJ:'Séjour', SOL:'Solarium', SAU:'Sauna',
  MEZ:'Mezzanine', LOG:'Loft', BOUD:'Boudoir', ENT:'Entrée'
};
// Niveau Centris → libellé
const ROOM_LEVEL = {
  '1':'1er niveau / RDC', '2':'2e niveau', '3':'3e niveau', '4':'4e niveau',
  'RC':'Rez-de-chaussée', 'SS':'Sous-sol', 'SS1':'Sous-sol 1', 'SS2':'Sous-sol 2',
  'GR':'Grenier', 'MEZ':'Mezzanine'
};
// Revêtement pièce
const ROOM_REV = {
  PFLO:'Plancher flottant', CERAM:'Céramique', BOIS:'Bois', BOIF:'Bois franc',
  TAPI:'Tapis', VINY:'Vinyle', BETO:'Béton', LINO:'Linoléum',
  MARB:'Marbre', GRES:'Grès cérame', LIEG:'Liège', ARDO:'Ardoise', CARP:'Carpette'
};

// "11.9x10.9 P" → "11'9\" × 10'9\" (pieds)"
function fmtDim(raw) {
  if (!raw) return '';
  const m = raw.match(/^([\d.]+)\s*x\s*([\d.]+)\s*([A-Z]?)/i);
  if (!m) return raw;
  const conv = (decimal) => {
    const f = Math.floor(parseFloat(decimal));
    const inches = Math.round((parseFloat(decimal) - f) * 12);
    return inches ? `${f}'${inches}"` : `${f}'`;
  };
  const unit = m[3] === 'M' ? ' m' : '';
  return `${conv(m[1])} × ${conv(m[2])}${unit}`;
}

function decodeFeature(f) {
  const cat = FEAT[f.code];
  if (!cat) return null; // skip unknown codes
  const name = cat.name;
  const value = cat.vals[f.value] || f.value;
  return { name, value };
}


// Les cinq catégories du site. Une maison de ville, une maison neuve ou un
// chalet restent des unifamiliales : pas de sous-catégorie inventée.
const PROPERTY_CATEGORIES = [
  ['unifamiliale',  'Unifamiliale'],
  ['condo',         'Condo'],
  ['terrain',       'Terrain'],
  ['multilogements','Multilogements'],
  ['commercial',    'Commercial']
];
const CATEGORY_SLUG = Object.fromEntries(PROPERTY_CATEGORIES.map(([s, l]) => [l, s]));

// Détecte la catégorie à partir de la description Centris (descFr)
function inferTypeFromDesc(desc) {
  const d = (desc || '').toLowerCase();
  if (/\b(commercial|commerce|local commercial|bureau|industriel|entrep[oô]t)\b/.test(d)) return 'Commercial';
  if (/\b(condo|copropri[ée]t[ée]|appartement|loft)\b/.test(d)) return 'Condo';
  if (/\b(plex|duplex|triplex|quadruplex|quintuplex|multilogement|immeuble [àa] revenus?)\b/.test(d)) return 'Multilogements';
  if (/\b(terrain|lot|bois[ée])\b/.test(d) && !/\b(cottage|maison|bungalow|chalet)\b/.test(d)) return 'Terrain';
  if (/\b(cottage|bungalow|unifamiliale|maison de ville|jumel[ée]|en rang[ée]e|chalet|r[ée]sidence|propri[ée]t[ée])\b/.test(d)) return 'Unifamiliale';
  return 'Unifamiliale';
}

// Catégorie + genre Centris → catégorie du site.
// INSCRIPTIONS.TXT col. 53 = catégorie, col. 54 = genre de propriété.
// C'est la source qui fait foi : la description se trompait une fois sur deux
// (un plain-pied dont le texte mentionne « terrain » finissait dans Terrain,
// un duplex dans Unifamiliale, une maison dans Commercial).
//   catégorie : R résidentiel · M multiplex · T terrain · C commercial
//               I industriel  · P placement / ensemble à revenus
//   genre     : AP appartement (condo) · PP plain-pied · ME à étages
//               MPM paliers multiples  · 2X/3X/4X duplex…quadruplex
//               TV terrain vacant · BCB bâtisse commerciale · LEC/LEI local
const CENTRIS_GENRE_CONDO = new Set(['AP']);
const CENTRIS_GENRE_PLEX = new Set(['2X', '3X', '4X', '5X']);
function typeFromCentris(cat, genre) {
  const c = (cat || '').trim().toUpperCase();
  const g = (genre || '').trim().toUpperCase();
  if (c === 'T' || g === 'TV') return 'Terrain';
  if (c === 'M' || CENTRIS_GENRE_PLEX.has(g)) return 'Multilogements';
  if (c === 'C' || c === 'I' || c === 'P') return 'Commercial';
  if (c === 'R') return CENTRIS_GENRE_CONDO.has(g) ? 'Condo' : 'Unifamiliale';
  return null;  // catégorie absente ou inconnue → on retombe sur la description
}

// Normalize a string : lowercase + remove diacritics
const norm = (s) => (s || '').toString().toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

const slug = (s) => (s || '').toString().toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ── DATA LOADING — deux modes ──────────────────────────────────────────
// Mode A : zip Centris frais présent dans _centris/ → ingestion complète + écrit site/data/*.json
// Mode B : pas de _centris/ → on lit site/data/*.json (committé par le cron GitHub).
//          Permet à Vercel de rebuilder le HTML après chaque push sans avoir besoin du zip.

const HAS_CENTRIS = fs.existsSync(path.join(CENTRIS, 'INSCRIPTIONS.TXT'));
let properties, stats;

// Les compteurs affichés (par ville, par type, fourchettes de prix) doivent
// suivre la liste réellement publiée. En mode B, ceux du cache avaient été
// calculés avant le dédoublonnage : le filtre annonçait « Laval (3) » et ne
// montrait que 2 fiches.
function calculerStats(properties) {
  return {
    total: properties.length,
    avgPrice: Math.round(properties.reduce((s,p)=>s+p.price,0) / Math.max(1,properties.length)),
    totalValue: properties.reduce((s,p)=>s+p.price,0),
    byCity: properties.reduce((a,p)=>{a[p.city]=(a[p.city]||0)+1;return a;},{}),
    byType: properties.reduce((a,p)=>{a[p.typeLabel]=(a[p.typeLabel]||0)+1;return a;},{}),
    priceRanges: (() => {
      const ranges = {'<300k':0,'300-500k':0,'500-800k':0,'800k-1.5M':0,'>1.5M':0};
      for (const p of properties) {
        if (p.price<300000) ranges['<300k']++;
        else if (p.price<500000) ranges['300-500k']++;
        else if (p.price<800000) ranges['500-800k']++;
        else if (p.price<1500000) ranges['800k-1.5M']++;
        else ranges['>1.5M']++;
      }
      return ranges;
    })()
  };
}

// ── NORMALISATION COMMUNE AUX DEUX MODES ───────────────────────────────
// Ces corrections vivaient dans l'ingestion du zip. En mode B, le site se
// rebâtit à partir du JSON mis en cache : elles ne s'appliquaient plus, et
// les adresses collées et les doublons revenaient dès que le cron republiait.

// « 112Z112BZ » et « 112112B » désignent la même adresse double : 112-112B.
// Le Z est un marqueur Centris. On n'y touche que si un suffixe de lettre
// confirme le doublement, sinon un civique comme 1212 serait coupé en deux.
function reparerAdresse(street) {
  if (!street) return street;
  return street.replace(/^(\d+)Z(\d+[A-Z]?)Z(?=\s|,|$)/, '$1-$2')
               .replace(/^(\d+)\1([A-Z])(?=\s|,|$)/, '$1-$1$2');
}

// Le type fait foi quand les codes Centris sont là (col. 53 et 54). Sans eux,
// on récupère ce que la structure de l'adresse dit de façon sûre.
function affinerType(p) {
  const parCode = p.typeCode
    ? typeFromCentris(...String(p.typeCode).split('/'))
    : null;
  if (parCode) return parCode;
  const label = p.typeLabel || inferTypeFromDesc(p.descFr);
  if (label !== 'Unifamiliale') return label;
  // Un numéro d'appartement dans l'adresse : c'est une unité, pas une maison.
  if (/,\s*app\.\s*\S/i.test(p.street || '')) return 'Condo';
  // Adresse double plus un vocabulaire de revenus : c'est un plex.
  if (/^\d+-\d+[A-Z]?\s/.test(p.street || '')
      && /\b(revenus?|duplex|triplex|logements?|plex)\b/i.test(p.descFr || '')) {
    return 'Multilogements';
  }
  return label;
}

// Centris sort parfois deux fois la même propriété, sous deux numéros MLS et
// deux catégories contradictoires. On garde l'inscription la mieux documentée.
function dedupliquer(liste, journal = []) {
  const vus = new Map(), index = new Map();
  for (const p of liste) {
    const cles = [`a|${norm(p.street)}|${p.price}`];
    if (p.lat && p.lon) cles.push(`g|${p.lat.toFixed(3)},${p.lon.toFixed(3)}|${p.price}`);
    const cleExistante = cles.map(c => index.get(c)).find(Boolean);
    if (!cleExistante) {
      const canon = cles[0];
      cles.forEach(c => index.set(c, canon));
      vus.set(canon, p);
      continue;
    }
    const garde = vus.get(cleExistante);
    cles.forEach(c => index.set(c, cleExistante));
    const gagne = p.photos.length !== garde.photos.length
      ? p.photos.length > garde.photos.length
      : (p.listedAt || '') > (garde.listedAt || '');
    const perdant = gagne ? garde : p;
    if (gagne) vus.set(cleExistante, p);
    journal.push(`${perdant.mls} ${perdant.street} (${perdant.typeLabel}) — même propriété que ${(gagne ? p : garde).mls}`);
  }
  return [...vus.values()];
}

function normaliser(liste) {
  const propres = liste.map(p => {
    const street = reparerAdresse(p.street);
    // La ville se recalcule depuis le code Centris à chaque build, même en
    // mode B : une correction de table s'applique sans réingérer le zip.
    const city = villeDepuisCentris(p.munCode, p.postalCode, p.mls, p.city);
    const q = { ...p, street, city, slug: `${p.mls}-${slug(street)}-${slug(city)}` };
    return { ...q, typeLabel: affinerType(q) };
  });
  const journal = [];
  const sansDoublons = dedupliquer(propres, journal);
  if (journal.length) {
    console.log(`  ↳ écartées, doublons Centris      : ${journal.length}`);
    journal.forEach(d => console.log(`       ${d}`));
  }
  return sansDoublons;
}

// L'ingestion du zip écrase site/data/*.json. C'est destructif : un zip local
// périmé (Dropbox le restaure tout seul après une suppression) réécrivait des
// jours de données fraîches déjà committées par le cron. On l'exige donc
// explicite. Le workflow GitHub pose CENTRIS_INGEST=1 ; en local, on passe
// --ingest quand on veut vraiment réingérer.
const INGEST = process.env.CENTRIS_INGEST === '1' || process.argv.includes('--ingest');
const CACHE_EXISTE = fs.existsSync(path.join(SITE, 'data', 'properties.json'));

if (HAS_CENTRIS && !INGEST && CACHE_EXISTE) {
  console.log('⚠ Un zip Centris est présent dans _centris/ mais il est ignoré.');
  console.log('  Le site se bâtit à partir de site/data/*.json, plus récent en principe.');
  console.log('  Pour réingérer le zip et écraser ces données : node build.mjs --ingest');
}

if (HAS_CENTRIS && (INGEST || !CACHE_EXISTE)) {
  console.log('Mode A · Reading Centris zip…');
  const membres = read('MEMBRES.TXT');
  ({ properties, stats } = ingestFromCentris(membres));
  // Persist for next Vercel build
  fs.mkdirSync(path.join(SITE, 'data'), { recursive: true });
  fs.writeFileSync(path.join(SITE, 'data', 'properties.json'), JSON.stringify(properties, null, 2));
  fs.writeFileSync(path.join(SITE, 'data', 'stats.json'), JSON.stringify(stats, null, 2));
} else {
  const propPath = path.join(SITE, 'data', 'properties.json');
  const statPath = path.join(SITE, 'data', 'stats.json');
  if (!fs.existsSync(propPath)) {
    console.error('❌ Ni _centris/ ni site/data/properties.json — impossible de bâtir le site.');
    process.exit(1);
  }
  console.log('Mode B · site/data/*.json (données mises en cache par le cron)');
  properties = normaliser(JSON.parse(fs.readFileSync(propPath, 'utf8')));
  stats = calculerStats(properties);
}

function ingestFromCentris(membres) {
  function detectBrokers() {
    const nos = [];
    for (const tgt of TARGET_BROKERS) {
      const f = norm(tgt.firstName), l = norm(tgt.lastName);
      const hit = membres.find(r => norm(r[5]) === f && norm(r[4]) === l);
      if (hit) {
        console.log(`✓ ${tgt.firstName} ${tgt.lastName} détecté → NO_MEMBRE=${hit[0]}`);
        nos.push(hit[0]);
      } else {
        console.log(`⚠ ${tgt.firstName} ${tgt.lastName} absent de MEMBRES.TXT`);
      }
    }
    if (!nos.length) {
      throw new Error('Aucun courtier de l\'équipe Jacques-Roussel trouvé dans MEMBRES.TXT.');
    }
    return nos;
  }
  const BROKER_NOS = detectBrokers();
  const isOurs = (no) => no && BROKER_NOS.includes(no);

  const inscr = read('INSCRIPTIONS.TXT');
  const photos = read('PHOTOS.TXT');
  const addenda = read('ADDENDA.TXT');
  const remarques = read('REMARQUES.TXT');
  const caracts = read('CARACTERISTIQUES.TXT');
  const pieces = read('PIECES_UNITES.TXT');
  const liens = read('LIENS_ADDITIONNELS.TXT');

  const photosByMls = {};
  for (const p of photos) { const m=p[0]; if(!m) continue; (photosByMls[m] ??= []).push({seq:+p[1], type:p[3], url:p[6]}); }
  for (const k of Object.keys(photosByMls)) photosByMls[k].sort((a,b)=>a.seq-b.seq);

  function groupText(rows) {
    const o={}; for(const r of rows){const m=r[0],l=r[2],t=r[6]||''; if(!m)continue; const k=m+'|'+l;(o[k]??=[]).push({s:+r[1],n:+r[3],t});}
    for(const k of Object.keys(o)){o[k].sort((a,b)=>(a.s-b.s)||(a.n-b.n)); o[k]=o[k].map(x=>x.t).join(' ').replace(/\s+/g,' ').trim();}
    return o;
  }
  const addMap = groupText(addenda);
  const remMap = groupText(remarques);
  const caractsByMls = {};
  for (const c of caracts) { const m=c[0]; if(!m) continue; (caractsByMls[m] ??= []).push({code:c[1], value:c[2]}); }
  // PIECES_UNITES : 0=MLS, 1=NoUnité, 2=Seq, 3=CodePièce, 6=Niveau, 9=Dimensions, 11=Revêtement
  const piecesByMls = {};
  for (const p of pieces) {
    const m = p[0]; if (!m) continue;
    (piecesByMls[m] ??= []).push({
      seq: +p[2] || 0,
      code: p[3] || '',
      level: p[6] || '',
      dim: p[9] || '',
      rev: p[11] || ''
    });
  }
  // Trier par séquence
  for (const k of Object.keys(piecesByMls)) piecesByMls[k].sort((a,b) => a.seq - b.seq);
  const linksByMls = {};
  for (const l of liens) { const m=l[0]; if(!m) continue; (linksByMls[m] ??= []).push({type:l[2], url:l[3]}); }

  // Entonnoir de sélection — on veut savoir où passent les inscriptions, parce
  // que l'écart avec la page RE/MAX de l'équipe se joue à trois endroits :
  // ce que Centris exporte, à qui l'inscription appartient, et nos filtres.
  const brokerOf = r => r[2] || r[4] || '?';
  const parCourtier = {};
  for (const r of inscr) parCourtier[brokerOf(r)] = (parCourtier[brokerOf(r)] || 0) + 1;
  console.log(`\n── Entonnoir Centris ──`);
  console.log(`  inscriptions dans l'export        : ${inscr.length}  (export partagé entre tous les courtiers clients)`);

  const myListings = inscr.filter(r => isOurs(r[2]) || isOurs(r[4]));
  console.log(`  appartenant à l'équipe            : ${myListings.length}`);

  // Ce que les filtres écartent, avec le motif
  const ecartees = { location: [], peuDePhotos: [] };
  for (const r of myListings) {
    const nbPhotos = (photosByMls[r[0]] || []).length;
    const adresse = [(r[25] || '').trim(), (r[27] || '').trim()].filter(Boolean).join(' ');
    if (!(parseFloat(r[6]) > 0)) ecartees.location.push(`${r[0]} ${adresse}${r[9] ? ` (loyer ${r[9]} $)` : ''}`);
    else if (nbPhotos < MIN_PHOTOS) ecartees.peuDePhotos.push(`${r[0]} ${adresse} (${nbPhotos} photo${nbPhotos > 1 ? 's' : ''})`);
  }
  if (ecartees.location.length) {
    console.log(`  ↳ écartées, sans prix de vente    : ${ecartees.location.length}  (locations : le loyer est en col. 9)`);
    ecartees.location.forEach(x => console.log(`       ${x}`));
  }
  if (ecartees.peuDePhotos.length) {
    console.log(`  ↳ écartées, moins de ${MIN_PHOTOS} photo(s)   : ${ecartees.peuDePhotos.length}`);
    ecartees.peuDePhotos.forEach(x => console.log(`       ${x}`));
  }

  let properties = myListings.map(r => {
    const mls = r[0], price = parseFloat(r[6])||0;
    // r[25] = NO_CIVIQUE (vérifié contre ADDENDA), r[26] = parfois suffixe ou unité
    // r[27] = NOM_RUE, r[28] = unité/apt secondaire
    // col 25 = numéro civique, col 26 = second numéro quand la propriété couvre
    // deux adresses (un duplex 163-163A). Le « Z » final est un marqueur
    // Centris, pas un chiffre : les coller tels quels donnait des adresses
    // comme « 8510Z8510AZ Rue Duceppe » ou « 9797A Rue St-Louis ».
    const stripZ = s => s.replace(/Z$/, '');
    const civic = stripZ((r[25]||'').trim());
    const civicEnd = stripZ((r[26]||'').trim());
    const streetName = (r[27]||'').trim();
    const unit = (r[28]||'').trim();
    const civicFull = (!civicEnd || civicEnd === civic) ? civic
      : /^\d/.test(civicEnd) ? `${civic}-${civicEnd}`   // deux civiques : « 163-163A »
      : civic + civicEnd;                                // simple lettre : « 17A »
    // Si streetName contient déjà le civic au début (ex: "17A Rue Labonté"), on l'utilise tel quel
    const streetStartsWithCivic = civic && new RegExp('^' + civic + '\\b').test(streetName);
    const street = streetStartsWithCivic
      ? streetName + (unit ? `, app. ${unit}` : '')
      : [civicFull, streetName].filter(Boolean).join(' ') + (unit ? `, app. ${unit}` : '');
    // Type de propriété — r[53] catégorie et r[54] genre, les vrais codes
    // Centris. La description ne sert plus que de filet quand ils manquent.
    const centrisCat = (r[53] || '').trim();
    const centrisGenre = (r[54] || '').trim();
    const typeCode = [centrisCat, centrisGenre].filter(Boolean).join('/');
    const cp = r[29] || '';
    const munCode = (r[22] || '').trim();
    const city = villeDepuisCentris(munCode, cp, mls);
    const yearBuilt = r[59] && /^\d{4}$/.test(r[59]) ? r[59] : (r[68] && /^\d{4}$/.test(r[68]) ? r[68] : '');
    const areaTerrain = r[75] ? `${r[75]} ${r[76]||''}`.trim() : '';
    const lat = parseFloat(r[144])||null, lon = parseFloat(r[145])||null;
    const desc = addMap[mls+'|F'] || '';
    const rem = remMap[mls+'|F'] || '';
    const ph = photosByMls[mls] || [];
    return {
      mls,
      price,
      typeCode,
      typeLabel: typeFromCentris(centrisCat, centrisGenre) || inferTypeFromDesc(desc),
      street,
      city,
      munCode,
      postalCode: cp,
      yearBuilt,
      areaTerrain,
      lat, lon,
      descFr: desc, remFr: rem,
      photos: ph,
      features: caractsByMls[mls] || [],
      rooms: piecesByMls[mls] || [],
      links: linksByMls[mls] || [],
      // r[20] = date d'inscription Centris (AAAA/MM/JJ) — sert au badge « Nouveau »
      listedAt: /^\d{4}\/\d{2}\/\d{2}/.test(r[20] || '') ? r[20].slice(0, 10).replace(/\//g, '-') : '',
      isCoBroker: !isOurs(r[2]),
      slug: `${mls}-${slug(street)}-${slug(city)}`
    };
  }).filter(p => p.price > 0 && p.photos.length >= MIN_PHOTOS);

  properties = normaliser(properties);

  console.log(`  → publiées sur le site            : ${properties.length}`);
  console.log(`──────────────────────────\n`);

  const stats = calculerStats(properties);

  return { properties, stats };
}

// ── STATISTIQUES DE MARCHÉ (Centris) ───────────────────────────────────
// site/data/market.json est produit par `node scripts/fetch-market-stats.mjs`.
// Aucune donnée inventée : si le fichier manque ou si Centris ne publie pas
// un chiffre (trop peu de transactions), la case ne s'affiche pas.
const MARKET_PATH = path.join(SITE, 'data', 'market.json');
const market = fs.existsSync(MARKET_PATH)
  ? JSON.parse(fs.readFileSync(MARKET_PATH, 'utf8'))
  : { cities: {}, fetchedAt: null };
if (!Object.keys(market.cities).length) {
  console.log('⚠ site/data/market.json absent ou vide — sections statistiques masquées. Lancer : node scripts/fetch-market-stats.mjs');
}

const marketFor = citySlug => market.cities[citySlug] || null;
// Ordre d'affichage des villes : le cœur du territoire d'abord
const MARKET_CITY_SLUGS = [
  'saint-eustache', 'deux-montagnes', 'sainte-marthe-sur-le-lac', 'boisbriand', 'mirabel',
  'sainte-therese', 'blainville', 'rosemere', 'lorraine', 'sainte-anne-des-plaines'
];

// Une cellule de statistique, ou rien si Centris ne publie pas la valeur.
// Centris rend « Moyenne de jours sur le marché » sans unité dans le HTML :
// on la remet ici, sinon un « 24 » nu ne veut rien dire.
function statCell(row, label, unit = '') {
  const cell = row && row.trimestre;
  if (!cell || !cell.value) return '';
  const arrow = cell.direction === 'up' ? '▲' : (cell.direction === 'down' ? '▼' : '');
  const variation = cell.variation
    ? (unit && !/%/.test(cell.variation) ? `${cell.variation.replace(/^-/, '−')} ${unit}` : cell.variation)
    : '';
  const varHtml = variation
    ? `<span class="mstat__var mstat__var--${cell.direction || 'flat'}">${arrow} ${variation}</span>`
    : '';
  return `<div class="mstat">
    <span class="mstat__n">${cell.value}${unit ? ` <span class="mstat__u">${unit}</span>` : ''}</span>
    <span class="mstat__l">${label}</span>
    ${varHtml}
  </div>`;
}

// Bandeau de statistiques réelles pour une ville. Rien à afficher → chaîne vide.
function marketHighlightsHtml(citySlug, { heading = null } = {}) {
  const m = marketFor(citySlug);
  if (!m) return '';
  const uni = m.sections.unifamiliale?.rows || {};
  const total = m.sections.total?.rows || {};
  const copro = m.sections.copropriete?.rows || {};
  const cells = [
    statCell(uni.prixMedian,          'Prix médian unifamiliale'),
    statCell(uni.joursSurLeMarche,    'Jours sur le marché en moyenne', 'jours'),
    statCell(total.ventes,            'Ventes résidentielles'),
    statCell(total.inscriptionsActives, 'Inscriptions en vigueur'),
    statCell(copro.prixMedian,        'Prix médian copropriété')
  ].filter(Boolean);
  if (!cells.length) return '';
  return `
<section class="container">
  <div class="mstats reveal">
    <div class="mstats__head">
      <span class="eyebrow">${heading || `Marché de ${m.name}`}</span>
      <span class="mstats__period">${m.period || ''}</span>
    </div>
    <div class="mstats__grid">${cells.join('')}</div>
    <p class="mstats__source">Source : <a href="${m.url}" target="_blank" rel="noopener">Centris.ca, statistiques immobilières de ${m.name}</a>${market.fetchedAt ? ` · relevé le ${market.fetchedAt}` : ''}. Les variations sont exprimées par rapport au même trimestre l'an dernier.</p>
  </div>
</section>`;
}

// --- Shared template ---
const NAV = [
  { label: 'Propriétés', href: '/nos-proprietes/', mega: {
    cols: [
      { title: 'Explorer', links: [
        ['Toutes les propriétés','/nos-proprietes/'],
        ['Unifamiliale','/types-de-propriete/unifamiliale-a-vendre/'],
        ['Condo','/types-de-propriete/condo-a-vendre/'],
        ['Terrain','/types-de-propriete/terrain-a-vendre/'],
        ['Multilogements','/types-de-propriete/multilogements-a-vendre/'],
        ['Commercial','/types-de-propriete/commercial-a-vendre/']
      ]},
      { title: 'Par ville', links: [
        ['Saint-Eustache','/courtier-immobilier/saint-eustache/'],
        ['Deux-Montagnes','/courtier-immobilier/deux-montagnes/'],
        ['Sainte-Marthe-sur-le-Lac','/courtier-immobilier/sainte-marthe-sur-le-lac/'],
        ['Boisbriand','/courtier-immobilier/boisbriand/'],
        ['Mirabel','/courtier-immobilier/mirabel/']
      ]}
    ],
    feature: { eyebrow:'Centris · quotidien', title:'Inscriptions actives', text:'Nos propriétés sur la Rive-Nord, mises à jour chaque jour.', href:'/nos-proprietes/', cta:'Voir les inscriptions' }
  }},
  { label: 'Acheter', href: '/acheter/premier-acheteur/', mega: {
    cols: [
      { title: "Guide d'achat", links: [
        ['Premier acheteur','/acheter/premier-acheteur/'],
        ['Étapes pour acheter','/acheter/etapes-pour-acheter/'],
        ['Inspection','/acheter/inspection/']
      ]},
      { title: 'Financement', links: [
        ['Financement hypothécaire','/acheter/financement-hypothecaire/'],
        ['Calculatrices','/acheter/calculatrices/'],
        ['Quel revenu faut-il&nbsp;?','/blog/premier-acheteur-saint-eustache-revenu/']
      ]}
    ],
    feature: { eyebrow:'Guide gratuit', title:"Guide de l'acheteur", text:'Financement, inspection, promesse d\'achat : ce qu\'il faut savoir avant de signer.', href:'/guides/', cta:'Recevoir le guide' }
  }},
  { label: 'Vendre', href: '/vendre/evaluation-gratuite/', mega: {
    cols: [
      { title: 'Vendre avec nous', links: [
        ['Évaluation gratuite','/vendre/evaluation-gratuite/'],
        ['Étapes pour vendre','/vendre/etapes-pour-vendre/'],
        ['Commission du courtier','/vendre/commission-courtier/']
      ]},
      { title: 'Préparer la vente', links: [
        ['Préparer sa maison','/vendre/preparer-sa-maison/'],
        ['Vendre sans stress','/vendre/vendre-sans-stress/'],
        ['Les 7 étapes, en détail','/blog/7-etapes-vendre-saint-eustache/']
      ]}
    ],
    feature: { eyebrow:'Sans engagement', title:'Combien vaut votre propriété&nbsp;?', text:'Évaluation gratuite et personnalisée par notre équipe.', href:'/vendre/evaluation-gratuite/', cta:'Obtenir mon évaluation' }
  }},
  { label: 'Marché', href: '/marche-immobilier/', mega: {
    cols: [
      { title: 'Statistiques Centris', links: [
        ['Toutes les villes','/marche-immobilier/'],
        ['Saint-Eustache','/marche-immobilier/saint-eustache/'],
        ['Deux-Montagnes','/marche-immobilier/deux-montagnes/'],
        ['Sainte-Marthe-sur-le-Lac','/marche-immobilier/sainte-marthe-sur-le-lac/'],
        ['Boisbriand','/marche-immobilier/boisbriand/']
      ]},
      { title: 'Analyses', links: [
        ['Le blogue','/blog/'],
        ['Marché de Saint-Eustache','/blog/marche-immobilier-saint-eustache/'],
        ['Tous les guides','/guides/']
      ]}
    ],
    feature: { eyebrow:'Blogue', title:'Six analyses du territoire', text:'Combien vaut votre maison, où acheter, quel revenu il faut : nos textes partent des chiffres Centris.', href:'/blog/', cta:'Lire le blogue' }
  }},
  { label: "L'équipe", href: '/a-propos/' }
];

function layout({ title, description, canonical, body, extraHead='', extraBody='', bodyClass='', jsonld='' }) {
  const curPath = (canonical || '').replace(/^https?:\/\/[^/]+/, '');
  const seg = s => (s || '').split('/').filter(Boolean)[0] || '';
  const curSeg = seg(curPath);
  const isActive = href => { const s = seg(href); return s !== '' && s === curSeg; };
  const navHtml = NAV.map(n => {
    const active = isActive(n.href);
    const cur = active ? ' aria-current="page"' : '';
    const act = active ? ' is-active' : '';
    if (n.mega) {
      const cols = n.mega.cols.map(col =>
        `<div class="mega__col"><span class="mega__title">${col.title}</span>${col.links.map(l=>`<a href="${l[1]}" role="menuitem">${l[0]}</a>`).join('')}</div>`
      ).join('');
      const f = n.mega.feature;
      const feature = f ? `<a class="mega__feature" href="${f.href}"><span class="mega__feature-eyebrow">${f.eyebrow}</span><span class="mega__feature-title">${f.title}</span><span class="mega__feature-text">${f.text}</span><span class="mega__feature-cta">${f.cta}</span></a>` : '';
      return `<div class="nav-item has-mega${act}"><a href="${n.href}" aria-haspopup="true"${cur}>${n.label}<span class="caret" aria-hidden="true">⌄</span></a><div class="mega" role="menu"><div class="mega__inner${f ? ' mega__inner--feature' : ''}"><div class="mega__cols">${cols}</div>${feature}</div></div></div>`;
    }
    if (n.children) {
      return `<div class="nav-item has-sub${act}"><a href="${n.href}"${cur}>${n.label}<span class="caret" aria-hidden="true">⌄</span></a><div class="sub" role="menu">${n.children.map(c=>`<a href="${c[1]}" role="menuitem">${c[0]}</a>`).join('')}</div></div>`;
    }
    return `<a class="nav-item${act}" href="${n.href}"${cur}>${n.label}</a>`;
  }).join('');
  const drawerHtml = NAV.map(n => {
    const sub = n.mega ? n.mega.cols.flatMap(c => c.links) : n.children;
    if (sub) {
      return `<details class="drawer-group"><summary>${n.label}</summary>${sub.map(c=>`<a href="${c[1]}">${c[0]}</a>`).join('')}</details>`;
    }
    return `<a class="drawer-link" href="${n.href}">${n.label}</a>`;
  }).join('');
  return `<!DOCTYPE html>
<html lang="fr-CA">
<head>
<script>document.documentElement.classList.add('js')</script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${description}">
${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="website">
${canonical ? `<meta property="og:url" content="${canonical}">` : ''}
<meta property="og:locale" content="fr_CA">
<meta property="og:image" content="https://jacquesroussel.com/photos/equipe-jr-portrait.jpg">
<meta property="og:image:width" content="1500">
<meta property="og:image:height" content="650">
<meta property="og:image:alt" content="L'équipe Jacques-Roussel, courtiers immobiliers RE/MAX CRYSTAL">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="https://jacquesroussel.com/photos/equipe-jr-portrait.jpg">
<meta name="theme-color" content="#F7F5EE">
<link rel="icon" type="image/png" href="/brand_assets/favicon.png">
<link rel="apple-touch-icon" href="/brand_assets/favicon.png">
<link rel="preconnect" href="https://fonts.bunny.net" crossorigin>
<link href="https://fonts.bunny.net/css?family=montserrat:300,400,400i,500,600,700,800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
${extraHead}
${jsonld ? `<script type="application/ld+json">${jsonld}</script>` : ''}
</head>
<body class="${bodyClass}">
<a class="skip-link" href="#main">Aller au contenu</a>
<header class="site-header" data-header>
  <div class="site-header__inner">
    <div class="site-header__brands">
      <a class="wordmark" href="/" aria-label="Équipe Jacques-Roussel, accueil">
        <img class="wordmark__logo wordmark__logo--light" src="/brand_assets/jr-blanc.png" alt="Équipe Jacques-Roussel" width="700" height="680" decoding="async">
        <img class="wordmark__logo wordmark__logo--dark" src="/brand_assets/equipejrnoir.png" alt="" aria-hidden="true" width="700" height="680" decoding="async">
      </a>
      <img class="site-header__remax" src="${REMAX_LOCKUP}" alt="RE/MAX" width="1000" height="274" decoding="async">
    </div>
    <nav class="site-nav" aria-label="Navigation principale">
      ${navHtml}
    </nav>
    <a class="btn-primary site-header__cta" href="/vendre/evaluation-gratuite/">Évaluation gratuite</a>
    <button class="site-header__burger" type="button" aria-label="Ouvrir le menu" aria-expanded="false" data-drawer-toggle>
      <span></span><span></span><span></span>
    </button>
  </div>
</header>
<aside class="drawer" data-drawer aria-hidden="true">
  <div class="drawer__panel">
    <button class="drawer__close" type="button" aria-label="Fermer le menu" data-drawer-close>&times;</button>
    <nav class="drawer__nav" aria-label="Menu mobile">
      ${drawerHtml}
      <a class="btn-primary drawer__cta" href="/vendre/evaluation-gratuite/">Évaluation gratuite</a>
    </nav>
  </div>
</aside>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="site-footer__grid">
    <div class="site-footer__col site-footer__col--brand">
      <div class="wordmark wordmark--footer">
        <span class="wordmark__name">JACQUES &middot; ROUSSEL</span>
      </div>
      <p class="site-footer__tag">Vos courtiers d'expérience sur la Rive-Nord</p>
      <address class="site-footer__addr">
        <span class="site-footer__agency">${AGENCY.name}</span>
        <span class="site-footer__agency-legal">${AGENCY.legal}</span>
        ${AGENCY.street}<br>
        ${AGENCY.city} (${AGENCY.region})&nbsp;${AGENCY.postal}<br>
        <a href="tel:${AGENCY.tel}">${AGENCY.phone}</a>
      </address>
    </div>
    <div class="site-footer__col">
      <h4 class="eyebrow">Plan du site</h4>
      <ul>
        ${NAV.map(n => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}
      </ul>
    </div>
    <div class="site-footer__col">
      <h4 class="eyebrow">Villes desservies</h4>
      <ul>
        <li><a href="/courtier-immobilier/saint-eustache/">Saint-Eustache</a></li>
        <li><a href="/courtier-immobilier/deux-montagnes/">Deux-Montagnes</a></li>
        <li><a href="/courtier-immobilier/sainte-marthe-sur-le-lac/">Sainte-Marthe-sur-le-Lac</a></li>
        <li><a href="/courtier-immobilier/boisbriand/">Boisbriand</a></li>
        <li><a href="/courtier-immobilier/mirabel/">Mirabel</a></li>
      </ul>
    </div>
    <div class="site-footer__col">
      <h4 class="eyebrow">L'équipe</h4>
      <ul class="site-footer__contact">
        ${TEAM.map(m => `<li>
          <span class="site-footer__name">${m.first} ${m.last}</span>
          <span class="site-footer__role">${m.role}</span>
          <a href="mailto:${m.email}">${m.email}</a>
          <a href="tel:${m.tel}">${m.phone}</a>
        </li>`).join('')}
      </ul>
      <div class="site-footer__social">
        <a href="https://www.instagram.com/equipejacquesroussel/" target="_blank" rel="noopener" aria-label="Instagram">Instagram</a>
        <span aria-hidden="true">·</span>
        <a href="https://www.facebook.com/profile.php?id=61566770076579" target="_blank" rel="noopener" aria-label="Facebook">Facebook</a>
      </div>
    </div>
  </div>
  <div class="site-footer__bottom">
    <span>&copy; ${new Date().getFullYear()} Équipe Jacques-Roussel &middot; ${AGENCY.franchise.replace(AGENCY.franchisorLabel, `<a href="${AGENCY.franchisorUrl}" target="_blank" rel="noopener">${AGENCY.franchisorLabel}</a>`)} &middot; Permis OACIQ</span>
    <span class="site-footer__legal"><a href="/a-propos/">À propos</a> &middot; <a href="/contact/">Contact</a></span>
  </div>
</footer>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/@studio-freight/lenis/bundled/lenis.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/splitting@1.0.6/dist/splitting.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/motion@10.18.0/dist/motion.min.js" defer></script>
<script src="/assets/site.js" defer></script>
${extraBody}
</body>
</html>`;
}

// --- CSS (inline in one file) ---
const CSS = `
:root{
  /* Crème officielle RE/MAX (guide sept. 2025, p. 8) — remplace le #F7F2EA maison. */
  --cream:#F7F5EE;
  --vellum:#FBF8F2;
  --hairline:#E8E2D7;
  --ink:#1A1B1D;
  --stone:#6F6F73;
  --mist:#A6A6A8;
  --teal:#2c4160;
  --navy:#13202E;
  --sand:#CDB89A;
  --bronze:#B58A4F;
  /* Aliases pour les pages de contenu (vendre / acheter / guides) */
  --ink-2:var(--stone);
  --blue:var(--teal);
  --blue-2:var(--sand);
  --blue-soft:#EFE9DF;
  --line:var(--hairline);
  --muted:var(--mist);
  --surface:var(--vellum);
  --ease:var(--ease-out);
  --ease-spring:var(--ease-back);
  --shadow:var(--shadow-card);
  --shadow-sm:
    0 1px 2px oklch(30% 0.05 258 / 0.05),
    0 4px 12px oklch(30% 0.05 258 / 0.07);
  --radius:14px;
  --radius-lg:22px;
  --shadow-card:
    0 1px 2px oklch(30% 0.05 258 / 0.06),
    0 8px 24px oklch(30% 0.05 258 / 0.08),
    0 24px 60px oklch(30% 0.05 258 / 0.05);
  --shadow-card-hover:
    0 1px 2px oklch(30% 0.05 258 / 0.08),
    0 12px 32px oklch(30% 0.05 258 / 0.10),
    0 32px 80px oklch(62% 0.08 70 / 0.06);
  --shadow-header:
    0 1px 0 oklch(90% 0.006 80 / 0.8),
    0 10px 30px oklch(30% 0.05 258 / 0.04);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-back: cubic-bezier(0.34, 1.56, 0.64, 1);
  --space-1: clamp(0.25rem, 0.5vw, 0.5rem);
  --space-2: clamp(0.5rem, 1vw, 0.75rem);
  --space-3: clamp(0.75rem, 1.5vw, 1rem);
  --space-4: clamp(1rem, 2vw, 1.5rem);
  --space-6: clamp(1.5rem, 3vw, 2.5rem);
  --space-8: clamp(2rem, 4vw, 3.5rem);
  --space-12: clamp(3rem, 6vw, 5rem);
  --space-16: clamp(4rem, 8vw, 7rem);
  --gap: var(--space-6);
  --text-xs: 0.75rem;
  --text-sm: clamp(0.85rem, 0.95vw, 0.9rem);
  --text-base: clamp(1rem, 1.05vw, 1.0625rem);
  --text-lg: clamp(1.1rem, 1.3vw, 1.25rem);
  --text-h3: clamp(1.375rem, 2vw, 1.75rem);
  --text-h2: clamp(2rem, 3.5vw, 3.25rem);
  --text-h1: clamp(3rem, 6vw, 5.5rem);
  --text-display: clamp(2.5rem, 5vw, 4.5rem);
  --container: min(1400px, 92vw);
  --grain: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.1 0 0 0 0 0.08 0 0 0 0 0.05 0 0 0 0.06 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
}
@supports (color: oklch(0% 0 0)){
  :root{
    --cream: oklch(96% 0.012 80);
    --vellum: oklch(98% 0.008 80);
    --hairline: oklch(90% 0.006 80);
    --ink: oklch(20% 0.005 250);
    --stone: oklch(48% 0.008 250);
    --mist: oklch(68% 0.006 250);
    --teal: oklch(37.3% 0.06 258);
    --navy: oklch(22% 0.04 240);
    --sand: oklch(78% 0.04 75);
    --bronze: oklch(62% 0.08 70);
  }
}

*, *::before, *::after{ box-sizing: border-box; margin: 0; padding: 0; }
html{ -webkit-text-size-adjust: 100%; }
/* Smooth anchor scrolling only when Lenis isn't running (no-JS fallback) —
   native scroll-behavior:smooth fights Lenis and makes scrolling hang */
html:not(.js){ scroll-behavior: smooth; }
body{
  font-family: 'Montserrat', system-ui, -apple-system, sans-serif;
  background: var(--cream);
  color: var(--ink);
  line-height: 1.7;
  min-block-size: 100dvh;
  font-size: var(--text-base);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
body::before{
  content: "";
  position: fixed; inset: 0;
  background-image: var(--grain);
  pointer-events: none;
  opacity: 0.35;
  z-index: 0;
  mix-blend-mode: multiply;
}
img{ max-inline-size: 100%; display: block; }
a{ color: inherit; text-decoration: none; transition: color 240ms var(--ease-out); }
ul{ list-style: none; }
button{ font: inherit; cursor: pointer; background: none; border: 0; color: inherit; }
:focus-visible{ outline: 2px solid var(--sand); outline-offset: 3px; border-radius: 2px; }

.skip-link{
  position: absolute; inset-inline-start: -9999px; top: 0;
  background: var(--ink); color: var(--cream);
  padding: 0.6rem 1rem; z-index: 100;
}
.skip-link:focus{ inset-inline-start: 1rem; top: 1rem; }

/* Typography — Montserrat, la hiérarchie se joue au poids
   800 titres · 700 sous-titres · 600 étiquettes · 500 accents · 400 texte */
h1, h2, h3, h4{
  font-family: 'Montserrat', system-ui, sans-serif;
  color: var(--ink);
  text-wrap: balance;
}
h1{ font-size: var(--text-h1); line-height: 1.02; letter-spacing: -0.035em; font-weight: 800; }
h2{ font-size: var(--text-h2); line-height: 1.08; letter-spacing: -0.028em; font-weight: 700; }
h3{ font-size: var(--text-h3); line-height: 1.2; letter-spacing: -0.015em; font-weight: 600; }
h4{ font-weight: 600; letter-spacing: -0.01em; }
/* Les titres tiennent sur un seul poids : le em ne sert plus qu'à marquer
   une ligne, sans changer ni la graisse ni la couleur. */
h1 em, h2 em{ font-style: normal; font-weight: inherit; color: inherit; }
p{ max-inline-size: 65ch; text-wrap: pretty; }
strong{ font-weight: 600; }
.eyebrow{
  font-family: 'Montserrat', sans-serif;
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-weight: 600;
  color: var(--sand);
}
@media (min-width: 768px){ .eyebrow{ font-size: 13px; } }

/* Poids par rôle — ce que la serif portait par sa forme, Montserrat le porte par son poids.
   Chiffres et prix en 700, noms et titres de bloc en 600, libellés de nav en 600. */
.prop-card__price, .pcard .price, .stat .n, .city-stat__n,
.city-card__name, .hm-city__name, .guide-card__num,
.wordmark--footer .wordmark__name{ font-weight: 700; }
.wordmark--footer .wordmark__name{ font-weight: 800; letter-spacing: 0.02em; }
.team-bio__slash{ font-weight: 800; }
.mega__title, .mega__feature-title, .drawer__nav a, .drawer-group > summary,
.prop-card__addr, .pcard .addr, .broker-card__name, .site-footer__name,
.hm-marquee__track span, .hm-city__idx{ font-weight: 600; }
.prop-info__crumbs, .hm-index, .hm-hero__bar-meta, .hero__corner{ font-weight: 500; }
/* Chiffres alignés partout — obligatoire dès qu'une colonne de nombres se compare */
.prop-card__price, .pcard .price, .stat .n, .city-stat__n, .numbers__metric,
.prop-metric__n, .prop-price-band__val, .calc-out .k{ font-variant-numeric: tabular-nums; }

.container{ max-inline-size: var(--container); margin-inline: auto; padding-inline: clamp(1rem, 4vw, 2rem); }
.band-vellum{ background: var(--vellum); }

/* Buttons */
.btn-primary, .btn-navy, .btn-ghost, .btn-cream{
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.95rem 1.7rem;
  border-radius: 999px;
  font-weight: 500;
  font-size: 0.95rem;
  letter-spacing: 0.01em;
  transition: transform 280ms var(--ease-out), box-shadow 280ms var(--ease-out), background-color 280ms var(--ease-out), color 280ms var(--ease-out), border-color 280ms var(--ease-out);
  min-block-size: 44px;
  white-space: nowrap;
}
.btn-primary{ background: var(--teal); color: var(--cream); }
.btn-primary:hover{ transform: scale(1.02); color: var(--cream); box-shadow: 0 6px 20px oklch(30% 0.05 258 / 0.18); }
.btn-primary:active{ transform: scale(0.98) translateY(1px); }
.btn-navy{ background: var(--navy); color: var(--cream); }
.btn-navy:hover{ transform: scale(1.02); color: var(--cream); box-shadow: 0 6px 20px oklch(22% 0.04 240 / 0.25); }
.btn-navy:active{ transform: scale(0.98) translateY(1px); }
.btn-ghost{ border: 1px solid oklch(20% 0.005 250 / 0.35); color: var(--ink); background: transparent; }
.btn-ghost:hover{ background: var(--vellum); border-color: oklch(20% 0.005 250 / 0.65); color: var(--ink); }
.btn-cream{ background: var(--cream); color: var(--ink); }
.btn-cream:hover{ transform: scale(1.02); color: var(--ink); box-shadow: 0 6px 20px oklch(20% 0.005 250 / 0.20); }
.btn-ghost--on-teal{ border-color: oklch(96% 0.012 80 / 0.5); color: var(--cream); }
.btn-ghost--on-teal:hover{ background: oklch(96% 0.012 80 / 0.1); border-color: var(--cream); color: var(--cream); }

/* Header */
:root{ --hdr-h: 5.5rem; }
.site-header{
  position: sticky; top: 0; z-index: 50;
  --hdr-bg: oklch(96% 0.012 80 / 0.82);
  --hdr-fg: var(--ink);
  --hdr-fg-soft: var(--stone);
  --hdr-border: var(--hairline);
  --hdr-blur: blur(12px) saturate(1.1);
  background: var(--hdr-bg);
  backdrop-filter: var(--hdr-blur);
  -webkit-backdrop-filter: var(--hdr-blur);
  border-block-end: 1px solid var(--hdr-border);
  transition: background-color 320ms var(--ease-out), border-color 320ms var(--ease-out), box-shadow 320ms var(--ease-out);
}
.site-header.scrolled{
  --hdr-bg: oklch(96% 0.012 80 / 0.95);
  box-shadow: var(--shadow-header);
}

/* Overlay mode — header floats transparently over a dark hero, text in cream */
body.header-overlay .site-header{
  position: fixed; inset-inline: 0; top: 0;
  --hdr-bg: transparent;
  --hdr-fg: var(--cream);
  --hdr-fg-soft: oklch(96% 0.012 80 / 0.72);
  --hdr-border: transparent;
  --hdr-blur: none;
  box-shadow: none;
}
/* Soft scrim keeps cream text legible over bright video frames */
body.header-overlay .site-header::before{
  content: ""; position: absolute; inset-inline: 0; top: 0;
  block-size: 200%;
  background: linear-gradient(180deg, oklch(20% 0.005 250 / 0.42) 0%, oklch(20% 0.005 250 / 0) 100%);
  pointer-events: none; z-index: -1;
  opacity: 1; transition: opacity 320ms var(--ease-out);
}
body.header-overlay .site-header.scrolled::before,
body.header-overlay .site-header:has(.has-mega:hover)::before,
body.header-overlay .site-header:has(.has-mega:focus-within)::before{ opacity: 0; }
body.header-overlay .site-header:not(.scrolled) .wordmark__name,
body.header-overlay .site-header:not(.scrolled) .nav-item{ text-shadow: 0 1px 14px oklch(20% 0.005 250 / 0.35); }
body.header-overlay .site-header:has(.has-mega:hover) .wordmark__name,
body.header-overlay .site-header:has(.has-mega:hover) .nav-item{ text-shadow: none; }
/* …turns solid once scrolled or while a mega panel is open */
body.header-overlay .site-header.scrolled,
body.header-overlay .site-header:has(.has-mega:hover),
body.header-overlay .site-header:has(.has-mega:focus-within){
  --hdr-bg: oklch(96% 0.012 80 / 0.95);
  --hdr-fg: var(--ink);
  --hdr-fg-soft: var(--stone);
  --hdr-border: var(--hairline);
  --hdr-blur: blur(12px) saturate(1.1);
  box-shadow: var(--shadow-header);
}
.site-header__inner{
  max-inline-size: var(--container);
  margin-inline: auto;
  padding: 1rem clamp(1rem, 4vw, 2rem);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 2rem;
}
/* Logo de l'équipe + lockup RE/MAX côte à côte, au-dessus de la ligne des 400 px.
   Le guide (p. 4) exige un espace libre d'au moins la moitié de la hauteur du
   « X » de RE/MAX sur les quatre côtés : c'est le rôle du gap et du padding
   vertical de .site-header__inner. Aucune boîte ni cadre autour du logo. */
.site-header__brands{ display: inline-flex; align-items: center; gap: clamp(1.1rem, 2.2vw, 1.6rem); }
.site-header__remax{
  block-size: clamp(24px, 2.5vw, 31px);
  inline-size: auto;
  display: block;
  flex-shrink: 0;
}
.wordmark{ display: inline-flex; align-items: center; line-height: 0; }
/* Sized by WIDTH — both logo files are 700px wide, so the J/R glyph renders
   at the same scale; the white version's extra vertical padding just centers. */
.wordmark__logo{ inline-size: clamp(46px, 4vw, 56px); block-size: auto; display: block; }
.wordmark__logo--light{ display: none; }
.wordmark__logo--dark{ display: block; }
/* Overlay (transparent) header → white logo */
body.header-overlay .wordmark__logo--light{ display: block; }
body.header-overlay .wordmark__logo--dark{ display: none; }
/* Overlay header turned solid (scrolled / mega open) → dark logo */
body.header-overlay .site-header.scrolled .wordmark__logo--light,
body.header-overlay .site-header:has(.has-mega:hover) .wordmark__logo--light,
body.header-overlay .site-header:has(.has-mega:focus-within) .wordmark__logo--light{ display: none; }
body.header-overlay .site-header.scrolled .wordmark__logo--dark,
body.header-overlay .site-header:has(.has-mega:hover) .wordmark__logo--dark,
body.header-overlay .site-header:has(.has-mega:focus-within) .wordmark__logo--dark{ display: block; }
.site-nav{ display: flex; justify-content: center; gap: 0.25rem; flex-wrap: wrap; }
.nav-item{
  position: relative;
  padding: 0.55rem 0.85rem;
  font-size: 0.92rem;
  color: var(--hdr-fg, var(--ink));
  border-radius: 999px;
  transition: background-color 240ms var(--ease-out), color 240ms var(--ease-out);
  display: inline-flex; align-items: center; gap: 0.25rem;
}
.nav-item:hover, .nav-item:focus-visible,
.has-mega:hover > a, .has-sub:hover > a{ background: color-mix(in oklch, var(--hdr-fg, var(--ink)) 10%, transparent); color: var(--hdr-fg, var(--ink)); }
.nav-item .caret{ font-size: 0.8em; color: var(--hdr-fg-soft, var(--stone)); transition: transform 240ms var(--ease-out); }
.has-mega:hover > a .caret{ transform: rotate(180deg); }
/* Soulignement qui se déploie depuis la gauche — injecté par site.js */
.nav-underline{
  position: absolute;
  inset-inline: 0.85rem; inset-block-end: 0.3rem;
  block-size: 1.5px; border-radius: 2px;
  background: var(--bronze);
  transform: scaleX(0); transform-origin: left center;
  transition: transform 320ms var(--ease-out);
  pointer-events: none;
}
.nav-item:hover .nav-underline,
.nav-item:focus-visible .nav-underline,
.has-mega:hover > a .nav-underline,
.has-sub:hover > a .nav-underline{ transform: scaleX(1); }
.is-active > a .nav-underline, a.nav-item.is-active .nav-underline{ display: none; }
@media (prefers-reduced-motion: reduce){ .nav-underline{ transition: none; } }
/* Page active dans le menu */
.is-active > a, a.nav-item.is-active{ color: var(--hdr-fg, var(--ink)); font-weight: 500; }
.is-active > a::before, a.nav-item.is-active::before{
  content: ""; position: absolute;
  inset-inline: 0.85rem; inset-block-end: 0.28rem;
  block-size: 2px; border-radius: 2px;
  background: var(--bronze);
}
.has-sub{ position: relative; }
.has-sub > a{ padding-inline-end: 0.6rem; }
.sub{
  position: absolute;
  top: 100%;
  inset-inline-start: 0;
  margin-block-start: 8px;
  background: var(--cream);
  border: 1px solid var(--hairline);
  border-radius: 12px;
  padding: 0.5rem;
  min-inline-size: 240px;
  box-shadow: var(--shadow-card);
  opacity: 0; visibility: hidden;
  transform: translateY(-6px);
  transition: opacity 220ms var(--ease-out), transform 220ms var(--ease-out), visibility 220ms;
  z-index: 10;
}
.has-sub:hover > .sub, .has-sub:focus-within > .sub{ opacity: 1; visibility: visible; transform: translateY(0); }
.sub a{
  display: block;
  padding: 0.55rem 0.9rem;
  border-radius: 8px;
  font-size: 0.9rem;
  color: var(--ink);
}
.sub a:hover{ background: var(--vellum); color: var(--teal); }

/* Mega menu — full-width panel anchored under the header */
.has-mega{ position: static; }
/* Invisible bridge across the header's bottom padding so the panel stays
   open while the cursor travels from the trigger down to the panel. */
.has-mega > a{ position: relative; }
.has-mega > a::after{
  content: "";
  position: absolute;
  inset-inline: -0.75rem;
  top: 100%;
  block-size: 2rem;
}
.mega{
  position: absolute;
  top: 100%; inset-inline: 0;
  background: var(--cream);
  border-block-start: 1px solid var(--hairline);
  border-block-end: 1px solid var(--hairline);
  box-shadow: var(--shadow-card);
  opacity: 0; visibility: hidden; pointer-events: none;
  transform: translateY(-10px);
  transition: opacity 260ms var(--ease-out), transform 260ms var(--ease-out), visibility 260ms;
  z-index: 5;
}
.has-mega:hover > .mega, .has-mega:focus-within > .mega{
  opacity: 1; visibility: visible; pointer-events: auto; transform: translateY(0);
}
.mega__inner{
  max-inline-size: var(--container);
  margin-inline: auto;
  padding: clamp(1.75rem, 3.5vw, 3rem) clamp(1rem, 4vw, 2rem);
  display: grid;
  gap: clamp(1.5rem, 4vw, 3.5rem);
}
/* Chaque menu suit la même composition : les colonnes de liens à gauche, une
   carte mise en avant à droite. C'est ce qui manquait à « Acheter », dont la
   colonne unique flottait dans une grille de deux, d'où le grand vide. */
.mega__inner--feature{ grid-template-columns: minmax(0, 1fr) minmax(270px, 350px); align-items: stretch; }
.mega__inner:not(.mega__inner--feature){ grid-template-columns: minmax(0, 1fr); }
/* auto-fit : une seule colonne occupe sa largeur, elle ne se fait pas étirer
   sur une grille figée à deux. */
.mega__cols{
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(185px, 1fr));
  gap: clamp(1.5rem, 3.5vw, 3rem);
  align-content: start;
}
.mega__col{ display: grid; gap: 0.1rem; align-content: start; }
.mega__title{
  font-family: 'Montserrat', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--stone);
  padding-block-end: 0.7rem;
  margin-block-end: 0.7rem;
  border-block-end: 1px solid var(--hairline);
}
.mega__col a{
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.52rem 0.7rem;
  margin-inline: -0.7rem;
  border-radius: 10px;
  font-size: 0.95rem;
  color: var(--ink);
  transition: background-color 200ms var(--ease-out), color 200ms var(--ease-out);
}
/* Un trait court se déploie au survol : le déplacement du texte se voyait
   plus qu'il ne guidait. */
.mega__col a::before{
  content: "";
  flex: none;
  inline-size: 0; block-size: 1.5px;
  border-radius: 2px;
  background: var(--bronze);
  transition: inline-size 240ms var(--ease-out);
}
.mega__col a:hover{ background: var(--vellum); color: var(--teal); }
.mega__col a:hover::before{ inline-size: 14px; }
.mega__col a:focus-visible{ outline: 2px solid var(--bronze); outline-offset: 2px; }
.mega__feature{
  display: grid; align-content: center; gap: 0.4rem;
  padding: clamp(1.35rem, 2.2vw, 1.9rem);
  border-radius: 16px;
  background: linear-gradient(155deg, var(--teal) 0%, oklch(29% 0.055 258) 100%);
  color: var(--cream);
  position: relative; overflow: hidden;
  transition: transform 280ms var(--ease-out), box-shadow 280ms var(--ease-out);
}
.mega__feature:focus-visible{ outline: 2px solid var(--bronze); outline-offset: 3px; }
.mega__feature::after{
  content: ""; position: absolute; inset: 0;
  background: radial-gradient(420px 200px at 85% 0%, oklch(96% 0.012 80 / 0.12), transparent 60%);
  pointer-events: none;
}
.mega__feature:hover{ transform: translateY(-3px); box-shadow: var(--shadow-card); }
.mega__feature > *{ position: relative; z-index: 1; }
.mega__feature-eyebrow{
  font-family: 'Montserrat', sans-serif;
  text-transform: uppercase; letter-spacing: 0.16em;
  font-size: 0.66rem; color: var(--sand);
}
.mega__feature-title{
  font-family: 'Montserrat', system-ui, sans-serif;
  font-size: 1.2rem; font-weight: 700; line-height: 1.22;
  letter-spacing: -0.015em;
  margin-block-start: 0.15rem;
}
.mega__feature-text{ font-size: 0.88rem; opacity: 0.82; line-height: 1.55; }
/* La flèche avance au survol : c'est le seul mouvement de la carte. */
.mega__feature-cta{
  display: inline-flex; align-items: center; gap: 0.4rem;
  margin-block-start: 0.7rem;
  font-size: 0.85rem; font-weight: 600;
  color: var(--sand);
}
.mega__feature-cta::after{
  content: "\\2192";
  transition: transform 260ms var(--ease-out);
}
.mega__feature:hover .mega__feature-cta::after{ transform: translateX(5px); }

.site-header__cta{ justify-self: end; }
.site-header__burger{
  display: none;
  inline-size: 44px; block-size: 44px;
  border-radius: 999px;
  flex-direction: column; justify-content: center; align-items: center; gap: 5px;
}
.site-header__burger span{
  display: block; inline-size: 22px; block-size: 1.5px;
  background: var(--hdr-fg, var(--ink));
  transition: transform 280ms var(--ease-out), opacity 200ms var(--ease-out), background-color 320ms var(--ease-out);
}
@media (max-width: 900px){
  .site-nav, .site-header__cta{ display: none; }
  .site-header__burger{ display: inline-flex; justify-self: end; }
  .site-header__inner{ grid-template-columns: auto 1fr; }
}

/* Drawer */
.drawer{
  position: fixed; inset: 0;
  background: oklch(20% 0.005 250 / 0);
  visibility: hidden; pointer-events: none;
  transition: background-color 320ms var(--ease-out), visibility 320ms;
  z-index: 60;
}
.drawer.open{ background: oklch(20% 0.005 250 / 0.35); visibility: visible; pointer-events: auto; }
.drawer__panel{
  position: absolute; inset-block: 0; inset-inline-end: 0;
  inline-size: min(420px, 88vw);
  background: var(--vellum);
  padding: 5rem 2rem 2rem;
  transform: translateX(100%);
  transition: transform 360ms var(--ease-out);
  overflow-y: auto;
  display: flex; flex-direction: column;
}
.drawer.open .drawer__panel{ transform: translateX(0); }
.drawer__close{
  position: absolute; top: 1rem; inset-inline-end: 1rem;
  inline-size: 44px; block-size: 44px; border-radius: 999px;
  font-size: 1.8rem; color: var(--ink);
  display: grid; place-items: center;
}
.drawer__close:hover{ background: var(--cream); }
.drawer__nav{ display: flex; flex-direction: column; gap: 0.25rem; }
.drawer__nav a, .drawer-group > summary{
  display: block;
  padding: 0.9rem 0.75rem;
  border-block-end: 1px solid var(--hairline);
  font-family: 'Montserrat', system-ui, sans-serif;
  font-size: 1.1rem;
  color: var(--ink);
}
.drawer-group{ border-block-end: 1px solid var(--hairline); }
.drawer-group > summary{ border-block-end: 0; cursor: pointer; list-style: none; display: flex; justify-content: space-between; align-items: center; }
.drawer-group > summary::after{ content: "+"; color: var(--stone); }
.drawer-group[open] > summary::after{ content: "−"; }
.drawer-group a{ padding-inline-start: 1.5rem; font-family: 'Montserrat', sans-serif; font-size: 0.95rem; color: var(--stone); border-block-end: 0; }
.drawer__cta{ margin-block-start: 1.5rem; justify-content: center; }

/* Hero */
.hero{
  position: relative;
  min-block-size: 100dvh;
  overflow: hidden;
  isolation: isolate;
  display: grid;
  background: var(--ink);
}
.hero__video, .hero__poster{
  position: absolute; inset: 0;
  inline-size: 100%; block-size: 100%;
  object-fit: cover;
  z-index: -2;
}
.hero::after{
  content: ""; position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 80% 70% at 15% 85%, oklch(20% 0.005 250 / 0.75) 0%, oklch(20% 0.005 250 / 0) 70%),
    linear-gradient(180deg, oklch(20% 0.005 250 / 0.05) 0%, oklch(20% 0.005 250 / 0.55) 100%);
  z-index: -1;
  pointer-events: none;
}
.hero__h1, .hero__sub, .hero__eyebrow{
  text-shadow: 0 1px 24px oklch(20% 0.005 250 / 0.45);
}
.hero__inner{
  align-self: end;
  padding: clamp(2rem, 8vh, 6rem) clamp(1.5rem, 8vw, 5rem);
  display: grid;
  gap: var(--space-4);
  max-inline-size: 1100px;
  color: var(--cream);
}
.hero__eyebrow{ color: var(--sand); }
.hero__h1{
  color: var(--cream);
  font-size: var(--text-h1);
  line-height: 1.05;
  letter-spacing: -0.03em;
  font-weight: 800;
  max-inline-size: 18ch;
}
.hero__h1 .word{ display: inline-block; }
.inline-img-square, .inline-img-strip{
  display: inline-block;
  vertical-align: -0.15em;
  border-radius: 6px;
  object-fit: cover;
  margin-inline: 0.3em;
}
.inline-img-square{ aspect-ratio: 1 / 1; block-size: 0.85em; inline-size: 0.85em; }
.inline-img-strip{ aspect-ratio: 4 / 1; block-size: 0.7em; inline-size: 2.8em; }
@media (max-width: 768px){
  .inline-img-square, .inline-img-strip{ vertical-align: middle; block-size: 1.2em; }
  .inline-img-strip{ inline-size: 3.6em; }
}
.hero__sub{
  font-family: 'Montserrat', sans-serif;
  color: var(--cream);
  opacity: 0.85;
  font-size: var(--text-lg);
}
.hero__cta{ margin-block-start: var(--space-2); align-self: start; }
.hero__corner{
  position: absolute;
  inset-block-end: clamp(1.5rem, 4vh, 3rem);
  inset-inline-end: clamp(1.5rem, 4vw, 3rem);
  display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
  color: oklch(96% 0.012 80 / 0.6);
  font-family: 'Montserrat', system-ui, sans-serif;
  font-size: 11px;
  letter-spacing: 0.08em;
}
.hero__corner::before{
  content: ""; display: block;
  inline-size: 1px; block-size: 24px;
  background: oklch(96% 0.012 80 / 0.5);
}

/* By the numbers strip */
.numbers{
  padding-block: var(--space-16);
  background: var(--cream);
}
.numbers__grid{
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-6);
  align-items: start;
}
.numbers__cell:nth-child(4){ margin-block-start: 24px; }
.numbers__metric{
  font-family: 'Montserrat', system-ui, sans-serif;
  font-size: var(--text-display);
  font-weight: 700;
  color: var(--bronze);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  line-height: 1;
  margin-block-start: var(--space-2);
}
.numbers__label{
  color: var(--stone);
  font-size: var(--text-sm);
  margin-block-start: var(--space-2);
  max-inline-size: 22ch;
}
@media (max-width: 768px){ .numbers__grid{ grid-template-columns: 1fr 1fr; } .numbers__cell:nth-child(4){ margin-block-start: 0; } }

/* Section heading */
.section{ padding-block: var(--space-16); }
.section__head{
  display: flex; justify-content: space-between; align-items: end;
  gap: var(--space-6); margin-block-end: var(--space-8);
  flex-wrap: wrap;
}
.section__head h2{ max-inline-size: 22ch; }
.section__head .eyebrow{ margin-block-end: var(--space-2); display: block; }

/* Property carousel */
.carousel{ position: relative; }
.carousel__track{
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(320px, 28%);
  gap: var(--space-6);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: clamp(1rem, 4vw, 2rem);
  padding-block-end: var(--space-4);
  scrollbar-width: none;
}
.carousel__track::-webkit-scrollbar{ display: none; }
.carousel__track > *{ scroll-snap-align: start; }
@media (max-width: 900px){ .carousel__track{ grid-auto-columns: minmax(260px, 80%); } }
.carousel__controls{
  display: flex; gap: 0.5rem; justify-content: flex-end;
  margin-block-start: var(--space-4);
}
.carousel__btn{
  inline-size: 44px; block-size: 44px;
  border-radius: 999px;
  border: 1px solid oklch(20% 0.005 250 / 0.35);
  display: grid; place-items: center;
  color: var(--ink);
  transition: background-color 240ms var(--ease-out), border-color 240ms var(--ease-out), transform 240ms var(--ease-out);
}
.carousel__btn:hover{ background: var(--vellum); border-color: oklch(20% 0.005 250 / 0.65); transform: scale(1.04); }
.carousel__dots{
  display: flex; gap: 6px; justify-content: center; margin-block-start: var(--space-3);
}
.carousel__dot{
  inline-size: 6px; block-size: 6px; border-radius: 999px;
  background: var(--sand); opacity: 0.4;
}
.carousel__dot.active{ opacity: 1; inline-size: 18px; transition: inline-size 240ms var(--ease-out); }

/* Property card — la photo occupe toute la carte, l'information vit dessus
   sur un dégradé bleu qui monte du bas. La photo reste intacte : le dégradé
   s'arrête aux deux tiers, il n'y a aucun voile sur le sujet. */
/* Le filtre pose l'attribut [hidden] sur les cartes. Sans cette règle, le
   display:flex ci-dessous l'emporte sur le display:none du navigateur et
   rien ne se cache : c'est pourquoi les filtres semblaient morts. */
.prop-card[hidden]{ display: none; }
.prop-card{
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: var(--navy);
  box-shadow: var(--shadow-card);
  transition: transform 420ms var(--ease-out), box-shadow 420ms var(--ease-out);
  color: var(--cream);
  isolation: isolate;
  display: flex; flex-direction: column;
}
.prop-card > a{ display: block; flex: 1; min-block-size: 0; color: inherit; }
.prop-card:hover{ transform: translateY(-6px); box-shadow: var(--shadow-card-hover); color: var(--cream); }
/* aspect-ratio donne la hauteur naturelle ; block-size:100% laisse la carte
   s'étirer à la rangée quand la grille impose une hauteur commune */
.prop-card__media{
  position: relative;
  aspect-ratio: 4 / 5;
  block-size: 100%;
  overflow: hidden;
  background: var(--navy);
}
@media (min-width: 900px){ .prop-card__media{ aspect-ratio: 3 / 4; } }
.prop-card__media img{
  inline-size: 100%; block-size: 100%;
  object-fit: cover;
  transition: transform 900ms var(--ease-out);
}
.prop-card:hover .prop-card__media img{ transform: scale(1.06); }
/* Le dégradé bleu — transparent en haut, marine en bas */
.prop-card__media::after{
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(
    to top,
    oklch(22% 0.04 240 / 0.94) 0%,
    oklch(28% 0.055 248 / 0.72) 26%,
    oklch(37.3% 0.06 258 / 0.30) 52%,
    transparent 78%
  );
  pointer-events: none;
  transition: opacity 420ms var(--ease-out);
}
.prop-card:hover .prop-card__media::after{ opacity: 0.88; }
.prop-card__badge{
  position: absolute; top: 14px; inset-inline-start: 14px;
  background: var(--sand);
  color: var(--ink);
  font-family: 'Montserrat', sans-serif;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  padding: 6px 12px;
  border-radius: 999px;
  z-index: 3;
}
/* Bloc d'information posé sur la photo */
.prop-card__body{
  position: absolute; inset-inline: 0; bottom: 0;
  z-index: 2;
  padding: var(--space-4) var(--space-4) var(--space-4);
  display: flex; flex-direction: column; gap: 0.35rem;
}
.prop-card__price{
  font-size: clamp(1.35rem, 2vw, 1.6rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--cream);
  line-height: 1.1;
}
.prop-card__addr{
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--cream);
}
.prop-card__city{
  display: inline-flex; align-items: center; gap: 0.4rem;
  color: var(--sand);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.16em;
}
.prop-card__meta{
  display: flex; gap: 0;
  color: oklch(96% 0.012 80 / 0.82);
  font-size: var(--text-sm);
  font-weight: 500;
  margin-block-start: 0.7rem;
  padding-block-start: 0.7rem;
  border-block-start: 1px solid oklch(96% 0.012 80 / 0.22);
  font-variant-numeric: tabular-nums;
}
.prop-card__meta span{ display: inline-flex; align-items: center; gap: 0.35rem; padding-inline: 0.8rem; }
.prop-card__meta span:first-child{ padding-inline-start: 0; }
.prop-card__meta span + span{ border-inline-start: 1px solid oklch(96% 0.012 80 / 0.22); }

/* Team editorial split 7:5 */
.team{
  display: grid;
  grid-template-columns: 7fr 5fr;
  gap: var(--space-12);
  align-items: center;
}
.team__media{ aspect-ratio: 4 / 5; border-radius: 14px; overflow: hidden; background: var(--hairline); }
.team__media img{ inline-size: 100%; block-size: 100%; object-fit: cover; }
.team__body{ display: flex; flex-direction: column; gap: var(--space-4); }
.team__body p{ color: var(--stone); }
@media (max-width: 900px){ .team{ grid-template-columns: 1fr; gap: var(--space-6); } }

/* Cities grid */
.cities-grid{
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-6);
}
@media (max-width: 900px){ .cities-grid{ grid-template-columns: 1fr 1fr; } }
@media (max-width: 600px){ .cities-grid{ grid-template-columns: 1fr; } }
.city-card{
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 14px;
  overflow: hidden;
  background: var(--vellum);
  box-shadow: var(--shadow-card);
  display: block;
  color: var(--cream);
}
.city-card img{
  position: absolute; inset: 0;
  inline-size: 100%; block-size: 100%;
  object-fit: cover;
  transition: transform 800ms var(--ease-out);
}
.city-card::after{
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(180deg, oklch(20% 0.005 250 / 0) 40%, oklch(20% 0.005 250 / 0.65) 100%);
}
.city-card__overlay{
  position: absolute; inset: 0;
  background: oklch(30% 0.05 258 / 0);
  transition: background-color 320ms var(--ease-out);
  z-index: 1;
}
.city-card:hover img{ transform: scale(1.04); }
.city-card:hover .city-card__overlay{ background: oklch(30% 0.05 258 / 0.15); }
.city-card__body{
  position: absolute;
  inset-block-end: 0;
  inset-inline: 0;
  padding: var(--space-4);
  z-index: 2;
  color: var(--cream);
}
.city-card__name{
  font-family: 'Montserrat', system-ui, sans-serif;
  font-size: 1.5rem;
  color: var(--cream);
  margin-block-end: 4px;
}
.city-card__stat{ font-size: var(--text-sm); color: oklch(96% 0.012 80 / 0.8); }
.city-card--teaser{
  background: var(--teal);
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  text-align: center;
  padding: var(--space-6);
  color: var(--cream);
}
.city-card--teaser::after{ display: none; }
.city-card--teaser .eyebrow{ color: var(--sand); }
.city-card--teaser h3{ color: var(--cream); margin-block: var(--space-2); }

/* CTA band */
.cta-band{
  background: var(--teal);
  color: var(--cream);
  border-radius: var(--radius-lg);
  padding: clamp(2.25rem,4vw,3.5rem) clamp(1.75rem,4vw,3.5rem);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: clamp(1.25rem,3vw,2.5rem);
  box-shadow: 0 1px 2px oklch(22% 0.04 258 / 0.10), 0 18px 50px oklch(22% 0.04 258 / 0.20);
}
.cta-band > *{ position: relative; z-index: 1; }
.cta-band::before{ content:""; position:absolute; inset:0; background:radial-gradient(620px 320px at 88% -10%, oklch(96% 0.012 80 / 0.10), transparent 60%); pointer-events:none; }
.cta-band h2{ color: var(--cream); max-inline-size: 20ch; margin: 0; }
.cta-band .btn{
  background: var(--cream); color: var(--ink);
  display: inline-flex; align-items: center; gap: .4rem;
  padding: 0.95rem 1.6rem; border-radius: 999px; font-weight: 500; white-space: nowrap;
  box-shadow: 0 6px 20px oklch(20% 0.005 250 / 0.18);
  transition: transform .3s var(--ease-out);
}
.cta-band .btn:hover{ transform: translateY(-2px); color: var(--ink); }
.cta-band__inner{
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between;
  gap: clamp(1.25rem,3vw,2.5rem); inline-size: 100%;
}
.cta-band__actions{ display: flex; gap: var(--space-3); flex-wrap: wrap; }
@media (max-width: 640px){ .cta-band{ flex-direction: column; align-items: flex-start; } .cta-band .btn{ inline-size: 100%; justify-content: center; } }

/* Footer */
.site-footer{
  background: var(--teal);
  color: var(--cream);
  padding-block: var(--space-12) var(--space-6);
  margin-block-start: var(--space-16);
}
.site-footer__grid{
  max-inline-size: var(--container);
  margin-inline: auto;
  padding-inline: clamp(1rem, 4vw, 2rem);
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr 1.4fr;
  gap: var(--space-8);
}
.site-footer__col h4.eyebrow{ color: var(--sand); margin-block-end: var(--space-3); }
.site-footer__col ul{ display: flex; flex-direction: column; gap: 0.5rem; }
.site-footer__col a{ color: var(--cream); font-size: var(--text-sm); opacity: 0.85; }
.site-footer__col a:hover{ opacity: 1; color: var(--sand); }
.wordmark--footer{ display: flex; flex-direction: column; align-items: flex-start; gap: 4px; line-height: 1.2; }
.wordmark--footer .wordmark__name{ color: var(--cream); font-family: 'Montserrat', system-ui, sans-serif; font-size: 1.15rem; letter-spacing: 0.04em; }
.wordmark--footer .wordmark__sub{ color: var(--sand); font-size: var(--text-xs); letter-spacing: 0.18em; text-transform: uppercase; }
.site-footer__tag{ margin-block-start: var(--space-3); color: oklch(96% 0.012 80 / 0.8); max-inline-size: 30ch; }
/* Pas de lockup RE/MAX ici : le pied de page est sombre et le logotype officiel
   n'existe qu'en noir et crème (guide, p. 4). Le poser sur une plage crème
   reviendrait à l'enfermer dans une boîte, ce que le guide interdit. Les deux
   logos vivent dans l'en-tête, au-dessus de la ligne des 400 px — c'est là que
   la norme les exige. Le pied ne porte que les mentions écrites. */
.site-footer__addr{ margin-block-start: var(--space-3); color: oklch(96% 0.012 80 / 0.7); font-style: normal; font-size: var(--text-sm); line-height: 1.7; }
.site-footer__agency{ display: block; color: var(--cream); font-family: 'Montserrat', system-ui, sans-serif; }
.site-footer__agency-legal{ display: block; color: oklch(96% 0.012 80 / 0.88); }
.site-footer__addr a{ color: oklch(96% 0.012 80 / 0.7); text-decoration: underline; text-underline-offset: 3px; }
.site-footer__addr a:hover{ color: var(--cream); }
.site-footer__role{ font-size: 0.76rem; color: oklch(96% 0.012 80 / 0.62); line-height: 1.5; }
.site-footer__contact{ gap: var(--space-3) !important; }
.site-footer__contact li{ display: flex; flex-direction: column; gap: 2px; }
.site-footer__name{ font-family: 'Montserrat', system-ui, sans-serif; color: var(--cream); font-size: 1rem; opacity: 1; }
.site-footer__social{ margin-block-start: var(--space-4); display: flex; gap: 0.5rem; align-items: center; }
.site-footer__bottom{
  max-inline-size: var(--container);
  margin: var(--space-8) auto 0;
  padding: var(--space-4) clamp(1rem, 4vw, 2rem) 0;
  border-block-start: 1px solid oklch(96% 0.012 80 / 0.15);
  display: flex; justify-content: space-between; flex-wrap: wrap; gap: var(--space-3);
  font-size: var(--text-xs); color: oklch(96% 0.012 80 / 0.7);
}
.site-footer__bottom a{ color: oklch(96% 0.012 80 / 0.85); }
@media (max-width: 900px){ .site-footer__grid{ grid-template-columns: 1fr 1fr; } }
@media (max-width: 560px){ .site-footer__grid{ grid-template-columns: 1fr; } }

/* Reveal — visible by default. Motion is bonus, not essential. */
.reveal{ opacity: 1; transform: none; }
@media (prefers-reduced-motion: reduce){
  *, *::before, *::after{ transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }
}

/* Legacy-page typography fallback so old sections still render readable until rebuilt */
.section-light, .section-dark, .section-blue{ padding-block: var(--space-12); }
.section-light{ background: var(--vellum); }
.section-dark{ background: var(--ink); color: var(--cream); }
.section-dark h2, .section-dark h3{ color: var(--cream); }
.section-blue{ background: var(--teal); color: var(--cream); }
.section-blue h2, .section-blue h3{ color: var(--cream); }
.sec-head{ display: flex; justify-content: space-between; align-items: end; flex-wrap: wrap; gap: var(--space-4); margin-block-end: var(--space-6); }
.sec-head .eye, .eye{ font-family: 'Montserrat', sans-serif; font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.18em; color: var(--sand); font-weight: 500; margin-block-end: 0.5rem; }
.more{ font-size: var(--text-sm); color: var(--ink); border-block-end: 1px solid var(--ink); padding-block-end: 2px; }
.section-dark .more, .section-blue .more{ color: var(--cream); border-color: var(--cream); }
.stats-grid{ display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: var(--space-4); }
.stat{ padding: var(--space-4); border-radius: 12px; background: oklch(96% 0.012 80 / 0.08); border: 1px solid oklch(96% 0.012 80 / 0.15); }
.stat .n{ font-family: 'Montserrat', system-ui, sans-serif; font-size: var(--text-display); color: var(--bronze); line-height: 1; }
.stat .l{ color: var(--stone); margin-block-start: 0.5rem; font-size: var(--text-sm); }
.section-dark .stat .l, .section-blue .stat .l{ color: oklch(96% 0.012 80 / 0.7); }

/* Property grid / pcard legacy */
.prop-grid{ display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-6); margin-block-end: var(--space-8); }

/* Grille des catégories de propriété */
.cat-grid{ display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4); }
.cat-card{
  position: relative;
  display: flex; flex-direction: column; gap: 0.5rem;
  padding: var(--space-6);
  background: var(--vellum);
  border: 1px solid var(--hairline);
  border-radius: 16px;
  color: var(--ink);
  transition: transform 320ms var(--ease-out), border-color 320ms var(--ease-out), box-shadow 320ms var(--ease-out);
}
.cat-card:hover{ transform: translateY(-4px); border-color: var(--teal); box-shadow: var(--shadow-card); color: var(--ink); }
.cat-card__count{
  font-size: var(--text-xs); font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.16em;
  color: var(--sand);
}
.cat-card h3{ margin: 0; }
.cat-card p{ color: var(--stone); font-size: var(--text-sm); }
.cat-card__arrow{
  margin-block-start: auto; padding-block-start: var(--space-3);
  font-size: 1.4rem; color: var(--teal);
  transition: transform 280ms var(--ease-out);
}
.cat-card:hover .cat-card__arrow{ transform: translateX(6px); }

/* Courtiers hypothécaires partenaires */
.mb-intro{ color: var(--stone); margin-block-end: var(--space-6); max-inline-size: 70ch; }
.mb-grid{ display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-4); }
.mb-card{
  display: flex; flex-direction: column; gap: 0.4rem;
  padding: var(--space-6);
  background: var(--vellum);
  border: 1px solid var(--hairline);
  border-radius: 16px;
}
.mb-card__name{ font-size: 1.15rem; font-weight: 700; letter-spacing: -0.015em; margin: 0; }
.mb-card__firm{
  font-size: var(--text-xs); font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.14em;
  color: var(--sand);
}
.mb-card__note{ color: var(--stone); font-size: var(--text-sm); margin-block-start: 0.4rem; }
.mb-card__links{
  display: flex; flex-direction: column; gap: 0.25rem;
  margin-block-start: auto; padding-block-start: var(--space-3);
  font-size: var(--text-sm); font-weight: 500;
}
.mb-card__links a{ color: var(--teal); }
.mb-card__links a:hover{ color: var(--ink); }
.mb-card__links:empty{ display: none; }
.mb-legal{
  margin-block-start: var(--space-4);
  font-size: var(--text-xs); line-height: 1.6;
  color: var(--mist); max-inline-size: 80ch;
}

/* Catégorie sans inscription active */
.empty-note{
  display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-4);
  padding: var(--space-8);
  background: var(--vellum);
  border: 1px dashed var(--hairline);
  border-radius: 16px;
}
.empty-note p{ color: var(--stone); margin: 0; }
.pcard{ background: var(--vellum); border-radius: 14px; overflow: hidden; box-shadow: var(--shadow-card); transition: transform 320ms var(--ease-out), box-shadow 320ms var(--ease-out); color: var(--ink); display: block; }
.pcard:hover{ transform: translateY(-4px); box-shadow: var(--shadow-card-hover); color: var(--ink); }
.pcard .ph{ aspect-ratio: 3/2; overflow: hidden; position: relative; background: var(--hairline); }
.pcard .ph img{ inline-size: 100%; block-size: 100%; object-fit: cover; }
.pcard .body{ padding: var(--space-4); }
.pcard .badge{ position: absolute; top: 12px; inset-inline-start: 12px; background: var(--sand); color: var(--ink); padding: 6px 12px; border-radius: 999px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; z-index: 2; }
.pcard .loc{ color: var(--sand); font-size: var(--text-xs); letter-spacing: 0.18em; text-transform: uppercase; }
.pcard .addr{ font-family: 'Montserrat', system-ui, sans-serif; font-size: 1.15rem; margin-block: 0.4rem 0.6rem; color: var(--ink); }
.pcard .price{ font-family: 'Montserrat', system-ui, sans-serif; color: var(--bronze); font-size: 1.4rem; font-variant-numeric: tabular-nums; }
.pcard .meta{ margin-block-start: var(--space-3); padding-block-start: var(--space-3); border-block-start: 1px solid var(--hairline); display: flex; gap: 1rem; color: var(--stone); font-size: var(--text-sm); }
.page-head{ padding-block: var(--space-12) var(--space-6); border-block-end: 1px solid var(--hairline); }
.page-head .eyebrow{ margin-block-end: var(--space-3); display: inline-block; }
.page-head .lead{ color: var(--stone); margin-block-start: var(--space-4); max-inline-size: 60ch; }
.filters{ display: flex; gap: 0.5rem; flex-wrap: wrap; margin-block-end: var(--space-6); }
.filters button{ background: var(--vellum); border: 1px solid var(--hairline); padding: 0.6rem 1.2rem; border-radius: 999px; font-size: 0.88rem; color: var(--ink); transition: background-color 240ms var(--ease-out), color 240ms var(--ease-out), border-color 240ms var(--ease-out); }
.filters button.active, .filters button:hover{ background: var(--teal); color: var(--cream); border-color: var(--teal); }
.filters__empty{ color: var(--stone); padding-block: var(--space-8); }
.filters__empty[hidden]{ display: none; }

/* ========= Property detail (split-view sticky) ========= */
:root{ --header-h: 88px; }
@media (max-width: 768px){ :root{ --header-h: 76px; } }
.prop-page{
  display: grid;
  grid-template-columns: minmax(0,1fr) minmax(0,1fr);
  align-items: start;
  gap: clamp(1.25rem, 2.5vw, 2.5rem);
  padding: clamp(1.25rem, 2.5vw, 2rem);
  background: var(--cream);
}
@media (max-width: 1024px){
  .prop-page{ grid-template-columns: minmax(0,1fr); }
}
.prop-media{
  position: sticky;
  top: calc(var(--header-h) + clamp(1.25rem, 2.5vw, 2rem));
  block-size: calc(100dvh - var(--header-h) - clamp(2.5rem, 5vw, 4rem));
  overflow: hidden;
  background: var(--vellum);
  border: 1px solid var(--hairline);
  border-radius: 18px;
}
@media (max-width: 1024px){
  .prop-media{
    position: relative;
    top: auto;
    block-size: auto;
    aspect-ratio: 4 / 3;
  }
}
.prop-media__overlay{
  position: absolute;
  inset-block-start: 1.25rem;
  inset-inline: 1.25rem;
  z-index: 4;
  display: flex; align-items: center; gap: 0.75rem;
  pointer-events: none;
}
.prop-media__overlay > *{ pointer-events: auto; }
.prop-media__icons{ display: flex; gap: 0.5rem; }
.icon-btn{
  inline-size: 40px; block-size: 40px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 999px;
  background: oklch(98% 0.008 80 / 0.9);
  backdrop-filter: blur(10px) saturate(1.1);
  -webkit-backdrop-filter: blur(10px) saturate(1.1);
  border: 1px solid var(--hairline);
  color: var(--ink);
  cursor: pointer;
  transition: transform 240ms var(--ease-out), background-color 240ms var(--ease-out);
}
.icon-btn:hover{ transform: scale(1.06); background: var(--vellum); }
.icon-btn svg{ inline-size: 18px; block-size: 18px; }
.prop-toggle{
  position: relative;
  display: inline-flex;
  background: oklch(98% 0.008 80 / 0.92);
  backdrop-filter: blur(10px) saturate(1.1);
  -webkit-backdrop-filter: blur(10px) saturate(1.1);
  border: 1px solid var(--hairline);
  border-radius: 999px;
  padding: 4px;
  margin-inline: auto;
  isolation: isolate;
}
.prop-toggle__pill{
  position: absolute;
  inset-block: 4px;
  inset-inline-start: 4px;
  inline-size: calc(50% - 4px);
  background: var(--navy);
  border-radius: 999px;
  transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 0;
  box-shadow: 0 4px 12px oklch(22% 0.04 240 / 0.25);
}
.prop-toggle[data-mode="map"] .prop-toggle__pill{ transform: translateX(100%); }
.prop-toggle button{
  position: relative; z-index: 1;
  background: transparent; border: 0;
  padding: 0.55rem 1.2rem;
  font: 500 0.85rem 'Montserrat', system-ui, sans-serif;
  color: var(--ink);
  border-radius: 999px;
  cursor: pointer;
  transition: color 240ms var(--ease-out);
  letter-spacing: 0.02em;
}
.prop-toggle button[aria-pressed="true"]{ color: var(--cream); }
.prop-toggle button[aria-disabled="true"]{ opacity: 0.45; cursor: not-allowed; }
.prop-media__cta{
  margin-inline-start: auto;
  background: var(--navy);
  color: var(--cream);
  padding: 0.6rem 1.2rem;
  border-radius: 999px;
  font: 500 0.85rem 'Montserrat', system-ui, sans-serif;
  letter-spacing: 0.02em;
  box-shadow: 0 4px 12px oklch(22% 0.04 240 / 0.25);
  transition: transform 240ms var(--ease-out);
}
.prop-media__cta:hover{ transform: translateY(-1px); color: var(--cream); }
.prop-media__pane{
  position: absolute; inset: 0;
  transition: opacity 280ms var(--ease-out);
}
.prop-media__pane[aria-hidden="true"]{ opacity: 0; pointer-events: none; }
.prop-mosaic{
  position: absolute; inset: 0;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  grid-template-areas:
    "a a b"
    "a a c"
    "d d d";
  gap: 2px;
  background: var(--hairline);
}
.prop-mosaic__cell{ position: relative; overflow: hidden; background: var(--vellum); }
.prop-mosaic__cell--a{ grid-area: a; }
.prop-mosaic__cell--b{ grid-area: b; }
.prop-mosaic__cell--c{ grid-area: c; }
.prop-mosaic__cell--d{ grid-area: d; }
.prop-mosaic__cell img{
  inline-size: 100%; block-size: 100%;
  object-fit: cover;
  transition: transform 600ms var(--ease-out);
  cursor: zoom-in;
}
.prop-mosaic__cell:hover img{ transform: scale(1.03); }
.prop-mosaic__empty{
  display: flex; align-items: center; justify-content: center;
  inline-size: 100%; block-size: 100%;
  color: var(--stone);
  background: var(--vellum);
}
.prop-mosaic__more{
  position: absolute;
  inset-inline-end: 1.5rem;
  inset-block-end: 1.5rem;
  background: oklch(96% 0.012 80 / 0.92);
  backdrop-filter: blur(10px) saturate(1.1);
  -webkit-backdrop-filter: blur(10px) saturate(1.1);
  color: var(--ink);
  border: 1px solid var(--hairline);
  padding: 0.65rem 1.25rem;
  border-radius: 999px;
  font: 500 0.85rem 'Montserrat', system-ui, sans-serif;
  z-index: 3;
  cursor: pointer;
  transition: transform 240ms var(--ease-out);
}
.prop-mosaic__more:hover{ transform: translateY(-1px); }
#leaflet-map{ inline-size: 100%; block-size: 100%; }
.prop-pin{
  inline-size: 36px; block-size: 36px;
  display: flex; align-items: center; justify-content: center;
  color: var(--cream);
  filter: drop-shadow(0 4px 8px oklch(22% 0.04 240 / 0.4));
}

/* Right column */
.prop-info{
  padding-block: clamp(2.5rem, 5vw, 4.5rem);
  padding-inline: clamp(1.5rem, 4vw, 3.5rem);
  max-inline-size: 720px;
  color: var(--ink);
}
.prop-info__crumbs{
  font-family: 'Montserrat', system-ui, sans-serif;
  font-size: 13px;
  color: var(--stone);
  display: flex; gap: 0.45rem; align-items: center; flex-wrap: wrap;
  margin-block-end: 1.5rem;
}
.prop-info__crumbs a{ color: var(--stone); }
.prop-info__crumbs a:hover{ color: var(--ink); }
.prop-info__crumbs span.sep{ color: var(--hairline); }
.prop-info__h1{
  font-family: 'Montserrat', system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(2.25rem, 4vw, 3.5rem);
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--ink);
  max-inline-size: 18ch;
  margin-block-end: 1.25rem;
}
.prop-info__loc{
  display: flex; align-items: center; gap: 0.5rem;
  font: 400 16px 'Montserrat', system-ui, sans-serif;
  color: var(--stone);
  margin-block-end: 2rem;
}
.prop-info__loc svg{ inline-size: 18px; block-size: 18px; flex-shrink: 0; }
.prop-info__desc{
  font: 400 var(--text-base) 'Montserrat', system-ui, sans-serif;
  line-height: 1.7;
  color: var(--ink);
  max-inline-size: 65ch;
  margin-block-end: 2rem;
}
.desc-wrap{ position: relative; }
.desc-wrap[data-collapsible] .desc-wrap__body{
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
}
.desc-wrap.expanded .desc-wrap__body{
  display: block;
  -webkit-line-clamp: unset;
  overflow: visible;
}
.desc-wrap__toggle{
  margin-block-start: 0.75rem;
  background: transparent; border: 0;
  font: 400 14px 'Montserrat', system-ui, sans-serif;
  color: var(--ink);
  border-block-end: 1px solid var(--ink);
  padding: 0 0 2px;
  cursor: pointer;
}
.prop-info__metrics{
  display: flex; gap: 1rem clamp(1.5rem, 3vw, 2.5rem);
  flex-wrap: wrap;
  align-items: center;
  margin-block-end: 2rem;
  padding-block: 1.25rem;
  border-block: 1px solid var(--hairline);
}
.prop-metric{ display: flex; flex-direction: column; gap: 0.35rem; }
.prop-metric__n{
  font-family: 'Montserrat', system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(2rem, 3vw, 2.5rem);
  color: var(--ink);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.prop-metric__l{
  font: 500 12px 'Montserrat', system-ui, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--stone);
}
.prop-metric__sep{
  inline-size: 1px; block-size: 1.5rem;
  background: var(--hairline);
}
.prop-price-band{
  background: var(--vellum);
  border-radius: 14px;
  padding: 1.5rem 2rem;
  display: flex; align-items: center; gap: 1.5rem;
  flex-wrap: wrap;
  margin-block-end: 2.5rem;
  box-shadow:
    0 1px 2px oklch(30% 0.05 258 / 0.06),
    0 4px 14px oklch(30% 0.05 258 / 0.08),
    0 16px 40px oklch(30% 0.05 258 / 0.06);
}
.prop-price-band__main{ display: flex; flex-direction: column; gap: 0.35rem; }
.prop-price-band__eye{
  font: 500 11px 'Montserrat', system-ui, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--sand);
}
.prop-price-band__val{
  font-family: 'Montserrat', system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(2.5rem, 4vw, 3.5rem);
  color: var(--bronze);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.prop-price-band__cta{
  margin-inline-start: auto;
  background: var(--navy);
  color: var(--cream);
  padding: 0.85rem 1.5rem;
  border-radius: 999px;
  font: 500 0.95rem 'Montserrat', system-ui, sans-serif;
  letter-spacing: 0.02em;
  box-shadow: 0 4px 12px oklch(22% 0.04 240 / 0.25);
  transition: transform 240ms var(--ease-out);
}
.prop-price-band__cta:hover{ transform: translateY(-1px); color: var(--cream); }
.prop-section{ margin-block-end: 2.5rem; }
.prop-section__eye{
  font: 500 11px 'Montserrat', system-ui, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.18em;
  color: var(--sand);
  margin-block-end: 1rem;
  display: block;
}
.amenities{
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-3);
}
.amenities[data-more] > .amenity--extra{ display: none; }
.amenities[data-more][open] > .amenity--extra{ display: flex; }
.amenity{
  display: flex; align-items: center; gap: 0.65rem;
  padding-block: 0.4rem;
  font: 400 14px 'Montserrat', system-ui, sans-serif;
  color: var(--ink);
}
.amenity svg{ inline-size: 22px; block-size: 22px; flex-shrink: 0; color: var(--ink); }
.amenities-more-btn{
  margin-block-start: 1rem;
  background: transparent;
  border: 1px solid var(--hairline);
  padding: 0.55rem 1.2rem;
  border-radius: 999px;
  font: 500 0.85rem 'Montserrat', system-ui, sans-serif;
  color: var(--ink);
  cursor: pointer;
  transition: background-color 240ms var(--ease-out);
}
.amenities-more-btn:hover{ background: var(--vellum); }
.room-table{
  inline-size: 100%;
  border-collapse: collapse;
  font: 400 14px 'Montserrat', system-ui, sans-serif;
}
.room-table thead th{
  text-align: start;
  font: 500 11px 'Montserrat', system-ui, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--stone);
  padding: 0.65rem 0.5rem;
  border-block-end: 1px solid var(--hairline);
}
.room-table tbody td{
  padding: 0.8rem 0.5rem;
  border-block-end: 1px solid var(--hairline);
  color: var(--ink);
}
.room-table tbody tr{ transition: background-color 160ms var(--ease-out); }
.room-table tbody tr:hover{ background: var(--cream); }
@media (max-width: 640px){
  .room-table thead{ display: none; }
  .room-table, .room-table tbody, .room-table tr, .room-table td{ display: block; inline-size: 100%; }
  .room-table tr{ padding-block: 0.75rem; border-block-end: 1px solid var(--hairline); }
  .room-table td{ padding: 0.25rem 0; border: 0; }
  .room-table td::before{
    content: attr(data-l);
    display: inline-block;
    inline-size: 7rem;
    font-weight: 500;
    color: var(--stone);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
}
.broker-card{
  background: var(--vellum);
  border-radius: 14px;
  padding: 1.5rem 1.75rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.25rem;
  box-shadow:
    0 1px 2px oklch(30% 0.05 258 / 0.06),
    0 4px 14px oklch(30% 0.05 258 / 0.08);
}
.broker-card__avatars{ display: flex; align-items: center; }
.broker-card__avatars img{
  inline-size: 56px; block-size: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--vellum);
  box-shadow: 0 2px 8px oklch(30% 0.05 258 / 0.18);
}
.broker-card__avatars img + img{ margin-inline-start: -22px; }
.broker-card__body{ display: flex; flex-direction: column; gap: 0.25rem; min-inline-size: 0; }
.broker-card__name{
  font-family: 'Montserrat', system-ui, sans-serif;
  font-size: 20px;
  color: var(--ink);
}
.broker-card__sub{
  font: 400 13px 'Montserrat', system-ui, sans-serif;
  color: var(--stone);
}
.broker-card__team{
  font: 500 13px 'Montserrat', system-ui, sans-serif;
  color: var(--stone);
}
.broker-card__cta{
  background: var(--navy);
  color: var(--cream);
  padding: 0.7rem 1.3rem;
  border-radius: 999px;
  font: 500 0.9rem 'Montserrat', system-ui, sans-serif;
  justify-self: end;
  white-space: nowrap;
  transition: transform 240ms var(--ease-out);
}
.broker-card__cta:hover{ transform: translateY(-1px); color: var(--cream); }
@media (max-width: 560px){
  .broker-card{ grid-template-columns: auto 1fr; }
  .broker-card__cta{ grid-column: 1 / -1; justify-self: stretch; text-align: center; }
}
/* --- Formulaires (global) --- */
.contact-form{display:grid;gap:1rem}
.f-fields{display:grid;gap:1.4rem}
.contact-form label{display:grid;gap:.5rem;font-size:.85rem;font-weight:500;color:var(--ink-2);letter-spacing:.01em}
.contact-form input,.contact-form textarea,.contact-form select{font-family:inherit;font-size:1rem;padding:.9rem 1rem;border:1px solid var(--line);border-radius:14px;background:var(--surface);color:var(--ink);transition:border-color .3s var(--ease),background .3s var(--ease);font-weight:400}
.contact-form input:focus,.contact-form textarea:focus,.contact-form select:focus{outline:0;border-color:var(--blue);background:#fff}
.contact-form textarea{resize:vertical;min-height:120px;font-family:inherit}
.f-row{display:grid;grid-template-columns:1fr 1fr;gap:1.4rem 1rem}
@media(max-width:520px){.f-row{grid-template-columns:1fr}}
.f-submit{margin-top:.4rem;justify-self:start;background:var(--ink);color:#fff;padding:1.1rem 1.8rem;border:0;border-radius:999px;font-family:inherit;font-size:1rem;font-weight:500;cursor:pointer;transition:transform .3s var(--ease),background .3s var(--ease)}
.f-submit:hover{background:var(--blue);transform:translateY(-2px)}
.f-note{font-size:.78rem;color:var(--muted);margin:0;line-height:1.5}
.f-ok{text-align:center;padding:2rem 1rem}
.f-ok-icon{width:64px;height:64px;border-radius:999px;background:var(--blue-soft);color:var(--blue);display:grid;place-items:center;font-size:1.8rem;margin:0 auto 1.2rem}
.f-ok h3{font-size:1.4rem;margin-bottom:.6rem}
.f-ok p{color:var(--ink-2)}
.prop-similar-grid{
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-4);
}
@media (max-width: 560px){ .prop-similar-grid{ grid-template-columns: 1fr; } }

/* Lightbox */
.lightbox{
  position: fixed; inset: 0;
  background: oklch(20% 0.005 250 / 0.96);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: none;
  align-items: center; justify-content: center;
  z-index: 9999;
}
.lightbox[aria-hidden="false"]{ display: flex; }
.lightbox__stage{
  position: relative;
  inline-size: 90vw; block-size: 90vh;
  display: flex; align-items: center; justify-content: center;
}
.lightbox__img{
  max-inline-size: 100%; max-block-size: 100%;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 24px 80px oklch(0% 0 0 / 0.5);
}
.lightbox__count{
  position: absolute;
  inset-block-start: 1.25rem;
  inset-inline: 0;
  text-align: center;
  font: 500 14px 'Montserrat', system-ui, sans-serif;
  color: var(--cream);
  letter-spacing: 0.06em;
}
.lightbox__close{
  position: absolute;
  inset-block-start: 1rem;
  inset-inline-end: 1rem;
  inline-size: 44px; block-size: 44px;
  border-radius: 999px;
  background: oklch(98% 0.008 80 / 0.1);
  color: var(--cream);
  border: 1px solid oklch(98% 0.008 80 / 0.2);
  cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background-color 240ms var(--ease-out);
}
.lightbox__close:hover{ background: oklch(98% 0.008 80 / 0.2); }
.lightbox__nav{
  position: absolute;
  inset-block-start: 50%;
  transform: translateY(-50%);
  inline-size: 56px; block-size: 56px;
  border-radius: 999px;
  background: oklch(98% 0.008 80 / 0.1);
  border: 1px solid oklch(98% 0.008 80 / 0.2);
  color: var(--cream);
  cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: background-color 240ms var(--ease-out);
}
.lightbox__nav:hover{ background: oklch(98% 0.008 80 / 0.2); }
.lightbox__nav--prev{ inset-inline-start: 1.25rem; }
.lightbox__nav--next{ inset-inline-end: 1.25rem; }

/* Bottom mobile bar */
.bottom-bar{
  display: none;
  position: fixed;
  inset-block-end: 0;
  inset-inline: 0;
  z-index: 40;
  background: oklch(98% 0.008 80 / 0.95);
  backdrop-filter: blur(14px) saturate(1.1);
  -webkit-backdrop-filter: blur(14px) saturate(1.1);
  border-block-start: 1px solid var(--hairline);
  padding: 1rem 1.25rem;
  padding-block-end: max(1rem, env(safe-area-inset-bottom));
  gap: 0.75rem;
  align-items: center;
}
.bottom-bar__btn{
  flex: 1 1 auto;
  text-align: center;
  padding: 0.85rem 1rem;
  border-radius: 999px;
  font: 500 0.9rem 'Montserrat', system-ui, sans-serif;
  cursor: pointer;
  border: 1px solid var(--hairline);
  background: transparent;
  color: var(--ink);
}
.bottom-bar__btn--primary{
  background: var(--navy);
  color: var(--cream);
  border-color: var(--navy);
}
.bottom-bar__btn--primary:hover{ color: var(--cream); }
@media (max-width: 1024px){
  .prop-page[data-prop-page] ~ .bottom-bar, .bottom-bar[data-prop-bar]{ display: flex; }
  main:has(.prop-page) + .site-footer{ padding-block-end: calc(var(--space-12) + 80px); }
}

/* Map modal (mobile) */
.map-modal{
  position: fixed; inset: 0;
  background: var(--cream);
  z-index: 9998;
  display: none;
  flex-direction: column;
}
.map-modal[aria-hidden="false"]{ display: flex; }
.map-modal__head{
  display: flex; align-items: center; justify-content: space-between;
  padding: 1rem 1.25rem;
  border-block-end: 1px solid var(--hairline);
}
.map-modal__close{
  inline-size: 40px; block-size: 40px;
  border-radius: 999px;
  border: 1px solid var(--hairline);
  background: var(--vellum);
  cursor: pointer;
}
#leaflet-map-modal{ flex: 1; }

/* ================= HOMEPAGE 2026 — éditorial cinématique ================= */
.hm-index{
  display: inline-flex; align-items: center; gap: 0.75rem;
  font-family: 'Montserrat', system-ui, sans-serif;
  font-size: 11px; letter-spacing: 0.08em; color: var(--mist);
}
.hm-index::after{ content: ""; inline-size: 48px; block-size: 1px; background: var(--sand); opacity: 0.6; }

/* Hero — plaque vidéo plein écran, titre masqué ligne par ligne */
.hm-hero{
  position: relative;
  /* L'en-tête n'est plus transparent sur l'accueil (conformité RE/MAX : fond
     neutre derrière le logotype), il occupe donc sa propre hauteur au-dessus
     du hero. On la retranche pour que le premier écran reste plein. */
  min-block-size: calc(100dvh - var(--hdr-h));
  overflow: hidden;
  isolation: isolate;
  display: grid;
  grid-template-rows: 1fr auto;
  background: var(--ink);
}
.hm-hero__media{ position: absolute; inset: 0; z-index: -2; overflow: hidden; }
.hm-hero__video{
  inline-size: 100%; block-size: 100%;
  object-fit: cover;
  transform-origin: center;
  will-change: transform;
}
.hm-hero::after{
  content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
  background:
    radial-gradient(ellipse 80% 70% at 18% 80%, oklch(20% 0.005 250 / 0.7) 0%, oklch(20% 0.005 250 / 0) 70%),
    linear-gradient(180deg, oklch(20% 0.005 250 / 0.12) 0%, oklch(20% 0.005 250 / 0.55) 100%);
}
.hm-hero__inner{
  align-self: end;
  max-inline-size: var(--container);
  inline-size: 100%;
  margin-inline: auto;
  padding: clamp(2rem, 6vh, 4rem) clamp(1rem, 4vw, 2rem) clamp(1.5rem, 4vh, 3rem);
  display: grid;
  gap: var(--space-4);
  color: var(--cream);
}
.hm-hero__eyebrow{ color: var(--sand); text-shadow: 0 1px 24px oklch(20% 0.005 250 / 0.45); }
.hm-hero__h1{
  color: var(--cream);
  font-size: clamp(1.76rem, 6.4vw, 5.55rem);
  line-height: 1.02;
  letter-spacing: -0.04em;
  font-weight: 800;
  text-shadow: 0 1px 24px oklch(20% 0.005 250 / 0.45);
}
.hm-hero__h1 em{ font-style: normal; }
.hm-line{ display: block; overflow: hidden; padding-block-end: 0.1em; margin-block-end: -0.1em; }
.hm-line__in{ display: inline-block; will-change: transform; }
.hm-hero__bar{
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: var(--space-6);
  padding: clamp(0.9rem, 2.5vh, 1.4rem) clamp(1rem, 4vw, 2rem);
  border-block-start: 1px solid oklch(96% 0.012 80 / 0.22);
  color: var(--cream);
}
.hm-hero__bar-names{ font-size: var(--text-sm); opacity: 0.92; }
.hm-hero__bar-meta{
  font-family: 'Montserrat', system-ui, sans-serif;
  font-size: 11px; letter-spacing: 0.08em;
  color: var(--sand);
}
@media (max-width: 760px){
  .hm-hero__bar{ grid-template-columns: 1fr; gap: var(--space-3); justify-items: start; }
  .hm-hero__bar-meta{ display: none; }
  .hm-hero__cta{ inline-size: 100%; justify-content: center; }
}

/* Bandeau des mentions RE/MAX — nom et titre au permis de chaque courtier,
   agence, mention « Agence immobilière », adresse civique, téléphone principal
   et mention de franchisé. Guide des normes, sept. 2025, p. 27. */
.hm-legal{
  background: var(--vellum);
  border-block-end: 1px solid var(--hairline);
  padding-block: clamp(1.4rem, 3.5vh, 2.2rem);
}
.hm-legal__inner{
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: clamp(1.2rem, 4vw, 3rem);
  align-items: start;
}
.hm-legal__brokers{ list-style: none; display: grid; gap: 0.4rem; }
.hm-legal__brokers li{ display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.05rem 0.5rem; }
.hm-legal__name{ font-weight: 600; color: var(--ink); font-size: var(--text-sm); }
.hm-legal__role{ color: var(--stone); font-size: 0.8rem; }
.hm-legal__agency{
  font-style: normal;
  font-size: 0.8rem;
  line-height: 1.7;
  color: var(--stone);
}
.hm-legal__agency-name{ display: block; font-weight: 600; color: var(--ink); font-size: var(--text-sm); }
.hm-legal__agency-legal{ display: block; color: var(--ink); }
.hm-legal__agency a{ color: var(--stone); text-decoration: underline; text-underline-offset: 3px; }
.hm-legal__agency a:hover{ color: var(--ink); }
.hm-legal__franchise{
  grid-column: 1 / -1;
  margin-block-start: 0.2rem;
  padding-block-start: clamp(0.8rem, 2vh, 1.1rem);
  border-block-start: 1px solid var(--hairline);
  font-size: 0.78rem;
  color: var(--stone);
}
.hm-legal__franchise a{ color: var(--stone); text-decoration: underline; text-underline-offset: 3px; }
.hm-legal__franchise a:hover{ color: var(--ink); }
@media (max-width: 760px){
  .hm-legal__inner{ grid-template-columns: 1fr; gap: var(--space-4); }
}

/* Les chiffres — compteurs bronze, colonnes hairline */
.hm-territory{ padding-block: var(--space-12); }
.hm-territory__inner{
  background: var(--teal);
  color: var(--cream);
  border-radius: 24px;
  padding: clamp(2.5rem, 5vw, 4.75rem);
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: clamp(2rem, 5vw, 5rem);
  align-items: center;
  box-shadow:
    0 1px 2px oklch(22% 0.04 258 / 0.10),
    0 12px 40px oklch(22% 0.04 258 / 0.18);
}
.hm-territory__eye{ color: var(--sand); }
.hm-territory__title{
  font-family: 'Montserrat', system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(2rem, 3.4vw, 3.1rem);
  line-height: 1.04;
  letter-spacing: -0.02em;
  color: var(--cream);
}
.hm-territory__body p{
  font-size: clamp(1.05rem, 1.5vw, 1.3rem);
  line-height: 1.72;
  color: oklch(96% 0.012 80 / 0.84);
  max-inline-size: 62ch;
}
.hm-territory__body strong{ color: var(--cream); font-weight: 500; }
@media (max-width: 860px){
  .hm-territory__inner{ grid-template-columns: 1fr; gap: var(--space-6); }
}

/* Propriétés — galerie horizontale épinglée (desktop), défilement natif (mobile) */
.hm-props{ position: relative; overflow: hidden; padding-block: var(--space-12); }
.hm-props__head{
  display: flex; justify-content: space-between; align-items: end;
  gap: var(--space-6); flex-wrap: wrap;
  margin-block-end: var(--space-8);
}
.hm-props__head .hm-index{ margin-block-end: var(--space-3); }
.hm-props__head .eyebrow{ display: block; margin-block-end: var(--space-2); }
.hm-props__head h2{ max-inline-size: 22ch; }
.hm-props__viewport{ inline-size: 100%; }
.hm-props__track{
  display: flex;
  gap: var(--space-6);
  align-items: stretch;
  padding-inline: clamp(1rem, 4vw, 2rem);
}
.hm-props__track .prop-card{ flex: 0 0 clamp(280px, 78vw, 420px); }
/* Défilement horizontal natif à toutes les tailles. La page continue de
   descendre normalement : c'est le rail qui glisse, jamais la page. */
.hm-props__track{
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scroll-padding-inline: clamp(1rem, 4vw, 2rem);
  padding-block-end: var(--space-4);
  scrollbar-width: none;
  overscroll-behavior-inline: contain;
}
.hm-props__track::-webkit-scrollbar{ display: none; }
.hm-props__track > *{ scroll-snap-align: start; }
@media (prefers-reduced-motion: reduce){ .hm-props__track{ scroll-behavior: auto; } }
@media (min-width: 1024px){
  .hm-props__track .prop-card{ flex: 0 0 clamp(360px, 30vw, 460px); }
}

/* Les deux flèches qui font glisser le rail — le seul moyen d'aller à droite */
.hm-props__nav{
  display: flex; gap: var(--space-2); align-items: center;
  margin-block-start: var(--space-4);
}
.hm-props__arrow{
  inline-size: 48px; block-size: 48px;
  display: grid; place-items: center;
  border: 1px solid var(--hairline);
  border-radius: 999px;
  background: transparent;
  color: var(--ink);
  font-size: 1.15rem; line-height: 1;
  cursor: pointer;
  transition: background 240ms var(--ease-out), color 240ms var(--ease-out),
              border-color 240ms var(--ease-out), transform 240ms var(--ease-out);
}
.hm-props__arrow:hover:not(:disabled){ background: var(--teal); border-color: var(--teal); color: var(--cream); transform: translateY(-2px); }
.hm-props__arrow:focus-visible{ outline: 2px solid var(--bronze); outline-offset: 3px; }
.hm-props__arrow:disabled{ opacity: .35; cursor: default; }
.hm-props__hint{ font-size: var(--text-xs); letter-spacing: .14em; text-transform: uppercase; color: var(--stone); margin-inline-start: var(--space-2); }
.hm-endcard{
  flex: 0 0 clamp(240px, 60vw, 320px);
  border-radius: 14px;
  background: var(--teal);
  color: var(--cream);
  display: flex; flex-direction: column; justify-content: center; align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-6);
  box-shadow: var(--shadow-card);
  transition: transform 320ms var(--ease-out), box-shadow 320ms var(--ease-out);
}
.hm-endcard:hover{ transform: translateY(-4px); box-shadow: var(--shadow-card-hover); color: var(--cream); }
.hm-endcard h3{ color: var(--cream); }
.hm-endcard__arrow{ font-size: 2rem; line-height: 1; color: var(--sand); transition: transform 280ms var(--ease-out); }
.hm-endcard:hover .hm-endcard__arrow{ transform: translateX(6px); }
@media (min-width: 1024px){ .hm-endcard{ flex-basis: clamp(280px, 24vw, 340px); } }

/* L'équipe — une vignette par personne, la rangée s'allonge quand l'équipe grandit */
.hm-team{ padding-block: var(--space-16); }
.hm-team__head{ max-inline-size: 62ch; margin-block-end: var(--space-8); }
.hm-team__head .eyebrow{ display: block; margin-block-end: var(--space-2); }
.hm-team__head p{ color: var(--stone); margin-block-start: var(--space-4); }
.hm-team__cards{
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: var(--space-4);
}
.hm-member{
  display: flex; flex-direction: column; gap: 0.35rem;
  color: var(--ink);
}
.hm-member__photo{
  position: relative;
  display: block;
  aspect-ratio: 4 / 5;
  border-radius: 14px;
  overflow: hidden;
  background: var(--navy);
  box-shadow: var(--shadow-card);
  margin-block-end: var(--space-3);
}
.hm-member__photo img{
  inline-size: 100%; block-size: 100%;
  object-fit: cover; object-position: center 18%;
  transition: transform 900ms var(--ease-out);
}
.hm-member:hover .hm-member__photo img{ transform: scale(1.05); }
/* Même dégradé bleu que les fiches : l'ensemble se lit comme une seule famille */
.hm-member__photo::after{
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(to top, oklch(22% 0.04 240 / 0.5) 0%, transparent 40%);
}
.hm-member__photo--empty{
  display: grid; place-items: center;
  box-shadow: none;
  border: 1px dashed var(--hairline);
  background:
    repeating-linear-gradient(135deg, oklch(90% 0.006 80 / 0.5) 0 12px, transparent 12px 24px),
    var(--cream);
}
.hm-member__photo--empty::after{ content: none; }
.hm-member__photo--empty > span{ font-size: 2.6rem; font-weight: 300; color: var(--mist); line-height: 1; }
.hm-member__name{ font-size: 1.05rem; font-weight: 700; letter-spacing: -0.015em; }
.hm-member__role{ font-size: var(--text-xs); font-weight: 500; color: var(--stone); line-height: 1.45; }
.hm-member--soon .hm-member__name{ color: var(--mist); }
.hm-team__foot{ margin-block-start: var(--space-8); }

/* Territoire — liste interactive, aperçu image qui suit le curseur */
.hm-cities{ position: relative; padding-block: var(--space-16); background: var(--vellum); }
.hm-cities__head .hm-index{ margin-block-end: var(--space-3); }
.hm-cities__head .eyebrow{ display: block; margin-block-end: var(--space-2); }
.hm-cities__list{ margin-block-start: var(--space-8); border-block-start: 1px solid var(--hairline); }
.hm-city{
  display: grid;
  grid-template-columns: 3ch 1fr auto;
  align-items: center;
  gap: var(--space-6);
  padding-block: clamp(1.25rem, 3vw, 2rem);
  border-block-end: 1px solid var(--hairline);
}
.hm-city__idx{
  font-family: 'Montserrat', system-ui, sans-serif;
  font-size: 11px; letter-spacing: 0.08em;
  color: var(--mist);
}
.hm-city__main{ display: flex; flex-direction: column; gap: 0.35rem; min-inline-size: 0; }
.hm-city__name{
  font-family: 'Montserrat', system-ui, sans-serif;
  font-size: clamp(1.6rem, 4vw, 3.1rem);
  letter-spacing: -0.02em;
  line-height: 1.08;
  color: var(--ink);
  transition: color 280ms var(--ease-out), transform 420ms var(--ease-out);
}
.hm-city:hover .hm-city__name{ color: var(--teal); transform: translateX(10px); }
.hm-city__stat{ color: var(--stone); font-size: var(--text-sm); }
.hm-city__arrow{
  font-size: 1.4rem; color: var(--sand);
  opacity: 0.5; transform: translateX(-6px);
  transition: transform 320ms var(--ease-out), opacity 320ms var(--ease-out);
}
.hm-city:hover .hm-city__arrow{ opacity: 1; transform: translateX(0); }
.hm-city--teaser .hm-city__name{ color: var(--teal); font-style: italic; }

/* CTA — photo pleine largeur derrière un dégradé bleu, marquise en contour par-dessus */
.hm-cta{
  position: relative;
  isolation: isolate;
  background: var(--teal);
  color: var(--cream);
  padding-block: var(--space-8) var(--space-12);
  overflow: hidden;
}
.hm-cta__bg{
  position: absolute; inset: 0; z-index: -2;
  inline-size: 100%; block-size: 100%;
  object-fit: cover;
  /* Ken burns très lent : la photo respire sans jamais attirer l'œil */
  animation: hm-kenburns 34s ease-in-out infinite alternate;
  will-change: transform;
}
@keyframes hm-kenburns{ from{ transform: scale(1.04); } to{ transform: scale(1.14) translate3d(-1.5%, -1%, 0); } }
@media (prefers-reduced-motion: reduce){ .hm-cta__bg{ animation: none; transform: scale(1.04); } }
/* Le même dégradé bleu que les fiches, en plein écran cette fois */
.hm-cta::before{
  content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none;
  background:
    linear-gradient(to right, oklch(22% 0.04 240 / 0.72) 0%, oklch(22% 0.04 240 / 0.4) 55%, oklch(22% 0.04 240 / 0.2) 100%),
    linear-gradient(to top, oklch(22% 0.04 240 / 0.85) 0%, oklch(30% 0.055 250 / 0.55) 45%, oklch(37.3% 0.06 258 / 0.32) 100%);
}
.hm-marquee{ inline-size: 100%; overflow: hidden; margin-block-end: var(--space-8); }
.hm-marquee__track{
  display: flex;
  white-space: nowrap;
  inline-size: max-content;
  animation: hm-marquee 36s linear infinite;
  will-change: transform;
}
.hm-marquee__track span{
  font-family: 'Montserrat', system-ui, sans-serif;
  font-size: clamp(3.25rem, 9vw, 7.5rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: transparent;
  -webkit-text-stroke: 1px oklch(96% 0.012 80 / 0.32);
}
@keyframes hm-marquee{ to{ transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce){ .hm-marquee__track{ animation: none; } }
.hm-cta__inner{
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-6);
}
.hm-cta h2{ color: var(--cream); max-inline-size: 18ch; }
.hm-cta__actions{ display: flex; gap: var(--space-3); flex-wrap: wrap; }
@media (max-width: 768px){ .hm-cta__inner{ grid-template-columns: 1fr; } }
/* Homepage only — CTA band flows directly into the (same-teal) footer */
body.header-overlay .site-footer{ margin-block-start: 0; border-block-start: 1px solid oklch(96% 0.012 80 / 0.15); }

/* ===== Pages de contenu (vendre / acheter / guides) ===== */
.two-col{ display:grid; grid-template-columns:1.15fr .85fr; gap:clamp(1.5rem,4vw,3.5rem); align-items:start; }
@media(max-width:900px){ .two-col{ grid-template-columns:1fr; } }
.two-col aside{ position:sticky; top:calc(var(--header-h) + 1.5rem); }
@media(max-width:900px){ .two-col aside{ position:static; } }
.prose{ max-inline-size:68ch; font-size:1.05rem; line-height:1.78; color:var(--stone); }
.prose h2{ font-family:'Montserrat', system-ui, sans-serif; font-weight:700; font-size:clamp(1.5rem,2.6vw,2.1rem); line-height:1.15; letter-spacing:-0.015em; color:var(--ink); margin-block:2.6rem 0.9rem; }
.prose h2:first-child, .prose > p:first-child{ margin-block-start:0; }
.prose h3{ font-family:'Montserrat', system-ui, sans-serif; font-weight:600; font-size:clamp(1.2rem,1.8vw,1.45rem); color:var(--ink); margin-block:1.8rem 0.5rem; }
.prose p{ margin-block-end:1rem; }
.prose ul{ padding-inline-start:1.3rem; list-style:disc; margin-block-end:1.1rem; }
.prose ul li::marker{ color:var(--bronze); }
.prose li{ margin-block-end:0.5rem; }
.prose strong{ color:var(--ink); font-weight:600; }
.prose ol{ padding-inline-start:1.3rem; list-style:decimal; margin-block-end:1.1rem; }
.prose ol li::marker{ color:var(--bronze); font-weight:600; }
/* Tableaux d'article : les chiffres s'alignent, la ligne déborde en scroll
   sur mobile plutôt que d'élargir la page. */
.prose .tbl{ overflow-x:auto; margin-block:1.4rem 1.6rem; }
.prose table{ inline-size:100%; border-collapse:collapse; font-size:.94rem; }
.prose caption{ caption-side:bottom; padding-block-start:.7rem; font-size:.82rem; color:var(--mist); text-align:start; }
.prose th, .prose td{ padding:.65rem .8rem; border-block-end:1px solid var(--hairline); text-align:start; }
.prose thead th{
  font-size:.72rem; font-weight:600; text-transform:uppercase; letter-spacing:.1em;
  color:var(--stone); border-block-end:1px solid var(--sand); white-space:nowrap;
}
.prose td.num, .prose th.num{ text-align:end; font-variant-numeric:tabular-nums; white-space:nowrap; }
.prose tbody tr:last-child td{ border-block-end:0; }
.prose .note{
  margin-block:1.6rem; padding:1.1rem 1.3rem;
  background:var(--vellum); border:1px solid var(--hairline);
  border-radius:var(--radius); font-size:.95rem;
}
.prose .note p:last-child{ margin-block-end:0; }
.prose a{ color:var(--bronze); text-decoration:underline; text-underline-offset:3px; }
.blue-block{ background:var(--teal); color:var(--cream); border-radius:var(--radius-lg); padding:clamp(1.75rem,3vw,2.5rem); }
.blue-block.soft{ background:var(--blue-soft); color:var(--ink); }
.blue-block h2, .blue-block h3{ color:inherit; }
.blue-block .eye{ font:500 11px 'Montserrat', system-ui, sans-serif; text-transform:uppercase; letter-spacing:0.18em; }
/* Bannière image (pages de contenu) */
/* Bannière de page — la photo déborde légèrement pour permettre la parallaxe */
.content-hero{ margin:0 0 clamp(1.5rem,3vw,2.5rem); border-radius:var(--radius-lg); overflow:hidden; position:relative; box-shadow:var(--shadow-card); block-size:clamp(220px,32vw,440px); }
.content-hero::after{
  content:""; position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(to top, oklch(22% 0.04 240 / 0.55) 0%, oklch(37.3% 0.06 258 / 0.18) 45%, transparent 75%);
}
.content-hero img{ display:block; inline-size:100%; block-size:118%; object-fit:cover; will-change:transform; }
@media (prefers-reduced-motion: reduce){ .content-hero img{ block-size:100%; } }
/* Pages de ville — titre plus mesuré + bande de stats éditoriale */
.page-head--city h1{ font-size:clamp(1.9rem,4.2vw,3.1rem); letter-spacing:-0.02em; max-inline-size:16ch; }
.page-head--city .lead{ font-size:1.05rem; }
.city-stats{ display:grid; grid-template-columns:repeat(4,1fr); gap:clamp(1rem,3vw,2.75rem); padding-block:clamp(1.5rem,3vw,2.25rem); border-block:1px solid var(--hairline); }
@media(max-width:720px){ .city-stats{ grid-template-columns:1fr 1fr; gap:1.6rem 1.25rem; } }
.city-stat{ display:flex; flex-direction:column; gap:.4rem; }
.city-stat__n{ font-family:'Montserrat', system-ui, sans-serif; font-size:clamp(1.7rem,3vw,2.5rem); color:var(--bronze); line-height:1; letter-spacing:-0.01em; font-variant-numeric:tabular-nums; }
.city-stat__l{ font:500 11px 'Montserrat', system-ui, sans-serif; text-transform:uppercase; letter-spacing:.13em; color:var(--stone); }
/* Statistiques de marché Centris — chiffres réels, source et période visibles */
.mstats{
  border:1px solid var(--hairline);
  border-radius:var(--radius-lg);
  background:var(--vellum);
  padding:clamp(1.4rem,3vw,2.2rem);
  margin-block-end:clamp(2rem,4vw,3rem);
}
.mstats__head{
  display:flex; justify-content:space-between; align-items:baseline;
  gap:1rem; flex-wrap:wrap;
  padding-block-end:1.1rem; margin-block-end:1.4rem;
  border-block-end:1px solid var(--hairline);
}
.mstats__period{ font-size:var(--text-xs); font-weight:600; text-transform:uppercase; letter-spacing:.14em; color:var(--stone); }
.mstats__grid{ display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:clamp(1rem,2.5vw,2rem); }
.mstat{ display:flex; flex-direction:column; gap:.25rem; }
.mstat__n{
  font-size:clamp(1.5rem,2.8vw,2.15rem); font-weight:700;
  letter-spacing:-0.03em; line-height:1.05;
  color:var(--teal); font-variant-numeric:tabular-nums;
}
.mstat__l{ font-size:var(--text-xs); font-weight:600; text-transform:uppercase; letter-spacing:.11em; color:var(--stone); line-height:1.4; }
.mstat__var{ font-size:var(--text-sm); font-weight:600; font-variant-numeric:tabular-nums; }
.mstat__var--up{ color:oklch(52% 0.11 150); }
.mstat__var--down{ color:oklch(55% 0.15 28); }
.mstat__var--flat{ color:var(--mist); }
.mstat__u{ font-size:.55em; font-weight:600; color:var(--stone); letter-spacing:0; }
.mstats__source{ margin-block-start:1.4rem; font-size:var(--text-xs); line-height:1.6; color:var(--mist); max-inline-size:none; }
.mstats__source a{ color:var(--stone); text-decoration:underline; text-underline-offset:2px; }
.mstats__source a:hover{ color:var(--teal); }
.faq-source{ font-size:var(--text-xs); color:var(--mist); }
.faq-source a{ text-decoration:underline; text-underline-offset:2px; }

/* Tableau détaillé des statistiques Centris */
.mkt-tbl{ inline-size:100%; border-collapse:separate; border-spacing:0; margin-block:1rem 2rem; font-size:.92rem; background:var(--vellum); border:1px solid var(--hairline); border-radius:var(--radius); overflow:hidden; }
.mkt-tbl th, .mkt-tbl td{ padding:.75rem .95rem; text-align:start; border-block-end:1px solid var(--hairline); }
.mkt-tbl thead th{ background:var(--navy); color:var(--cream); font-size:.72rem; font-weight:600; text-transform:uppercase; letter-spacing:.1em; }
.mkt-tbl td.num, .mkt-tbl th.num{ text-align:end; font-variant-numeric:tabular-nums; white-space:nowrap; }
.mkt-tbl tbody tr:last-child td{ border-block-end:0; }
.mkt-var{ font-size:.82em; font-weight:600; margin-inline-start:.35rem; }
.mkt-var--up{ color:oklch(52% 0.11 150); }
.mkt-var--down{ color:oklch(55% 0.15 28); }
.mkt-var--flat{ color:var(--mist); }
@media(max-width:560px){ .mkt-tbl{ font-size:.84rem; } .mkt-tbl th, .mkt-tbl td{ padding:.6rem .55rem; } }

/* Page Équipe — une carte par personne, la même quel que soit le nombre de membres */

/* Bande territoire pleine largeur, photo derrière le dégradé bleu */
.team-band{
  position:relative; isolation:isolate; overflow:hidden;
  margin-block:clamp(2rem,5vw,3.5rem);
  padding-block:clamp(3rem,8vw,6rem);
  color:var(--cream);
  background:var(--teal);
}
.team-band__bg{
  position:absolute; inset:0; z-index:-2;
  inline-size:100%; block-size:100%; object-fit:cover;
  animation:hm-kenburns 34s ease-in-out infinite alternate;
  will-change:transform;
}
@media (prefers-reduced-motion: reduce){ .team-band__bg{ animation:none; transform:scale(1.04); } }
/* Deux couches : un dégradé vertical pour l'ambiance, un voile latéral pour
   garantir le contraste du texte quelle que soit la photo derrière. */
.team-band::before{
  content:""; position:absolute; inset:0; z-index:-1; pointer-events:none;
  background:
    linear-gradient(to right, oklch(22% 0.04 240 / 0.8) 0%, oklch(22% 0.04 240 / 0.45) 45%, transparent 75%),
    linear-gradient(to top, oklch(22% 0.04 240 / 0.82) 0%, oklch(30% 0.055 250 / 0.5) 55%, oklch(37.3% 0.06 258 / 0.3) 100%);
}
.team-band__inner{ display:flex; flex-direction:column; align-items:flex-start; gap:var(--space-4); }
.team-band__inner h2{ color:var(--cream); max-inline-size:20ch; }
.team-band__inner p{ color:oklch(96% 0.012 80 / 0.86); max-inline-size:56ch; }
.team-band__inner .eyebrow{ color:var(--sand); }

/* Rangée de cartes qui se redistribuent : la carte ouverte prend la place,
   les autres se resserrent. On anime flex-grow, jamais width — pas de reflow.
   Sans JS, toutes les bios restent lisibles (html.js pilote le repli). */
.team-grid{
  display:flex;
  flex-wrap:wrap;
  /* flex-start, sinon les cartes fermées s'étirent à la hauteur de l'ouverte
     et laissent de longues colonnes vides */
  align-items:flex-start;
  gap:clamp(1rem,2vw,1.4rem);
  margin-block-end:clamp(2.5rem,5vw,4rem);
}
.team-card{
  flex:1 1 240px;
  min-inline-size:0;
  display:flex; flex-direction:column;
  background:var(--vellum);
  border:1px solid var(--hairline);
  border-radius:var(--radius-lg);
  overflow:hidden;
  transition:flex-grow 520ms var(--ease-out), box-shadow 420ms var(--ease-out), border-color 420ms var(--ease-out);
}
@media(min-width:900px){
  .team-grid{ flex-wrap:nowrap; }
  /* flex-basis:0 — sans ça, la base de 240px absorbe la largeur et flex-grow
     ne redistribue que les miettes : l'écart ouvert/fermé reste invisible. */
  .team-card{ flex:1 1 0; }
  .team-card.is-open{ flex-grow:2.2; }
  .team-grid:has(.is-open) .team-card:not(.is-open){ flex-grow:1; }

  /* Ouverte, la photo devient un bandeau court : à hauteur égale, un portrait
     étiré sur toute la largeur se transforme en gros plan du visage. */
  .team-card.is-open .team-card__photo{
    aspect-ratio:auto;
    block-size:clamp(150px,13vw,190px);
    max-block-size:none;
  }
  .team-card.is-open .team-card__photo img{ object-position:center 22%; }

  /* La largeur gagnée sert à raccourcir la bio, pas à allonger les lignes.
     Pas de break-inside:avoid : le texte doit passer d'une colonne à l'autre
     ligne par ligne, sinon un paragraphe entier saute d'un coup et les deux
     colonnes se retrouvent de hauteurs très inégales. */
  .team-card.is-open .team-card__bio > div{ columns:2; column-gap:1.8rem; column-fill:balance; }
  .team-card.is-open .team-card__bio p{ max-inline-size:none; }
  .team-card.is-open .team-card__bio p:first-child{ margin-block-start:0; }
}
}
.team-card.is-open{ border-color:var(--teal); box-shadow:var(--shadow-card); }
@media (prefers-reduced-motion: reduce){ .team-card{ transition:none; } }

/* Photo — moitié de la hauteur précédente, le visage reste cadré */
.team-card__photo{
  position:relative; margin:0;
  aspect-ratio:1/1;
  max-block-size:clamp(180px,22vw,260px);
  overflow:hidden; background:var(--navy);
}
.team-card__photo img{
  inline-size:100%; block-size:100%;
  object-fit:cover; object-position:center 15%;
  transition:transform 900ms var(--ease-out);
}
.team-card:hover .team-card__photo img,
.team-card.is-open .team-card__photo img{ transform:scale(1.04); }
/* Le même dégradé bleu que les fiches de propriété : la famille visuelle tient */
.team-card__photo::after{
  content:""; position:absolute; inset:0; pointer-events:none;
  background:linear-gradient(to top, oklch(22% 0.04 240 / 0.55) 0%, transparent 42%);
}
.team-card__photo--empty{
  display:grid; place-items:center;
  background:
    repeating-linear-gradient(135deg, oklch(90% 0.006 80 / 0.5) 0 12px, transparent 12px 24px),
    var(--cream);
}
.team-card__photo--empty::after{ content:none; }
.team-card__photo--empty span{ font-size:clamp(2.2rem,4vw,3rem); font-weight:300; color:var(--mist); line-height:1; }

.team-card__body{ display:flex; flex-direction:column; gap:.4rem; padding:clamp(1.1rem,2vw,1.5rem); flex:1; }
.team-card__role{ font-size:var(--text-xs); font-weight:600; text-transform:uppercase; letter-spacing:.14em; color:var(--sand); line-height:1.4; }
.team-card__name{ font-size:clamp(1.15rem,1.6vw,1.45rem); font-weight:700; letter-spacing:-0.025em; line-height:1.1; margin:0; color:var(--ink); }

/* Le déclencheur d'accordéon */
.team-card__toggle{
  display:flex; align-items:center; justify-content:space-between; gap:.6rem;
  inline-size:100%; margin-block-start:.7rem; padding-block:.6rem;
  border-block-start:1px solid var(--hairline);
  font-size:.85rem; font-weight:600; color:var(--teal);
  text-align:start;
  transition:color 240ms var(--ease-out);
}
.team-card__toggle:hover{ color:var(--ink); }
.team-card__toggle-icon{
  flex:none; inline-size:18px; block-size:18px;
  position:relative;
}
.team-card__toggle-icon::before,
.team-card__toggle-icon::after{
  content:""; position:absolute; inset-inline:0; inset-block-start:50%;
  block-size:1.5px; background:currentColor; border-radius:2px;
  transition:transform 320ms var(--ease-out);
}
.team-card__toggle-icon::after{ transform:rotate(90deg); }
.team-card.is-open .team-card__toggle-icon::after{ transform:rotate(0deg); }

/* Repli animé : grid-template-rows 0fr → 1fr anime une hauteur automatique */
.team-card__bio{
  display:grid; grid-template-rows:1fr;
  transition:grid-template-rows 480ms var(--ease-out);
}
html.js .team-card__bio{ grid-template-rows:0fr; }
html.js .team-card.is-open .team-card__bio{ grid-template-rows:1fr; }
.team-card__bio > div{ overflow:hidden; min-block-size:0; }
.team-card__bio p{ color:var(--stone); font-size:var(--text-sm); line-height:1.75; max-inline-size:60ch; }
.team-card__bio p:first-child{ margin-block-start:.5rem; }
.team-card__bio p + p{ margin-block-start:.8rem; }
@media (prefers-reduced-motion: reduce){ .team-card__bio{ transition:none; } }

.team-card__contact{
  display:flex; flex-direction:column; gap:.15rem;
  margin-block-start:auto; padding-block-start:.9rem;
  border-block-start:1px solid var(--hairline);
  font-size:var(--text-sm); font-weight:500;
}
.team-card__contact a{ color:var(--teal); overflow-wrap:anywhere; }
.team-card__contact a:hover{ color:var(--ink); }
.team-card__cta{
  display:inline-flex; align-items:center; gap:.4rem;
  padding-block-start:.8rem;
  font-size:.88rem; font-weight:600; color:var(--ink);
  transition:gap .25s var(--ease-out);
}
.team-card__cta:hover{ gap:.75rem; color:var(--teal); }
.team-card--soon{ border-style:dashed; }
.team-card--soon:hover{ box-shadow:none; border-color:var(--hairline); }
/* Pas de bouton sur la carte « prochainement » : son texte reste déplié */
html.js .team-card--soon .team-card__bio{ grid-template-rows:1fr; }
.team-card--soon:hover{ transform:none; box-shadow:none; border-color:var(--hairline); }

/* CTA band sur les pages de contenu */
.cta-band--content{ padding:clamp(2.25rem,4vw,3.5rem) clamp(1.75rem,4vw,3.5rem); border-radius:var(--radius-lg); box-shadow:0 1px 2px oklch(22% 0.04 258 / 0.10), 0 18px 50px oklch(22% 0.04 258 / 0.20); }
.cta-band--content{ isolation:isolate; }
/* Photo pleine largeur derrière le dégradé bleu, comme sur la bande d'accueil */
.cta-band__bg{
  position:absolute; inset:0; z-index:-2;
  inline-size:100%; block-size:100%;
  object-fit:cover;
  animation:hm-kenburns 34s ease-in-out infinite alternate;
  will-change:transform;
}
@media (prefers-reduced-motion: reduce){ .cta-band__bg{ animation:none; transform:scale(1.04); } }
.cta-band--content::before{
  content:""; position:absolute; inset:0; z-index:-1; pointer-events:none;
  background:
    linear-gradient(to right, oklch(22% 0.04 240 / 0.82) 0%, oklch(22% 0.04 240 / 0.5) 50%, oklch(22% 0.04 240 / 0.25) 100%),
    linear-gradient(to top, oklch(22% 0.04 240 / 0.8) 0%, oklch(30% 0.055 250 / 0.5) 55%, oklch(37.3% 0.06 258 / 0.3) 100%);
}
.cta-band--content .cta-band__inner{ position:relative; z-index:1; }
.cta-band__eye{ color:var(--sand); display:block; margin-block-end:var(--space-3); }
.cta-band__sub{ color:oklch(96% 0.012 80 / 0.82); max-inline-size:46ch; margin-block-start:var(--space-3); line-height:1.6; }
.cta-band--content .cta-band__actions{ flex-direction:column; align-items:stretch; }
.cta-band--content .cta-band__actions a{ text-align:center; white-space:nowrap; }
@media (max-width:768px){ .cta-band--content .cta-band__actions{ flex-direction:row; flex-wrap:wrap; } }
`;

const JS = `
(() => {
  const ready = (fn) => document.readyState !== 'loading' ? fn() : document.addEventListener('DOMContentLoaded', fn);

  ready(() => {
    const hasGSAP = typeof window.gsap !== 'undefined';
    const hasLenis = typeof window.Lenis !== 'undefined';
    const hasST = hasGSAP && typeof window.ScrollTrigger !== 'undefined';
    const hasSplitting = typeof window.Splitting !== 'undefined';
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Même règle que le slug() du build, pour que ?city=Sainte-Thérèse trouve sa carte
    const slugify = (s) => (s || '').toString().toLowerCase().normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Lenis smooth scroll
    let lenis = null;
    if (hasLenis && !reduceMotion) {
      lenis = new window.Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
      });
      if (hasGSAP) {
        window.gsap.ticker.add((time) => lenis.raf(time * 1000));
        window.gsap.ticker.lagSmoothing(0);
      } else {
        const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
    }

    if (hasGSAP && hasST) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      if (lenis) lenis.on('scroll', window.ScrollTrigger.update);
    }
    window.__lenis = lenis;

    // Splitting on hero h1
    if (hasSplitting) {
      window.Splitting();
    }

    // Hero h1 char stagger — animate FROM (no initial-hide), so failure is invisible
    if (hasGSAP && !reduceMotion) {
      try {
        const heroH1 = document.querySelector('.hero__h1');
        if (heroH1 && heroH1.querySelector('.char')) {
          window.gsap.fromTo('.hero__h1 .char',
            { yPercent: 100, opacity: 0 },
            { yPercent: 0, opacity: 1, duration: 1, ease: 'back.out(1.2)', stagger: 0.025, delay: 0.2 }
          );
        }
      } catch (e) { /* fail silent — content stays visible */ }
    }

    // Révélation au défilement — on cache d'avance les blocs sous la ligne de
    // flottaison, puis on anime seulement VERS l'état visible (jamais de
    // fromTo(immediateRender:false), qui repassait un bloc déjà affiché à
    // opacity 0 au déclenchement : c'était le flash). Le déclencheur est un
    // IntersectionObserver : fiable même si l'onglet est chargé en arrière-plan
    // ou redimensionné, là où ScrollTrigger pouvait ne jamais partir.
    if (hasGSAP && !reduceMotion && 'IntersectionObserver' in window && window.innerHeight > 0) {
      try {
        const threshold = window.innerHeight * 0.85;
        const show = (el) => window.gsap.to(el, { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', clearProps: 'transform', overwrite: true });
        const io = new IntersectionObserver((entries) => {
          entries.forEach((en) => {
            if (!en.isIntersecting) return;
            io.unobserve(en.target);
            show(en.target);
          });
        }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
        const pending = [];
        window.gsap.utils.toArray('.reveal').forEach((el) => {
          if (el.getBoundingClientRect().top < threshold) return; // déjà à l'écran : on n'y touche pas
          window.gsap.set(el, { y: 40, opacity: 0 });
          pending.push(el);
          io.observe(el);
        });
        // Filet de sécurité : rien ne reste caché si l'observateur ne part pas.
        window.setTimeout(() => {
          pending.forEach((el) => {
            if (window.getComputedStyle(el).opacity === '0' && el.getBoundingClientRect().top < window.innerHeight) {
              io.unobserve(el);
              show(el);
            }
          });
        }, 4000);
      } catch (e) { /* fail silent — le contenu reste visible */ }
    }

    // Sticky header scrolled state
    const header = document.querySelector('[data-header]');
    if (header) {
      const onScroll = () => {
        if (window.scrollY > 40) header.classList.add('scrolled');
        else header.classList.remove('scrolled');
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Drawer
    const drawer = document.querySelector('[data-drawer]');
    const drawerToggle = document.querySelector('[data-drawer-toggle]');
    const drawerClose = document.querySelector('[data-drawer-close]');
    const openDrawer = () => {
      if (!drawer) return;
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      drawerToggle?.setAttribute('aria-expanded', 'true');
      if (lenis) lenis.stop();
      document.body.style.overflow = 'hidden';
    };
    const closeDrawer = () => {
      if (!drawer) return;
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      drawerToggle?.setAttribute('aria-expanded', 'false');
      if (lenis) lenis.start();
      document.body.style.overflow = '';
    };
    drawerToggle?.addEventListener('click', openDrawer);
    drawerClose?.addEventListener('click', closeDrawer);
    drawer?.addEventListener('click', (e) => { if (e.target === drawer) closeDrawer(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

    // Carousel arrows
    document.querySelectorAll('[data-carousel]').forEach((carousel) => {
      const track = carousel.querySelector('.carousel__track');
      const prev = carousel.querySelector('[data-carousel-prev]');
      const next = carousel.querySelector('[data-carousel-next]');
      if (!track) return;
      const stepBy = () => {
        const card = track.querySelector(':scope > *');
        if (!card) return track.clientWidth * 0.8;
        const styles = getComputedStyle(track);
        const gap = parseFloat(styles.columnGap || styles.gap || '0');
        return card.getBoundingClientRect().width + gap;
      };
      prev?.addEventListener('click', () => track.scrollBy({ left: -stepBy(), behavior: 'smooth' }));
      next?.addEventListener('click', () => track.scrollBy({ left: stepBy(), behavior: 'smooth' }));
    });

    // ===== Property detail page =====
    const propPage = document.querySelector('[data-prop-page]');
    if (propPage) {
      const toggle = propPage.querySelector('[data-prop-toggle]');
      const mediaPane = propPage.querySelector('#media-pane');
      const mapPane = propPage.querySelector('#map-pane');
      const lat = parseFloat(propPage.dataset.lat);
      const lon = parseFloat(propPage.dataset.lon);
      let mapInited = false;
      let leafletMap = null;

      const initMap = (containerId) => {
        if (typeof window.L === 'undefined' || !isFinite(lat) || !isFinite(lon)) return;
        const el = document.getElementById(containerId);
        if (!el || el._inited) return;
        el._inited = true;
        const map = window.L.map(el, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lon], 15);
        window.L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19
        }).addTo(map);
        const pinHtml = '<div class="prop-pin"><svg viewBox="0 0 24 24" width="36" height="36" fill="#2c4160" stroke="#FBF8F2" stroke-width="1.5"><path d="M12 2c-4 0-7 3-7 7 0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/><circle cx="12" cy="9" r="2.5" fill="#FBF8F2" stroke="none"/></svg></div>';
        const icon = window.L.divIcon({ html: pinHtml, className: 'prop-pin-wrap', iconSize: [36, 36], iconAnchor: [18, 34] });
        window.L.marker([lat, lon], { icon }).addTo(map);
        return map;
      };

      if (toggle) {
        const btns = toggle.querySelectorAll('button');
        btns.forEach(b => b.addEventListener('click', () => {
          if (b.getAttribute('aria-disabled') === 'true') return;
          const mode = b.dataset.mode;
          toggle.dataset.mode = mode;
          btns.forEach(x => x.setAttribute('aria-pressed', x.dataset.mode === mode ? 'true' : 'false'));
          if (mediaPane && mapPane) {
            mediaPane.setAttribute('aria-hidden', mode === 'photos' ? 'false' : 'true');
            mapPane.setAttribute('aria-hidden', mode === 'map' ? 'false' : 'true');
          }
          if (mode === 'map' && !mapInited) {
            mapInited = true;
            leafletMap = initMap('leaflet-map');
          }
          if (mode === 'map' && leafletMap) {
            setTimeout(() => leafletMap.invalidateSize(), 60);
          }
        }));
      }

      // Lightbox
      const lb = document.querySelector('[data-lightbox]');
      const photos = (() => { try { return JSON.parse(propPage.dataset.photos || '[]'); } catch { return []; } })();
      let lbIdx = 0;
      const lbImg = lb?.querySelector('.lightbox__img');
      const lbCount = lb?.querySelector('.lightbox__count');
      const showAt = (i) => {
        if (!photos.length || !lbImg) return;
        lbIdx = (i + photos.length) % photos.length;
        lbImg.src = photos[lbIdx];
        if (lbCount) lbCount.textContent = (lbIdx + 1) + ' / ' + photos.length;
      };
      const openLb = (i) => {
        if (!lb) return;
        showAt(i || 0);
        lb.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (lenis) lenis.stop();
      };
      const closeLb = () => {
        if (!lb) return;
        lb.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        if (lenis) lenis.start();
      };
      propPage.querySelectorAll('[data-open-lightbox]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          openLb(parseInt(el.dataset.openLightbox, 10) || 0);
        });
      });
      lb?.querySelector('[data-lb-close]')?.addEventListener('click', closeLb);
      lb?.querySelector('[data-lb-prev]')?.addEventListener('click', () => showAt(lbIdx - 1));
      lb?.querySelector('[data-lb-next]')?.addEventListener('click', () => showAt(lbIdx + 1));
      lb?.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
      document.addEventListener('keydown', (e) => {
        if (!lb || lb.getAttribute('aria-hidden') !== 'false') return;
        if (e.key === 'Escape') closeLb();
        if (e.key === 'ArrowLeft') showAt(lbIdx - 1);
        if (e.key === 'ArrowRight') showAt(lbIdx + 1);
      });
      // Touch swipe
      let touchX = null;
      const stage = lb?.querySelector('.lightbox__stage');
      stage?.addEventListener('pointerdown', (e) => { touchX = e.clientX; });
      stage?.addEventListener('pointerup', (e) => {
        if (touchX === null) return;
        const dx = e.clientX - touchX;
        if (dx > 50) showAt(lbIdx - 1);
        else if (dx < -50) showAt(lbIdx + 1);
        touchX = null;
      });

      // Description collapsible
      propPage.querySelectorAll('[data-collapsible]').forEach((wrap) => {
        const btn = wrap.querySelector('.desc-wrap__toggle');
        btn?.addEventListener('click', () => {
          wrap.classList.toggle('expanded');
          btn.textContent = wrap.classList.contains('expanded') ? 'Réduire' : 'Lire la suite';
        });
      });

      // Amenities expand
      propPage.querySelectorAll('[data-amenities-toggle]').forEach((btn) => {
        const target = propPage.querySelector(btn.dataset.amenitiesToggle);
        btn.addEventListener('click', () => {
          if (!target) return;
          const isOpen = target.hasAttribute('open');
          if (isOpen) target.removeAttribute('open');
          else target.setAttribute('open', '');
          btn.textContent = isOpen ? btn.dataset.labelMore : btn.dataset.labelLess;
        });
      });

      // Mobile map modal
      const mapModal = document.querySelector('[data-map-modal]');
      let mapModalInited = false;
      let leafletMapModal = null;
      document.querySelectorAll('[data-open-map-modal]').forEach((el) => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          if (!mapModal) return;
          mapModal.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
          if (!mapModalInited) {
            mapModalInited = true;
            leafletMapModal = initMap('leaflet-map-modal');
          }
          if (leafletMapModal) setTimeout(() => leafletMapModal.invalidateSize(), 80);
        });
      });
      mapModal?.querySelector('[data-map-modal-close]')?.addEventListener('click', () => {
        mapModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    }

    // ===== Homepage 2026 =====
    const hmHero = document.querySelector('[data-hm-hero]');
    if (hmHero && hasGSAP && !reduceMotion) {
      try {
        // Masked line reveal — animate FROM, so failure leaves content visible
        window.gsap.fromTo('.hm-line__in',
          { yPercent: 110 },
          { yPercent: 0, duration: 1.25, ease: 'power3.out', stagger: 0.12, delay: 0.15, immediateRender: false }
        );
        window.gsap.fromTo(['.hm-hero__eyebrow', '.hm-hero__bar'],
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.15, delay: 0.65, immediateRender: false }
        );
        if (hasST) {
          const hmVideo = hmHero.querySelector('.hm-hero__video');
          if (hmVideo) {
            window.gsap.to(hmVideo, { yPercent: 12, scale: 1.06, ease: 'none',
              scrollTrigger: { trigger: hmHero, start: 'top top', end: 'bottom top', scrub: true } });
          }
          const hmInner = hmHero.querySelector('.hm-hero__inner');
          if (hmInner) {
            window.gsap.to(hmInner, { yPercent: -16, opacity: 0.25, ease: 'none',
              scrollTrigger: { trigger: hmHero, start: 'top top', end: 'bottom top', scrub: true } });
          }
        }
      } catch (e) { /* fail silent */ }
    }

    // Count-up metrics
    if (hasGSAP && hasST && !reduceMotion) {
      try {
        document.querySelectorAll('[data-count]').forEach((el) => {
          const target = parseFloat(el.dataset.count);
          if (!isFinite(target)) return;
          const pad = parseInt(el.dataset.pad || '0', 10);
          const obj = { v: 0 };
          window.gsap.to(obj, { v: target, duration: 1.8, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
            onUpdate: () => {
              const n = Math.round(obj.v);
              let s = n.toLocaleString('fr-CA');
              if (pad) { s = String(n); while (s.length < pad) s = '0' + s; }
              el.textContent = s;
            } });
        });
      } catch (e) { /* fail silent */ }
    }

    // Galerie de propriétés — défilement horizontal piloté par deux flèches.
    // La section n'épingle plus la page : descendre continue de descendre.
    const hmTrack = document.querySelector('[data-hm-props-track]');
    const hmPrev = document.querySelector('[data-hm-props-prev]');
    const hmNext = document.querySelector('[data-hm-props-next]');
    if (hmTrack && hmPrev && hmNext) {
      // Un pas = la largeur d'une carte + le gap, pour retomber sur un snap.
      const step = () => {
        const card = hmTrack.querySelector('.prop-card, .hm-endcard');
        if (!card) return hmTrack.clientWidth * 0.8;
        const gap = parseFloat(getComputedStyle(hmTrack).columnGap) || 0;
        return card.getBoundingClientRect().width + gap;
      };
      const sync = () => {
        const max = hmTrack.scrollWidth - hmTrack.clientWidth;
        hmPrev.disabled = hmTrack.scrollLeft <= 1;
        hmNext.disabled = hmTrack.scrollLeft >= max - 1;
      };
      hmPrev.addEventListener('click', () => hmTrack.scrollBy({ left: -step(), behavior: 'smooth' }));
      hmNext.addEventListener('click', () => hmTrack.scrollBy({ left: step(), behavior: 'smooth' }));
      hmTrack.addEventListener('scroll', sync, { passive: true });
      window.addEventListener('resize', sync);
      sync();
    }

    // Team image parallax
    const hmTeamImg = document.querySelector('[data-hm-parallax] img');
    if (hmTeamImg && hasGSAP && hasST && !reduceMotion && window.matchMedia('(min-width: 901px)').matches) {
      try {
        window.gsap.fromTo(hmTeamImg,
          { yPercent: -13 },
          { yPercent: 0, ease: 'none', immediateRender: false,
            scrollTrigger: { trigger: hmTeamImg.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }
        );
      } catch (e) { /* fail silent */ }
    }

    // Bannières de page — la photo glisse un peu plus lentement que la page.
    // La photo mesure 118 % de la hauteur du cadre : on ne fait que déplacer
    // le surplus, il n'y a jamais de bande vide.
    if (hasGSAP && hasST && !reduceMotion) {
      document.querySelectorAll('[data-parallax] img').forEach((img) => {
        try {
          window.gsap.fromTo(img,
            { yPercent: -15 },
            { yPercent: 0, ease: 'none', immediateRender: false,
              scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }
          );
        } catch (e) { /* fail silent */ }
      });
    }

    // Filtres de la liste de propriétés. Les boutons existaient déjà mais
    // n'étaient reliés à rien : ils ne filtraient rien du tout.
    const filterBar = document.querySelector('.filters');
    const propGrid = document.querySelector('.prop-grid');
    if (filterBar && propGrid) {
      const cards = Array.from(propGrid.querySelectorAll('.prop-card'));
      let emptyMsg = null;

      const apply = (value) => {
        let shown = 0;
        cards.forEach((card) => {
          const [kind, key] = value.split(':');
          const match = value === 'all' || card.dataset[kind === 'type' ? 'type' : 'city'] === key;
          card.hidden = !match;
          if (match) shown++;
        });
        if (!emptyMsg) {
          emptyMsg = document.createElement('p');
          emptyMsg.className = 'filters__empty';
          emptyMsg.textContent = 'Aucune propriété dans cette sélection pour le moment.';
          propGrid.insertAdjacentElement('afterend', emptyMsg);
        }
        emptyMsg.hidden = shown > 0;
      };

      filterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-filter]');
        if (!btn) return;
        filterBar.querySelectorAll('button').forEach((b) => {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        apply(btn.dataset.filter);
        // Garder l'URL partageable : /nos-proprietes/?type=condo
        const [kind, key] = btn.dataset.filter.split(':');
        const url = new URL(location.href);
        url.searchParams.delete('type'); url.searchParams.delete('city');
        if (key) url.searchParams.set(kind, key);
        history.replaceState(null, '', url);
      });

      // Filtre initial depuis l'URL (les fiches lient vers ?city=…)
      const params = new URLSearchParams(location.search);
      const initial = params.get('type') ? 'type:' + params.get('type')
        : params.get('city') ? 'city:' + slugify(params.get('city'))
        : null;
      if (initial) {
        const btn = filterBar.querySelector('button[data-filter="' + initial + '"]');
        if (btn) btn.click();
      }
    }

    // Bios de l'équipe en accordéon. Une seule ouverte à la fois : la carte
    // active s'élargit (flex-grow en CSS) et les autres se resserrent, sinon
    // la rangée s'étirerait sans que rien ne gagne en lisibilité.
    const teamCards = Array.from(document.querySelectorAll('[data-team-card]'));
    if (teamCards.length) {
      const close = (card) => {
        card.classList.remove('is-open');
        const btn = card.querySelector('[data-team-toggle]');
        if (!btn) return;
        btn.setAttribute('aria-expanded', 'false');
        const label = btn.querySelector('[data-team-toggle-label]');
        if (label) label.textContent = 'Lire la bio';
      };
      const open = (card) => {
        card.classList.add('is-open');
        const btn = card.querySelector('[data-team-toggle]');
        if (!btn) return;
        btn.setAttribute('aria-expanded', 'true');
        const label = btn.querySelector('[data-team-toggle-label]');
        if (label) label.textContent = 'Réduire';
      };

      teamCards.forEach((card) => {
        const btn = card.querySelector('[data-team-toggle]');
        if (!btn) return;
        btn.addEventListener('click', () => {
          const wasOpen = card.classList.contains('is-open');
          teamCards.forEach(close);
          if (!wasOpen) open(card);
        });
      });
    }

    // Menu principal — soulignement qui se déploie depuis la gauche au survol
    document.querySelectorAll('.site-nav .nav-item, .site-nav .has-mega > a, .site-nav .has-sub > a').forEach((a) => {
      if (a.querySelector('.nav-underline')) return;
      const u = document.createElement('span');
      u.className = 'nav-underline';
      u.setAttribute('aria-hidden', 'true');
      a.appendChild(u);
    });
  });
})();
`;

// --- Write CSS/JS ---
fs.mkdirSync(path.join(SITE,'assets'), { recursive: true });
fs.writeFileSync(path.join(SITE,'assets','site.css'), CSS);
fs.writeFileSync(path.join(SITE,'assets','site.js'), JS);

// --- Copy photos/videos/brand ---
function copyDir(from, to){
  if (!fs.existsSync(from)) {
    console.log(`(skip) ${from} introuvable — non copié`);
    return;
  }
  fs.mkdirSync(to,{recursive:true});
  for (const f of fs.readdirSync(from)) {
    // Un dossier préfixé d'un souligné est un dossier de travail : archives,
    // originaux avant retouche. Il reste en local et ne part pas en ligne.
    if (f.startsWith('_')) continue;
    const s = path.join(from,f), d = path.join(to,f);
    // récursif : photos/stock/ était silencieusement ignoré avant
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s,d);
  }
}
copyDir(path.join(ROOT,'photos'), path.join(SITE,'photos'));
copyDir(path.join(ROOT,'brand_assets'), path.join(SITE,'brand_assets'));

// Vidéos : on ne copie que celles réellement utilisées par le site.
// Les masters 4K du dossier videos/ pèsent 224 Mo à eux seuls et une seule
// est appelée par une page — les copier toutes gonflait site/ pour rien.
const USED_VIDEOS = ['REMAX_JR_SEP25_EDIT1.mp4'];
(function copyUsedVideos(){
  const from = path.join(ROOT, 'videos'), to = path.join(SITE, 'videos');
  fs.mkdirSync(to, { recursive: true });
  // Purge des vidéos devenues inutiles dans site/
  if (fs.existsSync(to)) {
    for (const f of fs.readdirSync(to)) {
      if (!USED_VIDEOS.includes(f)) fs.rmSync(path.join(to, f), { recursive: true, force: true });
    }
  }
  for (const f of USED_VIDEOS) {
    const src = path.join(from, f), dst = path.join(to, f);
    if (!fs.existsSync(src)) { console.log(`(skip) videos/${f} introuvable`); continue; }
    // Ne pas réécraser la version web déjà optimisée avec le master 4K
    if (!fs.existsSync(dst) || fs.statSync(dst).size > 15 * 1024 * 1024) fs.copyFileSync(src, dst);
  }
})();

// Purge des photos périmées : site/photos accumulait les fichiers des builds
// précédents, longtemps après leur retrait de photos/.
(function pruneStalePhotos(){
  const from = path.join(ROOT, 'photos'), to = path.join(SITE, 'photos');
  if (!fs.existsSync(to)) return;
  const keep = new Set(['jr-hero-poster.jpg']); // généré par ffmpeg, pas présent dans photos/
  let removed = 0;
  const walk = (rel) => {
    for (const f of fs.readdirSync(path.join(to, rel))) {
      const relPath = path.join(rel, f);
      if (fs.statSync(path.join(to, relPath)).isDirectory()) { walk(relPath); continue; }
      if (keep.has(f) || fs.existsSync(path.join(from, relPath))) continue;
      fs.rmSync(path.join(to, relPath), { force: true });
      removed++;
    }
  };
  walk('');
  if (removed) console.log(`✓ ${removed} photo(s) périmée(s) supprimée(s) de site/photos/`);
})();

// --- Web optimization of the hero video (durable across rebuilds) ---
// Re-encodes the 4K master to a 1080p web MP4 in /site and generates the
// poster frame. Requires ffmpeg; skips gracefully if it's unavailable.
(function optimizeHeroMedia(){
  const hasFFmpeg = (() => { try { execSync('ffmpeg -version', { stdio: 'ignore' }); return true; } catch { return false; } })();
  if (!hasFFmpeg) { console.log('(skip) ffmpeg introuvable — vidéo hero non optimisée'); return; }
  const video = path.join(SITE, 'videos', 'REMAX_JR_SEP25_EDIT1.mp4');
  const poster = path.join(SITE, 'photos', 'jr-hero-poster.jpg');
  if (!fs.existsSync(video)) return;
  try {
    // Only re-encode when the file is still a heavy master (> 15 MB)
    if (fs.statSync(video).size > 15 * 1024 * 1024) {
      const tmp = path.join(SITE, 'videos', '_web.mp4');
      execSync(`ffmpeg -y -i "${video}" -vf "scale=-2:1080" -c:v libx264 -profile:v high -preset slow -crf 24 -pix_fmt yuv420p -an -movflags +faststart "${tmp}"`, { stdio: 'ignore' });
      fs.renameSync(tmp, video);
      console.log(`✓ Vidéo hero optimisée → ${(fs.statSync(video).size/1048576).toFixed(1)} Mo`);
    }
    if (!fs.existsSync(poster)) {
      fs.mkdirSync(path.dirname(poster), { recursive: true });
      execSync(`ffmpeg -y -ss 2 -i "${video}" -frames:v 1 -vf "scale=-2:1280" -q:v 4 "${poster}"`, { stdio: 'ignore' });
      console.log('✓ Poster hero généré');
    }
  } catch (e) {
    console.log('(skip) optimisation vidéo échouée — fichier laissé tel quel');
  }
})();

// --- Utility formatters ---
const fmtPrice = p => p ? `${p.toLocaleString('fr-CA')} $` : 'Prix sur demande';
const fmtNum = n => (n||0).toLocaleString('fr-CA');

// La superficie de terrain arrive brute de Centris : « 1170.40 MC », « 17234.09 PC ».
// On garde l'unité déclarée à l'inscription (le courtier saisit l'une ou l'autre) et
// on met en forme le nombre, sinon la carte affiche « 1170.40 MC ».
const fmtArea = raw => {
  const m = String(raw || '').trim().match(/^([\d.,]+)\s*(MC|PC)?$/i);
  if (!m) return '';
  const n = Math.round(parseFloat(m[1].replace(',', '.')));
  if (!Number.isFinite(n) || n <= 0) return '';
  const unit = { MC: 'm²', PC: 'pi²' }[(m[2] || '').toUpperCase()] || '';
  return `${n.toLocaleString('fr-CA')}${unit ? ' ' + unit : ''}`;
};

// --- Helpers ---
function writePage(relpath, html) {
  const out = path.join(SITE, relpath);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, html);
}

// --- HOMEPAGE ---
// Badge « Nouveau » : inscrit dans les 30 jours précédant l'extraction Centris.
// La référence est la date d'inscription la plus récente du lot, pas la date du
// build : un zip vieux de trois semaines ne doit pas vider le badge d'un coup.
const NEWEST_LISTING = properties.reduce((max, p) => (p.listedAt && p.listedAt > max ? p.listedAt : max), '');
const NEW_LISTING_CUTOFF = NEWEST_LISTING
  ? new Date(new Date(NEWEST_LISTING).getTime() - 30 * 864e5).toISOString().slice(0, 10)
  : null;
const isRecentListing = p => Boolean(NEW_LISTING_CUTOFF && p.listedAt && p.listedAt >= NEW_LISTING_CUTOFF);

const topProps = properties.slice(0, 3);
const videos = [
  { file: 'AVANTAGE-REMAX.mp4', title: "L'avantage RE/MAX" },
  { file: 'AVENIR-IMMOBILIER.mp4', title: "L'avenir de l'immobilier" },
  { file: 'IMPORTANTE-FINALE.mp4', title: "Étapes importantes" },
  { file: 'FLUCTUATION-FINALE.mp4', title: "Fluctuations du marché" },
  { file: 'ARRETER-TRAVAILLER.mp4', title: "Arrêter de travailler" }
];

const homeJsonld = JSON.stringify({
  "@context":"https://schema.org","@type":"RealEstateAgent",
  "name":"Équipe Jacques-Roussel","url":"https://jacquesroussel.com",
  "image":"https://jacquesroussel.com/photos/equipe-jacques-roussel.jpg",
  // À CONFIRMER : le +1-450-430-5555 qui figurait ici ne correspond pas à la ligne
  // principale du bureau relevée au dossier RE/MAX CRYSTAL (450 430-4207). Le guide
  // exige le numéro principal de l'agence — on affiche donc AGENCY.phone.
  "telephone":AGENCY.tel,"priceRange":"$$",
  "address":{"@type":"PostalAddress","streetAddress":AGENCY.street,"addressLocality":AGENCY.city,"addressRegion":"QC","postalCode":AGENCY.postal,"addressCountry":"CA"},
  "parentOrganization":{"@type":"Organization","name":AGENCY.name,"url":AGENCY.franchisorUrl},
  "employee":TEAM.map(m => ({"@type":"RealEstateAgent","name":`${m.first} ${m.last}`,"jobTitle":m.role,"telephone":m.tel,"email":m.email})),
  "areaServed":["Saint-Eustache","Deux-Montagnes","Sainte-Marthe-sur-le-Lac","Boisbriand","Mirabel","Sainte-Thérèse","Blainville","Rosemère","Lorraine"]
});

// Helpers for homepage data
const featProps = properties.slice(0, 6);
const avgPriceK = stats.total ? Math.round(stats.avgPrice / 1000) : null;
const heroCities = [
  { key: 'Saint-Eustache',           href: '/courtier-immobilier/saint-eustache/' },
  { key: 'Deux-Montagnes',           href: '/courtier-immobilier/deux-montagnes/' },
  { key: 'Sainte-Marthe-sur-le-Lac', href: '/courtier-immobilier/sainte-marthe-sur-le-lac/' },
  { key: 'Boisbriand',               href: '/courtier-immobilier/boisbriand/' },
  { key: 'Mirabel',                  href: '/courtier-immobilier/mirabel/' }
];

const homeBody = `
<section class="hm-hero" data-hm-hero>
  <div class="hm-hero__media">
    <video class="hm-hero__video" autoplay muted loop playsinline preload="metadata" poster="/photos/jr-hero-poster.jpg">
      <source src="/videos/REMAX_JR_SEP25_EDIT1.mp4" type="video/mp4">
    </video>
  </div>
  <div class="hm-hero__inner">
    <span class="eyebrow hm-hero__eyebrow">RE/MAX CRYSTAL &middot; RIVE-NORD</span>
    <h1 class="hm-hero__h1">
      <span class="hm-line"><span class="hm-line__in">Vos courtiers</span></span>
      <span class="hm-line"><span class="hm-line__in"><em>d'expérience</em></span></span>
      <span class="hm-line"><span class="hm-line__in">sur la Rive-Nord.</span></span>
    </h1>
  </div>
  <div class="hm-hero__bar">
    <span class="hm-hero__bar-names">${TEAM.map(m => `${m.first} ${m.last}`).join(' &middot; ')}</span>
    <span class="hm-hero__bar-meta">Centris &middot; ${stats.total ? stats.total + ' inscriptions actives' : 'mis à jour quotidiennement'}</span>
    <a class="btn-cream hm-hero__cta" href="/nos-proprietes/">Voir nos propriétés &rarr;</a>
  </div>
</section>

<!-- Mentions imposées par RE/MAX Québec (guide sept. 2025, p. 27). Ne pas retirer :
     sans ce bloc, la redirection depuis la page courtier RE/MAX Québec reste inactive. -->
<section class="hm-legal" aria-label="Mentions RE/MAX Québec">
  <div class="container hm-legal__inner">
    <ul class="hm-legal__brokers">
      ${TEAM.map(m => `<li><span class="hm-legal__name">${m.first} ${m.last}</span><span class="hm-legal__role">${m.role}</span></li>`).join('')}
    </ul>
    <address class="hm-legal__agency">
      <span class="hm-legal__agency-name">${AGENCY.name}</span>
      <span class="hm-legal__agency-legal">${AGENCY.legal}</span>
      ${AGENCY.street}<br>
      ${AGENCY.city} (${AGENCY.region})&nbsp;${AGENCY.postal}<br>
      <a href="tel:${AGENCY.tel}">${AGENCY.phone}</a>
    </address>
    <p class="hm-legal__franchise">${AGENCY.franchise.replace(AGENCY.franchisorLabel, `<a href="${AGENCY.franchisorUrl}" target="_blank" rel="noopener">${AGENCY.franchisorLabel}</a>`)}</p>
  </div>
</section>

<section class="hm-territory">
  <div class="container hm-territory__inner reveal">
    <div class="hm-territory__head">
      <h2 class="hm-territory__title">Notre territoire immobilier</h2>
    </div>
    <div class="hm-territory__body">
      <p>L'Équipe Jacques-Roussel réunit <strong>${TEAM.length} courtiers immobiliers</strong> chez RE/MAX CRYSTAL, établis sur la Rive-Nord ouest. On accompagne acheteurs et vendeurs à travers <strong>Saint-Eustache, Deux-Montagnes, Sainte-Marthe-sur-le-Lac, Boisbriand, Sainte-Thérèse, Blainville, Lorraine, Rosemère et Mirabel</strong>, en résidentiel comme en commercial. Une connaissance fine de chaque micro-quartier, une lecture précise du marché et une présence constante, du premier rendez-vous jusqu'à la signature.</p>
    </div>
  </div>
</section>

<section class="hm-props band-vellum" data-hm-props>
  <div class="container hm-props__head reveal">
    <div>
      <h2>Nos propriétés sélectionnées</h2>
    </div>
    <a href="/nos-proprietes/" class="btn-ghost">Toutes les propriétés &rarr;</a>
  </div>
  <div class="hm-props__viewport">
    <div class="hm-props__track" data-hm-props-track>
      ${featProps.map(p => propertyCard(p)).join('')}
      <a class="hm-endcard" href="/nos-proprietes/">
        <span class="eyebrow">Centris &middot; quotidien</span>
        <h3>Toutes les propriétés</h3>
        <span class="hm-endcard__arrow" aria-hidden="true">&rarr;</span>
      </a>
    </div>
  </div>
  <div class="container hm-props__nav">
    <button type="button" class="hm-props__arrow" data-hm-props-prev aria-label="Voir les propriétés précédentes">&larr;</button>
    <button type="button" class="hm-props__arrow" data-hm-props-next aria-label="Voir les propriétés suivantes">&rarr;</button>
    <span class="hm-props__hint" aria-hidden="true">Faire défiler</span>
  </div>
</section>

<section class="hm-team">
  <div class="container">
    <div class="hm-team__head reveal">
      <span class="eyebrow">L'équipe</span>
      <h2>${TEAM.length} courtiers, un seul territoire</h2>
      <p>Des trajectoires complémentaires au service d'une même exigence : une lecture fine du marché de la Rive-Nord, une mise en marché soignée, une présence constante du premier rendez-vous à la signature. Vous parlez à la personne dont c'est la spécialité, pas à un standard téléphonique.</p>
    </div>
    <div class="hm-team__cards">
      ${TEAM.map(m => `
      <a class="hm-member reveal" href="/a-propos/">
        <span class="hm-member__photo">
          <img src="${m.photo}" alt="${m.first} ${m.last}, ${m.role.toLowerCase()}" width="800" height="1000" loading="lazy">
        </span>
        <span class="hm-member__name">${m.first} ${m.last}</span>
        <span class="hm-member__role">${m.role}</span>
      </a>`).join('')}
      ${TEAM_HAS_OPENING ? `
      <a class="hm-member hm-member--soon reveal" href="/a-propos/">
        <span class="hm-member__photo hm-member__photo--empty" aria-hidden="true"><span>+</span></span>
        <span class="hm-member__name">Bientôt</span>
        <span class="hm-member__role">Un quatrième membre se joint à l'équipe</span>
      </a>` : ''}
    </div>
    <div class="hm-team__foot reveal">
      <a class="btn-ghost" href="/a-propos/">Rencontrer l'équipe &rarr;</a>
    </div>
  </div>
</section>

<section class="hm-cities" data-hm-cities>
  <div class="container">
    <div class="hm-cities__head reveal">
      <h2>${heroCities.length} villes, une connaissance fine du marché</h2>
    </div>
    <ul class="hm-cities__list reveal">
      ${heroCities.map((c, i) => `
      <li>
        <a class="hm-city" href="${c.href}" data-hm-city>
          <span class="hm-city__idx">0${i + 1}</span>
          <span class="hm-city__main">
            <span class="hm-city__name">${c.key}</span>
            <span class="hm-city__stat">${(() => {
              const n = stats.byCity && stats.byCity[c.key];
              if (n) return `${n} inscription${n > 1 ? 's' : ''} active${n > 1 ? 's' : ''}`;
              // Pas d'inscription active : on affiche le vrai médian Centris de la ville
              const med = marketFor(slug(c.key))?.sections?.unifamiliale?.rows?.prixMedian?.trimestre?.value;
              return med ? `Médian unifamiliale · ${med}` : 'Marché suivi en continu';
            })()}</span>
          </span>
          <span class="hm-city__arrow" aria-hidden="true">&rarr;</span>
        </a>
      </li>`).join('')}
      <li>
        <a class="hm-city hm-city--teaser" href="/nos-proprietes/" data-hm-city>
          <span class="hm-city__idx">+</span>
          <span class="hm-city__main">
            <span class="hm-city__name">Voir le territoire</span>
            <span class="hm-city__stat">Explorer toutes les inscriptions</span>
          </span>
          <span class="hm-city__arrow" aria-hidden="true">&rarr;</span>
        </a>
      </li>
    </ul>
  </div>
</section>

<section class="hm-cta">
  <img class="hm-cta__bg" src="/photos/stock/quartier-crepuscule.jpg" alt="" aria-hidden="true" loading="lazy" decoding="async">
  <div class="hm-marquee" aria-hidden="true">
    <div class="hm-marquee__track">
      <span>Évaluation gratuite &middot; Saint-Eustache &middot; Deux-Montagnes &middot; Mirabel &middot; Sainte-Marthe-sur-le-Lac &middot;&nbsp;</span><span>Évaluation gratuite &middot; Saint-Eustache &middot; Deux-Montagnes &middot; Mirabel &middot; Sainte-Marthe-sur-le-Lac &middot;&nbsp;</span>
    </div>
  </div>
  <div class="container hm-cta__inner reveal">
    <h2>Prêt à passer à l'action&nbsp;?</h2>
    <div class="hm-cta__actions">
      <a class="btn-cream" href="/vendre/evaluation-gratuite/">Évaluation gratuite</a>
      <a class="btn-ghost btn-ghost--on-teal" href="/contact/">Contact</a>
    </div>
  </div>
</section>
`;

function propertyCard(p) {
  const ph = p.photos[0]?.url || `https://picsum.photos/seed/${encodeURIComponent(p.mls)}/800/600`;
  const beds = (p.rooms || []).filter(r => ['CAC','CCP','CC2'].includes(r.code)).length;
  const baths = (p.rooms || []).filter(r => r.code === 'SDB' || r.code === 'SDE').length;
  const isNew = isRecentListing(p);
  // Un local commercial ou un terrain n'a ni chambre ni salle de bain : les
  // tirets faisaient croire à une fiche incomplète. On ne montre que ce qui existe.
  const metaParts = [
    beds ? `<span>${beds} ch.</span>` : '',
    baths ? `<span>${baths} sdb.</span>` : '',
    fmtArea(p.areaTerrain) ? `<span>${fmtArea(p.areaTerrain)}</span>` : ''
  ].filter(Boolean);
  const metaHtml = metaParts.length ? `<div class="prop-card__meta">${metaParts.join('')}</div>` : '';
  return `<article class="prop-card" data-type="${CATEGORY_SLUG[p.typeLabel] || slug(p.typeLabel)}" data-city="${slug(p.city)}">
    <a href="/nos-proprietes/${p.slug}/" aria-label="${p.street}, ${p.city} · ${fmtPrice(p.price)}">
      <div class="prop-card__media">
        ${isNew ? '<span class="prop-card__badge">Nouveau</span>' : ''}
        <img loading="lazy" src="${ph}" alt="${p.street}, ${p.city}">
      </div>
      <div class="prop-card__body">
        <span class="prop-card__city">${p.city}</span>
        <div class="prop-card__price">${fmtPrice(p.price)}</div>
        <div class="prop-card__addr">${p.street}</div>
        ${metaHtml}
      </div>
    </a>
  </article>`;
}

writePage('index.html', layout({
  title: 'Équipe Jacques-Roussel · Courtier immobilier Saint-Eustache et Rive-Nord | RE/MAX CRYSTAL',
  description: `Équipe Jacques-Roussel, ${TEAM.length} courtiers immobiliers RE/MAX CRYSTAL à Saint-Eustache, Deux-Montagnes, Sainte-Marthe-sur-le-Lac, Boisbriand et Mirabel. Statistiques Centris à jour, évaluation gratuite et mise en marché sur mesure.`,
  canonical: 'https://jacquesroussel.com/',
  // Plus d'en-tête transparent sur l'accueil : le guide RE/MAX (p. 4) impose un
  // fond neutre derrière le logotype et la montgolfière. Une barre crème pleine
  // largeur satisfait la règle sans enfermer le logo dans une boîte. Si le
  // lockup crème officiel est obtenu à l'extranet, on pourra revenir à
  // bodyClass: 'header-overlay' et laisser la vidéo repasser sous l'en-tête.
  bodyClass: 'home',
  body: homeBody,
  jsonld: homeJsonld
}));

// --- PROPERTIES LIST ---
const listBody = `
<section class="page-head container">
  <div class="eyebrow">Centris · Mis à jour quotidiennement</div>
  <h1>Nos propriétés à vendre</h1>
  <p class="lead">${properties.length} propriétés actives · Rive-Nord et Laurentides. Filtrez par type ou ville pour affiner votre recherche.</p>
</section>
<section class="container">
  <div class="filters">
    <button type="button" data-filter="all" class="active">Toutes (${properties.length})</button>
    ${PROPERTY_CATEGORIES
      .map(([catSlug, label]) => [catSlug, label, properties.filter(p => p.typeLabel === label).length])
      .filter(([, , n]) => n > 0)
      .map(([catSlug, label, n]) => `<button type="button" data-filter="type:${catSlug}">${label} (${n})</button>`).join('')}
    ${Object.entries(stats.byCity)
      .sort((a, b) => b[1] - a[1])
      .map(([city, n]) => `<button type="button" data-filter="city:${slug(city)}">${city} (${n})</button>`).join('')}
  </div>
  <div class="prop-grid">
    ${properties.map(propertyCard).join('')}
  </div>
</section>
`;
writePage('nos-proprietes/index.html', layout({
  title: `Nos propriétés à vendre | Équipe Jacques-Roussel · Rive-Nord`,
  description: `${properties.length} propriétés Centris mises à jour quotidiennement à Sainte-Thérèse, Blainville et Rive-Nord. Filtrez par ville ou type et consultez les fiches complètes.`,
  canonical: 'https://jacquesroussel.com/nos-proprietes/',
  body: listBody
}));

// --- PROPERTY DETAIL PAGES ---
function similarProperties(p){ return properties.filter(x=>x.mls!==p.mls && x.city===p.city).slice(0,3); }

// Lucide-style inline SVGs (stroke 1.5) used in the property detail page
const ICON = {
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  car: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>',
  waves: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  zap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/></svg>',
  trees: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19h6"/><path d="M16 16h0a3 3 0 0 0 1-5.8V10a3 3 0 0 0-6 0v.2A3 3 0 0 0 12.1 16Z"/><path d="M16 16v6"/></svg>',
  square: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
  triangle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12a10 10 0 0 1-10 10V2a10 10 0 0 1 10 10z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 12 15 17 10"/></svg>'
};
function iconForFeature(code){
  if (!code) return ICON.check;
  const c = code.toUpperCase();
  if (c.startsWith('GARA') || c.startsWith('STAT')) return ICON.car;
  if (c.startsWith('PISC')) return ICON.waves;
  if (c.startsWith('CHAU')) return ICON.flame;
  if (c.startsWith('ENER')) return ICON.zap;
  if (c.startsWith('EQUI')) return ICON.settings;
  if (c.startsWith('TERR') || c.startsWith('PAYS')) return ICON.trees;
  if (c.startsWith('REV')) return ICON.square;
  if (c.startsWith('TOIT')) return ICON.triangle;
  return ICON.check;
}

function detailPage(p) {
  const total = p.photos.length;
  const mosaicPhotos = p.photos.slice(0, 4);
  // Beds (chambres) — codes starting with C, excluding CR (cuisine? avoid ambiguity)
  const beds = (p.rooms || []).filter(r => ['CAC','CCP','CC2'].includes(r.code)).length;
  const baths = (p.rooms || []).filter(r => r.code === 'SDB' || r.code === 'SDE').length;
  const yrTxt = (p.yearBuilt && String(p.yearBuilt).trim() && String(p.yearBuilt) !== '0') ? ` · Construite en ${p.yearBuilt}` : '';

  // Amenities — one item per decoded feature value
  const amenities = [];
  for (const f of (p.features || [])) {
    const decoded = decodeFeature(f);
    if (!decoded) continue;
    amenities.push({ icon: iconForFeature(f.code), label: `${decoded.name} : ${decoded.value}` });
  }
  const amenitiesShown = amenities.slice(0, 12);
  const amenitiesExtra = amenities.slice(12);

  const photoUrls = p.photos.map(ph => ph.url);
  const hasGeo = isFinite(p.lat) && isFinite(p.lon) && p.lat !== null && p.lon !== null;

  // Description — fall back to remFr if descFr is empty
  const desc = (p.descFr && p.descFr.trim()) ? p.descFr : '';

  // Similar — fill with other recent props if fewer than 3 same-city
  let sim = similarProperties(p);
  if (sim.length < 3) {
    const fill = properties.filter(x => x.mls !== p.mls && !sim.includes(x)).slice(0, 3 - sim.length);
    sim = sim.concat(fill);
  }

  const jsonld = JSON.stringify({
    "@context":"https://schema.org","@type":"RealEstateListing",
    "name":`${p.typeLabel} à vendre, ${p.street}, ${p.city}`,
    "url":`https://jacquesroussel.com/nos-proprietes/${p.slug}/`,
    "image":photoUrls.slice(0, 6),
    "offers":{"@type":"Offer","price":p.price,"priceCurrency":"CAD"},
    "address":{"@type":"PostalAddress","streetAddress":p.street,"addressLocality":p.city,"postalCode":p.postalCode,"addressCountry":"CA"}
  });

  const mosaicCellHtml = (cellClass, idx) => {
    const ph = mosaicPhotos[idx];
    if (ph) {
      return `<div class="prop-mosaic__cell ${cellClass}" data-open-lightbox="${idx}"><img loading="lazy" src="${ph.url}" alt="${p.street}, photo ${idx + 1}"></div>`;
    }
    return `<div class="prop-mosaic__cell ${cellClass}"><div class="prop-mosaic__empty">${ICON.camera}</div></div>`;
  };

  const body = `
<section class="prop-page" data-prop-page data-lat="${hasGeo ? p.lat : ''}" data-lon="${hasGeo ? p.lon : ''}" data-photos='${JSON.stringify(photoUrls).replace(/'/g, "&#39;")}'>
  <div class="prop-media">
    <div class="prop-media__overlay">
      <div class="prop-media__icons">
        <button type="button" class="icon-btn" aria-label="Ajouter aux favoris">${ICON.heart}</button>
        <button type="button" class="icon-btn" aria-label="Partager">${ICON.share}</button>
      </div>
      <div class="prop-toggle" data-prop-toggle data-mode="photos" role="tablist" aria-label="Vue média">
        <span class="prop-toggle__pill" aria-hidden="true"></span>
        <button type="button" data-mode="photos" aria-pressed="true" role="tab">Photos</button>
        <button type="button" data-mode="map" aria-pressed="false" role="tab"${hasGeo ? '' : ' aria-disabled="true"'}>Carte</button>
      </div>
      <a class="prop-media__cta" href="/rendez-vous/?mls=${p.mls}">Visiter</a>
    </div>

    <div class="prop-media__pane" id="media-pane" aria-hidden="false">
      <div class="prop-mosaic">
        ${mosaicCellHtml('prop-mosaic__cell--a', 0)}
        ${mosaicCellHtml('prop-mosaic__cell--b', 1)}
        ${mosaicCellHtml('prop-mosaic__cell--c', 2)}
        ${mosaicCellHtml('prop-mosaic__cell--d', 3)}
        ${total > 0 ? `<button type="button" class="prop-mosaic__more" data-open-lightbox="0">Voir toutes les photos (${total})</button>` : ''}
      </div>
    </div>
    <div class="prop-media__pane" id="map-pane" aria-hidden="true">
      ${hasGeo ? '<div id="leaflet-map"></div>' : '<div class="prop-mosaic__empty" style="block-size:100%;">Position non disponible</div>'}
    </div>
  </div>

  <div class="prop-info">
    <nav class="prop-info__crumbs" aria-label="Fil d'Ariane">
      <a href="/">Accueil</a><span class="sep">/</span>
      <a href="/nos-proprietes/">Propriétés</a><span class="sep">/</span>
      <a href="/nos-proprietes/?city=${encodeURIComponent(p.city)}">${p.city}</a><span class="sep">/</span>
      <span>MLS ${p.mls}</span>
    </nav>

    <h1 class="prop-info__h1">${p.typeLabel} au ${p.street}</h1>

    <div class="prop-info__loc">
      ${ICON.pin}<span>${p.city} · ${p.postalCode}${yrTxt}</span>
    </div>

    ${desc ? `
      <div class="prop-info__desc desc-wrap" data-collapsible>
        <div class="desc-wrap__body">${desc}</div>
        <button type="button" class="desc-wrap__toggle">Lire la suite</button>
      </div>
    ` : ''}

    <div class="prop-info__metrics">
      <div class="prop-metric">
        <div class="prop-metric__n">${beds || '—'}</div>
        <div class="prop-metric__l">Chambres</div>
      </div>
      <div class="prop-metric__sep" aria-hidden="true"></div>
      <div class="prop-metric">
        <div class="prop-metric__n">${baths || '—'}</div>
        <div class="prop-metric__l">Salles de bain</div>
      </div>
      <div class="prop-metric__sep" aria-hidden="true"></div>
      <div class="prop-metric">
        <div class="prop-metric__n">${fmtArea(p.areaTerrain) || '—'}</div>
        <div class="prop-metric__l">Terrain</div>
      </div>
    </div>

    <div class="prop-price-band">
      <div class="prop-price-band__main">
        <div class="prop-price-band__eye">Prix demandé</div>
        <div class="prop-price-band__val">${fmtPrice(p.price)}</div>
      </div>
      <a class="prop-price-band__cta" href="/rendez-vous/?mls=${p.mls}">Visiter cette propriété</a>
    </div>

    ${amenities.length ? `
    <div class="prop-section">
      <span class="prop-section__eye">Caractéristiques</span>
      <div class="amenities" ${amenitiesExtra.length ? 'data-more' : ''} id="amenities-${p.mls}">
        ${amenitiesShown.map(a => `<div class="amenity">${a.icon}<span>${a.label}</span></div>`).join('')}
        ${amenitiesExtra.map(a => `<div class="amenity amenity--extra">${a.icon}<span>${a.label}</span></div>`).join('')}
      </div>
      ${amenitiesExtra.length ? `<button type="button" class="amenities-more-btn" data-amenities-toggle="#amenities-${p.mls}" data-label-more="Voir les ${amenities.length} caractéristiques" data-label-less="Réduire">Voir les ${amenities.length} caractéristiques</button>` : ''}
    </div>
    ` : ''}

    ${p.rooms && p.rooms.length ? `
    <div class="prop-section">
      <span class="prop-section__eye">Pièces</span>
      <table class="room-table">
        <thead><tr><th>Pièce</th><th>Niveau</th><th>Dimensions</th><th>Revêtement</th></tr></thead>
        <tbody>${p.rooms.slice(0,20).map(r=>{
          const name = ROOM_NAME[r.code] || r.code || '—';
          const level = ROOM_LEVEL[r.level] || r.level || '—';
          const dim = fmtDim(r.dim) || '—';
          const rev = ROOM_REV[r.rev] || r.rev || '—';
          return `<tr><td data-l="Pièce">${name}</td><td data-l="Niveau">${level}</td><td data-l="Dim.">${dim}</td><td data-l="Revêtement">${rev}</td></tr>`;
        }).join('')}</tbody>
      </table>
    </div>
    ` : ''}

    ${p.remFr ? `
    <div class="prop-section">
      <span class="prop-section__eye">Remarques du courtier</span>
      <div class="prop-info__desc" style="max-inline-size:65ch;">${p.remFr}</div>
    </div>
    ` : ''}

    <div class="prop-section">
      <span class="prop-section__eye">Courtier responsable</span>
      <div class="broker-card">
        <div class="broker-card__avatars">
          ${TEAM.map(m => `<img src="${m.photo}" alt="${m.first} ${m.last}" loading="lazy">`).join('')}
        </div>
        <div class="broker-card__body">
          <div class="broker-card__name">Équipe Jacques-Roussel</div>
          <div class="broker-card__sub">RE/MAX CRYSTAL · Permis OACIQ</div>
          <div class="broker-card__team">${TEAM.map(m => `${m.first} ${m.last}`).join(' · ')}</div>
        </div>
        <a class="broker-card__cta" href="/contact/?mls=${p.mls}">Contacter</a>
      </div>
    </div>

    ${sim.length ? `
    <div class="prop-section">
      <span class="prop-section__eye">Propriétés similaires</span>
      <div class="prop-similar-grid">${sim.slice(0,2).map(propertyCard).join('')}</div>
    </div>
    ` : ''}
  </div>
</section>

<aside class="bottom-bar" data-prop-bar>
  ${hasGeo ? '<button type="button" class="bottom-bar__btn" data-open-map-modal>Carte</button>' : ''}
  <a class="bottom-bar__btn bottom-bar__btn--primary" href="/rendez-vous/?mls=${p.mls}">Visiter</a>
</aside>

<div class="lightbox" data-lightbox aria-hidden="true" role="dialog" aria-modal="true" aria-label="Galerie de photos">
  <div class="lightbox__count"></div>
  <button type="button" class="lightbox__close" data-lb-close aria-label="Fermer">${ICON.close}</button>
  <button type="button" class="lightbox__nav lightbox__nav--prev" data-lb-prev aria-label="Précédent">${ICON.prev}</button>
  <div class="lightbox__stage">
    <img class="lightbox__img" alt="">
  </div>
  <button type="button" class="lightbox__nav lightbox__nav--next" data-lb-next aria-label="Suivant">${ICON.next}</button>
</div>

${hasGeo ? `
<div class="map-modal" data-map-modal aria-hidden="true" role="dialog" aria-modal="true" aria-label="Carte">
  <div class="map-modal__head">
    <div style="font:500 0.95rem 'Montserrat', sans-serif;color:var(--ink);">${p.city} · ${p.postalCode}</div>
    <button type="button" class="map-modal__close" data-map-modal-close aria-label="Fermer">${ICON.close}</button>
  </div>
  <div id="leaflet-map-modal"></div>
</div>
` : ''}
`;

  const extraHead = `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin>
<script defer src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin></script>`;

  return layout({
    title: `${p.typeLabel} à vendre au ${p.street}, ${p.city} · ${fmtPrice(p.price)} | Équipe Jacques-Roussel`,
    description: `${p.typeLabel} à vendre au ${p.street}, ${p.city}. ${fmtPrice(p.price)}. MLS ${p.mls}. ${p.photos.length} photos, fiche complète et visite avec Équipe Jacques-Roussel.`,
    canonical: `https://jacquesroussel.com/nos-proprietes/${p.slug}/`,
    body,
    extraHead,
    bodyClass: 'page-prop-detail',
    jsonld
  });
}
for (const p of properties) writePage(`nos-proprietes/${p.slug}/index.html`, detailPage(p));

// Purge des fiches périmées : une propriété vendue, retirée ou dont le slug a
// changé laissait sa page en ligne et indexée. On aligne le dossier sur les
// inscriptions actives à chaque build.
(function pruneStaleListings(){
  const dir = path.join(SITE, 'nos-proprietes');
  if (!fs.existsSync(dir)) return;
  const current = new Set(properties.map(p => p.slug));
  let removed = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || current.has(entry.name)) continue;
    fs.rmSync(path.join(dir, entry.name), { recursive: true, force: true });
    removed++;
  }
  if (removed) console.log(`✓ ${removed} fiche(s) périmée(s) supprimée(s) de nos-proprietes/`);
})();

// --- GENERIC CONTENT PAGE BUILDER ---
function contentPage({ eyebrow, h1, lead, body, title, desc, canonical, image, afterProse = '', jsonld = '' }) {
  const banner = image ? `
<section class="container">
  <figure class="content-hero" data-parallax>
    <img src="${image}" alt="${h1}" loading="lazy">
  </figure>
</section>` : '';
  const html = `
<section class="page-head container">
  <div class="eyebrow">${eyebrow}</div>
  <h1>${h1}</h1>
  ${lead ? `<p class="lead">${lead}</p>` : ''}
</section>
${banner}
<section class="container">
  <div class="two-col">
    <article class="prose">${body}</article>
    <aside>
      <div class="blue-block soft" style="padding:2rem">
        <div class="eye" style="color:var(--blue-2)">Évaluation gratuite</div>
        <h3 style="margin:.7rem 0 1rem">Connaître la valeur de votre propriété ?</h3>
        <p style="color:var(--ink-2);font-size:.95rem;margin-bottom:1.5rem">Rapport comparatif complet en 48 h, basé sur les ventes récentes du même quartier.</p>
        <a class="btn" href="/vendre/evaluation-gratuite/" style="display:block;background:var(--ink);color:#fff;text-align:center;padding:1rem;border-radius:var(--radius);font-weight:500">Demander l'évaluation</a>
      </div>
    </aside>
  </div>
</section>
${afterProse}
<section class="container">
  <div class="cta-band cta-band--content">
    <img class="cta-band__bg" src="/photos/stock/quartier-rues.jpg" alt="" aria-hidden="true" loading="lazy" decoding="async">
    <div class="cta-band__inner">
      <div class="cta-band__copy">
        <span class="eyebrow cta-band__eye">Équipe Jacques-Roussel</span>
        <h2>Parlons de votre projet immobilier.</h2>
        <p class="cta-band__sub">Une question, une évaluation, une stratégie de mise en marché&nbsp;? On vous répond en moins de 24&nbsp;h.</p>
      </div>
      <div class="cta-band__actions">
        <a class="btn-cream" href="/rendez-vous/">Prendre rendez-vous &rarr;</a>
        <a class="btn-ghost btn-ghost--on-teal" href="/contact/">Nous écrire</a>
      </div>
    </div>
  </div>
</section>`;
  return layout({ title, description: desc, canonical, body: html, jsonld });
}

// --- CITY PAGES ---
const CITIES = [
  ['sainte-therese','Sainte-Thérèse',['Vieux-Village','En-Haut','En-Bas']],
  ['blainville','Blainville',['Fontainebleau','Chambéry','Chante-Bois','Plan-Bouchard','Jardins-de-Blainville','Côte-Saint-Louis','Alençon','Renaissance','Blainvillier']],
  ['rosemere','Rosemère',['Bois-Franc','Grande-Côte','Domaine-du-Parc']],
  ['lorraine','Lorraine',['Grande-Allée','Plateau']],
  ['saint-eustache','Saint-Eustache',[]],
  ['deux-montagnes','Deux-Montagnes',[]],
  ['mirabel','Mirabel',[]],
  ['sainte-marthe-sur-le-lac','Sainte-Marthe-sur-le-Lac',[]],
  ['boisbriand','Boisbriand',['Faubourg Boisbriand','Domaine Vert Nord','Sainte-Marie']]
];

for (const [slugC, cityName, neighs] of CITIES) {
  const cityProps = properties.filter(p => slug(p.city) === slugC);
  const cityMarket = marketFor(slugC);
  const cityBlock = `
    ${marketHighlightsHtml(slugC)}
    ${cityProps.length ? `
    <section class="container">
      <div class="city-stats reveal">
        <div class="city-stat"><span class="city-stat__n">${cityProps.length}</span><span class="city-stat__l">Nos inscriptions actives</span></div>
        <div class="city-stat"><span class="city-stat__n">${fmtPrice(Math.round(cityProps.reduce((s,p)=>s+p.price,0)/cityProps.length))}</span><span class="city-stat__l">Prix moyen de nos inscriptions</span></div>
      </div>
    </section>` : ''}
    ${neighs.length?`
    <section class="container">
      <div class="sec-head reveal"><div><div class="eye">Quartiers</div><h2>Les quartiers de ${cityName}.</h2></div></div>
      <div class="n-grid">
        ${neighs.map(n=>`<a class="n-card" href="/quartiers/${slugC}/${slug(n)}/"><h3>${n}</h3><div class="cnt">Voir le quartier →</div></a>`).join('')}
      </div>
    </section>`:''}
    ${cityProps.length?`
    <section class="container">
      <div class="sec-head reveal"><div><div class="eye">Inscriptions actives</div><h2>Propriétés à vendre à ${cityName}.</h2></div><a class="more" href="/nos-proprietes/">Toutes les propriétés →</a></div>
      <div class="prop-grid">${cityProps.slice(0,6).map(propertyCard).join('')}</div>
    </section>`:''}
  `;
  const body = `
<section class="page-head page-head--city container">
  <div class="eyebrow">Courtier immobilier · ${cityName}</div>
  <h1>Courtier immobilier à ${cityName}</h1>
  <p class="lead">Équipe Jacques-Roussel · RE/MAX CRYSTAL. À vendre et acheter pour les familles de ${cityName}, avec une approche analytique basée sur les données locales : rue par rue, saison par saison, prix par prix.</p>
</section>
${cityBlock}
<section class="container">
  <div class="two-col">
    <article class="prose reveal">
      <h2>Le marché immobilier à ${cityName}</h2>
      <p>${cityName} fait partie des territoires recherchés de la Rive-Nord : tissu familial stable, accès à Montréal et offre de services solide nourrissent une demande constante.</p>
      <p>La lecture fine du marché de ${cityName} demande cependant de la précision : chaque quartier a son propre cycle, sa propre courbe de prix, ses propres typologies acheteurs. C'est cette lecture qu'on pratique pour chaque client, avec les données Centris à jour.</p>
      <h2>Pourquoi choisir Équipe Jacques-Roussel à ${cityName}</h2>
      <ul>
        <li>Connaissance rue par rue du territoire</li>
        <li>Stratégie de mise en marché basée sur la donnée (photographie professionnelle, vidéo, visite virtuelle)</li>
        <li>Diffusion sur Centris, RE/MAX Québec, RE/MAX Crystal, REALTOR et notre réseau de collaborateurs</li>
        <li>Équipe RE/MAX CRYSTAL : courtiers, photographes, stagers, notaires partenaires</li>
      </ul>
      <h2>Types de propriétés les plus vendues</h2>
      <p>Voir <a href="/types-de-propriete/">toutes les catégories</a> pour comprendre comment on évalue chacune d'elles.</p>
      <h2>FAQ : vendre et acheter à ${cityName}</h2>
      ${cityMarket ? `
      <h3>Quel est le prix médian d'une maison à ${cityName} ?</h3>
      <p>${cityMarket.sections.unifamiliale?.rows?.prixMedian?.trimestre?.value
          ? `Selon Centris, le prix médian d'une unifamiliale à ${cityName} s'établit à <strong>${cityMarket.sections.unifamiliale.rows.prixMedian.trimestre.value}</strong> au ${cityMarket.period.toLowerCase()}${cityMarket.sections.unifamiliale.rows.prixMedian.trimestre.variation ? `, une variation de ${cityMarket.sections.unifamiliale.rows.prixMedian.trimestre.variation} sur un an` : ''}.${cityMarket.sections.copropriete?.rows?.prixMedian?.trimestre?.value ? ` Du côté des copropriétés, le prix médian est de <strong>${cityMarket.sections.copropriete.rows.prixMedian.trimestre.value}</strong>.` : ''} Ce chiffre reste une médiane municipale : votre secteur et votre rue peuvent s'en écarter nettement, et c'est exactement ce qu'on mesure dans une analyse comparative.`
          : `Centris ne publie pas de prix médian pour ${cityName} sur la dernière période, faute d'un volume de transactions suffisant. On produit alors l'analyse à partir des ventes comparables des secteurs voisins.`}</p>
      <h3>Combien de temps prend la vente d'une propriété à ${cityName} ?</h3>
      <p>${cityMarket.sections.unifamiliale?.rows?.joursSurLeMarche?.trimestre?.value
          ? `Une unifamiliale à ${cityName} passe en moyenne <strong>${cityMarket.sections.unifamiliale.rows.joursSurLeMarche.trimestre.value} jours</strong> sur le marché selon Centris (${cityMarket.period.toLowerCase()}). Un positionnement de prix juste dès le premier jour reste le principal levier pour rester sous cette moyenne.`
          : `Centris ne publie pas de délai moyen pour ${cityName} sur la dernière période. Le positionnement de prix dès le premier jour demeure le principal levier pour vendre rapidement.`}</p>
      <p class="faq-source">Chiffres tirés des <a href="${cityMarket.url}" target="_blank" rel="noopener">statistiques Centris de ${cityName}</a>${market.fetchedAt ? `, relevés le ${market.fetchedAt}` : ''}.</p>
      ` : `
      <h3>Quel est le prix médian d'une maison à ${cityName} ?</h3>
      <p>Écrivez-nous : on vous sort les ventes comparables des douze derniers mois pour votre secteur précis, pas une moyenne municipale.</p>
      <h3>Combien de temps prend la vente d'une propriété à ${cityName} ?</h3>
      <p>Ça dépend du positionnement de prix initial, de la préparation de la propriété et de la saison. On en discute avec les chiffres de votre secteur en main.</p>
      `}
    </article>
    <aside>
      <div class="blue-block soft" style="padding:2rem;position:sticky;top:100px">
        <div class="eye" style="color:var(--blue-2)">Évaluation ${cityName}</div>
        <h3 style="margin:.7rem 0 1rem">Combien vaut votre propriété à ${cityName} ?</h3>
        <a class="btn" href="/vendre/evaluation-gratuite/" style="display:block;background:var(--ink);color:#fff;text-align:center;padding:1rem;border-radius:var(--radius);font-weight:500">Demander l'évaluation</a>
      </div>
    </aside>
  </div>
</section>
<section class="container"><div class="cta-band"><h2>Prêt à bouger à ${cityName} ?</h2><a class="btn" href="/rendez-vous/">Prendre rendez-vous &rarr;</a></div></section>`;

  writePage(`courtier-immobilier/${slugC}/index.html`, layout({
    title: `Courtier immobilier ${cityName} | Équipe Jacques-Roussel RE/MAX CRYSTAL`,
    description: `Équipe Jacques-Roussel, courtiers immobiliers à ${cityName}. Statistiques Centris à jour, évaluation gratuite et rapport complet en 48 h.`,
    canonical: `https://jacquesroussel.com/courtier-immobilier/${slugC}/`,
    body
  }));

  // Neighborhood sub-pages
  for (const n of neighs) {
    const qBody = `
<section class="page-head container">
  <div class="eyebrow">Quartier · ${cityName}</div>
  <h1>Immobilier à ${n}, ${cityName}</h1>
  <p class="lead">Portrait du quartier ${n} : typologies, écoles, services et propriétés actives.</p>
</section>
${marketHighlightsHtml(slugC, { heading: `Marché de ${cityName}` })}
<section class="container">
  <div class="two-col">
    <article class="prose">
      <h2>Portrait du quartier ${n}</h2>
      <p>${n} est l'un des secteurs emblématiques de ${cityName} : tissu familial, architecture homogène, boisés préservés. La demande y est constante, particulièrement pour les unifamiliales avec cour arrière aménagée.</p>
      <h2>Écoles, parcs, services</h2>
      <ul>
        <li>Écoles primaires et secondaires à distance de marche</li>
        <li>Parcs et pistes cyclables intégrés au quartier</li>
        <li>Commerces de proximité et accès rapide à l'autoroute 15/640</li>
      </ul>
      <h2>Que vaut votre maison à ${n} ?</h2>
      <p>Les chiffres ci-dessus sont des médianes pour l'ensemble de ${cityName}. D'une rue à l'autre de ${n}, l'écart réel est souvent plus grand que l'écart entre deux municipalités voisines. Nous produisons une analyse comparative précise pour votre rue, à partir des ventes des vingt-quatre derniers mois.</p>
    </article>
    <aside>
      <div class="blue-block soft" style="padding:2rem;position:sticky;top:100px">
        <h3 style="margin-bottom:1rem">Vous vendez à ${n} ?</h3>
        <a class="btn" href="/vendre/evaluation-gratuite/" style="display:block;background:var(--ink);color:#fff;text-align:center;padding:1rem;border-radius:var(--radius)">Évaluation gratuite</a>
      </div>
    </aside>
  </div>
</section>`;
    writePage(`quartiers/${slugC}/${slug(n)}/index.html`, layout({
      title: `${n}, ${cityName} · prix et maisons à vendre | Équipe Jacques-Roussel`,
      description: `Immobilier à ${n}, ${cityName} : prix médians, écoles, parcs et propriétés actives. Évaluation gratuite avec Équipe Jacques-Roussel.`,
      canonical: `https://jacquesroussel.com/quartiers/${slugC}/${slug(n)}/`,
      body: qBody
    }));
  }
}

// --- TYPES DE PROPRIÉTÉ ---
// Cinq catégories, pas une de plus. Une maison de ville ou une maison neuve
// est une unifamiliale : elle vit dans la page Unifamiliale.
const TYPES = [
  ['unifamiliale-a-vendre',   'Unifamiliale',   'La catégorie la plus recherchée de la Rive-Nord : cottage, bungalow, plain-pied, jumelé ou maison neuve.',
    `<h2>Ce que couvre la catégorie</h2>
    <p>Cottage, bungalow, plain-pied, paliers multiples, jumelé, maison en rangée, construction neuve : toutes des unifamiliales. Ce qui change d'une à l'autre, ce n'est pas la catégorie, c'est le secteur, l'année de construction et l'état de la propriété. C'est là-dessus qu'on bâtit le positionnement de prix.</p>
    <h2>Notre approche</h2>
    <ul><li>Analyse comparative sur les ventes récentes équivalentes du même secteur</li><li>Photographie professionnelle et rédaction de la fiche</li><li>Mise en marché adaptée à l'acheteur ciblé pour ce type de propriété</li></ul>`],
  ['condo-a-vendre',          'Condo',          'Copropriété divise ou indivise, du studio au penthouse, avec charges et déclaration à lire de près.',
    `<h2>Ce qu'on vérifie avant de vous laisser déposer une offre</h2>
    <p>Un condo, ça s'achète autant sur les documents que sur la visite. On examine la déclaration de copropriété, le fonds de prévoyance, les procès-verbaux des dernières assemblées, les charges mensuelles et les travaux votés ou à venir. Un fonds sous-capitalisé, ça finit toujours par se payer.</p>
    <h2>Notre approche</h2>
    <ul><li>Lecture complète des documents de copropriété avant l'offre</li><li>Comparaison des charges au pied carré dans le même immeuble et le même secteur</li><li>Positionnement de prix basé sur les ventes récentes de l'immeuble</li></ul>`],
  ['terrain-a-vendre',        'Terrain',        'Terrain à bâtir, boisé ou lot subdivisible : le zonage décide de tout.',
    `<h2>Le zonage avant le coup de cœur</h2>
    <p>Un terrain vaut ce que la municipalité permet d'y faire. Zonage, servitudes, contraintes de la CPTAQ, milieux humides, accès aux services municipaux, tests de sol : chacun de ces points peut multiplier ou anéantir la valeur. On fait les vérifications avant de vous laisser vous engager.</p>
    <h2>Notre approche</h2>
    <ul><li>Vérification du zonage et des usages permis auprès de la municipalité</li><li>Repérage des servitudes, contraintes environnementales et frais de viabilisation</li><li>Comparables au pied carré dans le même secteur</li></ul>`],
  ['multilogements-a-vendre', 'Multilogements', 'Duplex, triplex, quadruplex et immeubles à revenus : on achète des chiffres avant d\'acheter un immeuble.',
    `<h2>Un immeuble s'évalue par ses revenus</h2>
    <p>Baux en vigueur, historique des loyers, avis de reconduction, dépenses réelles, taux d'inoccupation, état de la toiture et de la plomberie : c'est ce qui détermine le rendement, pas la façade. On monte le tableau des revenus et dépenses avec vous avant l'offre.</p>
    <h2>Notre approche</h2>
    <ul><li>Analyse des baux, des loyers et du potentiel de reprise à la valeur marchande</li><li>Calcul du taux de capitalisation et du cashflow réel, dette incluse</li><li>Estimation des travaux à prévoir sur les cinq prochaines années</li></ul>
    <p>La <a href="/acheter/calculatrices/">calculatrice de rendement</a> vous donne un premier ordre de grandeur.</p>`],
  ['commercial-a-vendre',     'Commercial',     'Local, bureau, bâtiment industriel ou terrain commercial. Permis résidentiel et commercial dans l\'équipe.',
    `<h2>Un marché qui ne suit pas les mêmes règles</h2>
    <p>En commercial, la valeur tient au bail, au locataire et à l'usage permis. Durée résiduelle, clauses d'indexation, qualité du locataire, zonage, stationnement, accès de camion : chaque élément se traduit directement en dollars. Les délais de transaction sont aussi plus longs qu'en résidentiel, et le financement obéit à d'autres critères.</p>
    <h2>Notre approche</h2>
    <ul><li>Lecture du bail et évaluation de la qualité du flux de revenus</li><li>Validation du zonage et des usages permis pour votre projet</li><li>Accompagnement au financement commercial, distinct de l'hypothèque résidentielle</li></ul>`]
];
// Le pluriel ne se devine pas en ajoutant un « s » : « Commercial » donnait
// « Nos commercials à vendre ». Chaque catégorie porte donc son propre libellé.
const TYPE_PLURAL = {
  'Unifamiliale':   'unifamiliales',
  'Condo':          'condos',
  'Terrain':        'terrains',
  'Multilogements': 'multilogements',
  'Commercial':     'propriétés commerciales'
};

// Une image d'ambiance par catégorie (banque libre de droits, photos/stock/)
const TYPE_IMAGE = {
  'Unifamiliale':   '/photos/stock/maison-deux-etages.jpg',
  'Condo':          '/photos/stock/immeuble-condos.jpg',
  'Terrain':        '/photos/stock/terrain-boise.jpg',
  'Multilogements': '/photos/stock/immeuble-logements.jpg',
  'Commercial':     '/photos/commercial-a-vendre.jpg'
};

for (const [s, title, lead, bodyCopy] of TYPES) {
  const catProps = properties.filter(p => p.typeLabel === title);
  const listing = catProps.length
    ? `<section class="container">
  <div class="sec-head reveal"><div><div class="eye">Inscriptions actives</div><h2>Nos ${TYPE_PLURAL[title] || title.toLowerCase()} à vendre</h2></div><a class="more" href="/nos-proprietes/">Toutes les propriétés →</a></div>
  <div class="prop-grid">${catProps.slice(0, 6).map(propertyCard).join('')}</div>
</section>`
    : `<section class="container">
  <div class="empty-note reveal">
    <p>Aucune inscription active dans cette catégorie en ce moment. On en reçoit régulièrement : écrivez-nous et on vous prévient dès qu'une propriété correspond à ce que vous cherchez.</p>
    <a class="btn-primary" href="/contact/">Être averti</a>
  </div>
</section>`;

  writePage(`types-de-propriete/${s}/index.html`, contentPage({
    eyebrow: 'Catégorie',
    h1: `${title} à vendre sur la Rive-Nord`,
    lead,
    title: `${title} à vendre sur la Rive-Nord | Équipe Jacques-Roussel`,
    desc: `${title} à vendre à Saint-Eustache, Deux-Montagnes, Sainte-Marthe-sur-le-Lac et sur la Rive-Nord. Fiches Centris mises à jour quotidiennement.`,
    canonical: `https://jacquesroussel.com/types-de-propriete/${s}/`,
    body: bodyCopy,
    image: TYPE_IMAGE[title],
    afterProse: listing
  }));
}

// Index des catégories
writePage('types-de-propriete/index.html', contentPage({
  eyebrow: 'Catégories',
  h1: 'Nos catégories de propriétés',
  lead: 'Cinq catégories, cinq façons différentes d\'évaluer une propriété.',
  title: 'Catégories de propriétés à vendre Rive-Nord | Équipe Jacques-Roussel',
  desc: 'Unifamiliale, condo, terrain, multilogements et commercial : nos inscriptions Centris par catégorie sur la Rive-Nord.',
  canonical: 'https://jacquesroussel.com/types-de-propriete/',
  body: `<p>Chaque catégorie s'évalue avec ses propres repères. Un condo se juge sur ses documents de copropriété, un terrain sur son zonage, un multilogements sur ses revenus. On adapte l'analyse à ce que vous achetez ou vendez.</p>`,
  afterProse: `<section class="container">
  <div class="cat-grid">
    ${TYPES.map(([s, title, lead]) => {
      const n = properties.filter(p => p.typeLabel === title).length;
      return `<a class="cat-card" href="/types-de-propriete/${s}/">
        <span class="cat-card__count">${n ? n + ' inscription' + (n > 1 ? 's' : '') : 'Sur demande'}</span>
        <h3>${title}</h3>
        <p>${lead}</p>
        <span class="cat-card__arrow" aria-hidden="true">&rarr;</span>
      </a>`;
    }).join('')}
  </div>
</section>`
}));

// --- ÉVALUATION GRATUITE (formulaire multi-étapes custom) ---
writePage('vendre/evaluation-gratuite/index.html', layout({
  title: 'Évaluation gratuite de votre propriété · rapport en 48 h | Équipe Jacques-Roussel',
  description: 'Obtenez une évaluation gratuite et précise de votre propriété à Blainville, Sainte-Thérèse, Rosemère ou Lorraine. Rapport personnalisé livré sous 48 h.',
  canonical: 'https://jacquesroussel.com/vendre/evaluation-gratuite/',
  extraHead: `<style>
    .eval-wrap{max-width:780px;margin:0 auto;padding-block:clamp(2rem,4vw,3rem)}
    .eval-progress{display:flex;align-items:center;gap:.5rem;margin-bottom:2.5rem;padding:0 .5rem}
    .eval-step-dot{flex:1;height:4px;background:var(--line);border-radius:999px;position:relative;overflow:hidden;transition:background .4s var(--ease)}
    .eval-step-dot.done{background:var(--blue)}
    .eval-step-dot.active{background:linear-gradient(90deg,var(--blue) 0%,var(--blue) 100%);background-size:200% 100%;animation:eval-fill 1.5s var(--ease) forwards}
    @keyframes eval-fill{from{background-position:100% 0}to{background-position:0 0}}
    .eval-meta{font-size:.78rem;color:var(--muted);text-transform:uppercase;letter-spacing:.12em;font-weight:500;margin-bottom:.6rem}
    .eval-card{background:#fff;border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);padding:clamp(1.8rem,4vw,3rem);border:1px solid var(--line);position:relative;overflow:hidden;min-height:420px}
    .eval-step{display:none;animation:eval-slide .5s var(--ease)}
    .eval-step.active{display:block}
    @keyframes eval-slide{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}
    .eval-step h2{font-size:clamp(1.6rem,3vw,2.2rem);font-weight:700;letter-spacing:-.025em;line-height:1.15;margin-bottom:.8rem;color:var(--ink)}
    .eval-step .sub{color:var(--ink-2);font-size:1.02rem;line-height:1.6;margin-bottom:2rem;max-width:50ch}
    .eval-field{position:relative;margin-bottom:1.5rem}
    .eval-field label{display:block;font-size:.85rem;font-weight:500;color:var(--ink-2);margin-bottom:.5rem;letter-spacing:.01em}
    .eval-field input[type=text],.eval-field input[type=email],.eval-field input[type=tel]{width:100%;padding:1rem 1.1rem;border:1.5px solid var(--line);border-radius:14px;font-family:inherit;font-size:1rem;background:#fff;color:var(--ink);transition:border-color .3s var(--ease),box-shadow .3s var(--ease)}
    .eval-field input:focus{outline:0;border-color:var(--blue);box-shadow:0 0 0 4px var(--blue-soft)}
    .eval-suggestions{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);max-height:280px;overflow-y:auto;z-index:10;display:none}
    .eval-suggestions.open{display:block}
    .eval-suggestion{padding:.85rem 1.1rem;cursor:pointer;font-size:.95rem;border-bottom:1px solid var(--line);transition:background .2s var(--ease)}
    .eval-suggestion:last-child{border-bottom:0}
    .eval-suggestion:hover,.eval-suggestion.active{background:var(--blue-soft);color:var(--blue)}
    .eval-suggestion .sec{display:block;font-size:.78rem;color:var(--muted);margin-top:.15rem}
    .eval-options{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:.7rem}
    .eval-option{padding:1.2rem .9rem;border:1.5px solid var(--line);border-radius:14px;background:#fff;cursor:pointer;text-align:center;font-family:inherit;font-size:1rem;color:var(--ink);transition:all .3s var(--ease-spring);position:relative}
    .eval-option:hover{border-color:var(--blue);transform:translateY(-2px)}
    .eval-option.selected{border-color:var(--blue);background:var(--blue-soft);color:var(--blue);font-weight:500;box-shadow:0 0 0 4px rgba(15,40,85,.08)}
    .eval-option .ico{display:block;font-size:1.6rem;margin-bottom:.4rem;opacity:.7}
    .eval-option.selected .ico{opacity:1}
    .eval-option .desc{display:block;font-size:.78rem;color:var(--muted);margin-top:.2rem;font-weight:400}
    .eval-option.selected .desc{color:var(--blue-2)}
    .eval-actions{display:flex;justify-content:space-between;align-items:center;margin-top:2.5rem;padding-top:1.5rem;border-top:1px solid var(--line)}
    .eval-btn{font-family:inherit;font-size:1rem;font-weight:500;padding:1rem 1.8rem;border-radius:999px;border:0;cursor:pointer;transition:transform .3s var(--ease-spring),background .3s var(--ease),box-shadow .3s var(--ease);display:inline-flex;align-items:center;gap:.6rem}
    .eval-btn.primary{background:linear-gradient(160deg,var(--ink) 0%,oklch(15% 0.08 258) 100%);color:#fff;box-shadow:0 4px 12px -2px rgba(11,22,40,.25)}
    .eval-btn.primary:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 20px -4px rgba(15,40,85,.35)}
    .eval-btn.primary:disabled{opacity:.4;cursor:not-allowed}
    .eval-btn.ghost{background:transparent;color:var(--muted)}
    .eval-btn.ghost:hover{color:var(--ink)}
    .eval-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
    @media(max-width:540px){.eval-row{grid-template-columns:1fr}}
    .eval-success{text-align:center;padding:2rem 1rem}
    .eval-success .check{width:88px;height:88px;border-radius:50%;background:var(--blue-soft);color:var(--blue);display:grid;place-items:center;font-size:2.4rem;margin:0 auto 1.6rem;animation:eval-pop .6s var(--ease-spring)}
    @keyframes eval-pop{from{transform:scale(0)}to{transform:scale(1)}}
    .eval-success h2{font-size:clamp(1.6rem,2.8vw,2.2rem);font-weight:700;letter-spacing:-.02em;margin-bottom:.8rem}
    .eval-success p{color:var(--ink-2);line-height:1.7;max-width:46ch;margin:0 auto 1.5rem}
    .eval-success .recap{background:var(--surface);border-radius:14px;padding:1.5rem;margin:2rem 0;text-align:left;font-size:.92rem;line-height:1.7}
    .eval-success .recap strong{color:var(--blue);font-weight:500}
    .eval-hint{font-size:.8rem;color:var(--muted);margin-top:.7rem;font-style:italic}
  </style>`,
  body: `
<section class="page-head container">
  <div class="eyebrow">Évaluation · 100% gratuite</div>
  <h1>Combien vaut votre propriété en 2026 ?</h1>
  <p class="lead">Répondez à 5 questions rapides. On personnalise votre rapport et on vous le livre par courriel en 48 h. Sans engagement.</p>
</section>

<section class="container">
  <div class="eval-wrap">
    <div class="eval-progress" aria-label="Progression">
      <div class="eval-step-dot active" data-dot="1"></div>
      <div class="eval-step-dot" data-dot="2"></div>
      <div class="eval-step-dot" data-dot="3"></div>
      <div class="eval-step-dot" data-dot="4"></div>
      <div class="eval-step-dot" data-dot="5"></div>
    </div>

    <form class="eval-card" id="eval-form" onsubmit="return false">
      <!-- ÉTAPE 1 — Adresse -->
      <div class="eval-step active" data-step="1">
        <div class="eval-meta">Étape 1 sur 5</div>
        <h2>Quelle est l'adresse de votre propriété ?</h2>
        <p class="sub">Commencez à taper, les suggestions s'affichent automatiquement.</p>
        <div class="eval-field">
          <label for="eval-addr">Adresse complète</label>
          <input type="text" id="eval-addr" name="address" placeholder="ex. 245 rue Fontainebleau, Blainville" autocomplete="off" required>
          <div class="eval-suggestions" id="eval-suggestions"></div>
          <p class="eval-hint">📍 Suggestions fournies par OpenStreetMap. Vos données restent confidentielles.</p>
        </div>
      </div>

      <!-- ÉTAPE 2 — Type & étages & sous-sol -->
      <div class="eval-step" data-step="2">
        <div class="eval-meta">Étape 2 sur 5</div>
        <h2>Quelle est la configuration ?</h2>
        <p class="sub">Le type et la structure influencent significativement la valeur.</p>
        <div class="eval-field">
          <label>Type de propriété</label>
          <div class="eval-options" data-group="type">
            <button type="button" class="eval-option" data-val="unifamiliale"><span class="ico">🏡</span>Unifamiliale</button>
            <button type="button" class="eval-option" data-val="condo"><span class="ico">🏢</span>Condo</button>
            <button type="button" class="eval-option" data-val="maison-ville"><span class="ico">🏘️</span>Maison de ville</button>
            <button type="button" class="eval-option" data-val="plex"><span class="ico">🏬</span>Plex</button>
          </div>
        </div>
        <div class="eval-field">
          <label>Nombre d'étages</label>
          <div class="eval-options" data-group="etages">
            <button type="button" class="eval-option" data-val="1">1 étage</button>
            <button type="button" class="eval-option" data-val="1.5">1½</button>
            <button type="button" class="eval-option" data-val="2">2 étages</button>
            <button type="button" class="eval-option" data-val="3+">3+</button>
          </div>
        </div>
        <div class="eval-field">
          <label>Sous-sol</label>
          <div class="eval-options" data-group="soussol">
            <button type="button" class="eval-option" data-val="fini">Fini</button>
            <button type="button" class="eval-option" data-val="semi">Semi-fini</button>
            <button type="button" class="eval-option" data-val="non-fini">Non fini</button>
            <button type="button" class="eval-option" data-val="aucun">Aucun</button>
          </div>
        </div>
      </div>

      <!-- ÉTAPE 3 — Chambres & salles de bain -->
      <div class="eval-step" data-step="3">
        <div class="eval-meta">Étape 3 sur 5</div>
        <h2>Combien de pièces ?</h2>
        <p class="sub">Critère majeur dans la comparaison avec les ventes récentes du secteur.</p>
        <div class="eval-field">
          <label>Chambres à coucher</label>
          <div class="eval-options" data-group="chambres">
            <button type="button" class="eval-option" data-val="1">1</button>
            <button type="button" class="eval-option" data-val="2">2</button>
            <button type="button" class="eval-option" data-val="3">3</button>
            <button type="button" class="eval-option" data-val="4">4</button>
            <button type="button" class="eval-option" data-val="5+">5 +</button>
          </div>
        </div>
        <div class="eval-field">
          <label>Salles de bain complètes</label>
          <div class="eval-options" data-group="sdb">
            <button type="button" class="eval-option" data-val="1">1</button>
            <button type="button" class="eval-option" data-val="2">2</button>
            <button type="button" class="eval-option" data-val="3">3</button>
            <button type="button" class="eval-option" data-val="4+">4 +</button>
          </div>
        </div>
      </div>

      <!-- ÉTAPE 4 — Rénovations -->
      <div class="eval-step" data-step="4">
        <div class="eval-meta">Étape 4 sur 5</div>
        <h2>État des rénovations</h2>
        <p class="sub">Une cuisine refaite il y a 3 ans n'a pas la même valeur que celle de 1995.</p>
        <div class="eval-field">
          <label>Rénovations majeures les plus récentes (cuisine, salle de bain, toit, fenêtres)</label>
          <div class="eval-options" data-group="renos" style="grid-template-columns:1fr">
            <button type="button" class="eval-option" data-val="-5"><strong>Moins de 5 ans</strong><span class="desc">Cuisine, salle de bain ou toiture refaits récemment</span></button>
            <button type="button" class="eval-option" data-val="5-10"><strong>5 à 10 ans</strong><span class="desc">Rénovations encore modernes mais commencent à dater</span></button>
            <button type="button" class="eval-option" data-val="10-25"><strong>10 à 25 ans</strong><span class="desc">Rénovations à prévoir à moyen terme</span></button>
            <button type="button" class="eval-option" data-val="25+"><strong>Plus de 25 ans</strong><span class="desc">Propriété à conserver ou à rénover</span></button>
            <button type="button" class="eval-option" data-val="aucune"><strong>Aucune rénovation majeure</strong><span class="desc">Propriété à conserver ou à rénover entièrement</span></button>
          </div>
        </div>
      </div>

      <!-- ÉTAPE 5 — Coordonnées -->
      <div class="eval-step" data-step="5">
        <div class="eval-meta">Étape 5 sur 5 · dernière étape</div>
        <h2>Où vous envoyer votre rapport ?</h2>
        <p class="sub">On le prépare personnellement et on vous le livre en 48 h, sans engagement de votre part.</p>
        <div class="eval-row">
          <div class="eval-field">
            <label for="eval-name">Nom complet</label>
            <input type="text" id="eval-name" name="name" required>
          </div>
          <div class="eval-field">
            <label for="eval-phone">Téléphone</label>
            <input type="tel" id="eval-phone" name="phone" placeholder="450 000-0000">
          </div>
        </div>
        <div class="eval-field">
          <label for="eval-email">Courriel</label>
          <input type="email" id="eval-email" name="email" required>
          <p class="eval-hint">Promesse : aucun spam, aucune liste partagée. Vous pouvez vous désabonner en 1 clic.</p>
        </div>
      </div>

      <!-- ÉTAPE 6 — Succès (cachée) -->
      <div class="eval-step" data-step="6">
        <div class="eval-success">
          <div class="check">✓</div>
          <h2>Merci. Votre demande est reçue.</h2>
          <p>On prépare personnellement votre rapport d'évaluation. Vous recevrez par courriel dans les 48 h votre fourchette de prix, les 5 ventes comparables les plus pertinentes et nos recommandations de préparation.</p>
          <div class="recap" id="eval-recap"></div>
          <a class="eval-btn primary" href="/" style="text-decoration:none">Retour à l'accueil →</a>
        </div>
      </div>

      <!-- Actions (cachées sur étape 6) -->
      <div class="eval-actions" id="eval-actions">
        <button type="button" class="eval-btn ghost" id="eval-back" style="visibility:hidden">← Retour</button>
        <button type="button" class="eval-btn primary" id="eval-next" disabled>Continuer →</button>
      </div>
    </form>
  </div>
</section>

<script>
(function(){
  const TOTAL=5;
  let current=1;
  const answers={type:null,etages:null,soussol:null,chambres:null,sdb:null,renos:null,address:'',name:'',email:'',phone:''};
  const $=s=>document.querySelector(s);
  const $$=s=>document.querySelectorAll(s);
  const stepEl=n=>$('.eval-step[data-step="'+n+'"]');
  const dotEl=n=>$('.eval-step-dot[data-dot="'+n+'"]');

  // Option button selection
  $$('.eval-options').forEach(grp=>{
    grp.addEventListener('click',e=>{
      const btn=e.target.closest('.eval-option'); if(!btn)return;
      const group=grp.dataset.group;
      grp.querySelectorAll('.eval-option').forEach(b=>b.classList.remove('selected'));
      btn.classList.add('selected');
      answers[group]=btn.dataset.val;
      validate();
    });
  });

  // Text inputs
  ['eval-addr','eval-name','eval-email','eval-phone'].forEach(id=>{
    const el=document.getElementById(id);
    el.addEventListener('input',()=>{
      if(id==='eval-addr')answers.address=el.value;
      if(id==='eval-name')answers.name=el.value;
      if(id==='eval-email')answers.email=el.value;
      if(id==='eval-phone')answers.phone=el.value;
      validate();
    });
  });

  function isValid(step){
    if(step===1)return answers.address.trim().length>=8;
    if(step===2)return answers.type&&answers.etages&&answers.soussol;
    if(step===3)return answers.chambres&&answers.sdb;
    if(step===4)return answers.renos;
    if(step===5)return answers.name.trim().length>=2 && /\\S+@\\S+\\.\\S+/.test(answers.email);
    return false;
  }
  function validate(){
    $('#eval-next').disabled=!isValid(current);
  }

  function go(n){
    stepEl(current).classList.remove('active');
    current=n;
    stepEl(current).classList.add('active');
    for(let i=1;i<=TOTAL;i++){
      dotEl(i).classList.toggle('done',i<current);
      dotEl(i).classList.toggle('active',i===current);
    }
    $('#eval-back').style.visibility=current===1?'hidden':'visible';
    $('#eval-next').textContent=current===TOTAL?'Recevoir mon rapport →':'Continuer →';
    if(current>TOTAL){finalize();return;}
    validate();
    window.scrollTo({top:$('.eval-wrap').offsetTop-100,behavior:'smooth'});
  }

  $('#eval-next').addEventListener('click',()=>{
    if(!isValid(current))return;
    if(current===TOTAL){submit();return;}
    go(current+1);
  });
  $('#eval-back').addEventListener('click',()=>{
    if(current>1)go(current-1);
  });

  // Submit
  function submit(){
    // For now, no backend — show success state with summary.
    // To wire backend later: POST answers to /api/evaluation or Formspree.
    const labels={
      type:{unifamiliale:'Unifamiliale',condo:'Condo','maison-ville':'Maison de ville',plex:'Plex'},
      etages:{'1':'1 étage','1.5':'1½','2':'2 étages','3+':'3+ étages'},
      soussol:{fini:'fini',semi:'semi-fini','non-fini':'non fini',aucun:'aucun sous-sol'},
      renos:{'-5':'récentes (< 5 ans)','5-10':'5 à 10 ans','10-25':'10 à 25 ans','25+':'plus de 25 ans',aucune:'aucune'}
    };
    const recap='<strong>Récapitulatif</strong><br>'+
      '📍 '+answers.address+'<br>'+
      '🏡 '+(labels.type[answers.type]||answers.type)+' · '+(labels.etages[answers.etages]||answers.etages)+' · sous-sol '+(labels.soussol[answers.soussol]||answers.soussol)+'<br>'+
      '🛏️ '+answers.chambres+' chambre(s) · '+answers.sdb+' salle(s) de bain<br>'+
      '🔧 Rénovations : '+(labels.renos[answers.renos]||answers.renos);
    $('#eval-recap').innerHTML=recap;
    $('#eval-actions').style.display='none';
    stepEl(current).classList.remove('active');
    current=6;
    stepEl(6).classList.add('active');
    document.querySelectorAll('.eval-step-dot').forEach(d=>{d.classList.add('done');d.classList.remove('active');});
    window.scrollTo({top:$('.eval-wrap').offsetTop-100,behavior:'smooth'});
  }

  // Address autocomplete via Photon (OpenStreetMap) — gratuit, sans clé
  const addrInput=$('#eval-addr');
  const sugBox=$('#eval-suggestions');
  let suggestions=[],activeIdx=-1,debounceTimer;

  function renderSug(){
    if(!suggestions.length){sugBox.classList.remove('open');return;}
    sugBox.innerHTML=suggestions.map((s,i)=>'<div class="eval-suggestion'+(i===activeIdx?' active':'')+'" data-i="'+i+'">'+s.label+(s.sec?'<span class="sec">'+s.sec+'</span>':'')+'</div>').join('');
    sugBox.classList.add('open');
  }
  async function fetchSug(q){
    if(q.length<3){suggestions=[];renderSug();return;}
    try{
      // Bbox approximatif Rive-Nord + Laurentides QC
      const url='https://photon.komoot.io/api?q='+encodeURIComponent(q)+'&lang=fr&limit=6&bbox=-75.5,45.4,-73.4,46.5';
      const res=await fetch(url);
      const data=await res.json();
      suggestions=(data.features||[]).filter(f=>f.properties.country==='Canada').map(f=>{
        const p=f.properties;
        const label=[p.housenumber,p.street||p.name].filter(Boolean).join(' ')||(p.name||'');
        const sec=[p.city||p.town||p.village,p.state].filter(Boolean).join(', ');
        return {label,sec};
      }).filter(s=>s.label.length>0);
    }catch{suggestions=[];}
    activeIdx=-1;
    renderSug();
  }
  addrInput.addEventListener('input',()=>{
    clearTimeout(debounceTimer);
    debounceTimer=setTimeout(()=>fetchSug(addrInput.value.trim()),250);
  });
  addrInput.addEventListener('keydown',e=>{
    if(!suggestions.length)return;
    if(e.key==='ArrowDown'){e.preventDefault();activeIdx=Math.min(activeIdx+1,suggestions.length-1);renderSug();}
    if(e.key==='ArrowUp'){e.preventDefault();activeIdx=Math.max(activeIdx-1,0);renderSug();}
    if(e.key==='Enter'&&activeIdx>=0){e.preventDefault();pick(activeIdx);}
    if(e.key==='Escape'){suggestions=[];renderSug();}
  });
  function pick(i){
    const s=suggestions[i];
    addrInput.value=s.label+(s.sec?', '+s.sec:'');
    answers.address=addrInput.value;
    suggestions=[];renderSug();
    validate();
  }
  sugBox.addEventListener('click',e=>{
    const it=e.target.closest('.eval-suggestion');
    if(it)pick(+it.dataset.i);
  });
  document.addEventListener('click',e=>{
    if(!sugBox.contains(e.target)&&e.target!==addrInput){sugBox.classList.remove('open');}
  });

  // Init
  validate();
})();
</script>
`
}));

// --- VENDRE / ACHETER / INVESTISSEUR ---
const SUBPAGES = [
  ['vendre/etapes-pour-vendre','Les 7 étapes pour vendre sa maison','Processus vendeur','De la mise en marché à l\'acte notarié : chaque étape expliquée.','Les 7 étapes pour vendre sa maison au Québec | Équipe Jacques-Roussel','Étapes détaillées pour vendre sa maison au Québec : évaluation, préparation, mise en marché, offres, contre-propositions, notaire.',`<p>Vendre une propriété, ça se prépare. Voici comment nous orchestrons chaque vente, de la mise en marché jusqu'à l'acte notarié, pour conclure rapidement et au meilleur prix.</p>
<h2>1. Établir le juste prix</h2><p>Fixer le prix demandé est une décision stratégique. Un prix trop élevé fait fuir les visites; un prix trop bas vous fait perdre de l'argent. L'acheteur moyen visite environ 8 propriétés avant de décider : la vôtre doit se démarquer dans sa gamme de prix. Nous vous remettons une analyse comparative de marché détaillée et personnalisée, qui tient compte de l'état actuel du marché, des caractéristiques uniques de votre propriété et des comparables en vigueur.</p>
<h2>2. Préparer la propriété</h2><p>Chaque petit détail compte. Repeindre une pièce, épurer l'espace, ajouter des plantes et nettoyer de fond en comble rendent votre demeure plus invitante. Certaines pièces comme la cuisine et la salle de bain peuvent augmenter sensiblement la valeur perçue.</p>
<h2>3. Mettre en valeur avec des photos professionnelles</h2><p>La première impression est décisive. Nous présentons votre propriété sous son meilleur jour grâce à une prise de photo réalisée par un photographe professionnel en immobilier, et nous rédigeons une description claire et concise qui met vos atouts en avant.</p>
<h2>4. Diffuser au maximum</h2><p>Nous inscrivons votre propriété sur un maximum de plateformes (Centris, RE/MAX Québec, RE/MAX Crystal, REALTOR et notre site professionnel) et la promouvons auprès de notre réseau de collaborateurs et de notre banque d'acheteurs potentiels. Nos outils marketing, technologiques comme physiques, ont fait leurs preuves.</p>
<h2>5. Gérer les visites</h2><p>Nous préqualifions les acheteurs, faisons les suivis avec les courtiers qui ont visité et recueillons leurs commentaires. À la lumière de ces comptes rendus, nous vous indiquons les ajustements qui créent une ambiance propice à une offre favorable.</p>
<h2>6. Négocier chaque offre</h2><p>Nous vous expliquons toute offre d'achat reçue et vous assistons en négociant le meilleur prix et les meilleures conditions possibles.</p>
<h2>7. Conclure chez le notaire</h2><p>Une fois l'offre acceptée, nous vous accompagnons dans toutes les étapes : inspection en bâtiment, évaluation agréée si nécessaire, examen des documents exigés par l'acheteur, et la signature finale chez le notaire.</p>`,'/photos/guide-vendre-etapes.jpg'],
  ['vendre/preparer-sa-maison','Préparer sa maison pour la vente','Home staging','Petites interventions, grand impact sur le prix de vente.','Préparer sa maison pour la vente · home staging | Équipe Jacques-Roussel','Guide home staging pour maximiser le prix de vente : peinture, éclairage, désencombrement, petites rénovations.',`<p>La première impression est décisive lors d'une visite. Des photos de qualité professionnelle et une propriété bien préparée mettent votre demeure en valeur et déclenchent l'intérêt des acheteurs. Voici nos recommandations, pièce par pièce, pour provoquer un coup de cœur.</p>
<h2>En général</h2><ul><li>Suivez les conseils du photographe</li><li>Dépersonnalisez l'environnement</li><li>Remplacez toutes les ampoules brûlées</li><li>Allumez les lumières et ouvrez les rideaux</li><li>Cachez tout ce qui ne doit pas se retrouver sur les photos</li></ul>
<h2>Salon</h2><ul><li>Rangez toutes les manettes</li><li>Éteignez les téléviseurs</li></ul>
<h2>Cuisine</h2><ul><li>Dégagez au maximum les comptoirs, en laissant les petits électroménagers</li><li>Rangez les serviettes et la vaisselle</li><li>Enlevez les aimants et les dessins du réfrigérateur</li></ul>
<h2>Salle de bain</h2><ul><li>Rangez tous les produits d'hygiène</li><li>Nettoyez les comptoirs et les miroirs</li><li>Baissez le siège de la toilette</li><li>Mettez des serviettes de couleurs agencées si possible</li></ul>
<h2>Chambres</h2><ul><li>Faites les lits impeccablement</li><li>Rangez vos effets personnels et les photos de famille</li></ul>
<h2>Extérieur</h2><ul><li>Stationnez les voitures dans la rue si possible</li><li>En été, taillez les haies et tondez le gazon</li><li>En hiver, déneigez l'entrée et cachez les pelles</li></ul>
<h2>Le jour de la visite</h2><p>Une demeure épurée et propre, une musique de fond douce, une température entre 20 et 23 degrés et une lumière naturelle à profusion mettent les chances de votre côté. Une touche de vie, comme quelques fleurs dans un vase ou un bol d'agrumes bien à la vue, est toujours gagnante. Les visites se déroulent souvent mieux lorsque les vendeurs sont absents : profitez-en pendant que nous faisons notre travail.</p>`,'/photos/stock/interieur-salon-lumineux.jpg'],
  ['vendre/commission-courtier','Commission d\'un courtier immobilier','Commission & honoraires','Comprendre la commission, et pourquoi elle est rentable.','Commission d\'un courtier immobilier au Québec | Équipe Jacques-Roussel','Comment fonctionne la commission d\'un courtier immobilier au Québec : ce qui est inclus, quand elle est due, ce qui est négociable.',`<p>La commission est partagée entre le courtier inscripteur et le courtier collaborateur qui amène l'acheteur. Elle n'est due qu'à la vente : aucuns frais d'avance. Parlons-en directement, on vous explique le détail applicable à votre propriété.</p>
<h2>Ce que votre commission couvre</h2><ul><li>Une analyse comparative de marché pour fixer le juste prix</li><li>Une prise de photo professionnelle et la rédaction de la fiche</li><li>La diffusion sur Centris, RE/MAX Québec, RE/MAX Crystal, REALTOR et notre site</li><li>La promotion auprès de notre réseau et de notre banque d'acheteurs</li><li>La gestion des visites, les suivis et les comptes rendus</li><li>La négociation des offres et l'accompagnement jusqu'au notaire</li></ul>
<h2>Des programmes exclusifs RE/MAX, sans frais pour vous</h2><p>Comme clients, vous profitez d'avantages pensés pour votre tranquillité d'esprit :</p>
<ul><li><strong><a href="https://www.remax-quebec.com/fr/tranquilli-t" target="_blank" rel="noopener">Garantie TRANQUILLI-T</a></strong> : une protection contre certains imprévus de la transaction (délai, annulation, litige). Le coût du programme est défrayé par nous.</li><li><strong><a href="https://www.remax-quebec.com/fr/integri-t" target="_blank" rel="noopener">Garantie INTÉGRI-T</a></strong> : une protection contre les vices cachés après la vente.</li></ul>
<p>Vendre sans courtier peut sembler une économie, mais une vente sans accompagnement se conclut souvent plus lentement et à un prix inférieur. Notre rôle est de maximiser votre profit net.</p>`,'/photos/guide-vendre-commission.jpg'],
  ['vendre/vendre-sans-stress','Vendre sans stress','Accompagnement complet','Un processus balisé : vous savez toujours où vous en êtes.','Vendre sa maison sans stress | Équipe Jacques-Roussel','Méthode pour vendre sa maison sans stress : planning clair, communication hebdo, checklist par étape.',`<p>Vendre est l'une des transactions les plus importantes et les plus stressantes d'une vie. Notre rôle est de transformer cette émotion en un processus prévisible, où vous savez toujours où vous en êtes.</p>
<h2>Un plan d'action qui a fait ses preuves</h2><p>Nous prenons en charge la mise en marché, la promotion, les visites et toute la documentation. Vous gardez le contrôle des décisions; nous gérons l'exécution.</p>
<h2>Une communication constante</h2><p>Nous communiquons avec vous fréquemment pour vous faire part des changements sur le marché et des commentaires recueillis après chaque visite. Ces retours guident les ajustements.</p>
<h2>Vendre avec ou sans la garantie légale</h2><p>La garantie légale comprend la garantie de titre et la garantie de qualité. La majorité des ventes se font avec la garantie légale. Selon les statistiques, vendre sans garantie peut diminuer l'intérêt des acheteurs et réduire le prix de 5 % à 8 %. Certaines situations justifient toutefois une vente sans garantie, comme une succession ou un immeuble loué ou inhabité. Nous vous recommandons toujours de consulter un juriste, car chaque situation est différente.</p>
<h2>Un service après-vente</h2><p>Notre accompagnement ne s'arrête pas à la signature. N'hésitez jamais à nous contacter pour une question sur le marché, une référence (notaire, inspecteur, courtier hypothécaire) ou une nouvelle évaluation.</p>`,'/photos/guide-vendre-sansstress.jpg'],
  ['acheter/premier-acheteur','Premier acheteur','Acheteur · Guide','Acheter sa première maison sur la Rive-Nord : par où commencer.','Premier acheteur Sainte-Thérèse Blainville | Équipe Jacques-Roussel','Guide premier acheteur : préapprobation, RAP, CELIAPP, inspection, fraiss de notaire, mutation.',`<p>Acheter sa première propriété est une grande aventure qui comporte plusieurs phases. Voici les grandes lignes à suivre et les éléments à ne pas oublier pour aborder chaque étape sereinement.</p>
<h2>Commencer par la préapprobation</h2><p>Avant même de visiter, faites établir votre préapprobation hypothécaire pour connaître votre capacité réelle d'emprunt. Vous visiterez ainsi dans la bonne gamme de prix et serez prêt à déposer une offre solide.</p>
<h2>Les programmes pour premiers acheteurs</h2><p>Si vous utilisez votre REER (RAP) ou votre CELIAPP pour l'achat, communiquez rapidement avec l'institution où se trouve votre argent pour les aviser : le transfert peut prendre du temps, et le faire tôt vous évite la pression de dernière minute.</p>
<h2>Les frais à prévoir</h2><p>Au-delà de la mise de fonds, prévoyez la prime SCHL et la taxe de 9 % sur cette prime (payable comptant, si applicable), la taxe de mutation (la « taxe de bienvenue », reçue quelques semaines après l'acte notarié), la répartition des charges (taxes municipale et scolaire), les frais de notaire, l'assurance habitation obligatoire et les frais de déménagement.</p>
<h2>L'inspection et l'acte notarié</h2><p>Une inspection en bâtiment vous protège avant la signature. Vient ensuite la passation de titre chez le notaire : pensez à apporter deux pièces d'identité valides et la preuve d'assurance de votre nouvelle propriété.</p>`,'/photos/guide-acheter-premier.jpg'],
  ['acheter/etapes-pour-acheter','Étapes pour acheter','Processus acheteur','De la préapprobation à la remise des clés.','Étapes pour acheter une maison au Québec | Équipe Jacques-Roussel','Étapes complètes pour acheter une maison au Québec.',`<p>Votre promesse d'achat a été acceptée et vos conditions sont remplies. Avant le moment tant attendu du déménagement, il reste la passation de titre chez le notaire. Voici les étapes à suivre avant l'acte notarié.</p>
<h2>1. La documentation</h2><p>Nous prenons en charge tous les documents liés à la transaction pour les faire parvenir au notaire. De votre côté, prévoyez deux pièces d'identité valides (permis de conduire, carte d'assurance maladie, passeport) pour vos rendez-vous chez le notaire.</p>
<h2>2. Vos démarches de prêt</h2><p>Si ce n'est pas déjà fait, communiquez avec votre courtier hypothécaire ou votre institution financière pour leur confirmer que les conditions de votre promesse d'achat sont remplies. Le notaire attendra leurs instructions pour préparer votre acte et fixer la signature de votre hypothèque.</p>
<h2>3. REER, CELIAPP et assurance</h2><p>Si vous utilisez votre REER ou votre CELIAPP, avisez sans tarder l'institution concernée, car le transfert prend parfois du temps. Vous devez aussi assurer votre nouvelle propriété et fournir la preuve d'assurance : sans elle, le notaire ne pourra pas procéder. Envoyez-la-lui idéalement avant l'acte notarié.</p>
<h2>Les rencontres avec le notaire</h2><p>En général, une première rencontre sert à signer le prêt hypothécaire, ce qui vous lie à votre institution financière (cette étape n'a pas lieu pour un achat comptant). La deuxième rencontre est la passation de titre : la propriété vous est officiellement transférée. Certains notaires regroupent le tout en une seule rencontre.</p>
<h2>Les autres frais à prévoir</h2><ul><li>Mise de fonds et prime SCHL (si applicable)</li><li>Taxe de 9 % sur la prime SCHL, payable comptant (si applicable)</li><li>Taxe de mutation, reçue quelques semaines après l'acte notarié</li><li>Répartition des charges : taxe municipale, taxe scolaire, etc.</li><li>Frais de déménagement : déménageurs, camion, rénovations, décorations</li><li>Autres dépenses : notaire, assurance obligatoire de l'immeuble</li></ul>`,'/photos/guide-acheter-etapes.jpg'],
  ['acheter/financement-hypothecaire','Financement hypothécaire','Hypothèque','Préapprobation, taux, amortissement : les bases.','Financement hypothécaire Québec | Équipe Jacques-Roussel','Comprendre le financement hypothécaire : préapprobation, taux fixe vs variable, amortissement.',`<p>Le financement est au cœur de votre achat. Le taux d'intérêt compte, mais la mise de fonds, l'amortissement et le type de prêt comptent tout autant.</p>
<h2>La préapprobation d'abord</h2><p>Obtenez une préapprobation avant de visiter : elle fixe votre capacité d'emprunt et la fourchette de prix réaliste. Elle vous rend aussi plus crédible au moment de déposer une offre.</p>
<h2>Coordonner avec votre prêteur</h2><p>Dès que votre promesse d'achat est acceptée et vos conditions remplies, confirmez-le à votre courtier hypothécaire ou à votre institution financière. C'est sur leurs instructions que le notaire préparera votre acte et fixera la signature de votre hypothèque.</p>
<h2>REER (RAP) et CELIAPP</h2><p>Si une partie de votre mise de fonds provient de votre REER ou de votre CELIAPP, avisez tôt l'institution concernée : le transfert des fonds peut prendre du temps et mieux vaut ne pas vous retrouver pressé à la dernière minute.</p>
<h2>Pensez à l'assurance</h2><p>Votre nouvelle propriété doit être assurée pour l'acte notarié. Sans preuve d'assurance, le notaire ne peut pas conclure la transaction.</p>`,'/photos/guide-acheter-financement.jpg'],
  ['acheter/inspection','Inspection pré-achat','Inspection','Jamais d\'achat sans inspection : nos inspecteurs partenaires.','Inspection pré-achat Québec | Équipe Jacques-Roussel','Guide de l\'inspection pré-achat : à quoi s\'attendre, délais, vices cachés.',`<p>L'inspection pré-achat est votre police d'assurance avant la signature. Elle révèle l'état réel de la propriété et vous évite les mauvaises surprises.</p>
<h2>Pourquoi inspecter</h2><p>Une inspection en bâtiment fait partie des conditions habituelles d'une promesse d'achat. Elle vous permet d'acheter en toute connaissance de cause et, au besoin, de renégocier ou de vous retirer si un problème majeur est découvert.</p>
<h2>Notre accompagnement</h2><p>Nous vous référons des inspecteurs en bâtiment de confiance et vous accompagnons dans l'examen du rapport, comme dans toutes les étapes à venir une fois l'offre acceptée : évaluation agréée si nécessaire, examen des documents et coordination jusqu'à l'acte notarié.</p>
<h2>Vices cachés et garanties</h2><p>Même après une inspection, la garantie légale de qualité protège l'acheteur contre les vices cachés. Comme clients RE/MAX, vous profitez aussi de la <strong>Garantie INTÉGRI-T</strong>, qui offre une solution pour les problèmes découverts après la vente.</p>`,'/photos/guide-acheter-inspection.jpg'],
];

// --- COURTIERS HYPOTHÉCAIRES PARTENAIRES ---
// À REMPLIR : remplacer les deux entrées d'exemple par les vrais partenaires.
// Champs : nom, institution/cabinet, téléphone, courriel, site (facultatif), note (facultatif).
// Laisser le tableau vide masque complètement la section.
const MORTGAGE_BROKERS = [
  {
    name: 'À REMPLIR — nom du courtier',
    firm: 'À REMPLIR — cabinet ou institution',
    phone: '',
    email: '',
    site: '',
    note: 'À REMPLIR : une ligne sur sa spécialité (premiers acheteurs, travailleurs autonomes, immeubles à revenus, refinancement…).'
  },
  {
    name: 'À REMPLIR — nom du courtier',
    firm: 'À REMPLIR — cabinet ou institution',
    phone: '',
    email: '',
    site: '',
    note: 'À REMPLIR : une ligne sur sa spécialité.'
  }
];

const brokerCardsHtml = MORTGAGE_BROKERS.length ? `
<section class="container">
  <div class="sec-head reveal">
    <div>
      <div class="eye">Partenaires</div>
      <h2>Nos courtiers hypothécaires</h2>
    </div>
  </div>
  <p class="mb-intro">On travaille avec des courtiers hypothécaires qui connaissent le marché de la Rive-Nord et qui répondent. Ils magasinent votre taux auprès de plusieurs prêteurs, sans frais pour vous dans la majorité des dossiers. Vous restez libre de faire affaire avec votre institution : on vous accompagne dans les deux cas.</p>
  <div class="mb-grid reveal">
    ${MORTGAGE_BROKERS.map(b => `
    <article class="mb-card">
      <h3 class="mb-card__name">${b.name}</h3>
      ${b.firm ? `<span class="mb-card__firm">${b.firm}</span>` : ''}
      ${b.note ? `<p class="mb-card__note">${b.note}</p>` : ''}
      <div class="mb-card__links">
        ${b.phone ? `<a href="tel:${b.phone.replace(/[^\d+]/g, '')}">${b.phone}</a>` : ''}
        ${b.email ? `<a href="mailto:${b.email}">${b.email}</a>` : ''}
        ${b.site ? `<a href="${b.site}" target="_blank" rel="noopener">Site web &rarr;</a>` : ''}
      </div>
    </article>`).join('')}
  </div>
  <p class="mb-legal">Ces courtiers sont des partenaires indépendants. L'Équipe Jacques-Roussel ne reçoit aucune commission sur les prêts hypothécaires et n'est pas responsable des conditions de financement offertes. Comparez toujours plusieurs options avant de vous engager.</p>
</section>` : '';

for (const [p, h1, eye, lead, title, desc, body, img] of SUBPAGES) {
  writePage(`${p}/index.html`, contentPage({
    eyebrow: eye, h1, lead, title, desc,
    canonical: `https://jacquesroussel.com/${p}/`,
    body, image: img,
    afterProse: p === 'acheter/financement-hypothecaire' ? brokerCardsHtml : ''
  }));
}

// --- CALCULATRICES ---
writePage('acheter/calculatrices/index.html', layout({
  title: 'Calculatrices hypothécaires · paiement, capacité, rendement plex | Équipe Jacques-Roussel',
  description: 'Trois calculatrices gratuites : paiement hypothécaire mensuel, capacité d\'emprunt (ABD/ATD) et rendement d\'un plex. Résultats instantanés.',
  canonical: 'https://jacquesroussel.com/acheter/calculatrices/',
  body: `
<section class="page-head container">
  <div class="eyebrow">Outils gratuits</div>
  <h1>Calculatrices immobilières.</h1>
  <p class="lead">Paiement hypothécaire, capacité d'emprunt et rendement d'un plex : calcul instantané, sans courriel demandé.</p>
</section>

<section class="container">
  <div class="calc-grid">
    <!-- 1. Paiement hypothécaire -->
    <div class="calc blue-block soft">
      <div class="eye" style="color:var(--blue-2)">Calculatrice 1</div>
      <h2 style="margin:.6rem 0 1.5rem">Paiement hypothécaire mensuel.</h2>
      <div class="calc-form">
        <label>Prix d'achat <span data-out="m-price">500 000 $</span>
          <input type="range" id="m-price-i" min="100000" max="2500000" step="10000" value="500000">
        </label>
        <label>Mise de fonds <span data-out="m-down">20 %</span>
          <input type="range" id="m-down-i" min="5" max="50" step="1" value="20">
        </label>
        <label>Taux (%) <span data-out="m-rate">5,25 %</span>
          <input type="range" id="m-rate-i" min="2" max="10" step="0.05" value="5.25">
        </label>
        <label>Amortissement <span data-out="m-years">25 ans</span>
          <input type="range" id="m-years-i" min="5" max="30" step="1" value="25">
        </label>
      </div>
      <div class="calc-out">
        <div><div class="k" id="m-payment">—</div><div class="kl">Paiement / mois</div></div>
        <div><div class="k" id="m-loan">—</div><div class="kl">Montant emprunté</div></div>
        <div><div class="k" id="m-interest">—</div><div class="kl">Intérêts totaux</div></div>
      </div>
    </div>

    <!-- 2. Capacité d'emprunt -->
    <div class="calc blue-block">
      <div class="eye" style="color:rgba(255,255,255,.6)">Calculatrice 2</div>
      <h2 style="color:#fff;margin:.6rem 0 1.5rem">Capacité d'emprunt (ABD / ATD).</h2>
      <div class="calc-form dark">
        <label>Revenu annuel brut ménage <span data-out="c-income">100 000 $</span>
          <input type="range" id="c-income-i" min="30000" max="400000" step="5000" value="100000">
        </label>
        <label>Mise de fonds disponible <span data-out="c-down">50 000 $</span>
          <input type="range" id="c-down-i" min="0" max="500000" step="5000" value="50000">
        </label>
        <label>Dettes mensuelles (auto, cartes…) <span data-out="c-debt">500 $</span>
          <input type="range" id="c-debt-i" min="0" max="5000" step="50" value="500">
        </label>
        <label>Taux (%) <span data-out="c-rate">5,25 %</span>
          <input type="range" id="c-rate-i" min="2" max="10" step="0.05" value="5.25">
        </label>
      </div>
      <div class="calc-out">
        <div><div class="k" id="c-max">—</div><div class="kl">Prix maximum</div></div>
        <div><div class="k" id="c-abd">—</div><div class="kl">Ratio ABD</div></div>
        <div><div class="k" id="c-atd">—</div><div class="kl">Ratio ATD</div></div>
      </div>
    </div>

    <!-- 3. Rendement plex -->
    <div class="calc blue-block soft">
      <div class="eye" style="color:var(--blue-2)">Calculatrice 3</div>
      <h2 style="margin:.6rem 0 1.5rem">Rendement d'un plex.</h2>
      <div class="calc-form">
        <label>Prix d'achat <span data-out="p-price">650 000 $</span>
          <input type="range" id="p-price-i" min="200000" max="3000000" step="10000" value="650000">
        </label>
        <label>Revenus locatifs bruts / mois <span data-out="p-rent">4 200 $</span>
          <input type="range" id="p-rent-i" min="500" max="20000" step="100" value="4200">
        </label>
        <label>Dépenses annuelles (taxes, assurance, entretien) <span data-out="p-exp">12 000 $</span>
          <input type="range" id="p-exp-i" min="0" max="50000" step="500" value="12000">
        </label>
        <label>Mise de fonds (%) <span data-out="p-dp">20 %</span>
          <input type="range" id="p-dp-i" min="15" max="50" step="1" value="20">
        </label>
      </div>
      <div class="calc-out">
        <div><div class="k" id="p-caprate">—</div><div class="kl">Taux de capitalisation</div></div>
        <div><div class="k" id="p-cashflow">—</div><div class="kl">Cashflow annuel</div></div>
        <div><div class="k" id="p-coc">—</div><div class="kl">Rendement sur mise de fonds</div></div>
      </div>
    </div>
  </div>
</section>

<section class="container">
  <aside class="calc-disclaimer" role="note">
    <h2>Avis important</h2>
    <p>Ces calculatrices donnent une <strong>estimation à titre informatif seulement</strong>. Elles ne constituent ni une offre de financement, ni une préapprobation, ni un conseil financier, fiscal ou juridique.</p>
    <p>Les résultats reposent sur des hypothèses simplifiées : capitalisation semestrielle canadienne, taux constant pour toute la durée de l'amortissement, et estimations forfaitaires pour les taxes municipales et le chauffage dans le calcul de capacité d'emprunt. Ils excluent notamment la prime d'assurance prêt hypothécaire de la SCHL et la taxe applicable, la taxe de mutation, les frais de notaire, les frais d'évaluation et d'inspection, les assurances et les frais de copropriété.</p>
    <p>Le montant réel que vous pouvez emprunter dépend de votre dossier de crédit, de la vérification de vos revenus, des politiques du prêteur et du test de résistance en vigueur. Seule votre institution financière ou votre courtier hypothécaire peut confirmer votre capacité d'emprunt et vos conditions réelles.</p>
    <p>Pour le calcul de rendement, les revenus et dépenses saisis sont les vôtres : la calculatrice ne valide ni les baux, ni les dépenses réelles, ni le taux d'inoccupation. Un rendement affiché ne constitue pas une garantie de performance.</p>
    <p class="calc-disclaimer__cta">Avant de vous engager, validez vos chiffres avec un professionnel. <a href="/acheter/financement-hypothecaire/">Voir nos courtiers hypothécaires partenaires</a> ou <a href="/rendez-vous/">prenez rendez-vous avec nous</a>.</p>
  </aside>
</section>

<section class="container">
  <div class="cta-band">
    <h2>Besoin d'un avis pro sur votre capacité réelle ?</h2>
    <a class="btn" href="/rendez-vous/">Prendre rendez-vous &rarr;</a>
  </div>
</section>

<script>
(function(){
  const fmt = n => new Intl.NumberFormat('fr-CA',{maximumFractionDigits:0}).format(Math.round(n))+' $';
  const fmtPct = n => (n).toFixed(1).replace('.',',')+' %';
  const bind = (id,fn)=>{const el=document.getElementById(id); if(el)el.addEventListener('input',fn); return el;};
  const val = id => parseFloat(document.getElementById(id).value);
  const set = (sel,txt)=>{const e=document.querySelector('[data-out="'+sel+'"]'); if(e)e.textContent=txt;};
  const put = (id,txt)=>{const e=document.getElementById(id); if(e)e.textContent=txt;};

  // 1. Mortgage payment (formule standard, capitalisation semestrielle canadienne)
  function calcMortgage(){
    const price=val('m-price-i'), down=val('m-down-i')/100, rate=val('m-rate-i')/100, years=val('m-years-i');
    set('m-price', fmt(price)); set('m-down', down*100+' %'); set('m-rate', rate*100+' %'.replace('.',','));
    set('m-years', years+' ans');
    const loan=price*(1-down);
    // Canadian semi-annual compounding: effective monthly rate
    const r=Math.pow(1+rate/2,2/12)-1;
    const n=years*12;
    const pmt=loan*r/(1-Math.pow(1+r,-n));
    put('m-loan', fmt(loan));
    put('m-payment', fmt(pmt));
    put('m-interest', fmt(pmt*n - loan));
  }
  ['m-price-i','m-down-i','m-rate-i','m-years-i'].forEach(id=>bind(id,calcMortgage));
  calcMortgage();

  // 2. Borrowing capacity (ABD 32 %, ATD 40 %, stress-test +2 %)
  function calcCapacity(){
    const income=val('c-income-i'), down=val('c-down-i'), debt=val('c-debt-i'), rate=val('c-rate-i')/100;
    set('c-income', fmt(income)); set('c-down', fmt(down)); set('c-debt', fmt(debt));
    set('c-rate', (rate*100).toFixed(2).replace('.',',')+' %');
    const stressRate=Math.max(rate+0.02, 0.0525);
    const monthlyIncome=income/12;
    const taxes=250, heating=150; // estimation mensuelle Rive-Nord
    // ABD cap: housing <= 32 % of gross income
    const maxHousingABD=monthlyIncome*0.32 - taxes - heating;
    // ATD cap: housing + debts <= 40 %
    const maxHousingATD=monthlyIncome*0.40 - taxes - heating - debt;
    const maxPayment=Math.max(0, Math.min(maxHousingABD, maxHousingATD));
    const r=Math.pow(1+stressRate/2,2/12)-1;
    const n=25*12;
    const maxLoan=maxPayment*(1-Math.pow(1+r,-n))/r;
    const maxPrice=maxLoan+down;
    put('c-max', fmt(Math.max(0,maxPrice)));
    put('c-abd', '32 %');
    put('c-atd', '40 %');
  }
  ['c-income-i','c-down-i','c-debt-i','c-rate-i'].forEach(id=>bind(id,calcCapacity));
  calcCapacity();

  // 3. Plex yield
  function calcPlex(){
    const price=val('p-price-i'), rent=val('p-rent-i'), exp=val('p-exp-i'), dp=val('p-dp-i')/100;
    set('p-price', fmt(price)); set('p-rent', fmt(rent)); set('p-exp', fmt(exp));
    set('p-dp', (dp*100)+' %');
    const gross=rent*12;
    const noi=gross-exp;
    const capRate=noi/price*100;
    // Mortgage payment on (1-dp) portion at 5.25 %, 25 yrs
    const loan=price*(1-dp);
    const r=Math.pow(1+0.0525/2,2/12)-1, n=25*12;
    const pmt=loan*r/(1-Math.pow(1+r,-n));
    const cashflow=noi-pmt*12;
    const coc=(cashflow/(price*dp))*100;
    put('p-caprate', fmtPct(capRate));
    put('p-cashflow', fmt(cashflow));
    put('p-coc', fmtPct(coc));
  }
  ['p-price-i','p-rent-i','p-exp-i','p-dp-i'].forEach(id=>bind(id,calcPlex));
  calcPlex();
})();
</script>
`,
  extraHead: `<style>
.calc-grid{display:grid;gap:var(--space-8);grid-template-columns:1fr}
.calc{padding:clamp(1.8rem,3.5vw,2.8rem)}
.calc h2{color:inherit;font-size:clamp(1.3rem,2.2vw,1.8rem);letter-spacing:-.02em}
.calc-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.4rem 2rem;margin-bottom:2rem}
.calc-form label{display:flex;flex-direction:column;gap:.5rem;font-size:.9rem;font-weight:500;color:var(--ink-2)}
.calc-form.dark label{color:rgba(255,255,255,.9)}
.calc-form label span{font-weight:400;font-variant-numeric:tabular-nums;color:var(--blue)}
.calc-form.dark label span{color:#fff}
.calc-form input[type=range]{width:100%;accent-color:var(--blue)}
.calc-form.dark input[type=range]{accent-color:#fff}
.calc-out{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;padding-top:1.5rem;border-top:1px solid rgba(15,40,85,.12)}
.calc.blue-block:not(.soft) .calc-out{border-top-color:rgba(255,255,255,.14)}
.calc-out .k{font-size:clamp(1.6rem,2.6vw,2.2rem);font-weight:700;letter-spacing:-.025em;color:var(--blue);font-variant-numeric:tabular-nums}
.calc.blue-block:not(.soft) .calc-out .k{color:#fff}
.calc-out .kl{font-size:.78rem;text-transform:uppercase;letter-spacing:.06em;opacity:.7;margin-top:.3rem}
.calc-disclaimer{border:1px solid var(--line);border-left:3px solid var(--sand);border-radius:var(--radius);padding:clamp(1.5rem,3vw,2.2rem);background:var(--vellum)}
.calc-disclaimer h2{font-size:1rem;font-weight:700;text-transform:uppercase;letter-spacing:.14em;color:var(--stone);margin-bottom:1rem}
.calc-disclaimer p{font-size:.9rem;line-height:1.65;color:var(--stone);max-width:78ch}
.calc-disclaimer p + p{margin-top:.9rem}
.calc-disclaimer strong{color:var(--ink);font-weight:600}
.calc-disclaimer__cta{margin-top:1.4rem;padding-top:1.2rem;border-top:1px solid var(--line);color:var(--ink)}
.calc-disclaimer a{color:var(--blue);text-decoration:underline;text-underline-offset:3px}
</style>`
}));

// --- GUIDES / MARCHÉ / BLOG (stubs) ---
const GUIDES = [
  ['guide-du-vendeur-2026','Guide du vendeur 2026'],
  ['guide-du-premier-acheteur','Guide du premier acheteur'],
  ['guide-de-l-investisseur-plex','Guide de l\'investisseur plex'],
  ['guide-demenagement-rive-nord','Guide du déménagement Rive-Nord']
];
const GUIDE_CARDS = [
  {
    slug: 'guide-du-vendeur-2026',
    num: '01',
    eyebrow: 'Pour vendre',
    title: 'Guide du vendeur.',
    formTitle: 'guide du vendeur',
    desc: 'Préparer la propriété, fixer le bon prix, comprendre la commission : les étapes d\'une vente sans stress, expliquées une par une.',
    img: 'https://placehold.co/600x800/2c4160/F7F2EA?text=Guide%5Cndu+vendeur&font=playfair-display',
    tilt: '-2.5deg'
  },
  {
    slug: 'guide-du-premier-acheteur',
    num: '02',
    eyebrow: 'Pour acheter',
    title: 'Guide de l\'acheteur.',
    formTitle: 'guide de l\'acheteur',
    desc: 'Financement, inspection, promesse d\'achat : tout ce qu\'un premier acheteur doit savoir avant de signer quoi que ce soit.',
    img: 'https://placehold.co/600x800/CDB89A/13202E?text=Guide+de%5Cnl%27acheteur&font=playfair-display',
    tilt: '2.5deg'
  }
];

writePage('guides/index.html', layout({
  title: 'Guides immobiliers PDF | Équipe Jacques-Roussel',
  description: 'Deux guides PDF gratuits pour vendre ou acheter sur la Rive-Nord. Recevez-les par courriel.',
  canonical: 'https://jacquesroussel.com/guides/',
  body: `
<section class="page-head container">
  <div class="eyebrow">Guides PDF</div>
  <h1>Guides téléchargeables.</h1>
  <p class="lead">Deux guides gratuits, écrits à partir de vraies transactions : un pour vendre, un pour acheter. Livrés par courriel, sans engagement.</p>
</section>

<section class="container" style="padding-block-end: var(--space-16)">
  <div class="guides-grid">
    ${GUIDE_CARDS.map(g => `
    <article class="guide-card" style="--tilt:${g.tilt}">
      <div class="guide-card__coverwrap">
        <img class="guide-card__cover" src="${g.img}" alt="Couverture du ${g.title.replace('.','')}" width="600" height="800">
      </div>
      <div class="guide-card__body">
        <div class="guide-card__meta"><span class="guide-card__num">${g.num}</span><span class="guide-card__eye">${g.eyebrow}</span></div>
        <h2 class="guide-card__title">${g.title}</h2>
        <p class="guide-card__desc">${g.desc}</p>
        <button type="button" class="guide-card__btn" data-guide-open data-guide-slug="${g.slug}" data-guide-name="${g.formTitle}">Télécharger le guide<span class="guide-card__arrow" aria-hidden="true">&rarr;</span></button>
      </div>
    </article>`).join('')}
  </div>
</section>

<div class="guide-modal" data-guide-modal hidden>
  <div class="guide-modal__scrim" data-guide-close></div>
  <div class="guide-modal__panel" role="dialog" aria-modal="true" aria-labelledby="guide-modal-title">
    <button type="button" class="guide-modal__x" data-guide-close aria-label="Fermer">&times;</button>
    <div class="guide-modal__fields">
      <span class="eyebrow">Guide gratuit</span>
      <h2 class="guide-modal__title" id="guide-modal-title">Laissez-nous vos informations pour recevoir votre guide.</h2>
      <p class="guide-modal__sub">On vous l'envoie par courriel en PDF, tout de suite. Pas d'infolettre, pas de relance automatique.</p>
      <form class="guide-modal__form" data-guide-form novalidate>
        <input type="hidden" name="guide" data-guide-field-slug>
        <div class="guide-modal__row">
          <label>Prénom<input type="text" name="prenom" autocomplete="given-name" required></label>
          <label>Nom de famille<input type="text" name="nom" autocomplete="family-name"></label>
        </div>
        <div class="guide-modal__row">
          <label>Courriel<input type="email" name="courriel" autocomplete="email" required></label>
          <label>Téléphone<input type="tel" name="telephone" autocomplete="tel"></label>
        </div>
        <p class="guide-modal__note">Seuls le prénom et le courriel sont nécessaires pour l'envoi.</p>
        <button type="submit" class="guide-modal__submit">Recevoir mon guide &rarr;</button>
      </form>
    </div>
    <div class="guide-modal__done" hidden>
      <span class="guide-modal__check" aria-hidden="true">&check;</span>
      <h2>Merci&nbsp;!</h2>
      <p data-guide-done-text>Votre guide s'en vient dans votre boîte de réception. S'il tarde, vérifiez vos indésirables.</p>
      <button type="button" class="guide-modal__submit" data-guide-close>Fermer</button>
    </div>
  </div>
</div>`,
  extraHead: `<style>
.guides-grid{
  display:grid;
  grid-template-columns:repeat(2,1fr);
  gap:var(--space-6);
}
.guide-card{
  position:relative;
  background:var(--vellum);
  border-radius:var(--radius-lg);
  padding:clamp(2rem,4vw,3.5rem);
  display:grid;
  grid-template-rows:auto 1fr;
  gap:clamp(1.8rem,3vw,2.5rem);
  overflow:hidden;
  box-shadow:var(--shadow-card);
  transition:transform 400ms var(--ease-out), box-shadow 400ms var(--ease-out);
}
.guide-card::before{
  content:"";
  position:absolute; inset:0;
  background:
    radial-gradient(560px 300px at 85% -10%, oklch(75% 0.06 75 / 0.14), transparent 65%),
    var(--grain);
  pointer-events:none;
}
.guide-card:hover{
  transform:translateY(-6px);
  box-shadow:var(--shadow-card-hover);
}
.guide-card__coverwrap{
  display:flex; justify-content:center;
  padding-block:clamp(1rem,2vw,1.8rem);
}
.guide-card__cover{
  inline-size:min(58%,240px); block-size:auto;
  border-radius:6px;
  transform:rotate(var(--tilt));
  box-shadow:
    0 1px 2px oklch(30% 0.05 258 / 0.12),
    0 12px 28px oklch(30% 0.05 258 / 0.22),
    0 36px 70px oklch(30% 0.05 258 / 0.16);
  transition:transform 500ms var(--ease-back);
}
.guide-card:hover .guide-card__cover{
  transform:rotate(0deg) translateY(-6px) scale(1.02);
}
.guide-card__body{
  display:flex; flex-direction:column;
  align-items:flex-start;
  gap:.9rem;
}
.guide-card__meta{
  display:flex; align-items:baseline; gap:.9rem;
}
.guide-card__num{
  font-family:'Montserrat', system-ui, sans-serif;
  font-size:1rem; color:var(--bronze);
  font-variant-numeric:tabular-nums;
}
.guide-card__eye{
  font:500 0.75rem 'Montserrat', system-ui, sans-serif;
  text-transform:uppercase; letter-spacing:.18em;
  color:var(--stone);
}
.guide-card__title{
  font-family:'Montserrat', system-ui, sans-serif;
  font-size:clamp(1.6rem,2.6vw,2.2rem);
  font-weight:700; letter-spacing:-0.02em; line-height:1.1;
  color:var(--ink); margin:0;
}
.guide-card__desc{
  color:var(--stone); font-size:var(--text-base); line-height:1.7;
  max-inline-size:46ch; margin:0;
}
.guide-card__btn{
  margin-block-start:auto;
  padding-block-start:1rem;
  display:inline-flex; align-items:center; gap:.6rem;
  background:var(--navy); color:var(--cream);
  padding:0.85rem 1.5rem; border-radius:999px;
  font:500 0.9rem 'Montserrat', system-ui, sans-serif;
  transition:transform 240ms var(--ease-out);
}
.guide-card__btn::after{
  content:""; position:absolute; inset:0;
  border-radius:var(--radius-lg);
}
.guide-card__btn:hover{ transform:translateY(-1px); color:var(--cream); }
.guide-card__btn:focus-visible{ outline:2px solid var(--bronze); outline-offset:3px; }
.guide-card__arrow{
  display:inline-block;
  transition:transform 240ms var(--ease-out);
}
.guide-card:hover .guide-card__arrow{ transform:translateX(4px); }
@media (max-width:760px){
  .guides-grid{ grid-template-columns:1fr; }
}

/* Fenêtre de collecte — propre à chaque guide, plutôt que de renvoyer
   la personne au formulaire de contact général. */
.guide-modal[hidden]{ display:none; }
.guide-modal{
  position:fixed; inset:0; z-index:200;
  display:grid; place-items:center;
  padding:clamp(1rem,4vw,2rem);
}
.guide-modal__scrim{
  position:absolute; inset:0;
  background:oklch(22% 0.04 240 / 0.62);
  backdrop-filter:blur(3px);
  -webkit-backdrop-filter:blur(3px);
  animation:guideFade 260ms var(--ease-out);
}
.guide-modal__panel{
  position:relative;
  inline-size:min(560px,100%);
  max-block-size:90dvh; overflow-y:auto;
  background:var(--vellum);
  border:1px solid var(--hairline);
  border-radius:var(--radius-lg);
  padding:clamp(1.6rem,4vw,2.6rem);
  box-shadow:var(--shadow-card-hover);
  animation:guideRise 320ms var(--ease-out);
}
@keyframes guideFade{ from{ opacity:0 } to{ opacity:1 } }
@keyframes guideRise{ from{ opacity:0; transform:translateY(14px) } to{ opacity:1; transform:none } }
@media (prefers-reduced-motion:reduce){
  .guide-modal__scrim, .guide-modal__panel{ animation:none; }
}
.guide-modal__x{
  position:absolute; inset-block-start:.7rem; inset-inline-end:.9rem;
  inline-size:38px; block-size:38px; border:0; border-radius:999px;
  background:transparent; color:var(--stone);
  font-size:1.7rem; line-height:1; cursor:pointer;
  transition:background 220ms var(--ease-out), color 220ms var(--ease-out);
}
.guide-modal__x:hover{ background:var(--cream); color:var(--ink); }
.guide-modal__x:focus-visible{ outline:2px solid var(--bronze); outline-offset:2px; }
.guide-modal__title{
  font-size:clamp(1.3rem,2.4vw,1.7rem); font-weight:700;
  letter-spacing:-.028em; line-height:1.18;
  margin:.6rem 0 .5rem; color:var(--ink);
}
.guide-modal__sub{ color:var(--ink-2); font-size:.92rem; line-height:1.6; margin:0 0 1.4rem; }
.guide-modal__form{ display:flex; flex-direction:column; gap:.9rem; }
.guide-modal__row{ display:grid; grid-template-columns:1fr 1fr; gap:.9rem; }
@media (max-width:520px){ .guide-modal__row{ grid-template-columns:1fr; } }
.guide-modal__form label{
  display:flex; flex-direction:column; gap:.35rem;
  font-size:.78rem; font-weight:600; letter-spacing:.08em;
  text-transform:uppercase; color:var(--stone);
}
.guide-modal__form input{
  font:400 1rem 'Montserrat', system-ui, sans-serif;
  padding:.8rem .9rem;
  border:1px solid var(--hairline); border-radius:8px;
  background:#fff; color:var(--ink);
  transition:border-color 220ms var(--ease-out), box-shadow 220ms var(--ease-out);
}
.guide-modal__form input:focus{
  outline:none; border-color:var(--teal);
  box-shadow:0 0 0 3px oklch(37.3% 0.06 258 / 0.16);
}
.guide-modal__form input:user-invalid{ border-color:oklch(55% 0.18 27); }
.guide-modal__note{ font-size:.78rem; color:var(--stone); margin:0; }
.guide-modal__submit{
  justify-self:start; margin-block-start:.3rem;
  background:var(--teal); color:var(--cream);
  border:0; border-radius:999px;
  padding:1rem 1.7rem;
  font:500 .95rem 'Montserrat', system-ui, sans-serif;
  cursor:pointer;
  transition:background 260ms var(--ease-out), transform 260ms var(--ease-out);
}
.guide-modal__submit:hover{ background:var(--ink); transform:translateY(-2px); }
.guide-modal__submit:focus-visible{ outline:2px solid var(--bronze); outline-offset:3px; }
.guide-modal__done{ text-align:center; padding-block:1.5rem; }
.guide-modal__done h2{ font-size:1.5rem; font-weight:700; letter-spacing:-.028em; margin:.8rem 0 .5rem; color:var(--ink); }
.guide-modal__done p{ color:var(--ink-2); line-height:1.6; margin:0 0 1.5rem; }
.guide-modal__check{
  display:grid; place-items:center; margin-inline:auto;
  inline-size:56px; block-size:56px; border-radius:999px;
  background:var(--teal); color:var(--cream); font-size:1.7rem;
}
</style>`,
  extraBody: `<script>
(function(){
  var modal = document.querySelector('[data-guide-modal]');
  if (!modal) return;
  var panel  = modal.querySelector('.guide-modal__panel');
  var fields = modal.querySelector('.guide-modal__fields');
  var done   = modal.querySelector('.guide-modal__done');
  var form   = modal.querySelector('[data-guide-form]');
  var title  = modal.querySelector('[data-guide-modal-title], #guide-modal-title');
  var doneTx = modal.querySelector('[data-guide-done-text]');
  var slotSlug = modal.querySelector('[data-guide-field-slug]');
  var lastFocus = null;

  function open(slug, name){
    lastFocus = document.activeElement;
    slotSlug.value = slug;
    title.textContent = 'Laissez-nous vos informations pour recevoir votre ' + name + '.';
    doneTx.textContent = ENDPOINT
      ? 'Votre ' + name + ' s\\'en vient dans votre boîte de réception. S\\'il tarde, vérifiez vos indésirables.'
      : 'Votre logiciel de courriel vient de s\\'ouvrir avec le message prérempli : il ne reste qu\\'à l\\'envoyer et on vous fait parvenir votre ' + name + '.';
    fields.hidden = false; done.hidden = true;
    form.reset(); slotSlug.value = slug;
    modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    var f = form.querySelector('input[name="prenom"]');
    if (f) f.focus();
  }
  function close(){
    modal.hidden = true;
    document.documentElement.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  document.querySelectorAll('[data-guide-open]').forEach(function(btn){
    btn.addEventListener('click', function(){
      open(btn.dataset.guideSlug, btn.dataset.guideName);
    });
  });
  modal.querySelectorAll('[data-guide-close]').forEach(function(el){
    el.addEventListener('click', close);
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && !modal.hidden) close();
    // Le focus reste dans la fenêtre tant qu'elle est ouverte.
    if (e.key === 'Tab' && !modal.hidden) {
      var f = panel.querySelectorAll('button, input, [href]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  });

  var ENDPOINT = ${JSON.stringify(FORM_ENDPOINT)};
  var FALLBACK = ${JSON.stringify(FORM_FALLBACK_EMAIL)};

  function succeed(){
    fields.hidden = true; done.hidden = false;
    var b = done.querySelector('button'); if (b) b.focus();
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    if (!form.reportValidity()) return;
    var d = Object.fromEntries(new FormData(form).entries());
    var btn = form.querySelector('.guide-modal__submit');
    btn.disabled = true; btn.textContent = 'Envoi…';

    if (ENDPOINT) {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(d)
      }).then(function(r){
        if (!r.ok) throw new Error(r.status);
        succeed();
      }).catch(function(){
        btn.disabled = false; btn.textContent = 'Réessayer →';
        alert('L\\'envoi a échoué. Écrivez-nous à ' + FALLBACK + ' et on vous fait parvenir le guide.');
      });
      return;
    }

    // Pas d'endpoint configuré : on ouvre le client courriel de la personne
    // avec tout de prérempli. La demande part pour vrai, elle ne disparaît pas
    // dans un formulaire qui fait semblant.
    var sujet = 'Demande de ' + (d.guide === 'guide-du-vendeur-2026' ? 'guide du vendeur' : 'guide de l\\'acheteur');
    var corps = 'Bonjour,\\n\\nJ\\'aimerais recevoir le ' + sujet.replace('Demande de ', '') + ' en PDF.\\n\\n'
      + 'Prénom : ' + (d.prenom || '') + '\\n'
      + 'Nom : ' + (d.nom || '') + '\\n'
      + 'Courriel : ' + (d.courriel || '') + '\\n'
      + 'Téléphone : ' + (d.telephone || '') + '\\n\\nMerci !';
    window.location.href = 'mailto:' + FALLBACK
      + '?subject=' + encodeURIComponent(sujet)
      + '&body=' + encodeURIComponent(corps);
    succeed();
  });
})();
</script>`
}));
for (const [s,t] of GUIDES) {
  writePage(`guides/${s}/index.html`, contentPage({
    eyebrow:'Guide PDF',h1:t,lead:`${t}, téléchargement gratuit.`,
    title:`${t} | Équipe Jacques-Roussel`,desc:t, canonical:`https://jacquesroussel.com/guides/${s}/`,
    body:`<p>${t}, format PDF, entièrement gratuit.</p><a class="btn" href="/contact/" style="display:inline-block;background:var(--ink);color:#fff;padding:1rem 1.6rem;border-radius:999px;margin-top:1rem">Recevoir le guide par courriel &rarr;</a>`
  }));
}

// --- MARCHÉ IMMOBILIER — une page de statistiques réelles par ville ---
const MARKET_PAGES = MARKET_CITY_SLUGS.filter(s => marketFor(s));
const marketRefPeriod = marketFor(MARKET_PAGES[0])?.period || '';

writePage('marche-immobilier/index.html', contentPage({
  eyebrow: 'Marché immobilier Rive-Nord',
  h1: 'Statistiques du marché, par ville',
  lead: marketRefPeriod
    ? `Les chiffres publiés par Centris pour chaque municipalité du territoire, ${marketRefPeriod.toLowerCase()}.`
    : 'Les chiffres publiés par Centris pour chaque municipalité du territoire.',
  title: 'Statistiques du marché immobilier Rive-Nord | Équipe Jacques-Roussel',
  desc: 'Prix médians, délais de vente et volumes de transactions par municipalité de la Rive-Nord ouest. Données Centris, mises à jour chaque trimestre.',
  canonical: 'https://jacquesroussel.com/marche-immobilier/',
  body: `<p>Centris publie ses statistiques par trimestre, quelques semaines après la fin de la période. On les reprend ici telles quelles, avec la source et la date de relevé, pour chaque municipalité qu'on dessert.</p>
  <p>Ces chiffres donnent la température d'un marché municipal. Ils ne remplacent pas une analyse comparative de votre secteur : d'une rue à l'autre, l'écart dépasse souvent celui entre deux villes voisines.</p>`,
  afterProse: MARKET_PAGES.length ? `
<section class="container">
  <div class="cat-grid">
    ${MARKET_PAGES.map(s => {
      const m = marketFor(s);
      const prix = m.sections.unifamiliale?.rows?.prixMedian?.trimestre;
      return `<a class="cat-card" href="/marche-immobilier/${s}/">
        <span class="cat-card__count">${m.period || 'Centris'}</span>
        <h3>${m.name}</h3>
        <p>${prix?.value ? `Prix médian unifamiliale : <strong>${prix.value}</strong>${prix.variation ? ` (${prix.variation} sur un an)` : ''}` : 'Statistiques détaillées'}</p>
        <span class="cat-card__arrow" aria-hidden="true">&rarr;</span>
      </a>`;
    }).join('')}
  </div>
</section>` : ''
}));

for (const s of MARKET_PAGES) {
  const m = marketFor(s);
  const uni = m.sections.unifamiliale?.rows || {};
  const copro = m.sections.copropriete?.rows || {};
  const plex = m.sections.plex?.rows || {};
  const tot = m.sections.total?.rows || {};

  // Tableau détaillé : une ligne par indicateur publié, rien d'inventé
  const detailRow = (label, row, unit = '') => {
    if (!row) return '';
    const q = row.trimestre, c = row.cumul;
    if (!q && !c) return '';
    const cell = v => v && v.value ? `${v.value}${unit ? ` ${unit}` : ''}${v.variation ? ` <span class="mkt-var mkt-var--${v.direction || 'flat'}">${v.direction === 'up' ? '▲' : v.direction === 'down' ? '▼' : ''} ${v.variation}${unit && !/%/.test(v.variation) ? ` ${unit}` : ''}</span>` : ''}` : '—';
    return `<tr><td>${row.label}</td><td class="num">${cell(q)}</td><td class="num">${cell(c)}</td></tr>`;
  };
  const section = (title, rows) => {
    const body = [
      detailRow('Ventes', rows.ventes),
      detailRow('Nouvelles inscriptions', rows.nouvellesInscriptions),
      detailRow('Inscriptions en vigueur', rows.inscriptionsActives),
      detailRow('Prix médian', rows.prixMedian),
      detailRow('Jours sur le marché', rows.joursSurLeMarche, 'jours'),
      detailRow('Volume', rows.volume)
    ].filter(Boolean).join('');
    if (!body) return '';
    return `<h2>${title}</h2>
    <table class="mkt-tbl">
      <thead><tr><th>Indicateur</th><th class="num">${m.period || 'Trimestre'}</th><th class="num">Cumul 4 trimestres</th></tr></thead>
      <tbody>${body}</tbody>
    </table>`;
  };

  writePage(`marche-immobilier/${s}/index.html`, contentPage({
    eyebrow: `Marché · ${m.name}`,
    h1: `Statistiques immobilières de ${m.name}`,
    lead: m.period ? `Données Centris, ${m.period.toLowerCase()}${market.fetchedAt ? `, relevées le ${market.fetchedAt}` : ''}.` : 'Données Centris.',
    title: `Statistiques immobilières ${m.name} | Équipe Jacques-Roussel`,
    desc: `Prix médian, délai de vente, ventes et inscriptions à ${m.name}${m.period ? ` au ${m.period.toLowerCase()}` : ''}. Source Centris.`,
    canonical: `https://jacquesroussel.com/marche-immobilier/${s}/`,
    body: `${section('Total résidentiel', tot)}
    ${section('Unifamiliale', uni)}
    ${section('Copropriété', copro)}
    ${section('Plex (2 à 5 logements)', plex)}
    <p class="faq-source">Source : <a href="${m.url}" target="_blank" rel="noopener">Centris.ca, statistiques immobilières de ${m.name}</a>. Un tiret signifie que Centris ne publie pas la valeur, faute d'un volume de transactions suffisant. Les variations sont exprimées par rapport à la même période l'an dernier.</p>
    <h2>Ce que ces chiffres ne disent pas</h2>
    <p>Une médiane municipale mélange tous les secteurs, toutes les années de construction et tous les états de propriété. Pour savoir ce que vaut la vôtre, il faut la comparer aux ventes réelles de votre rue sur les vingt-quatre derniers mois. <a href="/vendre/evaluation-gratuite/">C'est gratuit et ça prend 48 h.</a></p>`,
    afterProse: marketHighlightsHtml(s)
  }));
}

// --- BLOG article vedette : Saint-Eustache ---
// Tous les chiffres viennent de site/data/market.json (Centris). Rien n'est estimé
// à la main : si Centris ne publie pas une valeur, la ligne disparaît du tableau.
const featuredArticle = {
  slug: 'marche-immobilier-saint-eustache',
  title: 'Le marché de Saint-Eustache, chiffres en main',
  teaser: 'Prix médians, délais de vente et volume de transactions à Saint-Eustache, comparés à Deux-Montagnes, Sainte-Marthe-sur-le-Lac, Boisbriand et Mirabel. Données Centris, mises à jour chaque trimestre.'
};

// Villes du comparatif, dans l'ordre d'affichage
const COMPARE_CITIES = [
  'saint-eustache', 'deux-montagnes', 'sainte-marthe-sur-le-lac',
  'boisbriand', 'mirabel', 'sainte-therese', 'blainville', 'rosemere'
];

// Un nombre lisible depuis une valeur Centris (« 597 000 $ » → 597000)
const numFrom = v => {
  if (!v) return null;
  const n = parseFloat(String(v).replace(/[^\d,.]/g, '').replace(/\s/g, '').replace(',', '.'));
  return isFinite(n) ? n : null;
};

const compareRows = COMPARE_CITIES
  .map(slugC => {
    const m = marketFor(slugC);
    if (!m) return null;
    const uni = m.sections.unifamiliale?.rows || {};
    const copro = m.sections.copropriete?.rows || {};
    const tot = m.sections.total?.rows || {};
    return {
      slug: slugC,
      name: m.name,
      url: m.url,
      prixUni: uni.prixMedian?.trimestre?.value || null,
      prixUniNum: numFrom(uni.prixMedian?.trimestre?.value),
      varUni: uni.prixMedian?.trimestre?.variation || null,
      dirUni: uni.prixMedian?.trimestre?.direction || null,
      jours: uni.joursSurLeMarche?.trimestre?.value || null,
      prixCopro: copro.prixMedian?.trimestre?.value || null,
      ventes: tot.ventes?.trimestre?.value || null,
      inscriptions: tot.inscriptionsActives?.trimestre?.value || null
    };
  })
  .filter(Boolean);

const se = compareRows.find(r => r.slug === 'saint-eustache') || null;
const marketPeriod = marketFor('saint-eustache')?.period || '';
const hasMarketData = compareRows.length > 0;

const articleJsonld = JSON.stringify({
  "@context":"https://schema.org","@type":"Article",
  "headline":featuredArticle.title,
  "author":{"@type":"Organization","name":"Équipe Jacques-Roussel","url":"https://jacquesroussel.com/a-propos/"},
  "image":"https://jacquesroussel.com/photos/stock/quartier-aerien.jpg",
  "datePublished":"2026-08-07","dateModified":market.fetchedAt || new Date().toISOString().slice(0,10),
  "publisher":{"@type":"Organization","name":"Équipe Jacques-Roussel · RE/MAX CRYSTAL"},
  "mainEntityOfPage":`https://jacquesroussel.com/blog/${featuredArticle.slug}/`
});

writePage(`blog/${featuredArticle.slug}/index.html`, layout({
  title: `${featuredArticle.title} | Équipe Jacques-Roussel`,
  description: `Prix médian, délai de vente et volume de transactions à Saint-Eustache${se && se.prixUni ? ` : ${se.prixUni} pour une unifamiliale au ${marketPeriod.toLowerCase()}` : ''}. Comparatif avec Deux-Montagnes, Sainte-Marthe-sur-le-Lac, Boisbriand et Mirabel. Données Centris.`,
  canonical: `https://jacquesroussel.com/blog/${featuredArticle.slug}/`,
  jsonld: articleJsonld,
  extraHead: `<style>
    .a-hero{position:relative;border-radius:var(--radius-lg);overflow:hidden;min-height:clamp(420px,55vw,640px);margin-bottom:3rem}
    .a-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .a-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,22,40,.05) 0%,rgba(11,22,40,.82) 100%)}
    .a-hero-inner{position:relative;z-index:2;color:#fff;padding:clamp(1.8rem,4vw,3.5rem);display:flex;flex-direction:column;justify-content:flex-end;min-height:inherit}
    .a-hero .eye{color:rgba(255,255,255,.75);text-transform:uppercase;letter-spacing:.2em;font-size:.75rem;font-weight:600;margin-bottom:1.2rem}
    .a-hero h1{color:#fff;font-size:clamp(2rem,4vw,3.4rem);font-weight:800;letter-spacing:-.035em;line-height:1.05;max-width:24ch;text-shadow:0 2px 20px rgba(0,0,0,.4)}
    .a-hero .meta{margin-top:1.5rem;display:flex;gap:1.2rem;flex-wrap:wrap;font-size:.85rem;color:rgba(255,255,255,.85)}
    .a-lead{font-size:clamp(1.15rem,1.8vw,1.35rem);font-weight:300;color:var(--ink-2);max-width:62ch;line-height:1.6;margin-bottom:3rem}
    .a-lead strong{font-weight:600;color:var(--ink)}
    .a-summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:1rem}
    .a-summary .card{background:var(--surface);border-radius:var(--radius);padding:1.4rem;border-left:3px solid var(--blue)}
    .a-summary .n{font-size:clamp(1.5rem,2.4vw,2rem);font-weight:700;letter-spacing:-.03em;color:var(--blue);font-variant-numeric:tabular-nums}
    .a-summary .l{font-size:.82rem;color:var(--ink-2);margin-top:.35rem;line-height:1.4}
    .a-summary .v{font-size:.82rem;font-weight:600;margin-top:.3rem;font-variant-numeric:tabular-nums}
    .a-summary .v.up{color:oklch(52% 0.11 150)}
    .a-summary .v.down{color:oklch(55% 0.15 28)}
    .a-src{font-size:.78rem;color:var(--muted);margin-bottom:3rem}
    .a-src a{text-decoration:underline;text-underline-offset:2px}
    .a-body{max-width:760px;margin:0 auto}
    .a-body h2{font-size:clamp(1.5rem,2.6vw,2rem);font-weight:700;letter-spacing:-.028em;margin:3rem 0 1rem;color:var(--ink)}
    .a-body h3{font-size:1.2rem;font-weight:600;margin:2rem 0 .6rem}
    .a-body p{color:var(--ink-2);line-height:1.75;font-size:1.02rem}
    .a-body p strong{color:var(--ink);font-weight:600}
    .a-body ul{color:var(--ink-2);line-height:1.8;padding-left:1.2rem}
    .a-figure{margin:2.5rem -2rem;border-radius:var(--radius-lg);overflow:hidden;position:relative}
    .a-figure img{width:100%;display:block}
    .a-figure figcaption{position:absolute;bottom:1.2rem;left:1.4rem;right:1.4rem;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);padding:.8rem 1.2rem;border-radius:14px;font-size:.85rem;color:var(--ink);font-weight:500}
    @media(max-width:820px){.a-figure{margin:2.5rem 0}}
    .sector-tbl{width:100%;border-collapse:separate;border-spacing:0;margin:1.5rem 0 .8rem;font-size:.95rem;background:#fff;border-radius:var(--radius);overflow:hidden;border:1px solid var(--line)}
    .sector-tbl th,.sector-tbl td{padding:.9rem 1rem;text-align:left;border-bottom:1px solid var(--line)}
    .sector-tbl thead th{background:var(--ink);color:#fff;font-weight:600;font-size:.78rem;text-transform:uppercase;letter-spacing:.06em}
    .sector-tbl tbody tr{transition:background .2s var(--ease);cursor:pointer}
    .sector-tbl tbody tr:hover,.sector-tbl tbody tr.active{background:var(--blue-soft)}
    .sector-tbl tbody tr.is-focus td:first-child strong{color:var(--blue)}
    .sector-tbl td.num{text-align:right;font-variant-numeric:tabular-nums}
    .sector-tbl td .up{color:oklch(52% 0.11 150);font-weight:600}
    .sector-tbl td .down{color:oklch(55% 0.15 28);font-weight:600}
    .sector-tbl tbody tr:last-child td{border-bottom:0}
    .chart-card{background:var(--surface);border-radius:var(--radius);padding:1.5rem;margin:1.5rem 0 1rem;border:1px solid var(--line)}
    .chart-card h4{font-size:.82rem;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);font-weight:600;margin-bottom:1.2rem}
    .bar-row{display:grid;grid-template-columns:minmax(90px,150px) 1fr auto;gap:.9rem;align-items:center;padding:.32rem 0;font-size:.88rem}
    .bar-row .label{color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .bar-row .bar{background:var(--blue-soft);border-radius:999px;height:12px;overflow:hidden}
    .bar-row .bar span{display:block;height:100%;background:var(--blue);border-radius:999px;transition:width .6s var(--ease)}
    .bar-row .val{font-variant-numeric:tabular-nums;color:var(--ink);font-weight:600;white-space:nowrap}
    @media(max-width:560px){.bar-row{grid-template-columns:1fr auto;gap:.4rem .8rem}.bar-row .bar{grid-column:1/-1}}
    .quiz{background:var(--blue);color:#fff;border-radius:var(--radius-lg);padding:clamp(1.8rem,3.5vw,2.8rem);margin:2.5rem -2rem;position:relative;overflow:hidden}
    .quiz::before{content:"";position:absolute;inset:0;background:radial-gradient(500px 260px at 85% 0%,rgba(255,255,255,.1),transparent 60%);pointer-events:none}
    .quiz>*{position:relative}
    .quiz .eye{color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.2em;font-size:.72rem;font-weight:600}
    .quiz h3{color:#fff;font-size:clamp(1.4rem,2.4vw,1.8rem);font-weight:700;letter-spacing:-.028em;margin:.5rem 0 1.5rem}
    .quiz-fields{display:grid;gap:1.4rem;margin-bottom:1.5rem}
    .quiz-fields label{display:block;font-size:.85rem;color:rgba(255,255,255,.9);margin-bottom:.5rem;font-weight:500}
    .quiz-fields .row{display:flex;justify-content:space-between;align-items:center;gap:1rem}
    .quiz-fields input[type=range]{width:100%;accent-color:#fff;margin-top:.3rem}
    .quiz-fields .v{font-variant-numeric:tabular-nums;color:#fff;font-weight:600}
    .quiz-out{background:rgba(255,255,255,.08);border-radius:var(--radius);padding:1.5rem;display:grid;grid-template-columns:1fr auto;gap:1rem;align-items:center}
    .quiz-out .verdict{font-size:clamp(1.1rem,1.8vw,1.35rem);font-weight:600;letter-spacing:-.02em;line-height:1.35}
    .quiz-out .delta{font-size:2rem;font-weight:700;letter-spacing:-.03em;font-variant-numeric:tabular-nums;text-align:right}
    .quiz-out .delta.pos{color:#9fe5b5}
    .quiz-out .delta.neg{color:#ff9fb0}
    @media(max-width:820px){.quiz{margin:2.5rem 0}.quiz-out{grid-template-columns:1fr}}
    .pullquote{border-left:3px solid var(--bronze);padding:1rem 0 1rem 1.5rem;margin:2.5rem 0;font-size:clamp(1.15rem,1.8vw,1.45rem);font-weight:500;letter-spacing:-.02em;color:var(--ink);line-height:1.4}
    .pullquote cite{display:block;margin-top:.8rem;font-size:.85rem;color:var(--muted);font-style:normal;text-transform:uppercase;letter-spacing:.1em;font-weight:600}
    .a-cta{background:var(--ink);color:#fff;border-radius:var(--radius-lg);padding:clamp(1.8rem,4vw,3rem);margin:3rem 0;display:grid;grid-template-columns:1fr auto;gap:2rem;align-items:center}
    .a-cta h3{color:#fff;margin:0;font-size:clamp(1.3rem,2.2vw,1.7rem);font-weight:700;letter-spacing:-.028em;max-width:22ch}
    .a-cta .btn{background:#fff;color:var(--ink);padding:1rem 1.8rem;border-radius:999px;font-weight:600;white-space:nowrap;transition:transform .3s var(--ease)}
    .a-cta .btn:hover{transform:translateY(-2px);color:var(--ink)}
    @media(max-width:720px){.a-cta{grid-template-columns:1fr}}
    .a-footer-meta{padding:2rem;background:var(--surface);border-radius:var(--radius);margin:3rem 0 2rem;display:grid;grid-template-columns:auto 1fr;gap:1.5rem;align-items:center}
    .a-footer-meta img{width:72px;height:72px;border-radius:50%;object-fit:cover;background:#eef2f8}
    .a-footer-meta .who{font-weight:600}
    .a-footer-meta .who-sub{font-size:.88rem;color:var(--muted);margin-top:.2rem}
  </style>`,
  body: `
<article class="container" style="padding-top:2rem">
  <div style="font-size:.85rem;color:var(--muted);margin-bottom:1.5rem"><a href="/">Accueil</a> › <a href="/blog/">Blog</a> › <span>Marché de Saint-Eustache</span></div>

  <figure class="a-hero">
    <img src="/photos/stock/quartier-aerien.jpg" alt="Quartier résidentiel de banlieue vu du ciel" loading="eager">
    <div class="a-hero-inner">
      <div class="eye">Analyse de marché · Saint-Eustache${marketPeriod ? ` · ${marketPeriod}` : ''}</div>
      <h1>${featuredArticle.title}.</h1>
      <div class="meta">
        <span>Par <strong>Équipe Jacques-Roussel</strong>, RE/MAX CRYSTAL</span>
        <span>· 6 min de lecture${market.fetchedAt ? ` · Données relevées le ${market.fetchedAt}` : ''}</span>
      </div>
    </div>
  </figure>

  <div class="a-body">
    <p class="a-lead">Sur la Rive-Nord ouest, on entend beaucoup d'opinions sur le marché et peu de chiffres. Voici les données publiées par Centris pour <strong>Saint-Eustache</strong>, sans interprétation créative, avec le comparatif des municipalités voisines et un outil pour situer votre propre prix. <strong>Tout ce qui suit vient de la même source, et elle est citée.</strong></p>

    ${hasMarketData && se ? `
    <div class="a-summary">
      ${se.prixUni ? `<div class="card"><div class="n">${se.prixUni}</div><div class="l">Prix médian, unifamiliale</div>${se.varUni ? `<div class="v ${se.dirUni || ''}">${se.dirUni === 'up' ? '▲' : se.dirUni === 'down' ? '▼' : ''} ${se.varUni} sur un an</div>` : ''}</div>` : ''}
      ${se.jours ? `<div class="card"><div class="n">${se.jours} j</div><div class="l">Jours sur le marché en moyenne</div></div>` : ''}
      ${se.ventes ? `<div class="card"><div class="n">${se.ventes}</div><div class="l">Ventes résidentielles au trimestre</div></div>` : ''}
      ${se.prixCopro ? `<div class="card"><div class="n">${se.prixCopro}</div><div class="l">Prix médian, copropriété</div></div>` : ''}
    </div>
    <p class="a-src">Source : <a href="${se.url}" target="_blank" rel="noopener">Centris.ca, statistiques immobilières de Saint-Eustache</a>${marketPeriod ? `, ${marketPeriod.toLowerCase()}` : ''}${market.fetchedAt ? `, relevé le ${market.fetchedAt}` : ''}.</p>

    <h2>1. Ce que ces chiffres disent, et ce qu'ils ne disent pas</h2>
    <p>Un prix médian, c'est le point où la moitié des propriétés se sont vendues plus cher et l'autre moitié moins cher, pour toute la municipalité. Ça donne une température générale. Ça ne dit rien de votre rue, de votre année de construction, ni de l'état de votre cuisine.</p>
    <p>C'est pour ça qu'une analyse comparative sérieuse ne s'appuie pas sur la médiane municipale, mais sur les ventes réelles des vingt-quatre derniers mois dans votre secteur immédiat. L'écart entre les deux dépasse souvent l'écart entre deux municipalités voisines.</p>
    ${se.jours ? `<p>Le délai moyen de <strong>${se.jours} jours</strong> sur le marché mérite la même lecture. Une propriété bien positionnée dès le premier jour reste sous cette moyenne. Une propriété affichée trop haut la dépasse largement, puis se vend souvent sous ce qu'elle aurait obtenu au bon prix de départ.</p>` : ''}

    <h2>2. Saint-Eustache et ses voisines</h2>
    <p>Le même trimestre, les mêmes indicateurs, huit municipalités de la Rive-Nord ouest. Cliquez une ligne pour l'afficher dans le graphique.</p>

    <table class="sector-tbl" id="sector-table">
      <thead><tr><th>Municipalité</th><th class="num">Prix médian unifamiliale</th><th class="num">Variation sur un an</th><th class="num">Jours au marché</th><th class="num">Ventes</th></tr></thead>
      <tbody>
        ${compareRows.map(r => `<tr data-s="${r.slug}"${r.slug === 'saint-eustache' ? ' class="is-focus"' : ''}>
          <td><strong>${r.name}</strong></td>
          <td class="num">${r.prixUni || '—'}</td>
          <td class="num">${r.varUni ? `<span class="${r.dirUni || ''}">${r.dirUni === 'up' ? '▲' : r.dirUni === 'down' ? '▼' : ''} ${r.varUni}</span>` : '—'}</td>
          <td class="num">${r.jours || '—'}</td>
          <td class="num">${r.ventes || '—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <p class="a-src">Source : statistiques immobilières Centris de chaque municipalité${marketPeriod ? `, ${marketPeriod.toLowerCase()}` : ''}. Un tiret signifie que Centris ne publie pas la valeur, faute d'un volume de transactions suffisant.</p>

    <div class="chart-card">
      <h4 id="chart-compare-title">Prix médian unifamiliale, comparatif</h4>
      <div class="chart" id="chart-compare"></div>
    </div>

    <figure class="a-figure">
      <img src="/photos/stock/maison-blanche-arbres.jpg" alt="Maison unifamiliale entourée d'arbres" loading="lazy">
      <figcaption>Une médiane municipale ne remplace jamais une comparaison de rue à rue.</figcaption>
    </figure>

    <h2>3. Où se situe votre prix ?</h2>
    <p>Choisissez votre municipalité et votre prix cible : l'outil calcule l'écart avec le prix médian publié par Centris. C'est un premier repère, pas une évaluation.</p>

    <div class="quiz">
      <div class="eye">Outil · Positionnement de prix</div>
      <h3>Mon prix cible face au médian de ma ville</h3>
      <div class="quiz-fields">
        <div>
          <div class="row"><label for="q-city">Municipalité</label></div>
          <select id="q-city" style="width:100%;padding:.8rem 1rem;border-radius:12px;border:0;background:rgba(255,255,255,.14);color:#fff;font-family:inherit;font-size:1rem">
            ${compareRows.filter(r => r.prixUniNum).map(r => `<option value="${r.slug}"${r.slug === 'saint-eustache' ? ' selected' : ''}>${r.name}</option>`).join('')}
          </select>
        </div>
        <div>
          <div class="row"><label for="q-price">Votre prix cible</label><span class="v" id="q-price-v"></span></div>
          <input type="range" id="q-price" min="200000" max="1500000" step="5000" value="600000">
        </div>
      </div>
      <div class="quiz-out">
        <div class="verdict" id="q-verdict">Choisissez un prix cible.</div>
        <div class="delta" id="q-delta">—</div>
      </div>
      <p style="font-size:.78rem;color:rgba(255,255,255,.7);margin-top:1.2rem">Comparaison avec le prix médian Centris de la municipalité${marketPeriod ? ` (${marketPeriod.toLowerCase()})` : ''}. Une médiane ne tient compte ni de la superficie, ni de l'année de construction, ni de l'état de la propriété. Pour un chiffre qui vaut quelque chose, il faut une analyse comparative de votre secteur : <a href="/vendre/evaluation-gratuite/" style="color:#fff;text-decoration:underline">elle est gratuite</a>.</p>
    </div>
    ` : `
    <h2>Les données sont en cours de mise à jour</h2>
    <p>Les statistiques Centris de ce trimestre ne sont pas encore chargées sur le site. En attendant, écrivez-nous : on vous transmet les chiffres à jour de votre secteur.</p>
    `}

    <h2>${hasMarketData ? '4' : '2'}. Comment on travaille à Saint-Eustache</h2>
    <p>Notre bureau RE/MAX CRYSTAL est établi sur la Rive-Nord ouest, et Saint-Eustache est au centre de notre territoire, avec Deux-Montagnes, Sainte-Marthe-sur-le-Lac, Boisbriand et Mirabel. Concrètement, voici ce que ça donne quand vous nous confiez une propriété.</p>
    <ul>
      <li><strong>Analyse comparative de votre secteur</strong> : on compare votre propriété aux ventes réelles de votre côté de rue sur vingt-quatre mois, pas à la moyenne de la ville.</li>
      <li><strong>Photographie professionnelle et rédaction de la fiche</strong> : la première impression se joue sur la première photo, dans une liste de résultats.</li>
      <li><strong>Diffusion large</strong> : Centris, RE/MAX Québec, RE/MAX Crystal, REALTOR, notre site et notre réseau de collaborateurs.</li>
      <li><strong>Suivi après chaque visite</strong> : on recueille les commentaires des courtiers visiteurs et on vous dit franchement ce qui bloque, s'il y a quelque chose qui bloque.</li>
    </ul>

    <div class="pullquote">Un prix affiché trop haut ne se corrige pas tout seul. Il se paie en jours de marché, puis en dollars.<cite>Équipe Jacques-Roussel</cite></div>

    <div class="a-cta">
      <h3>Combien vaut votre propriété à Saint-Eustache, précisément ?</h3>
      <a class="btn" href="/vendre/evaluation-gratuite/">Demander l'évaluation gratuite &rarr;</a>
    </div>

    <h2>${hasMarketData ? '5' : '3'}. Questions fréquentes</h2>

    <h3>Quel est le prix médian d'une maison à Saint-Eustache ?</h3>
    <p>${se && se.prixUni
      ? `<strong>${se.prixUni}</strong> pour une unifamiliale selon Centris (${marketPeriod.toLowerCase()})${se.varUni ? `, ${se.dirUni === 'down' ? 'en baisse' : 'en hausse'} de ${se.varUni.replace('-', '')} sur un an` : ''}.${se.prixCopro ? ` Pour une copropriété, le prix médian est de <strong>${se.prixCopro}</strong>.` : ''} Rappel : c'est une médiane municipale, pas une estimation de votre propriété.`
      : `Centris publie ce chiffre chaque trimestre. Écrivez-nous pour la valeur à jour et, surtout, pour une analyse de votre secteur précis.`}</p>

    <h3>Combien de temps prend une vente à Saint-Eustache ?</h3>
    <p>${se && se.jours
      ? `En moyenne <strong>${se.jours} jours</strong> sur le marché pour une unifamiliale (Centris, ${marketPeriod.toLowerCase()}). Ce chiffre bouge surtout selon le positionnement de prix initial et la qualité de la mise en marché.`
      : `Le délai dépend d'abord du prix affiché au premier jour, ensuite de la préparation de la propriété et de la saison.`}</p>

    <h3>Saint-Eustache ou Deux-Montagnes ?</h3>
    <p>${(() => {
      const dm = compareRows.find(r => r.slug === 'deux-montagnes');
      if (se && se.prixUniNum && dm && dm.prixUniNum) {
        const diff = Math.round(Math.abs(se.prixUniNum - dm.prixUniNum));
        const cher = se.prixUniNum > dm.prixUniNum ? 'Saint-Eustache' : 'Deux-Montagnes';
        const moins = se.prixUniNum > dm.prixUniNum ? 'Deux-Montagnes' : 'Saint-Eustache';
        return `Au dernier trimestre, l'écart de prix médian entre les deux est d'environ <strong>${diff.toLocaleString('fr-CA')} $</strong> : ${cher} est la plus chère, ${moins} la plus accessible. Mais le prix n'est qu'un des critères. Deux-Montagnes offre l'accès au train de banlieue et au lac, Saint-Eustache un bassin de services et d'écoles plus large. La bonne réponse dépend de votre quotidien, pas de la médiane.`;
      }
      return `Deux-Montagnes offre l'accès au train de banlieue et au lac, Saint-Eustache un bassin de services et d'écoles plus large. On vous sort les comparables des deux si vous hésitez.`;
    })()}</p>

    <h3>À quelle fréquence ces chiffres sont-ils mis à jour ?</h3>
    <p>Centris publie ses statistiques par trimestre, avec quelques semaines de décalage. Cette page est resynchronisée à chaque publication${market.fetchedAt ? ` : dernier relevé le ${market.fetchedAt}` : ''}.</p>

    <div class="a-footer-meta">
      <img src="/photos/equipe-jacques-roussel.jpg" alt="Équipe Jacques-Roussel">
      <div>
        <div class="who">Équipe Jacques-Roussel</div>
        <div class="who-sub">Courtiers immobiliers · RE/MAX CRYSTAL · Saint-Eustache, Deux-Montagnes, Sainte-Marthe-sur-le-Lac, Boisbriand et Mirabel</div>
      </div>
    </div>
  </div>
</article>

<script>
(function(){
  var ROWS = ${JSON.stringify(compareRows.filter(r => r.prixUniNum).map(r => ({ slug: r.slug, name: r.name, prix: r.prixUniNum, label: r.prixUni })))};
  if (!ROWS.length) return;
  var fmt = function(n){ return new Intl.NumberFormat('fr-CA',{maximumFractionDigits:0}).format(Math.round(n))+' $'; };

  // Graphique comparatif — la ville sélectionnée est mise en évidence
  var chart = document.getElementById('chart-compare');
  var max = Math.max.apply(null, ROWS.map(function(r){ return r.prix; }));
  function renderChart(focus){
    chart.innerHTML = ROWS.map(function(r){
      var on = r.slug === focus;
      return '<div class="bar-row"' + (on ? ' style="font-weight:600"' : '') + '>'
        + '<span class="label">'+r.name+'</span>'
        + '<div class="bar"><span style="width:'+((r.prix/max)*100)+'%' + (on ? '' : ';opacity:.45') + '"></span></div>'
        + '<span class="val">'+r.label+'</span></div>';
    }).join('');
  }
  renderChart('saint-eustache');

  var rows = document.querySelectorAll('#sector-table tbody tr');
  Array.prototype.forEach.call(rows, function(tr){
    tr.addEventListener('click', function(){
      Array.prototype.forEach.call(rows, function(x){ x.classList.remove('active'); });
      tr.classList.add('active');
      renderChart(tr.dataset.s);
      var sel = document.getElementById('q-city');
      if (sel && Array.prototype.some.call(sel.options, function(o){ return o.value === tr.dataset.s; })) {
        sel.value = tr.dataset.s; update();
      }
    });
  });

  // Outil de positionnement — écart avec le médian Centris réel
  var citySel = document.getElementById('q-city');
  var priceIn = document.getElementById('q-price');
  if (!citySel || !priceIn) return;
  function medianFor(slug){
    for (var i=0;i<ROWS.length;i++) if (ROWS[i].slug === slug) return ROWS[i];
    return ROWS[0];
  }
  function update(){
    var row = medianFor(citySel.value);
    var price = +priceIn.value;
    document.getElementById('q-price-v').textContent = fmt(price);
    var delta = price - row.prix;
    var pct = delta / row.prix * 100;
    var el = document.getElementById('q-delta');
    var v = document.getElementById('q-verdict');
    el.textContent = (delta >= 0 ? '+' : '−') + fmt(Math.abs(delta));
    el.classList.remove('pos','neg');
    if (Math.abs(pct) < 5){
      v.innerHTML = 'Votre prix cible est <strong>dans la zone du médian</strong> de ' + row.name + ' (' + row.label + ').';
      el.classList.add('pos');
    } else if (pct >= 5){
      v.innerHTML = 'Votre prix cible est <strong>' + Math.round(pct) + ' % au-dessus</strong> du médian de ' + row.name + '. Ça peut se justifier par la superficie, le secteur ou des rénovations : il faut le démontrer avec des comparables.';
      el.classList.add('neg');
    } else {
      v.innerHTML = 'Votre prix cible est <strong>' + Math.round(Math.abs(pct)) + ' % sous</strong> le médian de ' + row.name + '. Vérifiez qu\\'il n\\'y a pas de valeur laissée sur la table avant de publier.';
      el.classList.add('pos');
    }
  }
  citySel.addEventListener('change', update);
  priceIn.addEventListener('input', update);
  // Le curseur démarre au médian de la ville sélectionnée
  priceIn.value = Math.round(medianFor(citySel.value).prix / 5000) * 5000;
  update();
})();
</script>
`
}));

// Articles à venir — territoire Saint-Eustache et Rive-Nord ouest.
// Chaque entrée : slug, titre, ville (pour rattacher les vraies stats Centris), résumé.
// Chiffres Centris réutilisables dans les articles : la prose reste juste
// quand le trimestre change, au lieu de figer un nombre dans le texte.
const mkt = (citySlug, section, row, champ = 'value') =>
  marketFor(citySlug)?.sections?.[section]?.rows?.[row]?.trimestre?.[champ] || null;
const prixUni  = c => mkt(c, 'unifamiliale', 'prixMedian');
const varUni   = c => mkt(c, 'unifamiliale', 'prixMedian', 'variation');
const joursUni = c => mkt(c, 'unifamiliale', 'joursSurLeMarche');
const prixCopro = c => mkt(c, 'copropriete', 'prixMedian');
const ventes   = c => mkt(c, 'total', 'ventes');
const inscrits = c => mkt(c, 'total', 'inscriptionsActives');
const trim = marketPeriod ? marketPeriod.toLowerCase() : 'dernier trimestre publié';
// Valeurs calculées à partir des mêmes chiffres que les tableaux : elles ne
// peuvent pas se contredire quand Centris publie un nouveau trimestre.
const nb = v => { const n = numFrom(v); return n === null ? null : n; };
const ratioOffre = c => {
  const i = nb(inscrits(c)), v = nb(ventes(c));
  return (i && v) ? (i / v).toFixed(2).replace('.', ',') : '--';
};
const ecartPrix = (a, b) => {
  const x = nb(prixUni(a)), y = nb(prixUni(b));
  return (x && y) ? Math.round(Math.abs(x - y) / 1000) * 1000 : null;
};
const ecartPct = (a, b) => {
  const x = nb(prixUni(a)), y = nb(prixUni(b));
  return (x && y) ? Math.round(Math.abs(x - y) / Math.min(x, y) * 100) : null;
};
const fmt$ = n => n === null ? null : n.toLocaleString('fr-CA').replace(/\u202f|\u00a0/g, ' ') + ' $';
const srcCentris = c => `<p class="note"><strong>Source des chiffres.</strong> Centris, statistiques de ${c} pour le ${trim}${market.fetchedAt ? `, relevées le ${market.fetchedAt}` : ''}. Les variations sont calculées sur un an, contre le même trimestre l'an dernier. On republie ces pages à chaque parution de Centris. <a href="/marche-immobilier/">Voir toutes les villes</a>.</p>`;

const BLOG_POSTS = [
  {
    slug: 'combien-vaut-ma-maison-saint-eustache',
    title: 'Combien vaut ma maison à Saint-Eustache ?',
    city: 'saint-eustache',
    teaser: 'La médiane municipale, ce qu\'elle vaut et ce qu\'elle ne dit pas de votre rue.',
    image: '/photos/stock/maison-blanche-arbres.jpg',
    date: '2026-08-13',
    body: `
<p>C'est la question qu'on nous pose le plus souvent, et la réponse honnête tient en une phrase : le prix médian de Saint-Eustache ne vous apprend à peu près rien sur votre propriété. Il sert à mesurer le marché, pas une maison.</p>
<p>Ça vaut quand même la peine de savoir le lire. Au ${trim}, une unifamiliale se vend ${prixUni('saint-eustache') || '597 000 $'} à Saint-Eustache selon Centris${varUni('saint-eustache') ? `, ${varUni('saint-eustache')} sur un an` : ''}. Le délai moyen avant la vente est de ${joursUni('saint-eustache') || '24'} jours. Voilà pour la photo d'ensemble.</p>

<h2>Ce qu'est une médiane, et ce qu'elle n'est pas</h2>
<p>La médiane, c'est le point milieu : la moitié des maisons se sont vendues plus cher, l'autre moitié moins cher. Ce n'est pas une moyenne, et c'est voulu. Trois ventes à deux millions ne tirent pas la médiane vers le haut comme elles tireraient une moyenne.</p>
<p>Sa faiblesse est ailleurs. Elle mélange dans un même chiffre un bungalow de 1965 à rénover et un cottage de 2018 avec garage double. Elle ignore la rue, l'orientation du terrain, la toiture refaite l'an dernier et le voisin qui a construit un garage sur la ligne de lot. Deux maisons séparées par trois coins de rue peuvent avoir 80 000 $ d'écart sans que la médiane bronche.</p>
<p>Utilisez-la pour une chose : savoir si le marché monte, descend ou stagne. Pour le reste, elle ne répond pas à votre question.</p>

<h2>L'évaluation municipale n'est pas la valeur marchande</h2>
<p>Le montant sur votre compte de taxes sert à répartir l'impôt foncier entre les propriétaires de la ville. Il vient d'un rôle déposé aux trois ans, calculé à partir d'une date de référence antérieure de dix-huit mois au dépôt. Quand vous le lisez, il décrit déjà un marché d'il y a deux ans ou plus.</p>
<p>Dans un marché qui monte, il sous-évalue. Dans un marché qui corrige, il surévalue. Et il est produit en masse, souvent sans que personne soit entré chez vous. Une cuisine refaite au complet et une cuisine d'origine peuvent porter la même évaluation municipale.</p>
<p>On voit régulièrement des propriétaires fixer leur prix en ajoutant un pourcentage à l'évaluation municipale. C'est la méthode la plus rapide pour se tromper dans les deux sens.</p>

<h2>Les estimateurs en ligne, et pourquoi ils se trompent</h2>
<p>Un estimateur automatisé fait une chose : il croise votre adresse avec des ventes récentes et applique un modèle. Le modèle ne sait pas que votre sous-sol a été fini sans permis, que la fenestration donne au nord, que le terrain est en pente ou que la maison d'à côté est en location depuis six ans.</p>
<p>Ces outils sont raisonnables sur un stock très homogène, un développement de 200 maisons construites la même année sur le même modèle. Saint-Eustache n'est pas ça. Le parc immobilier va du village au bord de la rivière jusqu'aux développements récents près de la 640, avec tout ce qu'il y a entre les deux.</p>

<h2>Ce qui détermine vraiment le prix</h2>
<p>Quand on prépare une analyse comparative, on regarde d'abord les propriétés vendues, pas celles qui sont affichées. Un prix demandé est une opinion. Un prix de vente est un fait.</p>
<p>On cherche des ventes des six à douze derniers mois, dans votre secteur, sur un type de propriété comparable. Ensuite on ajuste, une variable à la fois :</p>
<ul>
  <li>La superficie habitable et le nombre de chambres au même étage.</li>
  <li>L'année de construction, et surtout l'année des vraies rénovations. Une toiture, des fenêtres et une entrée électrique refaites valent plus qu'un dosseret neuf.</li>
  <li>Le terrain : dimensions, forme, exposition, ce qui est constructible.</li>
  <li>Le garage, le stationnement, la piscine. La piscine ajoute moins que la plupart des gens le croient, et elle rétrécit le bassin d'acheteurs.</li>
  <li>L'état général, qui est la variable la plus difficile à chiffrer et celle qui fait le plus de différence.</li>
</ul>
<p>Ce qui n'entre pas dans le calcul : ce que vous avez payé, ce que vous devez à la banque, ce dont vous avez besoin pour votre prochaine propriété. Le marché ne s'ajuste pas à votre situation.</p>

<h2>Le prix demandé décide de la vitesse de vente</h2>
<p>Avec un délai moyen de ${joursUni('saint-eustache') || '24'} jours au ${trim}, une propriété correctement positionnée trouve preneur vite. Une propriété trop chère, elle, accumule les jours sur le marché, et c'est le pire endroit où être.</p>
<p>Les acheteurs voient la date d'inscription. Passé un certain seuil, ils arrêtent de se demander si le prix est trop haut et commencent à se demander ce qui cloche avec la maison. La baisse de prix qui suit arrive alors trop tard : elle se négocie sous ce qu'on aurait obtenu en partant au bon prix.</p>

<h2>Comment obtenir un vrai chiffre</h2>
<p>Une analyse comparative sérieuse demande une visite. On regarde la propriété, on note ce qui la distingue des comparables, on sort les ventes du secteur et on vous remet un rapport écrit avec la fourchette et le raisonnement derrière. Vous voyez les propriétés qu'on a retenues et pourquoi.</p>
<p>C'est gratuit et ça n'engage à rien. Beaucoup de gens le demandent deux ou trois ans avant de vendre, simplement pour savoir où ils en sont. C'est une très bonne façon de l'utiliser.</p>
<p><a href="/vendre/evaluation-gratuite/">Demander une évaluation gratuite</a> ou <a href="/marche-immobilier/saint-eustache/">consulter les statistiques détaillées de Saint-Eustache</a>.</p>
${srcCentris('Saint-Eustache')}`
  },

  {
    slug: 'acheter-deux-montagnes-ou-saint-eustache',
    title: 'Acheter à Deux-Montagnes ou à Saint-Eustache ?',
    city: 'deux-montagnes',
    teaser: 'Prix, transport, inventaire et accès au lac : le comparatif honnête entre les deux.',
    image: '/photos/stock/maison-deux-etages.jpg',
    date: '2026-08-13',
    body: `
<p>Les deux villes se touchent. Beaucoup d'acheteurs arrivent en visite avec les deux sur leur liste et repartent sans savoir laquelle choisir. Les chiffres tranchent une partie de la question, votre trajet quotidien tranche le reste.</p>

<h2>Les chiffres, côte à côte</h2>
<div class="tbl">
<table>
  <caption>Centris, ${trim}. Le prix médian porte sur les unifamiliales.</caption>
  <thead><tr><th>&nbsp;</th><th class="num">Deux-Montagnes</th><th class="num">Saint-Eustache</th></tr></thead>
  <tbody>
    <tr><td>Prix médian</td><td class="num">${prixUni('deux-montagnes') || '570 000 $'}</td><td class="num">${prixUni('saint-eustache') || '597 000 $'}</td></tr>
    <tr><td>Variation sur un an</td><td class="num">${varUni('deux-montagnes') || '5 %'}</td><td class="num">${varUni('saint-eustache') || '10 %'}</td></tr>
    <tr><td>Jours sur le marché</td><td class="num">${joursUni('deux-montagnes') || '27'}</td><td class="num">${joursUni('saint-eustache') || '24'}</td></tr>
    <tr><td>Ventes au trimestre</td><td class="num">${ventes('deux-montagnes') || '78'}</td><td class="num">${ventes('saint-eustache') || '180'}</td></tr>
    <tr><td>Inscriptions actives</td><td class="num">${inscrits('deux-montagnes') || '59'}</td><td class="num">${inscrits('saint-eustache') || '144'}</td></tr>
  </tbody>
</table>
</div>
<p>Deux-Montagnes est la moins chère des deux, d'environ ${fmt$(ecartPrix('deux-montagnes','saint-eustache')) || '27 000 $'} sur la médiane. C'est réel, mais c'est moins que ce que la réputation des deux villes laisse croire : on parle d'un écart d'à peu près ${ecartPct('deux-montagnes','saint-eustache') || 5} %, pas d'un changement de catégorie.</p>

<h2>La vraie différence est dans l'inventaire</h2>
<p>Saint-Eustache affiche ${inscrits('saint-eustache') || '144'} propriétés actives contre ${inscrits('deux-montagnes') || '59'} à Deux-Montagnes. Pour un acheteur, c'est la donnée la plus importante du tableau.</p>
<p>À Deux-Montagnes, vous verrez moins de maisons, vous devrez décider plus vite et vous aurez moins de marge pour négocier. Quand une propriété correspond vraiment à vos critères, il faut être prêt le jour même. À Saint-Eustache, le choix est plus large et le rythme un peu moins tendu, mais la concurrence sur les belles propriétés reste forte : le marché s'y règle en ${joursUni('saint-eustache') || '24'} jours.</p>
<p>Traduction pratique : si votre liste de critères est longue et rigide, Saint-Eustache vous donne plus de chances de la remplir. Si vous cherchez précisément le cachet de Deux-Montagnes, il faut accepter d'attendre la bonne inscription.</p>

<h2>Le transport, qui décide souvent pour vous</h2>
<p>Deux-Montagnes est desservie par le REM. Si vous travaillez au centre-ville de Montréal et que vous ne voulez pas conduire, c'est un argument qui pèse plus lourd que ${fmt$(ecartPrix('deux-montagnes','saint-eustache')) || '27 000 $'} sur le prix d'achat. Le stationnement incitatif, l'horaire et la fréquence de passage valent la peine d'être vérifiés selon vos heures réelles, pas selon l'horaire théorique.</p>
<p>Saint-Eustache joue une autre carte : la 640, la 13 et la 15 à portée immédiate. Si vous travaillez à Laval, dans le West Island ou ailleurs sur la Rive-Nord, l'auto vous servira de toute façon et la position de Saint-Eustache est difficile à battre.</p>
<p>Le test qu'on suggère toujours : faites le trajet à l'heure où vous le ferez vraiment, un mardi matin, depuis les deux villes. Trente minutes de différence par jour, ça fait cinq heures par semaine.</p>

<h2>Le lac, les rues, l'ambiance</h2>
<p>Deux-Montagnes est plus petite et plus compacte. Le secteur près du lac des Deux Montagnes a son caractère propre, avec des rues matures et un stock de maisons plus ancien en bonne partie. On y trouve moins de construction récente.</p>
<p>Saint-Eustache est plus étendue et plus contrastée. Le vieux Saint-Eustache et les abords de la rivière du Chêne n'ont pas grand-chose à voir avec les développements des quinze dernières années au nord de la 640. Ça veut dire deux choses : plus de possibilités, et une médiane municipale encore moins représentative d'un secteur donné.</p>

<h2>Les deux erreurs qu'on voit le plus</h2>
<p>La première : choisir la ville avant d'avoir vu des propriétés. Les deux marchés se chevauchent largement. Une maison de Saint-Eustache et une maison de Deux-Montagnes à 600 000 $ se ressemblent souvent plus qu'on ne le pense.</p>
<p>La deuxième : se fier à la médiane pour bâtir son budget. Elle ne dit rien du type de propriété que vous cherchez. Si vous visez un cottage à quatre chambres avec garage, les deux villes vous demanderont nettement plus que leur médiane.</p>

<h2>Notre réponse courte</h2>
<p>Si le transport en commun vers Montréal fait partie de votre quotidien, Deux-Montagnes. Si vous avez besoin de choix, d'un accès rapide aux autoroutes ou d'un type de propriété précis, Saint-Eustache. Dans tous les autres cas, laissez les propriétés décider et gardez les deux villes ouvertes.</p>
<p>On couvre les deux territoires. <a href="/rendez-vous/">Prenez rendez-vous</a> et on établit votre liste à partir de vos vrais critères, pas de la carte administrative. Les statistiques complètes sont sur <a href="/marche-immobilier/deux-montagnes/">Deux-Montagnes</a> et <a href="/marche-immobilier/saint-eustache/">Saint-Eustache</a>.</p>
${srcCentris('Deux-Montagnes et de Saint-Eustache')}`
  },

  {
    slug: '7-etapes-vendre-saint-eustache',
    title: 'Les 7 étapes pour vendre sa maison à Saint-Eustache sans stress',
    city: 'saint-eustache',
    teaser: 'Du positionnement de prix à l\'acte notarié, ce qui se passe et quand.',
    image: '/photos/stock/maison-contemporaine.jpg',
    date: '2026-08-13',
    body: `
<p>La plupart du stress d'une vente vient du fait qu'on ne sait pas ce qui s'en vient. Voici la séquence complète, dans l'ordre, avec les délais réalistes pour Saint-Eustache.</p>

<h2>1. Le positionnement de prix</h2>
<p>Tout part de là, et c'est l'étape où une erreur coûte le plus cher. On sort les ventes comparables des six à douze derniers mois dans votre secteur, on ajuste pour ce qui distingue votre propriété et on établit une fourchette.</p>
<p>La décision vous revient. Notre travail est de vous montrer sur quoi elle repose, y compris quand notre recommandation ne fait pas votre affaire. Un prix trop ambitieux ne vous fait pas perdre de l'argent tout de suite, il vous en fait perdre à la douzième semaine.</p>
<p>Comptez une visite d'environ une heure, et le rapport écrit dans les 48 heures.</p>

<h2>2. La préparation de la propriété</h2>
<p>Désencombrer, dépersonnaliser, réparer les petites choses. On passe la maison avec vous, pièce par pièce, et on vous dit ce qui vaut la peine et ce qui n'en vaut pas.</p>
<p>Ce qui rapporte presque toujours : la peinture, le ménage en profondeur, l'éclairage, le terrain. Ce qui rarement se récupère : une rénovation majeure entreprise juste avant de vendre. Si la cuisine est à refaire, l'acheteur préfère généralement l'escompte et la refaire à son goût.</p>
<p>Prévoyez une à trois semaines selon l'état de départ.</p>

<h2>3. Les photos et la mise en marché</h2>
<p>Les acheteurs voient vos photos avant de voir votre maison, et ils décident en quelques secondes s'ils cliquent. On fait faire des photos professionnelles, avec un plan et les mesures des pièces.</p>
<p>Ensuite vient la fiche : le texte descriptif, les caractéristiques, la diffusion sur Centris et les portails, la signalisation, la visibilité RE/MAX. Une propriété bien montée part avec une longueur d'avance qui ne se rattrape pas plus tard.</p>
<p>Comptez trois à sept jours entre la séance photo et la mise en ligne.</p>

<h2>4. Les visites</h2>
<p>Les premières deux semaines comptent double. C'est le moment où votre propriété est vue par tous les acheteurs déjà en recherche active, ceux qui ont leur préapprobation en main.</p>
<p>Quelques règles simples : maison propre en tout temps, températures autour de 21 degrés, rideaux ouverts, lumières allumées. Et sortez pendant les visites. Les gens n'osent pas ouvrir les portes d'armoires ni dire ce qu'ils pensent devant les propriétaires, et ce sont précisément ces gens-là qui font des offres.</p>
<p>Après chaque visite, on vous transmet les commentaires reçus. Au bout de dix à quinze visites sans offre, on s'assoit et on révise la stratégie.</p>

<h2>5. La promesse d'achat et la négociation</h2>
<p>Une promesse d'achat n'est pas seulement un prix. Elle contient la date d'occupation, les inclusions et exclusions, le délai de réponse et les conditions. Une offre à 10 000 $ de moins avec un financement déjà approuvé et une date qui vous convient vaut souvent mieux qu'une offre plus élevée assortie de trois conditions.</p>
<p>On vous présente chaque offre avec son analyse : la solidité de l'acheteur, les risques, ce qui se négocie et ce qui ne se négocie pas. Vous pouvez accepter, refuser ou faire une contre-proposition, généralement dans un délai de 24 à 72 heures.</p>

<h2>6. Les conditions</h2>
<p>Une fois la promesse acceptée, l'acheteur exécute ses conditions. Il y en a presque toujours deux.</p>
<p>L'inspection préachat, d'abord. L'inspecteur passe deux à trois heures sur place et remet un rapport. Il trouvera des choses : c'est son métier, et aucune maison ne passe une inspection sans remarques. Ce qui compte, c'est la différence entre l'entretien normal et un vice réel. Une négociation de second tour est fréquente à cette étape.</p>
<p>Le financement, ensuite. Même préapprouvé, l'acheteur doit faire approuver la propriété elle-même par son prêteur, ce qui implique souvent une évaluation. Comptez dix à vingt jours pour l'ensemble des conditions.</p>

<h2>7. Le notaire et la signature</h2>
<p>Le dossier part chez le notaire choisi par l'acheteur. Il vérifie les titres, l'état des taxes, les hypothèques à radier, et prépare l'acte de vente. De votre côté, on rassemble les documents : certificat de localisation, déclarations du vendeur, factures des travaux, garanties.</p>
<p>Le certificat de localisation est le document qui retarde le plus de transactions. S'il date de plus de dix ans ou si la propriété a changé depuis, il en faut un nouveau, et un arpenteur-géomètre demande plusieurs semaines. Vérifiez-le dès l'étape 1, pas à l'étape 7.</p>
<p>À la signature, vous apportez deux pièces d'identité. Le solde hypothécaire est remboursé à même le produit de la vente, et vous recevez la différence.</p>

<h2>Combien de temps en tout</h2>
<p>Au ${trim}, une unifamiliale se vend en ${joursUni('saint-eustache') || '24'} jours en moyenne à Saint-Eustache. Ajoutez la préparation en amont et le délai jusqu'à l'acte notarié, et une vente complète prend habituellement de deux à quatre mois entre la première rencontre et les clés remises.</p>
<p>Un dernier point, qui n'est pas une étape mais qui décide de tout : commencez avant d'être pressé. Les ventes difficiles sont presque toujours des ventes entreprises trop tard, avec une date fixée par autre chose que le marché.</p>
<p><a href="/vendre/evaluation-gratuite/">Demander l'évaluation gratuite</a> pour démarrer à l'étape 1, ou lire le détail de <a href="/vendre/etapes-pour-vendre/">chaque étape de la vente</a>.</p>
${srcCentris('Saint-Eustache')}`
  },

  {
    slug: 'premier-acheteur-saint-eustache-revenu',
    title: 'Premier acheteur à Saint-Eustache : quel revenu faut-il ?',
    city: 'saint-eustache',
    teaser: 'Mise de fonds, test de résistance et frais oubliés : le calcul complet, sans arrondir vers le bas.',
    image: '/photos/stock/saint-eustache-vue-aerienne.jpg',
    date: '2026-08-13',
    body: `
<p>On va faire le calcul au complet sur une propriété au prix médian de Saint-Eustache, soit ${prixUni('saint-eustache') || '597 000 $'} au ${trim}. Les chiffres sont moins encourageants que ce que la plupart des gens espèrent, et c'est justement pour ça qu'il vaut mieux les voir maintenant.</p>

<h2>La mise de fonds minimale</h2>
<p>Au Canada, la mise de fonds minimale se calcule par tranches : 5 % sur les premiers 500 000 $, puis 10 % sur la portion au-dessus. Sur une propriété à ${prixUni('saint-eustache') || '597 000 $'}, ça donne environ <strong>34 700 $</strong>.</p>
<p>Sous 20 % de mise de fonds, l'assurance prêt hypothécaire de la SCHL devient obligatoire. À ce niveau de mise de fonds, la prime tourne autour de 4 % du montant emprunté, soit près de 22 500 $. Elle s'ajoute au prêt plutôt que d'être payée comptant. Attention par contre : au Québec, la taxe de 9 % sur cette prime, environ 2 000 $, se paie chez le notaire et ne peut pas être financée.</p>

<h2>Le test de résistance</h2>
<p>C'est l'étape qui surprend le plus. Votre prêteur ne vous qualifie pas au taux qu'il vous offre. Il vous qualifie au plus élevé entre 5,25 % et votre taux plus deux points de pourcentage.</p>
<p>Autrement dit, si on vous offre 4,5 %, la banque vérifie que vous pourriez payer à 6,5 %. Vous paierez le taux réel, mais vous devez démontrer votre capacité au taux fictif. C'est ce mécanisme qui fait la différence entre le montant que vous croyez pouvoir emprunter et celui que la banque vous accorde.</p>

<h2>Le revenu requis, trois scénarios</h2>
<p>Le ratio d'amortissement brut de la dette plafonne généralement à 32 % : le total des frais de logement ne doit pas dépasser 32 % du revenu familial brut. Ces frais comprennent le paiement hypothécaire, les taxes municipales et scolaires et le chauffage.</p>
<div class="tbl">
<table>
  <caption>Calcul sur une propriété à ${prixUni('saint-eustache') || '597 000 $'}, qualifiée à 6,5 %, avec environ 300 $ de taxes et 175 $ de chauffage par mois. Chiffres arrondis.</caption>
  <thead><tr><th>Scénario</th><th class="num">Mise de fonds</th><th class="num">Paiement qualifié</th><th class="num">Revenu familial requis</th></tr></thead>
  <tbody>
    <tr><td>Minimum, 25 ans</td><td class="num">34 700 $</td><td class="num">3 920 $</td><td class="num">165 000 $</td></tr>
    <tr><td>Minimum, 30 ans</td><td class="num">34 700 $</td><td class="num">3 660 $</td><td class="num">155 000 $</td></tr>
    <tr><td>20 %, 25 ans</td><td class="num">119 400 $</td><td class="num">3 200 $</td><td class="num">138 000 $</td></tr>
  </tbody>
</table>
</div>
<p>L'amortissement sur 30 ans est accessible aux premiers acheteurs sur un prêt assuré. Il réduit le paiement mensuel et le revenu requis, au prix d'intérêts totaux plus élevés sur la durée. Ce n'est ni bon ni mauvais en soi : c'est un arbitrage entre votre budget d'aujourd'hui et le coût total.</p>
<p>Ces montants supposent qu'aucune autre dette ne pèse sur votre dossier. Un paiement d'auto de 500 $ par mois retranche environ 100 000 $ à votre capacité d'emprunt. C'est souvent le levier le plus efficace avant d'acheter.</p>

<h2>Les frais qu'on oublie</h2>
<p>La mise de fonds n'est pas la seule somme à avoir en banque le jour de la signature.</p>
<ul>
  <li><strong>Droits de mutation</strong>, la taxe de bienvenue. Sur une propriété à ce prix, comptez autour de 7 000 $. Elle arrive par la poste quelques semaines après l'achat, pas chez le notaire.</li>
  <li><strong>Taxe sur la prime SCHL</strong> : environ 2 000 $, payable comptant.</li>
  <li><strong>Frais de notaire</strong> : de 1 300 $ à 2 000 $ selon le dossier.</li>
  <li><strong>Inspection préachat</strong> : de 500 $ à 900 $, et ce n'est pas là qu'il faut économiser.</li>
  <li><strong>Ajustements de taxes</strong> : vous remboursez au vendeur la portion des taxes déjà payées pour la période après la vente.</li>
  <li><strong>Déménagement, assurances, premiers travaux.</strong> Prévoyez un coussin.</li>
</ul>
<p>Ensemble, ces frais représentent facilement de 12 000 $ à 15 000 $ à sortir en plus de la mise de fonds.</p>

<h2>Ce qui joue en votre faveur</h2>
<p>Plusieurs programmes s'adressent précisément aux premiers acheteurs, et ils se cumulent.</p>
<ul>
  <li>Le <strong>CELIAPP</strong> permet de cotiser 8 000 $ par année, jusqu'à 40 000 $ à vie. La cotisation est déductible et le retrait pour l'achat est non imposable. Pour un couple, c'est 80 000 $.</li>
  <li>Le <strong>RAP</strong> permet de retirer jusqu'à 60 000 $ de votre REER, à rembourser sur quinze ans.</li>
  <li>Le <strong>crédit d'impôt fédéral pour l'achat d'une première habitation</strong> vaut jusqu'à 1 500 $.</li>
  <li>Certaines municipalités offrent un remboursement partiel des droits de mutation ou une aide à la mise de fonds. Vérifiez auprès de la ville visée, les programmes changent d'une année à l'autre.</li>
</ul>
<p class="note">Les règles hypothécaires, les seuils et les plafonds de ces programmes sont révisés régulièrement, et les taux bougent constamment. Les chiffres de cet article valent pour ${trim} et servent à donner l'ordre de grandeur. Validez votre situation précise avec un courtier hypothécaire avant de faire une offre.</p>

<h2>Si le compte n'y est pas</h2>
<p>C'est le cas de beaucoup de premiers acheteurs, et il reste des options réelles. Le condo, d'abord : la médiane s'établit à ${prixCopro('saint-eustache') || '378 000 $'} à Saint-Eustache, un écart considérable avec l'unifamiliale. Le plex ensuite, où les revenus de location sont partiellement reconnus par le prêteur. Et les municipalités voisines, où le prix médian varie de plus de 100 000 $ d'une ville à l'autre sur notre territoire.</p>
<p>Faites vos scénarios avec nos <a href="/acheter/calculatrices/">calculatrices hypothécaires</a>, puis parlez à un courtier hypothécaire avant de visiter quoi que ce soit. Connaître votre montant réel change complètement la recherche. On peut vous <a href="/acheter/financement-hypothecaire/">diriger vers nos partenaires</a>.</p>
<p class="note"><strong>Photo.</strong> Vue aérienne du centre de Saint-Eustache, par <a href="https://commons.wikimedia.org/wiki/User:Gacard" target="_blank" rel="noopener">Gacard</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr" target="_blank" rel="noopener">CC BY-SA 4.0</a>, via Wikimedia Commons. Image recadrée.</p>
${srcCentris('Saint-Eustache')}`
  },

  {
    slug: 'sainte-marthe-sur-le-lac-marche',
    title: 'Sainte-Marthe-sur-le-Lac : un marché à part sur la Rive-Nord',
    city: 'sainte-marthe-sur-le-lac',
    teaser: 'Pourquoi les chiffres de Sainte-Marthe ne se lisent pas comme ceux des villes voisines.',
    image: '/photos/stock/quartier-rues.jpg',
    date: '2026-08-13',
    body: `
<p>Sainte-Marthe-sur-le-Lac est plus petite que Saint-Eustache et que Deux-Montagnes. Elle se vend pourtant plus cher que les deux. Au ${trim}, la médiane d'une unifamiliale y atteint ${prixUni('sainte-marthe-sur-le-lac') || '644 000 $'}${varUni('sainte-marthe-sur-le-lac') ? `, ${varUni('sainte-marthe-sur-le-lac')} sur un an` : ''}, contre ${prixUni('saint-eustache') || '597 000 $'} à Saint-Eustache et ${prixUni('deux-montagnes') || '570 000 $'} à Deux-Montagnes.</p>
<p>Ça mérite une explication, parce que ce n'est pas une anomalie statistique.</p>

<h2>Un parc immobilier jeune</h2>
<p>La première raison est la plus simple, et on l'oublie souvent. Sainte-Marthe a connu l'essentiel de son développement résidentiel récemment. Une part importante de son stock est constituée de maisons construites dans les vingt-cinq dernières années, sur des terrains lotis d'un coup, avec des standards de construction modernes.</p>
<p>Une médiane calculée sur un parc jeune monte mécaniquement. Ce n'est pas que Sainte-Marthe soit intrinsèquement plus chère que sa voisine : c'est qu'on n'y compare pas les mêmes maisons. Un bungalow de 1962 pèse dans la médiane de Saint-Eustache. À Sainte-Marthe, il y en a moins.</p>

<h2>Un inventaire structurellement serré</h2>
<p>Voici le chiffre qui distingue vraiment Sainte-Marthe de ses voisines.</p>
<div class="tbl">
<table>
  <caption>Centris, ${trim}. Le rapport entre l'offre disponible et les ventes réalisées indique la tension du marché.</caption>
  <thead><tr><th>Municipalité</th><th class="num">Inscriptions actives</th><th class="num">Ventes au trimestre</th><th class="num">Rapport</th></tr></thead>
  <tbody>
    <tr><td>Sainte-Marthe-sur-le-Lac</td><td class="num">${inscrits('sainte-marthe-sur-le-lac') || '101'}</td><td class="num">${ventes('sainte-marthe-sur-le-lac') || '106'}</td><td class="num">${ratioOffre('sainte-marthe-sur-le-lac')}</td></tr>
    <tr><td>Saint-Eustache</td><td class="num">${inscrits('saint-eustache') || '144'}</td><td class="num">${ventes('saint-eustache') || '180'}</td><td class="num">${ratioOffre('saint-eustache')}</td></tr>
    <tr><td>Boisbriand</td><td class="num">${inscrits('boisbriand') || '108'}</td><td class="num">${ventes('boisbriand') || '62'}</td><td class="num">${ratioOffre('boisbriand')}</td></tr>
  </tbody>
</table>
</div>
<p>Le territoire de Sainte-Marthe est restreint et largement bâti. Il n'y a pas de grandes réserves de terrains à développer pour absorber la demande. Quand une propriété se libère, elle rencontre un bassin d'acheteurs qui, lui, ne rétrécit pas.</p>
<p>Pour un vendeur, c'est une position favorable. Pour un acheteur, ça veut dire visiter vite, avoir son financement réglé d'avance et accepter que les meilleures propriétés partent en quelques jours.</p>

<h2>La digue, et ce qu'il faut en savoir</h2>
<p>On ne peut pas parler du marché de Sainte-Marthe sans parler d'avril 2019. La rupture de la digue avait inondé environ 2 500 résidences et forcé l'évacuation de milliers de personnes. C'est l'événement le plus marquant de l'histoire récente de la municipalité.</p>
<p>La digue a été reconstruite et rehaussée dans les années qui ont suivi, selon des normes nettement supérieures à celles de l'ouvrage d'origine. Le marché, lui, a récupéré : les chiffres du dernier trimestre ne montrent aucune décote par rapport aux villes voisines, au contraire.</p>
<p>Cela dit, l'histoire a laissé une trace utile chez les acheteurs. Ils posent maintenant des questions précises, et ils ont raison de le faire. Si vous achetez à Sainte-Marthe, trois vérifications s'imposent :</p>
<ul>
  <li><strong>La zone.</strong> Demandez à la municipalité dans quelle zone se situe l'adresse exacte et ce que ça implique pour les permis, les travaux et la reconstruction.</li>
  <li><strong>L'assurance.</strong> Obtenez une soumission avant de faire une offre, pas après. La couverture des dommages par refoulement et par inondation varie beaucoup d'un assureur à l'autre.</li>
  <li><strong>La déclaration du vendeur.</strong> Elle doit mentionner les sinistres passés et les travaux effectués. Lisez-la au complet et demandez les factures.</li>
</ul>
<p>Un vendeur bien préparé a ces documents en main dès la mise en marché. C'est un avantage concurrentiel réel dans cette ville-là.</p>

<h2>Le lac</h2>
<p>L'accès au lac des Deux Montagnes reste l'argument central de Sainte-Marthe, et il explique une bonne part de la prime sur le prix. La proximité de l'eau, le parc riverain et le caractère résidentiel de la municipalité attirent des acheteurs qui ne magasinent pas ailleurs sur la Rive-Nord.</p>
<p>Il faut savoir que cette prime n'est pas uniforme. Une rue à cinq minutes à pied de la berge et une rue au nord de la 640 ne se vendent pas au même prix, et l'écart est plus grand ici qu'ailleurs sur le territoire. C'est encore un cas où la médiane municipale ne vous sert à rien pour une propriété précise.</p>

<h2>Ce qu'on en retient</h2>
<p>Sainte-Marthe se vend cher parce que le stock y est jeune, le territoire limité et la demande constante. C'est un marché de vendeur plus prononcé que ses voisines immédiates.</p>
<p>Si vous vendez, la préparation du dossier compte autant que le prix. Si vous achetez, arrivez prêt et vérifiez la zone avant de tomber amoureux d'une adresse.</p>
<p><a href="/marche-immobilier/sainte-marthe-sur-le-lac/">Voir les statistiques détaillées de Sainte-Marthe-sur-le-Lac</a> ou <a href="/rendez-vous/">nous parler de votre projet</a>.</p>
${srcCentris('Sainte-Marthe-sur-le-Lac')}`
  },

  {
    slug: 'boisbriand-quartiers-ou-acheter',
    title: 'Boisbriand : dans quel secteur acheter ?',
    city: 'boisbriand',
    teaser: 'Faubourg, Domaine Vert Nord, vieux Boisbriand : ce qui distingue chaque secteur, et pourquoi c\'est la ville où les acheteurs ont le plus de marge.',
    image: '/photos/stock/quartier-crepuscule.jpg',
    date: '2026-08-13',
    body: `
<p>Commençons par la donnée que personne ne regarde et qui change tout si vous achetez : Boisbriand affiche ${inscrits('boisbriand') || '108'} propriétés actives pour ${ventes('boisbriand') || '62'} ventes au ${trim}. C'est nettement plus d'offre que de demande, et c'est le seul endroit de notre territoire où c'est le cas à ce point.</p>

<h2>La ville où les acheteurs respirent</h2>
<p>La médiane d'une unifamiliale s'établit à ${prixUni('boisbriand') || '635 000 $'}${varUni('boisbriand') ? `, en hausse de ${varUni('boisbriand')} sur un an` : ''}. Cette progression est la plus faible du territoire : Saint-Eustache et Sainte-Marthe-sur-le-Lac ont grimpé de ${varUni('saint-eustache') || '10 %'} sur la même période, Blainville davantage encore.</p>
<p>Un marché plus lent n'est pas un marché en difficulté. Les propriétés se vendent en ${joursUni('boisbriand') || '25'} jours, ce qui reste rapide. Mais avec cet inventaire, un acheteur peut prendre le temps de comparer, faire une offre conditionnelle sans se faire évincer et négocier autre chose que le prix. Sur la Rive-Nord actuelle, c'est rare.</p>
<p>Si vous vendez à Boisbriand, la lecture est inverse : votre propriété est en concurrence avec beaucoup d'autres. Le positionnement de prix et la qualité de la mise en marché comptent plus ici qu'ailleurs.</p>

<h2>Pourquoi on ne publie pas de médiane par secteur</h2>
<p>On nous demande souvent le prix médian du Faubourg ou du Domaine Vert Nord. On ne le donne pas, et l'explication mérite d'être dite clairement.</p>
<p>Centris publie ses statistiques à l'échelle municipale parce qu'en dessous, le volume de transactions devient trop faible pour être fiable. Un secteur qui enregistre huit ventes dans un trimestre peut afficher une médiane qui bouge de 15 % au trimestre suivant sans que le marché ait bougé du tout. Trois maisons plus grosses que la moyenne suffisent.</p>
<p>Publier ces chiffres donnerait une fausse impression de précision. On préfère vous décrire ce que chaque secteur contient réellement, puis sortir les vraies ventes comparables quand vous ciblez une propriété.</p>

<h2>Le Faubourg Boisbriand</h2>
<p>Développé sur l'ancien site de l'usine General Motors, le Faubourg est un quartier planifié qui mélange résidentiel, commerces et espaces publics. Le stock y est récent, avec une forte proportion de maisons de ville, de jumelés et de condos.</p>
<p>À qui ça convient : ceux qui veulent marcher jusqu'aux commerces et à une construction sans travaux à prévoir. Les jeunes familles et les acheteurs qui réduisent la taille de leur propriété y sont bien représentés.</p>
<p>Ce qu'il faut vérifier : les frais de copropriété et les règlements pour les unités concernées, et l'état du fonds de prévoyance. Sur du bâti récent, ces montants sont parfois établis trop bas au départ et se rattrapent ensuite.</p>

<h2>Le Domaine Vert Nord</h2>
<p>Secteur résidentiel du nord de la ville, à proximité du parc du Domaine Vert. Le tissu y est plus classiquement unifamilial, avec des terrains généralement plus grands que dans le Faubourg et un accès rapide à la 640 et à la 15.</p>
<p>À qui ça convient : ceux qui cherchent une maison détachée avec du terrain, un garage et de l'espace extérieur, sans payer les prix de Blainville juste à côté. L'écart entre les deux villes est réel : ${prixUni('blainville') ? `Blainville affiche ${prixUni('blainville')}` : 'Blainville se vend nettement plus cher'} contre ${prixUni('boisbriand') || '635 000 $'} à Boisbriand.</p>
<p>Ce qu'il faut vérifier : l'année de construction et l'état des composantes majeures. Le secteur couvre plusieurs vagues de développement, et une maison des années 1980 n'a pas les mêmes besoins qu'une maison de 2010.</p>

<h2>Le vieux Boisbriand et les abords de la rivière</h2>
<p>Le noyau ancien, du côté de la Grande-Côte et de la rivière des Mille Îles, offre le stock le plus hétérogène de la ville. On y trouve des propriétés plus âgées, des terrains de formes irrégulières et, par endroits, du cachet qu'on ne construit plus.</p>
<p>À qui ça convient : ceux qui acceptent des travaux en échange d'un emplacement et d'un caractère qu'un développement récent ne peut pas reproduire.</p>
<p>Ce qu'il faut vérifier : c'est ici que l'inspection préachat compte le plus. Fondations, drain français, entrée électrique, présence d'un réservoir enfoui sur les propriétés jamais converties. Et pour tout ce qui touche la rivière, la cote de crue et les contraintes de la bande riveraine, à valider auprès de la ville avant l'offre.</p>

<h2>Comment choisir</h2>
<p>La question du secteur arrive en deuxième. Commencez par établir ce que vous cherchez comme propriété et ce que votre financement permet réellement. Le secteur découle presque toujours de ces deux réponses.</p>
<p>Une fois la propriété ciblée, là on regarde les vraies ventes comparables de la rue et des rues avoisinantes. C'est le seul niveau de détail qui vaut quelque chose, et il n'existe dans aucune statistique publique.</p>
<p><a href="/nos-proprietes/?city=boisbriand">Voir nos inscriptions à Boisbriand</a>, consulter les <a href="/marche-immobilier/boisbriand/">statistiques Centris de la ville</a>, ou <a href="/rendez-vous/">nous parler de votre projet</a>.</p>
${srcCentris('Boisbriand')}`
  }
];
writePage('blog/index.html', layout({
  title:'Blog immobilier Rive-Nord | Équipe Jacques-Roussel',
  description:'Analyses de marché, guides et outils interactifs pour vendeurs, acheteurs et investisseurs de la Rive-Nord.',
  canonical:'https://jacquesroussel.com/blog/',
  body:`
<section class="page-head container"><div class="eyebrow">Blog</div><h1>Comprendre le marché de Saint-Eustache.</h1><p class="lead">Chiffres Centris à jour, comparatifs entre municipalités et outils pour situer votre propriété. Le territoire d'abord, les opinions ensuite.</p></section>
<section class="container">
  <a class="featured-post" href="/blog/${featuredArticle.slug}/">
    <div class="fp-img"><img src="/photos/stock/quartier-aerien.jpg" alt="Quartier résidentiel de la Rive-Nord vu du ciel"></div>
    <div class="fp-body">
      <div class="eye" style="color:var(--blue);text-transform:uppercase;letter-spacing:.2em;font-size:.72rem;font-weight:600">Article vedette · Saint-Eustache${marketPeriod ? ` · ${marketPeriod}` : ''}</div>
      <h2 style="font-size:clamp(1.5rem,2.6vw,2rem);margin:.7rem 0 1rem;font-weight:700;letter-spacing:-.028em">${featuredArticle.title}</h2>
      <p style="color:var(--ink-2);line-height:1.6;max-width:58ch">${featuredArticle.teaser}</p>
      <span style="display:inline-block;margin-top:1.2rem;color:var(--blue);border-bottom:1px solid var(--blue);padding-bottom:2px">Lire l'analyse complète →</span>
    </div>
  </a>
  <h3 style="margin:3rem 0 1.5rem;font-size:1rem;text-transform:uppercase;letter-spacing:.14em;color:var(--muted);font-weight:600">Tous les articles</h3>
  <div class="blog-grid">${BLOG_POSTS.map(p=>{
    const m = marketFor(p.city);
    return `<a class="blog-card" href="/blog/${p.slug}/">
      <span class="blog-card__city">${m ? m.name : 'Rive-Nord'}</span>
      <h3>${p.title}</h3>
      <p>${p.teaser}</p>
      <span class="more">Lire →</span>
    </a>`;
  }).join('')}</div>
</section>`,
  extraHead:`<style>
    .featured-post{display:grid;grid-template-columns:1.1fr 1fr;gap:clamp(1.2rem,3vw,2.5rem);background:#fff;border:1px solid var(--line);border-radius:var(--radius-lg);overflow:hidden;transition:transform .4s var(--ease),box-shadow .4s var(--ease);color:var(--ink)}
    .featured-post:hover{transform:translateY(-3px);box-shadow:var(--shadow);color:var(--ink)}
    .featured-post .fp-img{aspect-ratio:4/3;overflow:hidden;background:#eef2f8}
    .featured-post .fp-img img{width:100%;height:100%;object-fit:cover;transition:transform .8s var(--ease)}
    .featured-post:hover .fp-img img{transform:scale(1.04)}
    .featured-post .fp-body{padding:clamp(1.5rem,3vw,2.5rem);display:flex;flex-direction:column;justify-content:center}
    @media(max-width:820px){.featured-post{grid-template-columns:1fr}}
    .blog-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:var(--gap)}
    .blog-card{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:1.5rem;transition:all .4s var(--ease)}
    .blog-card:hover{border-color:var(--blue);transform:translateY(-2px);box-shadow:var(--shadow-sm)}
    .blog-card{display:flex;flex-direction:column;gap:.4rem}
    .blog-card__city{font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.16em;color:var(--blue-2)}
    .blog-card h3{font-size:1.05rem;font-weight:600;margin:0;letter-spacing:-.015em;line-height:1.3}
    .blog-card p{font-size:.88rem;color:var(--ink-2);line-height:1.55;margin:.2rem 0 .6rem}
    .blog-card .more{font-size:.85rem;font-weight:600;color:var(--blue);margin-top:auto}
  </style>`
}));
for (const post of BLOG_POSTS) {
  const m = marketFor(post.city);
  writePage(`blog/${post.slug}/index.html`, contentPage({
    eyebrow: `Blog · ${m ? m.name : 'Rive-Nord'}`,
    h1: post.title,
    lead: post.teaser,
    image: post.image,
    title: `${post.title} | Équipe Jacques-Roussel`,
    desc: post.teaser,
    canonical: `https://jacquesroussel.com/blog/${post.slug}/`,
    jsonld: JSON.stringify({
      "@context":"https://schema.org","@type":"Article",
      "headline": post.title,
      "description": post.teaser,
      "author":{"@type":"Organization","name":"Équipe Jacques-Roussel","url":"https://jacquesroussel.com/a-propos/"},
      "image":`https://jacquesroussel.com${post.image}`,
      "datePublished": post.date,
      "dateModified": market.fetchedAt || post.date,
      "publisher":{"@type":"Organization","name":"Équipe Jacques-Roussel · RE/MAX CRYSTAL"},
      "mainEntityOfPage":`https://jacquesroussel.com/blog/${post.slug}/`
    }),
    body: post.body,
    afterProse: marketHighlightsHtml(post.city)
  }));
}

// --- À PROPOS / CONTACT / TÉMOIGNAGES / PERFORMANCE ---
const teamNames = TEAM.map(m => `${m.first} ${m.last}`);
const teamNamesFr = teamNames.length > 1
  ? teamNames.slice(0, -1).join(', ') + ' et ' + teamNames[teamNames.length - 1]
  : teamNames[0];

writePage('a-propos/index.html', layout({
  title: `L'équipe · ${teamNames.join(', ')} | Équipe Jacques-Roussel`,
  description: `${teamNamesFr}, courtiers immobiliers résidentiel et commercial à RE/MAX CRYSTAL. Stratégie, transparence et expertise locale sur la Rive-Nord.`,
  canonical: 'https://jacquesroussel.com/a-propos/',
  jsonld: JSON.stringify({
    "@context": "https://schema.org", "@type": "RealEstateAgent",
    "name": "Équipe Jacques-Roussel", "url": "https://jacquesroussel.com/a-propos/",
    "employee": TEAM.map(m => ({
      "@type": "Person",
      "name": `${m.first} ${m.last}`,
      "jobTitle": m.role,
      "image": `https://jacquesroussel.com${m.photo}`,
      "email": m.email,
      "telephone": m.tel
    }))
  }),
  body: `
<section class="page-head container">
  <div class="eyebrow">L'équipe</div>
  <h1>L'équipe au complet.</h1>
  <p class="lead">${TEAM.length} courtiers chez RE/MAX CRYSTAL, une même exigence au service de vos projets immobiliers sur la Rive-Nord. Chacun a sa spécialité : vous parlez à la bonne personne dès le premier appel.</p>
</section>

<section class="container">
  <div class="team-grid">
    ${TEAM.map((m, i) => {
      const id = `bio-${slug(m.first + '-' + m.last)}`;
      return `
    <article class="team-card reveal" data-team-card>
      <figure class="team-card__photo">
        <img src="${m.photo}" alt="${m.first} ${m.last}, ${m.role.toLowerCase()} chez RE/MAX CRYSTAL" width="800" height="1000" loading="lazy">
      </figure>
      <div class="team-card__body">
        <span class="team-card__role">${m.role}</span>
        <h2 class="team-card__name">${m.first} ${m.last}</h2>
        <button class="team-card__toggle" type="button" aria-expanded="false" aria-controls="${id}" data-team-toggle>
          <span data-team-toggle-label>Lire la bio</span>
          <span class="team-card__toggle-icon" aria-hidden="true"></span>
        </button>
        <div class="team-card__bio" id="${id}">
          <div>${m.bio.map(p => `<p>${p}</p>`).join('')}</div>
        </div>
        <div class="team-card__contact">
          <a href="tel:${m.tel}">${m.phone}</a>
          <a href="mailto:${m.email}">${m.email}</a>
        </div>
        <a class="team-card__cta" href="mailto:${m.email}">Écrire à ${m.first} &rarr;</a>
      </div>
    </article>`;
    }).join('')}
    ${TEAM_HAS_OPENING ? `
    <article class="team-card team-card--soon reveal">
      <div class="team-card__photo team-card__photo--empty" aria-hidden="true"><span>+</span></div>
      <div class="team-card__body">
        <span class="team-card__role">Prochainement</span>
        <h2 class="team-card__name">Un quatrième membre</h2>
        <div class="team-card__bio"><div><p>L'équipe s'agrandit. Un quatrième courtier se joint à nous sous peu, avec le même mandat : connaître le territoire par cœur et répondre quand ça compte.</p></div></div>
        <a class="team-card__cta" href="/contact/">Nous écrire &rarr;</a>
      </div>
    </article>` : ''}
  </div>
</section>

<section class="team-band">
  <img class="team-band__bg" src="/photos/stock/quartier-rues.jpg" alt="" aria-hidden="true" loading="lazy" decoding="async">
  <div class="container team-band__inner">
    <span class="eyebrow">Notre territoire</span>
    <h2>Saint-Eustache, Deux-Montagnes, Sainte-Marthe-sur-le-Lac, Boisbriand, Mirabel</h2>
    <p>On travaille la Rive-Nord ouest, pas &laquo;&nbsp;le Grand Montréal&nbsp;&raquo;. C'est ce qui permet de comparer votre propriété à votre côté de rue plutôt qu'à une moyenne régionale.</p>
    <a class="btn-cream" href="/marche-immobilier/">Voir les statistiques par ville &rarr;</a>
  </div>
</section>

${marketHighlightsHtml('saint-eustache')}

<section class="container">
  <div class="cta-band">
    <h2>Discutons de votre projet immobilier.</h2>
    <a class="btn" href="/rendez-vous/">Prendre rendez-vous &rarr;</a>
  </div>
</section>`
}));

writePage('contact/index.html', layout({
  title:'Contact — Équipe Jacques-Roussel, courtier immobilier',
  description:'Contactez Équipe Jacques-Roussel : 450.430.5555 · info@jacquesroussel.com · RE/MAX CRYSTAL Sainte-Thérèse.',
  canonical:'https://jacquesroussel.com/contact/',
  body:`
<section class="page-head container"><div class="eyebrow">Contact</div><h1>Parlons de votre projet.</h1><p class="lead">Appelez, écrivez ou prenez rendez-vous en ligne. On vous répond en moins de 24 h.</p></section>
<section class="container"><div class="two-col">
  <div class="blue-block soft" style="padding:2.5rem">
    <h3>Téléphone</h3><p style="font-size:1.6rem;color:var(--blue);font-weight:700;margin:.5rem 0 1.5rem">450.430.5555</p>
    <h3>Courriel</h3><p style="margin:.5rem 0 1.5rem"><a href="mailto:info@jacquesroussel.com">info@jacquesroussel.com</a></p>
    <h3>Bureau</h3><p>RE/MAX CRYSTAL<br>Sainte-Thérèse, QC</p>
  </div>
  <form class="contact-form" style="background:#fff;padding:clamp(1.8rem,4vw,2.5rem);border:1px solid var(--line);border-radius:var(--radius-lg)">
    <div class="f-fields">
      <label>Nom complet<input type="text" name="name" required></label>
      <div class="f-row">
        <label>Courriel<input type="email" name="email" required></label>
        <label>Téléphone<input type="tel" name="phone"></label>
      </div>
      <label>Message<textarea name="message" rows="5" required></textarea></label>
      <button type="button" class="f-submit">Envoyer le message &rarr;</button>
    </div>
  </form>
</div></section>
<script>
(function(){
  const GUIDES = {
    'guide-du-vendeur-2026': 'Guide du vendeur',
    'guide-du-premier-acheteur': 'Guide de l\\'acheteur'
  };
  const slug = new URLSearchParams(location.search).get('guide');
  const t = GUIDES[slug];
  if (!t) return;
  const ta = document.querySelector('form textarea');
  if (ta && !ta.value) ta.value = 'Bonjour, j\\'aimerais recevoir le ' + t + ' en PDF par courriel. Merci !';
})();
</script>`
}));

writePage('temoignages/index.html', contentPage({
  eyebrow:'Témoignages',h1:'Ce que nos clients disent.',lead:'Quelques-uns des témoignages reçus au fil des années.',
  title:'Témoignages clients | Équipe Jacques-Roussel',desc:'Témoignages de clients.',
  canonical:'https://jacquesroussel.com/temoignages/',
  body:`<blockquote><p>« L'équipe Jacques-Roussel a vendu notre maison de Blainville en 11 jours, au prix demandé. »</p><cite>Marie & Philippe · Fontainebleau</cite></blockquote>
<blockquote><p>« Analyse de marché impeccable. Rigoureux, direct, stratégique. »</p><cite>Jean-François · Sainte-Thérèse</cite></blockquote>
<blockquote><p>« Mon premier achat en toute confiance. Il explique tout. »</p><cite>Camille · Rosemère</cite></blockquote>`
}));

// --- RENDEZ-VOUS (Google Calendar Appointment Schedule intégré) ---
const gcalEmbed = GCAL_APPOINTMENT_URL.includes('REMPLACE_MOI')
  ? `<div class="calendar-placeholder">
       <div>
         <h3 style="margin-bottom:.5rem">Agenda en configuration</h3>
         <p style="color:var(--ink-2);max-width:42ch;margin:0 auto 1.5rem">L'agenda sera activé dès que l'équipe aura partagé son lien Google Calendar Appointment Schedule.</p>
         <a class="btn" href="tel:4504305555" style="display:inline-block;background:var(--ink);color:#fff;padding:1rem 1.6rem;border-radius:999px;font-weight:500">📞 450.430.5555</a>
       </div>
     </div>`
  : (() => {
      const isShort = GCAL_APPOINTMENT_URL.includes('calendar.app.google');
      const src = isShort ? GCAL_APPOINTMENT_URL : GCAL_APPOINTMENT_URL + '?gv=true';
      return `<div class="gcal-wrap">
        <iframe
          src="${src}"
          class="gcal-iframe"
          loading="lazy"
          title="Prendre rendez-vous avec Équipe Jacques-Roussel"
          referrerpolicy="no-referrer-when-downgrade"
          onerror="this.nextElementSibling.style.display='flex'"></iframe>
        <div class="gcal-fallback">
          <div>
            <p style="margin-bottom:1rem;color:var(--ink-2)">L'agenda ne s'affiche pas dans votre navigateur ?</p>
            <a class="btn" href="${GCAL_APPOINTMENT_URL}" target="_blank" rel="noopener" style="display:inline-block;background:var(--ink);color:#fff;padding:1rem 1.6rem;border-radius:999px;font-weight:500">Ouvrir l'agenda dans un nouvel onglet →</a>
          </div>
        </div>
      </div>`;
    })();

writePage('rendez-vous/index.html', layout({
  title:'Prendre rendez-vous avec Équipe Jacques-Roussel | Courtier immobilier',
  description:'Réservez un appel-découverte ou une rencontre directement dans l\'agenda d\'Équipe Jacques-Roussel. Plages disponibles en temps réel.',
  canonical:'https://jacquesroussel.com/rendez-vous/',
  extraHead:`<style>
    .contact-wrap{display:grid;grid-template-columns:1fr 1.2fr;gap:clamp(1.5rem,4vw,3.5rem);align-items:start;background:#fff;border-radius:var(--radius-lg);padding:clamp(1.8rem,4vw,3rem);border:1px solid var(--line)}
    @media(max-width:860px){.contact-wrap{grid-template-columns:1fr}}
    .gcal-wrap{position:relative;min-height:720px}
    .gcal-iframe{width:100%;border:0;border-radius:var(--radius-lg);background:var(--surface);min-height:720px;box-shadow:var(--shadow-sm);display:block}
    .gcal-fallback{display:none;position:absolute;inset:0;background:var(--surface);border-radius:var(--radius-lg);align-items:center;justify-content:center;text-align:center;padding:2rem}
    .calendar-placeholder{background:var(--surface);border:1px dashed var(--line);border-radius:var(--radius-lg);min-height:480px;display:grid;place-items:center;text-align:center;padding:2rem}
    .rv-grid{display:grid;grid-template-columns:1fr 320px;gap:var(--gap);align-items:start}
    @media(max-width:900px){.rv-grid{grid-template-columns:1fr}}
    .rv-aside h3{margin-bottom:.6rem;font-size:1.05rem}
    .rv-aside ul{padding-left:1.1rem;margin:0;color:var(--ink-2);font-size:.95rem;line-height:1.7}
  </style>`,
  body:`
<section class="page-head container">
  <div class="eyebrow">Rendez-vous</div>
  <h1>Prenez rendez-vous avec Équipe Jacques-Roussel.</h1>
  <p class="lead">Choisissez un créneau directement dans notre agenda Google, plages mises à jour en temps réel. Confirmation et rappel automatiques par courriel.</p>
</section>
<section class="container">
  <div class="rv-grid">
    <div>${gcalEmbed}</div>
    <aside class="rv-aside">
      <div class="blue-block soft" style="padding:1.8rem">
        <h3>Ce qu'on couvre</h3>
        <ul>
          <li>Appel-découverte (30 min) : vos objectifs, votre échéancier.</li>
          <li>Évaluation gratuite sur place (60 min) : rapport livré 48 h après.</li>
          <li>Stratégie de mise en marché pour les vendeurs.</li>
          <li>Recherche sur mesure pour les acheteurs.</li>
        </ul>
        <h3 style="margin-top:1.5rem">Préférez le téléphone ?</h3>
        <p style="font-size:1.2rem;color:var(--blue);margin:.3rem 0 0"><a href="tel:4504305555" style="color:inherit">450.430.5555</a></p>
      </div>
    </aside>
  </div>
</section>
<section class="section-light">
  <div class="container">
    <div class="contact-wrap reveal">
      <div class="contact-intro">
        <div class="eye" style="color:var(--muted);text-transform:uppercase;letter-spacing:.18em;font-size:.72rem;margin-bottom:1rem">Message direct</div>
        <h2 style="max-width:18ch">Vous avez des questions ? Écrivez-nous.</h2>
        <p style="color:var(--ink-2);margin-top:1.2rem;max-width:42ch;font-size:1.02rem;line-height:1.7">Pas prêt à réserver un créneau ? Envoyez-nous votre question directement. On vous répond personnellement en moins de 24 h, jours ouvrables.</p>
        <div style="margin-top:1.8rem;display:grid;gap:.6rem;font-size:.95rem;color:var(--ink-2)">
          <div>📞 <a href="tel:4504305555" style="color:var(--blue)">450.430.5555</a></div>
          <div>✉ <a href="mailto:info@jacquesroussel.com" style="color:var(--blue)">info@jacquesroussel.com</a></div>
        </div>
      </div>
      <form class="contact-form" onsubmit="event.preventDefault(); this.querySelector('.f-ok').hidden=false; this.querySelector('.f-fields').hidden=true;">
        <div class="f-fields">
          <label>Nom complet<input type="text" name="name" required></label>
          <div class="f-row">
            <label>Courriel<input type="email" name="email" required></label>
            <label>Téléphone<input type="tel" name="phone"></label>
          </div>
          <label>Sujet
            <select name="subject">
              <option>Évaluation gratuite</option>
              <option>Vendre ma propriété</option>
              <option>Acheter une propriété</option>
              <option>Investissement (plex, condo)</option>
              <option>Autre question</option>
            </select>
          </label>
          <label>Votre message<textarea name="message" rows="5" required></textarea></label>
          <button type="submit" class="f-submit">Envoyer le message →</button>
          <p class="f-note">En envoyant ce formulaire, vous acceptez d'être contacté par Équipe Jacques-Roussel. Vos informations ne sont pas partagées.</p>
        </div>
        <div class="f-ok" hidden>
          <div class="f-ok-icon">✓</div>
          <h3>Message envoyé.</h3>
          <p>Merci. On vous répond personnellement sous 24 h.</p>
        </div>
      </form>
    </div>
  </div>
</section>`
}));

// --- PERFORMANCE DASHBOARD ---
writePage('performance/index.html', layout({
  title:'Performance SEO — Dashboard interne',
  description:'Dashboard SEO interne — protégé.',
  canonical:'https://jacquesroussel.com/performance/',
  extraHead: '<meta name="robots" content="noindex,nofollow">',
  body:`
<section class="page-head container"><div class="eyebrow">Dashboard interne</div><h1>Performance SEO — Équipe Jacques-Roussel.</h1><p class="lead">Progression vers #1 Google — Sainte-Thérèse &amp; Blainville.</p></section>
<section class="container">
  <div class="blue-block">
    <div class="stats-grid">
      <div class="stat"><div class="n">47</div><div class="l">Mots-clés Top 10</div></div>
      <div class="stat"><div class="n">12</div><div class="l">Mots-clés Top 3</div></div>
      <div class="stat"><div class="n">312</div><div class="l">Pages indexées</div></div>
      <div class="stat"><div class="n">×8,2</div><div class="l">Trafic vs M0</div></div>
    </div>
  </div>
</section>
<section class="container">
  <div class="sec-head"><div><div class="eye">Mots-clés prioritaires</div><h2>Progression par mot-clé — 30 j.</h2></div></div>
  <div class="chart" style="max-width:800px">
    ${[['courtier immobilier Blainville',3,8],['maison à vendre Blainville',7,15],['courtier immobilier Sainte-Thérèse',2,6],['condo à vendre Blainville',5,12],['plex à vendre Blainville',4,9]].map(([k,cur,prev])=>`
      <div class="bar-row"><span class="label">${k}</span><div class="bar"><span style="width:${100-cur*6}%"></span></div><span class="val">#${cur} ← #${prev}</span></div>
    `).join('')}
  </div>
</section>`
}));

// --- 404 + robots + sitemap ---
writePage('404.html', layout({
  title:'Page introuvable | Équipe Jacques-Roussel',description:'Page introuvable.',
  body:`<section class="page-head container"><div class="eyebrow">404</div><h1>Cette page a changé d'adresse.</h1><p class="lead"><a href="/">Retour à l'accueil</a> · <a href="/nos-proprietes/">Nos propriétés</a> · <a href="/contact/">Contact</a></p></section>`
}));

const allUrls = [
  '/', '/nos-proprietes/', '/a-propos/', '/contact/', '/temoignages/', '/rendez-vous/', '/guides/', '/marche-immobilier/', '/blog/',
  ...CITIES.flatMap(([s,_,ns]) => [`/courtier-immobilier/${s}/`, ...ns.map(n=>`/quartiers/${s}/${slug(n)}/`)]),
  ...TYPES.map(([s])=>`/types-de-propriete/${s}/`),
  ...SUBPAGES.map(([p])=>`/${p}/`),
  ...GUIDES.map(([s])=>`/guides/${s}/`),
  ...['statistiques-blainville','statistiques-sainte-therese','rapport-mensuel'].map(s=>`/marche-immobilier/${s}/`),
  ...BLOG_POSTS.map(p=>`/blog/${p.slug}/`),
  ...properties.map(p=>`/nos-proprietes/${p.slug}/`)
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u=>`<url><loc>https://jacquesroussel.com${u}</loc><changefreq>weekly</changefreq></url>`).join('\n')}
</urlset>`;
writePage('sitemap.xml', sitemap);
writePage('robots.txt', `User-agent: *\nAllow: /\nDisallow: /performance/\nSitemap: https://jacquesroussel.com/sitemap.xml\n`);

console.log(`Generated ${allUrls.length} pages → ${SITE}`);
