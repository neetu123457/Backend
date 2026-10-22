const PracticeProgress = require("../models/PracticeProgress");

const APTITUDE_TASK_COUNTS = {
  "Percentages": 2,
  "Profit and Loss": 2,
  "Time and Work": 2,
  "Speed and Distance": 2,
  "Number Series": 2,
  "Logical Reasoning": 2,
  "Probability": 1,
  "Averages": 1,
  "Ratios": 1,
};
const APTITUDE_QUESTIONS = {
  "percent-20-of-250": "Percentages",
  "percent-increase-80-to-100": "Percentages",
  "profit-percentage-500-to-600": "Profit and Loss",
  "loss-percentage-800-to-720": "Profit and Loss",
  "one-day-work-10-days": "Time and Work",
  "combined-work-6-and-3-days": "Time and Work",
  "average-speed-150km-3hours": "Speed and Distance",
  "distance-60kmh-2-5hours": "Speed and Distance",
  "number-series-2-6-12-20-30": "Number Series",
  "number-series-3-9-27-81": "Number Series",
  "roses-flowers-plants": "Logical Reasoning",
  "code-cat-to-dog": "Logical Reasoning",
  "probability-even-die-roll": "Probability",
  "average-10-20-30-40-50": "Averages",
  "ratio-boys-girls-25": "Ratios",
};
const ALL_APTITUDE_QUESTION_IDS = Object.keys(APTITUDE_QUESTIONS);
const TOTAL_APTITUDE_TASKS = Object.values(APTITUDE_TASK_COUNTS)
  .reduce((total, count) => total + count, 0);
const CODING_TASKS = [
  "Reverse a String",
  "Palindrome Number",
  "Two Sum",
  "FizzBuzz",
  "Second Largest Element",
  "Count Vowels",
  "Valid Anagram",
  "Binary Search",
  "First Non-Repeating Character",
  "Move Zeroes",
];
const CODING_LANGUAGES = ["JavaScript", "Python", "Java", "C++"];
const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const isValidAptitudeSession = (session) =>
  isPlainObject(session) &&
  typeof session.topic === "string" &&
  (session.topic === "All Topics" || Object.hasOwn(APTITUDE_TASK_COUNTS, session.topic)) &&
  Array.isArray(session.questionIds) &&
  session.questionIds.length <= ALL_APTITUDE_QUESTION_IDS.length &&
  session.questionIds.every(
    (id) => typeof id === "string" && Object.hasOwn(APTITUDE_QUESTIONS, id)
  ) &&
  new Set(session.questionIds).size === session.questionIds.length &&
  (session.currentQuestionId === null ||
    (typeof session.currentQuestionId === "string" &&
      session.questionIds.includes(session.currentQuestionId))) &&
  isPlainObject(session.answers) &&
  Object.keys(session.answers).length <= ALL_APTITUDE_QUESTION_IDS.length &&
  Object.entries(session.answers).every(
    ([id, option]) =>
      session.questionIds.includes(id) &&
      Number.isInteger(option) &&
      option >= 0 &&
      option <= 3
  );

exports.getProgress = async (req, res) => {
  try {
    const progress = await PracticeProgress.findOne({ userId: req.userId }).lean();
    const aptitudeAttempts = progress?.aptitudeAttempts || [];
    const completedQuestionIds = new Set(
      progress?.completedAptitudeQuestions || []
    );
    const codingSolved = progress?.codingSolved || [];
    const topicResults = new Map();

    for (const attempt of aptitudeAttempts) {
      if (attempt.topic === "All Topics" && attempt.total >= TOTAL_APTITUDE_TASKS) {
        ALL_APTITUDE_QUESTION_IDS.forEach((id) => completedQuestionIds.add(id));
      } else if (
        APTITUDE_TASK_COUNTS[attempt.topic] &&
        attempt.total >= APTITUDE_TASK_COUNTS[attempt.topic]
      ) {
        Object.entries(APTITUDE_QUESTIONS)
          .filter(([, topic]) => topic === attempt.topic)
          .forEach(([id]) => completedQuestionIds.add(id));
      }

      const result = topicResults.get(attempt.topic) || {
        topic: attempt.topic,
        attempts: 0,
        totalScorePercent: 0,
        latestAt: null,
      };
      const scorePercent = Math.round((attempt.score / attempt.total) * 100);
      const attemptDate = attempt.createdAt || null;

      result.attempts += 1;
      result.totalScorePercent += scorePercent;
      if (!result.latestAt || (attemptDate && attemptDate > result.latestAt)) {
        result.latestAt = attemptDate;
        result.latestScorePercent = scorePercent;
      }
      topicResults.set(attempt.topic, result);
    }

    const completedAptitudeTasks = ALL_APTITUDE_QUESTION_IDS
      .filter((id) => completedQuestionIds.has(id)).length;
    const completedCodingProblems = CODING_TASKS.filter((problem) =>
      codingSolved.includes(problem)
    );

    return res.json({
      aptitudeAttempts,
      completedAptitudeQuestionIds: Array.from(completedQuestionIds),
      completedAptitudeAnswers: progress?.completedAptitudeAnswers || {},
      aptitudeSession: progress?.aptitudeSession || null,
      codingSolved,
      codingDrafts: progress?.codingDrafts || {},
      codingSession: progress?.codingSession || null,
      completedSummary: {
        aptitude: {
          completedAttempts: aptitudeAttempts.length,
          completedTasks: completedAptitudeTasks,
          totalTasks: TOTAL_APTITUDE_TASKS,
          completionPercent: Math.round(
            (completedAptitudeTasks / TOTAL_APTITUDE_TASKS) * 100
          ),
          topics: Array.from(topicResults.values(), (result) => ({
            topic: result.topic,
            completedAttempts: result.attempts,
            averageScorePercent: Math.round(
              result.totalScorePercent / result.attempts
            ),
            latestScorePercent: result.latestScorePercent,
          })),
        },
        coding: {
          completedProblems: completedCodingProblems.length,
          totalProblems: CODING_TASKS.length,
          completionPercent: Math.round(
            (completedCodingProblems.length / CODING_TASKS.length) * 100
          ),
          problems: completedCodingProblems,
        },
      },
    });
  } catch (error) {
    console.error("Practice progress error:", error.message);
    return res.status(500).json({ message: "Unable to load practice progress." });
  }
};

