export const createEyeStateManager = (config) => {
  let closedFrames = 0
  let isClosed = false

  const update = (ear, timestamp) => {
    const hasFace = typeof ear === 'number'
    const nextClosed = hasFace && ear <= config.EAR_THRESHOLD
    const previousClosed = isClosed

    if (!hasFace) {
      closedFrames = 0
      isClosed = false
      return {
        isClosed,
        hasFace,
        timestamp,
        transitioned: previousClosed !== isClosed,
      }
    }

    if (nextClosed) {
      closedFrames += 1
    } else {
      closedFrames = 0
    }

    isClosed = closedFrames >= config.CONSEC_FRAMES

    if (!nextClosed) {
      isClosed = false
    }

    return {
      isClosed,
      hasFace,
      timestamp,
      transitioned: previousClosed !== isClosed,
    }
  }

  return {
    update,
  }
}
