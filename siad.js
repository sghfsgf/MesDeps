// ============================================================
// MESDEPS - SIAD
// Tableau de bord et analyse des dépenses
// Firebase + Firestore
// ============================================================


// ============================================================
// 1. CONFIGURATION FIREBASE
// ============================================================

const firebaseConfigSIAD = {

  apiKey: "AIzaSyB6CTUcJWbwL8GK-65PCFS1z7HXtDKYWEo",

  authDomain: "mesdeps.firebaseapp.com",

  projectId: "mesdeps",

  storageBucket: "mesdeps.firebasestorage.app",

  messagingSenderId: "216030223679",

  appId: "1:216030223679:web:d6ee1c2aafd3f939c9078a"

};


// ============================================================
// 2. INITIALISATION FIREBASE
// ============================================================

if (!firebase.apps.length) {

  firebase.initializeApp(
    firebaseConfigSIAD
  );

}

const dbSIAD = firebase.firestore();


// ============================================================
// 3. VARIABLES
// ============================================================

let toutesLesDepensesSIAD = [];


// ============================================================
// 4. UTILITAIRES
// ============================================================

// ------------------------------------------------------------
// Date du jour : YYYY-MM-DD
// ------------------------------------------------------------

function getTodaySIAD() {

  const maintenant = new Date();

  const annee =
    maintenant.getFullYear();

  const mois =
    String(
      maintenant.getMonth() + 1
    ).padStart(2, "0");

  const jour =
    String(
      maintenant.getDate()
    ).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;

}


// ============================================================
// FORMAT MONÉTAIRE
// ============================================================

