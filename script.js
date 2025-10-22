// --- KHÔNG CÓ LỆNH IMPORT Ở ĐÂY NỮA ---

// --- BIẾN TOÀN CỤC ---
// THREE và OrbitControls đã có sẵn do tải trong HTML
let scene, camera, renderer, controls;
let pointPlanet, disc1, disc2, starField, ambientLights;
let drawInterval, animationFrameId;
let birthdayAudio;
let userInteracted = false; // Chỉ theo dõi tương tác ĐẦU TIÊN
let giftBox;
let clock = new THREE.Clock(); // Đồng hồ cho giới hạn FPS
let delta = 0;
let interval = 1 / 30; // 30 fps
let isCardVisible = false; // Thêm biến trạng thái cho thiệp

// --- MẢNG CHỨA CÁC ẢNH CỦA BẠN ---
const photoUrls = [
    'photos/photo1.jpg',
    'photos/photo2.jpg',
    'photos/photo3.jpg',
    'photos/photo4.jpg',
    'photos/photo5.jpg',
    'photos/photo6.jpg',
];

// --- PHẦN KHỞI ĐỘNG CHÍNH ---
document.addEventListener('DOMContentLoaded', () => {
    // Khởi tạo audio ngay lập tức
    setupBackgroundMusic();
    runMatrixEffect();
    // Lắng nghe tương tác đầu tiên để bật nhạc (CHỈ MỘT LẦN)
    document.body.addEventListener('click', handleFirstInteraction, { once: true });
    document.body.addEventListener('touchstart', handleFirstInteraction, { once: true });
    // Lắng nghe nút đóng thiệp
    const closeButton = document.getElementById('close-card-button');
    if (closeButton) {
        closeButton.addEventListener('click', hideBirthdayCard);
    }
});

// --- HÀM XỬ LÝ TƯƠNG TÁC ĐẦU TIÊN (để bật nhạc) ---
function handleFirstInteraction() {
    if (userInteracted) return;
    userInteracted = true;
    console.log("User interacted. Trying to play music.");
    // Chỉ cần gọi play() vì audio đã được tạo
    if (birthdayAudio && birthdayAudio.paused) {
        birthdayAudio.play().catch(error => {
            console.error("Error playing audio after interaction:", error);
        });
    }
}

