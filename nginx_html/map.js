var osmUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  osmAttrib =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  osm = L.tileLayer(osmUrl, { maxZoom: 18, attribution: osmAttrib });

var mymap = L.map("mapid", { zoomControl: false })
  .setView([43.59998, 1.43333], 13)
  .addLayer(osm);

// Ajout du zoom en bas à droite de la map
L.control
  .zoom({
    position: "bottomright",
  })
  .addTo(mymap);

// Ajout de la légende
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

  // Légende
  div.innerHTML =
    '<h4 class="text-center mt-2">Légende</h4>' +
    '<div class="d-flex align-items-center mt-1"><img src="' +
    createIcon("green") +
    '" style="width:32px; height:32px; margin-right:5px;"/>Bornes libres</div><hr>' +
    '<h5 class="text-center mt-2">Borne libre dans :</h5>' +
    '<div class="d-flex align-items-center mt-1"><img src="' +
    createIcon("blue") +
    '" style="width:32px; height:32px; margin-right:5px;"/>Moins de 5 minutes</div>' +
    '<div class="d-flex align-items-center mt-1"><img src="' +
    createIcon("orange") +
    '" style="width:32px; height:32px; margin-right:5px;"/>Entre 15 et 30 minutes</div>' +
    '<div class="d-flex align-items-center mt-1"><img src="' +
    createIcon("black") +
    '" style="width:32px; height:32px; margin-right:5px;"/>Plus de 30 minutes</div>';
  return div;
};

legend.addTo(mymap);

var markers = [];

