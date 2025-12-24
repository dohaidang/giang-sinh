// ==========================================
// THREE.JS SYSTEM
// ==========================================
let scene, camera, renderer;
let groupGold, groupRed, groupGift; 
let photoMeshes = [];    
let titleMesh, starMesh, loveMesh;

let state = 'TREE'; 
let previousState = 'TREE';
let selectedIndex = 0;
let handX = 0.5;

// Transition system
let transitionState = {
    isActive: false,
    from: 'TREE',
    to: 'TREE',
    progress: 0, // 0 to 1
    duration: 0.8, // seconds
    startTime: 0
};

// Firework system
let fireworkParticles = [];
let fireworkGeometry = null;
let fireworkMaterial = null;
let fireworkPoints = null;

// Snow system
let snowGeometry = null;
let snowMaterial = null;
let snowPoints = null;

function init3D() {
    try {
        // Check if Three.js is loaded
        if (typeof THREE === 'undefined') {
            showError('Three.js Not Loaded', 
                'Three.js library failed to load. Please check your internet connection and refresh the page.');
            return;
        }

        const container = document.getElementById('canvas-container');
        scene = new THREE.Scene();
        scene.fog = new THREE.FogExp2(0x000000, 0.002);

        camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
        camera.position.z = 100;

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        groupGold = createParticleSystem('gold', CONFIG.goldCount, 2.0);
        groupRed = createParticleSystem('red', CONFIG.redCount, 3.5); 
        groupGift = createParticleSystem('gift', CONFIG.giftCount, 3.0); 

        createPhotos();
        createDecorations();
        initFireworkSystem();
        initSnowSystem();
        animate();
    } catch (e) {
        console.error('Error initializing 3D scene:', e);
        showError('3D Scene Initialization Failed', 
            'Failed to initialize 3D graphics: ' + e.message + '. Your browser may not support WebGL.');
    }
}

function createParticleSystem(type, count, size) {
    const pPositions = [];
    const pExplodeTargets = [];
    const pTreeTargets = [];
    const pHeartTargets = [];
    const sizes = []; 
    const phases = []; 
    
    for(let i=0; i<count; i++) {
        const h = Math.random() * CONFIG.treeHeight; 
        const y = h - CONFIG.treeHeight / 2;
        let radiusRatio = (type === 'gold') ? Math.sqrt(Math.random()) : 0.9 + Math.random()*0.1;
        const maxR = (1 - (h / CONFIG.treeHeight)) * CONFIG.treeBaseRadius;
        const r = maxR * radiusRatio; 
        const theta = Math.random() * Math.PI * 2;
        pTreeTargets.push(r * Math.cos(theta), y, r * Math.sin(theta));

        const u = Math.random();
        const v = Math.random();
        const phi = Math.acos(2 * v - 1);
        const lam = 2 * Math.PI * u;
        let radMult = (type === 'gift') ? 1.2 : 1.0;
        const rad = CONFIG.explodeRadius * Math.cbrt(Math.random()) * radMult;
        pExplodeTargets.push(rad * Math.sin(phi) * Math.cos(lam), rad * Math.sin(phi) * Math.sin(lam), rad * Math.cos(phi));

        const tHeart = Math.random() * Math.PI * 2;
        let hx = 16 * Math.pow(Math.sin(tHeart), 3);
        let hy = 13 * Math.cos(tHeart) - 5 * Math.cos(2*tHeart) - 2 * Math.cos(3*tHeart) - Math.cos(4*tHeart);
        
        const rFill = Math.pow(Math.random(), 0.3);
        hx *= rFill; hy *= rFill;
        let hz = (Math.random() - 0.5) * 8 * rFill; 
        
        const noise = 1.0;
        hx += (Math.random() - 0.5) * noise;
        hy += (Math.random() - 0.5) * noise;
        hz += (Math.random() - 0.5) * noise;

        const scaleH = 2.2;
        pHeartTargets.push(hx * scaleH, hy * scaleH + 5, hz); 

        pPositions.push(pTreeTargets[i*3], pTreeTargets[i*3+1], pTreeTargets[i*3+2]);
        sizes.push(size);
        phases.push(Math.random() * Math.PI * 2);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pPositions, 3));
    geo.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    const colors = new Float32Array(count * 3);
    const baseColor = new THREE.Color();
    if(type === 'gold') baseColor.setHex(0xFFD700);
    else if(type === 'red') baseColor.setHex(0xFF0000);
    else baseColor.setHex(0xFFFFFF);

    for(let i=0; i<count; i++) {
        colors[i*3] = baseColor.r;
        colors[i*3+1] = baseColor.g;
        colors[i*3+2] = baseColor.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    geo.userData = { 
        tree: pTreeTargets, explode: pExplodeTargets, heart: pHeartTargets, 
        phases: phases, baseColor: baseColor, baseSize: size
    };

    // Enhanced particle material with glow effect
    const mat = new THREE.PointsMaterial({
        size: size,
        sizeAttenuation: true,
        map: textures[type],
        transparent: true, 
        opacity: 1.0,
        vertexColors: true, 
        blending: (type === 'gift') ? THREE.NormalBlending : THREE.AdditiveBlending,
        depthWrite: false // Better for additive blending
    });

    const points = new THREE.Points(geo, mat);
    // Render particles behind photos
    points.renderOrder = 1;
    scene.add(points);
    return points;
}

