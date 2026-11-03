'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const worker = require('../worker/src/index.js');

const ENV = {
  ALLOWED_ORIGIN: 'https://example.github.io',
  GITHUB_CLIENT_ID: 'client-id',
  GITHUB_CLIENT_SECRET: 'client-secret'
};
const ORIGIN = 'https://example.github.io';
const REDIRECT = 'https://example.github.io/bs-prep/';

function jsonRequest(path, body, headers = {}) {
  return new Request('https://worker.example' + path, {
    method: 'POST',
    headers: Object.assign({ Origin: ORIGIN, 'Content-Type': 'application/json' }, headers),
    body: JSON.stringify(body)
  });
}

function jsonResponse(response) {
  return response.json();
}

test('rejects requests from an unallowed origin', async () => {
  const request = new Request('https://worker.example/state', {
    headers: { Origin: 'https://evil.example' }
  });
  const response = await worker.handle(request, ENV, async () => new Response('{}'));
  assert.equal(response.status, 403);
});

test('rejects an expired OAuth state', async () => {
  const state = await worker.issueState(ENV.GITHUB_CLIENT_SECRET, Date.now() - 601000);
  const request = jsonRequest('/token', { code: 'validcode123', state, redirect_uri: REDIRECT });
  const response = await worker.handle(request, ENV, async () => new Response('{}'));
  const data = await jsonResponse(response);
  assert.equal(response.status, 400);
  assert.equal(data.error, 'bad_state');
});

test('rejects a tampered OAuth state', async () => {
  const state = await worker.issueState(ENV.GITHUB_CLIENT_SECRET);
  const tampered = state.slice(0, -1) + (state.endsWith('0') ? '1' : '0');
  const request = jsonRequest('/token', { code: 'validcode123', state: tampered, redirect_uri: REDIRECT });
  const response = await worker.handle(request, ENV, async () => new Response('{}'));
  const data = await jsonResponse(response);
  assert.equal(response.status, 400);
  assert.equal(data.error, 'bad_state');
});

test('rejects a redirect outside the configured origin', async () => {
  const state = await worker.issueState(ENV.GITHUB_CLIENT_SECRET);
  const request = jsonRequest('/token', {
    code: 'validcode123',
    state,
    redirect_uri: 'https://evil.example/bs-prep/'
  });
  const response = await worker.handle(request, ENV, async () => new Response('{}'));
  const data = await jsonResponse(response);
  assert.equal(response.status, 400);
  assert.equal(data.error, 'bad_redirect');
});

test('rejects an oversized token request', async () => {
  const state = await worker.issueState(ENV.GITHUB_CLIENT_SECRET);
  const body = JSON.stringify({ code: 'validcode123', state, redirect_uri: REDIRECT });
  const request = new Request('https://worker.example/token', {
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'Content-Length': String(body.length + 1) },
    body
  });
  const response = await worker.handle(request, ENV, async () => new Response('{}'));
  assert.equal(response.status, 413);
});

test('rejects a non-JSON token request', async () => {
  const request = new Request('https://worker.example/token', {
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'text/plain', 'Content-Length': '2' },
    body: '{}'
  });
  const response = await worker.handle(request, ENV, async () => new Response('{}'));
  assert.equal(response.status, 415);
});

test('rejects a GitHub token response with an unexpected scope', async () => {
  const state = await worker.issueState(ENV.GITHUB_CLIENT_SECRET);
  const request = jsonRequest('/token', { code: 'validcode123', state, redirect_uri: REDIRECT });
  const response = await worker.handle(request, ENV, async () => new Response(JSON.stringify({
    access_token: 'token',
    scope: 'repo,gist'
  }), { status: 200 }));
  const data = await jsonResponse(response);
  assert.equal(response.status, 403);
  assert.equal(data.error, 'scope');
});
