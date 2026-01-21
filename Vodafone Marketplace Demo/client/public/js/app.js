const DEMO_CUSTOMER_IDS = ['GB26669607', 'GB13820473', 'GB22446688', 'GB77553311', 'GB99001234'];
// Note: logo URLs are illustrative and may be subject to change.
const PRODUCT_CATALOG = [
  // Vodafone-native services use Vodafone branding
  {
    name: 'Vodafone Business Broadband',
    category: 'Connectivity',
    coverage: 'Same-day SLA',
    renewal: 'Aug 2025',
    status: 'Healthy',
    icon: '🌐',
    logo: 'https://d33na3ni6eqf5j.cloudfront.net/channel_custom_style_resources/img6278299006697370250?14da8e1c14f048a3837a600ba841fd5a',
    vendor: 'Vodafone',
    price: '£35.00 / month'
  },
  {
    name: 'Secure Net Cloud',
    category: 'Security',
    coverage: '4-hour engineer',
    renewal: 'Mar 2026',
    status: 'At Risk',
    icon: '🛡️',
    logo: 'https://d33na3ni6eqf5j.cloudfront.net/channel_custom_style_resources/img6278299006697370250?14da8e1c14f048a3837a600ba841fd5a',
    vendor: 'Vodafone',
    price: '£12.00 / month'
  },
  {
    name: 'Vodafone Business UC with Webex',
    category: 'Collaboration',
    coverage: 'Next-business-day',
    renewal: 'Jul 2025',
    status: 'Watch',
    icon: '🎧',
    logo: 'https://d33na3ni6eqf5j.cloudfront.net/channel_custom_style_resources/img6278299006697370250?14da8e1c14f048a3837a600ba841fd5a',
    vendor: 'Vodafone + Cisco Webex',
    price: '£9.99 / user / month'
  },
  {
    name: 'IoT Fleet Manager',
    category: 'IoT',
    coverage: 'Next-business-day',
    renewal: 'Jan 2026',
    status: 'Healthy',
    icon: '🚚',
    logo: 'https://d33na3ni6eqf5j.cloudfront.net/channel_custom_style_resources/img6278299006697370250?14da8e1c14f048a3837a600ba841fd5a',
    vendor: 'Vodafone',
    price: '£18.00 / vehicle / month'
  },

  // Microsoft & partner catalogue apps
  {
    name: 'Exchange Online',
    category: 'Productivity',
    coverage: 'Standard business hours',
    renewal: 'Dec 2025',
    status: 'Healthy',
    icon: '✉️',
    logo: 'https://cdn-icons-png.flaticon.com/512/732/732223.png',
    vendor: 'Microsoft',
    price: '£0.81 / month'
  },
  {
    name: 'Microsoft 365 Business',
    category: 'Productivity',
    coverage: '24/7 Priority',
    renewal: 'Jan 2026',
    status: 'Healthy',
    icon: '🧩',
    logo: 'https://cdn-icons-png.flaticon.com/512/732/732221.png',
    vendor: 'Microsoft',
    price: 'From £4.83 / month'
  },
  {
    name: 'Power BI Pro',
    category: 'Analytics',
    coverage: 'Standard business hours',
    renewal: 'Feb 2026',
    status: 'Watch',
    icon: '📊',
    logo: 'https://cdn-icons-png.flaticon.com/512/2103/2103665.png',
    vendor: 'Microsoft',
    price: 'From £8.09 / month'
  },
  {
    name: 'Microsoft 365 Enterprise',
    category: 'Productivity',
    coverage: 'Co-managed',
    renewal: 'Mar 2026',
    status: 'Healthy',
    icon: '🏢',
    logo: 'https://cdn-icons-png.flaticon.com/512/732/732221.png',
    vendor: 'Microsoft',
    price: 'From £1.82 / month'
  },
  {
    name: 'Lookout Mobile Security',
    category: 'Security',
    coverage: 'Next-business-day',
    renewal: 'Apr 2026',
    status: 'Healthy',
    icon: '📱',
    logo: 'https://cdn-icons-png.flaticon.com/512/565/565547.png',
    vendor: 'Lookout',
    price: 'From £1.80 / month'
  },
  {
    name: 'Visio',
    category: 'Productivity',
    coverage: 'Standard business hours',
    renewal: 'May 2026',
    status: 'Healthy',
    icon: '📈',
    logo: 'https://cdn-icons-png.flaticon.com/512/888/888882.png',
    vendor: 'Microsoft',
    price: 'From £3.99 / month'
  },
  {
    name: 'Project',
    category: 'Productivity',
    coverage: 'Standard business hours',
    renewal: 'Jun 2026',
    status: 'Watch',
    icon: '📅',
    logo: 'https://cdn-icons-png.flaticon.com/512/2991/2991112.png',
    vendor: 'Microsoft',
    price: 'From £5.67 / month'
  },
  {
    name: 'Microsoft Teams Rooms',
    category: 'Collaboration',
    coverage: 'Co-managed',
    renewal: 'Jul 2026',
    status: 'Healthy',
    icon: '💼',
    logo: 'https://cdn-icons-png.flaticon.com/512/906/906324.png',
    vendor: 'Microsoft',
    price: '£0.00 / month'
  },
  {
    name: 'Microsoft Copilot for Microsoft 365',
    category: 'AI',
    coverage: '24/7 Priority',
    renewal: 'Aug 2026',
    status: 'Healthy',
    icon: '✨',
    logo: 'https://cdn-icons-png.flaticon.com/512/4712/4712109.png',
    vendor: 'Microsoft',
    price: '£0.00 / month'
  },
  {
    name: 'Office 365 Enterprise',
    category: 'Productivity',
    coverage: 'Standard business hours',
    renewal: 'Sep 2026',
    status: 'Healthy',
    icon: '📦',
    logo: 'https://cdn-icons-png.flaticon.com/512/732/732223.png',
    vendor: 'Microsoft',
    price: 'From £3.26 / month'
  },
  {
    name: 'Microsoft Entra ID',
    category: 'Identity',
    coverage: 'Standard business hours',
    renewal: 'Oct 2026',
    status: 'Healthy',
    icon: '🔐',
    logo: 'https://cdn-icons-png.flaticon.com/512/906/906324.png',
    vendor: 'Microsoft',
    price: 'From £2.21 / month'
  },
  {
    name: 'Power Automate',
    category: 'Automation',
    coverage: 'Standard business hours',
    renewal: 'Nov 2026',
    status: 'Watch',
    icon: '⚙️',
    logo: 'https://cdn-icons-png.flaticon.com/512/906/906324.png',
    vendor: 'Microsoft',
    price: 'From £12.08 / month'
  }
];

