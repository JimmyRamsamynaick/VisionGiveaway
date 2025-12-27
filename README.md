# VisionGiveaway

VisionGiveaway est un bot Discord complet pour gérer des giveaways avec une interface web intégrée pour visualiser les résultats. Le projet est entièrement localisé en français.

## 🚀 Fonctionnalités

- **Système de Giveaway complet** : Création facile via des commandes slash et des formulaires (modals).
- **Interface Web** : Page de résumé pour chaque giveaway terminé, affichant les gagnants et les participants.
- **Logs détaillés** : Suivi des créations et des fins de giveaways dans un salon dédié.
- **Gestion des participants** :
  - Inscription via un simple bouton 🎉.
  - Vérification de double participation.
  - Possibilité de quitter le giveaway.
  - Mise à jour en temps réel du nombre de participants sur l'embed.
- **Commandes d'administration** :
  - `/start` : Lancer un nouveau giveaway.
  - `/reroll` : Relancer le tirage au sort d'un giveaway.
  - `/delete` : Supprimer un giveaway.
  - `/setlogs` : Configurer le salon de logs.

## 🛠️ Installation

1. **Cloner le dépôt** :
   ```bash
   git clone https://github.com/JimmyRamsamynaick/VisionGiveaway.git
   cd VisionGiveaway
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Configuration** :
   Créez un fichier `.env` à la racine du projet et remplissez les informations suivantes :
   ```env
   TOKEN=votre_token_discord
   CLIENT_ID=votre_client_id
   MONGODB_URI=votre_url_de_connexion_mongodb
   PORT=3000
   DOMAIN=http://localhost:3000 (ou votre domaine en production)
   ```

4. **Lancer le bot** :
   Pour le développement :
   ```bash
   npm run dev
   ```
   Pour la production :
   ```bash
   npm start
   ```

## 📝 Utilisation

### Créer un Giveaway
Utilisez la commande `/start`. Un formulaire s'ouvrira pour vous demander :
- La durée (ex: 10m, 1h, 2d).
- Le nombre de gagnants.
- Le prix à gagner.
- Une description optionnelle.

### Quitter un Giveaway
Si vous avez participé par erreur, cliquez à nouveau sur le bouton de participation ou tentez de rejoindre pour voir apparaître le bouton "Quitter le Giveaway".

## 📂 Structure du Projet

- `commands/` : Commandes Slash Discord.
- `events/` : Gestionnaires d'événements (ready, interactionCreate).
- `models/` : Modèles Mongoose (MongoDB).
- `views/` : Templates EJS pour l'interface web.
- `public/` : Fichiers statiques (CSS, images).
- `utils/` : Fonctions utilitaires.

## 👤 Auteur

Créé par Jimmy Ramsamynaick.
