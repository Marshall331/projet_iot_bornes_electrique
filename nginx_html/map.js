var osmUrl = "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  osmAttrib =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  osm = L.tileLayer(osmUrl, { maxZoom: 18, attribution: osmAttrib });

var mymap = L.map("mapid").setView([43.59998, 1.43333], 13).addLayer(osm);

var markers = [];

function addMarkers(data) {
  markers.forEach((marker) => marker.remove());
  markers = [];

  data.forEach(function (point) {
    var latLng;
    if (point.geolocalisation) {
      latLng = [point.geolocalisation.lat, point.geolocalisation.lon];
    } else {
      latLng = [point.latitude, point.longitude];
    }

    var marker = L.marker(latLng).addTo(mymap);

    var popupContent =
      "<b>" +
      point.nom_borne +
      "</b><br>" +
      "Opérateur de mobilité: " +
      point.operateur_de_mobilite +
      "<br>" +
      "Opérateur: " +
      point.operateur +
      "<br>" +
      "ID de la borne: " +
      point.id_borne +
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
      "Connecteurs disponibles: " +
      point.connecteur_disponible_prise +
      "<br>" +
      "ID de la prise: " +
      point.id_prise;

    marker.bindPopup(popupContent);
    markers.push(marker);
  });
}

function filterMarkers(search) {
  if (search.length < 1) {
    addMarkers(data);
  } else {
    const data_filter = data.filter((borne) => {
      return (
        borne.nom_borne.toLowerCase().includes(search.toLowerCase()) ||
        borne.commune.toLowerCase().includes(search.toLowerCase())
      );
    });
    addMarkers(data_filter);
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
