const horaPlanets = ["☉ Sun (Surya)", "♀ Venus (Shukra)","☿ Mercury (Budha)", "☾ Moon (Chandra)", "♄ Saturn (Shani)", "♃ Jupiter (Guru)", "♂ Mars (Mangal)" ];
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
    navigator.geolocation.getCurrentPosition(showPosition);
  } else {
    document.getElementById("location").innerText = "Geolocation not supported.";
  }
}

function showPosition(position) {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  document.getElementById("location").innerHTML = `📍 Latitude: ${lat.toFixed(2)}, Longitude: ${lon.toFixed(2)}`;

  renderHoras(lat, lon);
}

function getWeekdayStartIndex(date) {
  return date.getDay(); 
}

// Round minutes based on seconds
function roundMinutes(date) {
  let minutes = date.getMinutes();
  const seconds = date.getSeconds();
  if (seconds < 30) {
    minutes = minutes; // floor
  } else if (seconds >= 30) {
    minutes += 1; // ceil
  }
  // Adjust hour if minutes >= 60
  let hour = date.getHours();
  if (minutes >= 60) {
    minutes -= 60;
    hour += 1;
  }
  return { hours: hour, minutes: minutes };
}

function formatTime(date) {
  const r = roundMinutes(date);
  return `${r.hours}:${String(r.minutes).padStart(2,"0")}`;
}

function renderHoras(lat, lon) {
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
  const nightDuration = (sunrise.getTime() + 24*60*60*1000 - sunset.getTime()) / 12;

  let header = "<tr><th>#</th><th>Hora Planet</th><th>Indicators</th><th>Time</th></tr>";

  // Day Horas
  dayTable.innerHTML = header;
  for(let i=0;i<12;i++){
    const planetIndex = (startIndex + i-1) % 7;
    const horaStart = new Date(sunrise.getTime() + i*dayDuration);
    const horaEnd = new Date(sunrise.getTime() + (i+1)*dayDuration);
    const row = document.createElement("tr");
    if(now>=horaStart && now<horaEnd) row.classList.add("active-day");
    row.innerHTML = `
      <td>${i+1}</td>
      <td>${horaPlanets[planetIndex]}</td>
      <td>${horaMeanings[planetIndex]}</td>
      <td>${formatTime(horaStart)} - ${formatTime(horaEnd)}</td>
    `;
    dayTable.appendChild(row);
  }

  // Night Horas
  nightTable.innerHTML = header;
  const nightStartIndex = (startIndex + 12) % 7;
  for(let i=0;i<12;i++){
    const planetIndex = (nightStartIndex + i-1) % 7;
    const horaStart = new Date(sunset.getTime() + i*nightDuration);
    const horaEnd = new Date(sunset.getTime() + (i+1)*nightDuration);
    const row = document.createElement("tr");
    if(now>=horaStart && now<horaEnd) row.classList.add("active-night");
    row.innerHTML = `
      <td>${i+1}</td>
      <td>${horaPlanets[planetIndex]}</td>
      <td>${horaMeanings[planetIndex]}</td>
      <td>${formatTime(horaStart)} - ${formatTime(horaEnd)}</td>
    `;
    nightTable.appendChild(row);
  }

  daySection.style.display = "block";
  nightSection.style.display = "block";
}
