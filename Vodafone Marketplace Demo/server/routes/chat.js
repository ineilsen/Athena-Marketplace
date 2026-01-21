import express from 'express';
import axios from 'axios';
import logger from '../utils/logger.js';

const router = express.Router();

router.post('/send', async (req, res) => {
  const start = Date.now();
  const { customerId, message, athenaBaseUrl } = req.body || {};
  if (!customerId || !message || !athenaBaseUrl) {
    return res.status(400).json({ error: 'customerId, message, athenaBaseUrl required' });
  }
  try {
    const base = athenaBaseUrl.replace(/\/+$/, '');
    const url = `${base}/api/v1/external-chat`;
    logger.info('Forwarding marketplace chat', { customerId, url });
    // Tag this source so Athena can route Marketplace prompts
    const resp = await axios.post(url, { customerId, message, source: 'marketplace' }, { timeout: 20000 });
    logger.info('Athena responded', { status: resp.status, ms: Date.now() - start });
    res.json(resp.data);
  } catch (err) {
    logger.error('Marketplace forward failed', { msg: err.message, code: err.code, status: err.response?.status });
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.message, code: err.code, status, raw: err.response?.data });
  }
});

export default router;
