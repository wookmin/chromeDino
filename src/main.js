import './style.css'
import { CONFIG } from './config.js'
import { createAudioController } from './modules/audio.js'
import { createFaceMeshController } from './modules/faceMesh.js'
import { createMaze, drawMaze, markExplored } from './modules/maze.js'
import { createPlayer } from './modules/player.js'
import { createUi } from './modules/ui.js'
import { createEyeStateManager } from './modules/eyeState.js'

const app = document.querySelector('#app')

app.innerHTML = `
  <div class="app-shell">
    <header class="app-header">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">
          <span class="brand-eye"></span>
        </div>
        <h1>blink maze</h1>
      </div>
      <div class="hint-pill">눈 감으면 움직여요</div>
    </header>

    <main class="dashboard">
      <section class="panel vision-panel">
        <div class="camera-stage">
          <video id="webcam" playsinline muted></video>
          <div id="camera-error" class="camera-error hidden"></div>
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
        <div class="state-row">
          <span id="eye-dot" class="status-dot paused"></span>
          <strong id="eye-label">paused</strong>
        </div>
      </section>

      <section class="panel maze-panel">
        <canvas
          id="maze-canvas"
          width="${CONFIG.MAZE_COLS * CONFIG.CELL_SIZE}"
          height="${CONFIG.MAZE_ROWS * CONFIG.CELL_SIZE}"
          aria-label="blink maze"
        ></canvas>
      </section>
    </main>

    <section class="panel stat-panel">
      <div class="stat-card">
        <span class="stat-label">이동</span>
        <strong id="move-count">0</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">충돌</span>
        <strong id="wall-count">0</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">시간</span>
        <strong id="elapsed-time">00:00</strong>
      </div>
    </section>
  </div>
`

const webcam = document.querySelector('#webcam')
const mazeCanvas = document.querySelector('#maze-canvas')
const cameraError = document.querySelector('#camera-error')

const audio = createAudioController()
const ui = createUi({
  earLeft: document.querySelector('#ear-left'),
  earRight: document.querySelector('#ear-right'),
  earLeftFill: document.querySelector('#ear-left-fill'),
  earRightFill: document.querySelector('#ear-right-fill'),
  eyeDot: document.querySelector('#eye-dot'),
  eyeLabel: document.querySelector('#eye-label'),
  moveCount: document.querySelector('#move-count'),
  wallCount: document.querySelector('#wall-count'),
  elapsedTime: document.querySelector('#elapsed-time'),
})

const eyeState = createEyeStateManager(CONFIG)
const player = createPlayer({
  cols: CONFIG.MAZE_COLS,
  rows: CONFIG.MAZE_ROWS,
  moveIntervalMs: CONFIG.MOVE_INTERVAL_MS,
})

let maze = createMaze(CONFIG.MAZE_COLS, CONFIG.MAZE_ROWS)
let latestFaceState = {
  frameId: 0,
  hasFace: false,
  leftEAR: 0,
  rightEAR: 0,
  ear: 0,
  timestamp: performance.now(),
}
let eyeSnapshot = eyeState.update(null, performance.now())
let lastProcessedFrameId = -1
const sessionStartedAt = performance.now()

const showCameraError = (message) => {
  cameraError.textContent = message
  cameraError.classList.remove('hidden')
}

const hideCameraError = () => {
  cameraError.classList.add('hidden')
}

const resetMaze = () => {
  maze = createMaze(CONFIG.MAZE_COLS, CONFIG.MAZE_ROWS)
  player.reset()
  markExplored(maze, player.col, player.row)
}

const directionMap = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

window.addEventListener('keydown', async (event) => {
  const direction = directionMap[event.key]

  if (!direction) {
    return
  }

  event.preventDefault()
  await audio.resume()

  if (!eyeSnapshot.isClosed) {
    return
  }

  player.press(direction)
})

window.addEventListener('keyup', (event) => {
  const direction = directionMap[event.key]

  if (!direction) {
    return
  }

  player.release(direction)
})

window.addEventListener('blur', () => {
  player.clearInput()
})

mazeCanvas.addEventListener('pointerdown', async () => {
  await audio.resume()
})

const faceMesh = createFaceMeshController({
  video: webcam,
  config: CONFIG,
  onResults: (result) => {
    latestFaceState = result
  },
  onCameraReady: hideCameraError,
  onError: (error) => {
    showCameraError(error?.message || '카메라 권한을 확인해주세요.')
  },
})

const detectionLoop = () => {
  const now = performance.now()

  if (latestFaceState.frameId !== lastProcessedFrameId) {
    const previousClosed = eyeSnapshot.isClosed
    eyeSnapshot = latestFaceState.hasFace
      ? eyeState.update(latestFaceState.ear, latestFaceState.timestamp || now)
      : eyeState.update(null, now)
    lastProcessedFrameId = latestFaceState.frameId

    if (eyeSnapshot.transitioned && eyeSnapshot.isClosed !== previousClosed) {
      audio.play(eyeSnapshot.isClosed ? 'open' : 'close')
    }
  }

  if (!eyeSnapshot.isClosed) {
    player.clearInput()
  }

  ui.render({
    leftEAR: latestFaceState.leftEAR,
    rightEAR: latestFaceState.rightEAR,
    isClosed: eyeSnapshot.isClosed,
    hasFace: latestFaceState.hasFace,
    moveCount: player.moveCount,
    wallCount: player.wallCount,
    elapsedMs: now - sessionStartedAt,
  })

  requestAnimationFrame(detectionLoop)
}

const gameLoop = (timestamp) => {
  const moveResult = player.update({
    timestamp,
    isMovementEnabled: eyeSnapshot.isClosed,
    maze,
  })

  if (moveResult.type === 'move') {
    audio.play('move')
  } else if (moveResult.type === 'wall') {
    audio.play('wall')
  } else if (moveResult.type === 'clear') {
    audio.play('clear')
    resetMaze()
  }

  markExplored(maze, player.col, player.row)

  drawMaze({
    canvas: mazeCanvas,
    maze,
    player,
    cellSize: CONFIG.CELL_SIZE,
    isClosed: eyeSnapshot.isClosed,
  })

  requestAnimationFrame(gameLoop)
}

const start = async () => {
  drawMaze({
    canvas: mazeCanvas,
    maze,
    player,
    cellSize: CONFIG.CELL_SIZE,
    isClosed: eyeSnapshot.isClosed,
  })
  requestAnimationFrame(detectionLoop)
  requestAnimationFrame(gameLoop)

  try {
    await faceMesh.start()
  } catch (error) {
    showCameraError(error?.message || '카메라를 시작할 수 없습니다.')
  }
}

start()
