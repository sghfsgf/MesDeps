// ============================================================
// MESDEPS - SCRIPT PRINCIPAL
// Firebase + Firestore
// Version simple SANS comptes utilisateurs
// ============================================================


// ============================================================
// 1. CONFIGURATION FIREBASE
// ============================================================

const firebaseConfig = {
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
  firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();


// ============================================================
// 3. VARIABLES
// ============================================================

let toutesLesDepenses = [];


// ============================================================
// 4. UTILITAIRES
// ============================================================

// Date du jour : YYYY-MM-DD

function getToday() {

  const maintenant = new Date();

  const annee = maintenant.getFullYear();

  const mois = String(
    maintenant.getMonth() + 1
  ).padStart(2, "0");

  const jour = String(
    maintenant.getDate()
  ).padStart(2, "0");

  return `${annee}-${mois}-${jour}`;
}


// ============================================================
// FORMAT MONÉTAIRE
// ============================================================

function formatMoney(montant) {

  const nombre = Number(montant);

  if (isNaN(nombre)) {
    return "0,000 DT";
  }

  return nombre
    .toFixed(3)
    .replace(".", ",") + " DT";
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(dateStr) {

  if (!dateStr) {
    return "";
  }

  const date = new Date(
    dateStr + "T00:00:00"
  );

  return date.toLocaleDateString(
    "fr-FR",
    {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}


// ============================================================
// 5. MODAL
// ============================================================

function ouvrirModal() {

  const modal =
    document.getElementById("modal");

  if (!modal) {
    return;
  }

  const champDate =
    document.getElementById("date");

  if (champDate) {
    champDate.value = getToday();
  }

  modal.classList.remove("hidden");

  modal.classList.add("flex");

  gererAutres();
}


// ============================================================
// FERMER MODAL
// ============================================================

function fermerModal() {

  const modal =
    document.getElementById("modal");

  const formulaire =
    document.getElementById(
      "form-depense"
    );

  if (modal) {

    modal.classList.add("hidden");

    modal.classList.remove("flex");
  }

  if (formulaire) {
    formulaire.reset();
  }

  const champAutres =
    document.getElementById(
      "champ-autres"
    );

  if (champAutres) {

    champAutres.classList.add(
      "hidden"
    );
  }
}


// ============================================================
// 6. CATÉGORIE AUTRES
// ============================================================

function gererAutres() {

  const categorie =
    document.getElementById(
      "categorie"
    );

  const champ =
    document.getElementById(
      "champ-autres"
    );

  const precision =
    document.getElementById(
      "precision-autres"
    );

  if (
    !categorie ||
    !champ ||
    !precision
  ) {
    return;
  }

  if (
    categorie.value === "Autres"
  ) {

    champ.classList.remove(
      "hidden"
    );

    precision.required = true;

  } else {

    champ.classList.add(
      "hidden"
    );

    precision.required = false;

    precision.value = "";
  }
}


// ============================================================
// 7. AJOUT D'UNE DÉPENSE
// ============================================================

const formulaire =
  document.getElementById(
    "form-depense"
  );

if (formulaire) {

  formulaire.addEventListener(
    "submit",
    async function (e) {

      e.preventDefault();


      // ------------------------------------------------------
      // RÉCUPÉRER LES DONNÉES
      // ------------------------------------------------------

      const montant =
        parseFloat(
          document.getElementById(
            "montant"
          ).value
        );


      const date =
        document.getElementById(
          "date"
        ).value;


      let categorie =
        document.getElementById(
          "categorie"
        ).value;


      const precision =
        document
          .getElementById(
            "precision-autres"
          )
          .value
          .trim();


      const description =
        document
          .getElementById(
            "description"
          )
          .value
          .trim();


      // ------------------------------------------------------
      // VÉRIFICATIONS
      // ------------------------------------------------------

      if (
        !montant ||
        montant <= 0
      ) {

        alert(
          "Veuillez saisir un montant valide."
        );

        return;
      }


      if (!date) {

        alert(
          "Veuillez sélectionner une date."
        );

        return;
      }


      if (!categorie) {

        alert(
          "Veuillez sélectionner une catégorie."
        );

        return;
      }


      // ------------------------------------------------------
      // CATÉGORIE AUTRES
      // ------------------------------------------------------

      if (
        categorie === "Autres"
      ) {

        if (!precision) {

          alert(
            "Merci de préciser la catégorie Autres."
          );

          return;
        }

        categorie =
          "Autres - " + precision;
      }


      // ------------------------------------------------------
      // ENREGISTREMENT FIRESTORE
      // ------------------------------------------------------

      try {

        await db
          .collection("depenses")
          .add({

            montant: montant,

            date: date,

            categorie: categorie,

            description: description,

            createdAt:
              firebase.firestore
                .FieldValue
                .serverTimestamp()

          });


        alert(
          "✅ Dépense enregistrée avec succès."
        );


        fermerModal();


        await chargerDepenses();

      }

      catch (error) {

        console.error(
          "Erreur Firestore :",
          error
        );

        alert(
          "❌ Erreur lors de l'enregistrement :\n" +
          error.message
        );
      }

    }
  );

}


// ============================================================
// 8. CHARGER LES DÉPENSES
// ============================================================

async function chargerDepenses() {

  try {

    const snapshot =
      await db
        .collection("depenses")
        .orderBy(
          "date",
          "desc"
        )
        .get();


    toutesLesDepenses = [];


    snapshot.forEach(
      function (doc) {

        toutesLesDepenses.push({

          id: doc.id,

          ...doc.data()

        });

      }
    );


    afficherDepenses(
      toutesLesDepenses
    );


    mettreAJourResume(
      toutesLesDepenses
    );

  }

  catch (error) {

    console.error(
      "Erreur chargement Firestore :",
      error
    );


    const liste =
      document.getElementById(
        "liste-depenses"
      );


    if (liste) {

      liste.innerHTML = `
        <p class="text-red-500 text-sm">
          ❌ Erreur lors du chargement des dépenses.
          <br>
          ${echapperHTML(error.message)}
        </p>
      `;
    }
  }
}


// ============================================================
// 9. AFFICHER LES DÉPENSES
// ============================================================

function afficherDepenses(
  depenses
) {

  const conteneur =
    document.getElementById(
      "liste-depenses"
    );

  if (!conteneur) {
    return;
  }


  if (
    !depenses ||
    depenses.length === 0
  ) {

    conteneur.innerHTML = `
      <p class="text-gray-400 text-sm">
        Aucune dépense enregistrée.
      </p>
    `;

    return;
  }


  conteneur.innerHTML =
    depenses.map(
      function (d) {

        return `

          <div
            class="flex justify-between
                   items-start
                   border-b border-gray-100
                   pb-3">

            <div>

              <p class="font-medium text-gray-800">

                ${echapperHTML(
                  d.categorie ||
                  "Sans catégorie"
                )}

              </p>


              <p class="text-sm text-gray-500">

                ${formatDate(d.date)}

                ${
                  d.description
                    ? " • " +
                      echapperHTML(
                        d.description
                      )
                    : ""
                }

              </p>

            </div>


            <div class="text-right">

              <p class="font-semibold text-red-600">

                -${formatMoney(
                  d.montant
                )}

              </p>


              <button
                onclick="supprimerDepense('${d.id}')"

                class="text-xs
                       text-gray-400
                       hover:text-red-500
                       mt-1">

                Supprimer

              </button>

            </div>

          </div>

        `;

      }
    ).join("");
}


// ============================================================
// 10. PROTECTION HTML
// ============================================================

function echapperHTML(
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
// 11. SUPPRIMER UNE DÉPENSE
// ============================================================

async function supprimerDepense(
  id
) {

  if (
    !confirm(
      "Voulez-vous vraiment supprimer cette dépense ?"
    )
  ) {
    return;
  }


  try {

    await db
      .collection("depenses")
      .doc(id)
      .delete();


    await chargerDepenses();

  }

  catch (error) {

    console.error(
      "Erreur suppression :",
      error
    );


    alert(
      "❌ Erreur lors de la suppression :\n" +
      error.message
    );
  }
}


// ============================================================
// 12. RÉSUMÉ
// ============================================================

function mettreAJourResume(
  depenses
) {

  let total = 0;


  depenses.forEach(
    function (d) {

      total += Number(
        d.montant || 0
      );

    }
  );


  const nombre =
    depenses.length;


  const moyenne =
    nombre > 0
      ? total / nombre
      : 0;


  const elementNombre =
    document.getElementById(
      "nombre-depenses"
    );


  const elementTotal =
    document.getElementById(
      "total-depenses"
    );


  const elementMoyenne =
    document.getElementById(
      "moyenne-depenses"
    );


  if (elementNombre) {

    elementNombre.textContent =
      nombre;
  }


  if (elementTotal) {

    elementTotal.textContent =
      formatMoney(total);
  }


  if (elementMoyenne) {

    elementMoyenne.textContent =
      formatMoney(moyenne);
  }
}


// ============================================================
// 13. FILTRES
// ============================================================

function appliquerFiltres() {

  const dateDebut =
    document.getElementById(
      "filtre-date-debut"
    )?.value || "";


  const dateFin =
    document.getElementById(
      "filtre-date-fin"
    )?.value || "";


  const categorie =
    document.getElementById(
      "filtre-categorie"
    )?.value || "";


  const recherche =
    document.getElementById(
      "filtre-recherche"
    )?.value
      .trim()
      .toLowerCase() || "";


  const resultats =
    toutesLesDepenses.filter(
      function (d) {


        if (
          dateDebut &&
          d.date < dateDebut
        ) {
          return false;
        }


        if (
          dateFin &&
          d.date > dateFin
        ) {
          return false;
        }


        if (
          categorie &&
          !String(
            d.categorie || ""
          ).startsWith(
            categorie
          )
        ) {
          return false;
        }


        if (recherche) {

          const texte = (

            String(
              d.categorie || ""
            ) +

            " " +

            String(
              d.description || ""
            )

          ).toLowerCase();


          if (
            !texte.includes(
              recherche
            )
          ) {
            return false;
          }
        }


        return true;

      }
    );


  afficherDepenses(
    resultats
  );


  mettreAJourResume(
    resultats
  );
}


// ============================================================
// 14. RÉINITIALISER LES FILTRES
// ============================================================

function reinitialiserFiltres() {

  const dateDebut =
    document.getElementById(
      "filtre-date-debut"
    );


  const dateFin =
    document.getElementById(
      "filtre-date-fin"
    );


  const categorie =
    document.getElementById(
      "filtre-categorie"
    );


  const recherche =
    document.getElementById(
      "filtre-recherche"
    );


  if (dateDebut) {
    dateDebut.value = "";
  }


  if (dateFin) {
    dateFin.value = "";
  }


  if (categorie) {
    categorie.value = "";
  }


  if (recherche) {
    recherche.value = "";
  }


  afficherDepenses(
    toutesLesDepenses
  );


  mettreAJourResume(
    toutesLesDepenses
  );
}


// ============================================================
// 15. DÉMARRAGE
// ============================================================

if (
  document.getElementById(
    "liste-depenses"
  )
) {

  chargerDepenses();

}


// ============================================================
// FIN
// ============================================================