function createPhotos() {
    const geo = new THREE.PlaneGeometry(8, 8);

    for(let i=0; i<5; i++) {
        const mat = new THREE.MeshBasicMaterial({ 
            map: photoTextures[i], 
            side: THREE.DoubleSide,
            transparent: false, // No transparency needed for photos
            opacity: 1.0
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.visible = false; 
        mesh.scale.set(0,0,0);
        scene.add(mesh);
        photoMeshes.push(mesh);
    }
}

function createDecorations() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold italic 90px "Times New Roman"';
    ctx.fillStyle = '#FFD700'; ctx.textAlign = 'center';
    ctx.shadowColor = "#FF0000"; ctx.shadowBlur = 40; 
    ctx.fillText("MERRY CHRISTMAS", 512, 130);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending });
    titleMesh = new THREE.Mesh(new THREE.PlaneGeometry(60, 15), mat);
    titleMesh.position.set(0, 50, 0);
    scene.add(titleMesh);

    const starCanvas = document.createElement('canvas');
    starCanvas.width = 128; starCanvas.height = 128;
    const sCtx = starCanvas.getContext('2d');
    sCtx.fillStyle = "#FFFF00"; sCtx.shadowColor="#FFF"; sCtx.shadowBlur=20;
    sCtx.beginPath();
    const cx=64, cy=64, outer=50, inner=20;
    for(let i=0; i<5; i++){
        sCtx.lineTo(cx + Math.cos((18+i*72)/180*Math.PI)*outer, cy - Math.sin((18+i*72)/180*Math.PI)*outer);
        sCtx.lineTo(cx + Math.cos((54+i*72)/180*Math.PI)*inner, cy - Math.sin((54+i*72)/180*Math.PI)*inner);
    }
    sCtx.closePath(); sCtx.fill();
    const starTex = new THREE.CanvasTexture(starCanvas);
    const starMat = new THREE.MeshBasicMaterial({ map: starTex, transparent: true, blending: THREE.AdditiveBlending });
    starMesh = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), starMat);
    starMesh.position.set(0, CONFIG.treeHeight/2 + 2, 0);
    scene.add(starMesh);

    const loveCanvas = document.createElement('canvas');
    loveCanvas.width = 1024; loveCanvas.height = 256;
    const lCtx = loveCanvas.getContext('2d');
    lCtx.font = 'bold 120px "Segoe UI", sans-serif';
    lCtx.fillStyle = '#FF69B4'; lCtx.textAlign = 'center';
    lCtx.shadowColor = "#FF1493"; lCtx.shadowBlur = 40; 
    lCtx.fillText("I LOVE YOU ❤️", 512, 130);
    const loveTex = new THREE.CanvasTexture(loveCanvas);
    const loveMat = new THREE.MeshBasicMaterial({ map: loveTex, transparent: true, blending: THREE.AdditiveBlending });
    loveMesh = new THREE.Mesh(new THREE.PlaneGeometry(70, 18), loveMat);
    loveMesh.position.set(0, 0, 20);
    loveMesh.visible = false;
    scene.add(loveMesh);
}

