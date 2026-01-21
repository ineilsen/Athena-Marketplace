import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
// Load environment variables from server/.env if present
dotenv.config();
import path from 'path';
import cors from 'cors';
import chatRouter from './routes/chat.js';
import ttsRouter from './routes/tts.js';
import sttRouter from './routes/stt.js';
import logger from './utils/logger.js';
import attachSttStream from './routes/sttStream.js';

const app = express();
const PORT = process.env.PORT || 4105;
const COMPANY_NAME = process.env.COMPANY_NAME || 'Vodafone Business';
// Voice/STT timing configuration (ms)
const VOICE_MAX_DURATION_MS = Number(process.env.VOICE_MAX_DURATION_MS || 8000);
const STT_SILENCE_FINALIZE_MS = Number(process.env.STT_SILENCE_FINALIZE_MS || 10000);
const STT_PARTIAL_INTERVAL_MS = Number(process.env.STT_PARTIAL_INTERVAL_MS || 900);

app.use(cors());
app.use(express.json());

const __dirnameResolved = path.resolve();
app.use(express.static(path.join(__dirnameResolved, '../client/public')));

app.use('/chat', chatRouter);
app.use('/tts', ttsRouter);
app.use('/stt', sttRouter);

app.get('/config', (_req, res) => {
  res.json({
    companyName: COMPANY_NAME,
    voice: {
      maxDurationMs: VOICE_MAX_DURATION_MS,
      sttSilenceFinalizeMs: STT_SILENCE_FINALIZE_MS,
      sttPartialIntervalMs: STT_PARTIAL_INTERVAL_MS
    }
  });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirnameResolved, '../client/public/index.html'));
});

// Create HTTP server to attach WebSocket endpoints
const server = http.createServer(app);

// Attach streaming STT over WebSocket, honoring env timings
attachSttStream(server, {
  silenceMs: STT_SILENCE_FINALIZE_MS,
  partialIntervalMs: STT_PARTIAL_INTERVAL_MS
});

server.listen(PORT, () => {
  logger.info(`Vodafone Marketplace Demo listening on ${PORT} (company: ${COMPANY_NAME})`);
});
