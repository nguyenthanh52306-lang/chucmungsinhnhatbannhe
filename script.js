// --- Import các module đã được tải trong file HTML ---

// --- BIẾN TOÀN CỤC ---
let scene, camera, renderer, controls;
let pointPlanet, disc1, disc2, starField, ambientLights;
let drawInterval, animationFrameId;
let birthdayAudio;
let userInteracted = false;
let giftBox;
// Biến cho việc giới hạn FPS
let clock = new THREE.Clock();
let delta = 0;
let interval = 1 / 30; // 30 fps

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
    runMatrixEffect();
    document.body.addEventListener('click', handleFirstInteraction, { once: true });
    document.body.addEventListener('touchstart', handleFirstInteraction, { once: true });
    const closeButton = document.getElementById('close-card-button');
    if (closeButton) {
        closeButton.addEventListener('click', hideBirthdayCard);
    }
});

// --- HÀM XỬ LÝ TƯƠNG TÁC ĐẦU TIÊN ---
function handleFirstInteraction() {
    if (userInteracted) return;
    userInteracted = true;
    console.log("User interacted. Trying to play music if available.");
    if (birthdayAudio && birthdayAudio.paused) {
        birthdayAudio.play().catch(error => {
            console.error("Error playing audio after interaction:", error);
        });
    }
}

// --- CÁC HÀM CỦA HIỆU ỨNG MA TRẬN ---
// ... (Giữ nguyên không đổi)
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
// ... (Giữ nguyên)
function switchToGalaxyScene() {
    const matrixContainer = document.getElementById('matrix-container');
    const galaxyCanvas = document.getElementById('galaxy3DCanvas');
    if (!matrixContainer || !galaxyCanvas) return;
    clearInterval(drawInterval);
    matrixContainer.style.opacity = '0';
    setTimeout(() => {
        matrixContainer.style.display = 'none';
        initThreeJS();
        animateThreeJS(); // Bắt đầu vòng lặp 3D
        galaxyCanvas.style.opacity = '1';
        setupBackgroundMusic();
    }, 2000);
}

// --- HÀM KHỞI TẠO NHẠC ---
// ... (Giữ nguyên)
function setupBackgroundMusic() {
    if (!birthdayAudio) {
        birthdayAudio = document.createElement('audio');
        birthdayAudio.src = 'eyenoselip.mp3';
        birthdayAudio.loop = true;
        document.body.appendChild(birthdayAudio);
        console.log("Audio element created and ready.");
        if (userInteracted) {
             birthdayAudio.play().catch(error => {
                console.error("Error playing audio even after interaction:", error);
            });
        }
    }
}

// --- HÀM TẠO TEXTURE HÌNH TRÒN MỜ ---
// ... (Giữ nguyên)
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
    const planetPoints = 8000;
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
    // --- TẠO HỘP QUÀ VỚI TEXTURE ---
    const giftTextureLoader = new THREE.TextureLoader(); // Tạo loader riêng để tránh nhầm lẫn
    const wrapTexture = giftTextureLoader.load('wrapping_paper.jpg');
    const ribbonTexture = giftTextureLoader.load('ribbon.jpg');

    wrapTexture.wrapS = THREE.RepeatWrapping;
    wrapTexture.wrapT = THREE.RepeatWrapping;
    wrapTexture.repeat.set(2, 2);

    // Dùng MeshPhongMaterial để phản ứng với ánh sáng
    const boxMaterials = [
        new THREE.MeshPhongMaterial({ map: wrapTexture }), // right
        new THREE.MeshPhongMaterial({ map: wrapTexture }), // left
        new THREE.MeshPhongMaterial({ map: ribbonTexture }),// top (mặt có nơ)
        new THREE.MeshPhongMaterial({ map: wrapTexture }), // bottom
        new THREE.MeshPhongMaterial({ map: wrapTexture }), // front
        new THREE.MeshPhongMaterial({ map: wrapTexture })  // back
    ];

    const boxGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    giftBox = new THREE.Mesh(boxGeometry, boxMaterials);
    giftBox.name = "giftBox";
    scene.add(giftBox);

    // Thêm ánh sáng để thấy vật liệu Phong (Quan trọng)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); // Có thể tăng nhẹ ambient
    scene.add(ambientLight);
    const textureLoader = new THREE.TextureLoader();
    disc1 = createDisc(22, 10, 2500, 0, 0.94, textureLoader, 0x8A2BE2);
    disc2 = createDisc(9, 5, 1000, 0.2, 1.1, textureLoader, 0x8A2BE2);
    scene.add(disc1);
    scene.add(disc2);
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    for (let i = 0; i < 3000; i++) {
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
    renderer.domElement.addEventListener('click', onCanvasClick, false);
}
// ... (Hàm createDisc giữ nguyên)
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


// --- THAY ĐỔI: Giới hạn FPS ---
function animateThreeJS() {
    animationFrameId = requestAnimationFrame(animateThreeJS);

    delta += clock.getDelta();

    if (delta > interval) {
        // Chỉ cập nhật và render nếu đủ thời gian đã trôi qua
        if (pointPlanet) pointPlanet.rotation.y += 0.002 * (delta / interval); // Điều chỉnh tốc độ theo delta
        if (disc1) disc1.rotation.y -= 0.01 * (delta / interval);
        if (disc2) disc2.rotation.y -= 0.02 * (delta / interval);
        if (starField) starField.rotation.y += 0.0001 * (delta / interval);
        if (ambientLights) {
            ambientLights.rotation.y += 0.0002 * (delta / interval);
            ambientLights.rotation.z += 0.0001 * (delta / interval);
        }
        
        controls.update(); // Cập nhật controls
        renderer.render(scene, camera); // Render cảnh

        delta = delta % interval; // Reset delta
    }
}
// ... (Các hàm còn lại giữ nguyên)
function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
function onCanvasClick(event) {
    console.log("Canvas clicked!");
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(giftBox);
    console.log("Intersects:", intersects);
    if (intersects.length > 0) {
        console.log("Gift box clicked!");
        showBirthdayCard();
    } else {
        console.log("Did not click the gift box.");
    }
}
function showBirthdayCard() {
    console.log("showBirthdayCard function called!");
    const galaxyCanvas = document.getElementById('galaxy3DCanvas');
    const birthdayCard = document.getElementById('birthday-card');
    if (!galaxyCanvas || !birthdayCard) {
        console.error("Canvas or Card element not found!");
        return;
    }
    if (birthdayAudio) {
        birthdayAudio.pause();
    }
    if (animationFrameId) {
        console.log("Cancelling animation frame:", animationFrameId);
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    } else {
        console.warn("animationFrameId is not set, cannot cancel animation.");
    }
    galaxyCanvas.style.opacity = '0';
    setTimeout(() => {
        galaxyCanvas.style.display = 'none';
        birthdayCard.classList.add('visible');
        console.log("Birthday card should be visible now.");
    }, 500);
}
function hideBirthdayCard() {
     const galaxyCanvas = document.getElementById('galaxy3DCanvas');
    const birthdayCard = document.getElementById('birthday-card');
    if (!galaxyCanvas || !birthdayCard) return;
    birthdayCard.classList.remove('visible');
     setTimeout(() => {
        birthdayCard.style.display = 'none';
        galaxyCanvas.style.display = 'block';
        setTimeout(() => {
             galaxyCanvas.style.opacity = '1';
             if (!animationFrameId) {
                 animateThreeJS();
             }
             if (userInteracted && birthdayAudio) {
                 birthdayAudio.play().catch(e => console.error("Error resuming audio:", e));
             }
        }, 50);
    }, 500);
}