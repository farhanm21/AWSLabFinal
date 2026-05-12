const amqp = require('amqplib');
const fs = require('fs');
const path = require('path');

const QUEUE = 'event.created';
const LOG_DIR = path.join(__dirname, 'event-log');

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

function getLogFile() {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(LOG_DIR, `events-${date}.json`);
}

function appendLog(entry) {
  const file = getLogFile();
  let logs = [];
  if (fs.existsSync(file)) {
    try { logs = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { logs = []; }
  }
  logs.push(entry);
  fs.writeFileSync(file, JSON.stringify(logs, null, 2));
}

async function processMessage(msg) {
  const data = JSON.parse(msg.content.toString());

  console.log('\n📬 Notification received:');
  console.log(`  Type    : ${data.type}`);
  console.log(`  Event   : ${data.payload.title}`);
  console.log(`  Date    : ${data.payload.event_date}`);
  console.log(`  Creator : ${data.user.name} (${data.user.email})`);
  console.log(`  Time    : ${data.timestamp}`);

  // Simulate sending notification
  console.log(`  ✉️  [SIMULATED] Email sent to ${data.user.email}: "Your event '${data.payload.title}' was created!"`);

  // Write to event log (lakehouse-style)
  const logEntry = {
    ...data,
    processed_at: new Date().toISOString(),
    notification_sent: true
  };
  appendLog(logEntry);
  console.log(`  📝 Logged to: ${getLogFile()}`);
}

async function start(retries = 15) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await amqp.connect(process.env.RABBITMQ_URL);
      const channel = await conn.createChannel();
      await channel.assertQueue(QUEUE, { durable: true });
      channel.prefetch(1);

      console.log(`Notification service listening on queue: ${QUEUE}`);

      channel.consume(QUEUE, async (msg) => {
        if (msg) {
          try {
            await processMessage(msg);
            channel.ack(msg);
          } catch (err) {
            console.error('Error processing message:', err);
            channel.nack(msg, false, false); // discard bad messages
          }
        }
      });
      return;
    } catch (err) {
      console.log(`RabbitMQ not ready, retrying (${i + 1}/${retries})...`);
      await new Promise(r => setTimeout(r, 4000));
    }
  }
  console.error('Failed to connect to RabbitMQ. Exiting.');
  process.exit(1);
}

start();
