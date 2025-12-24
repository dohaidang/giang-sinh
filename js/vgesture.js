// ==========================================
// V GESTURE DETECTION SYSTEM - IMPROVED
// ==========================================

// Configuration for V gesture detection
const V_GESTURE_CONFIG = {
    trailLength: 40,           // Number of points to track (increased)
    minPoints: 15,             // Minimum points needed to detect V (reduced)
    yMinDrop: 0.08,            // Minimum Y drop for V bottom (8% of screen)
    yMinRise: 0.06,            // Minimum Y rise after bottom (6% of screen)
    xMinMovement: 0.06,        // Minimum X movement (6% of screen width)
    maxTimeWindow: 2000,       // Max time for gesture (2 seconds)
    cooldownTime: 2000,        // Cooldown after detection (ms)
    sparkleCount: 50,          // Number of sparkle particles
    smoothingWindow: 3,        // Points to average for smoothing
    detectionThreshold: 0.7,   // Confidence threshold (0-1)
    debugMode: true            // Show debug info
};

// Trail storage for finger tip tracking
let fingerTrail = [];
let vGestureDetected = false;
let lastVDetectionTime = 0;
let sparkles = [];
let trailCanvas = null;
let trailCtx = null;
let isVGestureSystemActive = false;
let vDetectionProgress = 0; // 0-100 progress indicator

// Initialize V gesture detection system
function initVGestureSystem() {
    if (isVGestureSystemActive) return;
    isVGestureSystemActive = true;
    
    // Create trail canvas
    createTrailCanvas();
    
    // Start animation loop for sparkles
    requestAnimationFrame(updateSparkles);
    
    console.log('V Gesture System initialized (Improved)');
}

// Create the overlay canvas for drawing trail
function createTrailCanvas() {
    trailCanvas = document.getElementById('v-trail-canvas');
    if (!trailCanvas) {
        trailCanvas = document.createElement('canvas');
        trailCanvas.id = 'v-trail-canvas';
        document.body.appendChild(trailCanvas);
    }
    
    trailCanvas.width = window.innerWidth;
    trailCanvas.height = window.innerHeight;
    trailCtx = trailCanvas.getContext('2d');
    
    // Handle resize
    window.addEventListener('resize', () => {
        if (trailCanvas) {
            trailCanvas.width = window.innerWidth;
            trailCanvas.height = window.innerHeight;
        }
    });
}

// Smooth a value using moving average
function smoothPoints(points, windowSize) {
    if (points.length < windowSize) return points;
    
    const smoothed = [];
    for (let i = 0; i < points.length; i++) {
        let sumX = 0, sumY = 0, count = 0;
        for (let j = Math.max(0, i - windowSize); j <= Math.min(points.length - 1, i + windowSize); j++) {
            sumX += points[j].x;
            sumY += points[j].y;
            count++;
        }
        smoothed.push({
            x: sumX / count,
            y: sumY / count,
            screenX: (sumX / count) * window.innerWidth,
            screenY: (sumY / count) * window.innerHeight,
            time: points[i].time
        });
    }
    return smoothed;
}

// Add a point to the finger trail
function addTrailPoint(x, y) {
    const now = Date.now();
    
    // Convert normalized coordinates (0-1) to screen coordinates
    const screenX = x * window.innerWidth;
    const screenY = y * window.innerHeight;
    
    // Remove old points (older than maxTimeWindow)
    while (fingerTrail.length > 0 && now - fingerTrail[0].time > V_GESTURE_CONFIG.maxTimeWindow) {
        fingerTrail.shift();
    }
    
    fingerTrail.push({
        x: x,           // Normalized X (0-1)
        y: y,           // Normalized Y (0-1)
        screenX: screenX,
        screenY: screenY,
        time: now
    });
    
    // Keep only recent points
    while (fingerTrail.length > V_GESTURE_CONFIG.trailLength) {
        fingerTrail.shift();
    }
    
    // Create sparkle at current position
    createSparkle(screenX, screenY);
    
    // Check for V gesture
    if (!vGestureDetected && fingerTrail.length >= V_GESTURE_CONFIG.minPoints) {
        if (now - lastVDetectionTime > V_GESTURE_CONFIG.cooldownTime) {
            const result = detectVGesture();
            vDetectionProgress = result.confidence * 100;
            
            if (result.detected) {
                onVGestureDetected();
            }
        }
    }
}