exports.completeAptitudeQuestion = async (req, res) => {
  const { questionId, selectedOption, session } = req.body;
  if (
    typeof questionId !== "string" ||
    !Object.hasOwn(APTITUDE_QUESTIONS, questionId) ||
    !Number.isInteger(selectedOption) ||
    selectedOption < 0 ||
    selectedOption > 3 ||
    !isValidAptitudeSession(session) ||
    session.currentQuestionId !== questionId ||
    session.answers[questionId] !== selectedOption
  ) {
    return res.status(400).json({ message: "A valid aptitude question and answer are required." });
  }

  try {
    await PracticeProgress.findOneAndUpdate(
      { userId: req.userId },
      {
        $addToSet: { completedAptitudeQuestions: questionId },
        $set: {
          [`completedAptitudeAnswers.${questionId}`]: selectedOption,
          aptitudeSession: session,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.status(200).json({ questionId, selectedOption, completed: true });
  } catch (error) {
    console.error("Save completed aptitude question error:", error.message);
    return res.status(500).json({ message: "Unable to save this completed question." });
  }
};

exports.saveAptitudeSession = async (req, res) => {
  const { session } = req.body;
  if (session === null) {
    try {
      await PracticeProgress.findOneAndUpdate(
        { userId: req.userId },
        { $set: { aptitudeSession: null } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.json({ message: "Aptitude session cleared." });
    } catch (error) {
      console.error("Clear aptitude session error:", error.message);
      return res.status(500).json({ message: "Unable to clear the aptitude session." });
    }
  }

  if (!isValidAptitudeSession(session)) {
    return res.status(400).json({ message: "A valid aptitude session is required." });
  }

  try {
    await PracticeProgress.findOneAndUpdate(
      { userId: req.userId },
      {
        $set: {
          aptitudeSession: {
            topic: session.topic,
            questionIds: session.questionIds,
            currentQuestionId: session.currentQuestionId,
            answers: session.answers,
          },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({ message: "Aptitude session saved." });
  } catch (error) {
    console.error("Save aptitude session error:", error.message);
    return res.status(500).json({ message: "Unable to save the aptitude session." });
  }
};

exports.saveAptitudeAttempt = async (req, res) => {
  const { topic, score, total } = req.body;
  if (
    typeof topic !== "string" ||
    !topic.trim() ||
    topic.length > 100 ||
    !Number.isInteger(score) ||
    !Number.isInteger(total) ||
    total < 1 ||
    total > 100 ||
    score < 0 ||
    score > total
  ) {
    return res.status(400).json({ message: "A valid topic, score, and question total are required." });
  }

  try {
    const progress = await PracticeProgress.findOneAndUpdate(
      { userId: req.userId },
      { $push: { aptitudeAttempts: { topic: topic.trim(), score, total } } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.status(201).json({ attempt: progress.aptitudeAttempts.at(-1) });
  } catch (error) {
    console.error("Save aptitude attempt error:", error.message);
    return res.status(500).json({ message: "Unable to save this aptitude result." });
  }
};

exports.saveCodingProgress = async (req, res) => {
  const { solvedProblemIds, drafts, currentProblem, language } = req.body;
  if (
    !Array.isArray(solvedProblemIds) ||
    solvedProblemIds.length > 500 ||
    solvedProblemIds.some((id) => typeof id !== "string" || id.length > 100) ||
    !drafts ||
    typeof drafts !== "object" ||
    Array.isArray(drafts) ||
    Object.keys(drafts).length > 200 ||
    Object.entries(drafts).some(([key, value]) => key.length > 120 || typeof value !== "string" || value.length > 50000) ||
    (currentProblem !== undefined && !CODING_TASKS.includes(currentProblem)) ||
    (language !== undefined && !CODING_LANGUAGES.includes(language))
  ) {
    return res.status(400).json({ message: "Coding progress is invalid or too large." });
  }

  try {
    const update = {
      codingSolved: [...new Set(solvedProblemIds)],
      codingDrafts: drafts,
    };
    if (currentProblem !== undefined || language !== undefined) {
      update.codingSession = {
        currentProblem: currentProblem || CODING_TASKS[0],
        language: language || CODING_LANGUAGES[0],
      };
    }

    await PracticeProgress.findOneAndUpdate(
      { userId: req.userId },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({ message: "Coding progress saved." });
  } catch (error) {
    console.error("Save coding progress error:", error.message);
    return res.status(500).json({ message: "Unable to save coding progress." });
  }
};