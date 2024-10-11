import paho.mqtt.client as mqtt
import json
from influxdb_client import InfluxDBClient, Point

bucket = "test"

client = InfluxDBClient(url="http://localhost:8086", token="X1jcLw5MLXzppIkCPLgme1Aq0-nGVHa-mCi2Ma7BIqe-oBYw7TWGHZpRiOmbpTY_3vTGVHbM4_5GTZOAc6HfUQ==", org="test")

write_api = client.write_api()

# Dictionnaire pour stocker les statistiques par borne
borne_stats = {}

# Callback pour la connexion
def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    client.subscribe("#")  # S'abonner à tous les topics

# Callback pour les messages reçus
def on_message(client, userdata, msg):
    print(f"Received message: {msg.payload.decode()} on topic {msg.topic}")
    
    # Extraire l'identifiant de la borne à partir du topic
    borne_id = msg.topic.split('/')[-1]  # Extrait l'ID de la borne du topic

    # Analyser le message JSON
    try:
        message_data = json.loads(msg.payload.decode())
    except json.JSONDecodeError:
        print("Invalid JSON data")
        return

    # Initialiser les statistiques de la borne si non déjà existante
    if borne_id not in borne_stats:
        borne_stats[borne_id] = {
            'total_occuppee': 0,
            'total_libre': 0,
            'total_charge': 0,
            'total_temps_restant': 0
        }

    # Mettre à jour les statistiques en fonction des données reçues
    if message_data.get("est_occupee"):
        borne_stats[borne_id]['total_occuppee'] += 1
        borne_stats[borne_id]['total_charge'] += message_data.get("etat_charge", 0)
        borne_stats[borne_id]['total_temps_restant'] += message_data.get("temps_restant", 0)
    else:
        borne_stats[borne_id]['total_libre'] += 1

        # Préparer et formater les données pour l'insertion dans InfluxDB
    point = Point("statistiques_borne") \
        .tag("borne_id", borne_id) \
        .field("total_occuppee", borne_stats[borne_id]['total_occuppee']) \
        .field("total_libre", borne_stats[borne_id]['total_libre']) \
        .field("total_charge", borne_stats[borne_id]['total_charge']) \
        .field("total_temps_restant", borne_stats[borne_id]['total_temps_restant'])

    # Écriture des données dans InfluxDB
    try:
        write_api.write(bucket=bucket, record=point)
        print(f"Insertion réussie pour {borne_id}: {borne_stats[borne_id]}")
    except Exception as e:
        print(f"Erreur lors de l'insertion des données pour {borne_id}: {e}")

    # Afficher les statistiques
    print(f"Stats pour {borne_id}: {borne_stats[borne_id]}")

# Créer un client MQTT
client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

# Connexion au broker
client.connect("localhost", 1884, 60)

# Boucle pour recevoir les messages
client.loop_start()

try:
    while True:
        pass  # Boucle infinie pour garder le script en cours d'exécution
except KeyboardInterrupt:
    print("Process interrupted")
finally:
    client.loop_stop()