// Fonction pour créer l'icône à partir du contenu SVG
function createIcon(color = "green") {
  // Couleur par défaut
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 576 512">
      <path fill="${color}" d="M96 0C60.7 0 32 28.7 32 64l0 384c-17.7 0-32 14.3-32 32s14.3 32 32 32l288 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l0-144 16 0c22.1 0 40 17.9 40 40l0 32c0 39.8 32.2 72 72 72s72-32.2 72-72l0-123.7c32.5-10.2 56-40.5 56-76.3l0-32c0-8.8-7.2-16-16-16l-16 0 0-48c0-8.8-7.2-16-16-16s-16 7.2-16 16l0 48-32 0 0-48c0-8.8-7.2-16-16-16s-16 7.2-16 16l0 48-16 0c-8.8 0-16 7.2-16 16l0 32c0 35.8 23.5 66.1 56 76.3L472 376c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-32c0-48.6-39.4-88-88-88l-16 0 0-192c0-35.3-28.7-64-64-64L96 0zM216.9 82.7c6 4 8.5 11.5 6.3 18.3l-25 74.9 57.8 0c6.7 0 12.7 4.2 15 10.4s.5 13.3-4.6 17.7l-112 96c-5.5 4.7-13.4 5.1-19.3 1.1s-8.5-11.5-6.3-18.3l25-74.9L96 208c-6.7 0-12.7-4.2-15-10.4s-.5-13.3 4.6-17.7l112-96c5.5-4.7 13.4-5.1 19.3-1.1z"/>
    </svg>`;

  const blob = new Blob([svgIcon], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  return url;
}

async function addMarker(point) {
  var existingMarker = markers.find((m) => m.id_borne === point.id_borne);
  if (existingMarker) {
    mymap.removeLayer(existingMarker);
  }

  const est_occupee = Math.random() < 0.5;
  const etat_borne = { est_occupee };

  if (est_occupee) {
    etat_borne.etat_charge = Math.floor(Math.random() * 101); // État de charge aléatoire entre 0 et 100

    const puissance = point.puissance_prise;
    const capacite_batterie = Math.floor(Math.random() * (65 - 45 + 1)) + 45; // Capacité entre 45 et 65 kWh
    const charge_requise = capacite_batterie * (1 - etat_borne.etat_charge / 100); // en kWh
    const temps_restant_heuristique = (charge_requise / puissance) * 60; // en minutes
    etat_borne.temps_restant = Math.max(0, Math.floor(temps_restant_heuristique));
    etat_borne.temps_restant_seconds = etat_borne.temps_restant * 60;
  }

  var latLng;
  if (point.geolocalisation) {
    latLng = [point.geolocalisation.lat, point.geolocalisation.lon];
  } else {
    latLng = [point.latitude, point.longitude];
  }

  // Récupérer les statistiques de la borne depuis InfluxDB
  const stats = await fetchBorneStats(point.id_borne);
  
  let pourcentageUtilisation = 0;
  if (stats) {
    // Exemple d'extraction du pourcentage d'utilisation à partir des données de stats
    const totalOccupee = stats.total_occuppee || 0; // Ajustez selon votre structure de réponse
    const totalLibre = stats.total_libre || 0;
    const totalTemps = totalOccupee + totalLibre;
    if (totalTemps > 0) {
      pourcentageUtilisation = (totalOccupee / totalTemps) * 100;
    }
  }

  var circleColor = "green";
  if (etat_borne.temps_restant > 30) {
    circleColor = "black";
  } else if (etat_borne.temps_restant >= 15 && etat_borne.temps_restant <= 30) {
    circleColor = "orange";
  } else if (etat_borne.temps_restant < 15) {
    circleColor = "blue";
  }

  const iconUrl = createIcon(circleColor);

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
      "<span id='chrono-" +
      point.id_borne +
      "' style='font-size: 1.3em;'><b>Borne disponible dans :</b><br>" +
      "Temps restant : " +
      formatTime(etat_borne.temps_restant_seconds) +
      "</span><br><br>";
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
    "<br>" +
    "Pourcentage d'utilisation: " +
    pourcentageUtilisation.toFixed(2) + "%<br></span>";

  marker.bindPopup(popupContent);
  markers.push(marker);

  // Si la borne est occupée, démarrer le chrono
  if (est_occupee) {
    etat_borne.temps_restant_seconds = etat_borne.temps_restant * 60;
    startChrono(point.id_borne, etat_borne.temps_restant_seconds);
  }
}

// Fonction qui formatte le temps
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes + "m" + "  " + remainingSeconds + "s";
}

// Fonction qui démarre le chrono
function startChrono(borneId, initialTime) {
  let remainingTime = initialTime;

  if (typeof window["chrono_" + borneId] !== "undefined") {
    clearInterval(window["chrono_" + borneId]);
  }

  window["chrono_" + borneId] = setInterval(() => {
    if (remainingTime > 0) {
      remainingTime--;
      const chronoElement = document.getElementById("chrono-" + borneId);
      if (chronoElement) {
        chronoElement.innerHTML =
          "<b>Borne disponible dans :</b><br>Temps restant : " +
          formatTime(remainingTime);
      }
    }

    if (remainingTime <= 0) {
      clearInterval(window["chrono_" + borneId]);
      delete window["chrono_" + borneId];
      var existingMarker = data.find((m) => m.id_borne === borneId);
      addMarker(existingMarker);
    }
  }, 1000);
}

function addMarkers(data) {
  markers.forEach((marker) => mymap.removeLayer(marker));
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
  var borneId = topic.split("/").pop();

  // console.log("Message reçu sur le topic : " + topic);
  // console.log("Contenu (stringifié) : " + JSON.stringify(payload, null, 2));

  var borne = data.find((b) => b.id_borne === borneId);

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

// Configuration des paramètres InfluxDB
const INFLUXDB_URL = "http://localhost:8086";
const INFLUXDB_TOKEN =
  "X1jcLw5MLXzppIkCPLgme1Aq0-nGVHa-mCi2Ma7BIqe-oBYw7TWGHZpRiOmbpTY_3vTGVHbM4_5GTZOAc6HfUQ=="; // Remplace par ton token
const INFLUXDB_ORG = "test"; // Nom de ton organisation
const INFLUXDB_BUCKET = "test"; // Le bucket contenant tes données

// Requête pour récupérer les données depuis InfluxDB
async function fetchDataFromInfluxDB() {
  const query = `
      from(bucket: "test")
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "statistiques_borne")
      |> pivot(rowKey:["_time"], columnKey: ["borne_id"], valueColumn: "_value")`;

  console.log("Requête envoyée:", query); // Log de la requête envoyée

  const url = `${INFLUXDB_URL}/api/v2/query?org=${INFLUXDB_ORG}`;
  console.log("URL de la requête:", url); // Log de l'URL de la requête

  const response = await fetch(url, {
      method: "POST",
      headers: {
          Authorization: "Token X1jcLw5MLXzppIkCPLgme1Aq0-nGVHa-mCi2Ma7BIqe-oBYw7TWGHZpRiOmbpTY_3vTGVHbM4_5GTZOAc6HfUQ==",
          "Content-Type": "application/vnd.flux",
      },
      body: query,
  });

  console.log("Réponse de la requête:", response); // Log de la réponse

  if (response.ok) {
      const data = await response.text();
      console.log("Données récupérées depuis InfluxDB:", data);

      // Traitement des données pour afficher les stats par borne
      const parsedData = parseInfluxDBData(data);
      console.log("Statistiques par borne:", parsedData);
      return parsedData;
  } else {
      const errorText = await response.text(); // Obtenez le texte de l'erreur
      console.error(
          "Erreur lors de la récupération des données:",
          response.statusText,
          errorText
      );
  }
}

// Fonction pour récupérer les statistiques de la borne depuis InfluxDB
async function fetchBorneStats(borneId) {
  const query = `from(bucket: "test")
    |> range(start: -1h)
    |> filter(fn: (r) => r._measurement == "statistiques_borne" && r.borne_id == "${borneId}")`;

  const url = `http://localhost:8086/api/v2/query?org=test`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: "Token X1jcLw5MLXzppIkCPLgme1Aq0-nGVHa-mCi2Ma7BIqe-oBYw7TWGHZpRiOmbpTY_3vTGVHbM4_5GTZOAc6HfUQ==",
      "Content-Type": "application/vnd.flux",
    },
    body: query,
  });

  if (response.ok) {
    const data = await response.json(); // ou response.text() selon la structure de la réponse
    console.log("Statistiques récupérées pour la borne:", data);
    return data; // Retourne les données récupérées
  } else {
    const errorText = await response.text();
    console.error("Erreur lors de la récupération des statistiques:", errorText);
    return null;
  }
}

