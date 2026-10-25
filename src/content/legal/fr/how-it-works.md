---
title: Comment ça marche
meta: Les règles derrière la file, les sélections et le tableau d’une soirée de club NextFour.
---

Cette page explique comment NextFour décide qui joue ensuite, pour que les organisateurs et les joueurs puissent vérifier par eux-mêmes qu’une soirée est équitable. Elle couvre la file, chaque mode de sélection, ce que l’organisateur peut modifier, les scores et les classements, le tableau au bord du terrain, et ce qui se passe quand le réseau coupe.

Chaque action en direct (s’enregistrer, choisir, terminer un match) est calculée et enregistrée sur notre serveur en une seule étape. Tous les téléphones et tablettes de la salle affichent alors le même tableau, et deux personnes ne peuvent pas mettre le même joueur sur deux terrains à la fois.

## S’enregistrer et arriver en retard

- **Pour s’enregistrer :** depuis son téléphone avec le code d’enregistrement de la session, sur une tablette au bord du terrain qui affiche le tableau de session, ou par l’organisateur ou un adjoint. Pro ajoute un QR code à scanner et une puce NFC à toucher.
- **Les invités** sans l’application peuvent être ajoutés par leur nom, et gardent leurs matchs et leur classement s’ils créent un compte plus tard et revendiquent le profil.
- **La file suit le temps d’attente.** Chaque joueur attend depuis son enregistrement ou depuis la fin de son dernier match, selon le plus récent. Un retardataire rejoint donc la fin de la file, au même rang que ceux qui sortent du terrain à ce moment-là. Pas d’avance pour être arrivé en retard, ni de pénalité.
- **S’absenter :** un joueur qui fait une pause reste enregistré mais ne peut pas être choisi. À son retour, il passe en fin de file. Une pause demandée pendant un match commence à la fin de ce match.
- **Partir :** se désinscrire retire le joueur du tableau, après son match en cours s’il est sur un terrain. S’absenter ou partir met aussi fin à un éventuel binôme.
- **Une session à la fois :** s’enregistrer à une session vous désinscrit d’abord de toute autre session en direct. C’est refusé si vous êtes sur un terrain ou déjà choisi pour un match là-bas.

## La file d’attente

- Le plus long temps d’attente d’abord. Les soirs de tableau, les joueurs sortis du même match sont rangés vainqueurs d’abord, puis match nul, puis perdants.
- Les joueurs absents sont en bas de la file et ne peuvent pas être choisis.
- Deux joueurs mis en binôme par l’organisateur sont toujours côte à côte.
- L’ordre est calculé sur le serveur et enregistré à chaque changement, donc tous les écrans affichent exactement la même file.

## Les modes de sélection

L’organisateur en choisit un pour chaque session.

| Mode | Qui choisit les quatre | Formule |
|---|---|---|
| Pegboard (tableau) | Le joueur dont c’est le tour | Gratuit |
| Manuel | L’organisateur | Gratuit |
| Par niveau | NextFour, automatiquement | Pro |
| Roi du terrain | Les vainqueurs restent ; les challengers viennent de la file | Pro |

### Pegboard (tableau)

La version numérique du tableau de club.

- **Un joueur a la main.** Quand un terrain se libère, il reçoit une notification et choisit trois joueurs pour le rejoindre. Le premier choisi est son partenaire.
- **Parmi qui :** les joueurs suivants dans la file. L’organisateur règle jusqu’où le joueur voit dans la file (par défaut, les sept suivants).
- **Choisir à l’avance :** quand tous les terrains sont occupés, le joueur peut quand même composer son match. Il attend son tour et passe sur le prochain terrain libre, dans l’ordre.
- **Passer la main :** après une sélection, la main passe au joueur suivant dans la file qui n’a pas été choisi et n’est pas absent. Si personne n’attend, elle revient à celui qui attend depuis le plus longtemps dès qu’un match se termine, qu’un terrain est réinitialisé ou qu’un joueur revient de pause.
- **Passer un joueur :** l’organisateur peut passer quelqu’un qui n’est pas prêt. Il reste deuxième dans la file et ne perd pas sa place.
- **Éviter le même match deux fois :** si les quatre choisis ont déjà joué ensemble ce soir dans les mêmes équipes, l’application le signale et propose en une touche de les répartir dans les équipes qui ont le moins joué ensemble. Dans nos simulations, l’accepter à chaque fois réduit les matchs répétés de 60 à 100 %.
- **Sélection intelligente :** une touche compose le match le plus équilibré parmi la liste du joueur, d’après les classements. Le joueur peut toujours changer chacun des trois.
- **Les dames choisissent partout** (option) : la liste d’une joueuse inclut aussi les joueuses plus loin dans la file qui sont sorties du terrain depuis au moins cinq minutes, mais seulement autant qu’il en faut pour son match. Avec l’option, la sélection intelligente compose un match de dames pour une joueuse et un match d’hommes pour un joueur dès que la liste en compte trois de plus. Dans nos simulations de vraies soirées, l’attente moyenne des hommes est restée à moins d’une minute de l’habitude.

