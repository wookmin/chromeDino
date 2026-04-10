import { EYE_LANDMARKS } from './earCalculator.js'

const OVERLAY_POINTS = [
  ...EYE_LANDMARKS.LEFT_EYE_INDICES,
  ...EYE_LANDMARKS.RIGHT_EYE_INDICES,
]

export const createDebugOverlay = (canvas, config) => {
  const context = canvas.getContext('2d')
  canvas.width = config.CAMERA_WIDTH
  canvas.height = config.CAMERA_HEIGHT

  const clear = () => {
    context.clearRect(0, 0, canvas.width, canvas.height)
  }

  const draw = (landmarks) => {
    clear()

    context.fillStyle = '#9fe0cf'
    context.strokeStyle = '#085041'
    context.lineWidth = 1.5

    OVERLAY_POINTS.forEach((index) => {
      const point = landmarks[index]

      if (!point) {
        return
      }

      const x = point.x * canvas.width
      const y = point.y * canvas.height

      context.beginPath()
      context.arc(x, y, 4, 0, Math.PI * 2)
      context.fill()
      context.stroke()
    })
  }

  return {
    draw,
    clear,
  }
}
