const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const { PORT = 3005, JWT_SECRET = 'secret', MONGO_URI } = process.env;

const contentSchema = new mongoose.Schema(
  {
    examType: { type: String, enum: ['JEE', 'NEET', 'UPSC'], required: true, index: true },
    title: { type: String, required: true },
    kind: { type: String, enum: ['notes', 'syllabus', 'pyq', 'youtube', 'notification'], required: true },
    url: String,
    body: String,
    isPremium: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Content = mongoose.model('Content', contentSchema);

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

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  return next();
}

app.post('/admin/content', auth, adminOnly, async (req, res) => {
  const created = await Content.create(req.body);
  return res.status(201).json(created);
});

app.get('/content', auth, async (req, res) => {
  const exam = req.query.exam || req.user.exam;
  const kind = req.query.kind;
  const query = { examType: exam };
  if (kind) query.kind = kind;
  if (req.user.role !== 'admin') query.isPremium = { $in: [false, req.user.isPremium === true] };

  const items = await Content.find(query).sort({ createdAt: -1 });
  return res.json(items);
});

async function start() {
  await mongoose.connect(MONGO_URI);
  app.listen(PORT, () => console.log(`content-service running on ${PORT}`));
}

start().catch((err) => {
  console.error('content-service bootstrap failed', err);
  process.exit(1);
});
