const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    // Extrait le token
    const token = req.headers.authorization.split(" ")[1];
    // Décode le token
    const decodedToken = jwt.verify(token, "RANDOM_TOKEN_SECRET");
    // Extrait l'ID de l'utilisateur
    const userId = decodedToken.userId;
    // Rends l'id de l'utilisateur pour les middlewares ou routes de l'application
    req.auth = {
      userId: userId,
    };
    // Passe au middleware suivant
    next();
  } catch (error) {
    res.status(401).json({ error });
  }
};
