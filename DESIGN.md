# DESIGN.md · Équipe Jacques-Roussel

> Site immobilier statique généré par `build.mjs`, Centris ingéré chaque jour.
> RE/MAX CRYSTAL, Sainte-Thérèse · Marilyn Jacques et Alexandre Roussel.
> Signature : « Vos courtiers d'expérience sur la Rive-Nord. »
>
> Ce fichier décrit le site **tel qu'il est en ligne** (`site/assets/site.css`, relevé le 2026-10-27).
> Le même système, avec aperçus des composants et logos, est publié ici :
> https://claude.ai/artifact/KJoGDYUtkfiJFcAUSdv3R2
> Si le CSS change, mettre à jour ce fichier et le design system ensemble.

---

## Brand & voice

- **Pour qui :** propriétaires et acheteurs de la couronne nord (Sainte-Thérèse, Blainville, Boisbriand, Rosemère, Saint-Eustache).
- **En trois mots :** fiable, chaleureux, local.
- **Ton :** deux courtiers d'expérience qui connaissent chaque rue. Direct, précis, sans emphase.
- Français du Québec. On **vouvoie** la personne, l'équipe parle d'elle-même avec **« on »**.
- Libellés de boutons : verbe + objet, majuscule initiale seulement. « Prendre rendez-vous », « Voir nos propriétés → », « Évaluation gratuite », « Rencontrer l'équipe → ».
- Titres réels : « Nos propriétés sélectionnées », « 2 courtiers, un seul territoire », « 5 villes, une connaissance fine du marché », « Prêt à passer à l'action ? ».
- Promesses vérifiables seulement (« On vous répond en moins de 24 h. »). Chiffres de marché tirés de Centris et datés.
- Espace insécable avant `?` `!` `:` `$`. Prix : `549 900 $`, en `tabular-nums`.
- Pas d'emoji, pas de tirets cadratins, pas de « révolutionnaire », « sans effort », « propulser », « élever ».

## Colour

Un seul thème, clair. `teal` et `navy` servent de bandes, de cartes et de pied de page, jamais de page entière. Valeurs déclarées en `oklch()` ; le repli hex sert aux vieux navigateurs.

| Jeton | Valeur rendue | Repli | Rôle |
|---|---|---|---|
| `--cream` | `oklch(96% 0.012 80)` | `#F7F5EE` | Fond de page |
| `--vellum` | `oklch(98% 0.008 80)` | `#FBF8F2` | Cartes claires, bandes alternées |
| `--blue-soft` | `#EFE9DF` | | Halo de focus, survol de suggestion |
| `--hairline` | `oklch(90% 0.006 80)` | `#E8E2D7` | Filets, bordures de champ |
| `--ink` | `oklch(20% 0.005 250)` | `#1A1B1D` | Titres et texte |
| `--stone` | `oklch(48% 0.008 250)` | `#6F6F73` | Texte secondaire, métadonnées |
| `--mist` | `oklch(68% 0.006 250)` | `#A6A6A8` | Décoratif seulement (2,4:1 sur cream) |
| `--label` | `oklch(54.8% 0.080 75.4)` | `#8C6A38` | Surtitres sur fond clair (4,55:1) |
| `--teal` | `oklch(37.3% 0.06 258)` | `#2c4160` | **L'accent unique** : bouton principal, bande CTA, pied de page |
| `--navy` | `oklch(22% 0.04 240)` | `#13202E` | Cartes propriété, bouton sur photo |
| `--sand` | `oklch(78% 0.04 75)` | `#CDB89A` | Surtitres et focus **sur fond sombre** |
| `--bronze` | `oklch(62% 0.08 70)` | `#B58A4F` | Prix, chiffres-clés, soulignement du menu |
| `--remax-red` | `oklch(55.4% 0.208 26.5)` | `#DC1C2E` | Pastille « Nouveau » uniquement |

Alias des pages de contenu : `--blue` = teal, `--line` = hairline, `--surface` = vellum, `--ink-2` = stone, `--muted` = mist, `--blue-2` = sand.

**Accords permis**

- Sur `cream` / `vellum` : texte `ink` ou `stone`, surtitre `label`, bouton `teal`, prix `bronze` seulement à 19 px gras et plus (≈3:1).
- Sur `teal` : texte `cream`, surtitre et focus `sand`, chiffres-clés `bronze`.
- Sur `navy` ou photo : texte `cream`, ville `sand`, pastille `remax-red` + texte `#fff`.
- `sand` n'est **jamais** du texte sur fond clair (1,8:1).
- Logo : marine `#2C4160` et barre oblique rouge `#E11B22`, déjà dans les fichiers. On ne les recrée pas.

