const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

const app = express();

/* =========================================================
   CONFIGURATION
========================================================= */

const PORT = Number(process.env.PORT) || 3000;

// En production, JWT_SECRET DOIT être fourni par Railway.
const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === "production"
    ? null
    : "MANGAZONE_DEV_SECRET_LOCAL_ONLY");

// Railway fournit automatiquement RAILWAY_VOLUME_MOUNT_PATH
// lorsqu'un volume est attaché.
// En local, on utilise le dossier data de MangaZone.
const DATA_DIR =
  process.env.DATA_DIR ||
  process.env.RAILWAY_VOLUME_MOUNT_PATH ||
  path.join(__dirname, "data");

const USERS_FILE = path.join(DATA_DIR, "users.json");

/* =========================================================
   SÉCURITÉ DE CONFIGURATION
========================================================= */


/* =========================================================
   INITIALISATION DU DOSSIER DE DONNÉES
========================================================= */

try {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, "[]", "utf8");
    console.log("✅ users.json créé :", USERS_FILE);
  }
} catch (error) {
  console.error("❌ Impossible d'initialiser les données :", error);
  process.exit(1);
}

/* =========================================================
   MIDDLEWARES
========================================================= */

app.use(express.json({ limit: "100kb" }));

app.use(express.urlencoded({
  extended: true,
  limit: "100kb"
}));

/*
  Sert index.html, style.css, script.js, images/, etc.
*/
app.use(express.static(__dirname));

/* =========================================================
   FONCTIONS UTILITAIRES
========================================================= */

function getUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }

    const data = fs.readFileSync(USERS_FILE, "utf8");

    if (!data.trim()) {
      return [];
    }

    const users = JSON.parse(data);

    return Array.isArray(users) ? users : [];
  } catch (error) {
    console.error("❌ Erreur lecture users.json :", error);
    return [];
  }
}


function saveUsers(users) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });

    /*
      Écriture temporaire puis remplacement.
      Cela évite de laisser un fichier partiellement écrit
      si le processus rencontre un problème pendant l'écriture.
    */
    const tempFile = `${USERS_FILE}.tmp`;

    fs.writeFileSync(
      tempFile,
      JSON.stringify(users, null, 2),
      "utf8"
    );

    fs.renameSync(tempFile, USERS_FILE);

    return true;
  } catch (error) {
    console.error("❌ Erreur sauvegarde users.json :", error);
    return false;
  }
}


function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username
    },
    JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
}


function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    favorites: Array.isArray(user.favorites)
      ? user.favorites
      : [],
    continueWatching: Array.isArray(user.continueWatching)
      ? user.continueWatching
      : []
  };
}


function generateId() {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 10)
  );
}

/* =========================================================
   AUTHENTIFICATION JWT
========================================================= */

function auth(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise."
      });
    }

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Token invalide."
      });
    }

    const token = header.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token manquant."
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Session invalide ou expirée."
    });
  }
}

/* =========================================================
   ROUTE DE SANTÉ
========================================================= */

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    app: "MangaZone",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/* =========================================================
   ROUTE RACINE
========================================================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* =========================================================
   INSCRIPTION
   POST /api/register
========================================================= */

app.post("/api/register", async (req, res) => {
  try {
    const username =
      typeof req.body.username === "string"
        ? req.body.username.trim()
        : "";

    const password =
      typeof req.body.password === "string"
        ? req.body.password
        : "";

    /* -----------------------------------------
       VALIDATION NOM
    ----------------------------------------- */

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Le nom d'utilisateur est requis."
      });
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({
        success: false,
        message:
          "Le nom d'utilisateur doit contenir entre 3 et 20 caractères."
      });
    }

    /*
      Autorise lettres, chiffres, espaces, _, -
    */
    if (!/^[a-zA-Z0-9À-ÿ _-]+$/.test(username)) {
      return res.status(400).json({
        success: false,
        message: "Le nom d'utilisateur contient des caractères invalides."
      });
    }

    /* -----------------------------------------
       VALIDATION MOT DE PASSE
    ----------------------------------------- */

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe est requis."
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Le mot de passe doit contenir au moins 6 caractères."
      });
    }

    if (password.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Le mot de passe est trop long."
      });
    }

    /* -----------------------------------------
       CHERCHE UTILISATEUR EXISTANT
    ----------------------------------------- */

    const users = getUsers();

    const usernameLower = username.toLowerCase();

    const existingUser = users.find(
      (user) =>
        typeof user.username === "string" &&
        user.username.toLowerCase() === usernameLower
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Ce nom d'utilisateur existe déjà."
      });
    }

    /* -----------------------------------------
       HASH DU MOT DE PASSE
    ----------------------------------------- */

    const passwordHash = await bcrypt.hash(password, 12);

    /* -----------------------------------------
       CRÉATION UTILISATEUR
    ----------------------------------------- */

    const user = {
      id: generateId(),
      username,
      passwordHash,
      favorites: [],
      continueWatching: [],
      createdAt: new Date().toISOString()
    };

    users.push(user);

    const saved = saveUsers(users);

    if (!saved) {
      return res.status(500).json({
        success: false,
        message: "Impossible de créer le compte."
      });
    }

    /* -----------------------------------------
       TOKEN
    ----------------------------------------- */

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: "Compte créé avec succès.",
      token,
      user: publicUser(user)
    });
  } catch (error) {
    console.error("❌ Erreur /api/register :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur."
    });
  }
});

