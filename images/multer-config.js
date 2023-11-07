// Importation du package multer
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
/*

//Objet pour définir les correspondances entre les types MIME des fichiers entrants et leurs extensions de fichier.
const MIME_TYPES = {
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/png": "png",
};

// Configuration du stockage en utilisant la fonction diskStorage de multer.
const storage = multer.diskStorage({
  // Définition de la destination des fichiers uploadés.
  destination: (req, file, callback) => {
    // Le premier argument null indique qu'il n'y a pas d'erreur, et 'images' est le nom du dossier de destination.
    callback(null, "images");
  },
  // Définition du nom de fichier à utiliser pour le fichier uploadé.
  filename: (req, file, callback) => {
    // Génération du nouveau nom sans espaces et ajout d'un timestamp (horodatage) pour rendre le nom unique.
    const name = file.originalname.split(" ").join("_");
    // Récupération de l'extension appropriée pour le fichier basé sur son type MIME.
    const extension = MIME_TYPES[file.mimetype];
    // Appel de la fonction callback avec un nouveau nom de fichier composé du nom, d'un timestamp et de l'extension.
    callback(null, name + Date.now() + "." + extension);
  },
});

// Exportation du middleware configuré, avec un seul fichier image
module.exports = multer({ storage }).single("image");

*/
