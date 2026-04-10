import { calculateEyeEARs } from './earCalculator.js'

export const createFaceMeshController = ({
  video,
  config,
  onResults,
  onCameraReady,
  onError,
}) => {
  let camera = null
  let faceMesh = null
  let frameId = 0
  let isRunning = false
  let CameraClass = null

  const loadMediaPipe = async () => {
    if (CameraClass && faceMesh) {
      return
    }

    await import('@mediapipe/camera_utils')
    await import('@mediapipe/face_mesh')

    CameraClass = globalThis.Camera
    const FaceMeshClass = globalThis.FaceMesh

    if (!CameraClass || !FaceMeshClass) {
      throw new Error('MediaPipe modules failed to load.')
    }

    faceMesh = new FaceMeshClass({
      locateFile: (file) => `${import.meta.env.BASE_URL}mediapipe/face_mesh/${file}`,
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
          leftEAR: 0,
          rightEAR: 0,
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
  }

  const start = async () => {
    if (isRunning) {
      return
    }

    try {
      await loadMediaPipe()

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
