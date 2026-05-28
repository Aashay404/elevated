// ccpfcenter_logic.js
import { apiClient } from "./api_client.js";
 
let userLocation = null;
let clinics = [];
let map = null;
let userMarker = null;
let clinicMarkers = [];
 
// Initialize map
function initMap() {
  map = L.map('map').setView([19.9975, 73.7898], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
}
 
// ---------------------------
// NEW: Load clinics from API
// ---------------------------
async function fetchCcpfCenters() {
  try {
    console.log("Fetching CCPF centers from API...");
 
    const response = await apiClient.callApi("/getCcpfCenters", "GET");
 
    if (!response.success) {
      console.error("API Error:", response.message, response.errorDetails);
      // Fallback: single default clinic if API fails
      clinics = [{
        id: "TC001",
        name: "CCPF Nashik Center",
        location: "Nashik",
        lat: 19.9975,
        lng: 73.7898,
        phone: "+91 9822432972",
        distance: 0
      }];
    } else {
      const centersList = response.data || [];
      console.log("Raw centersList from API:", centersList);
 
      // Map API response → clinics array used by the rest of the code
      clinics = centersList.map(center => {
        const lat = center.latitude ? parseFloat(center.latitude) : null;
        const lng = center.longitude ? parseFloat(center.longitude) : null;
 
        // Build a human-readable location text
        const parts = [];
        if (center.area) parts.push(center.area);
        if (center.city) parts.push(center.city);
        if (center.state) parts.push(center.state);
        const locationText = parts.join(", ");
 
        return {
          id: center.id?.toString() ?? "",         // use DB id as clinic id
          name: center.center_name || "CCPF Center",
          location: locationText || "",
          lat: lat,
          lng: lng,
          phone: center.phone || "",
          distance: 0
        };
      });
 
      console.log("Mapped clinics array:", clinics);
    }
 
    // After clinics are ready → init everything else
    initMap();
    addClinicMarkers();
    getCurrentLocation();
    // searchClinics will be called from getCurrentLocation after distance calc
 
  } catch (error) {
    console.error("Unexpected error in fetchCcpfCenters:", error);
 
    // Fallback if something explodes
    clinics = [{
      id: "TC001",
      name: "CCPF Nashik Center",
      location: "Nashik",
      lat: 19.9975,
      lng: 73.7898,
      phone: "+91 9822432972",
      distance: 0
    }];
 
    initMap();
    addClinicMarkers();
    getCurrentLocation();
  }
}
 
// ---------------------------
// Existing map / search logic
// ---------------------------
 
function addClinicMarkers() {
  if (!map) return;
 
  clinicMarkers.forEach(m => map.removeLayer(m));
  clinicMarkers = [];
 
  clinics.forEach(clinic => {
    if (clinic.lat && clinic.lng) {
      const marker = L.marker([clinic.lat, clinic.lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(map);
 
      marker.bindPopup(`
        <div style="text-align: center;">
          <b>${clinic.name}</b><br>
          <small>${clinic.location}</small><br>
          <a href="appointment.html?clinic=${clinic.id}"
             class="btn btn-sm btn-primary mt-2"
             style="background: #007bff; color: white; padding: 5px 10px; text-decoration: none; border-radius: 3px;">
             Book Appointment
          </a>
        </div>
      `);
 
      marker.bindTooltip(clinic.name, {
        permanent: true,
        direction: 'top',
        offset: [0, -45],
        className: 'clinic-tooltip'
      });
 
      clinicMarkers.push(marker);
    }
  });
 
  console.log("Clinic markers added on map:", clinicMarkers.length);
}
 
function getCurrentLocation() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by this browser.');
    return;
  }
 
  const locationInput = document.getElementById('locationInput');
  if (locationInput) {
    locationInput.value = 'Getting your location...';
  }
 
  navigator.geolocation.getCurrentPosition(
    function (position) {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
 
      console.log("User location:", userLocation);
 
      if (locationInput) {
        locationInput.value = 'Current Location (GPS)';
      }
 
      if (userMarker && map) {
        map.removeLayer(userMarker);
      }
 
      if (map) {
        userMarker = L.marker([userLocation.lat, userLocation.lng], {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        }).addTo(map);
 
        userMarker.bindPopup('<b>Your Location</b>');
 
        const goBtn = document.getElementById('goToMyLocation');
        if (goBtn) goBtn.style.display = 'inline-block';
      }
 
      calculateDistances();
      searchClinics();
    },
    function (error) {
      console.warn("Location access error:", error);
      alert('Location access denied. Showing only clinics.');
      if (locationInput) {
        locationInput.value = '';
      }
      // We still allow clinics list / markers without distance
      searchClinics();
    }
  );
}
 
document.getElementById('goToMyLocation')?.addEventListener('click', function () {
  if (userLocation && map) {
    map.setView([userLocation.lat, userLocation.lng], 15);
    if (userMarker) {
      userMarker.openPopup();
    }
  }
});
 
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
 

function searchClinics() {
  const locationInput = document.getElementById('locationInput');
  const resultsDiv = document.getElementById('searchResults');
  if (!resultsDiv) return;
 
  const location = (locationInput?.value || '').toLowerCase();
 
  let filteredClinics = clinics.filter(clinic => {
    const locationMatch =
      !location ||
      location.includes('current location') ||
      location.includes('gps') ||
      (clinic.location || '').toLowerCase().includes(location);
 
    return locationMatch;
  });
 
  // Sort by distance only when we have a valid distance
  filteredClinics.sort((a, b) => {
    const da = (typeof a.distance === "number" && isFinite(a.distance)) ? a.distance : Number.POSITIVE_INFINITY;
    const db = (typeof b.distance === "number" && isFinite(b.distance)) ? b.distance : Number.POSITIVE_INFINITY;
    return da - db;
  });
 
  console.log("Filtered clinics:", filteredClinics);
 
  if (!filteredClinics.length) {
    resultsDiv.innerHTML = '<p class="text-center text-muted">No clinics found. Try different search criteria.</p>';
    return;
  }
 
  let html = '<div class="row">';
  filteredClinics.forEach(clinic => {
    const hasValidDistance =
      userLocation &&
      typeof clinic.distance === "number" &&
      isFinite(clinic.distance);
 
    const distanceText = hasValidDistance
      ? `${clinic.distance.toFixed(1)} km away`
      : 'Distance unknown';
 
    html += `
      <div class="col-md-6 mb-3">
        <div class="card">
          <div class="card-body">
            <h6 class="card-title">${clinic.name}</h6>
            <p class="card-text small">
              <i class="fas fa-map-marker-alt"></i> ${clinic.location} (${distanceText})<br>
              <i class="fas fa-phone"></i> ${clinic.phone}
            </p>
            <a href="appointment.html?id=${clinic.id}" class="btn btn-sm btn-primary">Book Appointment</a>
          </div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  resultsDiv.innerHTML = html;
}

function calculateDistances() {
  if (!userLocation) return;
 
  clinics.forEach(clinic => {
    const lat = typeof clinic.lat === "number" ? clinic.lat : parseFloat(clinic.lat);
    const lng = typeof clinic.lng === "number" ? clinic.lng : parseFloat(clinic.lng);
 
    if (!isNaN(lat) && !isNaN(lng)) {
      clinic.distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        lat,
        lng
      );
    } else {
      clinic.distance = null; // mark as unknown
    }
  });
 
  console.log("Distances calculated:", clinics.map(c => ({
    id: c.id,
    name: c.name,
    distance: c.distance
  })));
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function () {
  fetchCcpfCenters();  // this now loads from API, then kicks off map + location logic
});
window.getCurrentLocation = getCurrentLocation;
window.searchClinics = searchClinics;