let gameId = null;

//definitions utilsiées dans les fonctions
const adresseInput = document.getElementById("adresse");
const carteInput = document.getElementById("carte");
const mapElement = document.getElementById("map");
const choix_couleur = document.getElementById("choix_couleur");
const refreshButton = document.getElementById("refresh");

function getAdresse() {
  return adresseInput.value;
}

function getCarte() {
  return carteInput.value;
}

// preinit
async function preinit() {
  const adresse = getAdresse();
  const carte = getCarte();
  try {
    const res = await fetch(`${adresse}/api/v1/${carte}/preinit`, { credentials: "include" });
    const { key } = await res.json();
    console.log("Preinit key:", key);
    init(key);
  } catch (error) {
    console.error("Erreur preinit:", error);
    //comme en cpp
  }
}

// initialisation
async function init(key) {
  const adresse = getAdresse();
  const carte = getCarte();
  try {
    const res = await fetch(`${adresse}/api/v1/${carte}/init?key=${key}`, { credentials: "include" });
    const { id, nx, ny, timeout, data } = await res.json();
    gameId = id;
    console.log("Game ID:", gameId);
    let contenu = "";

    for (let li = 0; li < ny; li++) {
      for (let col = 0; col < nx; col++) {
        const [r, g, b] = data[col][li];
        contenu += `<div class='pixel' id="l${li}_c${col}" style="background-color: rgb(${r}, ${g}, ${b})"></div>`;
      }
    }
    mapElement.innerHTML = contenu;
    // Ajuster la grille selon la taille de la carte
    mapElement.style.gridTemplateColumns = `repeat(${nx}, 50px)`;
    mapElement.style.gridTemplateRows = `repeat(${ny}, 50px)`;

    if (timeout) {
      attenteDisplay.textContent = `Attente: ${timeout} ms`;
    }
    setInterval(() => deltas(gameId), 300);
  } catch (error) {
    console.error("Erreur lors de l'initialisation:", error);
  }
}

async function deltas(id) {
  const adresse = getAdresse();
  const carte = getCarte();
  try {
    const res = await fetch(`${adresse}/api/v1/${carte}/deltas?id=${id}`, { credentials: "include" });
    const { deltas } = await res.json();
    for (const [x, y, r, g, b] of deltas) {
      console.log("Delta reçu:", [x, y, r, g, b]);
      const pixel = document.getElementById(`l${y}_c${x}`);
      if (pixel) {
        pixel.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      }
    }
  } catch (error) {
    console.error("Erreur lors du fetching des deltas:", error);
  }
}

// màj des pixels
async function updatePixel(col, li, hexColor) {
  const adresse = getAdresse();
  const carte = getCarte();
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  try {
    const url = `${adresse}/api/v1/${carte}/set/${gameId}/${col}/${li}/${r}/${g}/${b}`;
    console.log("Mise à jour du pixel via:", url);
    await fetch(url, { credentials: "include" });
  } catch (error) {
    console.error("Erreur lors du setPixel:", error);
  }
}

let heure_precedent = 0;

//tentative d'explicitation du temps d'attente
const delai = 10000
const attenteDisplay = document.getElementById("attendre");

const attenteText = document.getElementById("compte_rebours");
const progressBar = document.getElementById("progress-bar");

function countdown() {
    const nao = Date.now();
    const ecart = nao - heure_precedent;
    if (ecart < delai) {
        const restant =(( delai - ecart)/1000).toFixed(1);
        attenteDisplay.textContent = `Attente: ${restant} secondes`;
        const pourcentage = ((DELAI - ecart) / DELAI) * 100;
        progressBar.style.width = `${pourcentage}%`;
    } else {
        attenteDisplay.textContent = "";
        attenteText.textContent = "Prêt !";
        progressBar.style.width = `100%`;
    }
}

setInterval(countdown, 100);


document.addEventListener("click", (event) => {
  const target = event.target;
  const nao = Date.now();
  if (nao - heure_precedent > delai) {
    if (target.classList.contains("pixel")) {
      const idParts = target.id.split("_");
      const li = parseInt(idParts[0].substring(1));
      const col = parseInt(idParts[1].substring(1));
      const couleur = choix_couleur.value;
      updatePixel(col, li, couleur);
      heure_precedent = nao;
    }
  }
});

refreshButton.addEventListener("click", () => {
  preinit();
});


preinit();
