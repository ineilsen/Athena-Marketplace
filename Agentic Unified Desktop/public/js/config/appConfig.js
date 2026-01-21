// Global front-end configuration and tunable constants for Athena Desktop UI
// Centralising hardcoded strings & numeric literals used across modules.

// API endpoints
export const API_ENDPOINTS = {
  agentReply: '/api/v1/agent-reply'
};

// Default / fallback demo customer id (when no active selection yet)
export const DEFAULT_CUSTOMER_ID = 'GB26669607';

// Widgets to request after an agent sends a message (incremental refresh set)
export const WIDGETS_ON_AGENT_MESSAGE = [
  'NEXT_BEST_ACTION',
  'LIVE_PROMPTS',
  'AI_SUMMARY',
  'RESOLUTION_PREDICTOR'
];

// Grader configuration (tone / empathy / clarity heuristic)
export const GRADER_CONFIG = {
  empathy: {
    // Keywords to score empathy (regex OR grouped later)
    keywords: [
      'sorry', 'understand', 'frustrating', 'apologize', 'clarify', 'patience', 'sorted'
    ],
    weightPerMatch: 40
  },
  thresholds: {
    warning: 70,
    negative: 40
  },
  toneDefault: 80,
  clarity: {
    base: 100,
    min: 20
  }
};

// Chat UI behaviour
export const CHAT_UI = {
  inputMinHeightPx: 120,
  inputResize: 'vertical'
};

// Rich text / formatting styles (kept minimal; extend if more theming needed)
export const RICH_TEXT_STYLES = {
  heading: 'display:block;margin:6px 0 2px;font-size:.75rem;letter-spacing:.5px;text-transform:uppercase;color:var(--bt-purple);'
};

// Event channel names used for cross-module communication
export const EVENTS = {
  conversationChanged: 'conversationChanged',
  insightsPartialUpdate: 'insightsPartialUpdate',
  insertPromptToChat: 'insertPromptToChat',
  insertComposerText: 'insertComposerText'
};

// Role constants (if further role types added later, centralise here)
export const ROLES = {
  agent: 'agent',
  customer: 'customer'
};

// Utility helper to resolve current active customer id with fallback.
export function getActiveCustomerIdSafe() {
  try {
    if (typeof window !== 'undefined') {
      if (typeof window.getActiveCustomerId === 'function') return window.getActiveCustomerId() || DEFAULT_CUSTOMER_ID;
      if (window.activeCustomerId) return window.activeCustomerId;
    }
  } catch(_) { /* ignore */ }
  return DEFAULT_CUSTOMER_ID;
}
