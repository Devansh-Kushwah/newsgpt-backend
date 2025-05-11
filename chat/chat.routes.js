const express = require("express");
const router = express.Router();
const { chat } = require("./controller/chat.controller");
const { chatHistory } = require("./controller/chat.controller");
const { chatSessions } = require("./controller/chat.controller");

router.post("/", chat);
router.post("/history", chatHistory);
router.get("/sessions", chatSessions);

module.exports = router;
