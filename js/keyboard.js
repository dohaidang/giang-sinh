// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================
let isSystemStarted = false;

function changePhoto(direction) {
    if (!isSystemStarted || !scene) return;
    
    // Only allow photo navigation in EXPLODE or PHOTO state
    if (state !== 'EXPLODE' && state !== 'PHOTO') {
        // If in TREE state, switch to EXPLODE first
        if (state === 'TREE') {
            state = 'EXPLODE';
        } else {
            return;
        }
    }
    
    if (direction === 'next') {
        selectedIndex = (selectedIndex + 1) % 5;
    } else if (direction === 'prev') {
        selectedIndex = (selectedIndex - 1 + 5) % 5;
    }
    
    // Switch to PHOTO state to show selected photo
    if (state === 'EXPLODE') {
        state = 'PHOTO';
    }
}

document.addEventListener('keydown', (e) => {
    // Prevent default behavior for specific keys
    if (['Space', 'm', 'M', 'f', 'F', 'r', 'R', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }

    // Space - Start/Stop
    if (e.key === ' ' || e.key === 'Space') {
        if (!isSystemStarted) {
            startSystem();
        } else {
            // Toggle pause
            if (bgMusic.paused) {
                bgMusic.play().catch(() => {});
            } else {
                bgMusic.pause();
            }
        }
    }

    // M - Mute/Unmute
    if (e.key === 'm' || e.key === 'M') {
        if (isSystemStarted) {
            toggleMute();
        }
    }

    // F - Fullscreen
    if (e.key === 'f' || e.key === 'F') {
        if (isSystemStarted) {
            toggleFullscreen();
        }
    }

    // R - Reset
    if (e.key === 'r' || e.key === 'R') {
        if (isSystemStarted) {
            resetScene();
        }
    }

    // Arrow Keys - Change Photo
    if (e.key === 'ArrowRight') {
        if (isSystemStarted) {
            changePhoto('next');
        }
    }
    if (e.key === 'ArrowLeft') {
        if (isSystemStarted) {
            changePhoto('prev');
        }
    }
});

// Prevent spacebar from scrolling page
window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
    }
});

