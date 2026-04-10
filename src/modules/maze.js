const createCell = (col, row) => ({
  col,
  row,
  visited: false,
  walls: {
    top: true,
    right: true,
    bottom: true,
    left: true,
  },
})

const getIndex = (col, row, cols, rows) => {
  if (col < 0 || row < 0 || col >= cols || row >= rows) {
    return -1
  }

  return row * cols + col
}

const removeWalls = (current, next) => {
  const colDelta = current.col - next.col
  const rowDelta = current.row - next.row

  if (colDelta === 1) {
    current.walls.left = false
    next.walls.right = false
  } else if (colDelta === -1) {
    current.walls.right = false
    next.walls.left = false
  }

  if (rowDelta === 1) {
    current.walls.top = false
    next.walls.bottom = false
  } else if (rowDelta === -1) {
    current.walls.bottom = false
    next.walls.top = false
  }
}

export const createMaze = (cols, rows) => {
  const cells = Array.from({ length: cols * rows }, (_, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    return createCell(col, row)
  })

  const stack = []
  let current = cells[0]
  current.visited = true

  do {
    const neighbors = [
      cells[getIndex(current.col, current.row - 1, cols, rows)],
      cells[getIndex(current.col + 1, current.row, cols, rows)],
      cells[getIndex(current.col, current.row + 1, cols, rows)],
      cells[getIndex(current.col - 1, current.row, cols, rows)],
    ].filter((cell) => cell && !cell.visited)

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)]
      next.visited = true
      stack.push(current)
      removeWalls(current, next)
      current = next
    } else {
      current = stack.pop()
    }
  } while (stack.length > 0 || current)

  cells.forEach((cell) => {
    cell.visited = false
  })

  return {
    cols,
    rows,
    cells,
    goal: { col: cols - 1, row: rows - 1 },
    explored: new Set(['0,0']),
  }
}

export const markExplored = (maze, col, row) => {
  maze.explored.add(`${col},${row}`)
}

export const canMove = (maze, col, row, direction) => {
  const cell = maze.cells[row * maze.cols + col]

  if (!cell) {
    return false
  }

  if (direction === 'up') {
    return !cell.walls.top
  }
  if (direction === 'right') {
    return !cell.walls.right
  }
  if (direction === 'down') {
    return !cell.walls.bottom
  }
  if (direction === 'left') {
    return !cell.walls.left
  }

  return false
}

export const drawMaze = ({ canvas, maze, player, cellSize, isClosed }) => {
  const context = canvas.getContext('2d')
  context.clearRect(0, 0, canvas.width, canvas.height)

  context.fillStyle = '#F7FDFB'
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.strokeStyle = '#C8EDE3'
  context.lineWidth = 4
  maze.cells.forEach((cell) => {
    const x = cell.col * cellSize
    const y = cell.row * cellSize

    if (cell.walls.top) {
      context.beginPath()
      context.moveTo(x, y)
      context.lineTo(x + cellSize, y)
      context.stroke()
    }
    if (cell.walls.right) {
      context.beginPath()
      context.moveTo(x + cellSize, y)
      context.lineTo(x + cellSize, y + cellSize)
      context.stroke()
    }
    if (cell.walls.bottom) {
      context.beginPath()
      context.moveTo(x, y + cellSize)
      context.lineTo(x + cellSize, y + cellSize)
      context.stroke()
    }
    if (cell.walls.left) {
      context.beginPath()
      context.moveTo(x, y)
      context.lineTo(x, y + cellSize)
      context.stroke()
    }
  })

  const centerX = player.col * cellSize + cellSize / 2
  const centerY = player.row * cellSize + cellSize / 2
  const viewRadius = cellSize * (isClosed ? 3 : 2.5)
  const goalCenterX = maze.goal.col * cellSize + cellSize / 2
  const goalCenterY = maze.goal.row * cellSize + cellSize / 2
  const goalVisible =
    Math.hypot(goalCenterX - centerX, goalCenterY - centerY) <= viewRadius

  if (goalVisible) {
    context.fillStyle = '#9FE1CB'
    context.fillRect(
      maze.goal.col * cellSize + 8,
      maze.goal.row * cellSize + 8,
      cellSize - 16,
      cellSize - 16,
    )
  }

  context.save()
  context.fillStyle = 'rgba(8, 80, 65, 0.95)'
  context.fillRect(0, 0, canvas.width, canvas.height)

  context.globalCompositeOperation = 'destination-out'
  maze.explored.forEach((key) => {
    const [col, row] = key.split(',').map(Number)
    context.fillStyle = 'rgba(8, 80, 65, 0.35)'
    context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
  })

  const fog = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, viewRadius)
  fog.addColorStop(0, 'rgba(8, 80, 65, 1)')
  fog.addColorStop(0.6, 'rgba(8, 80, 65, 0.55)')
  fog.addColorStop(1, 'rgba(8, 80, 65, 0)')
  context.fillStyle = fog
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.restore()

  if (isClosed) {
    context.fillStyle = 'rgba(29, 158, 117, 0.18)'
    context.beginPath()
    context.arc(centerX, centerY, cellSize * 0.5, 0, Math.PI * 2)
    context.fill()
  }

  context.globalAlpha = isClosed ? 1 : 0.5
  context.fillStyle = '#1D9E75'
  context.beginPath()
  context.arc(centerX, centerY, cellSize * 0.2, 0, Math.PI * 2)
  context.fill()
  context.globalAlpha = 1
}
