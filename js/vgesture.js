// ==========================================
// V GESTURE DETECTION SYSTEM - ENHANCED VISUALS
// ==========================================

// Configuration for V gesture detection
const V_GESTURE_CONFIG = {
    trailLength: 40,
    minPoints: 15,
    yMinDrop: 0.08,
    yMinRise: 0.06,
    xMinMovement: 0.06,
    maxTimeWindow: 2000,
    cooldownTime: 2000,
    sparkleCount: 80,
    smoothingWindow: 3,
    detectionThreshold: 0.7,
    debugMode: false
};

// Trail storage
let fingerTrail = [];
let vGestureDetected = false;
let lastVDetectionTime = 0;
let sparkles = [];
let snowflakes = [];
let trailCanvas = null;
let trailCtx = null;
let isVGestureSystemActive = false;
let vDetectionProgress = 0;
let animationTime = 0;

// Christmas colors palette
const CHRISTMAS_COLORS = {
    gold: ['#FFD700', '#FFC125', '#FFB90F', '#FFEC8B'],
    red: ['#FF0000', '#DC143C', '#B22222', '#FF6347'],
    green: ['#00FF00', '#32CD32', '#228B22', '#7CFC00'],
    white: ['#FFFFFF', '#F0F8FF', '#FFFAFA', '#F5F5F5'],
    blue: ['#00BFFF', '#87CEEB', '#ADD8E6', '#B0E0E6']
};

// Initialize V gesture detection system
function initVGestureSystem() {
    if (isVGestureSystemActive) return;
    isVGestureSystemActive = true;
    
    createTrailCanvas();
    initSnowflakes();
    requestAnimationFrame(updateSparkles);
    
    console.log('V Gesture System initialized (Enhanced)');
}

// Create overlay canvas
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
    
    window.addEventListener('resize', () => {
        if (trailCanvas) {
            trailCanvas.width = window.innerWidth;
            trailCanvas.height = window.innerHeight;
            initSnowflakes();
        }
    });
}

// Initialize background snowflakes
function initSnowflakes() {
    snowflakes = [];
    const count = Math.min(100, Math.floor(window.innerWidth / 15));
    
    for (let i = 0; i < count; i++) {
        snowflakes.push({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: 1 + Math.random() * 3,
            speed: 0.3 + Math.random() * 0.7,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.03,
            opacity: 0.3 + Math.random() * 0.5
        });
    }
}

// Smooth points
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

// Get random color from palette
function getRandomColor(palette) {
    const colors = CHRISTMAS_COLORS[palette] || CHRISTMAS_COLORS.gold;
    return colors[Math.floor(Math.random() * colors.length)];
}

