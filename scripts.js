const video = document.getElementById('video');
const canvas = document.getElementById('overlay');
const ctx = canvas.getContext('2d');

const glassesImg = new Image();
glassesImg.src = "img/1.png";

function changeGlasses(src) {
  glassesImg.src = src;
}

const faceMesh = new FaceMesh({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
});

faceMesh.setOptions({
  maxNumFaces: 1,
  refineLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

faceMesh.onResults(results => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0];

    // Face shape detection
    const faceShape = getFaceShape(landmarks);
    showRecommendation(faceShape);

    // Glasses position
    const leftEye = landmarks[33];
    const rightEye = landmarks[263];

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const leftX = leftEye.x * canvasWidth;
    const leftY = leftEye.y * canvasHeight;
    const rightX = rightEye.x * canvasWidth;
    const rightY = rightEye.y * canvasHeight;

    const centerX = (leftX + rightX) / 2;
    const centerY = (leftY + rightY) / 2;
    const angle = Math.atan2(rightY - leftY, rightX - leftX);

    const width = Math.hypot(rightX - leftX, rightY - leftY) * 2.2;
    const height = width / 2.5;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.drawImage(glassesImg, -width / 2, -height / 2, width, height);
    ctx.restore();
  }
});

function getFaceShape(landmarks) {
    const jaw = landmarks[152];
    const forehead = landmarks[10];
    const leftCheek = landmarks[234];
    const rightCheek = landmarks[454];
    const leftJaw = landmarks[127];
    const rightJaw = landmarks[356];
    const leftForehead = landmarks[70];
    const rightForehead = landmarks[300];
  
    const faceHeight = Math.abs(forehead.y - jaw.y);
    const faceWidth = Math.abs(rightCheek.x - leftCheek.x);
    const jawWidth = Math.abs(rightJaw.x - leftJaw.x);
    const foreheadWidth = Math.abs(rightForehead.x - leftForehead.x);
  
    const widthToHeightRatio = faceWidth / faceHeight;
    const jawToFaceRatio = jawWidth / faceWidth;
    const foreheadToJawRatio = foreheadWidth / jawWidth;
  
    // NEW LOGIC: Be kinder to Oval faces
    if (widthToHeightRatio > 1.05 && jawToFaceRatio < 0.75) {
      return "Round";
    } else if (widthToHeightRatio > 1.05 && jawToFaceRatio >= 0.75) {
      return "Square";
    } else if (foreheadToJawRatio >= 1.1) {
      return "Heart";
    } else if (widthToHeightRatio < 0.7 && foreheadToJawRatio < 0.95 && jawToFaceRatio >= 0.95) {
      return "Oval"; // NEW: Long face, not too narrow forehead, not too sharp jaw
    } else {
      return "Rectangle"; // fallback
    }
  }
  
  

function showRecommendation(shape) {
    const map = {
      "Round": "Try Rectangle or Cat Eye Frames",
      "Square": "Try Round or Oval Frames",
      "Oval": "Almost any frame shape suits you!",
      "Heart": "Try Round or Oval Frames",
      "Rectangle": "Try Round or Oversized Frames"
    };
  
    const text = `Pro Tip💡 : Face Shape: ${shape}<br> ${map[shape] || "Try Rectangle Frames"}`;
    const recommendation = document.getElementById('recommendation');
  
    if (recommendation) {
      recommendation.innerHTML = text;
      recommendation.style.display = "block";
    } else {
      console.warn("Element with ID 'recommendation' not found.");
    }
  }
  

const camera = new Camera(video, {
  onFrame: async () => {
    await faceMesh.send({ image: video });
  },
  width: 480,
  height: 360
});

camera.start();
