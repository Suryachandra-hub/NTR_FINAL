
// We use 'declare var' because we are loading face-api.js via CDN in index.html
declare var faceapi: any;

// =========================================================================
// ⚙️ CONFIGURATION
// =========================================================================
let modelsLoaded = false;

export const isModelLoaded = () => modelsLoaded;

export const loadModels = async () => {
    if (modelsLoaded) return true;

    // Strategy: Try Local -> Fallback to CDN 1 -> Fallback to CDN 2
    const modelSources = [
        '/models', // 1. Local Public Folder
        'https://justadudewhohacks.github.io/face-api.js/models', // 2. Official GitHub IO
        'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights' // 3. Raw GitHub
    ];

    if (typeof faceapi === 'undefined') {
        console.error("CRITICAL: face-api.js not loaded. Check index.html script tag.");
        return false;
    }

    for (const url of modelSources) {
        try {
            console.log(`📷 Neural Core: Connecting to ${url}...`);
            
            // Load SSD MobileNet (High Accuracy)
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(url),
                faceapi.nets.faceLandmark68Net.loadFromUri(url),
                faceapi.nets.faceRecognitionNet.loadFromUri(url)
            ]);
            
            console.log(`✅ Neural Networks Online: Connected via ${url}`);
            modelsLoaded = true;
            return true;
        } catch (error) {
            console.warn(`⚠️ Connection to ${url} failed. Trying next source...`);
        }
    }

    console.error("❌ FATAL: Could not load AI Models from any source.");
    alert("Face AI Error:\n\nCould not load model files. \n\n1. If running locally, make sure you created 'public/models' and pasted the files.\n2. If online, check your internet connection.");
    return false;
};

export const getFaceDescriptor = async (videoElement: HTMLVideoElement): Promise<string | null> => {
    try {
        if (!modelsLoaded || typeof faceapi === 'undefined') return null;

        // Use highest confidence threshold for registration/login
        const detection = await faceapi.detectSingleFace(videoElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks()
            .withFaceDescriptor();
        
        if (!detection) return null;

        // Check if face is centered and large enough
        const box = detection.detection.box;
        if (box.width < 100) return null; // Face too far

        return JSON.stringify(Array.from(detection.descriptor));
    } catch (error) {
        console.error("Error getting face descriptor:", error);
        return null;
    }
};

export const compareFaces = (storedDescriptorStr: string, currentDescriptorStr: string): boolean => {
    try {
        if (typeof faceapi === 'undefined') return false;
        const stored = new Float32Array(JSON.parse(storedDescriptorStr));
        const current = new Float32Array(JSON.parse(currentDescriptorStr));
        const distance = faceapi.euclideanDistance(stored, current);
        // Euclidean distance < 0.5 is a solid match. Lower is stricter.
        return distance < 0.5; 
    } catch (error) {
        console.error("Error comparing faces:", error);
        return false;
    }
};

// --- BLINK DETECTION & DRAWING UTILS ---

const getEyeRatio = (eyePoints: any[]) => {
    const a = faceapi.euclideanDistance(eyePoints[1], eyePoints[5]);
    const b = faceapi.euclideanDistance(eyePoints[2], eyePoints[4]);
    const c = faceapi.euclideanDistance(eyePoints[0], eyePoints[3]);
    return (a + b) / (2.0 * c);
};

export const isEyeClosed = (landmarks: any): boolean => {
    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const leftEAR = getEyeRatio(leftEye);
    const rightEAR = getEyeRatio(rightEye);
    
    // Threshold for blink (Eye Aspect Ratio)
    return (leftEAR + rightEAR) / 2 < 0.35; 
};

export const drawFaceMesh = (canvas: HTMLCanvasElement, detection: any, dims: { width: number, height: number }) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous frame
    ctx.clearRect(0, 0, dims.width, dims.height);

    // Resize detections to match display size
    const resizedDetections = faceapi.resizeResults(detection, dims);
    const landmarks = resizedDetections.landmarks;
    const points = landmarks.positions;

    // PREMIUM HUD STYLE
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#FFD700'; // Gold Glow
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)'; // Transparent Gold
    ctx.fillStyle = '#FFD700';

    // Helper to draw lines
    const drawPath = (indices: number[], closePath = false) => {
        ctx.beginPath();
        ctx.moveTo(points[indices[0]].x, points[indices[0]].y);
        for(let i = 1; i < indices.length; i++) {
            ctx.lineTo(points[indices[i]].x, points[indices[i]].y);
        }
        if(closePath) ctx.lineTo(points[indices[0]].x, points[indices[0]].y);
        ctx.stroke();
    };

    // Draw Face Contours (Jaw, Brows, Nose, Eyes, Mouth)
    drawPath([...Array(17).keys()]); // Jaw
    drawPath([...Array(5).keys()].map(i => i + 17)); // Right Brow
    drawPath([...Array(5).keys()].map(i => i + 22)); // Left Brow
    drawPath([...Array(9).keys()].map(i => i + 27)); // Nose
    drawPath([...Array(6).keys()].map(i => i + 36), true); // Left Eye
    drawPath([...Array(6).keys()].map(i => i + 42), true); // Right Eye
    drawPath([...Array(12).keys()].map(i => i + 48), true); // Mouth Outer
    drawPath([...Array(8).keys()].map(i => i + 60), true); // Mouth Inner

    // Draw Tech Nodes (Dots)
    ctx.fillStyle = '#FFFFFF';
    const keyPoints = [30, 36, 39, 42, 45, 48, 54, 8, 27]; // Nose tip, eye corners, mouth corners, chin, bridge
    keyPoints.forEach(idx => {
        if(points[idx]) {
            ctx.beginPath();
            ctx.arc(points[idx].x, points[idx].y, 2, 0, 2 * Math.PI); 
            ctx.fill();
        }
    });

    // Draw Bounding Box Corners (HUD Style)
    const box = detection.detection.box;
    const pad = 20;
    const x = box.x - pad;
    const y = box.y - pad;
    const w = box.width + (pad * 2);
    const h = box.height + (pad * 2);
    const lineLen = 30;

    ctx.strokeStyle = '#00FF00'; // Green tracking box
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    // Top Left
    ctx.moveTo(x, y + lineLen); ctx.lineTo(x, y); ctx.lineTo(x + lineLen, y);
    // Top Right
    ctx.moveTo(x + w - lineLen, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + lineLen);
    // Bottom Right
    ctx.moveTo(x + w, y + h - lineLen); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - lineLen, y + h);
    // Bottom Left
    ctx.moveTo(x + lineLen, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - lineLen);
    
    ctx.stroke();
};
