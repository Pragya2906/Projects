/**********************************************
  Symfy - Advanced script.js (Final)
  Version: Rule-based matcher + domain gating + sex gating
  Notes: Drop-in replacement for your current script1.js
**********************************************/

/* ========== CONFIG ========== */
const CONFIG = {
  MATCH_THRESHOLD: 25,    // minimum % to include in results
  MAX_RESULTS: 4,         // maximum number of conditions to show
  EMERGENCY_THRESHOLD: 90,
  WEIGHTS: {
    symptomExact: 1.0,
    symptomTextPartial: 0.5,
    keywordFull: 0.8,
    requiredPenalty: -2.0,
    contradictionPenalty: -0.7,
    comboBoost: 1.5,
    severityBoost: { mild: 0, moderate: 3, severe: 6 },
    durationBoost: {
      'few-hours': 0,
      '1-day': 0,
      '2-3-days': 1,
      'week': 2,
      'weeks': 3,
      'months': 2
    },
    onsetBoost: { sudden: 1, gradual: 0 }
  },
  CONTRADICTIONS: [
    ['fever', 'no-fever'] // placeholder
  ]
};

/* ========== CONDITIONS DATABASE ========== */
/*
   name, symptoms, keywords, requiredSymptoms, severity,
   typicalDuration, description, advice, homeRemedies, domains

   domains examples:
   - "gi"          – digestive
   - "respiratory" – lungs/airways
   - "urinary"
   - "mental"
   - "cardiac", "cardiac-like"
   - "joint", "musculoskeletal"
   - "neuro"
   - "hormonal"
   - "general"
*/

