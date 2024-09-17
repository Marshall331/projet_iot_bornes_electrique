# Utiliser l'image officielle Eclipse Mosquitto comme base
FROM eclipse-mosquitto:2

# Copier le fichier de configuration personnalisé
COPY config/mosquitto.conf /mosquitto/config/mosquitto.conf

# Exposer les ports MQTT et WebSocket
EXPOSE 1883 9001

# Démarrer Mosquitto avec la configuration personnalisée
CMD ["/usr/sbin/mosquitto", "-c", "/mosquitto/config/mosquitto.conf"]
