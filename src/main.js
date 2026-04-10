import './style.css'
import { CONFIG } from './config.js'
import { BlinkDetector } from './modules/blinkDetector.js'
import { createDebugOverlay } from './modules/debugOverlay.js'
import { createDinoGame, jump } from './modules/dinoGame.js'
import { createFaceMeshController } from './modules/faceMesh.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="app-shell">
    <header class="app-header">
      <div>
        <p class="eyebrow">Eye Controlled Runner</p>
        <h1>Blink to Jump</h1>
        <p class="lede">웹캠으로 눈 깜빡임을 감지해 Dino를 점프시키는 실시간 데모입니다.</p>
      </div>
      <div class="status-chip" id="permission-status">카메라 준비 중...</div>
    </header>

    <main class="dashboard">
      <section class="panel vision-panel">
        <div class="panel-head">
          <h2>Webcam + FaceMesh</h2>
          <span id="blink-state" class="state-pill state-open">OPEN</span>
        </div>
        <div class="camera-stage">
          <video id="webcam" playsinline muted></video>
          <canvas id="overlay"></canvas>
          <div id="camera-error" class="camera-error hidden"></div>
        </div>
      </section>

      <section class="panel game-panel">
        <div class="panel-head">
          <h2>Dino Game</h2>
          <span class="hint">space / click fallback</span>
        </div>
        <canvas id="game" width="720" height="320" aria-label="Chrome Dino style game"></canvas>
      </section>
    </main>

    <section class="panel control-panel">
      <div class="metrics">
        <div class="metric-card">
          <span class="metric-label">EAR</span>
          <strong id="ear-value">0.000</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">Blink Count</span>
          <strong id="blink-count">0</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">Status</span>
          <strong id="status-text">WAITING</strong>
        </div>
      </div>

      <label class="slider-wrap" for="threshold">
        <span>EAR Threshold</span>
        <input
          id="threshold"
          type="range"
          min="0.12"
          max="0.35"
          step="0.005"
          value="${CONFIG.EAR_THRESHOLD}"
        />
        <strong id="threshold-value">${CONFIG.EAR_THRESHOLD.toFixed(3)}</strong>
      </label>
    </section>
  </div>
`

const webcam = document.querySelector('#webcam')
const overlayCanvas = document.querySelector('#overlay')
const gameCanvas = document.querySelector('#game')
const earValue = document.querySelector('#ear-value')
const blinkCount = document.querySelector('#blink-count')
const statusText = document.querySelector('#status-text')
const blinkState = document.querySelector('#blink-state')
const thresholdInput = document.querySelector('#threshold')
const thresholdValue = document.querySelector('#threshold-value')
const permissionStatus = document.querySelector('#permission-status')
const cameraError = document.querySelector('#camera-error')

const blinkDetector = new BlinkDetector(CONFIG)
const overlay = createDebugOverlay(overlayCanvas, CONFIG)
const dinoGame = createDinoGame(gameCanvas)

let latestFaceState = {
  frameId: 0,
  hasFace: false,
  landmarks: [],
  ear: 0,
  timestamp: performance.now(),
}

let latestDetectionResult = {
  label: 'WAITING',
  triggerJump: false,
  blinkCount: 0,
  isClosed: false,
  threshold: CONFIG.EAR_THRESHOLD,
}
let lastProcessedFrameId = -1

const setStatusPill = (isBlinking) => {
  blinkState.textContent = isBlinking ? 'BLINK' : 'OPEN'
  blinkState.classList.toggle('state-open', !isBlinking)
  blinkState.classList.toggle('state-blink', isBlinking)
}

const showCameraError = (message) => {
  cameraError.textContent = message
  cameraError.classList.remove('hidden')
  permissionStatus.textContent = '카메라 오류'
  statusText.textContent = 'CAMERA ERROR'
}

const faceMesh = createFaceMeshController({
  video: webcam,
  config: CONFIG,
  onResults: (result) => {
    latestFaceState = result
  },
  onCameraReady: () => {
    permissionStatus.textContent = '카메라 연결됨'
    cameraError.classList.add('hidden')
  },
  onError: (error) => {
    const message = error?.message || '카메라 권한을 확인해주세요.'
    showCameraError(message)
  },
})

thresholdInput.addEventListener('input', (event) => {
  const nextThreshold = Number(event.currentTarget.value)
  blinkDetector.setThreshold(nextThreshold)
  thresholdValue.textContent = nextThreshold.toFixed(3)
})

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault()
    jump()
  }
})

gameCanvas.addEventListener('click', () => {
  jump()
})

const detectionLoop = () => {
  const now = performance.now()
  if (latestFaceState.frameId !== lastProcessedFrameId) {
    latestDetectionResult = latestFaceState.hasFace
      ? blinkDetector.update(latestFaceState.ear, latestFaceState.timestamp || now)
      : blinkDetector.update(null, now)
    lastProcessedFrameId = latestFaceState.frameId
  }

  earValue.textContent = latestFaceState.hasFace ? latestFaceState.ear.toFixed(3) : '0.000'
  blinkCount.textContent = String(latestDetectionResult.blinkCount)
  statusText.textContent = latestFaceState.hasFace ? latestDetectionResult.label : 'NO FACE'
  setStatusPill(latestDetectionResult.isClosed)

  if (latestFaceState.hasFace) {
    overlay.draw(latestFaceState.landmarks)
  } else {
    overlay.clear()
  }

  if (latestDetectionResult.triggerJump) {
    dinoGame.jump()
    latestDetectionResult = {
      ...latestDetectionResult,
      triggerJump: false,
    }
  }

  requestAnimationFrame(detectionLoop)
}

const start = async () => {
  dinoGame.start()
  requestAnimationFrame(detectionLoop)

  try {
    await faceMesh.start()
  } catch (error) {
    showCameraError(error?.message || '카메라를 시작할 수 없습니다.')
  }
}

start()
