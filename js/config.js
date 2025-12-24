// ==========================================
// SYSTEM CONFIG
// ==========================================

// Device detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 (window.innerWidth <= 768) || 
                 ('ontouchstart' in window);
const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;

// Adjust particle count based on device
let particleMultiplier = 1.0;
if (isMobile) {
    particleMultiplier = 0.5; // Reduce by 50% on mobile
} else if (isLowEndDevice) {
    particleMultiplier = 0.7; // Reduce by 30% on low-end devices
}

const CONFIG = {
    goldCount: Math.round(2000 * particleMultiplier),
    redCount: Math.round(300 * particleMultiplier),
    giftCount: Math.round(150 * particleMultiplier),
    explodeRadius: 65,  
    photoOrbitRadius: 25,
    treeHeight: 70,
    treeBaseRadius: 35,
    isMobile: isMobile,
    isLowEndDevice: isLowEndDevice,
    snowCount: isMobile ? 100 : (isLowEndDevice ? 150 : 200) // Snow particles based on device
};

