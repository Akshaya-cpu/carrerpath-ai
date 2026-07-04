import express from 'express';
import prisma from './prisma';

interface StoredJob {
  id: string;
  title: string;
  description?: string;
  company?: string;
  location?: string;
  postedAt: Date;
  userId?: string;
}

const router = express.Router();
const inMemoryJobs = new Map<string, StoredJob>();
let prismaConnected = true;

async function findJobsByUserId(userId: string) {
  if (prismaConnected) {
    try {
      return await prisma.job.findMany({ where: { userId } });
    } catch (err: any) {
      prismaConnected = false;
      console.warn('[jobs] Prisma query failed, falling back to in-memory jobs:', err?.message || err);
    }
  }

  return Array.from(inMemoryJobs.values()).filter(job => job.userId === userId);
}

function createInMemoryJob(data: {
  title: string;
  description?: string;
  company?: string;
  location?: string;
  userId?: string;
}) {
  const now = new Date();
  const job: StoredJob = {
    id: `mem-job-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: data.title,
    description: data.description,
    company: data.company,
    location: data.location,
    userId: data.userId,
    postedAt: now,
  };
  inMemoryJobs.set(job.id, job);
  return job;
}

async function createJobRecord(data: {
  title: string;
  description?: string;
  company?: string;
  location?: string;
  userId?: string;
}) {
  if (prismaConnected) {
    try {
      return await prisma.job.create({ data });
    } catch (err: any) {
      prismaConnected = false;
      console.warn('[jobs] Prisma create failed, falling back to in-memory job:', err?.message || err);
    }
  }

  return createInMemoryJob(data);
}

// Get jobs for a specific user
router.get('/users/:id/jobs', async (req, res) => {
  try {
    const userId = String(req.params.id || '');
    if (!userId) return res.status(400).json({ error: 'Missing user id' });

    const jobs = await findJobsByUserId(userId);
    res.json({ success: true, jobs });
  } catch (err: any) {
    console.error('[jobs] GET /users/:id/jobs error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch jobs' });
  }
});

// Create a job (for seeding / admin flows)
router.post('/jobs', async (req, res) => {
  try {
    const { title, description, company, location, userId } = req.body;
    if (!title) return res.status(400).json({ error: 'Missing title' });

    const job = await createJobRecord({ title, description, company, location, userId });
    res.status(201).json({ success: true, job });
  } catch (err: any) {
    console.error('[jobs] POST /jobs error:', err);
    res.status(500).json({ error: err.message || 'Failed to create job' });
  }
});

export default router;
