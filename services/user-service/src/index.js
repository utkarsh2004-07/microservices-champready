const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const { PORT = 3002, JWT_SECRET = 'secret', MONGO_URI } = process.env;

const profileSchema = new mongoose.Schema(
  {
    authUserId: { type: String, required: true, unique: true },
    name: String,
    email: String,
    exam: { type: String, enum: ['JEE', 'NEET', 'UPSC', null], default: null },
    qualification: String,
    eligibilityVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const UserProfile = mongoose.model('UserProfile', profileSchema);

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

app.get('/users/me', auth, async (req, res) => {
  const profile = await UserProfile.findOneAndUpdate(
    { authUserId: req.user.sub },
    {
      $setOnInsert: {
        authUserId: req.user.sub,
        email: req.user.email,
        exam: req.user.exam || null,
        name: req.user.email?.split('@')[0] || 'Student'
      }
    },
    { new: true, upsert: true }
  );

  return res.json(profile);
});

app.put('/users/update-exam', auth, async (req, res) => {
  const { exam } = req.body;
  if (!['JEE', 'NEET', 'UPSC'].includes(exam)) {
    return res.status(400).json({ message: 'Invalid exam' });
  }

  const profile = await UserProfile.findOneAndUpdate(
    { authUserId: req.user.sub },
    { $set: { exam, email: req.user.email } },
    { new: true, upsert: true }
  );

  return res.json(profile);
});

async function start() {
  await mongoose.connect(MONGO_URI);
  app.listen(PORT, () => console.log(`user-service running on ${PORT}`));
}

start().catch((err) => {
  console.error('user-service bootstrap failed', err);
  process.exit(1);
});