const TIMELINE_TEMPLATES = [
  { title: 'Ticket #228341 triaged by Support Assistant', timeAgo: '5 minutes ago' },
  { title: 'Proactive diagnostic run on Secure Net Cloud', timeAgo: '1 hour ago' },
  { title: 'Engineer callback scheduled for Broadband Ultra', timeAgo: 'Yesterday' }
];

const state = {
  loggedIn: false,
  customerId: null,
  customerEmail: null,
  companyName: 'Vodafone Business',
  athenaBase: 'http://localhost:3001',
  products: [],
  coverage: [],
  timeline: [],
  sse: null,
  processedTraceIds: new Set(),
  reconnectAttempts: 0,
  inputMode: 'chat' // 'voice' | 'chat'
};

// (Removed dedupe gates; rely on single authoritative finalization)

// Speech/voice timing configuration with safe defaults; overridden by /config
const speechConfig = {
  maxDurationMs: 8000,
  sttSilenceFinalizeMs: 10000,
  sttPartialIntervalMs: 900
};

const selectors = {
  loginScreen: document.getElementById('login-screen'),
  loginForm: document.getElementById('login-form'),
  pageShell: document.getElementById('page-shell'),
  userName: document.getElementById('user-name'),
  userId: document.getElementById('user-id'),
  heroTitle: document.getElementById('hero-title'),
  heroCopy: document.getElementById('hero-copy'),
  metaCsat: document.getElementById('meta-csat'),
  metaTickets: document.getElementById('meta-tickets'),
  metaPriority: document.getElementById('meta-priority'),
  productGrid: document.getElementById('product-grid'),
  coverageList: document.getElementById('coverage-list'),
  timeline: document.getElementById('timeline'),
  sentiment: document.getElementById('insight-sentiment'),
  risk: document.getElementById('insight-risk'),
  wordCloud: document.getElementById('word-cloud'),
  assistantToggle: document.getElementById('assistant-toggle'),
  assistantPanel: document.getElementById('assistant-panel'),
  assistantClose: document.getElementById('assistant-close'),
  assistantLog: document.getElementById('assistant-log'),
  assistantInput: document.getElementById('assistant-input'),
  assistantSend: document.getElementById('assistant-send'),
  ctaAssistant: document.getElementById('cta-assistant'),
  refreshProducts: document.getElementById('refresh-products'),
  assistantEyebrow: document.getElementById('assistant-eyebrow'),
  assistantTitle: document.getElementById('assistant-title'),
  appsGrid: document.getElementById('apps-grid'),
  appsTotalLicences: document.getElementById('apps-total-licences'),
  appsSpend: document.getElementById('apps-spend'),
  appsPremium: document.getElementById('apps-premium'),
  businessSection: document.getElementById('business-apps'),
  supportSection: document.getElementById('support-page'),
  supportHero: document.getElementById('support-hero'),
  supportBreadcrumb: document.getElementById('support-breadcrumb'),
  viewAllSubscriptions: document.getElementById('view-all-subscriptions')
};

const speech = {
  recognition: null,
  synthesizer: window.speechSynthesis,
  isRecording: false,
  mediaRecorder: null,
  audioChunks: [],
  silenceTimer: null,
  maxDurationTimer: null,
  ttsActive: false,
  ttsQueue: [],
  liveTranscriptTimer: null,
  lastPartialTranscript: '',
  pendingFinalSend: false,
  audioCtx: null,
  analyser: null,
  noiseLevel: 0, // RMS 0..1
  utteranceFinalized: false,
  useWsForCurrent: false
};

// Adaptive end-of-turn detector state
const turnDetect = {
  lastText: '',
  lastChangeTs: 0,
  lastAudioTs: 0,
  wordsSpoken: 0,
  speakingStartTs: 0,
  speakingWpmBaseline: 120 // session baseline, adapted via EMA
};

function resetTurnDetect() {
  turnDetect.lastText = '';
  turnDetect.lastChangeTs = 0;
  turnDetect.lastAudioTs = 0;
  turnDetect.wordsSpoken = 0;
  turnDetect.speakingStartTs = Date.now();
}

function punctuationScore(text) {
  if (!text) return 0;
  let s = 0;
  if (/[.!?…]$/.test(text)) s += 0.6;
  if (/[,;:]$/.test(text)) s += 0.2;
  // multiple clauses increases likelihood of completion
  const clauses = (text.match(/[.!?]/g) || []).length;
  s += Math.min(0.2, clauses * 0.1);
  return Math.min(1, s);
}

function stabilityScore(now, text) {
  // longer time since last text change => more stable
  if (text !== turnDetect.lastText) return 0;
  const dt = now - turnDetect.lastChangeTs;
  // 800ms without changes feels stable
  return Math.max(0, Math.min(1, dt / 800));
}

function silenceScore(now) {
  // time since last audio chunk
  const dt = now - (turnDetect.lastAudioTs || now);
  return Math.max(0, Math.min(1, dt / speechConfig.sttSilenceFinalizeMs));
}

function rateScore(now) {
  // speaking rate near normal range suggests turn end when slowing down
  const dur = Math.max(1, (now - (turnDetect.speakingStartTs || now)) / 1000);
  const wpm = (turnDetect.wordsSpoken / dur) * 60; // words per minute
  // update session baseline via exponential moving average
  const alpha = 0.1; // smoothing factor
  if (isFinite(wpm) && wpm > 0) {
    turnDetect.speakingWpmBaseline = (1 - alpha) * turnDetect.speakingWpmBaseline + alpha * wpm;
  }
  // if rate drops below 90 wpm, boost end probability; above 140 wpm, reduce
  if (wpm <= 90) return 0.6;
  if (wpm <= 110) return 0.4;
  if (wpm <= 140) return 0.2;
  return 0.0;
}

