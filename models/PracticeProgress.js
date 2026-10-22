const mongoose = require("mongoose");

const aptitudeAttemptSchema = new mongoose.Schema(
  {
    topic: { type: String, required: true, maxlength: 100 },
    score: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

const practiceProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    aptitudeAttempts: { type: [aptitudeAttemptSchema], default: [] },
    completedAptitudeQuestions: { type: [String], default: [] },
    completedAptitudeAnswers: { type: mongoose.Schema.Types.Mixed, default: {} },
    aptitudeSession: { type: mongoose.Schema.Types.Mixed, default: null },
    codingSolved: { type: [String], default: [] },
    codingDrafts: { type: mongoose.Schema.Types.Mixed, default: {} },
    codingSession: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PracticeProgress", practiceProgressSchema);