// Find the lowest point (bottom of V) in the trail
function findLowestPoint(points) {
    let lowestIdx = 0;
    let lowestY = -Infinity;
    
    for (let i = 0; i < points.length; i++) {
        if (points[i].y > lowestY) {
            lowestY = points[i].y;
            lowestIdx = i;
        }
    }
    
    return { index: lowestIdx, y: lowestY };
}

// Calculate the slope/direction of movement
function calculateSlope(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return { dx, dy, angle: Math.atan2(dy, dx) };
}

// Improved V gesture detection
function detectVGesture() {
    const result = { detected: false, confidence: 0, reason: '' };
    
    if (fingerTrail.length < V_GESTURE_CONFIG.minPoints) {
        result.reason = 'Not enough points';
        return result;
    }
    
    // Smooth the points to reduce noise
    const points = smoothPoints(fingerTrail, V_GESTURE_CONFIG.smoothingWindow);
    const n = points.length;
    
    // Find the lowest point (bottom of V)
    const lowest = findLowestPoint(points);
    const bottomIdx = lowest.index;
    
    // Bottom should be somewhere in the middle (not at the edges)
    const minBottomIdx = Math.floor(n * 0.2);
    const maxBottomIdx = Math.floor(n * 0.8);
    
    if (bottomIdx < minBottomIdx || bottomIdx > maxBottomIdx) {
        result.reason = 'Bottom not in middle';
        result.confidence = 0.2;
        return result;
    }
    
    // Get start, bottom, and end points
    const startPoint = points[0];
    const bottomPoint = points[bottomIdx];
    const endPoint = points[n - 1];
    
    // Calculate Y movements
    const dropFromStart = bottomPoint.y - startPoint.y;  // Should be positive (going down)
    const riseToEnd = bottomPoint.y - endPoint.y;        // Should be positive (going up)
    
    // Calculate X movement
    const xMovement = endPoint.x - startPoint.x;         // Should be positive (left to right)
    
    // Check conditions with scoring
    let score = 0;
    let maxScore = 0;
    
    // Condition 1: Significant drop from start to bottom (weight: 30)
    maxScore += 30;
    if (dropFromStart > V_GESTURE_CONFIG.yMinDrop) {
        score += 30;
    } else if (dropFromStart > V_GESTURE_CONFIG.yMinDrop * 0.5) {
        score += 15;
    }
    
    // Condition 2: Significant rise from bottom to end (weight: 30)
    maxScore += 30;
    if (riseToEnd > V_GESTURE_CONFIG.yMinRise) {
        score += 30;
    } else if (riseToEnd > V_GESTURE_CONFIG.yMinRise * 0.5) {
        score += 15;
    }
    
    // Condition 3: X moves from left to right (weight: 20)
    maxScore += 20;
    if (xMovement > V_GESTURE_CONFIG.xMinMovement) {
        score += 20;
    } else if (xMovement > 0) {
        score += 10;
    }
    
    // Condition 4: Check slopes - first half should go down-right, second half should go up-right (weight: 20)
    maxScore += 20;
    const firstHalf = calculateSlope(startPoint, bottomPoint);
    const secondHalf = calculateSlope(bottomPoint, endPoint);
    
    // First half: angle should be between 0 and PI/2 (going down-right)
    // Second half: angle should be between -PI/2 and 0 (going up-right)
    const firstHalfCorrect = firstHalf.dx > 0 && firstHalf.dy > 0;
    const secondHalfCorrect = secondHalf.dx > 0 && secondHalf.dy < 0;
    
    if (firstHalfCorrect && secondHalfCorrect) {
        score += 20;
    } else if (firstHalfCorrect || secondHalfCorrect) {
        score += 10;
    }
    
    // Calculate confidence
    result.confidence = score / maxScore;
    
    // Debug logging
    if (V_GESTURE_CONFIG.debugMode && result.confidence > 0.3) {
        console.log('V Detection:', {
            confidence: (result.confidence * 100).toFixed(1) + '%',
            dropFromStart: dropFromStart.toFixed(3),
            riseToEnd: riseToEnd.toFixed(3),
            xMovement: xMovement.toFixed(3),
            bottomIdx: bottomIdx + '/' + n,
            firstHalfCorrect,
            secondHalfCorrect
        });
    }
    
    // Check if confidence exceeds threshold
    if (result.confidence >= V_GESTURE_CONFIG.detectionThreshold) {
        result.detected = true;
        result.reason = 'V gesture detected!';
    } else {
        result.reason = `Confidence too low: ${(result.confidence * 100).toFixed(1)}%`;
    }
    
    return result;
}

