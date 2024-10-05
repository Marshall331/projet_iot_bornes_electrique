var osmUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  osmAttrib =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  osm = L.tileLayer(osmUrl, { maxZoom: 18, attribution: osmAttrib });

var mymap = L.map("mapid").setView([43.59998, 1.43333], 13).addLayer(osm);

// Ajouter la légende
var legend = L.control({ position: "topright" });

legend.onAdd = function (map) {
  var div = L.DomUtil.create("div", "info legend");

  div.style.right = "50px";
  div.style.transform = "translateY(50%)";
  div.style.background = "white";
  div.style.padding = "15px";
  div.style.borderRadius = "5px";
  div.style.boxShadow = "0 0 5px rgba(0, 0, 0, 0.5)";
  div.style.zIndex = "1000";
  div.style.fontSize = "1.5em";

  // Contenu de la légende
  div.innerHTML =
    '<h4 class="text-center">Légende</h4>' +
    '<div><img src="' +
    createIcon("green") +
    '" style="width:32px; height:32px; margin-right:5px;"/>Bornes libres</div><hr>' +
    '<h5 class="text-center">Prochaine borne libre dans :</h5>' +
    '<div><img src="' +
    createIcon("blue") +
    '" style="width:32px; height:32px; margin-right:5px;"/>Moins de 5 minutes restantes</div>' +
    '<div><img src="' +
    createIcon("orange") +
    '" style="width:32px; height:32px; margin-right:5px;"/>Entre 15 et 30 minutes restantes</div>' +
    '<div><img src="' +
    createIcon("red") +
    '" style="width:32px; height:32px; margin-right:5px;"/>Plus de 30 minutes restantes</div>';

  return div;
};

legend.addTo(mymap);

var markers = [];

