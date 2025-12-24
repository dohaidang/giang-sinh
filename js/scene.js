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

// Tree decoration effects
let treeSpiralLights = null;
let treeGlowAura = null;
let treeTwinkleStars = null;
let treeOrnaments = null;

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
        initTreeEffects();
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
    const rotations = new Float32Array(snowCount); // For spinning snowflakes
    
    // Initialize snow particles - spread across entire view
    for (let i = 0; i < snowCount; i++) {
        // Random position covering entire screen area
        positions[i * 3] = (Math.random() - 0.5) * 300; // x - wider spread
        positions[i * 3 + 1] = Math.random() * 200 - 50; // y - start anywhere vertically
        positions[i * 3 + 2] = (Math.random() - 0.5) * 200 + 30; // z - more depth variation
        
        // Varied sizes - some tiny, some larger flakes
        const sizeType = Math.random();
        if (sizeType < 0.5) {
            sizes[i] = 0.8 + Math.random() * 1.2; // Small flakes (50%)
        } else if (sizeType < 0.85) {
            sizes[i] = 2.0 + Math.random() * 2.0; // Medium flakes (35%)
        } else {
            sizes[i] = 4.0 + Math.random() * 3.0; // Large flakes (15%)
        }
        
        // Varied fall speeds - smaller = slower
        speeds[i] = 0.1 + Math.random() * 0.3 + (sizes[i] * 0.05);
        
        // Random wind offset for variation
        windOffsets[i] = Math.random() * Math.PI * 2;
        rotations[i] = Math.random() * Math.PI * 2;
    }
    
    snowGeometry = new THREE.BufferGeometry();
    snowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    snowGeometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    snowGeometry.userData = {
        positions: positions,
        sizes: sizes,
        speeds: speeds,
        windOffsets: windOffsets,
        rotations: rotations,
        count: snowCount
    };
    
    // Create better snowflake texture
    const snowCanvas = document.createElement('canvas');
    snowCanvas.width = 64;
    snowCanvas.height = 64;
    const snowCtx = snowCanvas.getContext('2d');
    
    // Clear canvas
    snowCtx.clearRect(0, 0, 64, 64);
    
    // Draw soft glowing snowflake
    const gradient = snowCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.95)');
    gradient.addColorStop(0.4, 'rgba(240, 248, 255, 0.7)'); // Slight blue tint
    gradient.addColorStop(0.7, 'rgba(200, 220, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(200, 220, 255, 0)');
    snowCtx.fillStyle = gradient;
    snowCtx.beginPath();
    snowCtx.arc(32, 32, 32, 0, Math.PI * 2);
    snowCtx.fill();
    
    // Add sparkle highlight
    snowCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    snowCtx.beginPath();
    snowCtx.arc(26, 26, 6, 0, Math.PI * 2);
    snowCtx.fill();
    
    const snowTexture = new THREE.CanvasTexture(snowCanvas);
    
    snowMaterial = new THREE.PointsMaterial({
        size: 3.0,
        sizeAttenuation: true,
        map: snowTexture,
        transparent: true,
        opacity: 0.95,
        color: 0xFFFFFF,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    snowPoints = new THREE.Points(snowGeometry, snowMaterial);
    snowPoints.renderOrder = 2;
    scene.add(snowPoints);
    
    console.log('Snow system created:', snowCount, 'snowflakes');
}

// Update snow particles
function updateSnow(time) {
    if (!snowPoints || !snowGeometry) return;
    
    const geo = snowGeometry.userData;
    if (!geo || !geo.positions) return;
    
    // Dynamic wind - changes direction and strength over time
    const windX = Math.sin(time * 0.2) * 0.8 + Math.sin(time * 0.7) * 0.3;
    const windZ = Math.cos(time * 0.15) * 0.4;
    
    for (let i = 0; i < geo.count; i++) {
        const size = geo.sizes[i];
        const windOffset = geo.windOffsets[i];
        
        // Fall speed varies with size (bigger = faster)
        geo.positions[i * 3 + 1] -= geo.speeds[i];
        
        // Wind effect - smaller flakes affected more by wind
        const windFactor = 1.0 / (size * 0.5 + 0.5);
        geo.positions[i * 3] += windX * Math.sin(time * 0.5 + windOffset) * 0.15 * windFactor;
        geo.positions[i * 3 + 2] += windZ * Math.cos(time * 0.4 + windOffset) * 0.1 * windFactor;
        
        // Gentle swaying motion
        geo.positions[i * 3] += Math.sin(time * 2 + windOffset) * 0.03;
        
        // Reset particle when it falls below view
        if (geo.positions[i * 3 + 1] < -80) {
            geo.positions[i * 3] = (Math.random() - 0.5) * 300;
            geo.positions[i * 3 + 1] = 150 + Math.random() * 50;
            geo.positions[i * 3 + 2] = (Math.random() - 0.5) * 200 + 30;
        }
        
        // Keep particles in bounds horizontally (wider bounds)
        if (Math.abs(geo.positions[i * 3]) > 180) {
            geo.positions[i * 3] = -geo.positions[i * 3] * 0.5;
        }
        if (geo.positions[i * 3 + 2] < -50 || geo.positions[i * 3 + 2] > 180) {
            geo.positions[i * 3 + 2] = (Math.random() - 0.5) * 200 + 30;
        }
    }
    
    snowGeometry.attributes.position.needsUpdate = true;
}

// ==========================================
// TREE DECORATION EFFECTS
// ==========================================

function initTreeEffects() {
    createSpiralLights();
    createTreeGlowAura();
    createTwinkleStars();
    createTreeOrnaments();
}

// Spiral lights wrapping around the tree - Christmas LED string lights
function createSpiralLights() {
    const lightCount = 120; // Fewer but bigger, more visible lights
    const positions = new Float32Array(lightCount * 3);
    const colors = new Float32Array(lightCount * 3);
    const sizes = new Float32Array(lightCount);
    const phases = new Float32Array(lightCount);
    
    // Classic Christmas light colors - bright and saturated
    const spiralColors = [
        new THREE.Color(1.0, 0.0, 0.0),   // Bright Red
        new THREE.Color(0.0, 1.0, 0.0),   // Bright Green  
        new THREE.Color(0.0, 0.5, 1.0),   // Blue
        new THREE.Color(1.0, 0.8, 0.0),   // Gold/Yellow
        new THREE.Color(1.0, 0.0, 1.0),   // Magenta
        new THREE.Color(0.0, 1.0, 1.0),   // Cyan
    ];
    
    for (let i = 0; i < lightCount; i++) {
        const t = i / lightCount;
        const h = t * CONFIG.treeHeight * 0.95; // Don't go all the way to top
        const y = h - CONFIG.treeHeight / 2;
        
        // Spiral around tree - positioned ON the surface, slightly outside
        const spirals = 4; // Fewer spirals = more visible spacing
        const theta = t * Math.PI * 2 * spirals;
        // Position lights on the outer edge of the tree
        const treeRadius = (1 - t) * CONFIG.treeBaseRadius;
        const lightRadius = treeRadius * 1.08 + 1; // Just outside tree surface
        
        positions[i * 3] = lightRadius * Math.cos(theta);
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = lightRadius * Math.sin(theta);
        
        // Cycle through colors
        const color = spiralColors[i % spiralColors.length];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        
        sizes[i] = 4.0;
        phases[i] = i * 0.5; // Sequential phase for chasing effect
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.userData = { phases, baseColors: colors.slice(), baseSizes: sizes.slice() };
    
    // Create Christmas bulb texture - round glowing bulb
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Outer glow
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.PointsMaterial({
        size: 5.0,
        sizeAttenuation: true,
        map: texture,
        transparent: true,
        opacity: 1.0,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    treeSpiralLights = new THREE.Points(geometry, material);
    treeSpiralLights.renderOrder = 5;
    scene.add(treeSpiralLights);
    
    console.log('Spiral lights created:', lightCount, 'lights');
}

// Glowing aura around the tree
function createTreeGlowAura() {
    const auraCount = 80;
    const positions = new Float32Array(auraCount * 3);
    const sizes = new Float32Array(auraCount);
    const phases = new Float32Array(auraCount);
    
    for (let i = 0; i < auraCount; i++) {
        const t = Math.random();
        const h = t * CONFIG.treeHeight;
        const y = h - CONFIG.treeHeight / 2;
        
        // Position slightly outside tree
        const maxR = (1 - t) * CONFIG.treeBaseRadius * 1.3;
        const theta = Math.random() * Math.PI * 2;
        
        positions[i * 3] = maxR * Math.cos(theta);
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = maxR * Math.sin(theta);
        
        sizes[i] = 8 + Math.random() * 12;
        phases[i] = Math.random() * Math.PI * 2;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.userData = { phases, baseSizes: sizes.slice() };
    
    // Create soft glow texture
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(50, 255, 100, 0.4)');
    gradient.addColorStop(0.3, 'rgba(50, 200, 80, 0.2)');
    gradient.addColorStop(0.6, 'rgba(30, 150, 50, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 100, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    const texture = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.PointsMaterial({
        size: 20,
        sizeAttenuation: true,
        map: texture,
        transparent: true,
        opacity: 0.8,
        color: 0x50FF70,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    treeGlowAura = new THREE.Points(geometry, material);
    treeGlowAura.renderOrder = 0;
    scene.add(treeGlowAura);
}

// Twinkling stars around the tree
function createTwinkleStars() {
    const starCount = 60;
    const positions = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const phases = new Float32Array(starCount);
    const colors = new Float32Array(starCount * 3);
    
    const starColors = [
        new THREE.Color(0xFFFFFF),
        new THREE.Color(0xFFD700),
        new THREE.Color(0xFFF8DC),
    ];
    
    for (let i = 0; i < starCount; i++) {
        const t = Math.random();
        const h = t * CONFIG.treeHeight;
        const y = h - CONFIG.treeHeight / 2;
        
        // Position around tree
        const maxR = (1 - t) * CONFIG.treeBaseRadius * 0.9;
        const theta = Math.random() * Math.PI * 2;
        
        positions[i * 3] = maxR * Math.cos(theta) + (Math.random() - 0.5) * 5;
        positions[i * 3 + 1] = y + (Math.random() - 0.5) * 3;
        positions[i * 3 + 2] = maxR * Math.sin(theta) + (Math.random() - 0.5) * 5;
        
        sizes[i] = 1.5 + Math.random() * 2;
        phases[i] = Math.random() * Math.PI * 2;
        
        const color = starColors[Math.floor(Math.random() * starColors.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.userData = { phases, baseSizes: sizes.slice() };
    
    // Create star texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFF';
    ctx.shadowColor = '#FFF';
    ctx.shadowBlur = 10;
    
    // Draw 4-pointed star
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(36, 28);
    ctx.lineTo(64, 32);
    ctx.lineTo(36, 36);
    ctx.lineTo(32, 64);
    ctx.lineTo(28, 36);
    ctx.lineTo(0, 32);
    ctx.lineTo(28, 28);
    ctx.closePath();
    ctx.fill();
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.PointsMaterial({
        size: 4.0,
        sizeAttenuation: true,
        map: texture,
        transparent: true,
        opacity: 1.0,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    treeTwinkleStars = new THREE.Points(geometry, material);
    treeTwinkleStars.renderOrder = 3;
    scene.add(treeTwinkleStars);
}

// Tree ornaments (baubles)
function createTreeOrnaments() {
    const ornamentCount = 40;
    const positions = new Float32Array(ornamentCount * 3);
    const colors = new Float32Array(ornamentCount * 3);
    const sizes = new Float32Array(ornamentCount);
    const phases = new Float32Array(ornamentCount);
    
    const ornamentColors = [
        new THREE.Color(0xFF0000), // Red
        new THREE.Color(0xFFD700), // Gold
        new THREE.Color(0x0066FF), // Blue
        new THREE.Color(0x9400D3), // Purple
        new THREE.Color(0xFF1493), // Pink
        new THREE.Color(0x00CED1), // Turquoise
    ];
    
    for (let i = 0; i < ornamentCount; i++) {
        const t = 0.1 + Math.random() * 0.8; // Avoid very top and bottom
        const h = t * CONFIG.treeHeight;
        const y = h - CONFIG.treeHeight / 2;
        
        const maxR = (1 - t) * CONFIG.treeBaseRadius * 0.85;
        const theta = Math.random() * Math.PI * 2;
        
        positions[i * 3] = maxR * Math.cos(theta);
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = maxR * Math.sin(theta);
        
        const color = ornamentColors[Math.floor(Math.random() * ornamentColors.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        
        sizes[i] = 3 + Math.random() * 2;
        phases[i] = Math.random() * Math.PI * 2;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    geometry.userData = { phases, baseSizes: sizes.slice() };
    
    // Create shiny bauble texture
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Main circle
    const gradient = ctx.createRadialGradient(28, 28, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(200, 200, 200, 0.6)');
    gradient.addColorStop(1, 'rgba(100, 100, 100, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(24, 24, 8, 0, Math.PI * 2);
    ctx.fill();
    
    const texture = new THREE.CanvasTexture(canvas);
    
    const material = new THREE.PointsMaterial({
        size: 6.0,
        sizeAttenuation: true,
        map: texture,
        transparent: true,
        opacity: 1.0,
        vertexColors: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    treeOrnaments = new THREE.Points(geometry, material);
    treeOrnaments.renderOrder = 4;
    scene.add(treeOrnaments);
}

// Update tree effects
function updateTreeEffects(time) {
    // Update spiral lights - Christmas chasing lights effect
    if (treeSpiralLights && state === 'TREE') {
        const geo = treeSpiralLights.geometry;
        const sizes = geo.attributes.size.array;
        const colors = geo.attributes.color.array;
        const phases = geo.userData.phases;
        const baseColors = geo.userData.baseColors;
        const baseSizes = geo.userData.baseSizes;
        
        // Chasing light effect - lights turn on/off in sequence
        const chaseSpeed = time * 3;
        
        for (let i = 0; i < phases.length; i++) {
            // Chasing wave effect
            const chaseWave = Math.sin(chaseSpeed - phases[i]);
            const isOn = chaseWave > -0.3; // Light is "on" most of the time
            
            // Size pulsing when on
            if (isOn) {
                const pulse = 0.8 + 0.4 * Math.sin(time * 6 + phases[i]);
                sizes[i] = (baseSizes ? baseSizes[i] : 4.0) * pulse;
                
                // Full brightness
                colors[i * 3] = baseColors[i * 3];
                colors[i * 3 + 1] = baseColors[i * 3 + 1];
                colors[i * 3 + 2] = baseColors[i * 3 + 2];
            } else {
                // Dimmed
                sizes[i] = (baseSizes ? baseSizes[i] : 4.0) * 0.3;
                colors[i * 3] = baseColors[i * 3] * 0.2;
                colors[i * 3 + 1] = baseColors[i * 3 + 1] * 0.2;
                colors[i * 3 + 2] = baseColors[i * 3 + 2] * 0.2;
            }
        }
        
        geo.attributes.size.needsUpdate = true;
        geo.attributes.color.needsUpdate = true;
        treeSpiralLights.rotation.y = groupGold ? groupGold.rotation.y : time * 0.3;
    }
    
    // Update glow aura
    if (treeGlowAura && state === 'TREE') {
        const geo = treeGlowAura.geometry;
        const sizes = geo.attributes.size.array;
        const phases = geo.userData.phases;
        const baseSizes = geo.userData.baseSizes;
        
        for (let i = 0; i < phases.length; i++) {
            const pulse = 0.7 + 0.3 * Math.sin(time * 2 + phases[i]);
            sizes[i] = baseSizes[i] * pulse;
        }
        
        geo.attributes.size.needsUpdate = true;
        treeGlowAura.material.opacity = 0.4 + 0.2 * Math.sin(time * 1.5);
        treeGlowAura.rotation.y = groupGold ? groupGold.rotation.y : time * 0.3;
    }
    
    // Update twinkle stars
    if (treeTwinkleStars && state === 'TREE') {
        const geo = treeTwinkleStars.geometry;
        const sizes = geo.attributes.size.array;
        const phases = geo.userData.phases;
        const baseSizes = geo.userData.baseSizes;
        
        for (let i = 0; i < phases.length; i++) {
            // Random twinkling
            const twinkle = Math.random() > 0.95 ? 2.0 : (0.3 + 0.7 * Math.sin(time * 10 + phases[i]));
            sizes[i] = baseSizes[i] * twinkle;
        }
        
        geo.attributes.size.needsUpdate = true;
        treeTwinkleStars.rotation.y = groupGold ? groupGold.rotation.y : time * 0.3;
    }
    
    // Update ornaments
    if (treeOrnaments && state === 'TREE') {
        const geo = treeOrnaments.geometry;
        const sizes = geo.attributes.size.array;
        const phases = geo.userData.phases;
        const baseSizes = geo.userData.baseSizes;
        
        for (let i = 0; i < phases.length; i++) {
            // Gentle size pulsing
            const pulse = 0.9 + 0.1 * Math.sin(time * 3 + phases[i]);
            sizes[i] = baseSizes[i] * pulse;
        }
        
        geo.attributes.size.needsUpdate = true;
        treeOrnaments.rotation.y = groupGold ? groupGold.rotation.y : time * 0.3;
    }
    
    // Hide effects when not in TREE state
    const visible = (state === 'TREE');
    if (treeSpiralLights) treeSpiralLights.visible = visible;
    if (treeGlowAura) treeGlowAura.visible = visible;
    if (treeTwinkleStars) treeTwinkleStars.visible = visible;
    if (treeOrnaments) treeOrnaments.visible = visible;
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
        
        // Update tree effects
        updateTreeEffects(time);
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

