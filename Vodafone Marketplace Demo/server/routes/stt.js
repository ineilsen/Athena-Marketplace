import express from 'express';
import speech from '@google-cloud/speech';

const router = express.Router();
const client = new speech.SpeechClient();

// Rough safeguard: cap sync STT payload to avoid "Sync input too long".
// WEBM_OPUS is compressed; 1 minute is usually well under this, but we keep
// a generous ceiling for demo purposes.
const MAX_SYNC_BYTES = 8 * 1024 * 1024; // 8 MB

// POST /stt
// Expects: raw audio in request body (audio/webm;codecs=opus)
// Returns: { transcript }
router.post('/', async (req, res) => {
  try {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', async () => {
          const rawBuffer = Buffer.concat(chunks);
          const byteLength = rawBuffer.length;

          if (!byteLength) {
            return res.json({ transcript: '' });
          }

          if (byteLength > MAX_SYNC_BYTES) {
            console.warn('[STT] Payload too large for sync recognize:', byteLength, 'bytes');
            return res.status(413).json({
              transcript: '',
              tooLong: true,
              message: 'Voice message too long for speech recognition. Please try a shorter request.'
            });
          }

          const audioBytes = rawBuffer.toString('base64');

      const request = {
        audio: {
          content: audioBytes
        },
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

        return res.json({ transcript: transcription || '' });
      } catch (err) {
        console.error('Google STT error', err);
        return res.status(500).json({ error: 'stt_failed' });
      }
    });
  } catch (err) {
    console.error('STT request error', err);
    return res.status(500).json({ error: 'stt_request_failed' });
  }
});

export default router;