function endOfTurnScore(now, text) {
  const p = punctuationScore(text);
  const st = stabilityScore(now, text);
  const si = silenceScore(now);
  const r = rateScore(now);
  // Weighted sum; tuned for responsive yet accurate behavior
  return p * 0.35 + st * 0.25 + si * 0.25 + r * 0.15;
}

function dynamicThreshold() {
  // Base threshold
  let thr = 0.85;
  // Adjust based on configured silence timeout (proxy for environment/noise)
  const silenceMs = speechConfig.sttSilenceFinalizeMs || 2000;
  if (silenceMs >= 3000) thr -= 0.05; // noisier envs: finalize slightly earlier
  if (silenceMs >= 5000) thr -= 0.08;

  // Adjust based on speaking rate trend
  const now = Date.now();
  const dur = Math.max(1, (now - (turnDetect.speakingStartTs || now)) / 1000);
  const wpm = (turnDetect.wordsSpoken / dur) * 60;
  if (wpm <= 90) thr -= 0.05; // slow speech: accept earlier
  else if (wpm >= 150) thr += 0.05; // fast speech: require higher certainty

  // Use measured noise level (RMS) to adapt threshold: higher noise lowers threshold modestly
  const rms = speech.noiseLevel || 0;
  // Map RMS ~0.02 (quiet) to ~0.2 (noisy); reduce threshold up to 0.06
  thr -= Math.min(0.06, Math.max(0, (rms - 0.02) * 0.6));

  // Clamp
  return Math.min(0.92, Math.max(0.75, thr));
}

// Simple Three.js-driven particle avatar that reacts to listening/speaking
const avatarVis = {
  scene: null,
  camera: null,
  renderer: null,
  points: null,
  baseScale: 1,
  targetScale: 1,
  ready: false
};

function hashString(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickProducts(customerId) {
  const hash = hashString(customerId || '');
  const picks = [];
  for (let i = 0; i < PRODUCT_CATALOG.length; i += 1) {
    if ((hash + i * 13) % 2 === 0) picks.push(PRODUCT_CATALOG[i]);
  }
  if (!picks.length) picks.push(PRODUCT_CATALOG[hash % PRODUCT_CATALOG.length]);
  return picks.slice(0, 4);
}

function buildCoverage(products) {
  return products.map((p, idx) => ({
    title: `${p.name} cover`,
    tier: p.coverage,
    response: ['4h engineer', 'Next-business-day', '24/7 priority'][idx % 3],
    expires: p.renewal
  }));
}

function buildTimeline(customerId) {
  const hash = hashString(customerId);
  return TIMELINE_TEMPLATES.map((entry, idx) => ({
    ...entry,
    ref: `#${(hash + idx * 77).toString(16).slice(0, 4).toUpperCase()}`
  }));
}

function renderProducts(list) {
  if (!selectors.productGrid) return;
  selectors.productGrid.innerHTML = list.map((p) => `
    <article class="product-card">
      <div class="product-meta">
        <span>${p.icon} ${p.category}</span>
        <span>${p.renewal}</span>
      </div>
      <h4>${p.name}</h4>
      <p class="muted">Support: ${p.coverage}</p>
      <div class="badges">
        <span class="badge">${p.status}</span>
        <span class="badge">${p.coverage}</span>
      </div>
    </article>
  `).join('');
}

function renderAppCards(list) {
  if (!selectors.appsGrid) return;
  selectors.appsGrid.innerHTML = list.map((p, index) => {
    const used = 40 + (index * 7) % 40;
    const total = used + 10;
    const spend = 40 + index * 15;
    const premium = /priority|same-day|24\/7/i.test(p.coverage);
    let pillClass = 'app-pill--green';
    if (/risk/i.test(p.status)) pillClass = 'app-pill--red';
    else if (/watch/i.test(p.status)) pillClass = 'app-pill--amber';
    const logo = p.logo ? `<div class="app-logo"><img src="${p.logo}" alt="${p.name} logo" loading="lazy"></div>` : '';
    return `
      <article class="app-card">
        <header class="app-card-header">
          <div class="app-card-mainline">
            ${logo}
            <div>
              <p class="eyebrow">${p.category}</p>
              <h3>${p.name}</h3>
              ${p.vendor ? `<p class="muted">by ${p.vendor}</p>` : ''}
            </div>
          </div>
          <span class="app-pill ${pillClass}">${p.status}</span>
        </header>
        <div class="app-card-main">
          <dl class="app-meta">
            <div>
              <dt>Licences</dt>
              <dd>${used} of ${total} in use</dd>
            </div>
            <div>
              <dt>Support cover</dt>
              <dd>${p.coverage}</dd>
            </div>
            <div>
              <dt>Renewal</dt>
              <dd>${p.renewal}</dd>
            </div>
            <div>
              <dt>Monthly spend</dt>
              <dd>${p.price || `£${spend.toLocaleString('en-GB')}`}</dd>
            </div>
          </dl>
          <p class="app-note">Managed via Vodafone Marketplace with ${premium ? 'premium' : 'standard'} support. Ideal for ${p.category.toLowerCase()} workloads.</p>
        </div>
        <footer class="app-card-footer">
          <button class="btn-secondary" type="button">View details</button>
          <button class="btn-secondary" type="button">Manage licences</button>
          <button class="btn-primary" type="button">Raise support ticket</button>
        </footer>
      </article>`;
  }).join('');
}

function renderCoverage(list) {
  if (!selectors.coverageList) return;
  selectors.coverageList.innerHTML = list.map((c) => `
    <div class="coverage-item">
      <div>
        <strong>${c.title}</strong>
        <p class="muted">${c.tier}</p>
      </div>
      <div class="coverage-meta">
        <p class="muted">Response</p>
        <strong>${c.response}</strong>
      </div>
      <div class="coverage-meta">
        <p class="muted">Renewal</p>
        <strong>${c.expires}</strong>
      </div>
    </div>
  `).join('');
}

function renderTimeline(entries) {
  if (!selectors.timeline) return;
  selectors.timeline.innerHTML = entries.map((item) => `
    <div class="timeline-entry">
      <p>${item.title}</p>
      <span>${item.timeAgo} · ${item.ref}</span>
    </div>
  `).join('');
}

function updateInsights({ sentiment, risk, wordcloud }) {
  if (sentiment && selectors.sentiment) selectors.sentiment.textContent = sentiment;
  if (risk && selectors.risk) selectors.risk.textContent = risk;
  if (Array.isArray(wordcloud) && wordcloud.length && selectors.wordCloud) {
    selectors.wordCloud.innerHTML = wordcloud.slice(0, 12).map((w) => `<button type="button">${w}</button>`).join('');
  }
}

function updateHeroMeta(customer360 = {}) {
  const csat = customer360.kpis?.csatLast90 ?? 78;
  const openTickets = customer360.cards?.ticketsCases?.openCount ?? 2;
  const priority = customer360.cards?.ticketsCases?.priority || 'High';
  if (selectors.metaCsat) selectors.metaCsat.textContent = `${csat}%`;
  if (selectors.metaTickets) selectors.metaTickets.textContent = openTickets;
  if (selectors.metaPriority) selectors.metaPriority.textContent = priority;
}

function toggleAssistant(show) {
  selectors.assistantPanel.classList.toggle('active', show);
  if (show) selectors.assistantInput.focus();
}

function addChatBubble(text, role = 'agent') {
  if (!text) return;
  const div = document.createElement('div');
  div.className = `chat-bubble ${role}`;
  div.innerHTML = text;
  selectors.assistantLog.appendChild(div);
  selectors.assistantLog.scrollTop = selectors.assistantLog.scrollHeight;
}

function addStreamingAgentBubble(fullText) {
  if (!fullText) return;
  const div = document.createElement('div');
  div.className = 'chat-bubble agent';
  selectors.assistantLog.appendChild(div);
  selectors.assistantLog.scrollTop = selectors.assistantLog.scrollHeight;

  const text = fullText.toString();
  let index = 0;
  const total = text.length;
  if (!total) return;
  // Aim for ~3–4 characters every 50ms => ~60–80 chars/sec
  const step = 3;
  const interval = 50;

  const timer = setInterval(() => {
    index += step;
    if (index >= total) {
      div.textContent = text;
      selectors.assistantLog.scrollTop = selectors.assistantLog.scrollHeight;
      clearInterval(timer);
      return;
    }
    div.textContent = text.slice(0, index);
    selectors.assistantLog.scrollTop = selectors.assistantLog.scrollHeight;
  }, interval);
}

function addTypingIndicator() {
  const span = document.createElement('div');
  span.id = 'typing-indicator';
  span.className = 'chat-bubble system';
  span.textContent = 'Assistant is typing…';
  selectors.assistantLog.appendChild(span);
  selectors.assistantLog.scrollTop = selectors.assistantLog.scrollHeight;
}

function removeTypingIndicator() {
  document.getElementById('typing-indicator')?.remove();
}

// Live transcript bubble helpers
function ensureLiveTranscriptBubble() {
  let live = document.getElementById('live-transcript');
  if (!live) {
    live = document.createElement('div');
    live.id = 'live-transcript';
    live.className = 'chat-bubble user';
    // seed with listening dots until words arrive
    live.innerHTML = '<span class="listening-dots"><span></span><span></span><span></span></span>';
    selectors.assistantLog.appendChild(live);
  }
  selectors.assistantLog.scrollTop = selectors.assistantLog.scrollHeight;
  return live;
}

function updateLiveTranscriptBubble(text) {
  const live = ensureLiveTranscriptBubble();
  if (text && text.length) {
    live.textContent = text;
  } else {
    // keep dots when no text yet
    live.innerHTML = '<span class="listening-dots"><span></span><span></span><span></span></span>';
  }
  selectors.assistantLog.scrollTop = selectors.assistantLog.scrollHeight;
}

function finalizeLiveTranscriptBubble() {
  const live = document.getElementById('live-transcript');
  if (live) live.removeAttribute('id');
}

function sanitizeSentence(text) {
  const t = (text || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  const cased = t.charAt(0).toUpperCase() + t.slice(1);
  const hasEnd = /[.!?]$/.test(cased);
  return hasEnd ? cased : `${cased}.`;
}

// Normalize agent reply payloads that may be strings or objects
function extractReplyText(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  // Some backends send { draft: "..." } or { message: "..." }
  if (typeof val === 'object') {
    if (typeof val.draft === 'string') return val.draft;
    if (typeof val.message === 'string') return val.message;
  }
  // If server accidentally sends JSON string, try to parse
  try {
    const parsed = JSON.parse(val);
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.draft === 'string') return parsed.draft;
      if (typeof parsed.message === 'string') return parsed.message;
    }
  } catch {}
  return val.toString ? val.toString() : '';
}