// Add trail point
function addTrailPoint(x, y) {
    const now = Date.now();
    const screenX = x * window.innerWidth;
    const screenY = y * window.innerHeight;
    
    while (fingerTrail.length > 0 && now - fingerTrail[0].time > V_GESTURE_CONFIG.maxTimeWindow) {
        fingerTrail.shift();
    }
    
    fingerTrail.push({ x, y, screenX, screenY, time: now });
    
    while (fingerTrail.length > V_GESTURE_CONFIG.trailLength) {
        fingerTrail.shift();
    }
    
    // Create multiple sparkles for richer effect
    for (let i = 0; i < 3; i++) {
        createSparkle(screenX + (Math.random() - 0.5) * 20, screenY + (Math.random() - 0.5) * 20);
    }
    
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

// Find lowest point
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

// Detect V gesture
function detectVGesture() {
    const result = { detected: false, confidence: 0, reason: '' };
    
    if (fingerTrail.length < V_GESTURE_CONFIG.minPoints) {
        result.reason = 'Not enough points';
        return result;
    }
    
    const points = smoothPoints(fingerTrail, V_GESTURE_CONFIG.smoothingWindow);
    const n = points.length;
    const lowest = findLowestPoint(points);
    const bottomIdx = lowest.index;
    
    const minBottomIdx = Math.floor(n * 0.2);
    const maxBottomIdx = Math.floor(n * 0.8);
    
    if (bottomIdx < minBottomIdx || bottomIdx > maxBottomIdx) {
        result.reason = 'Bottom not in middle';
        result.confidence = 0.2;
        return result;
    }
    
    const startPoint = points[0];
    const bottomPoint = points[bottomIdx];
    const endPoint = points[n - 1];
    
    const dropFromStart = bottomPoint.y - startPoint.y;
    const riseToEnd = bottomPoint.y - endPoint.y;
    const xMovement = endPoint.x - startPoint.x;
    
    let score = 0;
    let maxScore = 0;
    
    maxScore += 30;
    if (dropFromStart > V_GESTURE_CONFIG.yMinDrop) {
        score += 30;
    } else if (dropFromStart > V_GESTURE_CONFIG.yMinDrop * 0.5) {
        score += 15;
    }
    
    maxScore += 30;
    if (riseToEnd > V_GESTURE_CONFIG.yMinRise) {
        score += 30;
    } else if (riseToEnd > V_GESTURE_CONFIG.yMinRise * 0.5) {
        score += 15;
    }
    
    maxScore += 20;
    if (xMovement > V_GESTURE_CONFIG.xMinMovement) {
        score += 20;
    } else if (xMovement > 0) {
        score += 10;
    }
    
    maxScore += 20;
    const firstHalfCorrect = (bottomPoint.x - startPoint.x) > 0 && (bottomPoint.y - startPoint.y) > 0;
    const secondHalfCorrect = (endPoint.x - bottomPoint.x) > 0 && (endPoint.y - bottomPoint.y) < 0;
    
    if (firstHalfCorrect && secondHalfCorrect) {
        score += 20;
    } else if (firstHalfCorrect || secondHalfCorrect) {
        score += 10;
    }
    
    result.confidence = score / maxScore;
    
    if (result.confidence >= V_GESTURE_CONFIG.detectionThreshold) {
        result.detected = true;
        result.reason = 'V gesture detected!';
    }
    
    return result;
}

// V gesture detected
function onVGestureDetected() {
    vGestureDetected = true;
    lastVDetectionTime = Date.now();
    
    console.log('🎄 V Gesture Activated! Starting Magic Christmas...');
    
    createCelebrationSparkles();
    createFireworks();
    
    const vHint = document.getElementById('v-gesture-hint');
    if (vHint) {
        vHint.style.opacity = '0';
        setTimeout(() => vHint.style.display = 'none', 500);
    }
    
    fingerTrail = [];
    
    setTimeout(() => {
        if (typeof startMainExperience === 'function') {
            startMainExperience();
        }
        
        if (trailCanvas) {
            trailCanvas.style.transition = 'opacity 1.5s ease-out';
            trailCanvas.style.opacity = '0';
            setTimeout(() => trailCanvas.style.display = 'none', 1500);
        }
    }, 800);
}

// Create sparkle
function createSparkle(x, y, options = {}) {
    const palettes = ['gold', 'red', 'green', 'white'];
    const palette = options.palette || palettes[Math.floor(Math.random() * palettes.length)];
    
    const sparkle = {
        x, y,
        vx: (options.vx || 0) + (Math.random() - 0.5) * 6,
        vy: (options.vy || 0) + (Math.random() - 0.5) * 6 - 2,
        size: options.size || (2 + Math.random() * 5),
        color: getRandomColor(palette),
        life: 1.0,
        decay: options.decay || (0.015 + Math.random() * 0.02),
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.4,
        type: options.type || (Math.random() > 0.5 ? 'star' : 'circle'),
        trail: [],
        maxTrail: 5
    };
    
    sparkles.push(sparkle);
    
    while (sparkles.length > V_GESTURE_CONFIG.sparkleCount * 4) {
        sparkles.shift();
    }
}

// Create celebration sparkles
function createCelebrationSparkles() {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Burst from center
    for (let i = 0; i < 200; i++) {
        const angle = (i / 200) * Math.PI * 2;
        const speed = 5 + Math.random() * 15;
        const distance = Math.random() * 50;
        
        createSparkle(
            centerX + Math.cos(angle) * distance,
            centerY + Math.sin(angle) * distance,
            {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 6,
                decay: 0.01 + Math.random() * 0.01,
                type: 'star'
            }
        );
    }
}

// Create fireworks effect
function createFireworks() {
    const positions = [
        { x: window.innerWidth * 0.2, y: window.innerHeight * 0.3 },
        { x: window.innerWidth * 0.8, y: window.innerHeight * 0.3 },
        { x: window.innerWidth * 0.5, y: window.innerHeight * 0.2 }
    ];
    
    positions.forEach((pos, idx) => {
        setTimeout(() => {
            for (let i = 0; i < 80; i++) {
                const angle = (i / 80) * Math.PI * 2;
                const speed = 3 + Math.random() * 8;
                
                createSparkle(pos.x, pos.y, {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2,
                    size: 2 + Math.random() * 4,
                    decay: 0.012,
                    palette: ['gold', 'red', 'green'][idx],
                    type: 'star'
                });
            }
        }, idx * 200);
    });
}

// Update and render
function updateSparkles() {
    if (!trailCtx || !trailCanvas) {
        requestAnimationFrame(updateSparkles);
        return;
    }
    
    animationTime += 0.016;
    
    // Clear with fade
    trailCtx.fillStyle = 'rgba(10, 10, 26, 0.1)';
    trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height);
    
    // Draw snowflakes
    drawSnowflakes();
    
    // Draw trail
    if (!vGestureDetected && fingerTrail.length > 1) {
        drawTrailLine();
        drawProgressIndicator();
    }
    
    // Update sparkles
    for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        
        // Store trail
        s.trail.push({ x: s.x, y: s.y });
        if (s.trail.length > s.maxTrail) s.trail.shift();
        
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.15;
        s.vx *= 0.99;
        s.life -= s.decay;
        s.rotation += s.rotationSpeed;
        
        if (s.life <= 0) {
            sparkles.splice(i, 1);
            continue;
        }
        
        drawSparkle(s);
    }
    
    requestAnimationFrame(updateSparkles);
}

