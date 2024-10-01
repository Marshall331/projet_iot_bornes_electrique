import paho.mqtt.client as mqtt
import time
import random

# Callback lors de la connexion au broker MQTT
def on_connect(client, userdata, flags, rc):
    print("Connected with result code " + str(rc))
    # Abonnement à un topic pour recevoir des messages
    client.subscribe("bornes/status")

# Callback lors de la réception d'un message
def on_message(client, userdata, msg):
    print(f"Received message on topic {msg.topic}: {msg.payload.decode()}")

# Connexion au broker MQTT
client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect("localhost", 1884, 60)  # Remplace par l'adresse IP et le port de ton broker MQTT local

# Simuler des données de charge
def simulate_borne_data():
    while True:
        # Simuler des données de charge pour une borne
        current_charge = round(random.uniform(0, 100), 2)  # Charge actuelle en kWh
        remaining_charge_time = round(random.uniform(5, 120), 2)  # Temps restant en minutes
        status = "charging" if current_charge < 100 else "available"  # Statut de la borne

        # Construire le message JSON avec les nouvelles données
        borne_data = {
            "id_borne": 1,
            "nom_borne": "Borne Capitole",
            "puissance_prise": 50,
            "geolocalisation": [43.6045, 1.444],
            "current_charge": current_charge,
            "remaining_charge_time": remaining_charge_time,
            "status": status
        }

        # Publier les données sur le topic "bornes/status"
        client.publish("bornes/status", str(borne_data))
        print(f"Published: {borne_data}")

        time.sleep(5)  # Attendre 5 secondes avant la prochaine publication

# Lancer la simulation en parallèle du traitement MQTT
client.loop_start()
simulate_borne_data()
