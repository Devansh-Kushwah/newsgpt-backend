const express = require("express");
const router = express.Router();
const {
  ingestArticles,
  searchArticles,
} = require("./controller/ingest.controller");

router.post("/", ingestArticles);

module.exports = router;