### Par niveau

NextFour remplit automatiquement chaque terrain libre, dans l’ordre des terrains, parmi les joueurs en attente.

**Mode d’équité** (l’organisateur en choisit un) :

- **Rotation équitable :** le joueur qui attend depuis le plus longtemps est toujours dans le match suivant. Les trois autres viennent d’un tour de terrains dans la file (quatre joueurs par terrain), donc personne n’est doublé par quelqu’un qui n’aurait pas joué ce tour-ci.
- **Meilleur match :** compose le meilleur match parmi le début de la file. Passer un joueur en tête de file a un coût qui augmente avec son attente, et quiconque attend depuis 25 minutes joue le match suivant, quels que soient les classements.

**Objectif** (l’organisateur en choisit un) :

- **Équipes équilibrées :** des côtés aussi proches que possible au classement, donc forts et moins forts se mélangent.
- **Niveaux proches :** quatre joueurs de classement proche.

**Règles pour chaque match :**

- Les quatre sont répartis selon le deux contre deux le plus équilibré.
- **Variété :** deux joueurs qui ont partagé l’un de leurs deux derniers matchs pèsent contre un groupe, donc les mêmes quatre retournent rarement ensemble sur le terrain. Dans nos simulations de soirées à 5 terrains, c’est arrivé dans 3 % des matchs au plus.
- **Les binômes** restent ensemble et toujours du même côté. Le binôme cède quand le garder ensemble ferait un match déséquilibré ou une revanche.
- **Règle de genre :** aucune, Mixte (deux hommes et deux dames, un de chaque par côté) ou Même genre. Quelle que soit la règle, un match de deux hommes et deux dames est toujours réparti un de chaque par côté, jamais hommes contre dames. Personne n’est mis sur le terrain comme seul de son genre quand un autre groupe était possible.

**Les coûts connus :** choisir par niveau fait attendre certains joueurs plus longtemps qu’une simple file. Sur une soirée à 5 terrains et 32 joueurs, l’attente la plus longue est de 17 à 22 minutes, contre 12 à 13 en premier arrivé, premier servi. Un joueur sans personne de son niveau joue moins de matchs. Nous publions ces chiffres plutôt que de les cacher.

### Roi du terrain

- Les vainqueurs restent sur le terrain et affrontent des challengers venus du début de la file. Le terrain 1 est le terrain du Roi. Les perdants retournent en fin de file.
- **Plafond de victoires :** après un nombre de victoires d’affilée (trois par défaut, ou sans plafond), les vainqueurs sortent aussi, devant les perdants dans la file.
- **Séparer les vainqueurs** (activé par défaut, en double) : les deux vainqueurs se séparent, un par côté, chacun avec un nouveau partenaire.
- **Manches chronométrées** (option) : tous les terrains jouent et s’arrêtent ensemble sur une horloge commune, avec un signal sur le tableau et le téléphone de l’organisateur et un avertissement une minute avant. Les perdants vont dans la file ou descendent d’un terrain (l’échelle).
- **Personne n’attend indéfiniment :** quiconque attend depuis 25 minutes est appelé ensuite, quelle que soit la règle de genre.

### Manuel

L’organisateur place chaque joueur. Toutes les règles du tableau ci-dessous s’appliquent quand même.

## Ce que l’organisateur peut modifier

L’organisateur et ses adjoints peuvent, à tout moment :

- mettre n’importe quel joueur en attente à n’importe quelle place, retirer un joueur d’un match ou le déplacer ;
- réinitialiser un match, passer le joueur qui a la main, et démarrer, mettre en pause ou reprendre le chrono d’un match ;
- enregistrer et désinscrire des joueurs, les marquer absents ou de retour, et ajouter des invités ;
- mettre deux joueurs en binôme pour qu’ils jouent ensemble (Pro) ;
- terminer la session plus tôt. Sinon elle se termine seule une fois l’heure de fin passée et les terrains libres.

Le serveur refuse tout changement qui mettrait un joueur sur deux matchs, placerait quelqu’un qui n’est pas enregistré ou est absent, ou mettrait deux matchs sur un terrain, quel que soit l’expéditeur.

## Scores, historique et classements