/* =========================================================
   CONNEXION
   POST /api/login
========================================================= */

app.post("/api/login", async (req, res) => {
  try {
    const username =
      typeof req.body.username === "string"
        ? req.body.username.trim()
        : "";

    const password =
      typeof req.body.password === "string"
        ? req.body.password
        : "";

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Nom d'utilisateur et mot de passe requis."
      });
    }

    const users = getUsers();

    const usernameLower = username.toLowerCase();

    const user = users.find(
      (item) =>
        typeof item.username === "string" &&
        item.username.toLowerCase() === usernameLower
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Nom d'utilisateur ou mot de passe incorrect."
      });
    }

    const passwordCorrect = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Nom d'utilisateur ou mot de passe incorrect."
      });
    }

    const token = createToken(user);

    return res.json({
      success: true,
      message: "Connexion réussie.",
      token,
      user: publicUser(user)
    });
  } catch (error) {
    console.error("❌ Erreur /api/login :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur."
    });
  }
});

/* =========================================================
   PROFIL CONNECTÉ
   GET /api/me
========================================================= */

app.get("/api/me", auth, (req, res) => {
  try {
    const users = getUsers();

    const user = users.find(
      (item) => item.id === req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable."
      });
    }

    return res.json({
      success: true,
      user: publicUser(user)
    });
  } catch (error) {
    console.error("❌ Erreur /api/me :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur."
    });
  }
});

/* =========================================================
   FAVORIS
   GET /api/favorites
========================================================= */

app.get("/api/favorites", auth, (req, res) => {
  try {
    const users = getUsers();

    const user = users.find(
      (item) => item.id === req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable."
      });
    }

    const favorites = Array.isArray(user.favorites)
      ? user.favorites
      : [];

    return res.json({
      success: true,
      favorites
    });
  } catch (error) {
    console.error("❌ Erreur GET /api/favorites :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur."
    });
  }
});

/* =========================================================
   AJOUT FAVORI
   POST /api/favorites
========================================================= */

app.post("/api/favorites", auth, (req, res) => {
  try {
    const name =
      typeof req.body.name === "string"
        ? req.body.name.trim()
        : "";

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Nom de l'anime requis."
      });
    }

    if (name.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Nom de l'anime trop long."
      });
    }

    const users = getUsers();

    const userIndex = users.findIndex(
      (item) => item.id === req.user.id
    );

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable."
      });
    }

    if (!Array.isArray(users[userIndex].favorites)) {
      users[userIndex].favorites = [];
    }

    const alreadyExists =
      users[userIndex].favorites.some(
        (favorite) =>
          typeof favorite === "string" &&
          favorite.toLowerCase() === name.toLowerCase()
      );

    if (!alreadyExists) {
      users[userIndex].favorites.push(name);
    }

    const saved = saveUsers(users);

    if (!saved) {
      return res.status(500).json({
        success: false,
        message: "Impossible de sauvegarder le favori."
      });
    }

    return res.json({
      success: true,
      message: "Anime ajouté aux favoris.",
      favorites: users[userIndex].favorites
    });
  } catch (error) {
    console.error("❌ Erreur POST /api/favorites :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur."
    });
  }
});

/* =========================================================
   SUPPRIMER FAVORI
   DELETE /api/favorites/:name
========================================================= */

app.delete("/api/favorites/:name", auth, (req, res) => {
  try {
    const name = decodeURIComponent(req.params.name || "").trim();

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Nom de l'anime requis."
      });
    }

    const users = getUsers();

    const userIndex = users.findIndex(
      (item) => item.id === req.user.id
    );

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable."
      });
    }

    if (!Array.isArray(users[userIndex].favorites)) {
      users[userIndex].favorites = [];
    }

    users[userIndex].favorites =
      users[userIndex].favorites.filter(
        (favorite) =>
          typeof favorite !== "string" ||
          favorite.toLowerCase() !== name.toLowerCase()
      );

    const saved = saveUsers(users);

    if (!saved) {
      return res.status(500).json({
        success: false,
        message: "Impossible de supprimer le favori."
      });
    }

    return res.json({
      success: true,
      message: "Anime retiré des favoris.",
      favorites: users[userIndex].favorites
    });
  } catch (error) {
    console.error("❌ Erreur DELETE /api/favorites :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur."
    });
  }
});

