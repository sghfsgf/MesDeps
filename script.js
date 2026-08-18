// ============================================================
// MESDEPS - SCRIPT PRINCIPAL
// Firebase Authentication + Firestore
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
const auth = firebase.auth();


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
// 5. CONNEXION UTILISATEUR
// ============================================================

async function seConnecter() {

  const email =
    document.getElementById(
      "email-connexion"
    )?.value.trim();

  const motDePasse =
    document.getElementById(
      "mot-de-passe-connexion"
    )?.value;

  const message =
    document.getElementById(
      "message-connexion"
    );


  if (!email || !motDePasse) {

    if (message) {

      message.textContent =
        "Veuillez saisir votre e-mail et votre mot de passe.";

      message.className =
        "text-sm text-center text-red-600";

    }

    return;
  }


  try {

    if (message) {

      message.textContent =
        "Connexion en cours...";

      message.className =
        "text-sm text-center text-blue-600";

    }


    await auth.signInWithEmailAndPassword(
      email,
      motDePasse
    );


  }

  catch (error) {

    console.error(
      "Erreur connexion Firebase :",
      error
    );


    if (message) {

      let texte =
        "Erreur de connexion.";

      if (
        error.code ===
        "auth/invalid-credential"
      ) {

        texte =
          "E-mail ou mot de passe incorrect.";

      }
      else if (
        error.code ===
        "auth/invalid-email"
      ) {

        texte =
          "Adresse e-mail invalide.";

      }


      message.textContent = texte;

      message.className =
        "text-sm text-center text-red-600";

    }

  }

}


// ============================================================
// 6. DÉCONNEXION
// ============================================================

async function seDeconnecter() {

  try {

    await auth.signOut();

  }

  catch (error) {

    console.error(
      "Erreur déconnexion :",
      error
    );

    alert(
      "Erreur lors de la déconnexion."
    );

  }

}


// ============================================================
// 7. SURVEILLER L'ÉTAT DE CONNEXION
// ============================================================

auth.onAuthStateChanged(
  async function (utilisateur) {

    const zoneConnexion =
      document.getElementById(
        "zone-connexion"
      );

    const zoneUtilisateur =
      document.getElementById(
        "zone-utilisateur"
      );

    const emailUtilisateur =
      document.getElementById(
        "utilisateur-email"
      );


    // --------------------------------------------------------
    // UTILISATEUR CONNECTÉ
    // --------------------------------------------------------

    if (utilisateur) {

      console.log(
        "Utilisateur connecté :",
        utilisateur.email
      );

      console.log(
        "UID :",
        utilisateur.uid
      );


      if (zoneConnexion) {

        zoneConnexion.classList.add(
          "hidden"
        );

      }


      if (zoneUtilisateur) {

        zoneUtilisateur.classList.remove(
          "hidden"
        );

      }


      if (emailUtilisateur) {

        emailUtilisateur.textContent =
          utilisateur.email;

      }


      // Charger les dépenses de cet utilisateur

      await chargerDepenses();

    }


    // --------------------------------------------------------
    // UTILISATEUR NON CONNECTÉ
    // --------------------------------------------------------

    else {

      console.log(
        "Aucun utilisateur connecté."
      );


      toutesLesDepenses = [];


      if (zoneConnexion) {

        zoneConnexion.classList.remove(
          "hidden"
        );

      }


      if (zoneUtilisateur) {

        zoneUtilisateur.classList.add(
          "hidden"
        );

      }


      const liste =
        document.getElementById(
          "liste-depenses"
        );

      if (liste) {

        liste.innerHTML = `
          <p class="text-gray-400 text-sm">
            🔐 Connectez-vous pour afficher vos dépenses.
          </p>
        `;

      }


      mettreAJourResume([]);

    }

  }
);


// ============================================================
// 8. MODAL
// ============================================================

function ouvrirModal() {

  // Vérifier la connexion

  if (!auth.currentUser) {

    alert(
      "Vous devez être connecté pour enregistrer une dépense."
    );

    return;
  }


  const modal =
    document.getElementById("modal");

  if (!modal) {
    return;
  }


  const champDate =
    document.getElementById("date");

  if (champDate) {

    champDate.value =
      getToday();

  }


  modal.classList.remove(
    "hidden"
  );

  modal.classList.add(
    "flex"
  );


  gererAutres();

}


// ============================================================
// 9. FERMER MODAL
// ============================================================

function fermerModal() {

  const modal =
    document.getElementById("modal");

  const formulaire =
    document.getElementById(
      "form-depense"
    );


  if (modal) {

    modal.classList.add(
      "hidden"
    );

    modal.classList.remove(
      "flex"
    );

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
// 10. CATÉGORIE AUTRES
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

  }

  else {

    champ.classList.add(
      "hidden"
    );

    precision.required = false;

    precision.value = "";

  }

}


// ============================================================
// 11. AJOUT D'UNE DÉPENSE
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
      // Vérifier utilisateur connecté
      // ------------------------------------------------------

      const utilisateur =
        auth.currentUser;


      if (!utilisateur) {

        alert(
          "Vous devez être connecté pour enregistrer une dépense."
        );

        return;

      }


      // ------------------------------------------------------
      // Récupérer les données
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
      // Vérifications
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
      // Catégorie AUTRES
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
      // Enregistrement Firestore
      // ------------------------------------------------------

      try {

        await db
          .collection("depenses")
          .add({

            montant:
              montant,

            date:
              date,

            categorie:
              categorie,

            description:
              description,

            userId:
              utilisateur.uid,

            createdAt:
              firebase.firestore
                .FieldValue
                .serverTimestamp()

          });


        alert(
          "✅ Dépense enregistrée avec succès."
        );


        fermerModal();


        // Recharger depuis Firestore

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
// 12. CHARGER LES DÉPENSES DE L'UTILISATEUR
// ============================================================

async function chargerDepenses() {

  const utilisateur =
    auth.currentUser;


  if (!utilisateur) {

    toutesLesDepenses = [];

    return;

  }


  try {

    const snapshot =
      await db
        .collection("depenses")
        .where(
          "userId",
          "==",
          utilisateur.uid
        )
        .orderBy(
          "date",
          "desc"
        )
        .get();


    toutesLesDepenses = [];


    snapshot.forEach(
      function (doc) {

        toutesLesDepenses.push({

          id:
            doc.id,

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
// 13. AFFICHER LES DÉPENSES
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
// 14. PROTECTION HTML
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
// 15. SUPPRIMER UNE DÉPENSE
// ============================================================

async function supprimerDepense(
  id
) {

  const utilisateur =
    auth.currentUser;


  if (!utilisateur) {

    alert(
      "Vous devez être connecté."
    );

    return;

  }


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
// 16. RÉSUMÉ
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
// 17. FILTRES
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
// 18. RÉINITIALISER LES FILTRES
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
// FIN DU SCRIPT
// ============================================================
