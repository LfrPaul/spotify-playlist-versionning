# Spotify Versionning

## Installation du projet

```bash
npm install
```

## Lancement du script

```bash
node ./index.js
```

## Ajout d'un crontab tous les mois

```bash
crontab -l
```

Puis ajouter la ligne :
```bash
0 0 1 * * $(node PATH_TO_SCRIPT/index.js)
```

## Versions

Projet développé avec :
- Node v18.13.0
- npm v8.19.3