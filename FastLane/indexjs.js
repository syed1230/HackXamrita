// ==================== STATE ====================
let appState = {
  triageActive: false,
  recognizing: false,
  camStream: null,
  isOnline: navigator.onLine
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  initNetworkStatus();
  initEventListeners();
});

// ==================== NETWORK STATUS ====================
function initNetworkStatus() {
  updateNetworkStatus();
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
}

function updateNetworkStatus() {
  appState.isOnline = navigator.onLine;
  const indicator = document.getElementById('networkStatus');
  const dot = indicator.querySelector('.status-dot');
  const text = indicator.querySelector('#networkText');
  
  if (appState.isOnline) {
    dot.classList.remove('offline');
    text.textContent = 'Online';
    indicator.classList.remove('offline');
  } else {
    dot.classList.add('offline');
    text.textContent = 'Offline';
    indicator.classList.add('offline');
  }
}

// ==================== SIMULATION TOGGLE ====================
function initEventListeners() {
  const simToggle = document.getElementById('simToggle');
  simToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      // Redirect to simulation
      location.href = 'simulation.html';
    }
  });
  
  // Patient Condition Button (appears after SOS is triggered via sos_emergency.js)
  document.getElementById('patientConditionBtn').addEventListener('click', activateTriage);
  
  // Triage - Voice
  document.getElementById('voiceBtn').addEventListener('click', toggleVoiceTriage);
  
  // Triage - Text
  document.getElementById('textAnalyze').addEventListener('click', analyzeTextTriage);
  
  // Triage - Camera
  document.getElementById('startCamera').addEventListener('click', toggleCamera);
  document.getElementById('capturePhoto').addEventListener('click', capturePhoto);
  
  // Proceed to Dispatch
  document.getElementById('proceedToDispatch').addEventListener('click', proceedToDispatch);
}

// ==================== TRIAGE ACTIVATION ====================
function activateTriage() {
  appState.triageActive = true;
  const triageSection = document.getElementById('triageSection');
  triageSection.classList.add('active');
  triageSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  // Hide patient condition button once triage is active
  document.getElementById('patientConditionContainer').style.display = 'none';
  
  console.log('🚨 Patient Condition - Triage System Activated');
}

// ==================== SHOW PATIENT CONDITION BUTTON ====================
window.showPatientConditionButton = function() {
  document.getElementById('patientConditionContainer').style.display = 'block';
  document.getElementById('patientConditionContainer').scrollIntoView({ behavior: 'smooth' });
};

// ==================== PROCEED TO DISPATCH ====================
function proceedToDispatch() {
  console.log('🚑 Proceeding to emergency dispatch page...');
  
  // Collect triage data
  const triageData = {
    voiceSeverity: document.getElementById('voiceSeverity').textContent,
    textSeverity: document.getElementById('textSeverity').textContent,
    cameraSeverity: document.getElementById('cameraSeverity').textContent,
    symptoms: document.getElementById('textSymptoms').value,
    timestamp: new Date().toISOString()
  };
  
  // Store in sessionStorage for dispatch page
  sessionStorage.setItem('triageData', JSON.stringify(triageData));
  
  // Redirect to SOS dispatch page
  window.location.href = 'sos.html';
}

// ==================== TRIAGE LOGIC ====================
function analyzeSeverity(text) {
  if (!text) return 'LOW';
  const t = text.toLowerCase();
  const critical = ['chest pain', 'unconscious', 'heavy bleeding', 'not breathing', 'cardiac', 'stroke'];
  const moderate = ['fracture', 'dizziness', 'fall', 'concussion', 'sprain'];
  
  for (const keyword of critical) if (t.includes(keyword)) return 'CRITICAL';
  for (const keyword of moderate) if (t.includes(keyword)) return 'MODERATE';
  return 'LOW';
}

function setSeverityDisplay(el, severity) {
  if (!el) return;
  el.className = 'severity-display';
  el.textContent = severity;
  
  if (severity === 'CRITICAL') {
    el.classList.add('severity-critical');
  } else if (severity === 'MODERATE') {
    el.classList.add('severity-moderate');
  } else {
    el.classList.add('severity-low');
  }
}

// ==================== VOICE TRIAGE ====================
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

function toggleVoiceTriage() {
  if (!SpeechRecognition) {
    alert('Speech Recognition not supported in this browser');
    return;
  }
  
  if (!recognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    
    recognition.onstart = () => {
      appState.recognizing = true;
      document.getElementById('voiceBtn').textContent = 'Stop Voice Triage';
      document.getElementById('voiceBtn').style.background = '#7f1d1d';
    };
    
    recognition.onend = () => {
      appState.recognizing = false;
      document.getElementById('voiceBtn').textContent = 'Start Voice Triage';
      document.getElementById('voiceBtn').style.background = '';
    };
    
    let buffer = '';
    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        buffer += event.results[i][0].transcript + ' ';
      }
      document.getElementById('voiceTranscript').value = buffer;
      const severity = analyzeSeverity(buffer);
      setSeverityDisplay(document.getElementById('voiceSeverity'), severity);
    };
  }
  
  if (appState.recognizing) {
    recognition.stop();
  } else {
    try {
      recognition.start();
    } catch (e) {
      console.warn(e);
    }
  }
}

// ==================== TEXT TRIAGE ====================
function analyzeTextTriage() {
  const text = document.getElementById('textSymptoms').value;
  const severity = analyzeSeverity(text);
  setSeverityDisplay(document.getElementById('textSeverity'), severity);
}

// ==================== CAMERA TRIAGE ====================
async function toggleCamera() {
  const btn = document.getElementById('startCamera');
  const preview = document.getElementById('camPreview');
  const capBtn = document.getElementById('capturePhoto');
  
  if (appState.camStream) {
    appState.camStream.getTracks().forEach(t => t.stop());
    appState.camStream = null;
    preview.style.display = 'none';
    btn.textContent = 'Start Camera';
    capBtn.disabled = true;
    return;
  }
  
  try {
    appState.camStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    preview.srcObject = appState.camStream;
    preview.style.display = 'block';
    btn.textContent = 'Stop Camera';
    capBtn.disabled = false;
  } catch (e) {
    alert('Camera access denied or unavailable');
  }
}

function capturePhoto() {
  const canvas = document.createElement('canvas');
  const video = document.getElementById('camPreview');
  canvas.width = video.videoWidth || 320;
  canvas.height = video.videoHeight || 240;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Simulate detection
  const label = prompt('Simulated detection keywords (e.g., blood, fall, fracture):', '');
  const severity = analyzeSeverity(label || '');
  setSeverityDisplay(document.getElementById('cameraSeverity'), severity);
}