- **Résultats :** l’organisateur choisit si les joueurs saisissent les scores ou seulement l’équipe gagnante. Avec un score cible (21 au badminton, 11 au squash et au tennis de table), les scores ne peuvent pas être négatifs ni à égalité, donc chaque match a un vainqueur. Saisissez le score du perdant et la feuille propose celui du vainqueur (21 points, deux points d’écart, jusqu’à 30 au badminton). Sans score cible, tout score est accepté, y compris un match nul.
- **Historique :** chaque match est gardé avec ses joueurs, ses équipes et son score. Les joueurs voient gratuitement leur nombre de matchs et leur taux de victoire. La formule Joueur ajoute l’historique complet, le classement de chaque soirée jouée, et les meilleurs partenaires et rivaux les plus coriaces.
- **Classements :** chaque joueur a un classement Elo par sport et par format : simple, double, et mixte (chaque côté un homme et une dame). Après chaque match, chaque joueur est évalué contre la moyenne de l’autre côté (facteur K de 32, jamais sous 100). Les matchs nuls ne comptent pas. Un nouveau format part du classement du joueur dans un autre format du même sport, sinon de son niveau déclaré (Débutant 1200 à Professionnel 1800), sinon de 1500. Les classements servent à la sélection intelligente et à la sélection par niveau. Ils ne sont pas affichés comme un tableau de ligue, pour que personne ne joue pour protéger un chiffre.

## Le tableau dans la salle

- **Tableau de session (gratuit) :** n’importe quelle tablette ou téléphone devient un tableau en direct qui montre chaque terrain, qui joue, qui suit et depuis combien de temps chacun attend. Les joueurs peuvent s’y enregistrer, s’absenter et revenir.
- **Verrouillé pour l’organisateur :** tout ce qui modifie la soirée sur le tableau (valider des enregistrements, les outils du joueur qui a la main, réinitialiser un terrain, terminer la session) demande le code PIN de la session, choisi par l’organisateur. L’organisateur peut laisser les joueurs ajouter des joueurs, former des binômes ou modifier des invités sans le code. Quitter le mode tableau demande le déverrouillage du téléphone de l’organisateur, car cela rend l’accès à son compte.
- **Tableau de club (formule Club) :** des tablettes dédiées, enregistrées pour un club. Leurs réglages sont protégés par un code PIN d’appareil distinct, que seul l’administrateur du club peut définir.
- **Annonce des noms à voix haute (Pro) :** un carillon, puis qui joue sur quel terrain et à qui c’est le tour de choisir, pour que personne n’ait à crier dans la salle.

## Quand le réseau coupe

NextFour a besoin d’une connexion internet : c’est ce qui permet à tous les appareils de la salle d’afficher le même tableau. Avec une connexion faible :

- le tableau reste affiché avec un bandeau « Reconnexion » au lieu de disparaître ;
- les actions sont refusées avec un message tant que l’appareil se sait hors ligne, donc rien n’est fait à moitié ;
- une action envoyée au moment où le réseau coupe est renvoyée pendant 30 secondes et appliquée une seule fois.

Il n’y a pas encore de mode hors ligne.

## Présence et organisation

- **Sondages de disponibilité (gratuit) :** demandez à vos joueurs qui peut venir à la prochaine session et voyez les réponses arriver. Vous pouvez saisir vous-même les réponses données de vive voix.
- Chaque match est gardé avec la session. Avec n’importe quelle formule payante, l’historique de la session les liste tous et peut être filtré sur une soirée.
- Un organisateur peut gérer plusieurs sessions en même temps, par exemple deux salles le même soir.

## Paiements

NextFour ne gère pas les paiements. Vous pouvez afficher le prix par personne d’une session, et les joueurs vous paient comme aujourd’hui.

## Formules

- **Gratuit :** trouvez des sessions, inscrivez-vous et jouez. Organisez autant de sessions que vous voulez avec la sélection Pegboard ou manuelle, le tableau de session et les sondages de disponibilité.
- **Joueur :** toutes vos statistiques et votre historique, vos meilleurs partenaires et vos rivaux les plus coriaces, sans publicité.
- **Pro :** la sélection par niveau, le Roi du terrain, les binômes, les adjoints, l’annonce des noms à voix haute, l’enregistrement par QR code et NFC, les sessions récurrentes et les sessions sur invitation.
- **Club :** tout Pro, plus l’administration du club, le classement des joueurs, les classements du club et des terminaux Tableau de club dédiés.

Les prix s’affichent dans l’application avant tout abonnement. Les abonnements sont facturés via l’App Store ou Google Play.

## Comment nous le testons

Avant qu’un changement de la sélection soit mis en service, nous simulons des soirées de club entières : 32 joueurs pendant trois heures, de trois à sept terrains, avec des retardataires, des pauses, des départs anticipés, des binômes et des soirées mixtes. Certaines règles doivent tenir à chaque simulation, sans exception :

- personne n’est choisi pendant une absence, avant son arrivée ou après son départ ;
- personne n’est sur deux terrains à la fois ;
- aucun terrain ne reste vide quand quatre joueurs sont libres ;
- en rotation équitable, celui qui attend depuis le plus longtemps est dans chaque match.

Une question sur tout cela ? Écrivez à [support@nextfour.app](mailto:support@nextfour.app).