/* =========================================================
   PROGRESSION
   GET /api/progress
========================================================= */

app.get("/api/progress", auth, (req, res) => {
  try {
    const users = getUsers();

    const user = users.find(
      (item) => item.id === req.user.id
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable."
      });
    }

    const continueWatching =
      Array.isArray(user.continueWatching)
        ? user.continueWatching
        : [];

    return res.json({
      success: true,
      continueWatching
    });
  } catch (error) {
    console.error("❌ Erreur GET /api/progress :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur."
    });
  }
});

/* =========================================================
   SAUVEGARDER PROGRESSION
   POST /api/progress
========================================================= */

app.post("/api/progress", auth, (req, res) => {
  try {
    const anime =
      typeof req.body.anime === "string"
        ? req.body.anime.trim()
        : "";

    const episode = Number(req.body.episode);
    const position = Number(req.body.position);
    const duration = Number(req.body.duration);

    /* -----------------------------------------
       VALIDATION
    ----------------------------------------- */

    if (!anime) {
      return res.status(400).json({
        success: false,
        message: "Nom de l'anime requis."
      });
    }

    if (anime.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Nom de l'anime trop long."
      });
    }

    if (!Number.isFinite(episode) || episode < 1) {
      return res.status(400).json({
        success: false,
        message: "Épisode invalide."
      });
    }

    if (!Number.isFinite(position) || position < 0) {
      return res.status(400).json({
        success: false,
        message: "Position invalide."
      });
    }

    if (!Number.isFinite(duration) || duration < 0) {
      return res.status(400).json({
        success: false,
        message: "Durée invalide."
      });
    }

    const users = getUsers();

    const userIndex = users.findIndex(
      (item) => item.id === req.user.id
    );

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable."
      });
    }

    if (!Array.isArray(users[userIndex].continueWatching)) {
      users[userIndex].continueWatching = [];
    }

    const progress = {
      anime,
      episode,
      position,
      duration,
      updatedAt: new Date().toISOString()
    };

    /*
      On cherche une progression existante pour le même anime.
    */
    const existingIndex =
      users[userIndex].continueWatching.findIndex(
        (item) =>
          item &&
          typeof item.anime === "string" &&
          item.anime.toLowerCase() === anime.toLowerCase()
      );

    if (existingIndex !== -1) {
      users[userIndex].continueWatching[existingIndex] =
        progress;
    } else {
      users[userIndex].continueWatching.push(progress);
    }

    /*
      Les plus récentes progressions sont placées en premier.
    */
    users[userIndex].continueWatching.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() -
        new Date(a.updatedAt).getTime()
    );

    /*
      On garde au maximum 50 éléments.
    */
    users[userIndex].continueWatching =
      users[userIndex].continueWatching.slice(0, 50);

    const saved = saveUsers(users);

    if (!saved) {
      return res.status(500).json({
        success: false,
        message: "Impossible de sauvegarder la progression."
      });
    }

    return res.json({
      success: true,
      message: "Progression sauvegardée.",
      continueWatching:
        users[userIndex].continueWatching
    });
  } catch (error) {
    console.error("❌ Erreur POST /api/progress :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur interne du serveur."
    });
  }
});

/* =========================================================
   GESTION DES ERREURS JSON
========================================================= */

app.use((err, req, res, next) => {
  console.error("❌ Erreur serveur :", err);

  if (err instanceof SyntaxError && err.status === 400) {
    return res.status(400).json({
      success: false,
      message: "JSON invalide."
    });
  }

  return res.status(500).json({
    success: false,
    message: "Erreur interne du serveur."
  });
});

/* =========================================================
   404 API
========================================================= */

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route API introuvable."
  });
});

/* =========================================================
   DÉMARRAGE DU SERVEUR
========================================================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log("==========================================");
  console.log("        MANGAZONE SERVER");
  console.log("==========================================");
  console.log(`🚀 Port : ${PORT}`);
  console.log(`📁 Données : ${DATA_DIR}`);
  console.log(`🌍 Environnement : ${process.env.NODE_ENV || "development"}`);
  console.log("✅ Serveur démarré avec succès");
  console.log("==========================================");
});