// --- CÁC HÀM CỦA HIỆU ỨNG MA TRẬN ---
function runMatrixEffect() {
    const matrixCanvas = document.getElementById('matrixCanvas');
    if (!matrixCanvas) return;
    const ctx = matrixCanvas.getContext('2d');
    const STATE_RAINING = 0, STATE_CONVERGING = 1, STATE_BURSTING = 2;
    let animationState = STATE_RAINING;
    const FONT_SIZE = 16;
    const MATRIX_COLOR = '#0077FF';
    const MATRIX_FADE_COLOR = 'rgba(0, 0, 0, 0.1)';
    const TEXT_COLOR = '#0077FF';
    const TEXT_SHADOW_COLOR = '#0077FF';
    const WORDS_TO_ANIMATE = ["HAPPY", "BIRTHDAY", "TO", "THANH HÒA"];
    const REVEAL_SPEED_MS = 40, HOLD_DURATION_MS = 1200, PAUSE_BETWEEN_WORDS_MS = 400;
    let width = matrixCanvas.width = window.innerWidth;
    let height = matrixCanvas.height = window.innerHeight;
    let particles = [];
    const characters = 'LOVE';
    for (let i = 0; i < 500; i++) {
        particles.push({
            x: Math.random() * width, y: Math.random() * height,
            char: characters.charAt(Math.floor(Math.random() * characters.length)),
            speed: Math.random() * 3 + 1, vx: 0, vy: 0, alpha: 1
        });
    }
    let textMask = [], currentWordIndex = 0, revealedPoints = 0, isRevealing = false;
    function generateTextMask(word) {
        textMask = [];
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = width; tempCanvas.height = height;
        const textFontSize = 0.8 * Math.min(width / (word.length * 0.6), height / 2.5);
        tempCtx.font = `bold ${textFontSize}px sans-serif`;
        tempCtx.textAlign = 'center'; tempCtx.textBaseline = 'middle';
        tempCtx.fillStyle = 'white';
        tempCtx.fillText(word, width / 2, height / 2);
        const imageData = tempCtx.getImageData(0, 0, width, height);
        for (let y = 0; y < height; y += FONT_SIZE / 2) {
            for (let x = 0; x < width; x += FONT_SIZE / 2) {
                const pIndex = (Math.floor(y) * imageData.width + Math.floor(x)) * 4;
                if (imageData.data[pIndex] > 128) textMask.push({ x, y });
            }
        }
        textMask.sort(() => Math.random() - 0.5);
    }
    function draw() {
        ctx.fillStyle = MATRIX_FADE_COLOR;
        ctx.fillRect(0, 0, width, height);
        ctx.font = `${FONT_SIZE}px monospace`;
        const centerX = width / 2, centerY = height / 2;
        let allConverged = true;
        particles.forEach(p => {
            switch (animationState) {
                case STATE_RAINING:
                    ctx.fillStyle = MATRIX_COLOR;
                    ctx.fillText(p.char, p.x, p.y);
                    p.y += p.speed;
                    if (p.y > height) { p.y = 0; p.x = Math.random() * width; }
                    break;
                case STATE_CONVERGING:
                    let dx = centerX - p.x, dy = centerY - p.y;
                    p.x += dx * 0.05; p.y += dy * 0.05;
                    ctx.fillStyle = MATRIX_COLOR;
                    ctx.fillText(p.char, p.x, p.y);
                    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) allConverged = false;
                    break;
                case STATE_BURSTING:
                    p.x += p.vx; p.y += p.vy;
                    p.alpha -= 0.003;
                    if (p.alpha > 0) {
                        ctx.fillStyle = `rgba(0, 119, 255, ${p.alpha})`;
                        ctx.fillText(p.char, p.x, p.y);
                    }
                    break;
            }
        });
        if (isRevealing && animationState === STATE_RAINING) {
            ctx.fillStyle = TEXT_COLOR;
            ctx.shadowColor = TEXT_SHADOW_COLOR;
            ctx.shadowBlur = 10;
            for (let i = 0; i < revealedPoints; i++) {
                const p = textMask[i];
                if (p) {
                    const char = characters.charAt(Math.floor(Math.random() * characters.length));
                    ctx.fillText(char, p.x, p.y);
                }
            }
            ctx.shadowBlur = 0;
        }
        if (animationState === STATE_CONVERGING && allConverged) {
            animationState = STATE_BURSTING;
            particles.forEach(p => {
                p.vx = (Math.random() - 0.5) * 40;
                p.vy = (Math.random() - 0.5) * 40;
                p.alpha = 1;
            });
            setTimeout(switchToGalaxyScene, 2000);
        }
    }
    function runWordAnimationSequence() {
        if (currentWordIndex >= WORDS_TO_ANIMATE.length) {
            isRevealing = false;
            animationState = STATE_CONVERGING;
            return;
        }
        const word = WORDS_TO_ANIMATE[currentWordIndex];
        generateTextMask(word);
        revealedPoints = 0;
        isRevealing = true;
        const revealInterval = setInterval(() => {
            revealedPoints += 20;
            if (revealedPoints >= textMask.length) {
                revealedPoints = textMask.length;
                clearInterval(revealInterval);
                setTimeout(() => {
                    isRevealing = false;
                    setTimeout(() => {
                        currentWordIndex++;
                        runWordAnimationSequence();
                    }, PAUSE_BETWEEN_WORDS_MS);
                }, HOLD_DURATION_MS);
            }
        }, REVEAL_SPEED_MS);
    }
    drawInterval = setInterval(draw, 33);
    setTimeout(runWordAnimationSequence, 2000);
}


// --- HÀM CHUYỂN CẢNH ---
function switchToGalaxyScene() {
    const matrixContainer = document.getElementById('matrix-container');
    const galaxyCanvas = document.getElementById('galaxy3DCanvas');
    if (!matrixContainer || !galaxyCanvas) return;
    clearInterval(drawInterval);
    matrixContainer.style.opacity = '0';
    setTimeout(() => {
        matrixContainer.style.display = 'none';
        initThreeJS();
        animateThreeJS();
        galaxyCanvas.style.display = 'block';
        setTimeout(() => galaxyCanvas.style.opacity = '1', 50);
        // Không gọi setup audio ở đây nữa
    }, 2000);
}

// --- HÀM KHỞI TẠO NHẠC ---
function setupBackgroundMusic() {
    if (!birthdayAudio) {
        birthdayAudio = document.createElement('audio');
        birthdayAudio.src = 'eyenoselip.mp3';
        birthdayAudio.loop = true;
        document.body.appendChild(birthdayAudio);
        console.log("Audio element created.");
    }
}


