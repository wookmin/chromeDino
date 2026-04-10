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
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">
          <span class="brand-eye"></span>
        </div>
        <h1>blink</h1>
      </div>
      <div class="header-pills">
        <div class="hint-pill">깜빡여서 점프</div>
        <div class="mode-pill" id="permission-status">눈 건강 모드</div>
        <button class="camera-toggle" id="camera-toggle" type="button">끄기</button>
      </div>
    </header>

    <main class="dashboard">
      <section class="panel vision-panel">
        <div class="camera-stage">
          <video id="webcam" playsinline muted></video>
          <canvas id="overlay"></canvas>
          <div id="camera-error" class="camera-error hidden"></div>
          <div class="status-dot state-open" id="blink-state" aria-label="blink status"></div>
        </div>
        <div class="ear-panel">
          <div class="ear-row">
            <span class="ear-tag">L</span>
            <div class="ear-track"><div id="ear-left-fill" class="ear-fill"></div></div>
            <strong id="ear-left">0.000</strong>
          </div>
          <div class="ear-row">
            <span class="ear-tag">R</span>
            <div class="ear-track"><div id="ear-right-fill" class="ear-fill"></div></div>
            <strong id="ear-right">0.000</strong>
          </div>
        </div>
      </section>

      <section class="panel game-panel">
        <canvas id="game" width="720" height="320" aria-label="Chrome Dino style game"></canvas>
      </section>
    </main>

    <section class="panel control-panel">
      <div class="metrics">
        <div class="metric-card">
          <span class="metric-label">오늘</span>
          <strong id="blink-count">0</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">대비</span>
          <strong id="comfort-score">0%</strong>
        </div>
        <div class="metric-card">
          <span class="metric-label">시간</span>
          <strong id="session-time">00:00</strong>
        </div>
      </div>
    </section>
  </div>
`

const webcam = document.querySelector('#webcam')
const overlayCanvas = document.querySelector('#overlay')
const gameCanvas = document.querySelector('#game')
const earLeft = document.querySelector('#ear-left')
const earRight = document.querySelector('#ear-right')
const earLeftFill = document.querySelector('#ear-left-fill')
const earRightFill = document.querySelector('#ear-right-fill')
const blinkCount = document.querySelector('#blink-count')
const comfortScore = document.querySelector('#comfort-score')
const sessionTime = document.querySelector('#session-time')
const blinkState = document.querySelector('#blink-state')
const permissionStatus = document.querySelector('#permission-status')
const cameraError = document.querySelector('#camera-error')
const cameraToggle = document.querySelector('#camera-toggle')

const blinkDetector = new BlinkDetector(CONFIG)
const overlay = createDebugOverlay(overlayCanvas, CONFIG)
const dinoGame = createDinoGame(gameCanvas)
const sessionStartedAt = performance.now()

let latestFaceState = {
  frameId: 0,
  hasFace: false,
  landmarks: [],
  leftEAR: 0,
  rightEAR: 0,
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
let cameraActive = false

const setStatusPill = (isBlinking) => {
  blinkState.classList.toggle('state-open', !isBlinking)
  blinkState.classList.toggle('state-blink', isBlinking)
}

const showCameraError = (message) => {
  cameraError.textContent = message
  cameraError.classList.remove('hidden')
  permissionStatus.textContent = '연결 오류'
  cameraToggle.textContent = '켜기'
  cameraActive = false
}

const updateCameraButton = () => {
  cameraToggle.textContent = cameraActive ? '끄기' : '켜기'
  cameraToggle.classList.toggle('is-off', !cameraActive)
}

const faceMesh = createFaceMeshController({
  video: webcam,
  config: CONFIG,
  onResults: (result) => {
    latestFaceState = result
  },
  onCameraReady: () => {
    permissionStatus.textContent = '눈 건강 모드'
    cameraError.classList.add('hidden')
    cameraActive = true
    updateCameraButton()
  },
  onError: (error) => {
    const message = error?.message || '카메라 권한을 확인해주세요.'
    showCameraError(message)
  },
})

cameraToggle.addEventListener('click', async () => {
  cameraToggle.disabled = true

  try {
    if (cameraActive) {
      await faceMesh.stop()
      cameraActive = false
      permissionStatus.textContent = '카메라 멈춤'
      cameraError.classList.add('hidden')
      overlay.clear()
      updateCameraButton()
    } else {
      await faceMesh.start()
    }
  } catch (error) {
    showCameraError(error?.message || '카메라를 제어할 수 없습니다.')
  } finally {
    updateCameraButton()
    cameraToggle.disabled = false
  }
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

const clampBar = (value) => `${Math.max(0, Math.min(100, value * 250))}%`

const formatSessionTime = (elapsedMs) => {
  const totalSeconds = Math.floor(elapsedMs / 1000)
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

const detectionLoop = () => {
  const now = performance.now()
  if (latestFaceState.frameId !== lastProcessedFrameId) {
    latestDetectionResult = latestFaceState.hasFace
      ? blinkDetector.update(latestFaceState.ear, latestFaceState.timestamp || now)
      : blinkDetector.update(null, now)
    lastProcessedFrameId = latestFaceState.frameId
  }

  earLeft.textContent = latestFaceState.hasFace ? latestFaceState.leftEAR.toFixed(3) : '0.000'
  earRight.textContent = latestFaceState.hasFace ? latestFaceState.rightEAR.toFixed(3) : '0.000'
  earLeftFill.style.width = latestFaceState.hasFace ? clampBar(latestFaceState.leftEAR) : '0%'
  earRightFill.style.width = latestFaceState.hasFace ? clampBar(latestFaceState.rightEAR) : '0%'
  blinkCount.textContent = String(latestDetectionResult.blinkCount)
  comfortScore.textContent = latestFaceState.hasFace
    ? `${Math.max(0, Math.min(199, Math.round((latestFaceState.ear / CONFIG.EAR_THRESHOLD) * 100)))}%`
    : '0%'
  sessionTime.textContent = formatSessionTime(now - sessionStartedAt)
  setStatusPill(latestDetectionResult.isClosed)

  if (latestFaceState.hasFace) {
    overlay.draw(latestFaceState.landmarks)
  } else {
    overlay.clear()
  }

  if (latestDetectionResult.triggerJump) {
    dinoGame.jump()
    app.classList.remove('flash-edge')
    void app.offsetWidth
    app.classList.add('flash-edge')
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
