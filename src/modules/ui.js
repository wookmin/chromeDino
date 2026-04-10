const clampBar = (value) => `${Math.max(0, Math.min(100, value * 250))}%`

const formatTime = (elapsedMs) => {
  const totalSeconds = Math.floor(elapsedMs / 1000)
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0')
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}

export const createUi = (elements) => {
  const render = ({
    leftEAR,
    rightEAR,
    isClosed,
    hasFace,
    moveCount,
    wallCount,
    elapsedMs,
  }) => {
    elements.earLeft.textContent = hasFace ? leftEAR.toFixed(3) : '0.000'
    elements.earRight.textContent = hasFace ? rightEAR.toFixed(3) : '0.000'
    elements.earLeftFill.style.width = hasFace ? clampBar(leftEAR) : '0%'
    elements.earRightFill.style.width = hasFace ? clampBar(rightEAR) : '0%'
    elements.eyeDot.classList.toggle('moving', isClosed)
    elements.eyeDot.classList.toggle('paused', !isClosed)
    elements.eyeLabel.textContent = isClosed ? 'moving' : 'paused'
    elements.moveCount.textContent = String(moveCount)
    elements.wallCount.textContent = String(wallCount)
    elements.elapsedTime.textContent = formatTime(elapsedMs)
  }

  return {
    render,
  }
}