// Draw snowflakes
function drawSnowflakes() {
    snowflakes.forEach(snow => {
        snow.y += snow.speed;
        snow.wobble += snow.wobbleSpeed;
        snow.x += Math.sin(snow.wobble) * 0.5;
        
        if (snow.y > window.innerHeight + 10) {
            snow.y = -10;
            snow.x = Math.random() * window.innerWidth;
        }
        
        if (snow.x < -10) snow.x = window.innerWidth + 10;
        if (snow.x > window.innerWidth + 10) snow.x = -10;
        
        trailCtx.save();
        trailCtx.globalAlpha = snow.opacity * (vGestureDetected ? 0.3 : 1);
        trailCtx.fillStyle = '#FFFFFF';
        trailCtx.shadowColor = '#FFFFFF';
        trailCtx.shadowBlur = 5;
        
        trailCtx.beginPath();
        trailCtx.arc(snow.x, snow.y, snow.size, 0, Math.PI * 2);
        trailCtx.fill();
        
        trailCtx.restore();
    });
}

// Draw progress indicator
function drawProgressIndicator() {
    if (vDetectionProgress < 5) return;
    
    const centerX = window.innerWidth / 2;
    const y = 60;
    const width = 250;
    const height = 12;
    const radius = 6;
    
    // Background
    trailCtx.save();
    trailCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    trailCtx.shadowBlur = 10;
    
    trailCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    trailCtx.beginPath();
    trailCtx.roundRect(centerX - width/2 - 4, y - 4, width + 8, height + 8, radius + 2);
    trailCtx.fill();
    
    // Progress track
    trailCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    trailCtx.beginPath();
    trailCtx.roundRect(centerX - width/2, y, width, height, radius);
    trailCtx.fill();
    
    // Progress fill
    const fillWidth = (vDetectionProgress / 100) * width;
    const gradient = trailCtx.createLinearGradient(centerX - width/2, 0, centerX + width/2, 0);
    
    if (vDetectionProgress < 40) {
        gradient.addColorStop(0, '#FF6B6B');
        gradient.addColorStop(1, '#FFD700');
    } else if (vDetectionProgress < 70) {
        gradient.addColorStop(0, '#FFD700');
        gradient.addColorStop(1, '#32CD32');
    } else {
        gradient.addColorStop(0, '#32CD32');
        gradient.addColorStop(0.5, '#00FFFF');
        gradient.addColorStop(1, '#FFD700');
    }
    
    trailCtx.fillStyle = gradient;
    trailCtx.shadowColor = vDetectionProgress > 50 ? '#00FF00' : '#FFD700';
    trailCtx.shadowBlur = 15;
    trailCtx.beginPath();
    trailCtx.roundRect(centerX - width/2, y, Math.max(fillWidth, radius * 2), height, radius);
    trailCtx.fill();
    
    // Percentage text
    trailCtx.shadowBlur = 0;
    trailCtx.fillStyle = '#FFFFFF';
    trailCtx.font = 'bold 14px Poppins, sans-serif';
    trailCtx.textAlign = 'center';
    trailCtx.fillText(`${Math.round(vDetectionProgress)}%`, centerX, y + height + 22);
    
    // Status text
    let statusText = vDetectionProgress < 40 ? '✋ Keep drawing...' : 
                     vDetectionProgress < 70 ? '✌️ Almost there!' : '🎄 Perfect!';
    trailCtx.font = '12px Poppins, sans-serif';
    trailCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    trailCtx.fillText(statusText, centerX, y + height + 40);
    
    trailCtx.restore();
}

