const AUTH_BASE = 'http://localhost:3001';
const EVENT_BASE = 'http://localhost:3002';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`
  };
}

export const api = {
  register: (data) =>
    fetch(`${AUTH_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  login: (data) =>
    fetch(`${AUTH_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(r => r.json()),

  getEvents: () =>
    fetch(`${EVENT_BASE}/events`, { headers: authHeaders() }).then(r => r.json()),

  createEvent: (data) =>
    fetch(`${EVENT_BASE}/events`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    }).then(r => r.json()),
};