// Called when V gesture is successfully detected
function onVGestureDetected() {
    vGestureDetected = true;
    lastVDetectionTime = Date.now();
    
    console.log('🎄 V Gesture Activated! Starting Magic Christmas...');
    
    // Create celebration sparkles
    createCelebrationSparkles();
    
    // Hide the V gesture hint
    const vHint = document.getElementById('v-gesture-hint');
    if (vHint) {
        vHint.style.opacity = '0';
        setTimeout(() => {
            vHint.style.display = 'none';
        }, 500);
    }
    
    // Clear trail
    fingerTrail = [];
    
    // Start the main system after a short delay for effect
    setTimeout(() => {
        if (typeof startMainExperience === 'function') {
            startMainExperience();
        }
        
        // Fade out trail canvas
        if (trailCanvas) {
            trailCanvas.style.transition = 'opacity 1s ease-out';
            trailCanvas.style.opacity = '0';
            setTimeout(() => {
                trailCanvas.style.display = 'none';
            }, 1000);
        }
    }, 500);
}

// Create a sparkle particle at position
function createSparkle(x, y) {
    const colors = ['#FFD700', '#FF0000', '#00FF00', '#FFFFFF', '#FF69B4', '#00FFFF'];
    const sparkle = {
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 2,
        size: 2 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3
    };
    sparkles.push(sparkle);
    
    // Limit sparkles
    while (sparkles.length > V_GESTURE_CONFIG.sparkleCount * 3) {
        sparkles.shift();
    }
}

// Create celebration sparkles when V is detected
function createCelebrationSparkles() {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    for (let i = 0; i < 150; i++) {
        const angle = (i / 150) * Math.PI * 2;
        const distance = 50 + Math.random() * 150;
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        createSparkle(x, y);
    }
}

// Update and render sparkles
function updateSparkles() {
    if (!trailCtx || !trailCanvas) {
        requestAnimationFrame(updateSparkles);
        return;
    }
    
    // Clear canvas with slight fade for trail effect
    trailCtx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height);
    
    // Draw trail line if not detected yet
    if (!vGestureDetected && fingerTrail.length > 1) {
        drawTrailLine();
        drawProgressIndicator();
    }
    
    // Update and draw sparkles
    for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        
        // Update physics
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.1; // Gravity
        s.life -= s.decay;
        s.rotation += s.rotationSpeed;
        
        // Remove dead sparkles
        if (s.life <= 0) {
            sparkles.splice(i, 1);
            continue;
        }
        
        // Draw sparkle
        drawSparkle(s);
    }
    
    requestAnimationFrame(updateSparkles);
}

// Draw progress indicator
function drawProgressIndicator() {
    if (vDetectionProgress < 10) return;
    
    const centerX = window.innerWidth / 2;
    const y = 50;
    const width = 200;
    const height = 8;
    
    // Background
    trailCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    trailCtx.fillRect(centerX - width/2 - 2, y - 2, width + 4, height + 4);
    
    // Progress bar background
    trailCtx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    trailCtx.fillRect(centerX - width/2, y, width, height);
    
    // Progress bar fill
    const fillWidth = (vDetectionProgress / 100) * width;
    const gradient = trailCtx.createLinearGradient(centerX - width/2, 0, centerX + width/2, 0);
    
    if (vDetectionProgress < 50) {
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(1, '#FFD700');
    } else if (vDetectionProgress < 70) {
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#00FF00');
    } else {
        gradient.addColorStop(0, '#00FF00');
        gradient.addColorStop(1, '#00FFFF');
    }
    
    trailCtx.fillStyle = gradient;
    trailCtx.fillRect(centerX - width/2, y, fillWidth, height);
    
    // Text
    trailCtx.fillStyle = '#FFFFFF';
    trailCtx.font = 'bold 12px Arial';
    trailCtx.textAlign = 'center';
    trailCtx.fillText(`${Math.round(vDetectionProgress)}%`, centerX, y + height + 15);
}

