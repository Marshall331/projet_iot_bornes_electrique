import paho.mqtt.client as mqtt
from influxdb import InfluxDBClient
import json

# Configuration de la base de données InfluxDB
INFLUXDB_HOST = 'localhost'
INFLUXDB_PORT = 8086
INFLUXDB_DB = 'test'
INFLUXDB_USER = 'test'  
INFLUXDB_PASSWORD = 'testtest'  

# Créer un client InfluxDB avec authentification
influx_client = InfluxDBClient(INFLUXDB_HOST, INFLUXDB_PORT, INFLUXDB_USER, INFLUXDB_PASSWORD, database=INFLUXDB_DB)

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
    influx_client.write_points([data])
    # print(f"Inserted data into InfluxDB: {data}")

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