// // Fonction pour analyser les données retournées par InfluxDB
// function parseInfluxDBData(data) {
//   const rows = data.split('\n').filter(row => row); // Séparer les lignes
//   const headers = rows[0].split(','); // Obtenir les en-têtes
//   const statsByBorne = {};

//   for (let i = 1; i < rows.length; i++) {
//       const values = rows[i].split(',');
//       const entry = {};

//       headers.forEach((header, index) => {
//           entry[header.trim()] = values[index].trim();
//       });

//       const borneId = entry.borne_id; // Remplacez par le nom exact de la colonne si nécessaire
//       if (!statsByBorne[borneId]) {
//           statsByBorne[borneId] = {
//               total_occuppee: 0,
//               total_libre: 0,
//               total_charge: 0,
//               total_temps_restant: 0
//           };
//       }

//       statsByBorne[borneId].total_occuppee += parseInt(entry.total_occuppee) || 0; // Assurez-vous que les champs existent
//       statsByBorne[borneId].total_libre += parseInt(entry.total_libre) || 0;
//       statsByBorne[borneId].total_charge += parseInt(entry.total_charge) || 0;
//       statsByBorne[borneId].total_temps_restant += parseInt(entry.total_temps_restant) || 0;
//   }

//   return statsByBorne;
// }

// // Appel de la fonction pour récupérer les données
// fetchDataFromInfluxDB();

