// Centralised service / product name classification utilities
// Keyword groups externalised to JSON (serviceKeywords.json) with optional environment overrides.
import fs from 'fs';
import path from 'path';

let cachedGroups = null;

function loadDefaultJsonPath(){
  return path.resolve(process.cwd(), 'src', 'config', 'serviceKeywords.json');
}

function loadGroups() {
  if (cachedGroups) return cachedGroups;
  // Environment variable override with direct JSON string
  if (process.env.SERVICE_KEYWORD_GROUPS) {
    try {
      cachedGroups = JSON.parse(process.env.SERVICE_KEYWORD_GROUPS);
      return cachedGroups;
    } catch(e){ /* fallthrough to file */ }
  }
  // External file override path
  const customPath = process.env.SERVICE_KEYWORDS_JSON_PATH;
  const candidatePaths = [customPath, loadDefaultJsonPath()].filter(Boolean);
  for (const p of candidatePaths) {
    try {
      const raw = fs.readFileSync(p, 'utf8');
      cachedGroups = JSON.parse(raw);
      return cachedGroups;
    } catch(e){ /* try next */ }
  }
  // Fallback baked-in defaults if everything fails
  cachedGroups = {
    broadband: ['broadband','fiber','fibre','internet','wifi','fttp','dsl','vdsl','adsl'],
    mobile: ['mobile','cell','sim','handset','5g','4g'],
    tv: ['tv','television','settop','set-top','decoder','settopbox']
  };
  return cachedGroups;
}

export function getKeywordGroups(){
  return loadGroups();
}

// Ordered priority when inferring a generic primary category
const CATEGORY_PRIORITY = ['broadband', 'mobile', 'tv'];

function normalise(str) {
  return String(str || '').toLowerCase();
}

function containsKeyword(name, keywords) {
  const n = normalise(name);
  return keywords.some(k => n.includes(k));
}

export function inferPrimaryService(names = []) {
  const groups = getKeywordGroups();
  const list = names.map(n => normalise(n));
  for (const cat of CATEGORY_PRIORITY) {
    if (groups[cat] && list.some(n => containsKeyword(n, groups[cat]))) return cat;
  }
  return list[0] || 'unknown';
}

export function inferDetailedServiceType(names = []) {
  const groups = getKeywordGroups();
  const list = names.map(n => normalise(n));
  const hasAny = keys => list.some(n => keys.some(k => n.includes(k)));
  if (hasAny(groups.broadband?.filter(k => ['fttp','fiber','fibre'].includes(k)) || ['fttp','fiber','fibre'])) return 'FTTP';
  if (hasAny(groups.broadband?.filter(k => ['dsl','vdsl','adsl'].includes(k)) || ['dsl','vdsl','adsl'])) return 'DSL';
  if (hasAny(groups.broadband || [])) return 'Broadband';
  if (hasAny(groups.mobile || [])) return 'Mobile';
  if (hasAny(groups.tv || [])) return 'TV';
  return 'Broadband';
}

export function deriveServiceContext(names = []) {
  const primaryCategory = inferPrimaryService(names);
  const detailedType = inferDetailedServiceType(names);
  return { primaryCategory, detailedType };
}