const conditionsDatabase = [
  {
    name: "Common Cold",
    symptoms: ["cough", "sore-throat", "fatigue", "headache", "congestion"],
    keywords: ["cold", "runny-nose", "sneezing"],
    requiredSymptoms: [],
    severity: "mild",
    typicalDuration: "week",
    description: "A viral infection of the upper respiratory tract, typically lasting about a week.",
    advice: "Rest, drink fluids, and use over-the-counter remedies for symptom relief. See a doctor if symptoms worsen or last more than 10 days.",
    homeRemedies: ["Warm fluids", "Steam inhalation", "Saline nasal spray"],
    domains: ["respiratory", "general"]
  },
  {
    name: "Influenza (Flu)",
    symptoms: ["fever", "fatigue", "cough", "sore-throat", "headache", "chills", "body-aches"],
    keywords: ["flu", "influenza", "viral-fever"],
    requiredSymptoms: ["fever"],
    severity: "moderate",
    typicalDuration: "week",
    description: "Contagious respiratory illness caused by influenza viruses.",
    advice: "Rest, fluids, and early antiviral treatment if prescribed. Seek care for breathing difficulty or persistent high fever.",
    homeRemedies: ["Rest", "Warm broths", "Fever reducers (as advised)"],
    domains: ["respiratory", "general"]
  },
  {
    name: "Pneumonia",
    symptoms: ["cough", "fever", "shortness-breath", "chest-pain", "fatigue", "chills"],
    keywords: ["pneumonia", "lung-infection"],
    requiredSymptoms: ["cough", "fever"],
    severity: "serious",
    typicalDuration: "weeks",
    description: "Infection that inflames air sacs in the lungs; can be viral or bacterial.",
    advice: "Urgent medical evaluation is advised, especially for breathing difficulty, chest pain, or persistent high fever.",
    homeRemedies: ["Rest", "Humidified air", "Fluids (in addition to medical treatment)"],
    domains: ["respiratory", "cardiac-like"]
  },
  {
    name: "Heart-Related Concerns",
    symptoms: ["chest-pain", "palpitations", "irregular-heartbeat", "shortness-breath", "swelling"],
    keywords: ["heart", "cardiac", "angina", "myocardial-infarction"],
    requiredSymptoms: ["chest-pain"],
    severity: "serious",
    typicalDuration: "few-hours",
    description: "Symptoms may indicate heart-related problems that require urgent evaluation.",
    advice: "If chest pain is severe, crushing, or radiates to arm/jaw, or if breathing is difficult, seek emergency care immediately.",
    homeRemedies: ["Rest", "Loosen tight clothing", "Seek emergency help if severe"],
    domains: ["cardiac", "cardiac-like"]
  },
  {
    name: "Asthma / Reactive Airway",
    symptoms: ["shortness-breath", "wheezing", "cough", "chest-pain"],
    keywords: ["asthma", "bronchospasm"],
    requiredSymptoms: ["shortness-breath"],
    severity: "moderate",
    typicalDuration: "few-hours",
    description: "Airway hyperreactivity causing breathlessness and wheeze.",
    advice: "Use a rescue inhaler if prescribed. Seek urgent care if symptoms are severe or do not improve.",
    homeRemedies: ["Sit upright", "Avoid known triggers", "Use inhaler if available"],
    domains: ["respiratory"]
  },
  {
    name: "Bronchitis",
    symptoms: ["cough", "fatigue", "chest-pain", "sputum"],
    keywords: ["bronchitis"],
    requiredSymptoms: ["cough"],
    severity: "moderate",
    typicalDuration: "week",
    description: "Inflammation of the bronchi leading to a persistent cough.",
    advice: "Rest, fluids, and medical review if the cough is prolonged, very productive, or associated with high fever.",
    homeRemedies: ["Humidifier", "Warm fluids"],
    domains: ["respiratory"]
  },
  {
    name: "Gastroenteritis (Stomach Flu)",
    symptoms: ["nausea", "vomiting", "diarrhea", "abdominal-pain", "fever"],
    keywords: ["stomach-flu", "food-poisoning"],
    requiredSymptoms: ["nausea", "vomiting", "diarrhea"],
    severity: "moderate",
    typicalDuration: "2-3-days",
    description: "Inflammation of the digestive tract causing nausea, vomiting, and diarrhea.",
    advice: "Focus on hydration with oral rehydration solutions. Seek care for signs of dehydration or blood in stool.",
    homeRemedies: ["BRAT diet", "Oral rehydration", "Ginger tea"],
    domains: ["gi"]
  },
  {
    name: "Functional Bloating / Indigestion",
    symptoms: ["bloating", "abdominal-pain", "constipation"],
    keywords: ["gas", "indigestion", "acidity"],
    requiredSymptoms: ["bloating"],
    severity: "mild",
    typicalDuration: "few-days",
    description: "Bloating and discomfort often related to diet, gas, or mild indigestion.",
    advice: "Adjust diet, eat smaller meals, and monitor triggers. Seek care if pain is severe or persistent.",
    homeRemedies: ["Warm water", "Light, low-fat meals", "Avoid gas-forming foods"],
    domains: ["gi"]
  },
  {
    name: "Migraine",
    symptoms: ["headache", "nausea", "dizziness", "sensitivity-light", "unilateral-pain"],
    keywords: ["migraine", "severe-headache", "throbbing"],
    requiredSymptoms: ["headache"],
    severity: "moderate",
    typicalDuration: "few-hours",
    description: "Neurological headache often with nausea, light sensitivity, or one-sided throbbing pain.",
    advice: "Rest in a dark, quiet room and use any prescribed migraine medication. Seek care for sudden worst-ever headache.",
    homeRemedies: ["Dark quiet room", "Cold compress", "Hydration"],
    domains: ["neuro"]
  },
  {
    name: "Urinary Tract Infection (UTI)",
    symptoms: ["painful-urination", "frequent-urination", "urgency", "abdominal-pain", "blood-urine"],
    keywords: ["uti", "bladder-infection"],
    requiredSymptoms: ["painful-urination", "frequent-urination"],
    severity: "moderate",
    typicalDuration: "few-days",
    description: "Infection of the urinary tract, often requiring antibiotics.",
    advice: "Consult a doctor for diagnosis and treatment. Drink plenty of fluids unless otherwise advised.",
    homeRemedies: ["Hydration", "Unsweetened cranberry (if tolerated)", "Warm compress for pain"],
    domains: ["urinary"]
  },
  {
    name: "Anxiety Disorder / Panic",
    symptoms: ["anxiety", "palpitations", "shortness-breath", "dizziness", "sweating"],
    keywords: ["panic", "panic-attack", "anxiety"],
    requiredSymptoms: [],
    severity: "moderate",
    typicalDuration: "few-hours",
    description: "Excessive worry or sudden episodes of intense fear with physical symptoms.",
    advice: "Short term: breathing and grounding exercises. Long term: consider mental health support.",
    homeRemedies: ["Breathing exercises", "Grounding techniques", "Limit caffeine"],
    domains: ["mental", "cardiac-like"]
  },
  {
    name: "Depression",
    symptoms: ["depression", "fatigue", "loss-interest", "sleep-issues", "mood-swings"],
    keywords: ["depressed", "low-mood"],
    requiredSymptoms: ["depression", "loss-interest"],
    severity: "moderate",
    typicalDuration: "months",
    description: "Persistent low mood and loss of interest affecting daily life.",
    advice: "Seek professional mental health support. Therapy and medication can be very helpful.",
    homeRemedies: ["Regular routine", "Gentle exercise", "Daylight exposure"],
    domains: ["mental"]
  },
  {
    name: "Arthritis",
    symptoms: ["joint-pain", "stiffness", "swelling"],
    keywords: ["arthritis", "joint-inflammation"],
    requiredSymptoms: ["joint-pain"],
    severity: "moderate",
    typicalDuration: "weeks",
    description: "Inflammation of the joints causing pain and stiffness.",
    advice: "Consult a doctor if symptoms persist. Gentle movement and weight management can help.",
    homeRemedies: ["Warm/cold compress", "Gentle exercise", "Omega-3 rich diet"],
    domains: ["joint", "musculoskeletal"]
  },
  {
    name: "Lower Back Muscle Strain",
    symptoms: ["back-pain", "stiffness", "muscle-pain"],
    keywords: ["back-strain", "pulled-muscle"],
    requiredSymptoms: ["back-pain"],
    severity: "mild",
    typicalDuration: "few-days",
    description: "Strain of the lower back muscles, often from posture or lifting.",
    advice: "Rest from heavy lifting, maintain gentle movement, and consider ergonomic adjustments.",
    homeRemedies: ["Warm or cold packs", "Gentle stretching", "Avoid heavy lifting"],
    domains: ["musculoskeletal", "joint"]
  },

  /* ========== FEMALE HORMONAL / REPRODUCTIVE CONDITIONS ========== */

  {
    name: "Premenstrual Syndrome (PMS)",
    symptoms: ["bloating", "abdominal-pain", "back-pain", "mood-swings", "headache", "fatigue"],
    keywords: ["pms", "premenstrual"],
    requiredSymptoms: ["mood-swings"],
    severity: "mild",
    typicalDuration: "few-days",
    description: "Physical and emotional symptoms occurring before menstruation.",
    advice: "Track your cycle, maintain sleep and nutrition, and consult a doctor if symptoms are severe.",
    homeRemedies: ["Light exercise", "Warm compress on abdomen or back", "Balanced, low-salt diet"],
    domains: ["hormonal", "gi", "general"]
  },
  {
    name: "Dysmenorrhea (Menstrual Cramps)",
    symptoms: ["abdominal-pain", "back-pain", "painful-periods", "heavy-bleeding", "nausea", "fatigue"],
    keywords: ["period-pain", "menstrual-cramps", "cramps"],
    requiredSymptoms: ["abdominal-pain", "painful-periods"],
    severity: "moderate",
    typicalDuration: "few-days",
    description: "Cramping pain before or during menstrual periods.",
    advice: "Use heat, rest, and OTC pain relief if appropriate. Seek gynecological advice if pain is severe or disabling.",
    homeRemedies: ["Warm compress on lower abdomen or back", "Gentle stretching", "Hydration"],
    domains: ["hormonal", "gi"]
  },
  {
    name: "PCOS Flare-up (Polycystic Ovary Syndrome)",
    symptoms: ["irregular-periods", "bloating", "acne", "excess-hair", "weight-gain", "fatigue"],
    keywords: ["pcos", "polycystic"],
    requiredSymptoms: ["irregular-periods"],
    severity: "moderate",
    typicalDuration: "months",
    description: "Hormonal condition that can cause irregular periods, acne, bloating, and hair changes.",
    advice: "Long term management usually requires gynecological or endocrinology follow-up.",
    homeRemedies: ["Regular physical activity", "Balanced diet", "Weight management (if advised)"],
    domains: ["hormonal", "general"]
  },
  {
    name: "Hormonal Imbalance (Suspected)",
    symptoms: ["mood-swings", "fatigue", "acne", "bloating", "irregular-periods", "sleep-issues"],
    keywords: ["hormonal-imbalance"],
    requiredSymptoms: ["mood-swings"],
    severity: "moderate",
    typicalDuration: "weeks",
    description: "Pattern suggests a hormonal influence, but an exact diagnosis requires medical evaluation.",
    advice: "Track cycles and symptoms and consult a doctor for hormonal evaluation.",
    homeRemedies: ["Consistent sleep schedule", "Stress management", "Balanced nutrition"],
    domains: ["hormonal", "general"]
  }
];

