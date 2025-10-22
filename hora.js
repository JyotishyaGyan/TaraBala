const horaPlanets = ["☉ Sun (Surya)", "♀ Venus (Shukra)", "☿ Mercury (Budha)", "☾ Moon (Chandra)", "♄ Saturn (Shani)", "♃ Jupiter (Guru)", "♂ Mars (Mangal)"];
const horaMeanings = [
  "Leadership",
  "Financing",
  "Intellect",
  "Emotional Balance",
  "Patience",
  "Optimism",
  "Initiations"
];

function getLocation() {
  if (navigator.geolocation) {
    // Reset UI to avoid stale data
    resetUI();
    document.getElementById("location").innerText = "Fetching location...";

    // Check localStorage for cached location
    const cachedLocation = localStorage.getItem("userLocation");
    if (cachedLocation) {
      const { lat, lon, timestamp } = JSON.parse(cachedLocation);
      const now = Date.now();
      const sixtyMinutes = 60 * 60 * 1000; // 60 minutes in milliseconds
      if (now - timestamp < sixtyMinutes) {
        // Use cached location if less than 60 minutes old
        document.getElementById("location").innerHTML = `📍 Latitude: ${parseFloat(lat).toFixed(2)}, Longitude: ${parseFloat(lon).toFixed(2)}`;
        setTimeout(() => renderHoras(lat, lon), 0);
        return;
      } else {
        // Clear expired location data
        localStorage.removeItem("userLocation");
      }
    }

    // Request new location if no valid cache
    navigator.geolocation.getCurrentPosition(showPosition, showError, {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 30000
    });
  } else {
    document.getElementById("location").innerText = "Geolocation not supported.";
  }
}

function resetUI() {
  document.getElementById("location").innerText = "";
  document.getElementById("sunriseTime").innerText = "";
  document.getElementById("sunsetTime").innerText = "";
  document.getElementById("dayHoraTable").innerHTML = "";
  document.getElementById("nightHoraTable").innerHTML = "";
  document.getElementById("dayHoraSection").style.display = "none";
  document.getElementById("nightHoraSection").style.display = "none";
}

function showError(error) {
  let message = "Unable to retrieve location.";
  switch (error.code) {
    case error.PERMISSION_DENIED:
      message = "Location permission denied. Please allow access and try again.";
      break;
    case error.POSITION_UNAVAILABLE:
      message = "Location information is unavailable.";
      break;
    case error.TIMEOUT:
      message = "Location request timed out. Please try again.";
      break;
    default:
      message = "An unknown error occurred.";
      break;
  }
  document.getElementById("location").innerText = message;
}

function showPosition(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  document.getElementById("location").innerHTML = `📍 Latitude: ${lat.toFixed(2)}, Longitude: ${lon.toFixed(2)}`;

  // Store location and timestamp in localStorage
  localStorage.setItem("userLocation", JSON.stringify({
    lat,
    lon,
    timestamp: Date.now()
  }));

  setTimeout(() => renderHoras(lat, lon), 0);
}

function getWeekdayStartIndex(date) {
  return date.getDay();
}

function roundMinutes(date) {
  let minutes = date.getMinutes();
  const seconds = date.getSeconds();
  if (seconds < 30) {
    minutes = minutes; // floor
  } else if (seconds >= 30) {
    minutes += 1; // ceil
  }
  let hour = date.getHours();
  if (minutes >= 60) {
    minutes -= 60;
    hour += 1;
  }
  return { hours: hour, minutes: minutes };
}

function formatTime(date) {
  const r = roundMinutes(date);
  return `${r.hours}:${String(r.minutes).padStart(2, "0")}`;
}

function renderHoras(lat, lon) {
  try {
    const now = new Date();
    const sunrise = SunCalc.getTimes(now, lat, lon).sunrise;
    const sunset = SunCalc.getTimes(now, lat, lon).sunset;

    document.getElementById("sunriseTime").innerText = `(Sunrise: ${formatTime(sunrise)})`;
    document.getElementById("sunsetTime").innerText = `(Sunset: ${formatTime(sunset)})`;

    const dayTable = document.getElementById("dayHoraTable");
    const nightTable = document.getElementById("nightHoraTable");
    const daySection = document.getElementById("dayHoraSection");
    const nightSection = document.getElementById("nightHoraSection");

    dayTable.innerHTML = nightTable.innerHTML = "";

    const startIndex = getWeekdayStartIndex(now);

    const dayDuration = (sunset - sunrise) / 12;
    const nightDuration = (sunrise.getTime() + 24 * 60 * 60 * 1000 - sunset.getTime()) / 12;

    let header = "<tr><th>#</th><th>Hora Planet</th><th>Indicators</th><th>Time</th></tr>";

    // Day Horas
    dayTable.innerHTML = header;
    for (let i = 0; i < 12; i++) {
      const planetIndex = (startIndex + i - 1) % 7;
      const horaStart = new Date(sunrise.getTime() + i * dayDuration);
      const horaEnd = new Date(sunrise.getTime() + (i + 1) * dayDuration);
      const row = document.createElement("tr");
      if (now >= horaStart && now < horaEnd) row.classList.add("active-day");
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${horaPlanets[planetIndex]}</td>
        <td>${horaMeanings[planetIndex]}</td>
        <td>${formatTime(horaStart)} - ${formatTime(horaEnd)}</td>
      `;
      dayTable.appendChild(row);
    }

    // Night Horas
    nightTable.innerHTML = header;
    const nightStartIndex = (startIndex + 12) % 7;
    for (let i = 0; i < 12; i++) {
      const planetIndex = (nightStartIndex + i - 1) % 7;
      const horaStart = new Date(sunset.getTime() + i * nightDuration);
      const horaEnd = new Date(sunset.getTime() + (i + 1) * nightDuration);
      const row = document.createElement("tr");
      if (now >= horaStart && now < horaEnd) row.classList.add("active-night");
      row.innerHTML = `
        <td>${i + 1}</td>
        <td>${horaPlanets[planetIndex]}</td>
        <td>${horaMeanings[planetIndex]}</td>
        <td>${formatTime(horaStart)} - ${formatTime(horaEnd)}</td>
      `;
      nightTable.appendChild(row);
    }

    daySection.style.display = "block";
    nightSection.style.display = "block";
  } catch (e) {
    document.getElementById("location").innerText = "Error calculating horas. Please try again.";
    console.error("Error in renderHoras:", e);
  }
}

// Handle page restore from cache
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    resetUI();
    // Check if cached location is still valid
    const cachedLocation = localStorage.getItem("userLocation");
    if (cachedLocation) {
      const { lat, lon, timestamp } = JSON.parse(cachedLocation);
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000;
      if (now - timestamp < tenMinutes) {
        document.getElementById("location").innerHTML = `📍 Latitude: ${parseFloat(lat).toFixed(2)}, Longitude: ${parseFloat(lon).toFixed(2)}`;
        setTimeout(() => renderHoras(lat, lon), 0);
      } else {
        localStorage.removeItem("userLocation");
      }
    }
  }
});

// Ensure button is clickable even after navigation
document.addEventListener('DOMContentLoaded', () => {
  const locationButton = document.querySelector('button[onclick="getLocation()"]');
  if (locationButton) {
    locationButton.removeAttribute('onclick');
    locationButton.addEventListener('click', getLocation);
  }
});