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

  if (results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0];

    const leftEye = landmarks[33];   // Left eye corner
    const rightEye = landmarks[263]; // Right eye corner

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    const leftX = leftEye.x * canvasWidth;
    const leftY = leftEye.y * canvasHeight;
    const rightX = rightEye.x * canvasWidth;
    const rightY = rightEye.y * canvasHeight;

    // Center point between eyes
    const centerX = (leftX + rightX) / 2;
    const centerY = (leftY + rightY) / 2;

    // Calculate angle of rotation
    const angle = Math.atan2(rightY - leftY, rightX - leftX);

    // Calculate width and height for glasses
    const width = Math.hypot(rightX - leftX, rightY - leftY) * 2.2;
    const height = width / 2.5;

    // Save canvas state, rotate, draw, and restore
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.drawImage(glassesImg, -width / 2, -height / 2, width, height);
    ctx.restore();
  }
});

const camera = new Camera(video, {
  onFrame: async () => {
    await faceMesh.send({ image: video });
  },
  width: 480,
  height: 360
});

camera.start();
