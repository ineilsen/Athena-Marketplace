import express from 'express';
import textToSpeech from '@google-cloud/text-to-speech';

const router = express.Router();

// POST /tts
// Expects: { text: string }
// Uses Google Cloud Text-to-Speech to synthesize MP3 audio.
router.post('/', async (req, res) => {
  const { text } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }

  try {
    console.log('[TTS] Request text length:', text.length);
    const client = new textToSpeech.TextToSpeechClient();

    const request = {
      input: { text },
      // Adjust languageCode/voiceName to your preference
      voice: {
        languageCode: 'en-GB',
        ssmlGender: 'NEUTRAL'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0
      }
    };

    const [response] = await client.synthesizeSpeech(request);
    const audio = response.audioContent;

    if (!audio) {
      console.error('[TTS] No audioContent returned from Google');
      return res.status(500).json({ error: 'no_audio_generated' });
    }

    console.log('[TTS] Generated audio bytes:', audio.length);
    res.setHeader('Content-Type', 'audio/mpeg');
    return res.status(200).send(Buffer.from(audio));
  } catch (err) {
    console.error('Google TTS error', err);
    return res.status(500).json({ error: 'tts_failed' });
  }
});

export default router;
