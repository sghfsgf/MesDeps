// ====================== CONFIG FIREBASE ======================
// Remplace par ta vraie configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "ton-projet.firebaseapp.com",
  projectId: "ton-projet",
  storageBucket: "ton-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ====================== UTILITAIRES ======================
function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function getStartOfWeek() {
  const d = new Date();
  const day = d.getDay() || 7;
  if (day !== 1) d.setDate(d.getDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

function getStartOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  });
}

// Format monétaire tunisien : 2,200 DT
function formatMoney(n) {
  if (isNaN(n)) return "0,000 DT";
  return Number(n).toFixed(3).replace(".", ",") + " DT";
}

// ====================== MODAL ======================
function ouvrirModal() {
  document.getElementById("date").value = getToday();
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("modal").classList.add("flex");
  gererAutres();
}

function fermerModal() {
  document.getElementById("modal").classList.add("hidden");
  document.getElementById("modal").classList.remove("flex");
  document.getElementById("form-depense").reset();
  document.getElementById("champ-autres").classList.add("hidden");
}

function gererAutres() {
  const cat = document.getElementById("categorie").value;
  const champ = document.getElementById("champ-autres");
  const input = document.getElementById("precision-autres");

  if (cat === "Autres") {
    champ.classList.remove("hidden");
    input.required = true;
  } else {
    champ.classList.add("hidden");
    input.required = false;
    input.value = "";
  }
}

// ====================== AJOUT DÉPENSE ======================
document.getElementById("form-depense").addEventListener("submit", async (e) => {
  e.preventDefault();

  const montant = parseFloat(document.getElementById("montant").value);
  const date = document.getElementById("date").value;
  let categorie = document.getElementById("categorie").value;
  const precision = document.getElementById("precision-autres").value.trim();
  const description = document.getElementById("description").value.trim();

  if (categorie === "Autres") {
    if (!precision) {
      alert("Merci de préciser la catégorie Autres");
      return;
    }
    categorie = "Autres - " + precision;
  }

  try {
    await db.collection("depenses").add({
      montant,
      date,
      categorie,
      description,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    fermerModal();
    chargerDepenses();
  } catch (error) {
    alert("Erreur lors de l'enregistrement : " + error.message);
  }
});

async function supprimerDepense(id) {
  if (!confirm("Supprimer cette dépense ?")) return;
  await db.collection("depenses").doc(id).delete();
  chargerDepenses();
}

// ====================== CHARGEMENT PRINCIPAL ======================
async function chargerDepenses() {
  const snapshot = await db.collection("depenses").orderBy("date", "desc").get();
  const depenses = [];
  snapshot.forEach(doc => depenses.push({ id: doc.id, ...doc.data() }));

  afficherListe(depenses);
  calculerResume(depenses);
  majStatsType(depenses);
  majStatsJour(depenses);
  majDetailSemaine(depenses);
  majClassementMois(depenses);
}

// ====================== RÉSUMÉ RAPIDE ======================
function calculerResume(depenses) {
  const today = getToday();
  const startWeek = getStartOfWeek();
  const startMonth = getStartOfMonth();

  let tJour = 0, tSemaine = 0, tMois = 0;

  depenses.forEach(d => {
    const m = Number(d.montant);
    if (d.date === today) tJour += m;
    if (d.date >= startWeek) tSemaine += m;
    if (d.date >= startMonth) tMois += m;
  });

  document.getElementById("total-jour").textContent = formatMoney(tJour);
  document.getElementById("total-semaine").textContent = formatMoney(tSemaine);
  document.getElementById("total-mois").textContent = formatMoney(tMois);
}

// ====================== STATS PAR TYPE ======================
let chartType = null;

function majStatsType(depenses) {
  const startMonth = getStartOfMonth();
  const totals = {};

  depenses.forEach(d => {
    if (d.date >= startMonth) {
      totals[d.categorie] = (totals[d.categorie] || 0) + Number(d.montant);
    }
  });

  const labels = Object.keys(totals);
  const data = Object.values(totals);
  const totalMois = data.reduce((a, b) => a + b, 0);

  const tableau = document.getElementById("tableau-type");
  if (labels.length === 0) {
    tableau.innerHTML = `<p class="text-gray-400">Aucune dépense ce mois</p>`;
  } else {
    tableau.innerHTML = labels.map(cat => {
      const pct = totalMois > 0 ? ((totals[cat] / totalMois) * 100).toFixed(1) : 0;
      return `
        <div class="flex justify-between">
          <span>${cat}</span>
          <span class="font-medium">${formatMoney(totals[cat])} (${pct}%)</span>
        </div>`;
    }).join("");
  }

  const ctx = document.getElementById("chartType").getContext("2d");
  if (chartType) chartType.destroy();

  chartType = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: [
          "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
          "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1", "#14B8A6"
        ]
      }]
    },
    options: {
      plugins: { legend: { position: "bottom" } }
    }
  });
}

