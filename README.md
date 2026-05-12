# EventFlow — Microservices Demo

A prototype microservices system using Node.js, Express, PostgreSQL, JWT, RabbitMQ, and React.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   Frontend  │────▶│ Auth Service │     │ Event Service │
│  React/Nginx│     │  :3001       │     │  :3002        │
└─────────────┘     └──────────────┘     └───────┬───────┘
                            │                    │ publish
                            ▼                    ▼
                       PostgreSQL          RabbitMQ
                       (shared DB)     event.created queue
                                             │
                                    ┌────────▼────────┐
                                    │Notification Svc │
                                    │ (consumer)      │
                                    └────────┬────────┘
                                             │
                                    ┌────────▼────────┐
                                    │  event-log/     │
                                    │ events-YYYY-MM-DD│
                                    │     .json       │
                                    └─────────────────┘
```

## Services

| Service | Port | Description |
|---|---|---|
| Frontend | 3000 | React UI |
| Auth Service | 3001 | Register / Login / JWT |
| Event Service | 3002 | CRUD events, publishes to RabbitMQ |
| Notification Service | — | Consumes messages, writes event log |
| PostgreSQL | 5432 | Shared relational DB |
| RabbitMQ | 5672 / 15672 | Message broker |

## Quick Start

### Prerequisites
- Docker
- Docker Compose

### Run

```bash
docker compose up --build
```

That's it. All services start automatically.

- **App**: http://localhost:3000
- **RabbitMQ UI**: http://localhost:15672 (farhan_u166 / secret)

### Event Logs (Lakehouse-style)

Every time an event is created, the notification service writes a JSON log entry to:
```
event-log/events-YYYY-MM-DD.json
```

These files are structured for easy ingestion into a data lake or warehouse (e.g. Athena, BigQuery, DuckDB).

```json
[
  {
    "type": "event.created",
    "payload": { "id": 1, "title": "Team Sync", ... },
    "user": { "id": 1, "email": "ada@example.com", "name": "Ada" },
    "timestamp": "2024-01-15T10:30:00.000Z",
    "processed_at": "2024-01-15T10:30:00.050Z",
    "notification_sent": true
  }
]
```

## API Reference

### Auth Service (port 3001)

```
POST /auth/register   { name, email, password }
POST /auth/login      { email, password }
POST /auth/verify     { token }
```

### Event Service (port 3002) — requires Bearer token

```
GET  /events
POST /events    { title, description?, location?, event_date }
GET  /events/:id
```

## Development (without Docker)

```bash
# Start infra only
docker compose up postgres rabbitmq -d

# Auth service
cd auth-service && npm install
DATABASE_URL=postgres://admin:secret@localhost:5432/authdb JWT_SECRET=devsecret node index.js

# Event service
cd event-service && npm install
DATABASE_URL=postgres://admin:secret@localhost:5432/authdb JWT_SECRET=devsecret RABBITMQ_URL=amqp://admin:secret@localhost:5672 node index.js

# Notification service
cd notification-service && npm install
RABBITMQ_URL=amqp://admin:secret@localhost:5672 node index.js

# Frontend
cd frontend && npm install && npm start
```