function formatMoneySIAD(montant) {

  const nombre =
    Number(montant);

  if (isNaN(nombre)) {

    return "0,000 DT";

  }

  return (
    nombre
      .toFixed(3)
      .replace(".", ",")
    + " DT"
  );

}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDateSIAD(dateStr) {

  if (!dateStr) {

    return "";

  }

  const date =
    new Date(
      dateStr + "T00:00:00"
    );

  return date.toLocaleDateString(
    "fr-FR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );

}


// ============================================================
// 5. CHARGER LES DÉPENSES FIRESTORE
// ============================================================

async function chargerDepensesSIAD() {

  try {

    console.log(
      "📊 Chargement des dépenses SIAD..."
    );


    const snapshot =
      await dbSIAD
        .collection("depenses")
        .orderBy(
          "date",
          "desc"
        )
        .get();


    toutesLesDepensesSIAD = [];


    snapshot.forEach(
      function(doc) {

        toutesLesDepensesSIAD.push({

          id: doc.id,

          ...doc.data()

        });

      }
    );


    console.log(
      "✅ Dépenses récupérées :",
      toutesLesDepensesSIAD.length
    );


    // --------------------------------------------------------
    // Calculs
    // --------------------------------------------------------

    mettreAJourIndicateursPrincipaux();


    analyserDonnees(
      toutesLesDepensesSIAD
    );


  }

  catch (error) {

    console.error(
      "❌ Erreur chargement SIAD :",
      error
    );


    afficherErreurSIAD(
      error.message
    );

  }

}


// ============================================================
// 6. INDICATEURS JOUR / SEMAINE / MOIS / ANNÉE
// ============================================================

function mettreAJourIndicateursPrincipaux() {

  const aujourdHui =
    getTodaySIAD();


  const maintenant =
    new Date();


  const anneeActuelle =
    maintenant.getFullYear();


  const moisActuel =
    String(
      maintenant.getMonth() + 1
    ).padStart(2, "0");


  // ----------------------------------------------------------
  // Début de semaine
  // Lundi = premier jour
  // ----------------------------------------------------------

  const debutSemaine =
    new Date(
      maintenant
    );


  const jourSemaine =
    maintenant.getDay();


  const difference =
    jourSemaine === 0
      ? 6
      : jourSemaine - 1;


  debutSemaine.setDate(
    maintenant.getDate() -
    difference
  );


  const dateDebutSemaine =
    convertirDateISO(
      debutSemaine
    );


  // ----------------------------------------------------------
  // Calculs
  // ----------------------------------------------------------

  let totalJour = 0;

  let totalSemaine = 0;

  let totalMois = 0;

  let totalAnnee = 0;


  toutesLesDepensesSIAD.forEach(
    function(d) {

      const montant =
        Number(
          d.montant || 0
        );


      const date =
        d.date || "";


      // Aujourd'hui

      if (
        date === aujourdHui
      ) {

        totalJour += montant;

      }


      // Cette semaine

      if (
        date >= dateDebutSemaine &&
        date <= aujourdHui
      ) {

        totalSemaine += montant;

      }


      // Ce mois

      if (
        date.startsWith(
          `${anneeActuelle}-${moisActuel}`
        )
      ) {

        totalMois += montant;

      }


      // Cette année

      if (
        date.startsWith(
          String(anneeActuelle)
        )
      ) {

        totalAnnee += montant;

      }

    }
  );


  // ----------------------------------------------------------
  // Affichage
  // ----------------------------------------------------------

  afficherTexte(
    "siad-total-jour",
    formatMoneySIAD(
      totalJour
    )
  );


  afficherTexte(
    "siad-total-semaine",
    formatMoneySIAD(
      totalSemaine
    )
  );


  afficherTexte(
    "siad-total-mois",
    formatMoneySIAD(
      totalMois
    )
  );


  afficherTexte(
    "siad-total-annee",
    formatMoneySIAD(
      totalAnnee
    );

}


// ============================================================
// 7. ANALYSE GÉNÉRALE
// ============================================================

function analyserDonnees(
  depenses
) {

  if (
    !depenses ||
    depenses.length === 0
  ) {

    afficherTexte(
      "siad-poste-principal",
      "-"
    );


    afficherTexte(
      "siad-max",
      "0,000 DT"
    );


    afficherTexte(
      "siad-moyenne",
      "0,000 DT"
    );


    afficherTexte(
      "siad-nombre",
      "0"
    );


    afficherTableauVide();

    return;

  }


  // ----------------------------------------------------------
  // Total
  // ----------------------------------------------------------

  let total = 0;


  // ----------------------------------------------------------
  // Plus grosse dépense
  // ----------------------------------------------------------

  let maximum = 0;

  let depenseMaximum = null;


  // ----------------------------------------------------------
  // Catégories
  // ----------------------------------------------------------

  const categories = {};


  depenses.forEach(
    function(d) {

      const montant =
        Number(
          d.montant || 0
        );


      const categorie =
        d.categorie ||
        "Sans catégorie";


      total += montant;


      // Maximum

      if (
        montant > maximum
      ) {

        maximum =
          montant;

        depenseMaximum =
          d;

      }


      // Catégorie

      if (
        !categories[categorie]
      ) {

        categories[categorie] = 0;

      }


      categories[categorie]
        += montant;

    }
  );


  // ----------------------------------------------------------
  // Poste principal
  // ----------------------------------------------------------

  let postePrincipal = "-";

  let montantPostePrincipal = 0;


  Object.keys(categories)
    .forEach(
      function(categorie) {

        if (
          categories[categorie] >
          montantPostePrincipal
        ) {

          montantPostePrincipal =
            categories[categorie];

          postePrincipal =
            categorie;

        }

      }
    );


  // ----------------------------------------------------------
  // Moyenne
  // ----------------------------------------------------------

  const moyenne =
    depenses.length > 0
      ? total / depenses.length
      : 0;


  // ----------------------------------------------------------
  // Affichage
  // ----------------------------------------------------------

  afficherTexte(
    "siad-poste-principal",

    postePrincipal
    + " — "
    + formatMoneySIAD(
        montantPostePrincipal
      )
  );


  afficherTexte(
    "siad-max",

    formatMoneySIAD(
      maximum
    )
  );


  afficherTexte(
    "siad-moyenne",

    formatMoneySIAD(
      moyenne
    )
  );


  afficherTexte(
    "siad-nombre",

    String(
      depenses.length
    )
  );


  // ----------------------------------------------------------
  // Tableau par type
  // ----------------------------------------------------------

  afficherTableauType(
    categories,
    total
  );

}


// ============================================================
// 8. TABLEAU PAR CATÉGORIE
// ============================================================

function afficherTableauType(
  categories,
  totalGeneral
) {

  const conteneur =
    document.getElementById(
      "tableau-type"
    );


  if (!conteneur) {

    return;

  }


  const liste =
    Object.entries(
      categories
    )
    .sort(
      function(a, b) {

        return b[1] - a[1];

      }
    );


  if (
    liste.length === 0
  ) {

    conteneur.innerHTML = `
      <p class="text-gray-400">
        Aucune donnée.
      </p>
    `;

    return;

  }


  conteneur.innerHTML =
    liste.map(
      function([categorie, montant]) {

        const pourcentage =
          totalGeneral > 0
            ? (
                montant /
                totalGeneral *
                100
              )
              .toFixed(1)
            : 0;


        return `

          <div
            class="flex justify-between
                   items-center
                   border-b
                   border-gray-100
                   pb-2">

            <div>

              <p class="font-medium
                        text-gray-700">

                ${echapperHTMLSIAD(
                  categorie
                )}

              </p>

              <p class="text-xs
                        text-gray-400">

                ${pourcentage} %

              </p>

            </div>


            <p class="font-semibold
                      text-blue-600">

              ${formatMoneySIAD(
                montant
              )}

            </p>

          </div>

        `;

      }
    )
    .join("");

}


// ============================================================
// 9. ANALYSER UNE PÉRIODE
// ============================================================

function analyserPeriode() {

  const dateDebut =
    document.getElementById(
      "siad-date-debut"
    )?.value || "";


  const dateFin =
    document.getElementById(
      "siad-date-fin"
    )?.value || "";


  if (
    dateDebut &&
    dateFin &&
    dateDebut > dateFin
  ) {

    alert(
      "❌ La date début doit être antérieure à la date fin."
    );

    return;

  }


  let resultat =
    toutesLesDepensesSIAD;


  if (dateDebut) {

    resultat =
      resultat.filter(
        function(d) {

          return d.date >= dateDebut;

        }
      );

  }


  if (dateFin) {

    resultat =
      resultat.filter(
        function(d) {

          return d.date <= dateFin;

        }
      );

  }


  analyserDonnees(
    resultat
  );

}


// ============================================================
// 10. AFFICHER UN TEXTE
// ============================================================

function afficherTexte(
  id,
  texte
) {

  const element =
    document.getElementById(id);


  if (element) {

    element.textContent =
      texte;

  }

}


// ============================================================
// 11. CONVERTIR DATE EN YYYY-MM-DD
// ============================================================

function convertirDateISO(
  date
) {

  const annee =
    date.getFullYear();


  const mois =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");


  const jour =
    String(
      date.getDate()
    ).padStart(2, "0");


  return (
    annee +
    "-" +
    mois +
    "-" +
    jour
  );

}


// ============================================================
// 12. PROTECTION HTML
// ============================================================

function echapperHTMLSIAD(
  texte
) {

  return String(texte)

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /'/g,
      "&#039;"
    );

}


// ============================================================
// 13. TABLEAU VIDE
// ============================================================

function afficherTableauVide() {

  const tableau =
    document.getElementById(
      "tableau-type"
    );


  if (tableau) {

    tableau.innerHTML = `
      <p class="text-gray-400">
        Aucune dépense enregistrée.
      </p>
    `;

  }

}


// ============================================================
// 14. ERREUR
// ============================================================

function afficherErreurSIAD(
  message
) {

  const tableau =
    document.getElementById(
      "tableau-type"
    );


  if (tableau) {

    tableau.innerHTML = `

      <div
        class="bg-red-50
               text-red-600
               rounded-lg
               p-4">

        ❌ Impossible de charger
        les dépenses.

        <br><br>

        <small>

          ${echapperHTMLSIAD(
            message
          )}

        </small>

      </div>

    `;

  }

}


// ============================================================
// 15. DÉMARRAGE DU SIAD
// ============================================================

document.addEventListener(
  "DOMContentLoaded",
  function() {

    console.log(
      "📊 SIAD démarré..."
    );


    chargerDepensesSIAD();

  }
);


// ============================================================
// FIN SIAD
// ============================================================
