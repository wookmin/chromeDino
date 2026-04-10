export class BlinkDetector {
  constructor(config) {
    this.threshold = config.EAR_THRESHOLD
    this.consecFrames = config.CONSEC_FRAMES
    this.cooldownMs = config.COOLDOWN_MS
    this.minBlinkDurationMs = config.MIN_BLINK_DURATION_MS

    this.closedFrames = 0
    this.closedStartTime = null
    this.lastBlinkTime = -Infinity
    this.blinkCount = 0
    this.isClosed = false
    this.jumpTriggeredForCurrentBlink = false
  }

  setThreshold(nextThreshold) {
    this.threshold = nextThreshold
  }

  resetClosedState() {
    this.closedFrames = 0
    this.closedStartTime = null
    this.isClosed = false
    this.jumpTriggeredForCurrentBlink = false
  }

  update(ear, timestamp) {
    const hasFace = typeof ear === 'number'
    const eyeClosed = hasFace && ear <= this.threshold
    let triggerJump = false

    if (!hasFace) {
      this.resetClosedState()
      return this.snapshot('NO FACE', triggerJump)
    }

    if (eyeClosed) {
      this.closedFrames += 1
      if (this.closedStartTime === null) {
        this.closedStartTime = timestamp
      }
      this.isClosed = this.closedFrames >= this.consecFrames

      if (this.isClosed && !this.jumpTriggeredForCurrentBlink) {
        const duration = timestamp - this.closedStartTime
        const inCooldown = timestamp - this.lastBlinkTime < this.cooldownMs

        if (!inCooldown && duration >= this.minBlinkDurationMs) {
          this.lastBlinkTime = timestamp
          this.jumpTriggeredForCurrentBlink = true
          triggerJump = true
        }
      }

      return this.snapshot(this.isClosed ? 'BLINK' : 'OPEN', triggerJump)
    }

    if (this.isClosed && this.closedStartTime !== null) {
      this.blinkCount += 1
    }

    this.resetClosedState()
    return this.snapshot('OPEN', triggerJump)
  }

  snapshot(label, triggerJump) {
    return {
      label,
      triggerJump,
      blinkCount: this.blinkCount,
      isClosed: this.isClosed,
      threshold: this.threshold,
    }
  }
}
