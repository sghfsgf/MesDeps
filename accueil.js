// ============================================================
// MESDEPS - ACCUEIL
// Firebase + Firestore
// Actualisation automatique des totaux
// ============================================================


// ============================================================
// 1. CONFIGURATION FIREBASE
// ============================================================

const firebaseConfigAccueil = {

    apiKey:
        "AIzaSyB6CTUcJWbwL8GK-65PCFS1z7HXtDKYWEo",

    authDomain:
        "mesdeps.firebaseapp.com",

    projectId:
        "mesdeps",

    storageBucket:
        "mesdeps.firebasestorage.app",

    messagingSenderId:
        "216030223679",

    appId:
        "1:216030223679:web:d6ee1c2aafd3f939c9078a"

};


// ============================================================
// 2. INITIALISATION FIREBASE
// ============================================================

if (!firebase.apps.length) {

    firebase.initializeApp(
        firebaseConfigAccueil
    );

}

const dbAccueil =
    firebase.firestore();


// ============================================================
// 3. VARIABLES
// ============================================================

let toutesLesDepensesAccueil = [];


// ============================================================
// 4. DATE DU JOUR
// Format : YYYY-MM-DD
// ============================================================

function getTodayAccueil() {

    const maintenant =
        new Date();

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
// 5. FORMAT MONÉTAIRE
// ============================================================

function formatMoneyAccueil(
    montant
) {

    const nombre =
        Number(montant);

    if (isNaN(nombre)) {

        return "0,000 DT";

    }

    return nombre
        .toFixed(3)
        .replace(".", ",") + " DT";

}


// ============================================================
// 6. CALCULER LES TOTAUX
// ============================================================

function mettreAJourAccueil(
    depenses
) {

    const maintenant =
        new Date();


    // ----------------------------------------------------------
    // AUJOURD'HUI
    // ----------------------------------------------------------

    const aujourdHui =
        getTodayAccueil();


    // ----------------------------------------------------------
    // DÉBUT DE LA SEMAINE
    // Lundi = premier jour
    // ----------------------------------------------------------

    const debutSemaine =
        new Date(maintenant);

    const jourSemaine =
        debutSemaine.getDay();

    const difference =
        jourSemaine === 0
            ? 6
            : jourSemaine - 1;

    debutSemaine.setDate(
        maintenant.getDate() - difference
    );

    debutSemaine.setHours(
        0,
        0,
        0,
        0
    );


    // ----------------------------------------------------------
    // DÉBUT DU MOIS
    // ----------------------------------------------------------

    const debutMois =
        new Date(
            maintenant.getFullYear(),
            maintenant.getMonth(),
            1
        );


    // ----------------------------------------------------------
    // DÉBUT DE L'ANNÉE
    // ----------------------------------------------------------

    const debutAnnee =
        new Date(
            maintenant.getFullYear(),
            0,
            1
        );


    // ----------------------------------------------------------
    // VARIABLES
    // ----------------------------------------------------------

    let totalJour = 0;

    let totalSemaine = 0;

    let totalMois = 0;

    let totalAnnee = 0;


    // ==========================================================
    // PARCOURIR LES DÉPENSES
    // ==========================================================

    depenses.forEach(
        function(d) {

            const montant =
                Number(
                    d.montant || 0
                );


            // ----------------------------------------------------
            // AUJOURD'HUI
            // ----------------------------------------------------

            if (
                d.date === aujourdHui
            ) {

                totalJour +=
                    montant;

            }


            // ----------------------------------------------------
            // DATE DE LA DÉPENSE
            // ----------------------------------------------------

            if (d.date) {

                const dateDepense =
                    new Date(
                        d.date +
                        "T00:00:00"
                    );


                // -----------------------------------------------
                // SEMAINE
                // -----------------------------------------------

                if (
                    dateDepense >=
                    debutSemaine
                ) {

                    totalSemaine +=
                        montant;

                }


                // -----------------------------------------------
                // MOIS
                // -----------------------------------------------

                if (
                    dateDepense >=
                    debutMois
                ) {

                    totalMois +=
                        montant;

                }


                // -----------------------------------------------
                // ANNÉE
                // -----------------------------------------------

                if (
                    dateDepense >=
                    debutAnnee
                ) {

                    totalAnnee +=
                        montant;

                }

            }

        }
    );


    // ==========================================================
    // AFFICHAGE
    // ==========================================================

    const elementJour =
        document.getElementById(
            "total-jour"
        );

    const elementSemaine =
        document.getElementById(
            "total-semaine"
        );

    const elementMois =
        document.getElementById(
            "total-mois"
        );


    // ----------------------------------------------------------
    // AUJOURD'HUI
    // ----------------------------------------------------------

    if (elementJour) {

        elementJour.textContent =
            formatMoneyAccueil(
                totalJour
            );

    }


    // ----------------------------------------------------------
    // SEMAINE
    // ----------------------------------------------------------

    if (elementSemaine) {

        elementSemaine.textContent =
            formatMoneyAccueil(
                totalSemaine
            );

    }


    // ----------------------------------------------------------
    // MOIS
    // ----------------------------------------------------------

    if (elementMois) {

        elementMois.textContent =
            formatMoneyAccueil(
                totalMois
            );

    }


    // ----------------------------------------------------------
    // CONSOLE POUR CONTRÔLE
    // ----------------------------------------------------------

    console.log(
        "MESDEPS - Accueil"
    );

    console.log(
        "Nombre de dépenses :",
        depenses.length
    );

    console.log(
        "Aujourd'hui :",
        totalJour
    );

    console.log(
        "Cette semaine :",
        totalSemaine
    );

    console.log(
        "Ce mois :",
        totalMois
    );

    console.log(
        "Cette année :",
        totalAnnee
    );

}


// ============================================================
// 7. CHARGEMENT FIRESTORE EN TEMPS RÉEL
// ============================================================

function chargerDepensesAccueil() {

    console.log(
        "Accueil : connexion à Firestore..."
    );


    dbAccueil
        .collection("depenses")

        .onSnapshot(

            function(snapshot) {

                toutesLesDepensesAccueil =
                    [];


                snapshot.forEach(
                    function(doc) {

                        toutesLesDepensesAccueil
                            .push({

                                id:
                                    doc.id,

                                ...doc.data()

                            });

                    }
                );


                console.log(
                    "Accueil : dépenses reçues =",
                    toutesLesDepensesAccueil.length
                );


                mettreAJourAccueil(
                    toutesLesDepensesAccueil
                );

            },


            function(error) {

                console.error(
                    "Accueil : erreur Firebase :",
                    error
                );


                const elementJour =
                    document.getElementById(
                        "total-jour"
                    );

                const elementSemaine =
                    document.getElementById(
                        "total-semaine"
                    );

                const elementMois =
                    document.getElementById(
                        "total-mois"
                    );


                if (elementJour) {

                    elementJour.textContent =
                        "Erreur";

                }


                if (elementSemaine) {

                    elementSemaine.textContent =
                        "Erreur";

                }


                if (elementMois) {

                    elementMois.textContent =
                        "Erreur";

                }

            }

        );

}


// ============================================================
// 8. INITIALISATION DE LA PAGE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "Accueil : initialisation..."
        );


        chargerDepensesAccueil();

    }
);


// ============================================================
// FIN
// ============================================================
