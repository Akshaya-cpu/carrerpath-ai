import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from './prisma';
import type { User } from '@prisma/client';
import nodemailer from 'nodemailer';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

interface StoredUser {
  id: string;
  email: string;
  name?: string;
  password?: string;
  verified: boolean;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

type UserRecord = StoredUser | User;

const DEMO_USER_EMAIL = 'sunkaraakshaya11@gmail.com';
const DEMO_USER_PASSWORD = 'password123';
const DEMO_USER_NAME = 'Sunkara Akshaya';

const inMemoryUsers = new Map<string, StoredUser>();
let prismaConnected = true;

async function initializePrismaConnection() {
  try {
    await prisma.$connect();
    prismaConnected = true;
    console.log('[auth] Prisma connected successfully');
  } catch (err: any) {
    prismaConnected = false;
    console.warn('[auth] Prisma unavailable, using in-memory auth fallback:', err?.message || err);
  }
}

async function seedDemoUser() {
  const hashedPassword = await bcrypt.hash(DEMO_USER_PASSWORD, 10);

  if (prismaConnected) {
    try {
      await prisma.user.upsert({
        where: { email: DEMO_USER_EMAIL },
        update: {
          name: DEMO_USER_NAME,
          password: hashedPassword,
          verified: true,
        },
        create: {
          email: DEMO_USER_EMAIL,
          name: DEMO_USER_NAME,
          password: hashedPassword,
          verified: true,
        },
      });
      return;
    } catch (err: any) {
      prismaConnected = false;
      console.warn('[auth] Prisma seed failed, using in-memory fallback demo user:', err?.message || err);
    }
  }

  if (!inMemoryUsers.has(DEMO_USER_EMAIL)) {
    createInMemoryUser({
      email: DEMO_USER_EMAIL,
      password: hashedPassword,
      name: DEMO_USER_NAME,
      verified: true,
    });
  }
}

async function initializeAuth() {
  await initializePrismaConnection();
  await seedDemoUser();
}

initializeAuth();

async function getUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase().trim();

  if (prismaConnected) {
    try {
      return await prisma.user.findUnique({ where: { email: normalizedEmail } });
    } catch (err: any) {
      prismaConnected = false;
      console.warn('[auth] Prisma query failed, falling back to in-memory users:', err?.message || err);
    }
  }

  return inMemoryUsers.get(normalizedEmail) || null;
}

async function getUserById(id: string) {
  if (prismaConnected) {
    try {
      return await prisma.user.findUnique({ where: { id } });
    } catch (err: any) {
      prismaConnected = false;
      console.warn('[auth] Prisma query failed, falling back to in-memory users:', err?.message || err);
    }
  }

  return Array.from(inMemoryUsers.values()).find(user => user.id === id) || null;
}

