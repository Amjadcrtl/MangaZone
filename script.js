/* =========================================================
   MANGAZONE — SCRIPT PRINCIPAL
   Catalogue + vrai système de compte avec serveur
   ========================================================= */


/* ================= CONFIGURATION ================= */

const API = "/api";


/* ================= DONNÉES DES ANIME ================= */

const animeList = [

    {
        id: 1,
        title: "One Piece",
        image: "images/one-piece.jpg",
        genre: "Aventure",
        category: "aventure",
        year: "1999",
        rating: "9.2",
        status: "En cours",
        description:
            "Un grand voyage d'aventure à travers les mers à la recherche du légendaire trésor One Piece."
    },

    {
        id: 2,
        title: "Jujutsu Kaisen",
        image: "images/jjk.jpg",
        genre: "Action",
        category: "action",
        year: "2020",
        rating: "8.9",
        status: "Catalogue",
        description:
            "Un univers fantastique où des combattants affrontent de dangereuses malédictions."
    },

    {
        id: 3,
        title: "Demon Slayer",
        image: "images/demon-slayer.jpg",
        genre: "Action",
        category: "action",
        year: "2019",
        rating: "8.7",
        status: "Catalogue",
        description:
            "Une aventure fantastique centrée sur un jeune combattant qui affronte des démons."
    },

    {
        id: 4,
        title: "Solo Leveling",
        image: "images/solo-leveling.jpg",
        genre: "Fantasy",
        category: "fantasy",
        year: "2024",
        rating: "8.8",
        status: "Catalogue",
        description:
            "Un chasseur commence une évolution exceptionnelle dans un monde rempli de dangers."
    },

    {
        id: 5,
        title: "Frieren",
        image: "images/frieren.jpg",
        genre: "Fantasy",
        category: "fantasy",
        year: "2023",
        rating: "9.0",
        status: "Catalogue",
        description:
            "Une elfe magicienne poursuit son voyage et découvre progressivement le sens des relations humaines."
    },

    {
        id: 6,
        title: "SPY x FAMILY",
        image: "images/spy-family.jpg",
        genre: "Action / Comédie",
        category: "action",
        year: "2022",
        rating: "8.5",
        status: "Catalogue",
        description:
            "Une famille inhabituelle tente de préserver ses secrets tout en accomplissant différentes missions."
    },

    {
        id: 7,
        title: "Chainsaw Man",
        image: "images/chainsaw-man.jpg",
        genre: "Action",
        category: "action",
        year: "2022",
        rating: "8.6",
        status: "Catalogue",
        description:
            "Un jeune homme se retrouve impliqué dans un monde dangereux peuplé de créatures surnaturelles."
    },

    {
        id: 8,
        title: "Blue Lock",
        image: "images/blue-lock.jpg",
        genre: "Sport",
        category: "sport",
        year: "2022",
        rating: "8.3",
        status: "Catalogue",
        description:
            "De jeunes joueurs de football s'affrontent dans un programme destiné à former un attaquant exceptionnel."
    },

    {
        id: 9,
        title: "Dandadan",
        image: "images/dandadan.jpg",
        genre: "Action / Fantasy",
        category: "fantasy",
        year: "2024",
        rating: "8.7",
        status: "Catalogue",
        description:
            "Deux adolescents découvrent un monde étrange mêlant phénomènes surnaturels et extraterrestres."
    },

    {
        id: 10,
        title: "Kaiju No. 8",
        image: "images/kaiju-8.jpg",
        genre: "Action",
        category: "action",
        year: "2024",
        rating: "8.5",
        status: "Catalogue",
        description:
            "Un homme chargé de nettoyer les conséquences des attaques de monstres voit sa vie complètement changer."
    }

];


/* ================= VARIABLES ================= */

let currentAnime = null;
let currentFilter = "all";

/*
   Le token sert uniquement à authentifier les requêtes
   auprès du serveur.
*/
let authToken = localStorage.getItem("mangazoneToken") || null;

let currentUser = null;

/*
   Les favoris viennent maintenant du serveur.
   On ne stocke plus la liste des favoris dans localStorage.
*/
let favorites = [];