> **À corriger dans `site.css` :** le commentaire annonce la crème RE/MAX `#F7F5EE`, mais le bloc `@supports (color: oklch(...))` la remplace par `oklch(96% 0.012 80)`, l'ancienne crème maison. Tous les navigateurs modernes affichent donc l'ancienne. Décider laquelle garder et aligner les deux déclarations.

**Traitement d'image :** texte sur photo toujours posé sur un dégradé `navy` → `teal` → transparent, du bas vers le haut. Le héros vidéo prend un voile `ink` (radial en bas à gauche + linéaire 12 % → 55 %). Le fond de page porte un grain SVG (`feTurbulence`) à 35 % en `multiply`.

## Typography

**Une seule famille : Montserrat**, servie par Bunny Fonts (`montserrat:300,400,400i,500,600,700,800`), pile de repli `system-ui, -apple-system, sans-serif`. Le poids fait la hiérarchie.

| Rôle | Taille (fluide) | Interligne | Graisse | Interlettrage |
|---|---|---|---|---|
| H1 | `clamp(3rem, 6vw, 5.5rem)` | 1.02 | 800 | -0.035em |
| H1 du héros d'accueil | `clamp(1.76rem, 6.4vw, 5.55rem)` | 1.02 | 800 | -0.04em |
| Chiffre-clé | `clamp(2.5rem, 5vw, 4.5rem)` | 1 | 700 | |
| H2 | `clamp(2rem, 3.5vw, 3.25rem)` | 1.08 | 700 | -0.028em |
| H3 | `clamp(1.375rem, 2vw, 1.75rem)` | 1.2 | 600 | -0.015em |
| Prix (carte) | `clamp(1.35rem, 2vw, 1.6rem)` | 1.1 | 700 | -0.02em |
| Chapeau | `clamp(1.1rem, 1.3vw, 1.25rem)` | 1.6 | 400 | |
| Texte | `clamp(1rem, 1.05vw, 1.0625rem)` | 1.7 | 400 | |
| Menu | 0.92rem | | 400, 500 actif | |
| Petit | `clamp(0.85rem, 0.95vw, 0.9rem)` | | 500 | |
| Surtitre | 12 px, 13 px dès 768 px | | 600 | 0.2em, CAPITALES |
| Pastille | 11 px | 1 | 600 | 0.14em, CAPITALES |

- Titres : `text-wrap: balance`. Un `em` dans un titre ne change ni graisse ni couleur.
- Paragraphes : `max-inline-size: 65ch`, `text-wrap: pretty`.
- Poids par rôle : chiffres et prix 700 ; noms, adresses, titres de bloc 600 ; boutons 500.
- Seuls les surtitres et les pastilles sont en capitales.
- Tous les chiffres en `font-variant-numeric: tabular-nums`.

## Spacing & layout

Échelle fluide :

| Jeton | Valeur |
|---|---|
| `--space-1` | `clamp(0.25rem, 0.5vw, 0.5rem)` |
| `--space-2` | `clamp(0.5rem, 1vw, 0.75rem)` |
| `--space-3` | `clamp(0.75rem, 1.5vw, 1rem)` |
| `--space-4` | `clamp(1rem, 2vw, 1.5rem)` |
| `--space-6` | `clamp(1.5rem, 3vw, 2.5rem)` · gouttière `--gap` |
| `--space-8` | `clamp(2rem, 4vw, 3.5rem)` |
| `--space-12` | `clamp(3rem, 6vw, 5rem)` |
| `--space-16` | `clamp(4rem, 8vw, 7rem)` · entre grandes sections |

- Conteneur : `--container: min(1400px, 92vw)`, marges `clamp(1rem, 4vw, 2rem)`.
- Sections alternées `cream` / `vellum` (`band-vellum`).
- En-tête de section : surtitre, `space-2`, H2 de 22ch au plus, aligné à gauche.
- Cibles tactiles : 44 px minimum.
- Propriétés logiques partout (`margin-inline`, `padding-block`, `inline-size`).

## Layout & grid

