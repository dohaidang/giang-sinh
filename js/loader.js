// ==========================================
// LOADING & ERROR HANDLING
// ==========================================
let loadingProgress = 0;
const totalAssets = 7; // 5 images + 1 audio + 1 three.js (assumed loaded)
let loadedAssets = 0;
let hasError = false;
let loadingTimeout;

function hideLoadingScreen() {
    document.getElementById('loading-screen').classList.add('hidden');
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
    }, 500);
}

function updateProgress(assetName) {
    loadedAssets++;
    loadingProgress = Math.round((loadedAssets / totalAssets) * 100);
    document.getElementById('progress-bar').style.width = loadingProgress + '%';
    document.getElementById('progress-text').textContent = loadingProgress + '% - Loading ' + assetName;
    
    if (loadedAssets >= totalAssets) {
        clearTimeout(loadingTimeout);
        setTimeout(hideLoadingScreen, 500);
    }
}

function showError(title, message) {
    hasError = true;
    clearTimeout(loadingTimeout);
    hideLoadingScreen();
    document.getElementById('error-details').innerHTML = `<strong>${title}</strong><br>${message}`;
    document.getElementById('error-message').style.display = 'block';
}

// Timeout after 30 seconds if loading takes too long
loadingTimeout = setTimeout(() => {
    if (loadedAssets < totalAssets) {
        console.warn('Loading timeout, continuing anyway');
        hideLoadingScreen();
    }
}, 30000);

// Check if Three.js is already loaded
if (typeof THREE !== 'undefined') {
    updateProgress('Three.js');
} else {
    // Wait for Three.js to load
    const checkThree = setInterval(() => {
        if (typeof THREE !== 'undefined') {
            clearInterval(checkThree);
            updateProgress('Three.js');
        }
    }, 100);
    // Timeout after 5 seconds
    setTimeout(() => clearInterval(checkThree), 5000);
}

// Update guide text for mobile (after CONFIG is loaded)
setTimeout(() => {
    if (typeof CONFIG !== 'undefined' && CONFIG.isMobile) {
        const guideText = document.getElementById('guide-text');
        if (guideText) {
            guideText.innerHTML = '👆 <b>Tap:</b> Toggle &nbsp;|&nbsp; 👆👆 <b>Double Tap:</b> Photo &nbsp;|&nbsp; 👈👉 <b>Swipe:</b> Navigate &nbsp;|&nbsp; ⬆️ <b>Swipe Up:</b> Heart';
        }
    }
}, 100);