/* ================= ÉLÉMENTS HTML ================= */

const animeGrid =
    document.getElementById("animeGrid");

const animeCount =
    document.getElementById("animeCount");

const searchInput =
    document.getElementById("searchInput");

const searchButton =
    document.getElementById("searchButton");

const animeMenuButton =
    document.getElementById("animeMenuButton");

const animeMenu =
    document.getElementById("animeMenu");

const animeModal =
    document.getElementById("animeModal");

const authorizationModal =
    document.getElementById("authorizationModal");

const closeModal =
    document.getElementById("closeModal");

const closeAuthorization =
    document.getElementById("closeAuthorization");

const watchButton =
    document.getElementById("watchButton");

const favoriteButton =
    document.getElementById("favoriteButton");

const favoritesButton =
    document.getElementById("favoritesButton");

const favoritesSection =
    document.getElementById("favoritesSection");

const favoritesGrid =
    document.getElementById("favoritesGrid");

const closeFavorites =
    document.getElementById("closeFavorites");

const continueSection =
    document.getElementById("continueSection");

const noResults =
    document.getElementById("noResults");


/* ================= COMPTE ================= */

const loginButton =
    document.getElementById("loginButton");

const registerButton =
    document.getElementById("registerButton");

const logoutButton =
    document.getElementById("logoutButton");

const themeButton =
    document.getElementById("themeButton");


/* ================= MODALE CONNEXION ================= */

const loginModal =
    document.getElementById("loginModal");

const closeLogin =
    document.getElementById("closeLogin");

const loginUsername =
    document.getElementById("loginUsername");

const loginPassword =
    document.getElementById("loginPassword");

const submitLogin =
    document.getElementById("submitLogin");

const loginMessage =
    document.getElementById("loginMessage");


/* ================= MODALE INSCRIPTION ================= */

const registerModal =
    document.getElementById("registerModal");

const closeRegister =
    document.getElementById("closeRegister");

const registerUsername =
    document.getElementById("registerUsername");

const registerEmail =
    document.getElementById("registerEmail");

const registerPassword =
    document.getElementById("registerPassword");

const submitRegister =
    document.getElementById("submitRegister");

const registerMessage =
    document.getElementById("registerMessage");


/* ================= INITIALISATION ================= */

document.addEventListener("DOMContentLoaded", async () => {

    displayAnime(animeList);

    updateAnimeCount(animeList.length);

    setupEvents();

    loadTheme();

    /*
       Si un token existe, on demande au serveur
       de vérifier qu'il est encore valide.
    */
    if (authToken) {

        await loadAccount();

    } else {

        updateAccountUI();

    }

});


/* =========================================================
   UTILITAIRE API
   ========================================================= */

async function apiRequest(endpoint, options = {}) {

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    /*
       Ajout automatique du token.
    */
    if (authToken) {

        headers.Authorization =
            `Bearer ${authToken}`;

    }

    try {

        const response =
            await fetch(API + endpoint, {
                ...options,
                headers
            });

        let data = {};

        try {

            data = await response.json();

        } catch {

            data = {};

        }

        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Une erreur est survenue."
            );

        }

        return data;

    } catch (error) {

        console.error(
            "Erreur API :",
            error
        );

        throw error;

    }

}


/* =========================================================
   AFFICHER LES ANIME
   ========================================================= */

