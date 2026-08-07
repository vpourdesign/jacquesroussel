# Notes — JACQUESROUSSEL

> Auto-classé par Claude depuis le chat Cowork du projet.
> Convention : `_AGENCY/CTO/conventions/project-notes.md`

## 📅 Échéances

*(vide pour l'instant — ajoute "vendredi il faut envoyer X" et je classe)*

## ✅ À faire

- **L'export Centris ne contient qu'une fraction des inscriptions de l'équipe.** Mesuré le 7 août : RE/MAX affiche **48 propriétés à vendre**, l'export DriveHQ n'en contient que **24** pour l'équipe (16 à vendre + 8 locations). **32 inscriptions à vendre n'arrivent jamais**, sous aucun des trois numéros de courtier. Aucune correction de code ne les fera apparaître. Deux pistes à valider auprès de RE/MAX Crystal ou du soutien Centris : (1) l'export ne couvre peut-être que les inscriptions où l'équipe est courtier *inscripteur*, alors que RE/MAX affiche aussi les collaborations ; (2) Vincent Lanni est dans MEMBRES.TXT (no 135334) mais aucune de ses inscriptions ne sort de l'export — l'abonnement d'export est un réglage distinct de son statut de courtier. (2026-08-07)
- **Les 8 locations sont reçues mais pas affichées.** Leur prix de vente est vide (le loyer est en colonne 9 de INSCRIPTIONS.TXT), donc le filtre `price > 0` les écarte. Décision en attente : les afficher mêlées aux propriétés à vendre, ou dans une section distincte, avec un format « 1 300 $/mois » et un badge « À louer ». (2026-08-07)
- **Brancher le DNS.** `www.jacquesroussel.com` pointe encore sur Wix (`cdn1.wixdns.net`). Le nouveau site n'est visible que sur `jacquesroussel.vercel.app`. (2026-08-07)
- **Révoquer la clé Google exposée** en session : compte de service `rapportsvpd@site-vpd.iam.gserviceaccount.com`, clé `5150d4e1…`. Console Google Cloud › IAM › Comptes de service › Clés. (2026-08-07)

- **Courtiers hypothécaires** : remplir `MORTGAGE_BROKERS` dans `build.mjs` (deux entrées « À REMPLIR » y sont en attente : nom, cabinet, téléphone, courriel, site, spécialité). La section est déjà en place sur `/acheter/financement-hypothecaire/`. (2026-08-07)
- **Bio de Vincent Lanni** : adaptée de vincentlanni.com et remise au « je » pour s'agencer aux deux autres bios. **À faire valider par Vincent Lanni** avant mise en ligne. (2026-08-07)
- **4e membre de l'équipe** : la carte « Prochainement » est en place. Quand le profil est confirmé, ajouter une entrée dans `TEAM` (build.mjs) et passer `TEAM_HAS_OPENING` à `false`. Tout le reste (pied de page, fiches, accueil) se met à jour tout seul. (2026-08-07)
- **Codes postaux à valider** : quelques inscriptions tombaient dans un « Rive-Nord » fourre-tout. La table `CP_CITY` a été corrigée (doublon J7G, ajout Boisbriand/Laval/Saint-Jérôme), mais les préfixes J7A, J7E, J7P mériteraient une vérification avec les vraies inscriptions. (2026-08-07)
- **Statistiques Centris** : relancer `node scripts/fetch-market-stats.mjs` à chaque publication trimestrielle de Centris (environ six semaines après la fin du trimestre). (2026-08-07)

## 💭 Long shots

*(vide pour l'instant — "un jour on pourrait explorer ..." finit ici)*

## 📝 Notes client

- Couleur de base du site : `#2c4160` (bleu ardoise) — remplace l'ancien vert forêt `#1E3A44` partout. (2026-07-03)
- Le client bâtit un dashboard sur mesure en parallèle — prévoir l'hébergement du site + dashboard ensemble. (2026-07-03)

## 🔍 Précisions

- Les statistiques de marché viennent de Centris, une page par ville : `site/data/market.json`, produit par `scripts/fetch-market-stats.mjs`. Aucun chiffre n'est saisi à la main. Si Centris ne publie pas une valeur (volume de transactions insuffisant), la case disparaît au lieu d'afficher une estimation. (2026-08-07)
- Les bios de `/a-propos/` restent au « je » : c'est la personne qui parle. Tout le reste du site est au « nous » ou au « on ». (2026-08-07)
- Images libres de droits dans `photos/stock/` (Unsplash). `copyDir` est maintenant récursif — avant, les sous-dossiers de `photos/` étaient silencieusement ignorés au build. (2026-08-07)

## ✓ Fait

- Round de corrections client : Montserrat partout, catégories de propriétés refaites, statistiques Centris branchées, équipe en cartes avec Vincent Lanni, blog recentré sur Saint-Eustache, filtre washed-out retiré des photos, overlay dégradé bleu sur les fiches. (2026-08-07)
- Couleur de base migrée du vert `#1E3A44` vers `#2c4160` (build.mjs + DESIGN.md + pin carte + covers guides). (2026-07-03)