// Fonction pour créer l'icône à partir du contenu SVG
function createIcon(color = "black") {
  // Couleur par défaut
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 576 512">
      <path fill="${color}" d="M96 0C60.7 0 32 28.7 32 64l0 384c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l0-144 16 0c22.1 0 40 17.9 40 40l0 32c0 39.8 32.2 72 72 72s72-32.2 72-72l0-123.7c32.5-10.2 56-40.5 56-76.3l0-32c0-8.8-7.2-16-16-16l-16 0 0-48c0-8.8-7.2-16-16-16s-16 7.2-16 16l0 48-32 0 0-48c0-8.8-7.2-16-16-16s-16 7.2-16 16l0 48-16 0c-8.8 0-16 7.2-16 16l0 32c0 35.8 23.5 66.1 56 76.3L472 376c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-32c0-48.6-39.4-88-88-88l-16 0 0-192c0-35.3-28.7-64-64-64L96 0zM216.9 82.7c6 4 8.5 11.5 6.3 18.3l-25 74.9 57.8 0c6.7 0 12.7 4.2 15 10.4s.5 13.3-4.6 17.7l-112 96c-5.5 4.7-13.4 5.1-19.3 1.1s-8.5-11.5-6.3-18.3l25-74.9L96 208c-6.7 0-12.7-4.2-15-10.4s-.5-13.3 4.6-17.7l112-96c5.5-4.7 13.4-5.1 19.3-1.1z"/>
    </svg>`;

  const blob = new Blob([svgIcon], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  return url;
}

// Fonction pour ajouter un seul marqueur sur la carte
function addMarker(point) {
  var existingMarker = markers.find((m) => m.id_borne === point.id_borne);
  if (existingMarker) {
    mymap.removeLayer(existingMarker);
  }

  const est_occupee = Math.random() < 0.5;
  const etat_borne = { est_occupee };

  if (est_occupee) {
    etat_borne.etat_charge = Math.floor(Math.random() * 101); // État de charge aléatoire entre 0 et 100

    const puissance = point.puissance_prise;
    // Simuler la capacité de la batterie du véhicule
    const capacite_batterie = Math.floor(Math.random() * (65 - 45 + 1)) + 45; // Capacité entre 45 et 65 kWh

    // Calculer le temps restant basé sur l'état de charge, la puissance de la borne, et la capacité de la batterie
    const charge_requise =
      capacite_batterie * (1 - etat_borne.etat_charge / 100); // en kWh
    const temps_restant_heuristique = (charge_requise / puissance) * 60; // en minutes

    etat_borne.temps_restant = Math.max(
      0,
      Math.floor(temps_restant_heuristique)
    );
  }

  var circleColor = "green";
  if (etat_borne.temps_restant > 30) {
    circleColor = "red";
  } else if (etat_borne.temps_restant >= 15 && etat_borne.temps_restant <= 30) {
    circleColor = "orange";
  } else if (etat_borne.temps_restant < 15) {
    circleColor = "blue";
  }

  var latLng;
  if (point.geolocalisation) {
    latLng = [point.geolocalisation.lat, point.geolocalisation.lon];
  } else {
    latLng = [point.latitude, point.longitude];
  }

  const iconUrl = createIcon(circleColor);

  // Création du marqueur
  var marker = L.marker(latLng, {
    icon: L.icon({
      iconUrl: iconUrl,
      iconSize: [40, 40],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
    }),
  }).addTo(mymap);

  var popupContent = "";

  if (est_occupee) {
    popupContent +=
      "<span style='font-size: 1.3em;'><b>Prochaine borne disponible dans :</b><br>" +
      "Temps restant : " +
      etat_borne.temps_restant +
      " minutes<br>" +
      "État de charge de la voiture : " +
      etat_borne.etat_charge +
      "%</span><br><br>";
  }

  popupContent +=
    "<span style='font-size: 1.2em;'><b>" +
    point.nom_borne +
    "</b><br>" +
    "Opérateur : " +
    point.operateur_de_mobilite +
    "<br>";

  var adresse = "";
  if (point.numero_rue) {
    adresse += point.numero_rue + " ";
  }
  adresse +=
    point.libelle_voie +
    ", " +
    point.commune +
    " " +
    point.code_postal +
    "<br>";

  popupContent +=
    "Adresse: " +
    adresse +
    "Marque: " +
    point.marque_borne +
    "<br>" +
    "Modèle: " +
    point.modele_borne +
    "<br>" +
    "Type de chargement: " +
    point.type_chargement +
    "<br>" +
    "Puissance de la prise: " +
    point.puissance_prise +
    " kW<br>" +
    "Type de connecteurs disponibles: " +
    point.connecteur_disponible_prise +
    "<br></span>";

  marker.bindPopup(popupContent);
  markers.push(marker); // Ajouter le marqueur à la collection
}

function addMarkers(data) {
  markers.forEach(marker => mymap.removeLayer(marker));
  markers = [];

  data.forEach(function (point) {
    addMarker(point);
  });
}

// Fonction de filtrage des marqueurs
function filterMarkers(search) {
  if (search.length < 1) {
    addMarkers(data); // Reajouter tous les marqueurs si aucune recherche
  } else {
    const data_filter = data.filter((borne) => {
      return (
        borne.nom_borne.toLowerCase().includes(search.toLowerCase()) ||
        borne.commune.toLowerCase().includes(search.toLowerCase())
      );
    });
    addMarkers(data_filter); // Ajouter les marqueurs filtrés
  }
}

var data = {};

fetch("data/bornes-recharge-electrique.json")
  .then((response) => response.json())
  .then((dataFetche) => {
    data = dataFetche;
    addMarkers(data);
  })
  .catch((error) =>
    console.error("Erreur lors du chargement des données:", error)
  );

document.getElementById("searchInput").addEventListener("input", function (e) {
  var search = document.getElementById("searchInput").value;
  search = search.trim();
  filterMarkers(search);
});

const client = new Paho.MQTT.Client("localhost", 9002, "test");

client.onConnectionLost = function (responseObject) {
  console.log("Connection lost: " + responseObject.errorMessage);
};

client.onMessageArrived = function (message) {
  var payload = JSON.parse(message.payloadString);
  var topic = message.destinationName;
  var borneId = topic.split("/").pop(); // Récupère l'ID de la borne à partir du topic

  var borne = data.find((b) => b.id_borne === borneId);

  console.log(borne);

  if (borne) {
    var latLng;
    if (borne.geolocalisation) {
      latLng = [borne.geolocalisation.lat, borne.geolocalisation.lon];
    } else {
      latLng = [borne.latitude, borne.longitude];
    }

    borne.est_occupee = payload.est_occupee;
    borne.etat_charge = payload.etat_charge;
    borne.temps_restant = payload.temps_restant;

    addMarker(borne, latLng);
  }
};

client.connect({
  onSuccess: onConnect,
  onFailure: function (message) {
    console.error("Connection failed: " + message.errorMessage);
  },
});

function onConnect() {
  console.log("Connected to the MQTT broker.");
  client.subscribe("#", {
    onSuccess: function () {
      console.log("Subscribed to all topics.");
    },
    onFailure: function (message) {
      console.error("Failed to subscribe: " + message.errorMessage);
    },
  });
}
