import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

async function loadMessages() {
  const querySnapshot = await getDocs(collection(db, "emergency"));
  const allUsersContainer = document.getElementById("allUsers");
  const locations = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${data.name}</td>
      <td>${data.contactnumber}</td>
      <td>${data.email}</td>
      <td>${data.emergencymessage}</td>
      <td>${data.emergencytype}</td>
      <td>${new Date(data.date.seconds * 1000).toLocaleString()}</td>
    `;

    allUsersContainer.appendChild(row);

    // Collect coordinates for map pins
    if (data.latlong) {
      locations.push({
        name: data.name,
        lat: data.latlong.latitude,
        lng: data.latlong.longitude
      });
    }
  });

  // Initialize the map with collected coordinates
  initMap(locations);
}

// Initialize the map
function initMap(locations) {
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: locations.length ? { lat: locations[0].lat, lng: locations[0].lng } : { lat: 14.960181, lng: 120.89831 }
  });

  // Add markers for each location
  locations.forEach((location) => {
    new google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map: map,
      title: location.name
    });
  });
}

// Load messages on page load
window.onload = loadMessages;