function displayAnime(list) {

    if (!animeGrid) {
        return;
    }

    animeGrid.innerHTML = "";

    if (list.length === 0) {

        if (noResults) {

            noResults.classList.remove(
                "hidden"
            );

        }

        return;
    }

    if (noResults) {

        noResults.classList.add(
            "hidden"
        );

    }

    list.forEach(anime => {

        const card =
            document.createElement("article");

        card.className =
            "anime-card";

        card.dataset.id =
            anime.id;

        const isFavorite =
            favorites.includes(anime.id);

        card.innerHTML = `

            <div class="anime-image">

                <img
                    src="${anime.image}"
                    alt="${anime.title}"
                    loading="lazy"
                    onerror="this.style.display='none';"
                >

                <span class="anime-badge">
                    ${anime.status}
                </span>

                <button
                    class="card-favorite"
                    data-favorite="${anime.id}"
                    title="Ajouter aux favoris"
                >
                    ${isFavorite ? "❤️" : "🤍"}
                </button>

            </div>

            <div class="anime-card-content">

                <h3 class="anime-card-title">
                    ${anime.title}
                </h3>

                <div class="anime-card-meta">

                    <span>
                        ${anime.year}
                    </span>

                    <span>•</span>

                    <span>
                        ${anime.genre}
                    </span>

                    <span>•</span>

                    <span class="anime-rating">
                        ⭐ ${anime.rating}
                    </span>

                </div>

                <p class="anime-card-description">
                    ${anime.description}
                </p>

                <button
                    class="watch-card-button"
                    data-watch="${anime.id}"
                >
                    ▶ Regarder
                </button>

            </div>

        `;

        animeGrid.appendChild(card);

    });

    attachCardEvents();

}


/* =========================================================
   ÉVÉNEMENTS DES CARTES
   ========================================================= */

function attachCardEvents() {

    document
        .querySelectorAll(".anime-card")
        .forEach(card => {

            card.addEventListener(
                "click",
                event => {

                    if (
                        event.target.closest(
                            ".card-favorite"
                        ) ||
                        event.target.closest(
                            ".watch-card-button"
                        )
                    ) {
                        return;
                    }

                    const id =
                        Number(
                            card.dataset.id
                        );

                    openAnime(id);

                }
            );

        });


    document
        .querySelectorAll(".card-favorite")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    const id =
                        Number(
                            button.dataset.favorite
                        );

                    toggleFavorite(id);

                }
            );

        });


    document
        .querySelectorAll(".watch-card-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    const id =
                        Number(
                            button.dataset.watch
                        );

                    openAuthorization(id);

                }
            );

        });

}


/* =========================================================
   OUVRIR ANIME
   ========================================================= */

