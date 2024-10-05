import paho.mqtt.client as mqtt
import time
import json
import random
import os

# Nom du fichier de données
data_file = "../nginx_html/data/bornes-recharge-electrique.json"

# Charger les données du fichier JSON
with open(data_file, 'r') as file:
    bornes_data = json.load(file)

# Créer un dictionnaire pour faciliter l'accès aux données des bornes
bornes_dict = {borne['id_borne']: borne for borne in bornes_data}

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
# client.on_message = on_message

# Connexion au broker
client.connect("localhost", 1884, 60)

# Fonction pour générer un état simulé pour chaque borne
def simulate_borne_state(borne):
    est_occupee = random.choice([True, False])
    etat_borne = {"est_occupee": est_occupee}

    if est_occupee and borne:
        etat_borne["etat_charge"] = random.randint(0, 100)  # État de charge aléatoire entre 0 et 100
        puissance = borne["puissance_prise"]  # Récupérer la puissance de la borne

        # Simuler la capacité de la batterie du véhicule
        capacite_batterie = random.randint(45, 65) 

        # Calculer le temps restant basé sur l'état de charge, la puissance de la borne, et la capacité de la batterie
        charge_requise = capacite_batterie * (1 - etat_borne["etat_charge"] / 100)  
        temps_restant_heuristique = (charge_requise / puissance) * 60 

        etat_borne["temps_restant"] = max(0, int(temps_restant_heuristique))  


    return etat_borne

# Fonction pour mettre à jour un sous-ensemble de bornes périodiquement
def update_bornes_periodically(client, interval):
    while True:
        # Mettre à jour 10 à 15 bornes
        for _ in range(random.randint(1, 2)):
            borne_id = random.choice(list(bornes_dict.keys()))  # Choisir une borne aléatoire par ID
            borne = bornes_dict[borne_id]
            etat_borne = simulate_borne_state(borne)
            client.publish(f"chargesense/bornes/{borne_id}", json.dumps(etat_borne))
            print(f"Updated data sent for borne {borne_id}: {etat_borne}")

        time.sleep(interval)

# Boucle pour recevoir les messages
client.loop_start()

try:
    update_bornes_periodically(client, 5)  # Mettre à jour toutes les 10 secondes
except KeyboardInterrupt:
    print("Process interrupted")
finally:
    client.loop_stop()  
