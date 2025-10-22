// --- KHÔNG CÓ LỆNH IMPORT Ở ĐÂY NỮA ---

// --- BIẾN TOÀN CỤC ---
let scene, camera, renderer, controls;
let pointPlanet, disc1, disc2, starField, ambientLights;
let drawInterval, animationFrameId;
let birthdayAudio;
let userInteracted = false; // Chỉ theo dõi tương tác ĐẦU TIÊN
let giftBox;
let clock = new THREE.Clock();
let delta = 0;
let interval = 1 / 30; // 30 fps
let isCardVisible = false; // Thêm biến trạng thái cho thiệp

// --- MẢNG CHỨA CÁC ẢNH CỦA BẠN ---
const photoUrls = [ /* ... giữ nguyên ... */ ];

// --- PHẦN KHỞI ĐỘNG CHÍNH ---
document.addEventListener('DOMContentLoaded', () => {
    runMatrixEffect();
    // Lắng nghe tương tác đầu tiên để bật nhạc (CHỈ MỘT LẦN)
    document.body.addEventListener('click', handleFirstInteraction, { once: true });
    document.body.addEventListener('touchstart', handleFirstInteraction, { once: true });
    const closeButton = document.getElementById('close-card-button');
    if (closeButton) {
        closeButton.addEventListener('click', hideBirthdayCard);
    }
});

// --- HÀM XỬ LÝ TƯƠNG TÁC ĐẦU TIÊN (để bật nhạc) ---
function handleFirstInteraction() {
    if (userInteracted) return;
    userInteracted = true;
    console.log("User interacted. Initializing and playing audio.");
    // Khởi tạo và phát nhạc ngay lập tức
    setupBackgroundMusic(true); // true = cố gắng phát ngay
}

// --- CÁC HÀM CỦA HIỆU ỨNG MA TRẬN ---
// ... (Giữ nguyên không đổi)
function runMatrixEffect() { /* ... */ }

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
        galaxyCanvas.style.display = 'block'; // Phải display trước khi fade in
        setTimeout(() => galaxyCanvas.style.opacity = '1', 50);
        // Khởi tạo audio nhưng KHÔNG cố phát nếu chưa có tương tác
        setupBackgroundMusic(false); 
    }, 2000);
}

// --- HÀM KHỞI TẠO NHẠC (thêm tham số playImmediately) ---
function setupBackgroundMusic(playImmediately) {
    if (!birthdayAudio) {
        birthdayAudio = document.createElement('audio');
        birthdayAudio.src = 'eyenoselip.mp3';
        birthdayAudio.loop = true;
        document.body.appendChild(birthdayAudio);
        console.log("Audio element created.");
        // Chỉ phát nếu được yêu cầu VÀ đã có tương tác
        if (playImmediately && userInteracted) {
             birthdayAudio.play().catch(error => {
                console.error("Error playing audio on setup:", error);
            });
        }
    } else if (playImmediately && userInteracted && birthdayAudio.paused) {
        // Nếu audio đã có và đang dừng, thử phát lại
         birthdayAudio.play().catch(error => {
            console.error("Error resuming audio on setup:", error);
        });
    }
}


// --- HÀM TẠO TEXTURE HÌNH TRÒN MỜ ---
// ... (Giữ nguyên)
function generateSprite(isHalo, color) { /* ... */ }

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
    
    // THÊM: Lắng nghe cả click và touchend
    renderer.domElement.addEventListener('click', handleInteractionEnd, false);
    renderer.domElement.addEventListener('touchend', handleInteractionEnd, false);
}
// ... (Hàm createDisc giữ nguyên)
function createDisc(/* ... */) { /* ... */ }


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
// ... (Hàm onWindowResize giữ nguyên)
function onWindowResize() { /* ... */ }

// --- HÀM XỬ LÝ CLICK/TOUCHEND TRÊN CANVAS 3D ---
function handleInteractionEnd(event) {
    // Ngăn chặn hành vi mặc định (ví dụ: cuộn trang trên di động)
    // event.preventDefault(); 
    // Tạm thời comment lại preventDefault xem có ảnh hưởng không

    // Nếu thiệp đang hiện thì không làm gì cả
    if(isCardVisible) return;

    // Lấy tọa độ chạm/click
    const coords = new THREE.Vector2();
    if (event.changedTouches) { // Nếu là sự kiện touch
        coords.x = (event.changedTouches[0].clientX / window.innerWidth) * 2 - 1;
        coords.y = - (event.changedTouches[0].clientY / window.innerHeight) * 2 + 1;
    } else { // Nếu là sự kiện click
        coords.x = (event.clientX / window.innerWidth) * 2 - 1;
        coords.y = - (event.clientY / window.innerHeight) * 2 + 1;
    }

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(coords, camera);
    const intersects = raycaster.intersectObject(giftBox);

    if (intersects.length > 0) {
        showBirthdayCard();
    }
}
// --- HÀM HIỆN THIỆP ---
function showBirthdayCard() {
    // Ngăn gọi lại nếu thiệp đang hiện
    if(isCardVisible) return; 
    isCardVisible = true;

    const galaxyCanvas = document.getElementById('galaxy3DCanvas');
    const birthdayCard = document.getElementById('birthday-card');
    if (!galaxyCanvas || !birthdayCard) return;

    if (birthdayAudio) birthdayAudio.pause();

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    } 

    galaxyCanvas.style.opacity = '0';
    setTimeout(() => {
        galaxyCanvas.style.display = 'none';
        birthdayCard.classList.add('visible');
    }, 500);
}
// --- HÀM ẨN THIỆP ---
function hideBirthdayCard() {
    isCardVisible = false; // Cập nhật trạng thái

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
             // KHÔNG tự động phát lại nhạc khi đóng thiệp
             // if (userInteracted && birthdayAudio) {
             //     birthdayAudio.play().catch(e => console.error("Error resuming audio:", e));
             // }
        }, 50);
    }, 500);
}
