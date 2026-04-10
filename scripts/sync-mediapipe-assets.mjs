import { cp, mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const sourceDir = path.join(rootDir, 'node_modules', '@mediapipe', 'face_mesh')
const targetDir = path.join(rootDir, 'public', 'mediapipe', 'face_mesh')

const ensureInstalled = async () => {
  try {
    await stat(sourceDir)
    return true
  } catch {
    return false
  }
}

if (await ensureInstalled()) {
  await mkdir(targetDir, { recursive: true })
  await cp(sourceDir, targetDir, { recursive: true, force: true })
  console.log('MediaPipe face_mesh assets synced.')
} else {
  console.warn('Skipping MediaPipe asset sync because @mediapipe/face_mesh is not installed yet.')
}
