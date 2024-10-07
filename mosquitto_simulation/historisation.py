import paho.mqtt.client as mqtt
from influxdb_client import InfluxDBClient, Point

bucket = "test"

client = InfluxDBClient(url="http://localhost:8086", token="X1jcLw5MLXzppIkCPLgme1Aq0-nGVHa-mCi2Ma7BIqe-oBYw7TWGHZpRiOmbpTY_3vTGVHbM4_5GTZOAc6HfUQ==", org="test")

write_api = client.write_api()

# Callback pour la connexion
def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")
    client.subscribe("#")
    
    
# Callback pour les messages reçus
def on_message(client, userdata, msg):
    print(f"Received message: {msg.payload.decode()} on topic {msg.topic}")
    
    # Préparer et formater les données pour l'insertion dans InfluxDB
    point = Point("mqtt_messages").tag("topic", msg.topic).field("message", msg.payload.decode())
    
    # Écriture des données dans InfluxDB
    write_api.write(bucket=bucket, record=point)

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
