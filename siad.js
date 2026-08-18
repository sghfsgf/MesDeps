// ============================================================
// MESDEPS - SIAD
// Tableau de bord des dépenses
// Firebase + Firestore + Chart.js
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

const dbSIAD = firebase.firestore();


// ============================================================
// 3. VARIABLES
// ============================================================

let depensesSIAD = [];

let chartType = null;
let chartJour = null;
let chartSemaine = null;
let chartMois = null;


// ============================================================
// 4. UTILITAIRES
// ============================================================

function formatMoneySIAD(montant) {

    const nombre = Number(montant);

    if (isNaN(nombre)) {
        return "0,000 DT";
    }

    return nombre
        .toFixed(3)
        .replace(".", ",") + " DT";
}


// ============================================================
// DATE AU FORMAT YYYY-MM-DD
// ============================================================

function getDateAujourdHuiSIAD() {

    const date = new Date();

    const annee = date.getFullYear();

    const mois = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const jour = String(
        date.getDate()
    ).padStart(2, "0");

    return `${annee}-${mois}-${jour}`;
}


// ============================================================
// FORMAT DATE POUR AFFICHAGE
// ============================================================

function formatDateSIAD(dateStr) {

    if (!dateStr) {
        return "";
    }

    const date = new Date(
        dateStr + "T00:00:00"
    );

    return date.toLocaleDateString(
        "fr-FR"
    );
}


// ============================================================
// ECHAPPER HTML
// ============================================================

