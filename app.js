// app.js
const express = require("express");
const cors = require("cors");

const ingestRoutes = require("./ingestion/ingest.routes");
const chatRoutes = require("./chat/chat.routes");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/ingest", ingestRoutes);
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to Verifast RAG Backend!");
});

module.exports = app;
