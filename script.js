const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
canvas.width = 800
canvas.height = 600
document.body.appendChild(canvas)

const backgroundImage = new Image()
const birdImage = new Image()
const pipeImage = new Image()

const startBirdData = Object.freeze(
    { x: 100, y: 300, width: 40, height: 30, gravity: 1000, lift: -300, velocity: 0 }
)

let bird
let pipes = []
let score = 0
let gameOver = false
let gameStarted = false

const pipeWidth = 100
const pipeGap = 250
const pipeDistanceBetween = 300
let pipeSpeed = 400
let backgroundSpeed = pipeSpeed / 2

let backgroundX1 = 0
let backgroundX2 = canvas.width

let lastFrameTime = 0

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (!gameStarted) {
            gameStarted = true
            lastFrameTime = performance.now()
            requestAnimationFrame(startGameLoop)
        } else {
            bird.velocity = bird.lift
        }
    }
    if (e.code === 'Enter' && gameOver) {
        startGame()
    }
})


function drawTopPartOfImageByCenter(img, x, y, width, height) {
    const imageRatio = img.width / img.height
    const areaRatio = width / height
    let drawWidth, drawHeight

    if (width < img.width) {
        drawWidth = width
        drawHeight = width / imageRatio
    } else if (imageRatio > areaRatio) {
        drawHeight = height
        drawWidth = height * imageRatio
    } else {

        drawWidth = width;
        drawHeight = width / imageRatio
    }

    const offsetX = (width - drawWidth) / 2
    ctx.drawImage(img, x + offsetX, y, drawWidth, drawHeight)
}


function loadImage(src, img) {
    return new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = src
    })
}


function drawBackground(scale) {
    backgroundX1 -= backgroundSpeed * scale
    backgroundX2 -= backgroundSpeed * scale
    if (backgroundX1 + canvas.width <= 0) {
        backgroundX1 = canvas.width
    }
    if (backgroundX2 + canvas.width <= 0) {
        backgroundX2 = canvas.width
    }

    const gap = Math.abs(backgroundX1 - backgroundX2)
    if (gap > canvas.width) {
        if (backgroundX1 < backgroundX2) {
            backgroundX2 = backgroundX1 + canvas.width
        } else {
            backgroundX1 = backgroundX2 + canvas.width
        }
    }


    ctx.drawImage(backgroundImage, Math.floor(backgroundX1), 0, canvas.width, canvas.height)
    ctx.drawImage(backgroundImage, Math.floor(backgroundX2), 0, canvas.width, canvas.height)
}


function drawScore() {
    ctx.fillStyle = 'black'
    ctx.font = '20px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`Score: ${score}`, 20, 30)
}


function addPipe() {
    const minPipeHeight = 50
    const topHeight = Math.random() * (canvas.height - pipeGap - minPipeHeight * 2) + minPipeHeight

    pipes.push ({
        x: canvas.width, 
        top: topHeight, 
        bottom: topHeight + pipeGap, 
    }) 
}


function drawPipe(pipe) {
    const pipeHeightTop = pipe.top
    const pipeHeightBottom = canvas.height - pipe.bottom

    ctx.save()
    ctx.translate(pipe.x + pipeWidth / 2, pipeHeightTop)
    ctx.rotate(Math.PI)

    drawTopPartOfImageByCenter(pipeImage, -pipeWidth / 2, 0, pipeWidth, pipeHeightTop)

    ctx.restore()

    drawTopPartOfImageByCenter(pipeImage, pipe.x, pipe.bottom, pipeWidth, pipeHeightBottom)
}


function startGame() {
    bird = {
        ...startBirdData
    }
    pipes = []
    score = 0
    gameOver = false
    gameStarted = false

    pipeSpeed = 400
    backgroundSpeed = pipeSpeed / 2

    showReadyScreen()
}


function updateGame(scale) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    drawBackground(scale)

    bird.velocity += bird.gravity * scale
    bird.y += bird.velocity * scale

    ctx.drawImage(birdImage, bird.x, bird.y, bird.width, bird.height)

    if (pipes.length === 0 || pipes[pipes.length -1].x < canvas.width - pipeDistanceBetween) {
        addPipe()
    }

    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i]
        pipe.x -= pipeSpeed * scale

        drawPipe(pipe)

        if (bird.x + bird.width >= pipe.x && 
            bird.x <= pipe.x + pipeWidth && 
            (bird.y <= pipe.top || bird.y + bird.height >= pipe.bottom)) {
            gameOver = true
            break
        }

        if (pipe.x + pipeWidth < 0) {
            pipes.splice(i, 1)
            score++

            if (score % 5 === 0) {
                pipeSpeed += 50
                backgroundSpeed = pipeSpeed / 2
            }
            i--
        }
    }

    drawScore()

    if (bird.y + bird.height >= canvas.height || bird.y <= 0) {
        gameOver = true
    }

    if (gameOver) {
        ctx.fillStyle = 'red'
        ctx.font = '30px Arial'
        ctx.textAlign = 'center'

        ctx.fillText('Game Over. Press Enter to Restart', canvas.width / 2, canvas.height / 2)
    }
}


function showReadyScreen() {
    drawBackground(0)

    ctx.fillStyle = 'blue'
    ctx.font = '40px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Ready?', canvas.width / 2, canvas.height / 3)
    
    ctx.drawImage(birdImage, bird.x, bird.y, bird.width, bird.height)

    ctx.fillStyle = 'black'
    ctx.font = '20px Arial'
    ctx.fillText('Press Space to Start', canvas.width / 2, canvas.height / 2)
}


function startGameLoop(timestamp) {
    const deltaTime = timestamp - lastFrameTime
    lastFrameTime = timestamp

    let scale = deltaTime / 1000

    updateGame(scale)

    if (!gameOver) {
        requestAnimationFrame(startGameLoop)
    }
}


Promise.all([
    loadImage('./back.png', backgroundImage),
    loadImage('./bird.png', birdImage),
    loadImage('./pipe.png', pipeImage),
]).then(() => {
    startGame()
}).catch(() =>{
    console.log('Произошла ошибка при загрузке изображений. Игра не может быть запущена.')
})