function createInMemoryUser(data: {
  email: string;
  password?: string;
  name?: string;
  verified?: boolean;
  avatarUrl?: string;
}) {
  const now = new Date();
  const user: StoredUser = {
    id: `mem-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    email: data.email.toLowerCase().trim(),
    name: data.name,
    password: data.password,
    verified: data.verified ?? false,
    avatarUrl: data.avatarUrl,
    createdAt: now,
    updatedAt: now,
  };
  inMemoryUsers.set(user.email, user);
  return user;
}

async function setUserVerifiedById(userId: string) {
  const user = await getUserById(userId);
  if (!user) return null;

  if (prismaConnected) {
    try {
      return await prisma.user.update({ where: { id: userId }, data: { verified: true } });
    } catch (err: any) {
      prismaConnected = false;
      console.warn('[auth] Prisma update failed, falling back to in-memory user verify:', err?.message || err);
    }
  }

  const mappedUser = await getUserById(userId);
  if (mappedUser) {
    mappedUser.verified = true;
    mappedUser.updatedAt = new Date();
    inMemoryUsers.set(mappedUser.email.toLowerCase().trim(), mappedUser as StoredUser);
    return mappedUser;
  }

  return null;
}

async function setUserVerifiedByEmail(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await getUserByEmail(normalizedEmail);
  if (!user) return null;

  if (prismaConnected) {
    try {
      return await prisma.user.update({ where: { email: normalizedEmail }, data: { verified: true } });
    } catch (err: any) {
      prismaConnected = false;
      console.warn('[auth] Prisma update failed, falling back to in-memory user verify:', err?.message || err);
    }
  }

  const mappedUser = inMemoryUsers.get(normalizedEmail);
  if (mappedUser) {
    mappedUser.verified = true;
    mappedUser.updatedAt = new Date();
    inMemoryUsers.set(normalizedEmail, mappedUser);
    return mappedUser;
  }

  return null;
}

async function findOrCreateSocialUser(email: string, name?: string, avatarUrl?: string) {
  const normalizedEmail = email.toLowerCase().trim();
  let user = await getUserByEmail(normalizedEmail);

  if (user) {
    if (!user.verified) {
      if (prismaConnected) {
        try {
          user = await prisma.user.update({ where: { email: normalizedEmail }, data: { verified: true } });
        } catch (err: any) {
          prismaConnected = false;
          console.warn('[auth] Prisma update failed, falling back to in-memory social verify:', err?.message || err);
          user.verified = true;
          user.updatedAt = new Date();
          inMemoryUsers.set(normalizedEmail, user as StoredUser);
        }
      } else {
        user.verified = true;
        user.updatedAt = new Date();
        inMemoryUsers.set(normalizedEmail, user as StoredUser);
      }
    }
  } else {
    user = await createUser({ email: normalizedEmail, name, verified: true, avatarUrl });
  }

  return user;
}

async function createUser(data: {
  email: string;
  password?: string;
  name?: string;
  verified?: boolean;
  avatarUrl?: string;
}) {
  const normalizedEmail = data.email.toLowerCase().trim();

  if (prismaConnected) {
    try {
      return await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: data.password,
          name: data.name,
          verified: data.verified ?? false,
        },
      });
    } catch (err: any) {
      prismaConnected = false;
      console.warn('[auth] Prisma create failed, falling back to in-memory user:', err?.message || err);
    }
  }

  return createInMemoryUser({
    email: normalizedEmail,
    password: data.password,
    name: data.name,
    verified: data.verified,
    avatarUrl: data.avatarUrl,
  });
}

async function updateUserName(id: string, name: string) {
  if (prismaConnected) {
    try {
      return await prisma.user.update({ where: { id }, data: { name } });
    } catch (err: any) {
      prismaConnected = false;
      console.warn('[auth] Prisma update failed, falling back to in-memory user update:', err?.message || err);
    }
  }

  const user = Array.from(inMemoryUsers.values()).find(u => u.id === id);
  if (user) {
    user.name = name;
    user.updatedAt = new Date();
    inMemoryUsers.set(user.email, user);
    return user;
  }

  throw new Error('User not found');
}

async function sendVerificationEmail(email: string, verifyUrl: string) {
  try {
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        to: email,
        subject: 'Verify your email',
        text: `Please verify your email by visiting: ${verifyUrl}`,
        html: `<p>Please verify your email by visiting: <a href="${verifyUrl}">${verifyUrl}</a></p>`
      });
    } else {
      console.log('[auth] Verification URL (no SMTP configured):', verifyUrl);
    }
  } catch (err) {
    console.warn('[auth] Failed to send verification email:', err);
  }
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

    const existing = await getUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, password: hash, name, verified: false });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
    const verifyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/verify?token=${token}`;

    await sendVerificationEmail(email, verifyUrl);

    res.status(201).json({ message: 'Registered. Check email for verification.' });
  } catch (err: any) {
    console.error('[auth] Register error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

    const user = await getUserByEmail(email);
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.verified) return res.status(403).json({ error: 'Email not verified' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err: any) {
    console.error('[auth] Login error:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

router.get('/verify', async (req, res) => {
  try {
    const token = String(req.query.token || '');
    if (!token) return res.status(400).send('Missing token');

    const payload: any = jwt.verify(token, JWT_SECRET);
    const userId = payload?.userId;
    if (!userId) return res.status(400).send('Invalid token');

    const updatedUser = await setUserVerifiedById(userId);
    if (!updatedUser) return res.status(404).send('User not found');

    res.send('Email verified. You can now log in.');
  } catch (err: any) {
    console.error('[auth] Verify error:', err);
    res.status(400).send('Token invalid or expired');
  }
});

// In-memory OTP store (demo only).
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Register request (OTP-based flow) for frontend
router.post('/register-request', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

    const existing = await getUserByEmail(email);
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const hash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, password: hash, name, verified: false });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 1000 * 60 * 15; // 15 minutes
    otpStore.set(email.toLowerCase().trim(), { otp, expiresAt });

    // If SMTP is configured, send verification link; otherwise return OTP for dev
    if (process.env.SMTP_HOST) {
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
      const verifyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/verify?token=${token}`;
      await sendVerificationEmail(email, verifyUrl);
      return res.status(201).json({ message: 'Registered. Check email for verification.' });
    }

    return res.status(201).json({ message: 'Registered (dev). Use OTP to verify.', otp });
  } catch (err: any) {
    console.error('[auth] register-request error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

router.post('/register-verify', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Missing email or otp' });

    const record = otpStore.get(email.toLowerCase().trim());
    if (!record || record.expiresAt < Date.now() || record.otp !== String(otp).trim()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const verifiedUser = await setUserVerifiedByEmail(email);
    if (!verifiedUser) return res.status(500).json({ error: 'Unable to verify user' });

    otpStore.delete(email.toLowerCase().trim());

    const safeUser = { id: verifiedUser.id, email: verifiedUser.email, name: verifiedUser.name };
    const token = jwt.sign({ userId: verifiedUser.id }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ user: safeUser, token });
  } catch (err: any) {
    console.error('[auth] register-verify error:', err);
    res.status(500).json({ error: err.message || 'Verification failed' });
  }
});

// Social login endpoint used by frontend demo flows
router.post('/social-login', async (req, res) => {
  try {
    const { provider, email, name, avatarUrl } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });

    const user = await findOrCreateSocialUser(email, name, avatarUrl);
    if (!user) return res.status(500).json({ error: 'Failed to create or verify social user' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const safeUser = { id: user.id, email: user.email, name: name || user.name || 'User', avatarUrl };
    return res.json({ user: safeUser, token });
  } catch (err: any) {
    console.error('[auth] social-login error:', err);
    res.status(500).json({ error: err.message || 'Social login failed' });
  }
});

// Protected user endpoints
router.get('/me', async (req: any, res: any) => {
  // This handler expects `requireAuth` to populate req.user
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s*/i, '');
    if (!token) return res.status(401).json({ error: 'Missing token' });
    const payload: any = jwt.verify(token, JWT_SECRET);
    const userId = payload?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await getUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const safeUser = { id: user.id, email: user.email, name: user.name, verified: user.verified };
    res.json({ user: safeUser });
  } catch (err: any) {
    console.error('[auth] GET /me error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch user' });
  }
});

router.patch('/me', async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s*/i, '');
    if (!token) return res.status(401).json({ error: 'Missing token' });
    const payload: any = jwt.verify(token, JWT_SECRET);
    const userId = payload?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { name } = req.body;
    const updated = await updateUserName(userId, name);
    const safeUser = { id: updated.id, email: updated.email, name: updated.name, verified: updated.verified };
    res.json({ user: safeUser });
  } catch (err: any) {
    console.error('[auth] PATCH /me error:', err);
    res.status(500).json({ error: err.message || 'Failed to update user' });
  }
});

export function requireAuth(req: any, res: any, next: any) {
  try {
    const header = req.headers.authorization || '';
    const token = header.replace(/^Bearer\s*/i, '');
    if (!token) return res.status(401).json({ error: 'Missing token' });
    const payload: any = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.userId };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export default router;
