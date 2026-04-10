const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]

const distance = (pointA, pointB) => {
  const dx = pointA.x - pointB.x
  const dy = pointA.y - pointB.y
  return Math.hypot(dx, dy)
}

const calculateEyeEAR = (landmarks, indices) => {
  const [p1, p2, p3, p4, p5, p6] = indices.map((index) => landmarks[index])

  if (![p1, p2, p3, p4, p5, p6].every(Boolean)) {
    return 0
  }

  const vertical = distance(p2, p6) + distance(p3, p5)
  const horizontal = 2 * distance(p1, p4)

  if (horizontal === 0) {
    return 0
  }

  return vertical / horizontal
}

export const calculateAverageEAR = (landmarks) => {
  const leftEAR = calculateEyeEAR(landmarks, LEFT_EYE_INDICES)
  const rightEAR = calculateEyeEAR(landmarks, RIGHT_EYE_INDICES)

  return (leftEAR + rightEAR) / 2
}

export const EYE_LANDMARKS = {
  LEFT_EYE_INDICES,
  RIGHT_EYE_INDICES,
}