// Initialize firework system
function initFireworkSystem() {
    const maxParticles = 500;
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);
    const velocities = new Float32Array(maxParticles * 3);
    const lifetimes = new Float32Array(maxParticles);
    
    fireworkGeometry = new THREE.BufferGeometry();
    fireworkGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    fireworkGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    fireworkGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    fireworkGeometry.userData = {
        positions: positions,
        colors: colors,
        sizes: sizes,
        velocities: velocities,
        lifetimes: lifetimes,
        count: 0,
        maxCount: maxParticles
    };
    
    fireworkMaterial = new THREE.PointsMaterial({
        size: 3.0, // Larger size for better visibility
        sizeAttenuation: true,
        transparent: true,
        opacity: 1.0,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    fireworkPoints = new THREE.Points(fireworkGeometry, fireworkMaterial);
    // Render fireworks behind photos
    fireworkPoints.renderOrder = 1;
    scene.add(fireworkPoints);
}

// Initialize snow system
function initSnowSystem() {
    const snowCount = CONFIG.snowCount;
    const positions = new Float32Array(snowCount * 3);
    const sizes = new Float32Array(snowCount);
    const speeds = new Float32Array(snowCount);
    const windOffsets = new Float32Array(snowCount);
    
    // Initialize snow particles
    for (let i = 0; i < snowCount; i++) {
        // Random position in a wide area (closer to camera)
        positions[i * 3] = (Math.random() - 0.5) * 200; // x
        positions[i * 3 + 1] = Math.random() * 150 + 50; // y (start from top)
        positions[i * 3 + 2] = (Math.random() - 0.5) * 100 + 50; // z (in front of scene, near camera)
        
        // Random size (larger for better visibility)
        sizes[i] = 1.5 + Math.random() * 2.5;
        
        // Random fall speed
        speeds[i] = 0.15 + Math.random() * 0.25;
        
        // Random wind offset for variation
        windOffsets[i] = Math.random() * Math.PI * 2;
    }
    
    snowGeometry = new THREE.BufferGeometry();
    snowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    snowGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    snowGeometry.userData = {
        positions: positions,
        sizes: sizes,
        speeds: speeds,
        windOffsets: windOffsets,
        count: snowCount
    };
    
    // Create snow texture (simple white circle)
    const snowCanvas = document.createElement('canvas');
    snowCanvas.width = 32;
    snowCanvas.height = 32;
    const snowCtx = snowCanvas.getContext('2d');
    const gradient = snowCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    snowCtx.fillStyle = gradient;
    snowCtx.fillRect(0, 0, 32, 32);
    const snowTexture = new THREE.CanvasTexture(snowCanvas);
    
    snowMaterial = new THREE.PointsMaterial({
        size: 4.0, // Larger size for better visibility
        sizeAttenuation: true,
        map: snowTexture,
        transparent: true,
        opacity: 0.9, // Higher opacity for better visibility
        color: 0xFFFFFF,
        blending: THREE.AdditiveBlending, // Additive blending for glow effect
        depthWrite: false
    });
    
    snowPoints = new THREE.Points(snowGeometry, snowMaterial);
    // Render snow behind photos
    snowPoints.renderOrder = 1;
    scene.add(snowPoints);
}

// Update snow particles
function updateSnow(time) {
    if (!snowPoints || !snowGeometry) return;
    
    const geo = snowGeometry.userData;
    if (!geo || !geo.positions) return;
    
    const windStrength = Math.sin(time * 0.3) * 0.5; // Increased wind strength
    
    for (let i = 0; i < geo.count; i++) {
        // Update Y position (fall down)
        geo.positions[i * 3 + 1] -= geo.speeds[i];
        
        // Wind effect (horizontal movement) - more visible
        geo.positions[i * 3] += windStrength * Math.sin(time * 0.5 + geo.windOffsets[i]) * 0.2;
        
        // Slight rotation effect (swaying) - more visible
        geo.positions[i * 3 + 2] += Math.sin(time * 0.4 + geo.windOffsets[i]) * 0.1;
        
        // Reset particle when it falls below view
        if (geo.positions[i * 3 + 1] < -100) {
            geo.positions[i * 3] = (Math.random() - 0.5) * 200; // Random x
            geo.positions[i * 3 + 1] = 150; // Reset to top
            geo.positions[i * 3 + 2] = (Math.random() - 0.5) * 100 + 50; // Random z (near camera)
        }
        
        // Keep particles in bounds horizontally
        if (Math.abs(geo.positions[i * 3]) > 120) {
            geo.positions[i * 3] = (Math.random() - 0.5) * 200;
        }
        if (geo.positions[i * 3 + 2] < 0 || geo.positions[i * 3 + 2] > 150) {
            geo.positions[i * 3 + 2] = (Math.random() - 0.5) * 100 + 50;
        }
    }
    
    snowGeometry.attributes.position.needsUpdate = true;
}

// Create firework burst at position
function createFireworkBurst(position, color, count = 50) {
    const geo = fireworkGeometry.userData;
    const startIdx = geo.count;
    const endIdx = Math.min(startIdx + count, geo.maxCount);
    const actualCount = endIdx - startIdx;
    
    if (actualCount <= 0) return;
    
    const colors = [
        color || 0xFFD700, // Gold
        0xFF0000, // Red
        0x00FF00, // Green
        0x0000FF, // Blue
        0xFF00FF, // Magenta
        0x00FFFF  // Cyan
    ];
    
    for (let i = 0; i < actualCount; i++) {
        const idx = startIdx + i;
        
        // Position
        geo.positions[idx * 3] = position.x;
        geo.positions[idx * 3 + 1] = position.y;
        geo.positions[idx * 3 + 2] = position.z;
        
        // Random velocity (spherical explosion)
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 0.5 + Math.random() * 1.5;
        
        geo.velocities[idx * 3] = speed * Math.sin(phi) * Math.cos(theta);
        geo.velocities[idx * 3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
        geo.velocities[idx * 3 + 2] = speed * Math.cos(phi);
        
        // Color (random from palette)
        const particleColor = new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
        geo.colors[idx * 3] = particleColor.r;
        geo.colors[idx * 3 + 1] = particleColor.g;
        geo.colors[idx * 3 + 2] = particleColor.b;
        
        // Size (larger for better visibility)
        geo.sizes[idx] = 2.0 + Math.random() * 3.0;
        
        // Lifetime (longer for better visibility)
        geo.lifetimes[idx] = 1.5;
    }
    
    geo.count = endIdx;
    fireworkGeometry.attributes.position.needsUpdate = true;
    fireworkGeometry.attributes.color.needsUpdate = true;
    fireworkGeometry.attributes.size.needsUpdate = true;
}

// Update firework particles
function updateFireworks(deltaTime) {
    const geo = fireworkGeometry.userData;
    if (geo.count === 0) return;
    
    let activeCount = 0;
    
    for (let i = 0; i < geo.count; i++) {
        if (geo.lifetimes[i] <= 0) continue;
        
        // Update position
        geo.positions[i * 3] += geo.velocities[i * 3] * deltaTime * 60;
        geo.positions[i * 3 + 1] += geo.velocities[i * 3 + 1] * deltaTime * 60;
        geo.positions[i * 3 + 2] += geo.velocities[i * 3 + 2] * deltaTime * 60;
        
        // Apply gravity
        geo.velocities[i * 3 + 1] -= 0.02 * deltaTime * 60;
        
        // Fade out (slower for longer visibility)
        geo.lifetimes[i] -= deltaTime * 1.5;
        
        // Update size and opacity based on lifetime
        const lifeRatio = Math.max(0, geo.lifetimes[i]);
        geo.sizes[i] *= 0.98;
        
        // Fade color
        geo.colors[i * 3] *= lifeRatio;
        geo.colors[i * 3 + 1] *= lifeRatio;
        geo.colors[i * 3 + 2] *= lifeRatio;
        
        if (geo.lifetimes[i] > 0) {
            activeCount++;
        }
    }
    
    // Remove dead particles (simple approach: reset count)
    if (activeCount === 0) {
        geo.count = 0;
    } else {
        // Compact array (move active particles to front)
        let writeIdx = 0;
        for (let i = 0; i < geo.count; i++) {
            if (geo.lifetimes[i] > 0) {
                if (writeIdx !== i) {
                    // Copy particle data
                    geo.positions[writeIdx * 3] = geo.positions[i * 3];
                    geo.positions[writeIdx * 3 + 1] = geo.positions[i * 3 + 1];
                    geo.positions[writeIdx * 3 + 2] = geo.positions[i * 3 + 2];
                    geo.velocities[writeIdx * 3] = geo.velocities[i * 3];
                    geo.velocities[writeIdx * 3 + 1] = geo.velocities[i * 3 + 1];
                    geo.velocities[writeIdx * 3 + 2] = geo.velocities[i * 3 + 2];
                    geo.colors[writeIdx * 3] = geo.colors[i * 3];
                    geo.colors[writeIdx * 3 + 1] = geo.colors[i * 3 + 1];
                    geo.colors[writeIdx * 3 + 2] = geo.colors[i * 3 + 2];
                    geo.sizes[writeIdx] = geo.sizes[i];
                    geo.lifetimes[writeIdx] = geo.lifetimes[i];
                }
                writeIdx++;
            }
        }
        geo.count = writeIdx;
    }
    
    if (geo.count > 0) {
        fireworkGeometry.attributes.position.needsUpdate = true;
        fireworkGeometry.attributes.color.needsUpdate = true;
        fireworkGeometry.attributes.size.needsUpdate = true;
    }
}

function updateParticleGroup(group, type, targetState, speed, handRotY, time) {
    const positions = group.geometry.attributes.position.array;
    const sizes = group.geometry.attributes.size.array;
    const colors = group.geometry.attributes.color.array;
    const phases = group.geometry.userData.phases;
    const baseColor = group.geometry.userData.baseColor;
    const baseSize = group.geometry.userData.baseSize;
    
    const targetKey = (targetState === 'TREE') ? 'tree' : (targetState === 'HEART' ? 'heart' : 'explode');
    const targets = group.geometry.userData[(targetState === 'PHOTO') ? 'explode' : targetKey];

    for(let i=0; i<positions.length; i++) {
        positions[i] += (targets[i] - positions[i]) * speed;
    }
    group.geometry.attributes.position.needsUpdate = true;
    
    const count = positions.length / 3;
    
    // Color cycling helper
    const tempColor = new THREE.Color();
    const hueShift = Math.sin(time * 0.5) * 0.1;
    
    if (targetState === 'TREE') {
        group.rotation.y += 0.003;
        
        for(let i=0; i<count; i++) {
            // Enhanced size pulsing
            const sizePulse = 1.0 + Math.sin(time * 5 + phases[i]) * 0.15;
            sizes[i] = baseSize * sizePulse;
            
            // Enhanced brightness
            let brightness = 1.0;
            if(type === 'red') {
                brightness = 0.6 + 0.4 * Math.sin(time * 3 + phases[i]);
            } else if(type === 'gold') {
                brightness = 0.85 + 0.35 * Math.sin(time * 10 + phases[i]);
            }
            
            // Color cycling with hue shift
            tempColor.copy(baseColor);
            tempColor.offsetHSL(hueShift, 0, (brightness - 1.0) * 0.1);
            
            colors[i*3]   = tempColor.r;
            colors[i*3+1] = tempColor.g;
            colors[i*3+2] = tempColor.b;
        }
        group.geometry.attributes.color.needsUpdate = true;
        group.geometry.attributes.size.needsUpdate = true;
        
        // Material opacity pulsing for glow
        group.material.opacity = 0.85 + Math.sin(time * 2) * 0.15;

    } else if (targetState === 'HEART') {
        group.rotation.y = 0;
        const beatScale = 1 + Math.abs(Math.sin(time * 3)) * 0.15;
        group.scale.set(beatScale, beatScale, beatScale);

        for(let i=0; i<count; i++) {
            if (i % 3 === 0) {
                // Heart particles with pulsing size
                const heartPulse = 1.0 + Math.sin(time * 4 + phases[i]) * 0.2;
                sizes[i] = baseSize * heartPulse;
                
                // Pink/red color with pulsing
                const heartBrightness = 0.8 + Math.sin(time * 3) * 0.2;
                tempColor.setHSL(0.95, 0.8, heartBrightness * 0.7);
                
                colors[i*3] = tempColor.r;
                colors[i*3+1] = tempColor.g;
                colors[i*3+2] = tempColor.b;
            } else {
                sizes[i] = 0;
            }
        }
        group.geometry.attributes.color.needsUpdate = true;
        group.geometry.attributes.size.needsUpdate = true;
        
        // Enhanced glow for heart
        group.material.opacity = 0.9 + Math.sin(time * 3) * 0.1;

    } else {
        group.scale.set(1,1,1);
        group.rotation.y += (handRotY - group.rotation.y) * 0.1;

        for(let i=0; i<count; i++) {
            // Enhanced size pulsing for explode state
            const explodePulse = 1.0 + Math.sin(time * 8 + phases[i]) * 0.25;
            sizes[i] = baseSize * explodePulse;
            
            // Enhanced brightness
            let brightness = 1.0;
            if(type === 'gold' || type === 'red') {
                brightness = 0.85 + 0.5 * Math.sin(time * 12 + phases[i]);
            } else if(type === 'gift') {
                brightness = 0.9 + 0.3 * Math.sin(time * 6 + phases[i]);
            }
            
            // Color cycling with more intensity
            const explodeHueShift = Math.sin(time * 1.5 + phases[i] * 0.1) * 0.15;
            tempColor.copy(baseColor);
            tempColor.offsetHSL(explodeHueShift, 0, (brightness - 1.0) * 0.05);
            
            colors[i*3]   = tempColor.r;
            colors[i*3+1] = tempColor.g;
            colors[i*3+2] = tempColor.b;
        }
        group.geometry.attributes.size.needsUpdate = true;
        group.geometry.attributes.color.needsUpdate = true;
        
        // Enhanced glow for explode state
        group.material.opacity = 0.9 + Math.sin(time * 4) * 0.1;
    }
}

// Start transition when state changes
function startTransition(fromState, toState) {
    transitionState.isActive = true;
    transitionState.from = fromState;
    transitionState.to = toState;
    transitionState.progress = 0;
    transitionState.startTime = Date.now() * 0.001;
    previousState = fromState;
    
    // Create firework effects based on transition
    createFireworkForTransition(fromState, toState);
}

// Create firework effects for state transitions
function createFireworkForTransition(fromState, toState) {
    if (!fireworkPoints || !camera) return;
    
    // Firework position (near camera, in front of scene)
    const fireworkPos = new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        camera.position.z - 30 // Further in front for better visibility
    );
    
    let color = 0xFFD700; // Default gold
    let count = 50;
    
    // Different firework effects for different transitions
    if (fromState === 'TREE' && toState === 'EXPLODE') {
        // Big burst when exploding
        color = 0xFF0000; // Red
        count = 80;
        // Multiple bursts
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const pos = new THREE.Vector3(
                    (Math.random() - 0.5) * 50,
                    (Math.random() - 0.5) * 50,
                    camera.position.z - 20
                );
                createFireworkBurst(pos, color, count);
            }, i * 100);
        }
    } else if (toState === 'HEART') {
        // Pink/red sparkles for heart
        color = 0xFF69B4; // Pink
        count = 60;
        createFireworkBurst(fireworkPos, color, count);
    } else if (toState === 'PHOTO') {
        // Gold sparkles for photo
        color = 0xFFD700; // Gold
        count = 40;
        createFireworkBurst(fireworkPos, color, count);
    } else if (fromState === 'EXPLODE' && toState === 'TREE') {
        // Green/gold when returning to tree
        color = 0x00FF00; // Green
        count = 50;
        createFireworkBurst(fireworkPos, color, count);
    } else {
        // Default firework
        createFireworkBurst(fireworkPos, color, count);
    }
}

