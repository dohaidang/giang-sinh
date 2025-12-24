// ==========================================
// CONTROLS FUNCTIONS
// ==========================================
let isMuted = false;
let isFullscreen = false;

function toggleControls() {
    const panel = document.getElementById('controls-panel');
    panel.classList.toggle('active');
}

function toggleMute() {
    isMuted = !isMuted;
    bgMusic.muted = isMuted;
    
    const icon = document.getElementById('mute-icon');
    const text = document.getElementById('mute-text');
    
    if (isMuted) {
        icon.textContent = '🔇';
        text.textContent = 'Unmute';
    } else {
        icon.textContent = '🔊';
        text.textContent = 'Mute';
    }
}

function setVolume(value) {
    bgMusic.volume = value / 100;
    document.getElementById('volumeValue').textContent = value + '%';
}

function toggleFullscreen() {
    if (!isFullscreen) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function resetScene() {
    if (!scene) return;
    
    state = 'TREE';
    selectedIndex = 0;
    handX = 0.5;
    
    if (groupGold) {
        groupGold.rotation.y = 0;
        groupGold.scale.set(1, 1, 1);
    }
    if (groupRed) {
        groupRed.rotation.y = 0;
        groupRed.scale.set(1, 1, 1);
    }
    if (groupGift) {
        groupGift.rotation.y = 0;
        groupGift.scale.set(1, 1, 1);
    }
    
    if (titleMesh) titleMesh.visible = true;
    if (starMesh) starMesh.visible = true;
    if (loveMesh) loveMesh.visible = false;
    
    photoMeshes.forEach(mesh => {
        mesh.visible = false;
        mesh.scale.set(0, 0, 0);
    });
}

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', () => {
    isFullscreen = !!document.fullscreenElement;
    updateFullscreenButton();
});
document.addEventListener('webkitfullscreenchange', () => {
    isFullscreen = !!document.webkitFullscreenElement;
    updateFullscreenButton();
});
document.addEventListener('msfullscreenchange', () => {
    isFullscreen = !!document.msFullscreenElement;
    updateFullscreenButton();
});

function updateFullscreenButton() {
    const icon = document.getElementById('fullscreen-icon');
    const text = document.getElementById('fullscreen-text');
    
    if (isFullscreen) {
        icon.textContent = '🗗';
        text.textContent = 'Exit Fullscreen';
    } else {
        icon.textContent = '🗖';
        text.textContent = 'Fullscreen';
    }
}

