const express = require("express");
const {
  getProgress,
  completeAptitudeQuestion,
  saveAptitudeSession,
  saveAptitudeAttempt,
  saveCodingProgress,
} = require("../controllers/practiceController");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.use(requireAuth);
router.get("/progress", getProgress);
router.post("/aptitude/completed", completeAptitudeQuestion);
router.put("/aptitude/session", saveAptitudeSession);
router.post("/aptitude/attempts", saveAptitudeAttempt);
router.put("/coding", saveCodingProgress);

module.exports = router;