function finalizeUtterance(rawText) {
  const statusEl = document.getElementById('avatar-status');
  const finalText = sanitizeSentence((rawText || '').replace(/\s+/g, ' ').trim());
  if (!finalText || speech.utteranceFinalized) return;
  updateLiveTranscriptBubble(finalText);
  selectors.assistantInput.value = finalText;
  speech.utteranceFinalized = true;
  handleSendMessage(true);
  speech.lastPartialTranscript = '';
  if (statusEl) statusEl.textContent = `You said: "${finalText}"`;
}

async function forwardToAthena(message) {
  addTypingIndicator();
  let data = null;
  try {
    const resp = await fetch('/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: state.customerId,
        message,
        athenaBaseUrl: state.athenaBase,
        source: 'marketplace'
      })
    });
    if (resp.ok) {
      data = await resp.json();
    } else {
      addChatBubble('Support Assistant could not reach Athena. Please retry.', 'system');
    }
  } catch (err) {
    console.warn('forward error', err);
    addChatBubble('Network error contacting Athena, please check connectivity.', 'system');
  } finally {
    removeTypingIndicator();
  }
  if (data?.botReply && data.traceId && !state.processedTraceIds.has(data.traceId)) {
    // Prefer SSE stream for replies; only show POST reply if SSE not connected
    const replyText = extractReplyText(data.botReply);
    if (replyText && !state.sse) {
      addStreamingAgentBubble(replyText);
      if (state.inputMode === 'voice') {
        speakResponse(replyText);
      }
    }
    state.processedTraceIds.add(data.traceId);
  }
}

