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
      return
    }

    if (!this.dino.grounded) {
      return
    }

    this.dino.velocityY = this.jumpVelocity
    this.dino.grounded = false
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
    ctx.fillStyle = '#fff9ef'
    ctx.fillRect(0, 0, this.width, this.height)

    const gradient = ctx.createLinearGradient(0, 0, this.width, this.height)
    gradient.addColorStop(0, 'rgba(255, 204, 112, 0.18)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, this.width, this.height)

    ctx.strokeStyle = '#3f3a33'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, this.groundY)
    ctx.lineTo(this.width, this.groundY)
    ctx.stroke()
  }

  render() {
    const { ctx } = this
    this.renderBackground()

    ctx.fillStyle = '#1f1f1f'
    ctx.fillRect(this.dino.x, this.dino.y, this.dino.width, this.dino.height)

    ctx.fillStyle = '#456b3d'
    this.obstacles.forEach((obstacle) => {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
    })

    ctx.fillStyle = '#1f1f1f'
    ctx.font = '700 20px "Trebuchet MS", sans-serif'
    ctx.fillText(`Score ${Math.floor(this.score)}`, this.width - 140, 34)

    if (!this.gameOver) {
      return
    }

    ctx.fillStyle = 'rgba(18, 18, 18, 0.72)'
    ctx.fillRect(0, 0, this.width, this.height)
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 28px "Trebuchet MS", sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Game Over', this.width / 2, this.height / 2 - 10)
    ctx.font = '500 16px "Trebuchet MS", sans-serif'
    ctx.fillText('Blink, click, or press space to restart', this.width / 2, this.height / 2 + 24)
    ctx.textAlign = 'start'
  }
}

export const createDinoGame = (canvas) => new DinoGame(canvas)

export const jump = () => {
  activeGame?.jump()
}
