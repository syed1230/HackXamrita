// FastLane - Modular JS for multi-page emergency demo
// Shared utilities and page-specific initializers
// Author: FastLane demo

/* ----------------- Toast ----------------- */
function showToast(msg, timeout=3000){
  const t = document.createElement('div'); t.className='toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(()=>{ t.style.opacity=0; setTimeout(()=>t.remove(),300); }, timeout);
}

/* ----------------- Network / Simulation logic ----------------- */
function updateNetworkUI(){
  const el = document.getElementById('networkStatus'); if(!el) return;
  if(navigator.onLine){ el.textContent='🟢 Online'; el.className='network-status net-online'; }
  else { el.textContent='🔴 Offline'; el.className='network-status net-offline'; }
}

function initNetworkWatcher(){
  updateNetworkUI();
  window.addEventListener('online', ()=>{ updateNetworkUI(); showToast('Network: Online'); });
  window.addEventListener('offline', ()=>{ updateNetworkUI(); showToast('Network: Offline'); });
}

/* Sign-in modal (injected to all pages) */
function createSignInModal(){
  if(document.getElementById('signinModal')) return;
  const modal = document.createElement('div'); modal.id='signinModal'; modal.style.cssText='position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(3,18,34,.5);z-index:600;padding:18px';
  modal.innerHTML = `
    <div style="background:var(--card);padding:18px;border-radius:12px;max-width:420px;width:100%">
      <h3 style="margin:0 0 10px">Sign In (Demo)</h3>
      <p class="muted" style="margin:0 0 10px">This is a demo modal. No credentials sent.</p>
      <input id="siEmail" placeholder="Email" style="width:100%;padding:8px;margin-bottom:8px;border-radius:8px;border:1px solid #eee" />
      <input id="siPass" type="password" placeholder="Password" style="width:100%;padding:8px;margin-bottom:12px;border-radius:8px;border:1px solid #eee" />
      <div style="display:flex;gap:8px;justify-content:flex-end"><button id="siCancel" class="nav-link">Cancel</button><button id="siSubmit" class="nav-link">Sign In</button></div>
    </div>`;
  modal.addEventListener('click', (e)=>{ if(e.target===modal){ modal.remove(); } }); document.body.appendChild(modal);
  document.getElementById('siCancel').addEventListener('click', ()=>modal.remove());
  document.getElementById('siSubmit').addEventListener('click', ()=>{ modal.remove(); showToast('Signed in (demo)'); });
}

function initSignInButtons(){ const btns = document.querySelectorAll('#signInBtn'); btns.forEach(b=>b.addEventListener('click', createSignInModal)); }

/* Simulation button logic on index.html */
function initSimulationButton(){
  const btn = document.getElementById('simBtn'); if(!btn) return;
  if(navigator.onLine){ alert('Network detected. Simulation Mode disabled.'); btn.disabled = true; }
  else { window.location.href = 'simulation.html'; }
}

/* ----------------- Navigation ----------------- */
function initNav(active){
  const links = document.querySelectorAll('.nav-link'); links.forEach(l=>l.classList.remove('active'));
  const act = document.querySelector(`.nav-link[data-page="${active}"]`); if(act) act.classList.add('active');
  // network indicator
  initNetworkWatcher();
}

/* ----------------- Haversine + Estimator ----------------- */
function toRad(v){ return v * Math.PI / 180; }
function haversine(a,b){ const R=6371; const dLat=toRad(b.lat-a.lat); const dLon=toRad(b.lon-a.lon); const lat1=toRad(a.lat), lat2=toRad(b.lat); const s1=Math.sin(dLat/2), s2=Math.sin(dLon/2); const u=s1*s1 + Math.cos(lat1)*Math.cos(lat2)*s2*s2; const c=2*Math.atan2(Math.sqrt(u),Math.sqrt(1-u)); return R*c; }
function calcIdealTimeKm(distanceKm, speedKmh=60){ return (distanceKm / speedKmh) * 60; }

/* ----------------- Triage AI (simulated) ----------------- */
function analyzeSymptoms(text){
  if(!text) return 'LOW';
  const t = text.toLowerCase();
  const critical = ["chest pain","unconscious","heavy bleeding","not breathing","not breathing","no pulse","cardiac"];
  const moderate = ["fracture","dizziness","fall","concussion","sprain","bleeding"];
  for(const k of critical) if(t.includes(k)) return 'CRITICAL';
  for(const k of moderate) if(t.includes(k)) return 'MODERATE';
  return 'LOW';
}