// Draw the trail line with gradient
function drawTrailLine() {
    if (fingerTrail.length < 2) return;
    
    // Draw main trail
    trailCtx.beginPath();
    trailCtx.moveTo(fingerTrail[0].screenX, fingerTrail[0].screenY);
    
    for (let i = 1; i < fingerTrail.length; i++) {
        const p = fingerTrail[i];
        trailCtx.lineTo(p.screenX, p.screenY);
    }
    
    // Create gradient based on progress
    const gradient = trailCtx.createLinearGradient(
        fingerTrail[0].screenX, fingerTrail[0].screenY,
        fingerTrail[fingerTrail.length-1].screenX, fingerTrail[fingerTrail.length-1].screenY
    );
    
    if (vDetectionProgress < 50) {
        gradient.addColorStop(0, 'rgba(255, 107, 107, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0.9)');
    } else {
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 255, 0, 1)');
    }
    
    trailCtx.strokeStyle = gradient;
    trailCtx.lineWidth = 4;
    trailCtx.lineCap = 'round';
    trailCtx.lineJoin = 'round';
    trailCtx.stroke();
    
    // Draw glowing effect
    trailCtx.shadowColor = vDetectionProgress > 50 ? '#00FF00' : '#FFD700';
    trailCtx.shadowBlur = 20;
    trailCtx.stroke();
    trailCtx.shadowBlur = 0;
    
    // Draw points at start, lowest, and current position
    drawKeyPoints();
}

// Draw key points on the trail
function drawKeyPoints() {
    if (fingerTrail.length < 3) return;
    
    const points = fingerTrail;
    const lowest = findLowestPoint(points);
    
    // Start point (green)
    drawPoint(points[0].screenX, points[0].screenY, '#00FF00', 'START');
    
    // Lowest point (red) - only if in middle
    if (lowest.index > 2 && lowest.index < points.length - 2) {
        drawPoint(points[lowest.index].screenX, points[lowest.index].screenY, '#FF0000', 'V');
    }
    
    // Current point (gold)
    const last = points[points.length - 1];
    drawPoint(last.screenX, last.screenY, '#FFD700', '');
}

// Draw a single point with label
function drawPoint(x, y, color, label) {
    trailCtx.beginPath();
    trailCtx.arc(x, y, 8, 0, Math.PI * 2);
    trailCtx.fillStyle = color;
    trailCtx.shadowColor = color;
    trailCtx.shadowBlur = 15;
    trailCtx.fill();
    trailCtx.shadowBlur = 0;
    
    if (label) {
        trailCtx.fillStyle = '#FFFFFF';
        trailCtx.font = 'bold 10px Arial';
        trailCtx.textAlign = 'center';
        trailCtx.fillText(label, x, y - 15);
    }
}

// Draw a single sparkle
function drawSparkle(s) {
    trailCtx.save();
    trailCtx.translate(s.x, s.y);
    trailCtx.rotate(s.rotation);
    trailCtx.globalAlpha = s.life;
    
    // Draw star shape
    trailCtx.fillStyle = s.color;
    trailCtx.shadowColor = s.color;
    trailCtx.shadowBlur = 10;
    
    // Draw 4-pointed star
    const size = s.size * s.life;
    trailCtx.beginPath();
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
        const outerX = Math.cos(angle) * size;
        const outerY = Math.sin(angle) * size;
        const innerAngle = angle + Math.PI / 4;
        const innerX = Math.cos(innerAngle) * size * 0.4;
        const innerY = Math.sin(innerAngle) * size * 0.4;
        
        if (i === 0) {
            trailCtx.moveTo(outerX, outerY);
        } else {
            trailCtx.lineTo(outerX, outerY);
        }
        trailCtx.lineTo(innerX, innerY);
    }
    trailCtx.closePath();
    trailCtx.fill();
    
    trailCtx.restore();
}

// Clear trail
function clearTrail() {
    fingerTrail = [];
    vDetectionProgress = 0;
    if (trailCtx && trailCanvas) {
        trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
    }
}

// Reset V gesture system (for retry)
function resetVGestureSystem() {
    vGestureDetected = false;
    fingerTrail = [];
    sparkles = [];
    vDetectionProgress = 0;
    
    if (trailCanvas) {
        trailCanvas.style.display = 'block';
        trailCanvas.style.opacity = '1';
    }
    
    const vHint = document.getElementById('v-gesture-hint');
    if (vHint) {
        vHint.style.display = 'block';
        vHint.style.opacity = '1';
    }
}

// Check if V gesture has been detected
function isVGestureCompleted() {
    return vGestureDetected;
}