function openAnime(id) {

    const anime =
        animeList.find(
            item => item.id === id
        );

    if (!anime) {
        return;
    }

    currentAnime = anime;


    const modalImage =
        document.getElementById(
            "modalImage"
        );

    const modalGenre =
        document.getElementById(
            "modalGenre"
        );

    const modalTitle =
        document.getElementById(
            "modalTitle"
        );

    const modalDescription =
        document.getElementById(
            "modalDescription"
        );

    const modalYear =
        document.getElementById(
            "modalYear"
        );

    const modalStatus =
        document.getElementById(
            "modalStatus"
        );


    if (modalImage) {

        modalImage.style.backgroundImage =
            `url("${anime.image}")`;

    }


    if (modalGenre) {

        modalGenre.textContent =
            anime.genre;

    }


    if (modalTitle) {

        modalTitle.textContent =
            anime.title;

    }


    if (modalDescription) {

        modalDescription.textContent =
            anime.description;

    }


    if (modalYear) {

        modalYear.textContent =
            `📅 ${anime.year}`;

    }


    if (modalStatus) {

        modalStatus.textContent =
            `📌 ${anime.status}`;

    }


    updateFavoriteButton();


    if (animeModal) {

        animeModal.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   FERMER ANIME
   ========================================================= */

function closeAnimeModal() {

    if (animeModal) {

        animeModal.classList.add(
            "hidden"
        );

    }

    currentAnime = null;

}


/* =========================================================
   AUTORISATION
   ========================================================= */

function openAuthorization(id) {

    const anime =
        animeList.find(
            item => item.id === id
        );

    if (!anime) {
        return;
    }

    currentAnime = anime;


    if (authorizationModal) {

        authorizationModal.classList.remove(
            "hidden"
        );

    }

}


/* =========================================================
   FERMER AUTORISATION
   ========================================================= */

function closeAuthorizationModal() {

    if (authorizationModal) {

        authorizationModal.classList.add(
            "hidden"
        );

    }

}


/* =========================================================
   FAVORIS — SERVEUR
   ========================================================= */

async function toggleFavorite(id) {

    /*
       Les favoris nécessitent un compte.
    */
    if (!authToken || !currentUser) {

        openLogin();

        showMessage(
            loginMessage,
            "Connecte-toi pour utiliser les favoris.",
            "error"
        );

        return;

    }


    const anime =
        animeList.find(
            item => item.id === id
        );

    if (!anime) {
        return;
    }


    const isFavorite =
        favorites.includes(id);


    try {

        if (!isFavorite) {

            const data =
                await apiRequest(
                    "/favorites",
                    {
                        method: "POST",
                        body: JSON.stringify({
                            name: anime.title
                        })
                    }
                );


            /*
               Le serveur stocke actuellement
               les noms des anime.
            */
            favorites =
                convertFavoriteNamesToIds(
                    data.favorites || []
                );

        } else {

            const data =
                await apiRequest(
                    "/favorites/" +
                    encodeURIComponent(
                        anime.title
                    ),
                    {
                        method: "DELETE"
                    }
                );


            favorites =
                convertFavoriteNamesToIds(
                    data.favorites || []
                );

        }


        displayCurrentList();

        displayFavorites();

        updateFavoriteButton();

    } catch (error) {

        alert(
            error.message ||
            "Impossible de modifier les favoris."
        );

    }

}


/* =========================================================
   CONVERSION FAVORIS
   ========================================================= */

function convertFavoriteNamesToIds(
    favoriteNames
) {

    if (!Array.isArray(favoriteNames)) {

        return [];

    }


    return favoriteNames
        .map(name => {

            const anime =
                animeList.find(
                    item =>
                        item.title.toLowerCase() ===
                        String(name).toLowerCase()
                );

            return anime
                ? anime.id
                : null;

        })
        .filter(
            id => id !== null
        );

}


/* =========================================================
   BOUTON FAVORI MODAL
   ========================================================= */

function updateFavoriteButton() {

    if (
        !favoriteButton ||
        !currentAnime
    ) {

        return;

    }


    if (
        !authToken ||
        !currentUser
    ) {

        favoriteButton.textContent =
            "🔐 Connecte-toi pour ajouter";

        return;

    }


    const isFavorite =
        favorites.includes(
            currentAnime.id
        );


    if (isFavorite) {

        favoriteButton.textContent =
            "❤️ Retirer des favoris";

    } else {

        favoriteButton.textContent =
            "🤍 Ajouter aux favoris";

    }

}


/* =========================================================
   AFFICHER FAVORIS
   ========================================================= */

function displayFavorites() {

    if (!favoritesGrid) {
        return;
    }


    const favoriteAnime =
        animeList.filter(
            anime =>
                favorites.includes(
                    anime.id
                )
        );


    favoritesGrid.innerHTML = "";


    if (favoriteAnime.length === 0) {

        favoritesGrid.innerHTML = `

            <div class="no-results">

                <div>🤍</div>

                <h3>
                    Aucun favori
                </h3>

                <p>
                    Ajoute des anime à tes favoris.
                </p>

            </div>

        `;

        return;

    }


    favoriteAnime.forEach(anime => {

        const card =
            createFavoriteCard(anime);

        favoritesGrid.appendChild(card);

    });


    attachFavoriteEvents();

}


/* =========================================================
   CARTE FAVORI
   ========================================================= */

function createFavoriteCard(anime) {

    const card =
        document.createElement(
            "article"
        );

    card.className =
        "anime-card";

    card.dataset.id =
        anime.id;


    card.innerHTML = `

        <div class="anime-image">

            <img
                src="${anime.image}"
                alt="${anime.title}"
                loading="lazy"
            >

            <span class="anime-badge">
                ${anime.status}
            </span>

        </div>

        <div class="anime-card-content">

            <h3 class="anime-card-title">
                ${anime.title}
            </h3>

            <div class="anime-card-meta">

                <span>
                    ${anime.year}
                </span>

                <span>•</span>

                <span class="anime-rating">
                    ⭐ ${anime.rating}
                </span>

            </div>

            <button
                class="watch-card-button"
                data-watch-favorite="${anime.id}"
            >
                ▶ Regarder
            </button>

        </div>

    `;


    return card;

}


/* =========================================================
   ÉVÉNEMENTS FAVORIS
   ========================================================= */

function attachFavoriteEvents() {

    document
        .querySelectorAll(
            "[data-watch-favorite]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    const id =
                        Number(
                            button.dataset
                                .watchFavorite
                        );

                    openAuthorization(id);

                }
            );

        });


    document
        .querySelectorAll(
            "#favoritesGrid .anime-card"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                () => {

                    const id =
                        Number(
                            card.dataset.id
                        );

                    openAnime(id);

                }
            );

        });

}


