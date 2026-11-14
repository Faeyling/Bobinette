# Bobinette 🐭🧵

Application de couture qui calcule automatiquement les mesures d'un vêtement, avec des illustrations pas à pas.
Mascotte : **Bobinette**, une souris crème qui tient une aiguille au fil bleu ciel — le même fil qui forme son écharpe.

## Fonctionnement

1. **Choix du vêtement** — jupe 1/4 de cercle, 1/2 cercle ou cercle complet.
2. **Questionnaire guidé** — pour chaque mesure : où poser le mètre ruban (silhouette illustrée), comment le tenir, et où cette mesure se reporte sur le tissu.
   - Corps : hauteur de port, tour de taille, tour de hanches, longueur.
   - Tissu : type (stable, fluide, épais, maille), laize, tissu à sens.
   - Détails : finition de taille (ceinture, parementure, élastique, biais), fermeture (glissière invisible ou classique, boutons, agrafes, aucune), type de couture, ourlet, poches, fente, doublure.
3. **Vérification** — récapitulatif modifiable et alertes (ex. : jupe sans fermeture qui ne passerait pas les hanches).
4. **Résultat** — panneau coté à l'échelle, étapes de traçage, plan de coupe sur la laize, liste des pièces, fournitures, adaptations expliquées et ordre de montage. Imprimable.

## Enregistrer et partager

Depuis l'écran de résultat :

- **Enregistrer** — le projet est gardé sur l'appareil et réapparaît dans « Mes projets » sur l'accueil.
- **Partager** — ouvre le menu de partage du téléphone (Google Drive, WhatsApp, Messages, e-mail…) avec une image de la fiche et le résumé en texte. Sur ordinateur, l'image est téléchargée et le résumé copié.
- **Copier le résumé** — texte prêt à coller dans une conversation.
- **Image de la fiche** — PNG avec chiffres clés, panneau coté, plans de coupe, pièces et fournitures.
- **Fiche complète** — fichier HTML autonome, lisible sans l'application.
- **Imprimer** — ou « Enregistrer en PDF » depuis la boîte d'impression.

## Ce que Bobinette adapte

| Choix | Effet sur les mesures |
|---|---|
| Aisance | +1 cm à la taille (+1,5 cm tissu épais, 0 en maille) |
| Tissu fluide | −1 cm à la taille (le biais se détend), +2 cm de réserve d'ourlet |
| Ceinture / coulisse | sa hauteur est retirée de la longueur du panneau |
| Ceinture élastique | taille de la jupe = hanches + 4 cm, longueur d'élastique = taille − 8 % + 2 cm |
| Fermeture | longueur d'ouverture calculée pour passer les hanches, arrondie à une taille du commerce |
| Couture / fermeture / fente | marge de couture = la plus exigeante (1 à 2 cm) |
| Ourlet | marge de 1 à 4 cm selon la technique, longueur de biais ou de crin calculée |
| Poches | impose des coutures de côté, crans de placement |
| Laize | choix automatique de 1, 2 ou 4 panneaux pour consommer le moins de tissu |

Calcul clé : rayon de taille `r = tour de taille fini / (2π × fraction)`, rayon d'ourlet `R = r + longueur du panneau`.

## Lancer

Application web statique (PWA installable, fonctionne hors ligne), sans dépendance :

```bash
npm start            # ou : python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000. Sur téléphone : « Ajouter à l'écran d'accueil ».

```bash
npm test             # tests du calcul (Node 18+)
npm run icons        # régénère les icônes (Playwright requis)
```

## Structure

```
index.html, css/style.css, manifest.webmanifest, sw.js
js/main.js                 navigation et écrans
js/export.js               projets enregistrés, partage, image, texte, fiche HTML
js/data/garments.js        catalogue et questionnaire
js/data/options.js         tables de marges et finitions
js/calc/circleSkirt.js     calcul des jupes cercles
js/calc/geometry.js        géométrie des pièces et placement sur le tissu
js/svg/                    mascotte, silhouette, patrons, icônes d'options
tests/                     tests du calcul
```

Ajouter un vêtement : décrire ses questions dans `garments.js` et écrire sa fonction de calcul dans `js/calc/`.