function setSeverityDisplay(el, severity){
  if(!el) return;
  el.classList.remove('severity-low','severity-moderate','severity-critical');
  if(severity==='CRITICAL') el.classList.add('severity-critical');
  else if(severity==='MODERATE') el.classList.add('severity-moderate');
  else el.classList.add('severity-low');
  el.textContent = severity;
  // SOS highlight when critical
  const sos = document.getElementById('sosFloat'); if(sos){
    const btn = sos.querySelector('.sos-btn');
    if(severity==='CRITICAL'){ btn.classList.add('sos-alert'); btn.classList.add('sos-glow'); showToast('CRITICAL triage detected — SOS highlighted'); }
    else { btn.classList.remove('sos-alert'); btn.classList.remove('sos-glow'); }
  }
}

/* Voice triage using Web Speech API */
let recognition, recognizing=false;
function initVoiceTriage(){
  const voiceBtn = document.getElementById('voiceBtn'); const transcriptEl = document.getElementById('voiceTranscript'); const severityEl = document.getElementById('voiceSeverity');
  if(!voiceBtn) return;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){ voiceBtn.disabled=true; voiceBtn.textContent='Voice Unavailable'; return; }
  recognition = new SpeechRecognition(); recognition.lang='en-US'; recognition.interimResults=true; recognition.continuous=true;
  recognition.onstart = ()=>{ recognizing=true; voiceBtn.textContent='Listening — Click to Stop'; voiceBtn.classList.add('active'); showToast('Voice triage started'); };
  recognition.onend = ()=>{ recognizing=false; voiceBtn.textContent='Start Voice Triage'; voiceBtn.classList.remove('active'); showToast('Voice triage stopped'); };
  let buffer='';
  recognition.onresult = (ev)=>{
    let text=''; for(const r of ev.results){ text += r[0].transcript; }
    buffer = text; if(transcriptEl) transcriptEl.value = buffer;
    const sev = analyzeSymptoms(buffer); if(severityEl) setSeverityDisplay(severityEl, sev);
  };
  voiceBtn.addEventListener('click', ()=>{ if(recognizing){ recognition.stop(); } else { try{ recognition.start(); }catch(e){ console.warn(e); } } });
}

/* Text triage */
function initTextTriage(){ const btn=document.getElementById('textAnalyze'); if(!btn) return; btn.addEventListener('click', ()=>{ const txt=document.getElementById('textSymptoms').value || ''; const sev=analyzeSymptoms(txt); setSeverityDisplay(document.getElementById('textSeverity'),sev); showToast('Triage result: '+sev); }); }

/* Camera triage (simulated detection) */
let camStream=null;
function initCameraTriage(){ const start=document.getElementById('startCamera'); const cap=document.getElementById('capturePhoto'); const preview=document.getElementById('camPreview'); const camSev=document.getElementById('cameraSeverity');
  if(!start||!cap||!preview) return;
  start.addEventListener('click', async ()=>{
    if(camStream){ // stop
      camStream.getTracks().forEach(t=>t.stop()); camStream=null; preview.style.display='none'; cap.disabled=true; start.textContent='Start Camera Triage'; return;
    }
    try{ camStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}, audio:false}); preview.srcObject = camStream; preview.style.display='block'; cap.disabled=false; start.textContent='Stop Camera'; showToast('Camera started'); }
    catch(e){ showToast('Camera not available'); }
  });
  cap.addEventListener('click', ()=>{
    // capture frame and simulate detection via prompt (demo-only)
    const canvas=document.createElement('canvas'); canvas.width=preview.videoWidth||320; canvas.height=preview.videoHeight||240; const ctx=canvas.getContext('2d'); ctx.drawImage(preview,0,0,canvas.width,canvas.height);
    const label = prompt('Simulated detection keywords (demo). Try: blood, fall, fracture', '');
    const sev = analyzeSymptoms(label||''); setSeverityDisplay(camSev, sev); showToast('Camera triage: '+sev);
  });
}
/* ----------------- SOS logic (handled by sos_emergency.js) ----------------- */
function initSosButton(){ const btn=document.getElementById('sos-button'); if(!btn) return; /* SOS handler is in sos_emergency.js */ }

/* ----------------- Page Initializers ----------------- */
function pageIndexInit(){ initNav('home'); initSosButton(); const sim=document.getElementById('simBtn'); if(sim) sim.addEventListener('click', initSimulationButton); }

/* initialize triage features on index */
function initTriage(){ initVoiceTriage(); initTextTriage(); initCameraTriage(); }

