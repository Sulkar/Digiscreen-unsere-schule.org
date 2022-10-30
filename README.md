# Digiscreen

Digiscreen ist ein interaktiver Bildschirm für den Präsenz- oder Fernunterricht im Klassenzimmer.

Die Anwendung wird unter der GNU GPLv3-Lizenz veröffentlicht. Außer den Schriftarten Abril Fat Face, Orbitron und Material Icons (Apache License Version 2.0) und der Schriftart HKGrotesk (Sil Open Font License 1.1)

## Logik
### Import Digiboard
- Digiscreen wird als JSON exportiert und als .dgs Datei gespeichert.
- Beim Import einer .dgs Datei wird diese in **App.vue** in der Methode **importer (event)** geparst.
- Im Anschluss werden der App z.B.: die Karten aus der JSON Datei zugewiesen: `this.panneaux = donnees.panneaux`
- Sobald sich etwas an `this.panneaux` ändert, wird die **watch: {}** Methode ausgeführt und die `this.panneaux in panneauxPage` übertragen.
- Zum Schluss wir durch alle Elemente von `panneauxPage` iteriert und die Karten erstellt: `<template v-for="panneau in panneauxPage">` 

## Local Storage am Beispiel Zufälliger Name
- Der Component **tirage-texte.vue** wird aufgerufen, wenn ein Screen importiert wurde oder wenn eine neue Karte vom gleichen Typ erstellt wird.
- In der `created()` Methode wird geschaut, ob ein Text bereits vorhanden ist (aus der importierten Datei). Ist kein Text vorhanden wird im localStorage('tirage_texte') gesucht.
- Eingegebene Texte werden in der localStorage() gespeichert, wenn der Nutzer auf den Button "Bestätigung" klickt.

## RUN
### Letzter Abgleich mit original Repo von Codeberg
https://codeberg.org/ladigitale/digiboard (Commit vom 25.09.2022)

### Installation
```
npm install
```

### Run development server
```
npm run serve
```

### Build Digiscreen
```
npm run build
```

### Variables d'environnement (fichier .env à créer à la racine avant compilation)
```
VUE_APP_GOOGLE_API_KEY (clé API Google pour Youtube)
VUE_APP_PIXABAY_API_KEY (clé API Pixabay)
```

### Production
Der dist-Ordner kann direkt auf einem Dateiserver bereitgestellt werden. Diese kompilierte Version enthält nicht die Pixabay- und Google-API-Schlüssel für YouTube.

### Demo
https://digiboard.unsere-schule.org/
oder
https://ladigitale.dev/digiscreen/

### Remerciements et crédits
Traduction en italien par Paolo Mauri (https://gitlab.com/maupao) et Roberto Marcolin (nilocram)

Traduction en espagnol par Fernando S. Delgado Trujillo (https://gitlab.com/fersdt)

Traduction en néerlandais par Erik Devlies

Traduction en allemand lors d'une action dans « la salle des profs » [#twitterlehrerzimmer](https://twitter.com/search?q=%23twitterlehrerzimmer) / [#twlz](https://twitter.com/search?q=%23twlz) par [@uivens](https://twitter.com/uivens) (Ulrich Ivens), [@eBildungslabor](https://twitter.com/eBildungslabor) (Nele Hirsch) et [@teachitalizer](https://twitter.com/teachitalizer) (Holger Skarba)

Traduction en croate par Ksenija Lekić (https://gitlab.com/Ksenija66L)


### Spenden
https://opencollective.com/ladigitale

