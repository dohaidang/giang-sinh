// ==========================================
// RESOURCES CONFIG
// ==========================================
const MUSIC_URL = "./assets/audio/audio.mp3";
let bgMusic = new Audio(MUSIC_URL);
bgMusic.loop = true; bgMusic.volume = 1.0;

// Load audio with progress tracking
bgMusic.addEventListener('canplaythrough', () => updateProgress('Audio'));
bgMusic.addEventListener('error', () => {
    console.warn('Audio failed to load, continuing without sound');
    updateProgress('Audio (skipped)');
});

const loader = new THREE.TextureLoader();
const photoFiles = [
    './assets/images/image1.jpeg',
    './assets/images/image2.jpeg',
    './assets/images/image3.jpeg',
    './assets/images/image4.jpeg',
    './assets/images/image5.jpeg'
];
const photoTextures = [];

// Load images with progress tracking
photoFiles.forEach((f, i) => {
    photoTextures[i] = loader.load(
        f,
        () => updateProgress(`Image ${i + 1}`),
        undefined,
        (err) => {
            console.error(`Failed to load ${f}:`, err);
            updateProgress(`Image ${i + 1} (error)`);
        }
    );
});

function createCustomTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const cx = 64, cy = 64;

    if (type === 'gold_glow') {
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
        grd.addColorStop(0, '#FFFFFF'); 
        grd.addColorStop(0.2, '#FFFFE0'); 
        grd.addColorStop(0.5, '#FFD700');
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd; ctx.fillRect(0,0,128,128);

    } else if (type === 'red_light') {
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50);
        grd.addColorStop(0, '#FFAAAA'); 
        grd.addColorStop(0.3, '#FF0000'); 
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grd; ctx.fillRect(0,0,128,128);

    } else if (type === 'gift_red') {
        ctx.fillStyle = '#D32F2F'; ctx.fillRect(20, 20, 88, 88);
        ctx.fillStyle = '#FFD700'; ctx.fillRect(54, 20, 20, 88); ctx.fillRect(20, 54, 88, 20);
        ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth=2; ctx.strokeRect(20,20,88,88);
    }
    return new THREE.CanvasTexture(canvas);
}

const textures = {
    gold: createCustomTexture('gold_glow'),
    red: createCustomTexture('red_light'),
    gift: createCustomTexture('gift_red')
};