function pageSosInit(){ initNav('home'); 
  // simulate dispatch
  const status = document.getElementById('sosStatus'); if(status) status.textContent='Dispatching nearest ambulance...';
  const spinner = document.getElementById('sosSpinner'); if(spinner) spinner.classList.add('pulse');
  const assigned = document.getElementById('ambulanceId'); const eta = document.getElementById('etaTime');
  const seconds = 45 + Math.floor(Math.random()*90); let remaining = seconds; const ambId = 'AMB-'+(100+Math.floor(Math.random()*900)); if(assigned) assigned.textContent = ambId;
  if(eta) eta.textContent = Math.ceil(seconds/60)+' min';
  
  // Golden Hour countdown (60 minutes)
  let goldenClock = 60*60; const ghEl=document.getElementById('goldenCountdown');
  const ghTimer = setInterval(()=>{ goldenClock--; const m=Math.floor(goldenClock/60), s=goldenClock%60; if(ghEl) ghEl.textContent = m+':'+(s<10?'0'+s:s); if(goldenClock<=0){ clearInterval(ghTimer); if(ghEl) ghEl.textContent='TIME CRITICAL'; } },1000);
  
  const timer = setInterval(()=>{ remaining--; const el=document.getElementById('sosCountdown'); if(el) el.textContent = remaining+'s'; if(remaining<=0){ clearInterval(timer); if(spinner) spinner.classList.remove('pulse'); const s = document.getElementById('sosStatus'); if(s) s.textContent='Ambulance en route'; showToast('Ambulance Assigned: '+ambId); } },1000);
  
  // Cancel SOS button
  const cancelBtn = document.getElementById('cancelSosBtn'); if(cancelBtn) cancelBtn.addEventListener('click', ()=>{ clearInterval(timer); clearInterval(ghTimer); window.location.href='index.html'; });
}

function pageHospitalInit(){ initNav('hospital'); initSosButton(); // dummy data
  // load dummy stats
  document.getElementById('icuCount').textContent = '4'; document.getElementById('genCount').textContent='22'; document.getElementById('traumaStatus').textContent='Available';
  document.getElementById('incomingList').innerHTML = '<li>AMB-124 — ETA 6m</li><li>AMB-211 — ETA 12m</li>';
}

function pageDriverInit(){ initNav('driver'); initSosButton(); // demo assigned coordinates
  const start = {lat:37.773972, lon:-122.431297}; const patient={lat:37.7815, lon:-122.4112}; const hospital={lat:37.7890, lon:-122.4010};
  // compute
  const straight = haversine(patient,hospital); const ideal = calcIdealTimeKm(straight,60); const actual = ideal * 1.6; const delay = actual - ideal; const eff = Math.round((ideal/actual)*100);
  // populate
  const elDist = document.getElementById('straightDist'); if(elDist) elDist.textContent = straight.toFixed(2)+' km';
  const elIdeal = document.getElementById('idealTime'); if(elIdeal) elIdeal.textContent = Math.round(ideal)+' min';
  const elActual = document.getElementById('actualTime'); if(elActual) elActual.textContent = Math.round(actual)+' min';
  const elDelay = document.getElementById('trafficDelay'); if(elDelay) elDelay.textContent = Math.round(delay)+' min';
  const elEff = document.getElementById('effScore'); if(elEff) elEff.textContent = eff+' %';
  // status toggle
  const statusSel = document.getElementById('driverStatus'); if(statusSel){ statusSel.addEventListener('change', e=> showToast('Status: '+e.target.value)); }
}

function pageSimulationInit(){ initNav('simulation'); // only allow if offline
  if(navigator.onLine){ alert('Online detected. Simulation mode is only for offline. Redirecting home.'); window.location.href='index.html'; return; }
  initSosButton(); // compute estimator same as driver
  const start = {lat:37.773972, lon:-122.431297}; const patient={lat:37.7815, lon:-122.4112}; const hospital={lat:37.7890, lon:-122.4010};
  const straight = haversine(patient,hospital); const ideal = calcIdealTimeKm(straight,60); const actual = ideal * 1.5; const eff = Math.round((ideal/actual)*100);
  document.getElementById('simDirect').textContent = straight.toFixed(2)+' km'; document.getElementById('simIdeal').textContent = Math.round(ideal)+' min'; document.getElementById('simActual').textContent = Math.round(actual)+' min'; document.getElementById('simEff').textContent = eff+' %';
  // golden hour countdown demo (20 min)
  let gh = 20*60; const ghEl=document.getElementById('goldenCountdown'); const ginterval=setInterval(()=>{ gh--; const m=Math.floor(gh/60), s=gh%60; if(ghEl) ghEl.textContent = m+':'+(s<10?'0'+s:s); if(gh<=0) clearInterval(ginterval); },1000);
}

/* ----------------- Auto init based on data-page attribute ----------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  const page = document.body.dataset.page;
  try{ 
    if(page==='home') pageIndexInit(); 
    if(page==='sos') pageSosInit(); 
    if(page==='hospital') pageHospitalInit(); 
    if(page==='driver') pageDriverInit(); 
    if(page==='simulation') pageSimulationInit(); 
  }catch(e){ console.error(e); }
  // page-level extras
  if(document.body.dataset.page==='home') initTriage();
  // sign in buttons
  initSignInButtons();
});