function handleSendMessage(fromLive = false) {
  const text = selectors.assistantInput.value.trim();
  if (!text || !state.loggedIn) return;
  selectors.assistantInput.value = '';
  selectors.assistantInput.style.height = 'auto';
  // If this came from a live transcript bubble, reuse that bubble
  if (!fromLive) {
    addChatBubble(text, 'user');
  } else {
    const live = document.getElementById('live-transcript');
    if (live) {
      live.removeAttribute('id');
    } else {
      addChatBubble(text, 'user');
    }
  }
  forwardToAthena(text);
  ensureSse();
}

function ensureSse() {
  if (!state.customerId || state.sse) return;
  initSse();
}

function initSse() {
  const url = `${state.athenaBase.replace(/\/+$/, '')}/api/v1/stream/customer-360/${state.customerId}`;
  try {
    state.sse = new EventSource(url);
    state.sse.onopen = () => { state.reconnectAttempts = 0; };
    state.sse.onerror = () => {
      state.sse?.close();
      state.sse = null;
      scheduleReconnect();
    };
    state.sse.onmessage = (evt) => {
      if (!evt.data) return;
      let payload;
      try {
        payload = JSON.parse(evt.data);
      } catch (err) {
        return;
      }
      if (payload.type === 'agentReply') {
        if (payload.traceId && state.processedTraceIds.has(payload.traceId)) return;
        const msgText = extractReplyText(payload.message);
        if (msgText) {
          addStreamingAgentBubble(msgText);
          if (state.inputMode === 'voice') speakResponse(msgText);
        }
        if (payload.traceId) state.processedTraceIds.add(payload.traceId);
        return;
      }
      if (payload.customer360) {
        if (selectors.heroCopy) {
          selectors.heroCopy.textContent = payload.customer360.summary || 'Support signals update in real time as tickets progress.';
        }
        updateHeroMeta(payload.customer360);
        if (payload.customer360.lastMessage) {
          state.timeline.unshift({ title: payload.customer360.lastMessage, timeAgo: 'Just now', ref: '#LIVE' });
          state.timeline = state.timeline.slice(0, 5);
          renderTimeline(state.timeline);
        }
      }
      if (payload.insights) {
        updateInsights({
          sentiment: payload.insights.MINI_INSIGHTS?.sentiment || payload.insights.MINI_INSIGHTS?.status,
          risk: payload.insights.MINI_INSIGHTS?.risk,
          wordcloud: payload.wordcloud || []
        });
      } else if (payload.wordcloud) {
        updateInsights({ wordcloud: payload.wordcloud });
      }
      if (payload.botReply && payload.traceId && !state.processedTraceIds.has(payload.traceId)) {
        const botText = extractReplyText(payload.botReply);
        if (botText) {
          addStreamingAgentBubble(botText);
          if (state.inputMode === 'voice') {
            speakResponse(botText);
          }
        }
        state.processedTraceIds.add(payload.traceId);
      }
    };
  } catch (err) {
    console.warn('SSE init failed', err);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  const delay = Math.min(15000, 1000 * 2 ** state.reconnectAttempts + Math.random() * 500);
  state.reconnectAttempts += 1;
  setTimeout(() => {
    if (!state.sse) initSse();
  }, delay);
}

function handleLogin(e) {
  e.preventDefault();
  const formData = new FormData(selectors.loginForm);
  const email = formData.get('email');
  let customerId = (formData.get('customerId') || '').trim();
  if (!customerId || /^rand(om)?$/i.test(customerId)) {
    customerId = DEMO_CUSTOMER_IDS[Math.floor(Math.random() * DEMO_CUSTOMER_IDS.length)];
  }
  state.loggedIn = true;
  state.customerEmail = email;
  state.customerId = customerId;
  selectors.loginScreen.classList.add('hidden');
  selectors.pageShell.classList.add('active');
  if (selectors.userName) selectors.userName.textContent = email.split('@')[0];
  if (selectors.userId) selectors.userId.textContent = `ID ${customerId}`;
  if (selectors.assistantEyebrow) selectors.assistantEyebrow.textContent = `${state.companyName} Support`;
  if (selectors.assistantTitle) selectors.assistantTitle.textContent = `${state.companyName} Assistant`;
  state.products = pickProducts(customerId);
  state.coverage = buildCoverage(state.products);
  state.timeline = buildTimeline(customerId);
  renderProducts(state.products);
  renderAppCards(state.products);
  renderCoverage(state.coverage);
  renderTimeline(state.timeline);
  if (selectors.appsTotalLicences) {
    const total = state.products.length * 50;
    selectors.appsTotalLicences.textContent = total.toString();
  }
  if (selectors.appsSpend) {
    const spend = state.products.length * 120;
    selectors.appsSpend.textContent = `£${spend.toLocaleString('en-GB')}`;
  }
  if (selectors.appsPremium) {
    const premiumCount = state.products.filter((p) => /priority|same-day|24\/7/i.test(p.coverage)).length;
    selectors.appsPremium.textContent = premiumCount.toString();
  }
  if (selectors.heroTitle) selectors.heroTitle.textContent = `${state.companyName} services for ${customerId}`;
  if (selectors.heroCopy) selectors.heroCopy.textContent = 'Monitor purchased products, service cover, and live interactions in one workspace.';
  addChatBubble(`Hi ${email.split('@')[0]}, this assistant can help with any Vodafone Marketplace subscription.`, 'agent');
  ensureSse();
}

function hydrateFromQuery() {
  const url = new URL(window.location.href);
  const cust = url.searchParams.get('cust');
  const athena = url.searchParams.get('athena');
  if (cust) selectors.loginForm.customerId.value = cust;
  if (athena) state.athenaBase = athena;
  if (!selectors.loginForm.customerId.value) {
    selectors.loginForm.customerId.value = DEMO_CUSTOMER_IDS[0];
  }
}

function autoResizeTextarea() {
  selectors.assistantInput.style.height = 'auto';
  selectors.assistantInput.style.height = `${Math.min(selectors.assistantInput.scrollHeight, 160)}px`;
}

async function initSpeech() {
  const statusEl = document.getElementById('avatar-status');

  if (!navigator.mediaDevices || !window.MediaRecorder) {
    console.warn('MediaRecorder not supported in this browser.');
    if (statusEl) statusEl.textContent = 'Voice capture not supported in this browser.';
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });

    // Initialize AudioContext + Analyser for RMS noise measurement
    try {
      speech.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = speech.audioCtx.createMediaStreamSource(stream);
      speech.analyser = speech.audioCtx.createAnalyser();
      speech.analyser.fftSize = 1024;
      speech.analyser.smoothingTimeConstant = 0.8;
      source.connect(speech.analyser);

      const buf = new Float32Array(speech.analyser.fftSize);
      const sampleNoise = () => {
        if (!speech.analyser) return;
        speech.analyser.getFloatTimeDomainData(buf);
        let sumSq = 0;
        for (let i = 0; i < buf.length; i += 1) {
          const v = buf[i];
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / buf.length);
        // Low-pass filter noise level for stability
        speech.noiseLevel = 0.9 * speech.noiseLevel + 0.1 * rms;
        requestAnimationFrame(sampleNoise);
      };
      requestAnimationFrame(sampleNoise);
    } catch (e) {
      // Non-fatal; continue without RMS adaptation
      console.warn('AudioContext init failed; threshold will not use RMS.', e);
    }

    // Establish WebSocket STT if available; fallback to HTTP
    const sttWsUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/stt/stream';
    try {
      speech.sttSocket = new WebSocket(sttWsUrl);
      speech.sttSocket.onopen = () => {
        console.debug('[STT] WS connected');
      };
      speech.sttSocket.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'partial' && msg.text) {
            speech.lastPartialTranscript = msg.text;
            updateLiveTranscriptBubble(msg.text);
          } else if (msg.type === 'final') {
            finalizeUtterance((msg.text || '').trim() || speech.lastPartialTranscript);
            // Resume listening loop in voice mode
            if (state.inputMode === 'voice' && !speech.ttsActive) {
              if (!speech.isRecording) {
                if (statusEl) statusEl.textContent = 'Listening…';
                toggleMic();
              }
            }
          }
        } catch {}
      };
      speech.sttSocket.onerror = () => {
        console.warn('[STT] WS error; will fallback to HTTP STT.');
        try { speech.sttSocket.close(); } catch {}
        speech.sttSocket = null;
      };
      speech.sttSocket.onclose = () => {
        console.debug('[STT] WS closed');
      };
    } catch (e) {
      console.warn('[STT] WS init failed; fallback to HTTP');
      speech.sttSocket = null;
    }

    recorder.addEventListener('dataavailable', async (evt) => {
      if (evt.data && evt.data.size > 0) {
        speech.audioChunks.push(evt.data);
        // reset silence timer on incoming audio
        if (speech.silenceTimer) clearTimeout(speech.silenceTimer);
        speech.silenceTimer = setTimeout(() => {
          if (speech.isRecording && speech.mediaRecorder && speech.mediaRecorder.state === 'recording') {
            speech.isRecording = false;
            speech.mediaRecorder.stop();
            if (statusEl) statusEl.textContent = 'Processing…';
          }
        }, speechConfig.sttSilenceFinalizeMs);

        // mark audio activity
        turnDetect.lastAudioTs = Date.now();

        // Streaming via WS: send raw chunk to server
        if (speech.sttSocket && speech.sttSocket.readyState === WebSocket.OPEN) {
          speech.sttSocket.send(evt.data);
        } else {
          // Fallback: HTTP partials (existing behavior)
          if (speech.liveTranscriptTimer) return;
          speech.liveTranscriptTimer = setTimeout(async () => {
            speech.liveTranscriptTimer = null;
            try {
              const partialBlob = new Blob(speech.audioChunks, { type: 'audio/webm;codecs=opus' });
              const resp = await fetch('/stt', {
                method: 'POST',
                headers: { 'Content-Type': 'audio/webm;codecs=opus' },
                body: await partialBlob.arrayBuffer()
              });
              if (resp.ok) {
                const { transcript } = await resp.json();
                const text = (transcript || '').trim();
                if (text) {
                  speech.lastPartialTranscript = text;
                  updateLiveTranscriptBubble(text);

                  // update turn detection stats
                  const now = Date.now();
                  const words = text.split(/\s+/).filter(Boolean).length;
                  if (text !== turnDetect.lastText) {
                    turnDetect.lastChangeTs = now;
                    turnDetect.lastText = text;
                  }
                  turnDetect.wordsSpoken = Math.max(turnDetect.wordsSpoken, words);

                  // compute end-of-turn score and proactively stop if high
                  const score = endOfTurnScore(now, text);
                  const thr = dynamicThreshold();
                  if (score >= thr && speech.isRecording && speech.mediaRecorder?.state === 'recording') {
                    speech.isRecording = false;
                    speech.mediaRecorder.stop();
                    if (statusEl) statusEl.textContent = 'Processing…';
                  }
                }
              }
            } catch (err) {
              // ignore partial errors
            }
          }, speechConfig.sttPartialIntervalMs);
        }
      }
    });

    recorder.addEventListener('stop', async () => {
      const micBtn = document.getElementById('mic-button');
      if (micBtn) micBtn.classList.remove('recording');

      const blob = new Blob(speech.audioChunks, { type: 'audio/webm;codecs=opus' });
      speech.audioChunks = [];
      if (speech.silenceTimer) {
        clearTimeout(speech.silenceTimer);
        speech.silenceTimer = null;
      }
      if (speech.liveTranscriptTimer) {
        clearTimeout(speech.liveTranscriptTimer);
        speech.liveTranscriptTimer = null;
      }
      if (speech.maxDurationTimer) {
        clearTimeout(speech.maxDurationTimer);
        speech.maxDurationTimer = null;
      }

      if (statusEl) statusEl.textContent = 'Transcribing…';

      try {
        if (speech.useWsForCurrent) {
          // Ask server to finalize and close via WS; schedule fallback if no final arrives
          try { speech.sttSocket?.send(JSON.stringify({ cmd: 'end' })); } catch {}
          try { speech.sttSocket?.close(); } catch {}
          setTimeout(async () => {
            if (speech.utteranceFinalized) return;
            try {
              const resp = await fetch('/stt', {
                method: 'POST',
                headers: { 'Content-Type': 'audio/webm;codecs=opus' },
                body: await blob.arrayBuffer()
              });
              if (resp.ok) {
                const { transcript } = await resp.json();
                finalizeUtterance((transcript || '').trim() || speech.lastPartialTranscript);
              }
            } catch {}
          }, 1200);
        } else {
          const resp = await fetch('/stt', {
            method: 'POST',
            headers: {
              'Content-Type': 'audio/webm;codecs=opus'
            },
            body: await blob.arrayBuffer()
          });

          if (!resp.ok) {
            throw new Error('STT request failed');
          }

          const { transcript } = await resp.json();
          finalizeUtterance((transcript || '').trim() || speech.lastPartialTranscript);
          if (!speech.utteranceFinalized && statusEl) {
            statusEl.textContent = 'Did not catch that. Please try again.';
          }
        }
      } catch (err) {
        console.error('STT error', err);
        if (statusEl) statusEl.textContent = 'Could not transcribe audio. Please try again.';
      } finally {
        // In voice mode, restart listening after each transcription attempt
        if (state.inputMode === 'voice' && !speech.ttsActive) {
          if (!speech.isRecording) {
            if (statusEl) statusEl.textContent = 'Listening…';
            toggleMic();
          }
        }
        // Keep pendingFinalSend true until a new recording starts
      }
    });

    speech.mediaRecorder = recorder;
    if (statusEl) statusEl.textContent = 'Ready to listen';
    resetTurnDetect();
  } catch (err) {
    console.error('getUserMedia error', err);
    if (statusEl) statusEl.textContent = 'Microphone access denied.';
  }
}

