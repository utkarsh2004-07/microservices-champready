const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const { PORT = 3003, JWT_SECRET = 'secret', MONGO_URI, RESULT_SERVICE_URL = 'http://localhost:3004' } = process.env;

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  marks: { type: Number, default: 4 },
  negativeMarks: { type: Number, default: 1 },
  topic: String
});

const mockTestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    examType: { type: String, enum: ['JEE', 'NEET', 'UPSC'], required: true },
    duration: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    isPublished: { type: Boolean, default: false },
    createdBy: { type: String, required: true },
    questions: [questionSchema]
  },
  { timestamps: true }
);

const MockTest = mongoose.model('MockTest', mockTestSchema);

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

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  return next();
}

app.post('/admin/mock-tests', auth, requireAdmin, async (req, res) => {
  const { title, examType, duration, totalMarks, questions = [] } = req.body;
  const mock = await MockTest.create({
    title,
    examType,
    duration,
    totalMarks,
    questions,
    createdBy: req.user.sub
  });
  return res.status(201).json(mock);
});

app.post('/admin/mock-tests/:id/publish', auth, requireAdmin, async (req, res) => {
  const mock = await MockTest.findByIdAndUpdate(req.params.id, { isPublished: true }, { new: true });
  if (!mock) return res.status(404).json({ message: 'Mock test not found' });
  return res.json({ message: 'Published', mockTest: mock });
});

app.get('/mock-tests', auth, async (req, res) => {
  const exam = req.query.exam || req.user.exam;
  const data = await MockTest.find({ examType: exam, isPublished: true }).select('-questions.correctAnswer');
  return res.json(data);
});

app.get('/mock-tests/:id', auth, async (req, res) => {
  const mock = await MockTest.findById(req.params.id).select('-questions.correctAnswer');
  if (!mock || !mock.isPublished) return res.status(404).json({ message: 'Mock test not found' });
  if (req.user.role === 'student' && mock.examType !== req.user.exam) {
    return res.status(403).json({ message: 'Not allowed for this exam type' });
  }
  return res.json(mock);
});

app.post('/mock-tests/:id/submit', auth, async (req, res) => {
  const { answers = [], timeTaken = 0 } = req.body;
  const mock = await MockTest.findById(req.params.id);
  if (!mock || !mock.isPublished) return res.status(404).json({ message: 'Mock test not found' });

  let score = 0;
  let correct = 0;
  mock.questions.forEach((q, idx) => {
    if (answers[idx] === q.correctAnswer) {
      score += q.marks;
      correct += 1;
    } else if (answers[idx]) {
      score -= q.negativeMarks;
    }
  });

  const accuracy = mock.questions.length ? Math.round((correct / mock.questions.length) * 100) : 0;

  await axios.post(`${RESULT_SERVICE_URL}/results/internal`, {
    userId: req.user.sub,
    mockTestId: mock._id,
    examType: mock.examType,
    score,
    timeTaken,
    accuracy
  });

  return res.json({ score, accuracy, totalQuestions: mock.questions.length });
});

async function start() {
  await mongoose.connect(MONGO_URI);
  app.listen(PORT, () => console.log(`mocktest-service running on ${PORT}`));
}

start().catch((err) => {
  console.error('mocktest-service bootstrap failed', err);
  process.exit(1);
});