**Grille :** colonne unique contenue (1400 px) + grilles CSS locales par section. **Archétype :** pages éditoriales empilées en bandes, héros plein écran, fiche propriété en écran partagé.

| Section | Structure |
|---|---|
| Accueil, héros | Vidéo plein écran `min-block-size: calc(100dvh - var(--hdr-h))`, texte en bas à gauche : surtitre `sand`, H1 cream, un seul bouton `btn-cream` « Voir nos propriétés → » |
| Accueil, ordre | héros · mentions légales · territoire · propriétés (`vellum`) · équipe · villes · CTA |
| Propriétés à l'accueil | carrousel horizontal, cartes `clamp(280px, 78vw, 420px)`, gouttière `space-6` |
| Liste des propriétés | `repeat(auto-fill, minmax(300px, 1fr))`, gouttière `space-6` |
| Fiche propriété | 2 colonnes : média/carte collant à gauche (rayon 18 px, bordure hairline), info à droite (720 px max). Une colonne sous 1024 px |
| Pages de contenu | `.two-col` 1.15fr / 0.85fr, une colonne sous 900 px |
| Pied de page | 4 colonnes 1.5fr 1fr 1fr 1.4fr · 2 sous 900 px · 1 sous 560 px |

- En-tête collant, cream à 82 % avec `backdrop-filter: blur(12px)`, filet hairline ; à 95 % avec `shadow-header` une fois défilé. Logo compact à gauche, logotype RE/MAX dans l'en-tête (exigence du guide RE/MAX : au-dessus de 400 px, fond neutre), « Prendre rendez-vous » à droite.
- Bans de mise en page : héros centré, trois cartes identiques en rangée, défilement horizontal de la page, `100vh` (toujours `dvh`).

## Shape & elevation

| Jeton / valeur | Usage |
|---|---|
| `999px` | Boutons, menu, pastilles |
| `22px` (`--radius-lg`) | Bande CTA, bloc bleu, formulaire |
| `18px` | Média de la fiche propriété |
| `16px` | Carte propriété |
| `14px` (`--radius`) | Champs, cartes claires, portraits |
| `12px` | Sous-menus, chiffres-clés |
| `8px` | Liens de sous-menu |

Bordures : 1 px `hairline` sur clair, 1 px cream à 15–22 % sur sombre. Champs : 1,5 px.

Ombres, toujours teintées de bleu :

```css
--shadow-sm:         0 1px 2px oklch(30% 0.05 258 / 0.05), 0 4px 12px oklch(30% 0.05 258 / 0.07);
--shadow-card:       0 1px 2px oklch(30% 0.05 258 / 0.06), 0 8px 24px oklch(30% 0.05 258 / 0.08), 0 24px 60px oklch(30% 0.05 258 / 0.05);
--shadow-card-hover: 0 1px 2px oklch(30% 0.05 258 / 0.08), 0 12px 32px oklch(30% 0.05 258 / 0.10), 0 32px 80px oklch(62% 0.08 70 / 0.06);
--shadow-header:     0 1px 0 oklch(90% 0.006 80 / 0.8), 0 10px 30px oklch(30% 0.05 258 / 0.04);
/* bande CTA */      0 1px 2px oklch(22% 0.04 258 / 0.10), 0 18px 50px oklch(22% 0.04 258 / 0.20);
```

Le seul flou du site est celui de l'en-tête collant.

## Motion

- Courbes : `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` ; `--ease-back: cubic-bezier(0.34, 1.56, 0.64, 1)`.
- Durées : couleurs 240–280 ms · en-tête 320 ms · cartes 420 ms · zoom photo 900 ms.
- Bouton : survol `scale(1.02)` + ombre douce ; clic `scale(0.98) translateY(1px)`.
- Carte : survol `translateY(-6px)`, `shadow-card-hover`, photo `scale(1.06)`.
- Menu : soulignement `bronze` 1,5 px qui se déploie depuis la gauche ; page active, trait fixe de 2 px.
- Héros : lignes du H1 révélées une à une (`.hm-line`, masque `overflow: hidden`).
- Scripts : Lenis (défilement doux), GSAP + ScrollTrigger (révélations), Splitting 1.0.6, Motion 10.18.0.
- Uniquement `transform` et `opacity`. Tout s'arrête sous `prefers-reduced-motion: reduce`.

## Components

Aperçus et guides détaillés dans le design system publié. Les classes ci-dessous sont celles de `site.css`.

