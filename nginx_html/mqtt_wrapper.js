var mqtt;
var reconnectTimeout = 2000;

var host = "192.168.1.86";  // Adresse de ton broker local (remplacer si nécessaire)
var port = 9001;            // Port du broker
var path = "/mqtt/";        // Chemin (changer si nécessaire)

var useTLS = false;
var cleansession = true;

function MQTTconnect() {
    mqtt = new Paho.MQTT.Client(
        host,
        port,
        path,
        "web_" + parseInt(Math.random() * 100, 10)  // Identifiant unique pour chaque client web
    );

    var options = {
        timeout: 3,
        useSSL: useTLS,
        cleanSession: cleansession,
        onSuccess: onConnect,
        onFailure: onFailure,
    };

    mqtt.onConnectionLost = onConnectionLost;
    mqtt.onMessageArrived = onMessageArrived;
    mqtt.connect(options);
}

// Fonction appelée lors de la connexion réussie
function onConnect() {
    console.log("Connected to " + host);
    mqtt.subscribe("bornes/status");  // Abonnement à un topic spécifique (par exemple "bornes/status")
}

// Gestion de la perte de connexion
function onConnectionLost(response) {
    if (response.errorCode !== 0) {
        console.log("Connection lost: " + response.errorMessage);
    }
    setTimeout(MQTTconnect, reconnectTimeout);
}

// Gestion des échecs de connexion
function onFailure(message) {
    console.log("Failed to connect: " + message.errorMessage);
    setTimeout(MQTTconnect, reconnectTimeout);
}

// Réception des messages
function onMessageArrived(message) {
    console.log("Message received on topic " + message.destinationName + ": " + message.payloadString);
    
    // Parse the JSON message payload
    try {
        var payload = JSON.parse(message.payloadString);
        displayBorneData(payload);  // Call function to display data
    } catch (e) {
        console.error("Error parsing message payload: " + e);
    }
}

// Function to display the borne data
function displayBorneData(data) {
    console.log("Borne ID: " + data.id_borne);
    console.log("Nom: " + data.nom_borne);
    console.log("Charge actuelle: " + data.current_charge + " kWh");
    console.log("Temps restant de charge: " + data.remaining_charge_time + " minutes");
    console.log("Statut: " + data.status);

    // Here you can update the UI with this data (e.g., HTML elements, charts, etc.)
}

// Envoi de messages depuis le client web
function sendMessage(topic, payload) {
    var message = new Paho.MQTT.Message(payload);
    message.destinationName = topic;
    mqtt.send(message);
    console.log("Message sent to topic " + topic + ": " + payload);
}
