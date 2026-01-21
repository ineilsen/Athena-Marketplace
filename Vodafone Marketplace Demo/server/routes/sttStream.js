import { WebSocketServer } from 'ws';
import speech from '@google-cloud/speech';

const MAX_SYNC_BYTES = 8 * 1024 * 1024; // 8 MB

// Attach a WebSocket endpoint at /stt/stream that accepts binary audio frames
// and emits {type:'partial'|'final', text} messages.
export default function attachSttStream(server, opts = {}) {
  const client = new speech.SpeechClient();
  const silenceMs = Number(opts.silenceMs || 2000);
  const partialIntervalMs = Number(opts.partialIntervalMs || 700);

  const wss = new WebSocketServer({ server, path: '/stt/stream' });

  wss.on('connection', (ws) => {
    let chunks = [];
    let closed = false;
    let lastAudioTs = Date.now();
    let lastPartialAt = 0;
    let silenceTimer = null;
    let partialDebounce = null;

    const resetSilence = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(async () => {
        // No audio received for silenceMs -> finalize
        await emitFinal();
        safeClose();
      }, silenceMs);
    };

    const safeClose = () => {
      if (closed) return;
      closed = true;
      try { ws.close(); } catch {}
      if (silenceTimer) clearTimeout(silenceTimer);
      if (partialDebounce) clearTimeout(partialDebounce);
    };

    const recognize = async (buffer) => {
      if (!buffer || !buffer.length) return '';
      if (buffer.length > MAX_SYNC_BYTES) {
        // Trim oldest data if oversized
        buffer = buffer.slice(-MAX_SYNC_BYTES);
      }
      const audioBytes = Buffer.from(buffer).toString('base64');
      const request = {
        audio: { content: audioBytes },
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'en-GB'
        }
      };
      try {
        const [response] = await client.recognize(request);
        const transcription = response.results
          ?.map((result) => result.alternatives?.[0]?.transcript || '')
          .join(' ')
          .trim();
        return transcription || '';
      } catch (err) {
        console.warn('[STT/stream] recognize error', err?.message || err);
        return '';
      }
    };

    const emitPartial = async () => {
      const now = Date.now();
      if (now - lastPartialAt < partialIntervalMs) return;
      lastPartialAt = now;
      const text = await recognize(Buffer.concat(chunks));
      if (text) {
        try { ws.send(JSON.stringify({ type: 'partial', text })); } catch {}
      }
    };

    const emitFinal = async () => {
      const text = await recognize(Buffer.concat(chunks));
      try { ws.send(JSON.stringify({ type: 'final', text })); } catch {}
    };

    ws.on('message', (data, isBinary) => {
      lastAudioTs = Date.now();
      resetSilence();
      if (isBinary) {
        chunks.push(Buffer.from(data));
        if (partialDebounce) clearTimeout(partialDebounce);
        partialDebounce = setTimeout(emitPartial, partialIntervalMs);
      } else {
        // Optional control messages: {cmd:"end"}
        try {
          const msg = JSON.parse(data.toString());
          if (msg && msg.cmd === 'end') {
            emitFinal().then(safeClose);
          }
        } catch {}
      }
    });

    ws.on('close', async () => {
      if (closed) return;
      await emitFinal();
      safeClose();
    });

    ws.on('error', () => safeClose());

    // Kick off silence tracking for new connection
    resetSilence();
  });
}
