# Notes — JACQUESROUSSEL

> Auto-classé par Claude depuis le chat Cowork du projet.
> Convention : `_AGENCY/CTO/conventions/project-notes.md`

## 📅 Échéances

*(vide pour l'instant — ajoute "vendredi il faut envoyer X" et je classe)*

## ✅ À faire

### Round de commentaires client du 2026-08-13 — ce qui attend une décision

- **⚠️ Aucun formulaire du site n'envoie quoi que ce soit.** Découvert en traitant les commentaires. Le bouton « Envoyer le message » de `/contact/` est un `type="button"` sans gestionnaire : il ne fait rien du tout, et la personne n'a même pas de message d'erreur. Idem pour le formulaire d'évaluation gratuite. **Toutes les demandes envoyées depuis le site depuis la mise en ligne sont perdues.** Il faut un point de chute : la constante `FORM_ENDPOINT` est en place en haut de `build.mjs`, il suffit d'y coller une URL (Formspree ~ 10 $/mois, ou une fonction Vercel). En attendant, la fenêtre des guides bascule sur le client courriel de la personne — rien ne se perd en silence, mais c'est un dépannage, pas une solution. (2026-08-13)
- **Calendrier de prise de rendez-vous : c'est le mauvais compte.** L'agenda intégré sur `/rendez-vous/` est un « Google Calendar Appointment Schedule », pas Calendly, mais il pointe sur un compte qui n'est pas celui de l'équipe — d'où le nom d'Alain Brunelle. Le lien est dans `GCAL_APPOINTMENT_URL` (`build.mjs`). **Il me faut le lien de l'agenda de l'équipe** : Google Calendar › Créer › Plages horaires de rendez-vous › Ouvrir la page de réservation, puis copier l'URL. (2026-08-13)
- **« Voir le territoire » (dernière tuile de la liste des villes, page d'accueil).** Elle mène effectivement à `/nos-proprietes/`, ce qui fait doublon avec le bouton juste au-dessus. Trois options, à trancher : (1) la pointer vers `/marche-immobilier/` — les statistiques Centris ville par ville, c'est le contenu le plus proche de l'idée de « territoire » ; (2) en faire une vraie page territoire avec la carte des secteurs ; (3) l'enlever et laisser la liste des villes se terminer sur la dernière ville. **Ma recommandation : option 1**, c'est gratuit et ça mène quelque part d'utile. (2026-08-13)
- **Blog : les six articles n'existent pas.** Les liens ne sont pas cassés, mais chaque page affiche « Cet article est en rédaction » suivi des statistiques Centris de la ville. Seul l'article vedette (marché de Saint-Eustache) a du vrai contenu. **À décider : est-ce que j'écris les six textes** (~900-1200 mots chacun, à partir des vraies données Centris du site), et à quel rythme on ajoute ensuite ? Oui, publier régulièrement aide le référencement — un article aux deux semaines est un bon rythme tenable. (2026-08-13)
- **Couvertures des guides.** Ce sont encore des images `placehold.co` générées. Tu as offert de fournir les pages couverture des deux vrais guides : dès que je les ai, je remplace `img` dans `GUIDE_CARDS` (`build.mjs`). (2026-08-13)
- **Le 8510-8510A Rue Duceppe est-il une unifamiliale ou un multilogement ?** Centris le donne dans les deux catégories, sur deux inscriptions distinctes (voir plus bas). J'ai gardé « Unifamiliale ». La description dit « MAISON À REVENUS ». À confirmer. (2026-08-13)
- **Deux pages guides orphelines.** `GUIDES` liste quatre guides (investisseur plex, déménagement Rive-Nord) qui n'ont ni carte ni contenu — les pages existent et sont dans le sitemap, mais rien n'y mène. À supprimer ou à écrire. (2026-08-13)

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

- **Round de commentaires client du 13 août — huit corrections livrées.** (2026-08-13)
  - *Défilement bloqué sur « Nos propriétés sélectionnées ».* La section épinglait la page et convertissait le défilement vertical en horizontal (GSAP ScrollTrigger `pin`). L'épinglage est retiré : descendre descend. Le rail garde son défilement horizontal natif et **deux flèches** le font avancer d'une carte à la fois, avec les boutons désactivés en début et en fin de course.
  - *Le tri unifamiliale / condo / terrain ne faisait rien.* Le code posait bien `[hidden]` sur les cartes, mais `.prop-card{ display:flex }` l'emportait sur le `display:none` du navigateur : les cartes restaient toutes visibles. Une règle `.prop-card[hidden]{ display:none }` suffisait. Vérifié : chaque filtre n'affiche plus que sa catégorie.
  - *Les catégories ne correspondaient pas à la réalité.* La cause était plus profonde : le type de propriété était **deviné à partir du texte de la description**, alors que l'export Centris porte les vrais codes en colonnes 53 (catégorie) et 54 (genre). Une fois sur deux c'était faux — un plain-pied dont le texte contenait le mot « terrain » finissait dans Terrain, un duplex dans Unifamiliale, une maison dans Commercial. Le site lit maintenant les codes Centris ; la description ne sert plus que de filet. Répartition corrigée : 7 unifamiliales (au lieu de 12), 5 condos, 4 terrains, 3 multilogements, 2 commerciaux.
  - *Trois propriétés apparaissaient deux fois.* Centris sort certaines inscriptions en double, sous deux numéros MLS et deux catégories contradictoires — la même maison se retrouvait dans deux onglets de filtre. Le build les repère (même adresse ou mêmes coordonnées, même prix) et garde la mieux documentée, en listant à la console ce qu'il écarte. 24 → 21 propriétés.
  - *Adresses déformées.* « 8510Z8510AZ Rue Duceppe », « 9797A Rue St-Louis ». La colonne 26 porte le second numéro civique d'une propriété à deux adresses, et le « Z » final est un marqueur Centris, pas un chiffre. Corrigé : « 8510-8510A », « 97-97A », « 163-163A », « 112-112B ».
  - *Photos surexposées sur acheter et vendre.* Les fichiers sources eux-mêmes étaient délavés (contraste de 15 à 34 sur 255). Retraitées : étirement de niveaux, balance des blancs douce et correction gamma — le contraste double et la dominante verte disparaît. Originaux conservés dans `photos/_originaux-delaves/`. Une image était irrécupérable (murs cramés à blanc) : `guide-vendre-preparer.jpg` est remplacée par la photo de salon du dossier stock.
  - *TRANQUILLI-T et INTÉGRI-T* pointent maintenant vers les pages RE/MAX Québec.
  - *Guides : vraie fenêtre de collecte.* Cliquer sur un guide ouvre une fenêtre qui lui est propre (« Laissez-nous vos informations pour recevoir votre guide du vendeur »), avec prénom, nom, téléphone et courriel — seuls le prénom et le courriel sont obligatoires. Fermeture par Échap, par le fond ou par le X, focus gardé dans la fenêtre. **Voir la note sur `FORM_ENDPOINT` : rien n'est encore expédié automatiquement.**
  - *Bios de l'équipe.* Le `break-inside:avoid` faisait sauter un paragraphe entier d'une colonne à l'autre, d'où les deux colonnes de hauteurs très inégales. Retiré : le texte passe maintenant d'une colonne à l'autre ligne par ligne.
  - *« Contacter Marilyn »* n'envoyait plus au formulaire général : le bouton est devenu « Écrire à Marilyn » en `mailto:` vers l'adresse de la personne. Le téléphone et le courriel de chaque courtier étaient déjà affichés sur sa carte.
- Round de corrections client : Montserrat partout, catégories de propriétés refaites, statistiques Centris branchées, équipe en cartes avec Vincent Lanni, blog recentré sur Saint-Eustache, filtre washed-out retiré des photos, overlay dégradé bleu sur les fiches. (2026-08-07)
- Couleur de base migrée du vert `#1E3A44` vers `#2c4160` (build.mjs + DESIGN.md + pin carte + covers guides). (2026-07-03)
