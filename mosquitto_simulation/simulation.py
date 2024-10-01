import paho.mqtt.client as mqtt
import time
import json
import random
import os

# Nom du fichier de données
data_file = "bornes_data.json"

# Chargement des données existantes à partir du fichier
def load_existing_data():
    if os.path.exists(data_file):
        with open(data_file, 'r') as file:
            return json.load(file)  # Charge le JSON en tant que dictionnaire
    return {str(i): {} for i in range(1, 101)}  # Initialiser avec 100 bornes vides sous forme de dictionnaire

# Sauvegarde des données dans le fichier
def save_data(data):
    with open(data_file, 'w') as file:
        json.dump(data, file, indent=4)

# Données des bornes initiales
bornes_data = load_existing_data()

# Callback pour la connexion
def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    client.subscribe("#")

# Callback pour les messages reçus
def on_message(client, userdata, msg):
    print(f"Received message: {msg.payload.decode()} on topic {msg.topic}")

# Créer un client MQTT
client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

# Connexion au broker
client.connect("localhost", 1884, 60)

# Fonction pour générer un état simulé pour chaque borne
def simulate_borne_state(index):
    est_occupee = random.choice([True, False])
    etat_borne = {"est_occupee": est_occupee}

    if est_occupee:
        etat_borne["etat_charge"] = random.randint(0, 100)
        etat_borne["temps_restant"] = random.randint(1, 60)

    return etat_borne

# Fonction pour publier toutes les données initiales des bornes
def publish_initial_data(client):
    for index in range(1, 101):
        etat_borne = simulate_borne_state(index)
        bornes_data[str(index)] = etat_borne  # Mettre à jour le dictionnaire
        client.publish(f"chargesense/bornes/{index}", json.dumps(etat_borne))
        print(f"Initial data sent for borne {index}: {etat_borne}")

# Fonction pour mettre à jour un sous-ensemble de bornes périodiquement
def update_bornes_periodically(client, interval):
    while True:
        # Mettre à jour 10 à 15 bornes
        for _ in range(random.randint(10, 15)):
            index = random.randint(1, 100)  # Choisir une borne aléatoire
            etat_borne = simulate_borne_state(index)
            bornes_data[str(index)] = etat_borne  # Mettre à jour le dictionnaire
            client.publish(f"chargesense/bornes/{index}", json.dumps(etat_borne))
            print(f"Updated data sent for borne {index}: {etat_borne}")
        
        # Sauvegarder les données mises à jour dans le fichier
        save_data(bornes_data)
        time.sleep(interval)

# Boucle pour recevoir les messages
client.loop_start()

try:
    publish_initial_data(client)  # Publier toutes les données initiales
    update_bornes_periodically(client, 10)  # Mettre à jour toutes les 10 secondes
except KeyboardInterrupt:
    print("Process interrupted")
finally:
    client.loop_stop()  # Arrêter la boucle lorsque le programme est terminé