function initAvatarVisualization() {
  const container = document.getElementById('avatar-portrait');
  if (!container || !window.THREE) return;

  const width = container.clientWidth || 96;
  const height = container.clientHeight || 96;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.z = 6;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const particleCount = 400;
  const positions = new Float32Array(particleCount * 3);
  const scales = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i += 1) {
    const r = 1.4 * Math.cbrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    scales[i] = 0.6 + Math.random() * 0.8;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

  const material = new THREE.PointsMaterial({
    color: 0xff004f,
    size: 0.12,
    transparent: true,
    opacity: 0.9,
    depthWrite: false
  });

  const points = new THREE.Points(geometry, material);
  scene.add(points);

  avatarVis.scene = scene;
  avatarVis.camera = camera;
  avatarVis.renderer = renderer;
  avatarVis.points = points;
  avatarVis.baseScale = 1;
  avatarVis.targetScale = 1;
  avatarVis.ready = true;

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    if (!avatarVis.ready) return;
    const t = clock.getElapsedTime();

    // Smooth scale towards target
    const currentScale = avatarVis.points.scale.x;
    const nextScale = currentScale + (avatarVis.targetScale - currentScale) * 0.1;
    avatarVis.points.scale.set(nextScale, nextScale, nextScale);

    // Soft breathing / pulsing
    const pulse = 0.06 * Math.sin(t * 2.3);
    avatarVis.points.rotation.y = t * 0.25;
    avatarVis.points.rotation.x = 0.15 * Math.sin(t * 0.6);
    avatarVis.points.position.z = pulse;

    renderer.render(scene, camera);
  }

  animate();
}

