import '@mediapipe/camera_utils'
import '@mediapipe/face_mesh'
import { calculateEyeEARs } from './earCalculator.js'

const CameraClass = globalThis.Camera
const FaceMeshClass = globalThis.FaceMesh

export const createFaceMeshController = ({
  video,
  config,
  onResults,
  onCameraReady,
  onError,
}) => {
  let camera = null
  let frameId = 0
  let isRunning = false

  if (!CameraClass || !FaceMeshClass) {
    throw new Error('MediaPipe modules failed to load.')
  }

  const faceMesh = new FaceMeshClass({
    locateFile: (file) => `/mediapipe/face_mesh/${file}`,
  })

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  })

  faceMesh.onResults((results) => {
    const landmarks = results.multiFaceLandmarks?.[0]

    if (!landmarks) {
      onResults({
        frameId: frameId += 1,
        hasFace: false,
        landmarks: [],
        ear: 0,
        timestamp: performance.now(),
      })
      return
    }

    const { leftEAR, rightEAR, averageEAR } = calculateEyeEARs(landmarks)

    onResults({
      frameId: frameId += 1,
      hasFace: true,
      landmarks,
      leftEAR,
      rightEAR,
      ear: averageEAR,
      timestamp: performance.now(),
    })
  })

  const start = async () => {
    if (isRunning) {
      return
    }

    try {
      camera = new CameraClass(video, {
        width: config.CAMERA_WIDTH,
        height: config.CAMERA_HEIGHT,
        onFrame: async () => {
          if (!isRunning) {
            return
          }
          await faceMesh.send({ image: video })
        },
      })

      isRunning = true
      await camera.start()
      onCameraReady?.()
    } catch (error) {
      isRunning = false
      onError?.(error)
      throw error
    }
  }

  const stop = async () => {
    if (!isRunning) {
      return
    }

    isRunning = false

    if (camera) {
      await camera.stop()
      camera = null
    }

    video.pause()
    video.srcObject = null

    onResults({
      frameId: frameId += 1,
      hasFace: false,
      landmarks: [],
      leftEAR: 0,
      rightEAR: 0,
      ear: 0,
      timestamp: performance.now(),
    })
  }

  return {
    start,
    stop,
  }
}