// Draw trail line
function drawTrailLine() {
    if (fingerTrail.length < 2) return;
    
    // Glow effect
    trailCtx.save();
    trailCtx.shadowColor = vDetectionProgress > 50 ? '#00FF00' : '#FFD700';
    trailCtx.shadowBlur = 30;
    
    // Main trail
    trailCtx.beginPath();
    trailCtx.moveTo(fingerTrail[0].screenX, fingerTrail[0].screenY);
    
    for (let i = 1; i < fingerTrail.length; i++) {
        const p = fingerTrail[i];
        const prev = fingerTrail[i - 1];
        
        // Smooth curve
        const cpX = (prev.screenX + p.screenX) / 2;
        const cpY = (prev.screenY + p.screenY) / 2;
        trailCtx.quadraticCurveTo(prev.screenX, prev.screenY, cpX, cpY);
    }
    
    const lastPoint = fingerTrail[fingerTrail.length - 1];
    trailCtx.lineTo(lastPoint.screenX, lastPoint.screenY);
    
    // Gradient stroke
    const gradient = trailCtx.createLinearGradient(
        fingerTrail[0].screenX, fingerTrail[0].screenY,
        lastPoint.screenX, lastPoint.screenY
    );
    
    if (vDetectionProgress < 50) {
        gradient.addColorStop(0, 'rgba(255, 107, 107, 0.4)');
        gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 1)');
    } else {
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.5)');
        gradient.addColorStop(0.5, 'rgba(50, 205, 50, 0.9)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 1)');
    }
    
    trailCtx.strokeStyle = gradient;
    trailCtx.lineWidth = 6;
    trailCtx.lineCap = 'round';
    trailCtx.lineJoin = 'round';
    trailCtx.stroke();
    
    trailCtx.restore();
    
    // Draw key points
    drawKeyPoints();
}

// Draw key points
function drawKeyPoints() {
    if (fingerTrail.length < 3) return;
    
    const points = fingerTrail;
    const lowest = findLowestPoint(points);
    
    // Start point
    drawGlowPoint(points[0].screenX, points[0].screenY, '#32CD32', 10, 'START');
    
    // Bottom V point
    if (lowest.index > 2 && lowest.index < points.length - 2) {
        drawGlowPoint(
            points[lowest.index].screenX, 
            points[lowest.index].screenY, 
            '#FF6347', 12, 'V'
        );
    }
    
    // Current point
    const last = points[points.length - 1];
    drawGlowPoint(last.screenX, last.screenY, '#FFD700', 14, '');
}

// Draw glowing point
function drawGlowPoint(x, y, color, size, label) {
    trailCtx.save();
    
    // Outer glow
    const gradient = trailCtx.createRadialGradient(x, y, 0, x, y, size * 2);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, color + '80');
    gradient.addColorStop(1, 'transparent');
    
    trailCtx.fillStyle = gradient;
    trailCtx.beginPath();
    trailCtx.arc(x, y, size * 2, 0, Math.PI * 2);
    trailCtx.fill();
    
    // Inner point
    trailCtx.shadowColor = color;
    trailCtx.shadowBlur = 20;
    trailCtx.fillStyle = color;
    trailCtx.beginPath();
    trailCtx.arc(x, y, size / 2, 0, Math.PI * 2);
    trailCtx.fill();
    
    // Label
    if (label) {
        trailCtx.shadowBlur = 5;
        trailCtx.fillStyle = '#FFFFFF';
        trailCtx.font = 'bold 11px Poppins, sans-serif';
        trailCtx.textAlign = 'center';
        trailCtx.fillText(label, x, y - size - 5);
    }
    
    trailCtx.restore();
}

// Draw sparkle
function drawSparkle(s) {
    trailCtx.save();
    trailCtx.globalAlpha = s.life;
    
    // Draw trail
    if (s.trail.length > 1) {
        trailCtx.beginPath();
        trailCtx.moveTo(s.trail[0].x, s.trail[0].y);
        for (let i = 1; i < s.trail.length; i++) {
            trailCtx.lineTo(s.trail[i].x, s.trail[i].y);
        }
        trailCtx.strokeStyle = s.color + Math.floor(s.life * 50).toString(16).padStart(2, '0');
        trailCtx.lineWidth = s.size * s.life * 0.5;
        trailCtx.stroke();
    }
    
    trailCtx.translate(s.x, s.y);
    trailCtx.rotate(s.rotation);
    
    trailCtx.shadowColor = s.color;
    trailCtx.shadowBlur = 15;
    trailCtx.fillStyle = s.color;
    
    const size = s.size * s.life;
    
    if (s.type === 'star') {
        // 4-pointed star
        trailCtx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
            const outerX = Math.cos(angle) * size;
            const outerY = Math.sin(angle) * size;
            const innerAngle = angle + Math.PI / 4;
            const innerX = Math.cos(innerAngle) * size * 0.35;
            const innerY = Math.sin(innerAngle) * size * 0.35;
            
            if (i === 0) trailCtx.moveTo(outerX, outerY);
            else trailCtx.lineTo(outerX, outerY);
            trailCtx.lineTo(innerX, innerY);
        }
        trailCtx.closePath();
        trailCtx.fill();
    } else {
        // Circle with glow
        trailCtx.beginPath();
        trailCtx.arc(0, 0, size, 0, Math.PI * 2);
        trailCtx.fill();
    }
    
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

// Reset system
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

// Check completion
function isVGestureCompleted() {
    return vGestureDetected;
}

// Polyfill for roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}
