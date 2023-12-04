const express = require("express");
const auth = require("../middleware/auth");
const router = express.Router();
const multer = require("../middleware/multer-config");

const bookCtrl = require("../controllers/books");

router.get("/", bookCtrl.getAllBooks);
router.post("/", auth, multer.single("image"), bookCtrl.createBook);
router.get("/bestrating", bookCtrl.bestRating);
router.get("/:id", bookCtrl.getOneBook);
router.post("/:id/rating", auth, bookCtrl.rateBook);
router.put("/:id", auth, multer.single("image"), bookCtrl.modifyBook);
router.delete("/:id", auth, bookCtrl.deleteBook);

module.exports = router;
