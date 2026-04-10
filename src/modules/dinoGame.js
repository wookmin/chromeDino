let activeGame = null

class DinoGame {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.width = canvas.width
    this.height = canvas.height
    this.groundY = 250
    this.speed = 360
    this.gravity = 2200
    this.jumpVelocity = -760
    this.score = 0
    this.lastFrameTime = 0
    this.spawnTimer = 0
    this.spawnInterval = 1.2
    this.gameOver = false
    this.animationId = null
    this.flashUntil = 0

    this.dino = {
      x: 72,
      y: this.groundY - 44,
      width: 42,
      height: 44,
      velocityY: 0,
      grounded: true,
    }

    this.obstacles = []
    activeGame = this
  }

  start() {
    this.lastFrameTime = performance.now()
    const loop = (timestamp) => {
      const delta = Math.min((timestamp - this.lastFrameTime) / 1000, 0.03)
      this.lastFrameTime = timestamp
      this.update(delta)
      this.render()
      this.animationId = requestAnimationFrame(loop)
    }

    this.animationId = requestAnimationFrame(loop)
  }

  reset() {
    this.score = 0
    this.spawnTimer = 0
    this.spawnInterval = 1.2
    this.speed = 360
    this.gameOver = false
    this.obstacles = []
    this.dino.y = this.groundY - this.dino.height
    this.dino.velocityY = 0
    this.dino.grounded = true
  }

  jump() {
    if (this.gameOver) {
      this.reset()
      this.flashUntil = performance.now() + 180
      return
    }

    if (!this.dino.grounded) {
      return
    }

    this.dino.velocityY = this.jumpVelocity
    this.dino.grounded = false
    this.flashUntil = performance.now() + 180
  }

  spawnObstacle() {
    const height = 34 + Math.random() * 26
    const width = 18 + Math.random() * 14

    this.obstacles.push({
      x: this.width + width,
      y: this.groundY - height,
      width,
      height,
    })

    this.spawnInterval = Math.max(0.7, 1.4 - this.score / 400)
  }

  intersects(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    )
  }

  update(delta) {
    if (this.gameOver) {
      return
    }

    this.score += delta * 100
    this.speed += delta * 4
    this.spawnTimer += delta

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0
      this.spawnObstacle()
    }

    this.dino.velocityY += this.gravity * delta
    this.dino.y += this.dino.velocityY * delta

    if (this.dino.y >= this.groundY - this.dino.height) {
      this.dino.y = this.groundY - this.dino.height
      this.dino.velocityY = 0
      this.dino.grounded = true
    }

    this.obstacles = this.obstacles
      .map((obstacle) => ({
        ...obstacle,
        x: obstacle.x - this.speed * delta,
      }))
      .filter((obstacle) => obstacle.x + obstacle.width > -20)

    if (this.obstacles.some((obstacle) => this.intersects(this.dino, obstacle))) {
      this.gameOver = true
    }
  }

  renderBackground() {
    const { ctx } = this
    ctx.fillStyle = '#dff4ed'
    ctx.fillRect(0, 0, this.width, this.height)

    const gradient = ctx.createLinearGradient(0, 0, this.width, this.height)
    gradient.addColorStop(0, 'rgba(29, 158, 117, 0.18)')
    gradient.addColorStop(1, 'rgba(247, 253, 251, 0.08)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, this.width, this.height)

    ctx.strokeStyle = '#6ebca8'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, this.groundY)
    ctx.lineTo(this.width, this.groundY)
    ctx.stroke()
  }

  render() {
    const { ctx } = this
    this.renderBackground()

    ctx.fillStyle = '#1d9e75'
    ctx.fillRect(this.dino.x, this.dino.y, this.dino.width, this.dino.height)

    ctx.fillStyle = '#0e7460'
    this.obstacles.forEach((obstacle) => {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
    })

    ctx.fillStyle = '#085041'
    ctx.font = '700 20px "Trebuchet MS", sans-serif'
    ctx.fillText(`score ${Math.floor(this.score)}`, this.width - 150, 34)

    if (performance.now() < this.flashUntil) {
      ctx.strokeStyle = 'rgba(157, 234, 214, 0.95)'
      ctx.lineWidth = 10
      ctx.strokeRect(5, 5, this.width - 10, this.height - 10)
    }

    if (!this.gameOver) {
      return
    }

    ctx.fillStyle = 'rgba(29, 158, 117, 0.18)'
    ctx.fillRect(0, 0, this.width, this.height)
    ctx.strokeStyle = 'rgba(8, 80, 65, 0.45)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(this.width / 2, this.height / 2, 28, 0, Math.PI * 2)
    ctx.stroke()
  }
}

export const createDinoGame = (canvas) => new DinoGame(canvas)

export const jump = () => {
  activeGame?.jump()
}