/* ========== SPELLING & PHRASE NORMALIZATION ========== */
const spellingCorrections = {
  'hedache': 'headache', 'headach': 'headache',
  'stomak': 'abdominal-pain', 'stomache': 'abdominal-pain',
  'cof': 'cough', 'caugh': 'cough',
  'fevor': 'fever', 'nauseous': 'nausea',
  'dizzy': 'dizziness', 'tired': 'fatigue',
  'exhausted': 'fatigue', 'pcos': 'pcos',
  'facial hair': 'excess-hair', 'chin hair': 'excess-hair',
  'period': 'irregular-periods',
  'thyroid': 'hypothyroidism',
  'chest tightness': 'chest-pain',
  'throbbing pain on one side': 'unilateral-pain'
};

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeFreeText(text) {
  if (!text) return { raw: '', normalized: '', tokens: [] };
  let s = text.toLowerCase().trim();

  const keys = Object.keys(spellingCorrections).sort((a, b) => b.length - a.length);
  keys.forEach(k => {
    const v = spellingCorrections[k];
    const pattern = new RegExp('\\b' + escapeRegex(k) + '\\b', 'gi');
    s = s.replace(pattern, v);
  });

  s = s.replace(/[,.;:!()?]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  const tokens = s.split(' ').map(t => t.replace(/\s+/g, '-'));

  return { raw: text, normalized: s.replace(/ /g, '-'), tokens };
}

/* ========== COMBINATION RULES ========== */
const comboRules = [
  { combo: ['chest-pain', 'shortness-breath'], boostConditions: ['Pneumonia', 'Heart-Related Concerns', 'Asthma / Reactive Airway', 'Bronchitis'], boostValue: CONFIG.WEIGHTS.comboBoost },
  { combo: ['nausea', 'vomiting', 'diarrhea'], boostConditions: ['Gastroenteritis (Stomach Flu)'], boostValue: CONFIG.WEIGHTS.comboBoost },
  { combo: ['headache', 'sensitivity-light', 'nausea'], boostConditions: ['Migraine'], boostValue: CONFIG.WEIGHTS.comboBoost },
  { combo: ['painful-urination', 'frequent-urination'], boostConditions: ['Urinary Tract Infection (UTI)'], boostValue: CONFIG.WEIGHTS.comboBoost }
];

/* ========== DOMAIN INFERENCE ========== */
function inferUserDomains(selectedSet, other) {
  const domains = new Set();

  function hasSym(sym) {
    return selectedSet.has(sym) || other.tokens.includes(sym);
  }

  // GI
  const giSymptoms = ['nausea', 'vomiting', 'diarrhea', 'abdominal-pain', 'bloating', 'constipation'];
  if (giSymptoms.some(hasSym)) domains.add('gi');

  // Urinary
  const urinarySymptoms = ['painful-urination', 'frequent-urination', 'urgency', 'blood-urine'];
  if (urinarySymptoms.some(hasSym)) domains.add('urinary');

  // Respiratory
  const respSymptoms = ['cough', 'sore-throat', 'congestion', 'shortness-breath', 'wheezing', 'chest-pain'];
  if (respSymptoms.some(hasSym)) domains.add('respiratory');

  // Neuro / Head
  const neuroSymptoms = ['headache', 'dizziness', 'confusion', 'memory-loss', 'numbness', 'blurred-vision', 'double-vision', 'eye-pain', 'sensitivity-light'];
  if (neuroSymptoms.some(hasSym)) domains.add('neuro');

  // Cardiac-like
  const cardiacLike = ['chest-pain', 'palpitations', 'irregular-heartbeat', 'shortness-breath', 'swelling'];
  if (cardiacLike.some(hasSym)) domains.add('cardiac-like');
  if (['palpitations', 'irregular-heartbeat'].some(hasSym)) domains.add('cardiac');

  // Joint / Musculoskeletal
  const jointSymptoms = ['joint-pain', 'stiffness', 'swelling', 'back-pain', 'muscle-pain', 'weakness'];
  if (jointSymptoms.some(hasSym)) {
    domains.add('joint');
    domains.add('musculoskeletal');
  }

  // Mental-health
  const mentalSymptoms = ['anxiety', 'depression', 'sleep-issues', 'mood-swings', 'loss-interest'];
  if (mentalSymptoms.some(hasSym)) domains.add('mental');

  // Hormonal / reproductive
  const hormonalSymptoms = [
    'irregular-periods', 'missed-periods', 'painful-periods', 'heavy-bleeding',
    'hot-flashes', 'low-libido', 'bloating', 'mood-swings', 'acne', 'excess-hair'
  ];
  if (hormonalSymptoms.some(hasSym)) domains.add('hormonal');

  // General illness
  const generalSymptoms = ['fever', 'fatigue', 'chills', 'body-aches', 'night-sweats', 'weight-loss', 'weight-gain'];
  if (generalSymptoms.some(hasSym)) domains.add('general');

  return domains;
}

/* ========== MATCHING ENGINE ========== */
function matchConditions(selectedSymptoms, otherSymptomRaw = '', severity = '', duration = '', onset = '', sex = '') {
  const other = normalizeFreeText(otherSymptomRaw);
  const selectedSet = new Set((selectedSymptoms || []).map(s => s.trim()).filter(Boolean));
  const userDomains = inferUserDomains(selectedSet, other);
  const results = [];

  function tokenInFreeText(token) {
    if (!token) return false;
    return other.tokens.includes(token) || other.normalized.includes(token);
  }

  conditionsDatabase.forEach(condition => {
    let rawScore = 0;
    const matchedSymptoms = [];
    const missingRequired = [];

    // 1) Symptom matches
    condition.symptoms.forEach(sym => {
      if (selectedSet.has(sym)) {
        rawScore += CONFIG.WEIGHTS.symptomExact;
        matchedSymptoms.push(sym);
      } else if (tokenInFreeText(sym)) {
        rawScore += CONFIG.WEIGHTS.symptomTextPartial;
        matchedSymptoms.push(sym + ' (text)');
      }
    });

    // 2) Keywords
    condition.keywords.forEach(kw => {
      const normKw = kw.replace(/\s+/g, '-');
      if (other.normalized && other.normalized.includes(normKw)) {
        rawScore += CONFIG.WEIGHTS.keywordFull;
      }
    });

    // 3) Required symptoms
    if (Array.isArray(condition.requiredSymptoms) && condition.requiredSymptoms.length > 0) {
      condition.requiredSymptoms.forEach(rs => {
        const present = selectedSet.has(rs) || tokenInFreeText(rs);
        if (!present) missingRequired.push(rs);
      });
      if (missingRequired.length) {
        const penalty = CONFIG.WEIGHTS.requiredPenalty * (missingRequired.length / condition.requiredSymptoms.length);
        rawScore += penalty;
      }
    }

    // 4) Contradictions
    CONFIG.CONTRADICTIONS.forEach(pair => {
      const [a, b] = pair;
      if (selectedSet.has(a) && selectedSet.has(b)) {
        rawScore += CONFIG.WEIGHTS.contradictionPenalty;
      }
    });

    // 5) Combo rules
    comboRules.forEach(rule => {
      const comboPresent = rule.combo.every(token => selectedSet.has(token) || tokenInFreeText(token));
      if (comboPresent && rule.boostConditions.includes(condition.name)) {
        rawScore += CONFIG.WEIGHTS.comboBoost;
      }
    });

    // 6) Severity boost
    rawScore += CONFIG.WEIGHTS.severityBoost[condition.severity] || 0;

    // 7) Duration / onset
    if (duration && condition.typicalDuration && duration === condition.typicalDuration) {
      rawScore += CONFIG.WEIGHTS.durationBoost[duration] || 0;
    } else if (duration && condition.typicalDuration) {
      if (duration.includes('day') && condition.typicalDuration.includes('day')) rawScore += 0.5;
      if (duration.includes('week') && condition.typicalDuration.includes('week')) rawScore += 0.5;
    }
    if (onset && CONFIG.WEIGHTS.onsetBoost[onset]) rawScore += CONFIG.WEIGHTS.onsetBoost[onset];

    // 8) Compute match %
    const symptomCount = Math.max(condition.symptoms.length, 1);
    const maxPossibleBaseline = symptomCount * CONFIG.WEIGHTS.symptomExact + CONFIG.WEIGHTS.keywordFull;
    let matchPercent = Math.round(Math.max(0, Math.min(100, (rawScore / maxPossibleBaseline) * 100)));
    if (rawScore <= 0) matchPercent = 0;

    // 9) Emergency flag
    let emergencyFlag = false;
    if (condition.severity === 'serious' && matchPercent >= 60) emergencyFlag = true;
    if ((selectedSet.has('chest-pain') || tokenInFreeText('chest-pain')) &&
        (selectedSet.has('shortness-breath') || tokenInFreeText('shortness-breath'))) {
      if (condition.name === 'Heart-Related Concerns' || condition.name === 'Pneumonia') emergencyFlag = true;
    }

    // 10) Domain gating
    const condDomains = condition.domains || [];
    let allowedByDomain = true;

    if (condDomains.length) {
      const isGeneralish = condDomains.includes('general');
      if (!isGeneralish) {
        const hasOverlap = condDomains.some(d => userDomains.has(d));
        if (!hasOverlap) {
          allowedByDomain = false;
        }
      }
    }

    // 11) Mental health gating (safety)
    const isMentalCondition = condDomains.includes('mental');
    if (isMentalCondition) {
      const mentalSymptoms = ['anxiety', 'depression', 'sleep-issues', 'mood-swings', 'loss-interest', 'palpitations'];
      const hasMentalSymptom = mentalSymptoms.some(s => selectedSet.has(s) || tokenInFreeText(s));
      if (!hasMentalSymptom) allowedByDomain = false;
    }

    // 12) Hormonal sex gating
    const isHormonalCondition = condDomains.includes('hormonal');
    if (isHormonalCondition && sex && sex !== 'female') {
      allowedByDomain = false;
    }

    if (allowedByDomain && rawScore > 0 && matchPercent >= 1) {
      results.push({
        condition,
        rawScore,
        matchPercent,
        matchedSymptoms,
        missingRequired,
        emergencyFlag
      });
    }
  });

  // Sort
  const sevRank = { serious: 3, moderate: 2, mild: 1 };
  results.sort((a, b) => {
    if (b.matchPercent !== a.matchPercent) return b.matchPercent - a.matchPercent;
    if ((sevRank[b.condition.severity] || 0) !== (sevRank[a.condition.severity] || 0)) {
      return (sevRank[b.condition.severity] || 0) - (sevRank[a.condition.severity] || 0);
    }
    return b.rawScore - a.rawScore;
  });

  const filtered = results.filter(r => r.matchPercent >= CONFIG.MATCH_THRESHOLD);
  return filtered.slice(0, CONFIG.MAX_RESULTS);
}

/* ========== UI HELPERS ========== */
function updateCharCounter() {
  const textarea = document.getElementById('otherSymptom');
  const counter = document.getElementById('charCounter');
  if (!textarea || !counter) return;
  const length = textarea.value.length;
  counter.textContent = `${length} / 300`;
  counter.classList.toggle('warning', length >= 280);
}

function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  if (!errorDiv) return;
  errorDiv.textContent = message;
  errorDiv.classList.add('show');
  setTimeout(() => errorDiv.classList.remove('show'), 6000);
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

/* ========== DISPLAY RESULTS ========== */
function displayResults(selectedSymptoms, otherSymptomRaw, severity, duration, onset, sex) {
  const matches = matchConditions(selectedSymptoms, otherSymptomRaw, severity, duration, onset, sex);
  const resultsContent = document.getElementById('resultsContent');
  if (!resultsContent) return;

  let html = '<div class="selected-symptoms"><h4>Your Reported Symptoms:</h4>';

  if (selectedSymptoms && selectedSymptoms.length) {
    selectedSymptoms.forEach(sym => {
      const label = document.querySelector(`label[for="${sym}"]`);
      html += `<span class="symptom-tag">${label ? label.textContent : sym}</span>`;
    });
  }
  if (otherSymptomRaw) {
    html += `<span class="symptom-tag">Other: ${otherSymptomRaw.substring(0, 40)}${otherSymptomRaw.length > 40 ? '...' : ''}</span>`;
  }
  if (severity || duration || onset || sex) {
    html += `<div style="margin-top:10px; font-size:0.9em; color:#495057;">`;
    if (sex) html += `<strong>Sex:</strong> ${sex.charAt(0).toUpperCase() + sex.slice(1)} | `;
    if (severity) html += `<strong>Severity:</strong> ${capitalize(severity)} | `;
    if (duration) html += `<strong>Duration:</strong> ${duration.replace(/-/g, ' ')} | `;
    if (onset) html += `<strong>Onset:</strong> ${capitalize(onset)}`;
    html += `</div>`;
  }
  html += '</div>';

  if (!matches.length) {
    html += `
      <div class="result-card">
        <h3>🔍 No Confident Match</h3>
        <p>Your symptoms do not strongly match any specific condition in Symfy’s database.</p>
        <p>They may be hormonal, digestive, lifestyle-related, or may require more detailed evaluation.</p>
        <div class="advice-box">
          <strong>⚕️ Recommended Action:</strong>
          <p>Consider adding more details about your symptoms, or consult a healthcare provider for a proper medical assessment.</p>
        </div>
      </div>
    `;
  } else {
    matches.forEach((m, idx) => {
      const sevClass = `severity-${m.condition.severity}`;
      html += `
        <div class="result-card">
          <span class="severity-badge ${sevClass}">${m.condition.severity.toUpperCase()}</span>
          <h3>${idx + 1}. ${m.condition.name}</h3>
          <p><strong>Match:</strong> ${m.matchPercent}%</p>
          <p>${m.condition.description}</p>
          <div class="advice-box">
            <strong>💡 Recommended Action:</strong>
            <p>${m.condition.advice}</p>
          </div>
          <div class="home-remedies-box">
            <strong>🩺 Home Remedies & Self-Care</strong>
            <ul>
              ${m.condition.homeRemedies.map(r => `<li>${r}</li>`).join('')}
            </ul>
            <div class="home-remedies-disclaimer">⚠️ These suggestions help manage symptoms but do not replace medical care.</div>
          </div>
        </div>
      `;
    });
  }

  // General guidance
  const guidance = getGeneralHealthGuidance(selectedSymptoms || []);
  html += `
    <div class="general-health-section">
      <h3>🥗 What To Do After Identifying Your Symptoms</h3>
      <div class="self-care-grid">
        <div class="self-care-card">
          <h4>💧 Hydration</h4>
          <ul>${guidance.hydration.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>
        <div class="self-care-card">
          <h4>🍎 Nutrition</h4>
          <ul>${guidance.nutrition.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>
        <div class="self-care-card">
          <h4>😴 Rest</h4>
          <ul>${guidance.rest.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>
        <div class="self-care-card">
          <h4>⚠️ Things to Avoid</h4>
          <ul>${guidance.avoid.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>
      </div>
      <div class="general-disclaimer">
        These are general recommendations only and are not a substitute for professional medical advice.
      </div>
    </div>
  `;

  // Emergency block
  const anyEmergency = matches.some(m => m.emergencyFlag) || severity === 'severe';
  if (anyEmergency) {
    html += `
      <div class="result-card" style="border-left:5px solid #dc3545; background:#fff5f5;">
        <h3 style="color:#dc3545;">⚠️ Emergency Warning</h3>
        <p><strong>Seek immediate medical care if you have any of these:</strong></p>
        <ul style="margin-left:20px; color:#842029;">
          <li>Severe difficulty breathing</li>
          <li>Severe or crushing chest pain</li>
          <li>Loss of consciousness or confusion</li>
          <li>Worsening high fever not responding to medicines</li>
        </ul>
      </div>
    `;
  }

  resultsContent.innerHTML = html;
  const formEl = document.getElementById('symptomForm');
  if (formEl) formEl.style.display = 'none';
  const resultsEl = document.getElementById('results');
  if (resultsEl) {
    resultsEl.classList.add('show');
    resultsEl.scrollIntoView({ behavior: 'smooth' });
  }
}

/* Light general guidance generator */
function getGeneralHealthGuidance(selectedSymptoms) {
  const guidance = { hydration: [], nutrition: [], rest: [], homeRemedies: [], avoid: [] };
  const hasResp = selectedSymptoms.some(s => ['cough', 'sore-throat', 'congestion', 'shortness-breath', 'wheezing'].includes(s));
  const hasDigest = selectedSymptoms.some(s => ['nausea', 'vomiting', 'diarrhea', 'abdominal-pain', 'bloating'].includes(s));
  const hasFever = selectedSymptoms.includes('fever');
  const hasFatigue = selectedSymptoms.includes('fatigue');
  const hasHeadache = selectedSymptoms.includes('headache');

  if (hasFever || hasDigest || hasFatigue) {
    guidance.hydration.push('Drink plenty of fluids (water, oral rehydration solutions if vomiting/diarrhea).');
  }
  if (hasResp) guidance.hydration.push('Warm liquids may soothe the throat and help with mucus.');
  if (hasDigest) guidance.hydration.push('Take small sips frequently to avoid triggering nausea.');

  if (hasDigest) guidance.nutrition.push('Prefer bland, easy-to-digest foods (bananas, rice, toast).');
  else guidance.nutrition.push('Focus on light, nutritious meals and avoid very heavy or fried foods until you feel better.');

  guidance.rest.push('Aim for enough sleep and avoid strenuous activity while unwell.');
  guidance.homeRemedies.push('Maintain a clean, comfortable environment and good hygiene.');

  if (hasDigest || hasHeadache) guidance.avoid.push('Avoid caffeine and alcohol while recovering.');
  if (hasResp) guidance.avoid.push('Avoid smoking and exposure to secondhand smoke.');

  return guidance;
}

/* ========== FORM / EVENT HANDLERS ========== */
function getSelectedSymptomsFromForm() {
  const cbs = Array.from(document.querySelectorAll('input[name="symptom"]:checked'));
  return cbs.map(cb => cb.value);
}

function handleSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const selectedSymptoms = getSelectedSymptomsFromForm();
  const otherRaw = (document.getElementById('otherSymptom') && document.getElementById('otherSymptom').value) || '';
  const severity = document.getElementById('severity') ? document.getElementById('severity').value : '';
  const duration = document.getElementById('duration') ? document.getElementById('duration').value : '';
  const onset = document.getElementById('onset') ? document.getElementById('onset').value : '';
  const sex = document.getElementById('sex') ? document.getElementById('sex').value : '';

  if ((!selectedSymptoms || selectedSymptoms.length === 0) && !otherRaw.trim()) {
    showError('Please select at least one symptom or describe your symptoms in the "Other Symptoms" field.');
    return;
  }

  if (otherRaw && otherRaw.trim().length > 0 && otherRaw.trim().length < 2 &&
      (!selectedSymptoms || selectedSymptoms.length === 0)) {
    showError('Please provide more detail about your symptoms or select from the options.');
    return;
  }

  displayResults(selectedSymptoms, otherRaw, severity, duration, onset, sex);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('symptomForm');
  if (form) form.addEventListener('submit', handleSubmit);

  const txt = document.getElementById('otherSymptom');
  if (txt) {
    txt.addEventListener('input', updateCharCounter);
    txt.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
        handleSubmit(ev);
      }
    });
  }

  window.quickTest = quickTest;
  window.runTest = runTest;
});

