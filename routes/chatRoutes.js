
const express = require("express");
const router = express.Router();

const {
  chat,
  getHistory,
} = require("../controllers/chatContoller");
const requireAuth = require("../middleware/requireAuth");

router.use(requireAuth);
router.post("/", chat);
router.get("/history/:conversationId", getHistory);

module.exports = router;