// Update transition progress
function updateTransition(time) {
    if (!transitionState.isActive) return;
    
    const elapsed = time - transitionState.startTime;
    transitionState.progress = Math.min(elapsed / transitionState.duration, 1);
    
    if (transitionState.progress >= 1) {
        transitionState.isActive = false;
        transitionState.progress = 1;
    }
}

// Easing function for smooth transitions
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animate() {
    requestAnimationFrame(animate);
    const time = Date.now() * 0.001;
    
    // Check for state changes
    if (state !== previousState) {
        startTransition(previousState, state);
    }
    
    // Update transition
    updateTransition(time);
    
    // Calculate transition progress with easing
    const easedProgress = transitionState.isActive ? easeInOutCubic(transitionState.progress) : 1;
    
    // IMPORTANT: Hide/show particles BEFORE updating them
    // In PHOTO state, hide all particles to prevent yellow overlay on photos
    if (state === 'PHOTO') {
        if (groupGold) groupGold.visible = false;
        if (groupRed) groupRed.visible = false;
        if (groupGift) groupGift.visible = false;
        if (snowPoints) snowPoints.visible = false;
        if (fireworkPoints) fireworkPoints.visible = false;
    } else {
        if (groupGold) groupGold.visible = true;
        if (groupRed) groupRed.visible = true;
        if (groupGift) groupGift.visible = true;
        if (snowPoints) snowPoints.visible = true;
        if (fireworkPoints) fireworkPoints.visible = true;
    }
    
    // Only update particles if they are visible
    if (state !== 'PHOTO') {
        const currentState = transitionState.isActive ? transitionState.to : state;
        const speed = transitionState.isActive ? 
            0.08 * (0.3 + easedProgress * 0.7) : // Slower during transition
            0.08;
        const handRotY = (handX - 0.5) * 4.0;

        updateParticleGroup(groupGold, 'gold', currentState, speed, handRotY, time);
        updateParticleGroup(groupRed, 'red', currentState, speed, handRotY, time);
        updateParticleGroup(groupGift, 'gift', currentState, speed, handRotY, time);
        
        // Update fireworks
        const deltaTime = 0.016; // ~60fps
        updateFireworks(deltaTime);
        
        // Update snow
        updateSnow(time);
    }

    photoMeshes.forEach((mesh, i) => {
        if(!mesh.material.map && photoTextures[i]) {
            mesh.material.map = photoTextures[i]; 
            mesh.material.needsUpdate = true;
        }
        // Ensure material is properly set
        if (mesh.material && !mesh.material.transparent) {
            mesh.material.transparent = true;
        }
    });

    // Apply smooth transitions to meshes
    const transitionOpacity = transitionState.isActive ? easedProgress : 1;
    const reverseOpacity = transitionState.isActive ? 1 - easedProgress : 0;
    
    if (state === 'TREE') {
        // Fade in title and star
        const targetOpacity = transitionState.isActive && transitionState.to === 'TREE' ? 
            transitionOpacity : (transitionState.isActive && transitionState.from === 'TREE' ? 
            reverseOpacity : 1);
        
        titleMesh.visible = targetOpacity > 0.01;
        starMesh.visible = targetOpacity > 0.01;
        loveMesh.visible = false;
        
        if (titleMesh.visible) {
            const targetScale = 0.5 + targetOpacity * 0.5; // Scale from 0.5 to 1
            titleMesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
            titleMesh.material.opacity = targetOpacity;
        }
        
        starMesh.rotation.z -= 0.02; 
        if (starMesh.visible) {
            starMesh.material.opacity = (0.7 + 0.3*Math.sin(time*5)) * targetOpacity;
        }
        
        photoMeshes.forEach(m => { 
            m.scale.lerp(new THREE.Vector3(0,0,0), 0.15); 
            m.visible = false; 
        });

    } else if (state === 'HEART') {
        // Fade out title/star, fade in love
        const loveOpacity = transitionState.isActive && transitionState.to === 'HEART' ? 
            transitionOpacity : (transitionState.isActive && transitionState.from === 'HEART' ? 
            reverseOpacity : 1);
        
        const titleOpacity = transitionState.isActive && transitionState.from === 'TREE' ? 
            reverseOpacity : 0;
        
        titleMesh.visible = titleOpacity > 0.01;
        starMesh.visible = titleOpacity > 0.01;
        loveMesh.visible = loveOpacity > 0.01;
        
        if (titleMesh.visible) {
            titleMesh.material.opacity = titleOpacity;
            titleMesh.scale.lerp(new THREE.Vector3(titleOpacity, titleOpacity, titleOpacity), 0.15);
        }
        if (starMesh.visible) {
            starMesh.material.opacity = titleOpacity;
        }
        
        if (loveMesh.visible) {
            const s = (0.5 + loveOpacity * 0.5) * (1 + Math.abs(Math.sin(time*3))*0.1);
            loveMesh.scale.set(s, s, 1);
            loveMesh.material.opacity = loveOpacity;
        }
        
        photoMeshes.forEach(m => { m.visible = false; });

    } else if (state === 'EXPLODE') {
        // Fade out decorations, fade in photos
        const photoOpacity = transitionState.isActive && transitionState.to === 'EXPLODE' ? 
            Math.max(0.5, transitionOpacity) : 1; // Minimum 0.5 during transition, 1 when stable
        
        const decorationOpacity = transitionState.isActive && transitionState.from === 'TREE' ? 
            reverseOpacity : 0;
        
        titleMesh.visible = decorationOpacity > 0.01;
        starMesh.visible = decorationOpacity > 0.01;
        loveMesh.visible = false;
        
        if (titleMesh.visible) {
            titleMesh.material.opacity = decorationOpacity;
            titleMesh.scale.lerp(new THREE.Vector3(decorationOpacity, decorationOpacity, decorationOpacity), 0.15);
        }
        if (starMesh.visible) {
            starMesh.material.opacity = decorationOpacity;
        }
        
        const baseAngle = groupGold.rotation.y; 
        const angleStep = (Math.PI * 2) / 5;
        let bestIdx = 0; let maxZ = -999;
        photoMeshes.forEach((mesh, i) => {
            // Always show photos in EXPLODE state
            mesh.visible = true;
            const angle = baseAngle + i * angleStep;
            const x = Math.sin(angle) * CONFIG.photoOrbitRadius;
            const z = Math.cos(angle) * CONFIG.photoOrbitRadius;
            const y = Math.sin(time + i) * 3; 
            mesh.position.lerp(new THREE.Vector3(x, y, z), 0.15);
            mesh.lookAt(camera.position);
            mesh.material.opacity = Math.max(0.7, photoOpacity); // Minimum opacity 0.7 for visibility
            // Ensure material map is set
            if (!mesh.material.map && photoTextures[i]) {
                mesh.material.map = photoTextures[i];
                mesh.material.needsUpdate = true;
            }
            
            if (z > maxZ) { maxZ = z; bestIdx = i; }
            if (z > 5) { 
                const ds = Math.max(0.5, (0.5 + photoOpacity * 0.5) * (1.0 + (z/CONFIG.photoOrbitRadius)*0.8)); 
                mesh.scale.lerp(new THREE.Vector3(ds, ds, ds), 0.15);
            } else {
                const ds = Math.max(0.5, 0.5 + photoOpacity * 0.3);
                mesh.scale.lerp(new THREE.Vector3(ds, ds, ds), 0.15);
            }
        });
        selectedIndex = bestIdx;

    } else if (state === 'PHOTO') {
        loveMesh.visible = false;
        titleMesh.visible = false;
        starMesh.visible = false;
        
        // Particles already hidden at the beginning of animate()
        
        const photoOpacity = transitionState.isActive && transitionState.to === 'PHOTO' ? 
            Math.max(0.7, transitionOpacity) : 1;
        
        photoMeshes.forEach((mesh, i) => {
            if (i === selectedIndex) {
                mesh.visible = true;
                mesh.position.lerp(new THREE.Vector3(0, 0, 60), 0.15);
                const targetScale = Math.max(4, 2 + photoOpacity * 3);
                mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15);
                mesh.lookAt(camera.position); 
                mesh.rotation.z = 0;
                mesh.material.opacity = 1.0; // Full opacity
                if (!mesh.material.map && photoTextures[i]) {
                    mesh.material.map = photoTextures[i];
                    mesh.material.needsUpdate = true;
                }
            } else {
                mesh.scale.lerp(new THREE.Vector3(0,0,0), 0.15);
                mesh.visible = false;
            }
        });
    }
    
    // Update previous state
    if (!transitionState.isActive) {
        previousState = state;
    }
    renderer.render(scene, camera);
}

// Throttle resize event for better performance
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if(camera && renderer) {
            camera.aspect = window.innerWidth/window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }, 250); // Throttle to 250ms
});

