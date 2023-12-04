// pour token dans fichier .env
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");

const booksRoutes = require("./routes/books");
const userRoutes = require("./routes/user");

// Connexion a MongoDB
mongoose
  .connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log(error));

// Créé une application Express
const app = express();

// Middleware pour analyser requêtes entrantes en JSON
app.use(express.json());

// Middleware pour les CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});

// Fichiers statiques via le préfixe /upload dans l'URL
app.use("/uploads", express.static("uploads"));

// Middleware de routage :définition des chemins d'accès pour l'API
app.use("/api/books", booksRoutes);
app.use("/api/auth", userRoutes);

// Rendre l'application disponible
module.exports = app;