function echapperHTMLSIAD(texte) {

    return String(texte)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// 5. CHARGER LES DEPENSES FIRESTORE
// ============================================================

async function chargerDepensesSIAD() {

    console.log("SIAD : chargement des dépenses...");

    try {

        const snapshot = await dbSIAD
            .collection("depenses")
            .orderBy("date", "desc")
            .get();

        depensesSIAD = [];

        snapshot.forEach(function(doc) {

            depensesSIAD.push({
                id: doc.id,
                ...doc.data()
            });

        });

        console.log(
            "SIAD : dépenses chargées =",
            depensesSIAD.length
        );

        console.log(
            "SIAD : données =",
            depensesSIAD
        );


        // Afficher les indicateurs
        calculerIndicateurs();


        // Afficher les graphiques
        analyserPeriode();


    }
    catch (error) {

        console.error(
            "Erreur chargement SIAD :",
            error
        );

        alert(
            "❌ Impossible de charger les dépenses du SIAD.\n\n" +
            error.message
        );

    }

}


// ============================================================
// 6. CALCUL DES TOTAUX
// ============================================================

function calculerIndicateurs() {

    const aujourdHui =
        getDateAujourdHuiSIAD();

    const maintenant =
        new Date();


    // --------------------------------------------------------
    // DEBUT DE LA SEMAINE
    // --------------------------------------------------------

    const debutSemaine =
        new Date(maintenant);

    const jourSemaine =
        maintenant.getDay();

    const difference =
        jourSemaine === 0
            ? 6
            : jourSemaine - 1;

    debutSemaine.setDate(
        maintenant.getDate() - difference
    );

    debutSemaine.setHours(
        0, 0, 0, 0
    );


    // --------------------------------------------------------
    // DEBUT DU MOIS
    // --------------------------------------------------------

    const debutMois =
        new Date(
            maintenant.getFullYear(),
            maintenant.getMonth(),
            1
        );


    // --------------------------------------------------------
    // DEBUT DE L'ANNEE
    // --------------------------------------------------------

    const debutAnnee =
        new Date(
            maintenant.getFullYear(),
            0,
            1
        );


    let totalJour = 0;
    let totalSemaine = 0;
    let totalMois = 0;
    let totalAnnee = 0;


    depensesSIAD.forEach(function(d) {

        const montant =
            Number(d.montant || 0);

        const dateDepense =
            new Date(
                d.date + "T00:00:00"
            );


        if (d.date === aujourdHui) {

            totalJour += montant;

        }


        if (
            dateDepense >= debutSemaine
        ) {

            totalSemaine += montant;

        }


        if (
            dateDepense >= debutMois
        ) {

            totalMois += montant;

        }


        if (
            dateDepense >= debutAnnee
        ) {

            totalAnnee += montant;

        }

    });


    // --------------------------------------------------------
    // AFFICHAGE
    // --------------------------------------------------------

    const elementJour =
        document.getElementById(
            "siad-total-jour"
        );

    const elementSemaine =
        document.getElementById(
            "siad-total-semaine"
        );

    const elementMois =
        document.getElementById(
            "siad-total-mois"
        );

    const elementAnnee =
        document.getElementById(
            "siad-total-annee"
        );


    if (elementJour) {

        elementJour.textContent =
            formatMoneySIAD(totalJour);

    }


    if (elementSemaine) {

        elementSemaine.textContent =
            formatMoneySIAD(totalSemaine);

    }


    if (elementMois) {

        elementMois.textContent =
            formatMoneySIAD(totalMois);

    }


    if (elementAnnee) {

        elementAnnee.textContent =
            formatMoneySIAD(totalAnnee);

    }

}


// ============================================================
// 7. ANALYSER UNE PERIODE
// ============================================================

function analyserPeriode() {

    let dateDebut =
        document.getElementById(
            "siad-date-debut"
        )?.value || "";

    let dateFin =
        document.getElementById(
            "siad-date-fin"
        )?.value || "";


    // --------------------------------------------------------
    // Si aucune période n'est choisie
    // utiliser toutes les dépenses
    // --------------------------------------------------------

    let resultats =
        depensesSIAD.slice();


    // --------------------------------------------------------
    // Filtre date début
    // --------------------------------------------------------

    if (dateDebut) {

        resultats =
            resultats.filter(function(d) {

                return d.date >= dateDebut;

            });

    }


    // --------------------------------------------------------
    // Filtre date fin
    // --------------------------------------------------------

    if (dateFin) {

        resultats =
            resultats.filter(function(d) {

                return d.date <= dateFin;

            });

    }


    // --------------------------------------------------------
    // Vérifier période
    // --------------------------------------------------------

    if (
        dateDebut &&
        dateFin &&
        dateDebut > dateFin
    ) {

        alert(
            "❌ La date début doit être avant la date fin."
        );

        return;

    }


    console.log(
        "SIAD : période analysée",
        resultats
    );


    afficherIndicateursPeriode(
        resultats
    );


    afficherParType(
        resultats
    );


    afficherParJour(
        resultats
    );


    afficherParSemaine(
        resultats
    );


    afficherParMois(
        resultats
    );

}


// ============================================================
// 8. INDICATEURS DE LA PERIODE
// ============================================================

function afficherIndicateursPeriode(
    depenses
) {

    let total = 0;

    let maximum = 0;

    let categorieMaximum = "-";


    depenses.forEach(function(d) {

        const montant =
            Number(d.montant || 0);

        total += montant;


        if (montant > maximum) {

            maximum = montant;

            categorieMaximum =
                d.categorie ||
                "Sans catégorie";

        }

    });


    const nombre =
        depenses.length;


    const moyenne =
        nombre > 0
            ? total / nombre
            : 0;


    // --------------------------------------------------------
    // Catégorie principale
    // --------------------------------------------------------

    const totauxCategories = {};


    depenses.forEach(function(d) {

        const categorie =
            d.categorie ||
            "Sans catégorie";

        const montant =
            Number(d.montant || 0);


        if (
            !totauxCategories[categorie]
        ) {

            totauxCategories[categorie] = 0;

        }


        totauxCategories[categorie] +=
            montant;

    });


    let postePrincipal = "-";

    let montantPostePrincipal = 0;


    Object.keys(
        totauxCategories
    ).forEach(function(categorie) {

        if (
            totauxCategories[categorie]
            >
            montantPostePrincipal
        ) {

            montantPostePrincipal =
                totauxCategories[categorie];

            postePrincipal =
                categorie;

        }

    });


    // --------------------------------------------------------
    // Affichage
    // --------------------------------------------------------

    const elementPoste =
        document.getElementById(
            "siad-poste-principal"
        );

    const elementMax =
        document.getElementById(
            "siad-max"
        );

    const elementMoyenne =
        document.getElementById(
            "siad-moyenne"
        );

    const elementNombre =
        document.getElementById(
            "siad-nombre"
        );


    if (elementPoste) {

        elementPoste.textContent =
            postePrincipal;

    }


    if (elementMax) {

        elementMax.textContent =
            formatMoneySIAD(maximum);

    }


    if (elementMoyenne) {

        elementMoyenne.textContent =
            formatMoneySIAD(moyenne);

    }


    if (elementNombre) {

        elementNombre.textContent =
            nombre;

    }

}


// ============================================================
// 9. DEPENSES PAR TYPE
// ============================================================

function afficherParType(
    depenses
) {

    const totaux = {};


    depenses.forEach(function(d) {

        const categorie =
            d.categorie ||
            "Sans catégorie";

        const montant =
            Number(d.montant || 0);


        if (!totaux[categorie]) {

            totaux[categorie] = 0;

        }


        totaux[categorie] +=
            montant;

    });


    const categories =
        Object.keys(totaux);


    const valeurs =
        categories.map(function(categorie) {

            return totaux[categorie];

        });


    // --------------------------------------------------------
    // Graphique
    // --------------------------------------------------------

    const canvas =
        document.getElementById(
            "chartType"
        );


    if (canvas) {

        if (chartType) {

            chartType.destroy();

        }


        chartType =
            new Chart(
                canvas,
                {
                    type: "doughnut",

                    data: {

                        labels:
                            categories,

                        datasets: [

                            {
                                data:
                                    valeurs
                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        plugins: {

                            legend: {

                                position:
                                    "bottom"

                            }

                        }

                    }

                }
            );

    }


    // --------------------------------------------------------
    // Tableau
    // --------------------------------------------------------

    const tableau =
        document.getElementById(
            "tableau-type"
        );


    if (!tableau) {

        return;

    }


    if (
        categories.length === 0
    ) {

        tableau.innerHTML = `
            <p class="text-gray-400">
                Aucune dépense.
            </p>
        `;

        return;

    }


    const total =
        valeurs.reduce(
            function(a, b) {
                return a + b;
            },
            0
        );


    tableau.innerHTML =
        categories
            .sort(function(a, b) {

                return (
                    totaux[b] -
                    totaux[a]
                );

            })
            .map(function(categorie) {

                const montant =
                    totaux[categorie];


                const pourcentage =
                    total > 0
                        ? (
                            montant /
                            total *
                            100
                        )
                        : 0;


                return `

                    <div
                        class="flex justify-between
                               items-center
                               border-b
                               border-gray-100
                               py-2">

                        <span>
                            ${echapperHTMLSIAD(
                                categorie
                            )}
                        </span>

                        <span
                            class="font-semibold">

                            ${formatMoneySIAD(
                                montant
                            )}

                            <span
                                class="text-xs
                                       text-gray-400">

                                (${pourcentage.toFixed(1)}%)

                            </span>

                        </span>

                    </div>

                `;

            })
            .join("");

}


// ============================================================
// 10. DEPENSES PAR JOUR
// ============================================================

function afficherParJour(
    depenses
) {

    const totaux = {};


    depenses.forEach(function(d) {

        const date =
            d.date;

        const montant =
            Number(d.montant || 0);


        if (!totaux[date]) {

            totaux[date] = 0;

        }


        totaux[date] += montant;

    });


    const dates =
        Object.keys(totaux)
            .sort();


    const valeurs =
        dates.map(function(date) {

            return totaux[date];

        });


    const canvas =
        document.getElementById(
            "chartJour"
        );


    if (canvas) {

        if (chartJour) {

            chartJour.destroy();

        }


        chartJour =
            new Chart(
                canvas,
                {
                    type: "line",

                    data: {

                        labels:
                            dates.map(
                                function(date) {
                                    return formatDateSIAD(
                                        date
                                    );
                                }
                            ),

                        datasets: [

                            {

                                label:
                                    "Dépenses",

                                data:
                                    valeurs,

                                tension:
                                    0.3,

                                fill:
                                    true

                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        scales: {

                            y: {

                                beginAtZero:
                                    true

                            }

                        }

                    }

                }

            );

    }


    const tableau =
        document.getElementById(
            "tableau-jour"
        );


    if (tableau) {

        tableau.innerHTML =
            dates.map(function(date) {

                return `

                    <div
                        class="flex justify-between
                               border-b
                               border-gray-100
                               py-2">

                        <span>
                            ${formatDateSIAD(
                                date
                            )}
                        </span>

                        <strong>
                            ${formatMoneySIAD(
                                totaux[date]
                            )}
                        </strong>

                    </div>

                `;

            }).join("");

    }

}


// ============================================================
// 11. DEPENSES PAR SEMAINE
// ============================================================

function getNumeroSemaine(
    dateStr
) {

    const date =
        new Date(
            dateStr + "T00:00:00"
        );


    const debutAnnee =
        new Date(
            date.getFullYear(),
            0,
            1
        );


    const difference =
        Math.floor(
            (
                date -
                debutAnnee
            ) /
            86400000
        );


    return Math.ceil(
        (
            difference +
            debutAnnee.getDay() +
            1
        ) / 7
    );

}


function afficherParSemaine(
    depenses
) {

    const totaux = {};


    depenses.forEach(function(d) {

        const date =
            new Date(
                d.date + "T00:00:00"
            );


        const annee =
            date.getFullYear();


        const semaine =
            getNumeroSemaine(
                d.date
            );


        const cle =
            `${annee}-S${String(
                semaine
            ).padStart(2, "0")}`;


        const montant =
            Number(d.montant || 0);


        if (!totaux[cle]) {

            totaux[cle] = 0;

        }


        totaux[cle] +=
            montant;

    });


    const semaines =
        Object.keys(totaux)
            .sort();


    const valeurs =
        semaines.map(function(semaine) {

            return totaux[semaine];

        });


    const canvas =
        document.getElementById(
            "chartSemaine"
        );


    if (canvas) {

        if (chartSemaine) {

            chartSemaine.destroy();

        }


        chartSemaine =
            new Chart(
                canvas,
                {
                    type: "bar",

                    data: {

                        labels:
                            semaines,

                        datasets: [

                            {

                                label:
                                    "Dépenses",

                                data:
                                    valeurs

                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        scales: {

                            y: {

                                beginAtZero:
                                    true

                            }

                        }

                    }

                }

            );

    }


    const tableau =
        document.getElementById(
            "tableau-semaine"
        );


    if (tableau) {

        tableau.innerHTML =
            semaines.map(function(semaine) {

                return `

                    <div
                        class="flex justify-between
                               border-b
                               border-gray-100
                               py-2">

                        <span>
                            ${semaine}
                        </span>

                        <strong>
                            ${formatMoneySIAD(
                                totaux[semaine]
                            )}
                        </strong>

                    </div>

                `;

            }).join("");

    }

}


// ============================================================
// 12. DEPENSES PAR MOIS
// ============================================================

function afficherParMois(
    depenses
) {

    const totaux = {};


    depenses.forEach(function(d) {

        const date =
            new Date(
                d.date + "T00:00:00"
            );


        const cle =
            `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;


        const montant =
            Number(d.montant || 0);


        if (!totaux[cle]) {

            totaux[cle] = 0;

        }


        totaux[cle] +=
            montant;

    });


    const mois =
        Object.keys(totaux)
            .sort();


    const valeurs =
        mois.map(function(m) {

            return totaux[m];

        });


    const canvas =
        document.getElementById(
            "chartMois"
        );


    if (canvas) {

        if (chartMois) {

            chartMois.destroy();

        }


        chartMois =
            new Chart(
                canvas,
                {
                    type: "bar",

                    data: {

                        labels:
                            mois,

                        datasets: [

                            {

                                label:
                                    "Dépenses",

                                data:
                                    valeurs

                            }

                        ]

                    },

                    options: {

                        responsive: true,

                        scales: {

                            y: {

                                beginAtZero:
                                    true

                            }

                        }

                    }

                }

            );

    }


    const tableau =
        document.getElementById(
            "tableau-mois"
        );


    if (tableau) {

        tableau.innerHTML =
            mois.map(function(m) {

                return `

                    <div
                        class="flex justify-between
                               border-b
                               border-gray-100
                               py-2">

                        <span>
                            ${m}
                        </span>

                        <strong>
                            ${formatMoneySIAD(
                                totaux[m]
                            )}
                        </strong>

                    </div>

                `;

            }).join("");

    }

}


// ============================================================
// 13. INITIALISATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        console.log(
            "SIAD : initialisation..."
        );

        chargerDepensesSIAD();

    }
);


// ============================================================
// FIN
// ============================================================
