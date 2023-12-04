const Book = require("../models/Books");
const fs = require("fs");
const sharp = require("sharp");

// Créer un nouveau livre
exports.createBook = async (req, res, next) => {
  // S'assurer que le dossier uploads existe, sinon il est créé
  const uploadPath = "./uploads";
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
  }

  // Changer le nom de l'image et le format avec sharp
  const { buffer, originalname } = req.file;
  const timestamp = new Date().toISOString();
  const ref = `${timestamp}-${originalname}.webp`;

  // Compresser l'image avec Sharp
  await sharp(buffer).webp({ quality: 20 }).toFile(`${uploadPath}/${ref}`);

  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${ref}`;

  const bookObject = req.body.book ? JSON.parse(req.body.book) : {};
  delete bookObject._id; // supprime champs inutiles ou sensibles
  delete bookObject._userId; // supprime champs inutiles ou sensibles

  // Créer un nouveau livre
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: imageUrl,
  });

  try {
    // Sauvegarder le livre dans la base de données
    const savedBook = await book.save();

    // Envoyer la réponse avec le message et l'objet du livre sauvegardé
    res.status(201).json({
      message: "Votre livre a bien été enregistré !",
      book: savedBook, // Envoi de l'objet livre complet, y compris l'ID
    });
  } catch (error) {
    // Gestion des erreurs en cas d'échec de la sauvegarde
    res.status(400).json({ error });
  }
};

// Modifier un livre existant
exports.modifyBook = async (req, res, next) => {
  let bookObject = {}; // initialise un objet vide

  // si la requête contient un fichier (si l(utilisateur à téléversé un fichier)
  if (req.file) {
    // S'assurer que le dossier uploads existe, sinon il est créé
    const uploadPath = "./uploads";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }

    // récupère le fichier
    const file = req.file;
    //modifie le nom et format du fichier
    const timestamp = new Date().toISOString();
    const ref = `${timestamp}-${file.originalname}.webp`;

    // Compresser l'image avec Sharp
    await sharp(file.buffer)
      .webp({ quality: 20 })
      .toFile(`${uploadPath}/${ref}`);

    //met a jour l'image
    bookObject = {
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get("host")}/uploads/${ref}`,
    };
  } else {
    // si pas d'image : on recupère les autres données et on les garde telles quelles
    bookObject = { ...req.body };
  }

  delete bookObject._userId;

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      // Vérifie que l'utilisateur qui fait la requête est bien le propriétaire du livre
      if (book.userId != req.auth.userId) {
        const error = new Error("Non-autorisé");
        res.status(401).json({ error });
      } else {
        // Si il y avait une ancienne image, elle est supprimée
        if (req.file) {
          // Extraction du nom de fichier depuis l'url de l'image
          const filename = book.imageUrl.split("/uploads/")[1];
          fs.unlink(`uploads/${filename}`, (err) => {
            // le callback reçoit "err" pour gérer les erreurs lors de la suppression, convention standart en node.js pour les erreurs dans callbacks
            if (err) console.log(err);
          });
        }

        // Mise à jour du livre avec les nouvelles données
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Livre modifié !" }))
          .catch((error) => res.status(400).json({ error }));
      }
    })
    .catch((error) => res.status(500).json({ error }));
};

// Supprimer livre
exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id }) // trouve le livre par son id
    .then((book) => {
      // Vérifie que l'utilisateur est autorisé (créateur du livre)
      if (book.userId != req.auth.userId) {
        const error = new Error("Non-autorisé");
        res.status(401).json({ error });
      } else {
        // trouve l'image associée au livre
        const filename = book.imageUrl.split("/images/")[1];
        // supprime l'image associée au livre
        fs.unlink(`images/${filename}`, () => {
          // supprime le livre
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" });
            })
            .catch((error) => res.status(500).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

// Récupère un seul livre par son id et le renvoie dans la réponse
exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

// Récupère tous les livres
exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

// Noter le livre
exports.rateBook = (req, res) => {
  // Vérifie si un utilisateur est connecté
  if (!req.auth || !req.auth.userId) {
    const error = new Error("Authentication required.");
    return res.status(401).json({ error: error.message });
  }
  Book.findByIdAndUpdate({ _id: req.params.id }) // trouve le livre par son ID
    .then((book) => {
      if (!book) {
        // Si le livre n'est pas trouvé
        const error = new Error("Livre non trouvé!");
        return res.status(404).json({ error: error.message });
      }

      // Vérifie si l'utilisateur a déjà noté ce livre
      const existingRating = book.ratings.find(
        (rating) => rating.userId === req.auth.userId
      );
      if (existingRating) {
        const error = new Error("Vous avez déjà noté ce livre!");
        return res.status(400).json({ error: error.message });
      }

      // Vérifie la validité de la note
      const userRating = req.body.rating;
      if (userRating < 0 || userRating > 5) {
        const error = new Error(
          "Note invalide. Elle doit être comprise entre 0 et 5."
        );
        return res.status(400).json({ error: error.message });
      }

      // Ajouter la note de l'utilisateur à la liste des notations
      book.ratings.push({
        userId: req.auth.userId,
        grade: userRating,
      });

      // Mise à jour de la note moyenne du livre
      const totalRatings = book.ratings.reduce(
        (acc, rating) => acc + rating.grade,
        0
      );
      book.averageRating = totalRatings / book.ratings.length;

      // Sauvegarde du livre mis à jour
      return book.save();
    })
    .then((updatedBook) => res.status(200).json(updatedBook))
    .catch((error) => res.status(500).json({ error }));
};

exports.bestRating = (req, res, next) => {
  Book.aggregate([
    // séléctionne que les livres qui ont une note
    {
      $match: { "ratings.0": { $exists: true } },
    },
    // ajoute le champs 'averageRating' à chaque livre qui a une note, puis fait la moyenne de la note de chaque livre
    {
      $addFields: {
        averageRating: { $avg: "$ratings.grade" },
      },
    },
    // trie les livres en ordre décroissant de averageRating
    {
      $sort: { averageRating: -1 },
    },
    // limite les résultats à 3, prends donc les 3 avec la moyenne la plus haute
    {
      $limit: 3,
    },
  ])
    .then((books) => {
      // Vérifie que chaque livre a un ID
      const booksWithId = books.filter((book) => book._id);

      // map :  transforme chaque livre en un nouvel objet
      const formattedBooks = booksWithId.map((book) => ({
        _id: book._id.toString(), // Convertir l'ObjectId en chaîne de caractères
        title: book.title,
        author: book.author,
        averageRating: book.averageRating,
        imageUrl: book.imageUrl,
        year: book.year,
        genre: book.genre,
      }));

      // gestion en cas d'anomalies liées à l'id
      const undefinedBooks = formattedBooks.filter((book) => !book._id);
      if (undefinedBooks.length > 0) {
        console.log("Livres avec identifiants incorrects", undefinedBooks);
      }

      // Vérifier s'il y a des doublons dans les 'id'
      const uniqueIds = new Set(formattedBooks.map((book) => book._id));
      if (uniqueIds.size !== formattedBooks.length) {
        console.log("Doublons ID :", formattedBooks);
      }

      // Envoyer les nouveaux livres
      res.status(200).json(formattedBooks);
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};
