const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const { PORT = 3004, JWT_SECRET = 'secret', MONGO_URI } = process.env;

const resultSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    mockTestId: { type: String, required: true, index: true },
    examType: { type: String, enum: ['JEE', 'NEET', 'UPSC'], required: true },
    score: { type: Number, required: true },
    timeTaken: Number,
    accuracy: Number
  },
  { timestamps: true }
);

resultSchema.index({ userId: 1, mockTestId: 1 }, { unique: true });

const Result = mongoose.model('Result', resultSchema);

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (_err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

app.post('/results/internal', async (req, res) => {
  const { userId, mockTestId, examType, score, timeTaken, accuracy } = req.body;
  const result = await Result.findOneAndUpdate(
    { userId, mockTestId },
    { userId, mockTestId, examType, score, timeTaken, accuracy },
    { upsert: true, new: true }
  );
  return res.status(201).json(result);
});

app.get('/results/me', auth, async (req, res) => {
  const results = await Result.find({ userId: req.user.sub }).sort({ createdAt: -1 });
  return res.json(results);
});

app.get('/results/progress/overview', auth, async (req, res) => {
  const results = await Result.find({ userId: req.user.sub }).sort({ createdAt: -1 });
  if (!results.length) return res.json({ attempts: 0, avgScore: 0, avgAccuracy: 0, strengths: [], weakAreas: [] });

  const avgScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
  const avgAccuracy = Math.round(results.reduce((sum, r) => sum + (r.accuracy || 0), 0) / results.length);

  const strengths = [];
  const weakAreas = [];
  if (avgAccuracy >= 75) strengths.push('High overall accuracy'); else weakAreas.push('Need higher accuracy in concept revision');
  if (avgScore >= 120) strengths.push('Strong scoring pace'); else weakAreas.push('Improve speed + precision in mock attempts');

  return res.json({ attempts: results.length, avgScore, avgAccuracy, strengths, weakAreas });
});

app.get('/results/:mockTestId/rank', auth, async (req, res) => {
  const list = await Result.find({ mockTestId: req.params.mockTestId }).sort({ score: -1, timeTaken: 1 });
  const rank = list.findIndex((item) => item.userId === req.user.sub) + 1;
  return res.json({ totalParticipants: list.length, rank: rank || null });
});

async function start() {
  await mongoose.connect(MONGO_URI);
  app.listen(PORT, () => console.log(`result-service running on ${PORT}`));
}

start().catch((err) => {
  console.error('result-service bootstrap failed', err);
  process.exit(1);
});