function setAvatarListeningVisual() {
  if (!avatarVis.ready || !avatarVis.points) return;
  avatarVis.targetScale = 1.3;
}

function setAvatarIdleVisual() {
  if (!avatarVis.ready || !avatarVis.points) return;
  avatarVis.targetScale = 1.0;
}

function setAvatarSpeakingVisual() {
  if (!avatarVis.ready || !avatarVis.points) return;
  avatarVis.targetScale = 1.6;
}

function toggleMic() {
  if (!speech.mediaRecorder) return;

  const statusEl = document.getElementById('avatar-status');
  const micBtn = document.getElementById('mic-button');

  // Do not allow recording while TTS is active
  if (speech.ttsActive) {
    if (statusEl) statusEl.textContent = 'Please wait for the assistant to finish speaking.';
    return;
  }

  if (speech.isRecording) {
    speech.isRecording = false;
    speech.mediaRecorder.stop();
    if (speech.silenceTimer) {
      clearTimeout(speech.silenceTimer);
      speech.silenceTimer = null;
    }
    if (speech.maxDurationTimer) {
      clearTimeout(speech.maxDurationTimer);
      speech.maxDurationTimer = null;
    }
    if (statusEl) statusEl.textContent = 'Processing…';
    setAvatarIdleVisual();
    return;
  }

  speech.isRecording = true;
  speech.audioChunks = [];
  if (micBtn) micBtn.classList.add('recording');
  if (statusEl) statusEl.textContent = 'Listening…';
  // Start with a small timeslice so dataavailable fires frequently
  // Ensures live WS streaming and partial updates
  speech.mediaRecorder.start(300);
  // New utterance begins: reset finalization and note WS availability
  speech.utteranceFinalized = false;
  speech.useWsForCurrent = !!(speech.sttSocket && speech.sttSocket.readyState === WebSocket.OPEN);
  setAvatarListeningVisual();
  resetTurnDetect();

  // Hard max duration: stop automatically after configured time
  speech.maxDurationTimer = setTimeout(() => {
    if (speech.isRecording && speech.mediaRecorder && speech.mediaRecorder.state === 'recording') {
      speech.isRecording = false;
      speech.mediaRecorder.stop();
      if (speech.silenceTimer) {
        clearTimeout(speech.silenceTimer);
        speech.silenceTimer = null;
      }
      if (statusEl) statusEl.textContent = 'Processing…';
      setAvatarIdleVisual();
    }
  }, speechConfig.maxDurationMs);
}

function startListeningSafely() {
  const statusEl = document.getElementById('avatar-status');
  if (speech.ttsActive) return;
  if (state.inputMode !== 'voice') {
    if (statusEl) statusEl.textContent = 'Chat mode';
    return;
  }
  if (!speech.isRecording && speech.mediaRecorder) {
    if (statusEl) statusEl.textContent = 'Listening…';
    toggleMic();
  }
}

