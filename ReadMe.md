# IOT temperature ESP32 fleet & OWM

## Group: 
### Fayssal EL ANSARI
### Mohamed ELYSALEM  


## Projet
Pour installer le program arduino:
* veuiller ouvrir le fichier `esp32_lucioles/classic_setup.ino`
* ajouter votre `SSID` et `mdp` dans la fonction `connect_wifi()`:
```c
wifiMulti.addAP("SSID", "MOT_DE_PASS");
```
* transferer le program

Pour lancer le projet veuillez:
* extraire le fichier `.rar` dans un nouveau dossier.
* acceder a ce nouveau dossier et executer les commandes:
```bash
npm install
node ./node_v0.js
```
* ouvrir le fichier `ui_lucioles.html` dans votre navigateur prefere



## Choix de developpement:
* nous avons decider de mettre dans notre liste de markers de POI, les memes coordonnes que ceux du fleet de ESP32:
* les markers des POIs et les markers des ESP32 sont dans 2 `groupLayers` differents
* la carte leaflet autozoom a chaque recuperation des markers (requette GET)
* Dans la base de donnes il est impossible d'avoir plus qu'un seul document (marker) pour une coordonnes. Le `_id` est la combinaison de `latitude` et `longitude` de ce marker.