// --- HÀM TẠO TEXTURE HÌNH TRÒN MỜ ---
function generateSprite(isHalo, color) {
    const canvas = document.createElement('canvas');
    canvas.width = isHalo ? 128 : 16;
    canvas.height = isHalo ? 128 : 16;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
    if (isHalo) {
        gradient.addColorStop(0, `rgba(${color.r*255}, ${color.g*255}, ${color.b*255}, 0.5)`);
        gradient.addColorStop(0.2, `rgba(${color.r*255}, ${color.g*255}, ${color.b*255}, 0.2)`);
        gradient.addColorStop(0.4, `rgba(${color.r*255}, ${color.g*255}, ${color.b*255}, 0.05)`);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
    } else {
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(0,255,255,1)');
        gradient.addColorStop(0.4, 'rgba(0,0,64,1)');
        gradient.addColorStop(1, 'rgba(0,0,0,1)');
    }
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    return new THREE.CanvasTexture(canvas);
}

// --- CÁC HÀM CỦA CẢNH 3D ---
function initThreeJS() {
    const canvas = document.getElementById('galaxy3DCanvas');
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 25;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 60;
    const planetRadius = 4.5;
    const planetPoints = 5000;
    const planetGeometry = new THREE.BufferGeometry();
    const positions = [], colors = [];
    const color = new THREE.Color();
    const blueColors = [new THREE.Color(0x00ffff), new THREE.Color(0x0077ff), new THREE.Color(0x40e0d0)];
    for (let i = 0; i < planetPoints; i++) {
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        const x = planetRadius * Math.sin(phi) * Math.cos(theta);
        const y = planetRadius * Math.sin(phi) * Math.sin(theta);
        const z = planetRadius * Math.cos(phi);
        positions.push(x, y, z);
        color.copy(blueColors[Math.floor(Math.random() * blueColors.length)]);
        colors.push(color.r, color.g, color.b);
    }
    planetGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    planetGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const planetMaterial = new THREE.PointsMaterial({
        size: 0.1, vertexColors: true, map: generateSprite(false),
        blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
        opacity: 0.8
    });
    pointPlanet = new THREE.Points(planetGeometry, planetMaterial);
    scene.add(pointPlanet);

    const giftTextureLoader = new THREE.TextureLoader();
    const wrapTexture = giftTextureLoader.load('wrapping_paper.jpg');
    const ribbonTexture = giftTextureLoader.load('ribbon.jpg');
    wrapTexture.wrapS = THREE.RepeatWrapping;
    wrapTexture.wrapT = THREE.RepeatWrapping;
    wrapTexture.repeat.set(2, 2);
    const boxMaterials = [
        new THREE.MeshPhongMaterial({ map: wrapTexture }), new THREE.MeshPhongMaterial({ map: wrapTexture }),
        new THREE.MeshPhongMaterial({ map: ribbonTexture }), new THREE.MeshPhongMaterial({ map: wrapTexture }),
        new THREE.MeshPhongMaterial({ map: wrapTexture }), new THREE.MeshPhongMaterial({ map: wrapTexture })
    ];
    const boxGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    giftBox = new THREE.Mesh(boxGeometry, boxMaterials);
    giftBox.name = "giftBox";
    scene.add(giftBox);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const textureLoader = new THREE.TextureLoader();
    disc1 = createDisc(22, 10, 2000, 0, 0.97, textureLoader, 0x8A2BE2);
    disc2 = createDisc(9, 5, 800, 0.2, 1.1, textureLoader, 0x8A2BE2);
    scene.add(disc1);
    scene.add(disc2);
    
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    for (let i = 0; i < 2000; i++) {
        const radius = Math.random() * 200 + 50;
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta);
        const z = radius * Math.cos(phi);
        starPositions.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2 });
    starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);
    
    ambientLights = new THREE.Group();
    const lightColors = [new THREE.Color(0xADD8E6), new THREE.Color(0x9370DB), new THREE.Color(0x87CEEB)];
    for (let i = 0; i < 7; i++) {
        const haloColor = lightColors[i % lightColors.length];
        const haloTexture = generateSprite(true, haloColor);
        const haloMaterial = new THREE.SpriteMaterial({
            map: haloTexture,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true
        });
        const haloSprite = new THREE.Sprite(haloMaterial);
        haloSprite.scale.set(30, 30, 30);
        const posRadius = Math.random() * 20 + 15;
        const posTheta = Math.random() * Math.PI * 2;
        const posPhi = Math.acos(2 * Math.random() - 1);
        haloSprite.position.set(
            posRadius * Math.sin(posPhi) * Math.cos(posTheta),
            posRadius * Math.sin(posPhi) * Math.sin(posTheta),
            posRadius * Math.cos(posPhi)
        );
        ambientLights.add(haloSprite);
    }
    scene.add(ambientLights);
    window.addEventListener('resize', onWindowResize, false);
    
    renderer.domElement.addEventListener('click', handleInteractionEnd, false);
    renderer.domElement.addEventListener('touchend', handleInteractionEnd, false);
}
// --- HÀM TẠO ĐĨA PHẲNG ---
function createDisc(outerRadius, innerRadius, particleCount, yPosition, photoChance, textureLoader, defaultParticleColor) {
    const discGroup = new THREE.Group();
    let photoIndex = 0;
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random() * (outerRadius**2 - innerRadius**2) + innerRadius**2);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = yPosition + (Math.random() - 0.5) * 1.5;
        if (photoUrls.length > 0 && (Math.random() > photoChance || (i >= particleCount - photoUrls.length && photoIndex < photoUrls.length))) {
            const photoTexture = textureLoader.load(photoUrls[photoIndex % photoUrls.length]);
            const spriteMaterial = new THREE.SpriteMaterial({ map: photoTexture });
            const photoSprite = new THREE.Sprite(spriteMaterial);
            photoSprite.position.set(x, y, z);
            photoSprite.scale.set(1.2, 1.2, 1.2);
            discGroup.add(photoSprite);
            photoIndex++;
        } else {
            const particleGeo = new THREE.SphereGeometry(0.04, 8, 8);
            let particleColor = (Math.random() < 5/6) ? defaultParticleColor : 0xffffff;
            const particleMat = new THREE.MeshBasicMaterial({ color: particleColor });
            const particle = new THREE.Mesh(particleGeo, particleMat);
            particle.position.set(x, y, z);
            discGroup.add(particle);
        }
    }
    return discGroup;
}


