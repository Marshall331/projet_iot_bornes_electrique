# Guide de lancement

Avant de commencer, assurez-vous d'avoir installé Docker Desktop et Python sur votre machine.

## Lancer Docker Desktop

Ouvrez Docker Desktop pour démarrer le service Docker, ce qui vous permettra de gérer les conteneurs et les images.

## Configuration de la base de données InfluxDB

Une fois Docker en marche, vous devrez démarrer un conteneur InfluxDB. Cela vous permettra de stocker et de gérer vos données.

Assurez-vous de modifier la configuration de connexion dans les scripts Python (historisation.py) ainsi que les fichiers JS pour correspondre aux informations de votre base de données InfluxDB, telles que l'hôte, le port, le nom d'utilisateur, le mot de passe et le nom de la base de données.

## Exécution des scripts Python

Après avoir configuré votre environnement, vous pouvez exécuter vos scripts Python pour simuler et historiser les données. Assurez-vous que toutes les dépendances requises sont installées (Paho MQTT par exemple).
