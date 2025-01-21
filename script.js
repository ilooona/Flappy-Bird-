// Инициализация Canvas
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;
document.body.appendChild(canvas);

// Загрузка изображений
const backgroundImage = new Image();
const birdImage = new Image();
const pipeImage = new Image();

const startBirdData = Object.freeze(
    { x: 100, y: 300, width: 40, height: 30, gravity: 1000, lift: -300, velocity: 0 }
);

// Переменные игры
let bird;
let pipes = [];
let score = 0;
let gameOver = false;
let gameStarted = false;

// Настройки труб
const pipeWidth = 100;
const pipeGap = 250;
const pipeDistanceBetween = 300;
const pipeSpeed = 400;
const backgroundSpeed = pipeSpeed / 2;

// Настройка фона
let backgroundX1 = 0;
let backgroundX2 = canvas.width;

let lastFrameTime = 0;

// Управление птицей
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        if (!gameStarted) {
            gameStarted = true;
            lastFrameTime = performance.now();
            requestAnimationFrame(startGameLoop);
        } else {
            bird.velocity = bird.lift; // Прыжок птицы
        }
    }
    if (e.code === 'Enter' && gameOver) { // Рестарт игры
        startGame();
    }
});

function drawTopPartOfImageByCenter(img, x, y, width, height) {
    const imageRatio = img.width / img.height; // Соотношение сторон изображения
    const areaRatio = width / height; // Соотношение сторон целевой области
    let drawWidth, drawHeight;

    if (width < img.width) {
        // Если ширина области меньше ширины изображения, подгоняем по ширине
        drawWidth = width;
        drawHeight = width / imageRatio;
    } else if (imageRatio > areaRatio) {
        // Если изображение шире области, подгоняем по высоте
        drawHeight = height;
        drawWidth = height * imageRatio;
    } else {
        // Если изображение выше области, подгоняем по ширине
        drawWidth = width;
        drawHeight = width / imageRatio;
    }

    const offsetX = (width - drawWidth) / 2; // Центрируем по горизонтали
    // Отрисовываем изображение, начиная с верхней части области
    // Центрируем по оси X, Начинаем с верхней части по оси Y
    ctx.drawImage(img, x + offsetX, y, drawWidth, drawHeight);
}

function loadImage(src, img) {
    return new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = src;
    });
}

// Функция рисования фона
function drawBackground(scale) {
    backgroundX1 -= backgroundSpeed * scale;
    backgroundX2 -= backgroundSpeed * scale;

    // Логика замыкания
    if (backgroundX1 + canvas.width <= 0) {
        backgroundX1 = canvas.width;
    }
    if (backgroundX2 + canvas.width <= 0) {
        backgroundX2 = canvas.width;
    }

    // Принудительное выравнивание, чтобы избежать накопления ошибок
    const gap = Math.abs(backgroundX1 - backgroundX2);
    if (gap > canvas.width) {
        if (backgroundX1 < backgroundX2) {
            backgroundX2 = backgroundX1 + canvas.width;
        } else {
            backgroundX1 = backgroundX2 + canvas.width;
        }
    }

    // Отрисовка фонов
    ctx.drawImage(backgroundImage, Math.floor(backgroundX1), 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, Math.floor(backgroundX2), 0, canvas.width, canvas.height);
}

// Отображение очков
function drawScore() {
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 30);
}

// Добавление начальных труб
function addPipe() {
    const minPipeHeight = 50; 
    const topHeight = Math.random() * (canvas.height - pipeGap - minPipeHeight * 2) + minPipeHeight;

    pipes.push ({
        x: canvas.width, 
        top: topHeight, 
        bottom: topHeight + pipeGap, 
    }) 
}

// Функция рисования труб
function drawPipe(pipe) {
    const pipeHeightTop = pipe.top; 
    const pipeHeightBottom = canvas.height - pipe.bottom; 

    ctx.save(); 
    ctx.translate(pipe.x + pipeWidth / 2, pipeHeightTop); 
    ctx.rotate(Math.PI); 

    drawTopPartOfImageByCenter(pipeImage, -pipeWidth / 2, 0, pipeWidth, pipeHeightTop); 

    ctx.restore(); 

    drawTopPartOfImageByCenter(pipeImage, pipe.x, pipe.bottom, pipeWidth, pipeHeightBottom); 
}

// Старт игры
function startGame() {
    bird = {
        ...startBirdData
    };
    pipes = [];
    score = 0;
    gameOver = false;
    gameStarted = false;

    showReadyScreen();
}

// Функция для обновления игры
function updateGame(scale) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    drawBackground(scale); 

    bird.velocity += bird.gravity * scale; 
    bird.y += bird.velocity * scale; 

    ctx.drawImage(birdImage, bird.x, bird.y, bird.width, bird.height); 

    if (pipes.length === 0 || pipes[pipes.length -1].x < canvas.width - pipeDistanceBetween) {
        addPipe(); 
    }

    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i]; 
        pipe.x -= pipeSpeed * scale; 

        drawPipe(pipe); 

        if (bird.x + bird.width >= pipe.x && 
            bird.x <= pipe.x + pipeWidth && 
            (bird.y <= pipe.top || bird.y + bird.height >= pipe.bottom)) {
            gameOver = true; 
            break; 
        }

        if (pipe.x + pipeWidth < 0) {
            pipes.splice(i, 1); 
            score++; 
            i--;
        }
    }

    drawScore(); 

    if (bird.y + bird.height >= canvas.height || bird.y <= 0) {
        gameOver = true; 
    }

    if (gameOver) {
        ctx.fillStyle = 'red'; 
        ctx.font = '30px Arial'; 
        ctx.textAlign = 'center'; 

        ctx.fillText('Game Over. Press Enter to Restart', canvas.width / 2, canvas.height / 2); 
    }
}


// Экран готовности
function showReadyScreen() {
    drawBackground(0);

    ctx.fillStyle = 'blue';
    ctx.font = '40px Arial'; 
    ctx.textAlign = 'center'; 
    ctx.fillText('Ready?', canvas.width / 2, canvas.height / 3);

    ctx.drawImage(birdImage, bird.x, bird.y, bird.width, bird.height); 

    ctx.fillStyle = 'black'; 
    ctx.font = '20px Arial'; 
    ctx.fillText('Press Space to Start', canvas.width / 2, canvas.height / 2);
}

function startGameLoop(timestamp) {
    const deltaTime = timestamp - lastFrameTime; // Время, прошедшее с последнего кадра
    lastFrameTime = timestamp;

    let scale = deltaTime / 1000; // Высчитываем параметр "масштабирования" для других параметров относительно времени - одной секунды.
        // Например, если прошло всего 16,(6) миллисекунд (столько занимает 1 кадр, если у вас монитор имеет частоту 60 Гц)
        // и если скорость (velocity), например, 800 пикселей в 1 секунду, то птичка должна подвинуться на на 800 пикселей,
        // а всего на velocity(800) * (16,(6) / 1000) = 12.8 пикселей, т.к. времени прошло сильно меньше, чем 1 секунда.

    // Обновляем игру
    updateGame(scale);

    if (!gameOver) {
        requestAnimationFrame(startGameLoop); // Запрос следующего кадра
    }
}

// Загрузка всех изображений и старт игры
Promise.all([
    loadImage('./back.png', backgroundImage),
    loadImage('./bird.png', birdImage),
    loadImage('./pipe.png', pipeImage),
]).then(() => {
    startGame(); // Начать игру после загрузки всех изображений
}).catch(() =>{
    console.log('Произошла ошибка при загрузке изображений. Игра не может быть запущена.');
});