/* Reset and checkAgain functions */
function resetForm() {
  const form = document.getElementById('symptomForm');
  if (form) form.reset();
  const counter = document.getElementById('charCounter');
  if (counter) {
    counter.textContent = '0 / 300';
    counter.classList.remove('warning');
  }
  const err = document.getElementById('errorMessage');
  if (err) err.classList.remove('show');
}

function checkAgain() {
  const formEl = document.getElementById('symptomForm');
  if (formEl) formEl.style.display = 'block';
  const resultsEl = document.getElementById('results');
  if (resultsEl) resultsEl.classList.remove('show');
  resetForm();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ========== TESTING UTILITIES (optional, for console) ========== */
function runTest(selectedSymptoms, otherPhrase = '', severity = '', duration = '', onset = '', sex = 'female') {
  console.group(`Test => [${selectedSymptoms.join(', ')}] Other: "${otherPhrase}" Sex: ${sex}`);
  const matches = matchConditions(selectedSymptoms, otherPhrase, severity, duration, onset, sex);
  if (!matches.length) {
    console.log('No confident matches (below threshold or domain/sex gated).');
  } else {
    matches.forEach((m, i) => {
      console.log(`${i + 1}. ${m.condition.name} — ${m.matchPercent}% — severity: ${m.condition.severity} — rawScore: ${m.rawScore.toFixed(2)}${m.emergencyFlag ? ' — EMERGENCY' : ''}`);
      if (m.missingRequired && m.missingRequired.length) console.log('  missing required:', m.missingRequired);
    });
  }
  console.groupEnd();
  return matches;
}

function quickTest() {
  console.clear();
  console.log('Running quickTest() — sample cases');

  runTest(['fever', 'cough', 'fatigue', 'shortness-breath', 'chest-pain'], '', '', '', '', 'female');
  runTest(['nausea', 'vomiting', 'diarrhea', 'abdominal-pain', 'fever'], '', 'moderate', '2-3-days', 'sudden', 'female');
  runTest(['joint-pain', 'stiffness', 'swelling', 'fatigue', 'fever'], '', '', '', '', 'female');
  runTest(['bloating', 'back-pain', 'mood-swings'], 'lower abdominal cramps', 'moderate', 'few-days', 'gradual', 'female');

  console.log('quickTest() finished — see console for detailed output.');
}

/* ========== END OF FILE ========== */
