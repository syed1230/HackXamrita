/**
 * SOS Emergency Handler
 * Manages the SOS button behavior and dispatch logic
 */

(function() {
  'use strict';

  // Initialize SOS Emergency button
  function initSosEmergency() {
    console.log('🚨 SOS Emergency module loaded');
    const sosBtn = document.getElementById('sos-button');
    if (!sosBtn) return;

    sosBtn.addEventListener('click', handleSosClick);
  }

  // Handle SOS button click
  function handleSosClick() {
    console.log('🚨 SOS Emergency clicked');
    
    // Show confirmation dialog
    const confirmed = confirm(
      '🚨 EMERGENCY SOS ACTIVATED\n\n' +
      'This will:\n' +
      '• Alert nearest ambulance\n' +
      '• Share your location\n' +
      '• Notify emergency services\n\n' +
      'Proceed with emergency dispatch?'
    );

    if (!confirmed) {
      console.log('SOS cancelled');
      return;
    }

    // Trigger dispatch sequence
    triggerDispatch();
  }

  // Trigger emergency dispatch
  function triggerDispatch() {
    console.log('🚨 SOS Emergency triggered at', new Date().toLocaleTimeString());

    // Attempt to capture location
    captureLocation();

    // Show loading notification
    showEmergencyToast('🚨 Dispatching nearest ambulance...', 1500);

    // Show the Patient Condition button on index.html
    if (window.showPatientConditionButton) {
      setTimeout(() => {
        window.showPatientConditionButton();
      }, 500);
    }
  }

  // Capture device location (demo with fallback)
  function captureLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          console.log('📍 Location captured:', lat, lon);
          sessionStorage.setItem('sos_lat', lat);
          sessionStorage.setItem('sos_lon', lon);
        },
        (error) => {
          console.warn('⚠️ Location access denied, using demo coords');
          sessionStorage.setItem('sos_lat', '37.7815');
          sessionStorage.setItem('sos_lon', '-122.4112');
        },
        { timeout: 3000, maximumAge: 10000 }
      );
    }
  }

  // Display emergency toast notification
  function showEmergencyToast(msg, timeout = 3000) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    t.style.cssText = 'position:fixed;right:18px;bottom:110px;background:#8b0000;color:#fff;padding:12px 16px;border-radius:8px;box-shadow:0 8px 20px rgba(139,0,0,.6);z-index:400';
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transition = 'opacity 0.3s ease';
      setTimeout(() => t.remove(), 300);
    }, timeout);
  }

  // Auto-init on DOM ready
  document.addEventListener('DOMContentLoaded', initSosEmergency);
})();

/**
 * Start the countdown timer (5 seconds)
 */
function startCountdownTimer() {
    const countdownNumberEl = document.getElementById('countdown-number');
    const countdownFillEl = document.querySelector('.countdown-fill');
    
    if (!countdownNumberEl) {
        console.error('Countdown element not found!');
        return;
    }
    
    let timeRemaining = 5;
    const duration = 5;
    const circumference = 2 * Math.PI * 95; // SVG circle radius is 95
    
    console.log('========== COUNTDOWN TIMER STARTED ==========');
    console.log('Circumference:', circumference);
    
    // Display initial value
    countdownNumberEl.textContent = timeRemaining;
    console.log('Initial display:', timeRemaining);
    
    // Start countdown
    window.countdownInterval = setInterval(() => {
        timeRemaining--;
        
        // Update number display
        countdownNumberEl.textContent = timeRemaining;
        console.log('TIME REMAINING:', timeRemaining);
        
        // Update SVG ring
        if (countdownFillEl) {
            const progress = (duration - timeRemaining) / duration;
            const newOffset = circumference * (1 - progress);
            countdownFillEl.style.strokeDashoffset = newOffset;
            console.log('Progress:', (progress * 100).toFixed(0) + '% | Offset:', newOffset.toFixed(2));
        }
        
        // Check if countdown complete
        if (timeRemaining < 0) {
            clearInterval(window.countdownInterval);
            console.log('========== COUNTDOWN COMPLETE ==========');
            
            // Update display to checkmark
            countdownNumberEl.textContent = '✓';
            countdownNumberEl.style.color = 'var(--success-green)';
            
            // Update label
            const labelEl = document.querySelector('.countdown-label');
            if (labelEl) {
                labelEl.textContent = 'Emergency Lock-In Complete';
            }
            
            // Update status
            const statusEl = document.getElementById('countdown-status');
            if (statusEl) {
                const statusText = statusEl.querySelector('.status-text');
                if (statusText) {
                    statusText.textContent = 'Emergency Routed to Admin Command';
                }
                statusEl.style.background = 'rgba(16, 185, 129, 0.15)';
                statusEl.style.borderColor = 'rgba(16, 185, 129, 0.3)';
            }
        }
    }, 1000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSOSController);
} else {
    initializeSOSController();
}
