const express = require('express');
const cors = require('cors');
const proxy = require('express-http-proxy');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const {
  PORT = 8080,
  JWT_SECRET = 'secret',
  AUTH_SERVICE_URL,
  USER_SERVICE_URL,
  MOCKTEST_SERVICE_URL,
  RESULT_SERVICE_URL,
  CONTENT_SERVICE_URL
} = process.env;

function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (_err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

app.use('/auth', proxy(AUTH_SERVICE_URL));
app.use('/users', authenticate, proxy(USER_SERVICE_URL));
app.use('/admin', authenticate, proxy(MOCKTEST_SERVICE_URL));
app.use('/mock-tests', authenticate, proxy(MOCKTEST_SERVICE_URL));
app.use('/results', authenticate, proxy(RESULT_SERVICE_URL));
app.use('/content', authenticate, proxy(CONTENT_SERVICE_URL));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

app.listen(PORT, () => {
  console.log(`api-gateway running on ${PORT}`);
});