function playTts(text) {
  return new Promise((resolve) => {
    const statusEl = document.getElementById('avatar-status');
    const avatar = document.getElementById('avatar-portrait');

    const beginTalking = () => {
      speech.ttsActive = true;
      if (statusEl) statusEl.textContent = 'Speaking…';
      if (selectors.avatarPanel && !selectors.avatarPanel.classList.contains('hidden')) {
        selectors.avatarTtsStatus.textContent = 'Speaking…';
        if (selectors.avatarLog) {
          const div = document.createElement('div');
          div.className = 'chat-bubble agent';
          div.textContent = text;
          selectors.avatarLog.appendChild(div);
          selectors.avatarLog.scrollTop = selectors.avatarLog.scrollHeight;
        }
      }
      if (avatar) avatar.classList.add('talking');
      setAvatarSpeakingVisual();
    };

    const endTalking = () => {
      if (avatar) avatar.classList.remove('talking');
      setAvatarListeningVisual();
      if (selectors.avatarPanel && !selectors.avatarPanel.classList.contains('hidden')) {
        selectors.avatarTtsStatus.textContent = state.inputMode === 'voice' ? 'Avatar idle' : 'Chat mode';
      }
      resolve();
    };

    beginTalking();

    fetch('/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('TTS request failed');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.onended = () => { URL.revokeObjectURL(url); endTalking(); };
        audio.onerror = () => { URL.revokeObjectURL(url); endTalking(); };
        audio.play().catch(() => { URL.revokeObjectURL(url); endTalking(); });
      })
      .catch(() => {
        // Fallback to speechSynthesis
        if (!speech.synthesizer) { endTalking(); return; }
        speech.synthesizer.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'en-GB';
        utter.rate = 1.0;
        utter.pitch = 1.0;
        utter.onend = endTalking;
        speech.synthesizer.speak(utter);
      });
  });
}

function speakResponse(text) {
  if (!text) return;
  // Only speak in voice mode
  if (state.inputMode !== 'voice') return;
  const clean = extractReplyText(text);
  if (!clean || !clean.trim()) return;
  speech.ttsQueue.push(clean);
  if (speech.ttsActive) return; // currently speaking, queued
  (async () => {
    speech.ttsActive = true;
    try {
      while (speech.ttsQueue.length) {
        const next = speech.ttsQueue.shift();
        await playTts(next);
      }
    } finally {
      speech.ttsActive = false;
      startListeningSafely();
    }
  })();
}

function wireInteractions() {
  selectors.loginForm.addEventListener('submit', handleLogin);
  selectors.assistantToggle.addEventListener('click', () => toggleAssistant(true));
  selectors.assistantClose.addEventListener('click', () => toggleAssistant(false));
  selectors.assistantSend.addEventListener('click', handleSendMessage);
  selectors.assistantInput.addEventListener('keydown', (evt) => {
    if (evt.key === 'Enter' && !evt.shiftKey) {
      evt.preventDefault();
      handleSendMessage();
    }
  });
  selectors.assistantInput.addEventListener('input', autoResizeTextarea);
  selectors.ctaAssistant?.addEventListener('click', () => toggleAssistant(true));
  selectors.refreshProducts?.addEventListener('click', () => {
    state.products = pickProducts(state.customerId + Date.now());
    state.coverage = buildCoverage(state.products);
    renderProducts(state.products);
    renderAppCards(state.products);
    renderCoverage(state.coverage);
  });

  selectors.viewAllSubscriptions?.addEventListener('click', () => {
    // For demo purposes, always show the full catalog as if purchased
    state.products = PRODUCT_CATALOG.slice(0, 12);
    state.coverage = buildCoverage(state.products);
    renderProducts(state.products);
    renderAppCards(state.products);
    renderCoverage(state.coverage);
  });

  const micButton = document.getElementById('mic-button');
  const modePill = document.getElementById('assistant-mode-pill');
  if (micButton) {
    micButton.addEventListener('click', (evt) => {
      evt.preventDefault();
      const statusEl = document.getElementById('avatar-status');

      if (state.inputMode === 'voice') {
        // Switch to chat mode: stop any recording and disable voice loop
        state.inputMode = 'chat';
        if (speech.isRecording && speech.mediaRecorder) {
          speech.isRecording = false;
          speech.mediaRecorder.stop();
        }
        if (statusEl) statusEl.textContent = 'Chat mode';
        micButton.textContent = '💬 Chat';
        if (modePill) modePill.textContent = 'Chat mode';
      } else {
        // Switch to voice mode: start continuous loop
        state.inputMode = 'voice';
        if (statusEl) statusEl.textContent = 'Listening…';
        micButton.textContent = '🎙️ Voice';
        if (modePill) modePill.textContent = 'Voice mode';
        if (!speech.isRecording) toggleMic();
      }
    });
  }

  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', (evt) => {
      evt.preventDefault();
      const tab = link.dataset.tab;
      navLinks.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');
      const showSupport = tab === 'support';
      if (selectors.businessSection) selectors.businessSection.classList.toggle('hidden', showSupport);
      if (selectors.supportSection) selectors.supportSection.classList.toggle('hidden', !showSupport);
      if (selectors.supportHero) selectors.supportHero.classList.toggle('hidden', !showSupport);
      if (selectors.supportBreadcrumb) selectors.supportBreadcrumb.classList.toggle('hidden', !showSupport);
    });
  });
}

async function bootstrap() {
  wireInteractions();
    hydrateFromQuery();
    // Load server config first so speech timings are ready before initSpeech
  try {
    const resp = await fetch('/config');
    const data = await resp.json();
    if (data.companyName) {
      state.companyName = data.companyName;
      document.title = `${data.companyName} Marketplace Support`;
    }
    if (data.voice) {
      const v = data.voice;
      if (typeof v.maxDurationMs === 'number') speechConfig.maxDurationMs = v.maxDurationMs;
      if (typeof v.sttSilenceFinalizeMs === 'number') speechConfig.sttSilenceFinalizeMs = v.sttSilenceFinalizeMs;
      if (typeof v.sttPartialIntervalMs === 'number') speechConfig.sttPartialIntervalMs = v.sttPartialIntervalMs;
    }
  } catch (err) {
    console.warn('config fetch failed', err);
  }
    // Ensure UI reflects default chat mode on load
    try {
      const statusEl = document.getElementById('avatar-status');
      const micButton = document.getElementById('mic-button');
      const modePill = document.getElementById('assistant-mode-pill');
      if (statusEl) statusEl.textContent = 'Chat mode';
      if (micButton) micButton.textContent = '💬 Chat';
      if (modePill) modePill.textContent = 'Chat mode';
    } catch {}
    initSpeech();
    initAvatarVisualization();
}

document.addEventListener('DOMContentLoaded', bootstrap);