// --- GIỚI HẠN FPS ---
function animateThreeJS() {
    animationFrameId = requestAnimationFrame(animateThreeJS);
    delta += clock.getDelta();
    if (delta > interval) {
        try {
            if (pointPlanet) pointPlanet.rotation.y += 0.002 * (delta / interval);
            if (giftBox) giftBox.rotation.y += 0.002 * (delta / interval);
            if (disc1) disc1.rotation.y -= 0.01 * (delta / interval);
            if (disc2) disc2.rotation.y -= 0.02 * (delta / interval);
            if (starField) starField.rotation.y += 0.0001 * (delta / interval);
            if (ambientLights) {
                ambientLights.rotation.y += 0.0002 * (delta / interval);
                ambientLights.rotation.z += 0.0001 * (delta / interval);
            }
            controls.update();
            renderer.render(scene, camera);
            delta = delta % interval;
        } catch (error) {
            console.error("Error during animateThreeJS:", error);
            cancelAnimationFrame(animationFrameId);
        }
    }
}
// --- HÀM RESIZE ---
function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
// --- HÀM CLICK/TOUCH ---
function handleInteractionEnd(event) {
    if(isCardVisible) return;
    const coords = new THREE.Vector2();
    let clientX, clientY;
    if (event.changedTouches && event.changedTouches.length > 0) {
        clientX = event.changedTouches[event.changedTouches.length - 1].clientX;
        clientY = event.changedTouches[event.changedTouches.length - 1].clientY;
    } else if (event.clientX !== undefined) {
        clientX = event.clientX;
        clientY = event.clientY;
    } else {
         return; // Không có tọa độ hợp lệ
    }
    coords.x = (clientX / window.innerWidth) * 2 - 1;
    coords.y = - (clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(coords, camera);
    if (giftBox) {
        const intersects = raycaster.intersectObject(giftBox);
        if (intersects.length > 0) {
            showBirthdayCard();
        }
    }
}
// --- HÀM HIỆN THIỆP ---
function showBirthdayCard() {
    if(isCardVisible) return;
    isCardVisible = true;
    const galaxyCanvas = document.getElementById('galaxy3DCanvas');
    const birthdayCard = document.getElementById('birthday-card');
    if (!galaxyCanvas || !birthdayCard) return;
    if (birthdayAudio) birthdayAudio.pause();
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    galaxyCanvas.style.opacity = '0';
    setTimeout(() => {
        galaxyCanvas.style.display = 'none';
        birthdayCard.classList.add('visible');
    }, 500);
}
// --- HÀM ẨN THIỆP ---
function hideBirthdayCard() {
    isCardVisible = false;
     const galaxyCanvas = document.getElementById('galaxy3DCanvas');
    const birthdayCard = document.getElementById('birthday-card');
    if (!galaxyCanvas || !birthdayCard) return;
    birthdayCard.classList.remove('visible');
     setTimeout(() => {
        birthdayCard.style.display = 'none';
        galaxyCanvas.style.display = 'block';
        setTimeout(() => {
             galaxyCanvas.style.opacity = '1';
             if (!animationFrameId) animateThreeJS();
             // Không tự động phát lại nhạc
        }, 50);
    }, 500);
}
