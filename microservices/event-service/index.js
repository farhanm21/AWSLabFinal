const express = require('express');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const amqp = require('amqplib');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const QUEUE = 'event.created';

let channel = null;

async function connectRabbitMQ(retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await amqp.connect(process.env.RABBITMQ_URL);
      channel = await conn.createChannel();
      await channel.assertQueue(QUEUE, { durable: true });
      console.log('Connected to RabbitMQ');
      return;
    } catch (err) {
      console.log(`RabbitMQ not ready, retrying (${i + 1}/${retries})...`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  console.error('Could not connect to RabbitMQ');
}

// Auth middleware
function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(auth.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Health
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'events' }));

// Create event
app.post('/events', authenticate, async (req, res) => {
  const { title, description, location, event_date } = req.body;
  if (!title || !event_date)
    return res.status(400).json({ error: 'title and event_date are required' });

  try {
    const result = await pool.query(
      'INSERT INTO events (title, description, location, event_date, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [title, description, location, event_date, req.user.id]
    );
    const event = result.rows[0];

    // Publish to RabbitMQ
    const message = {
      type: 'event.created',
      payload: event,
      user: { id: req.user.id, email: req.user.email, name: req.user.name },
      timestamp: new Date().toISOString()
    };
    if (channel) {
      channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(message)), { persistent: true });
    }

    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// List events
app.get('/events', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, u.name as creator_name, u.email as creator_email
       FROM events e JOIN users u ON e.created_by = u.id
       ORDER BY e.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single event
app.get('/events/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, u.name as creator_name FROM events e JOIN users u ON e.created_by = u.id WHERE e.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, async () => {
  console.log(`Event service running on port ${PORT}`);
  await connectRabbitMQ();
});
