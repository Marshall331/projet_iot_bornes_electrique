import paho.mqtt.client as mqtt
import json
from influxdb import InfluxDBClient

# Configuration de la base de données InfluxDB
INFLUXDB_HOST = 'localhost'
INFLUXDB_PORT = 8086
INFLUXDB_DB = 'test'
INFLUXDB_USER = 'test'  # Remplacez par votre nom d'utilisateur
INFLUXDB_PASSWORD = 'test'  # Remplacez par votre mot de passe

# Créer un client InfluxDB avec authentification
try:
    influx_client = InfluxDBClient(INFLUXDB_HOST, INFLUXDB_PORT, INFLUXDB_USER, INFLUXDB_PASSWORD, database=INFLUXDB_DB)
    print("Connection successful!")
except Exception as e:
    print(f"Error connecting to InfluxDB: {e}")
    
# Callback pour la connexion
def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    client.subscribe("#")  # S'abonner à tous les sujets

# Callback pour les messages reçus
def on_message(client, userdata, msg):
    print(f"Received message: {msg.payload.decode()} on topic {msg.topic}")

    # Préparer les données pour l'insertion dans InfluxDB
    data = {
        "measurement": "mqtt_messages",
        "tags": {
            "topic": msg.topic
        },
        "fields": {
            "message": msg.payload.decode()
        }
    }

    # # Insérer les données dans InfluxDB
    try:
        influx_client.write_points([data])
    except Exception as e: 
        print(e)

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
