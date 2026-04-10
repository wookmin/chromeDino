import { canMove } from './maze.js'

const DELTA_BY_DIRECTION = {
  up: { col: 0, row: -1 },
  right: { col: 1, row: 0 },
  down: { col: 0, row: 1 },
  left: { col: -1, row: 0 },
}

export const createPlayer = ({ cols, rows, moveIntervalMs }) => {
  let col = 0
  let row = 0
  let activeDirection = null
  let lastMoveAt = 0

  const player = {
    col,
    row,
    moveCount: 0,
    wallCount: 0,
    press(direction) {
      activeDirection = direction
    },
    release(direction) {
      if (activeDirection === direction) {
        activeDirection = null
      }
    },
    clearInput() {
      activeDirection = null
    },
    reset() {
      col = 0
      row = 0
      player.col = col
      player.row = row
      activeDirection = null
      lastMoveAt = 0
    },
    update({ timestamp, isMovementEnabled, maze }) {
      if (!isMovementEnabled || !activeDirection) {
        return { type: 'idle' }
      }

      if (timestamp - lastMoveAt < moveIntervalMs) {
        return { type: 'idle' }
      }

      lastMoveAt = timestamp

      if (!canMove(maze, col, row, activeDirection)) {
        player.wallCount += 1
        return { type: 'wall' }
      }

      const delta = DELTA_BY_DIRECTION[activeDirection]
      col = Math.max(0, Math.min(cols - 1, col + delta.col))
      row = Math.max(0, Math.min(rows - 1, row + delta.row))
      player.col = col
      player.row = row
      player.moveCount += 1

      if (col === maze.goal.col && row === maze.goal.row) {
        return { type: 'clear' }
      }

      return { type: 'move' }
    },
  }

  return player
}
