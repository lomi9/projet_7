// Charge le module http de node pour créer un serveur http
const http = require("http");
// Prends le fichier app.js
const app = require("./app");

// Pour lire une valeur de port à partir de l'environnement, et convertit la valeur du port en nombre
const normalizePort = (val) => {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};

//Determine le port
const port = normalizePort(process.env.PORT || "4000");
app.set("port", port);

// Pour gérer erreur de port
const errorHandler = (error) => {
  if (error.syscall !== "listen") {
    throw error;
  }
  const address = server.address();
  const bind =
    typeof address === "string" ? "pipe " + address : "port: " + port;
  switch (error.code) {
    case "EACCES":
      console.error(bind + "problème d'accès");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " déjà utilisé");
      process.exit(1);
      break;
    default:
      throw error;
  }
};

// Créer un serveur http en utilisant l'application express
const server = http.createServer(app);

// Gérer les erreurs émises par le serveur
server.on("error", errorHandler);

// affiche sur quel port le serveur ecoute
server.on("listening", () => {
  const address = server.address();
  const bind = typeof address === "string" ? "pipe " + address : "port " + port;
  console.log("Listening on " + bind);
});

// demarrage du serveur
server.listen(port);