// ====================== STATS PAR JOUR ======================
let chartJour = null;

function majStatsJour(depenses) {
  const jours = [];
  const totaux = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit" });

    let total = 0;
    depenses.forEach(dep => {
      if (dep.date === dateStr) total += Number(dep.montant);
    });

    jours.push(label);
    totaux.push(total);
  }

  const ctx = document.getElementById("chartJour").getContext("2d");
  if (chartJour) chartJour.destroy();

  chartJour = new Chart(ctx, {
    type: "bar",
    data: {
      labels: jours,
      datasets: [{
        label: "Dépenses (DT)",
        data: totaux,
        backgroundColor: "#3B82F6"
      }]
    },
    options: {
      scales: { y: { beginAtZero: true } },
      plugins: { legend: { display: false } }
    }
  });
}

// ====================== DÉTAIL SEMAINE ======================
function majDetailSemaine(depenses) {
  const startWeek = getStartOfWeek();
  const joursSemaine = {};
  let totalSemaine = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(startWeek + "T00:00:00");
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    joursSemaine[dateStr] = 0;
  }

  depenses.forEach(d => {
    if (d.date >= startWeek) {
      joursSemaine[d.date] = (joursSemaine[d.date] || 0) + Number(d.montant);
      totalSemaine += Number(d.montant);
    }
  });

  const conteneur = document.getElementById("detail-semaine");
  conteneur.innerHTML = Object.entries(joursSemaine).map(([date, montant]) => `
    <div class="flex justify-between border-b border-gray-100 pb-1">
      <span>${formatDate(date)}</span>
      <span class="font-medium ${montant > 0 ? "text-red-600" : "text-gray-400"}">
        ${formatMoney(montant)}
      </span>
    </div>
  `).join("") + `
    <div class="flex justify-between pt-2 font-bold border-t mt-2">
      <span>Total semaine</span>
      <span class="text-green-600">${formatMoney(totalSemaine)}</span>
    </div>`;
}

// ====================== CLASSEMENT MOIS ======================
function majClassementMois(depenses) {
  const startMonth = getStartOfMonth();
  const totals = {};

  depenses.forEach(d => {
    if (d.date >= startMonth) {
      totals[d.categorie] = (totals[d.categorie] || 0) + Number(d.montant);
    }
  });

  const trie = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const conteneur = document.getElementById("classement-mois");

  if (trie.length === 0) {
    conteneur.innerHTML = `<p class="text-gray-400">Aucune dépense ce mois</p>`;
    return;
  }

  conteneur.innerHTML = trie.map(([cat, montant], index) => `
    <div class="flex justify-between items-center">
      <span class="flex items-center gap-2">
        <span class="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
          ${index + 1}
        </span>
        ${cat}
      </span>
      <span class="font-semibold">${formatMoney(montant)}</span>
    </div>
  `).join("");
}

// ====================== LISTE DES DÉPENSES ======================
function afficherListe(depenses) {
  const conteneur = document.getElementById("liste-depenses");

  if (depenses.length === 0) {
    conteneur.innerHTML = `<p class="text-gray-400 text-sm">Aucune dépense enregistrée.</p>`;
    return;
  }

  conteneur.innerHTML = depenses.slice(0, 30).map(d => `
    <div class="flex justify-between items-start border-b border-gray-100 pb-3">
      <div>
        <p class="font-medium text-gray-800">${d.categorie}</p>
        <p class="text-sm text-gray-500">
          ${formatDate(d.date)}${d.description ? " • " + d.description : ""}
        </p>
      </div>
      <div class="text-right">
        <p class="font-semibold text-red-600">-${formatMoney(d.montant)}</p>
        <button onclick="supprimerDepense('${d.id}')" class="text-xs text-gray-400 hover:text-red-500 mt-1">
          Supprimer
        </button>
      </div>
    </div>
  `).join("");
}

// ====================== DÉMARRAGE ======================
chargerDepenses();
