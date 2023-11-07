const Book = require("../models/Books");
const fs = require("fs");

exports.createBook = (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });

  book
    .save()
    .then(() => {
      res.status(201).json({ message: "Livre enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete bookObject._userId;
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Non-autorisé" });
      } else {
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Objet modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Non-autorisé" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Book.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
};

exports.rateBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Livre non trouvé!" });
      }

      // Vérifie si l'utilisateur a déjà noté ce livre
      const existingRating = book.ratings.find(
        (rating) => rating.userId === req.auth.userId
      );
      if (existingRating) {
        return res
          .status(400)
          .json({ message: "Vous avez déjà noté ce livre!" });
      }

      // Vérifie la validité de la note
      const userRating = req.body.rating;
      if (userRating < 0 || userRating > 5) {
        return res.status(400).json({
          message: "Note invalide. Elle doit être comprise entre 0 et 5.",
        });
      }

      // Ajouter la note de l'utilisateur à la liste des notations
      book.ratings.push({
        userId: req.auth.userId,
        grade: userRating,
      });

      // Mise à jour de la note moyenne du livre
      const totalRatings = book.ratings.reduce(
        (acc, curr) => acc + curr.grade,
        0
      );
      book.averageRating = totalRatings / book.ratings.length;

      // Sauvegarde du livre mis à jour
      return book.save();
    })
    .then((updatedBook) => res.status(200).json(updatedBook))
    .catch((error) => res.status(500).json({ error }));
};
