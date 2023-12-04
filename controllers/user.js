const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

//Fonction pour enregistrer un nouvel utilisateur
exports.signup = (req, res, next) => {
  // Utilise bcrypt pour hacher le mot de passe fourni, en le sécurisant avec 10 tours de salage.
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      // Crée un nouvel utilisateur avec l'email fourni et le mot de passe haché.
      const user = new User({
        email: req.body.email,
        password: hash,
      });
      // Enregistre l'utilisateur dans la base de données.
      user
        .save()
        .then(() => res.status(201).json({ message: "Utilisateur créé !" }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

// Fonction login pour connecter un utilisateur existant
exports.login = (req, res, next) => {
  // Cherche un utilisateur dans la base de données par email.
  User.findOne({ email: req.body.email })
    .then((user) => {
      // Si utilisateur inconnu
      if (user === null) {
        const error = new Error("Paire identifiant/ mot de passe incorrecte");
        res.status(401).json({ error: error.message });
      }
      // Si utilisateur connu : vérification du mot de passe avec bcrypt
      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            const error = new Error(
              "Paire identifiant/mot de passe incorrecte"
            );
            return res.status(401).json({ error: error.message });
          }
          res.status(200).json({
            userId: user._id,
            token: jwt.sign({ userId: user._id }, "RANDOM_TOKEN_SECRET", {
              expiresIn: "24h",
            }),
          });
        })
        .catch((error) => {
          res.status(500).json({ error });
        });
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};
