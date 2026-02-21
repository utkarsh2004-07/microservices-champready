const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const { PORT = 3001, MONGO_URI, JWT_SECRET = 'secret' } = process.env;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'student'], default: 'student' },
    exam: { type: String, enum: ['JEE', 'NEET', 'UPSC', null], default: null }
  },
  { timestamps: true }
);

const User = mongoose.model('AuthUser', userSchema);

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Missing token' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (_err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role = 'student', exam = null } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role, exam });

    return res.status(201).json({ id: user._id, email: user.email, role: user.role, exam: user.exam });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { sub: user._id.toString(), role: user.role, exam: user.exam, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

app.get('/auth/me', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.sub).select('-passwordHash');
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(user);
});

async function start() {
  await mongoose.connect(MONGO_URI);
  app.listen(PORT, () => {
    console.log(`auth-service running on ${PORT}`);
  });
}

start().catch((err) => {
  console.error('auth-service bootstrap failed', err);
  process.exit(1);
});