**Boutons** (`.btn-primary`, `.btn-cream`, `.btn-navy`, `.btn-ghost`, `.btn-ghost--on-teal`)
- Pilule, `padding: 0.95rem 1.7rem`, 0.95rem, 500, interlettrage 0.01em, `min-block-size: 44px`.
- Clair → `btn-primary` (teal). Sur teal → `btn-cream`. Sur photo → `btn-cream` ou `btn-navy`. Secondaire → `btn-ghost` (bordure ink 35 %).
- Un seul bouton plein par écran.

**Carte propriété** (`.prop-card`)
- Fond `navy`, rayon 16 px, `shadow-card`. Photo 4/5 (3/4 dès 900 px) avec dégradé navy.
- Texte posé sur la photo : ville (`sand`, capitales 0.16em), prix (cream 700), adresse (600), métadonnées séparées par des filets cream 22 %.
- N'affiche que les métadonnées qui existent. Pastille « Nouveau » si inscrite depuis moins de 30 jours.

**Pastille** (`.prop-card__badge`) : `remax-red`, texte blanc 11 px capitales, pilule, en haut à gauche à 14 px.

**Bande CTA** (`.cta-band`) : fond teal, rayon 22 px, lueur cream 10 % en haut à droite, H2 cream de 20ch, `btn-cream` + `btn-ghost--on-teal`. Empilée sous 640 px.

**Champ** (`.eval-field`) : libellé 0.85rem 500 `stone` au-dessus ; champ `1rem 1.1rem`, bordure 1,5 px hairline, rayon 14 px ; focus bordure `blue` + halo 4 px `blue-soft`. Tout formulaire qui recueille un courriel ou un téléphone porte une case de consentement (Loi 25).

**Menu** (`.nav-item`) : pilule 0.55rem 0.85rem, 0.92rem ; survol fond ink 10 %. Sous-menu : fond cream, bordure hairline, rayon 12 px, `shadow-card`.

**Chiffre-clé** (`.stat`) : sur fond sombre, tuile rayon 12 px, fond cream 8 %, bordure cream 15 %, nombre `bronze` 700.

**Pied de page** : fond teal, logo horizontal blanc, titres de colonne en surtitre `sand`, liens cream 85 % → `sand` au survol. Pas de logotype RE/MAX dans le pied (il n'existe qu'en noir et crème, et le guide interdit de l'enfermer dans une boîte).

**Focus** : `outline: 2px solid var(--sand); outline-offset: 3px` sur tout élément interactif.

**Logos** (`brand_assets/_logo-jr/`, voir `LISEZ-MOI.txt`) : compact dans l'en-tête (blanc sur héros, marine ailleurs), horizontal blanc dans le pied, vertical par défaut ailleurs. Le monogramme J/R ne s'emploie jamais seul comme identification principale.

**Icônes** : pas de jeu d'icônes. Flèche typographique `→` en fin de libellé, `▾` pour les menus déroulants. Si une icône devient nécessaire : Lucide, trait 1.5, `currentColor`.

## Bans

- `#000` et `#fff` purs (seule exception : le texte de la pastille « Nouveau »).
- Rouge ailleurs que sur la pastille et dans le fichier du logo.
- Toute autre police que Montserrat ; poids 900.
- Capitales ailleurs que dans les surtitres et les pastilles.
- Dégradé dans le texte, lueur extérieure, ombre grise ou non teintée, glassmorphisme (sauf l'en-tête).
- Image, carte ou élément incliné (`rotate`) : tout reste droit, à l'horizontale.
- Numéros décoratifs « 01 », « 02 », « 03 » devant des étapes ou des blocs : le titre suffit.
- Bordure de couleur sur un seul côté d'une carte.
- Trois cartes identiques icône + titre + texte en rangée.
- Héros centré, deux boutons pleins côte à côte, chevron qui rebondit, « Défilez pour découvrir », curseur personnalisé.
- Animer `width`, `height`, `top`, `left`, `margin` ; `transition: all` ; easing linéaire.
- Statistiques inventées, faux témoignages, prénoms génériques. Chiffres Centris réels et datés, ou rien.
- Emoji, tirets cadratins, tutoiement.

**Test anti-gabarit :** une personne qui voit la page devine-t-elle « fait par une IA » ? Les couleurs se devinent-elles à partir de la seule catégorie « courtier immobilier » ? Si oui à l'une ou l'autre, retravailler.