/* =========================================================
   RECHERCHE
   ========================================================= */

function searchAnime() {

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const filtered =
        animeList.filter(
            anime => {

                const matchesSearch =
                    anime.title
                        .toLowerCase()
                        .includes(search);


                const matchesCategory =
                    currentFilter === "all" ||
                    anime.category ===
                    currentFilter;


                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );


    displayAnime(filtered);

    updateAnimeCount(
        filtered.length
    );

}


/* =========================================================
   FILTRE
   ========================================================= */

function filterAnime(category) {

    currentFilter =
        category;

    searchAnime();


    if (animeMenu) {

        animeMenu.classList.remove(
            "show"
        );

    }

}


/* =========================================================
   COMPTEUR
   ========================================================= */

function updateAnimeCount(count) {

    if (!animeCount) {
        return;
    }


    if (count === 1) {

        animeCount.textContent =
            "1 anime";

    } else {

        animeCount.textContent =
            `${count} anime`;

    }

}


/* =========================================================
   AFFICHAGE ACTUEL
   ========================================================= */

function displayCurrentList() {

    searchAnime();

}


/* =========================================================
   FAVORIS SECTION
   ========================================================= */

function showFavorites() {

    if (!favoritesSection) {
        return;
    }


    if (!authToken || !currentUser) {

        openLogin();

        showMessage(
            loginMessage,
            "Connecte-toi pour voir tes favoris.",
            "error"
        );

        return;

    }


    displayFavorites();


    favoritesSection.classList.remove(
        "hidden"
    );


    favoritesSection.scrollIntoView({
        behavior: "smooth"
    });

}


/* =========================================================
   CACHER FAVORIS
   ========================================================= */

function hideFavorites() {

    if (!favoritesSection) {
        return;
    }


    favoritesSection.classList.add(
        "hidden"
    );

}


/* =========================================================
   SCROLL ANIME
   ========================================================= */

function scrollToAnime() {

    const section =
        document.getElementById(
            "animeSection"
        );


    if (section) {

        section.scrollIntoView({
            behavior: "smooth"
        });

    }

}


/* =========================================================
   INSCRIPTION
   ========================================================= */

async function register() {

    const username =
        registerUsername
            ? registerUsername.value.trim()
            : "";

    const email =
        registerEmail
            ? registerEmail.value.trim()
            : "";

    const password =
        registerPassword
            ? registerPassword.value
            : "";


    if (!username) {

        showMessage(
            registerMessage,
            "Entre un nom d'utilisateur.",
            "error"
        );

        return;

    }


    if (username.length < 3) {

        showMessage(
            registerMessage,
            "Le nom doit contenir au moins 3 caractères.",
            "error"
        );

        return;

    }


    if (username.length > 20) {

        showMessage(
            registerMessage,
            "Le nom ne doit pas dépasser 20 caractères.",
            "error"
        );

        return;

    }


    if (!email) {

        showMessage(
            registerMessage,
            "Entre ton adresse email.",
            "error"
        );

        return;

    }


    if (!isValidEmail(email)) {

        showMessage(
            registerMessage,
            "Adresse email invalide.",
            "error"
        );

        return;

    }


    if (password.length < 6) {

        showMessage(
            registerMessage,
            "Le mot de passe doit contenir au moins 6 caractères.",
            "error"
        );

        return;

    }


    setButtonLoading(
        submitRegister,
        true,
        "Création..."
    );


    try {

        /*
           Le serveur actuel attend username/password.
           L'email est donc vérifié côté frontend mais
           n'est pas envoyé au serveur tant que ton
           server.js ne possède pas de champ email.
        */
        const data =
            await apiRequest(
                "/register",
                {
                    method: "POST",
                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );


        authToken =
            data.token;


        localStorage.setItem(
            "mangazoneToken",
            authToken
        );


        currentUser =
            data.user || null;


        closeRegisterModal();

        clearRegisterForm();

        await loadAccount();


        alert(
            "🎉 Compte MangaZone créé avec succès !"
        );


    } catch (error) {

        showMessage(
            registerMessage,
            error.message ||
            "Impossible de créer le compte.",
            "error"
        );

    } finally {

        setButtonLoading(
            submitRegister,
            false,
            "Créer mon compte"
        );

    }

}


/* =========================================================
   CONNEXION
   ========================================================= */

async function login() {

    const username =
        loginUsername
            ? loginUsername.value.trim()
            : "";

    const password =
        loginPassword
            ? loginPassword.value
            : "";


    if (!username) {

        showMessage(
            loginMessage,
            "Entre ton nom d'utilisateur.",
            "error"
        );

        return;

    }


    if (!password) {

        showMessage(
            loginMessage,
            "Entre ton mot de passe.",
            "error"
        );

        return;

    }


    setButtonLoading(
        submitLogin,
        true,
        "Connexion..."
    );


    try {

        const data =
            await apiRequest(
                "/login",
                {
                    method: "POST",
                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );


        authToken =
            data.token;


        localStorage.setItem(
            "mangazoneToken",
            authToken
        );


        currentUser =
            data.user || null;


        closeLoginModal();

        clearLoginForm();

        await loadAccount();


        alert(
            `👋 Bienvenue sur MangaZone, ${currentUser?.username || username} !`
        );


    } catch (error) {

        showMessage(
            loginMessage,
            error.message ||
            "Nom d'utilisateur ou mot de passe incorrect.",
            "error"
        );

    } finally {

        setButtonLoading(
            submitLogin,
            false,
            "Se connecter"
        );

    }

}


/* =========================================================
   CHARGER LE COMPTE
   ========================================================= */

async function loadAccount() {

    if (!authToken) {

        currentUser = null;

        favorites = [];

        updateAccountUI();

        return;

    }


    try {

        const data =
            await apiRequest(
                "/me"
            );


        currentUser =
            data;


        favorites =
            convertFavoriteNamesToIds(
                data.favorites || []
            );


        updateAccountUI();

        displayCurrentList();

        displayFavorites();

        updateFavoriteButton();


    } catch (error) {

        /*
           Token invalide/expiré.
        */

        console.warn(
            "Session invalide."
        );

        authToken = null;

        currentUser = null;

        favorites = [];


        localStorage.removeItem(
            "mangazoneToken"
        );


        updateAccountUI();

        displayCurrentList();

    }

}


/* =========================================================
   DÉCONNEXION
   ========================================================= */

function logout() {

    authToken = null;

    currentUser = null;

    favorites = [];


    localStorage.removeItem(
        "mangazoneToken"
    );


    updateAccountUI();

    displayCurrentList();

    displayFavorites();


    if (favoritesSection) {

        favoritesSection.classList.add(
            "hidden"
        );

    }


    if (currentAnime) {

        updateFavoriteButton();

    }


    alert(
        "👋 Tu es maintenant déconnecté."
    );

}


/* =========================================================
   INTERFACE DU COMPTE
   ========================================================= */

function updateAccountUI() {

    if (loginButton) {

        loginButton.classList.toggle(
            "hidden",
            Boolean(currentUser)
        );

    }


    if (registerButton) {

        registerButton.classList.toggle(
            "hidden",
            Boolean(currentUser)
        );

    }


    if (logoutButton) {

        logoutButton.classList.toggle(
            "hidden",
            !currentUser
        );

    }


    if (loginButton) {

        loginButton.textContent =
            "🔐 Connexion";

    }


    /*
       Si le HTML possède un élément
       #accountUsername, on affiche le nom.
    */

    const accountUsername =
        document.getElementById(
            "accountUsername"
        );


    if (accountUsername) {

        if (currentUser) {

            accountUsername.textContent =
                currentUser.username;

        } else {

            accountUsername.textContent =
                "";

        }

    }

}


/* =========================================================
   OUVRIR CONNEXION
   ========================================================= */

function openLogin() {

    if (!loginModal) {
        return;
    }


    loginModal.classList.remove(
        "hidden"
    );


    setTimeout(() => {

        if (loginUsername) {

            loginUsername.focus();

        }

    }, 50);

}


/* =========================================================
   FERMER CONNEXION
   ========================================================= */

function closeLoginModal() {

    if (loginModal) {

        loginModal.classList.add(
            "hidden"
        );

    }


    clearMessage(
        loginMessage
    );

}


/* =========================================================
   OUVRIR INSCRIPTION
   ========================================================= */

function openRegister() {

    if (!registerModal) {
        return;
    }


    registerModal.classList.remove(
        "hidden"
    );


    setTimeout(() => {

        if (registerUsername) {

            registerUsername.focus();

        }

    }, 50);

}


/* =========================================================
   FERMER INSCRIPTION
   ========================================================= */

function closeRegisterModal() {

    if (registerModal) {

        registerModal.classList.add(
            "hidden"
        );

    }


    clearMessage(
        registerMessage
    );

}


/* =========================================================
   EMAIL
   ========================================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


/* =========================================================
   MESSAGES
   ========================================================= */

function showMessage(
    element,
    message,
    type = "info"
) {

    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.classList.remove(
        "hidden",
        "error",
        "success"
    );


    element.classList.add(
        type
    );

}


function clearMessage(element) {

    if (!element) {
        return;
    }


    element.textContent =
        "";

    element.classList.add(
        "hidden"
    );

    element.classList.remove(
        "error",
        "success"
    );

}


/* =========================================================
   FORMULAIRES
   ========================================================= */

function clearLoginForm() {

    if (loginUsername) {

        loginUsername.value =
            "";

    }

    if (loginPassword) {

        loginPassword.value =
            "";

    }

}


function clearRegisterForm() {

    if (registerUsername) {

        registerUsername.value =
            "";

    }

    if (registerEmail) {

        registerEmail.value =
            "";

    }

    if (registerPassword) {

        registerPassword.value =
            "";

    }

}


/* =========================================================
   BOUTON LOADING
   ========================================================= */

function setButtonLoading(
    button,
    loading,
    text
) {

    if (!button) {
        return;
    }


    if (loading) {

        button.dataset.originalText =
            button.textContent;

        button.disabled =
            true;

        button.textContent =
            text;

    } else {

        button.disabled =
            false;

        button.textContent =
            button.dataset.originalText ||
            text;

    }

}


/* =========================================================
   THÈME
   ========================================================= */

function loadTheme() {

    const theme =
        localStorage.getItem(
            "mangazoneTheme"
        );


    if (theme === "dark") {

        document.body.classList.add(
            "dark-mode"
        );

        updateThemeButton();

    } else {

        document.body.classList.remove(
            "dark-mode"
        );

        updateThemeButton();

    }

}


function toggleTheme() {

    document.body.classList.toggle(
        "dark-mode"
    );


    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );


    localStorage.setItem(
        "mangazoneTheme",
        isDark
            ? "dark"
            : "light"
    );


    updateThemeButton();

}


function updateThemeButton() {

    if (!themeButton) {
        return;
    }


    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );


    themeButton.textContent =
        isDark
            ? "☀️"
            : "🌙";

}


/* =========================================================
   ÉVÉNEMENTS
   ========================================================= */

function setupEvents() {


    /* ================= RECHERCHE ================= */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            searchAnime
        );


        searchInput.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    searchAnime();

                }

            }
        );

    }


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            searchAnime
        );

    }


    /* ================= MENU ANIME ================= */

    if (animeMenuButton) {

        animeMenuButton.addEventListener(
            "click",
            event => {

                event.stopPropagation();

                if (animeMenu) {

                    animeMenu.classList.toggle(
                        "show"
                    );

                }

            }
        );

    }


    /* ================= CATÉGORIES ================= */

    if (animeMenu) {

        animeMenu
            .querySelectorAll("button")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const filter =
                            button.dataset.filter;

                        filterAnime(
                            filter
                        );

                    }
                );

            });

    }


    /* ================= FERME MENU ================= */

    document.addEventListener(
        "click",
        event => {

            if (
                animeMenu &&
                !animeMenu.contains(
                    event.target
                ) &&
                event.target !==
                animeMenuButton
            ) {

                animeMenu.classList.remove(
                    "show"
                );

            }

        }
    );


    /* ================= MODAL ANIME ================= */

    if (closeModal) {

        closeModal.addEventListener(
            "click",
            closeAnimeModal
        );

    }


    /* ================= REGARDER ================= */

    if (watchButton) {

        watchButton.addEventListener(
            "click",
            () => {

                if (currentAnime) {

                    openAuthorization(
                        currentAnime.id
                    );

                }

            }
        );

    }


    /* ================= FAVORI MODAL ================= */

    if (favoriteButton) {

        favoriteButton.addEventListener(
            "click",
            () => {

                if (currentAnime) {

                    toggleFavorite(
                        currentAnime.id
                    );

                }

            }
        );

    }


    /* ================= FAVORIS ================= */

    if (favoritesButton) {

        favoritesButton.addEventListener(
            "click",
            showFavorites
        );

    }


    if (closeFavorites) {

        closeFavorites.addEventListener(
            "click",
            hideFavorites
        );

    }


    /* ================= AUTORISATION ================= */

    if (closeAuthorization) {

        closeAuthorization.addEventListener(
            "click",
            closeAuthorizationModal
        );

    }


    /* ================= CONNEXION ================= */

    if (loginButton) {

        loginButton.addEventListener(
            "click",
            openLogin
        );

    }


    if (closeLogin) {

        closeLogin.addEventListener(
            "click",
            closeLoginModal
        );

    }


    if (submitLogin) {

        submitLogin.addEventListener(
            "click",
            login
        );

    }


    /*
       Permet de faire Entrée dans le formulaire.
    */

    if (loginPassword) {

        loginPassword.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    login();

                }

            }
        );

    }


    /* ================= INSCRIPTION ================= */

    if (registerButton) {

        registerButton.addEventListener(
            "click",
            openRegister
        );

    }


    if (closeRegister) {

        closeRegister.addEventListener(
            "click",
            closeRegisterModal
        );

    }


    if (submitRegister) {

        submitRegister.addEventListener(
            "click",
            register
        );

    }


    if (registerPassword) {

        registerPassword.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    register();

                }

            }
        );

    }


    /* ================= DÉCONNEXION ================= */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }


    /* ================= THÈME ================= */

    if (themeButton) {

        themeButton.addEventListener(
            "click",
            toggleTheme
        );

    }


    /* ================= CLIC FOND MODAL ================= */

    if (animeModal) {

        animeModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    animeModal
                ) {

                    closeAnimeModal();

                }

            }
        );

    }


    if (authorizationModal) {

        authorizationModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    authorizationModal
                ) {

                    closeAuthorizationModal();

                }

            }
        );

    }


    if (loginModal) {

        loginModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    loginModal
                ) {

                    closeLoginModal();

                }

            }
        );

    }


    if (registerModal) {

        registerModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    registerModal
                ) {

                    closeRegisterModal();

                }

            }
        );

    }


    /* ================= ÉCHAP ================= */

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                closeAnimeModal();

                closeAuthorizationModal();

                closeLoginModal();

                closeRegisterModal();

            }

        }
    );

}


/* =========================================================
   IMAGE DE SECOURS
   ========================================================= */

document.addEventListener(
    "error",
    event => {

        if (
            event.target.tagName ===
            "IMG"
        ) {

            event.target.alt =
                "Image indisponible";

        }

    },
    true
);