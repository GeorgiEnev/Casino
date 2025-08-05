// Game state variables
let balance = parseInt(localStorage.getItem('casinoBalance')) || 1000;
let currentPrize = 0;
let ticketActive = false;
let isScratching = false;
let scratchPercentage = 0;
let prizeRevealed = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Canvas and context
const canvas = document.getElementById("scratch");
const context = canvas.getContext("2d");

// DOM elements
const balanceElement = document.getElementById("balance");
const prizeDisplay = document.getElementById("prizeAmount");
const buyBtn = document.getElementById("buyBtn");
const resultMessage = document.getElementById("resultMessage");
const coinCursor = document.getElementById("coinCursor");
const winModal = document.getElementById("winModal");
const modalHeader = document.getElementById("modalHeader");
const modalPrize = document.getElementById("modalPrize");
const modalMessage = document.getElementById("modalMessage");
const modalCloseBtn = document.getElementById("modalCloseBtn");

// Prize tiers with probabilities (weighted system) - adjusted for mostly 0 or low prizes
const prizeTiers = [
    { min: 0, max: 0, probability: 0.70 },       // 70% - No prize
    { min: 1, max: 20, probability: 0.20 },      // 20% - $1-$20
    { min: 21, max: 50, probability: 0.06 },     // 6% - $21-$50
    { min: 51, max: 100, probability: 0.03 },    // 3% - $51-$100
    { min: 200, max: 500, probability: 0.01 }    // 1% - Jackpot $200-$500
];

// Scratch tracking for better detection
let scratchedPixels = new Set();
const totalPixels = canvas.width * canvas.height;

// Initialize the game
const init = () => {
    updateBalance();
    updateButtons();
    resetGame();
    setupEventListeners();
    
    // Set up mouse tracking for coin cursor
    document.addEventListener('mousemove', updateCoinCursor);
    document.addEventListener('mouseenter', () => {
        if (ticketActive && !prizeRevealed) {
            coinCursor.style.display = 'block';
        }
    });
    document.addEventListener('mouseleave', () => {
        coinCursor.style.display = 'none';
        stopScratching();
    });
};

// Update balance display and localStorage
const updateBalance = () => {
    balanceElement.textContent = balance;
    localStorage.setItem('casinoBalance', balance.toString());
};

// Update button states based on game state
const updateButtons = () => {
    buyBtn.disabled = balance < 100 || ticketActive;
    
    if (balance < 100 && !ticketActive) {
        resultMessage.textContent = "Not enough balance! You need $100 to play.";
        resultMessage.style.color = "#ff6b6b";
    } else if (!ticketActive) {
        resultMessage.textContent = "Buy a ticket to start playing!";
        resultMessage.style.color = "#ffd700";
    }
};

// Generate prize based on weighted probability system
const generatePrize = () => {
    const random = Math.random();
    let cumulativeProbability = 0;
    
    for (let tier of prizeTiers) {
        cumulativeProbability += tier.probability;
        if (random <= cumulativeProbability) {
            if (tier.min === 0 && tier.max === 0) {
                return 0; // No prize
            }
            return Math.floor(Math.random() * (tier.max - tier.min + 1)) + tier.min;
        }
    }
    
    return 0; // Fallback to no prize
};

// Buy a new ticket
const buyTicket = () => {
    if (balance < 200 || ticketActive) return;

    // Deduct ticket cost
    balance -= 200;
    updateBalance();
    
    // Generate new prize
    currentPrize = generatePrize();
    ticketActive = true;
    prizeRevealed = false;
    scratchPercentage = 0;
    scratchedPixels.clear();
    
    // Update prize display
    prizeDisplay.textContent = `$${currentPrize}`;
    
    // Create new scratch surface
    createScratchSurface();
    
    updateButtons();
    resultMessage.textContent = "Scratch the card to reveal your prize!";
    resultMessage.style.color = "#ffd700";
    
    // Show coin cursor when mouse is over canvas
    const rect = canvas.getBoundingClientRect();
    coinCursor.style.display = 'block';
};

// Reset/start new game
const resetGame = () => {
    ticketActive = false;
    prizeRevealed = false;
    currentPrize = 0;
    scratchPercentage = 0;
    isScratching = false;
    scratchedPixels.clear();
    
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Reset prize display
    prizeDisplay.textContent = "$0";
    
    // Hide coin cursor
    coinCursor.style.display = 'none';
    coinCursor.classList.remove('coin-scratching');
    
    updateButtons();
};

// Create realistic scratch surface with texture
const createScratchSurface = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create gradient background
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#c3a3f1");
    gradient.addColorStop(0.3, "#9b7bc8");
    gradient.addColorStop(0.7, "#7a5fb8");
    gradient.addColorStop(1, "#6414e9");
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add metallic texture pattern
    context.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < canvas.width; i += 12) {
        for (let j = 0; j < canvas.height; j += 12) {
            if ((i + j) % 24 === 0) {
                context.fillRect(i, j, 6, 6);
            }
        }
    }
    
    // Add subtle diagonal lines for texture
    context.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    context.lineWidth = 1;
    for (let i = -canvas.height; i < canvas.width; i += 20) {
        context.beginPath();
        context.moveTo(i, 0);
        context.lineTo(i + canvas.height, canvas.height);
        context.stroke();
    }
    
    // Add "SCRATCH HERE" text
    context.fillStyle = 'rgba(255, 255, 255, 0.4)';
    context.font = 'bold 18px Poppins';
    context.textAlign = 'center';
    context.fillText('SCRATCH HERE', canvas.width / 2, canvas.height / 2 - 15);
    context.font = 'bold 14px Poppins';
    context.fillText('TO REVEAL PRIZE', canvas.width / 2, canvas.height / 2 + 5);
    
    // Set blend mode for scratching
    context.globalCompositeOperation = 'destination-out';
};

// Update coin cursor position and visibility
const updateCoinCursor = (e) => {
    if (!ticketActive || prizeRevealed) {
        coinCursor.style.display = 'none';
        return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const isOverCanvas = e.clientX >= rect.left && 
                        e.clientX <= rect.right && 
                        e.clientY >= rect.top && 
                        e.clientY <= rect.bottom;
    
    if (isOverCanvas) {
        coinCursor.style.display = 'block';
        coinCursor.style.left = `${e.clientX}px`;
        coinCursor.style.top = `${e.clientY}px`;
        
        if (isScratching) {
            coinCursor.classList.add('coin-scratching');
            // Add rotation effect during scratching
            const time = Date.now();
            const rotation = (time / 8) % 360;
            coinCursor.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
        } else {
            coinCursor.classList.remove('coin-scratching');
            coinCursor.style.transform = 'translate(-50%, -50%)';
        }
    } else {
        coinCursor.style.display = 'none';
    }
};

// Get accurate canvas position accounting for scaling
const getCanvasPosition = (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (e.type.includes('touch')) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
};

// Create realistic scratch effect
const scratch = (x, y) => {
    if (!ticketActive || prizeRevealed) return;
    
    const brushSize = 18 + Math.random() * 8; // Variable brush size
    
    // Create gradient brush for realistic scratching
    const gradient = context.createRadialGradient(x, y, 0, x, y, brushSize);
    gradient.addColorStop(0, 'rgba(0,0,0,1)');
    gradient.addColorStop(0.6, 'rgba(0,0,0,0.8)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
    
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(x, y, brushSize, 0, Math.PI * 2);
    context.fill();
    
    // Add additional texture scratches
    for (let i = 0; i < 3; i++) {
        const offsetX = (Math.random() - 0.5) * brushSize * 0.8;
        const offsetY = (Math.random() - 0.5) * brushSize * 0.8;
        const smallSize = brushSize * (0.3 + Math.random() * 0.4);
        
        context.beginPath();
        context.arc(x + offsetX, y + offsetY, smallSize, 0, Math.PI * 2);
        context.fill();
    }
    
    // Track scratched pixels for better percentage calculation
    const pixelRadius = Math.ceil(brushSize);
    for (let px = x - pixelRadius; px <= x + pixelRadius; px++) {
        for (let py = y - pixelRadius; py <= y + pixelRadius; py++) {
            if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
                const distance = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
                if (distance <= brushSize) {
                    scratchedPixels.add(`${Math.floor(px)},${Math.floor(py)}`);
                }
            }
        }
    }
    
    // Calculate scratch percentage
    scratchPercentage = (scratchedPixels.size / totalPixels) * 100;
    
    // Check if enough is scratched to reveal prize (25% threshold)
    if (scratchPercentage >= 25 && !prizeRevealed) {
        revealPrize();
    }
};

// Start scratching
const startScratching = (e) => {
    if (!ticketActive || prizeRevealed) return;
    
    e.preventDefault();
    isScratching = true;
    coinCursor.classList.add('coin-scratching');
    
    const pos = getCanvasPosition(e);
    lastMouseX = pos.x;
    lastMouseY = pos.y;
    scratch(pos.x, pos.y);
};

// Continue scratching with smooth line drawing
const continueScratch = (e) => {
    if (!isScratching || !ticketActive || prizeRevealed) return;
    
    e.preventDefault();
    
    const pos = getCanvasPosition(e);
    
    // Draw line between last position and current position for smooth scratching
    const distance = Math.sqrt((pos.x - lastMouseX) ** 2 + (pos.y - lastMouseY) ** 2);
    const steps = Math.ceil(distance / 5); // 5px steps for smooth line
    
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = lastMouseX + (pos.x - lastMouseX) * t;
        const y = lastMouseY + (pos.y - lastMouseY) * t;
        scratch(x, y);
    }
    
    lastMouseX = pos.x;
    lastMouseY = pos.y;
};

// Stop scratching
const stopScratching = (e) => {
    if (e) e.preventDefault();
    isScratching = false;
    coinCursor.classList.remove('coin-scratching');
    coinCursor.style.transform = 'translate(-50%, -50%)';
};

// Reveal the prize with animation
const revealPrize = () => {
    if (prizeRevealed) return;
    prizeRevealed = true;
    
    // Gradually fade out the remaining scratch surface
    let alpha = 1;
    const fadeOut = () => {
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = alpha;
        
        // Clear with transparent overlay
        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, `rgba(195, 163, 241, ${alpha})`);
        gradient.addColorStop(1, `rgba(100, 20, 233, ${alpha})`);
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        alpha -= 0.02;
        
        if (alpha > 0) {
            requestAnimationFrame(fadeOut);
        } else {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.globalAlpha = 1;
            context.globalCompositeOperation = 'source-over';
        }
    };
    
    fadeOut();
    
    // Hide coin cursor
    coinCursor.style.display = 'none';
    coinCursor.classList.remove('coin-scratching');
    
    // Show result after animation
    setTimeout(() => {
        showPrizeModal();
    }, 1500);
};

// Show prize modal with appropriate styling
const showPrizeModal = () => {
    const isJackpot = currentPrize >= 200;
    const isWin = currentPrize > 0;
    
    if (isWin) {
        if (isJackpot) {
            modalHeader.textContent = "🎰 JACKPOT! 🎰";
            modalMessage.textContent = "You've hit the jackpot! Incredible luck!";
            winModal.classList.add('jackpot');
            createConfetti();
        } else {
            modalHeader.textContent = "🎉 Congratulations! 🎉";
            modalMessage.textContent = "You're a winner!";
            winModal.classList.remove('jackpot');
        }
        
        modalPrize.textContent = `${currentPrize}`;
        resultMessage.textContent = `🎊 You won ${currentPrize}! 🎊`;
        resultMessage.style.color = "#2e7d32";
    } else {
        modalHeader.textContent = "😔 No Prize This Time";
        modalPrize.textContent = "$0";
        modalMessage.textContent = "Better luck next time! Try another ticket.";
        winModal.classList.remove('jackpot');
        resultMessage.textContent = "No prize this time. Try again!";
        resultMessage.style.color = "#d32f2f";
    }
    
    winModal.classList.add('show');
};

// Close modal and collect prize
const closePrizeModal = () => {
    if (currentPrize > 0) {
        balance += currentPrize;
        updateBalance();
    }
    
    winModal.classList.remove('show', 'jackpot');
    resetGame();
};

// Create confetti effect for jackpot wins
const createConfetti = () => {
    const container = document.querySelector('.container');
    const colors = ['#ff6b6b', '#ffd700', '#66ff66', '#66ccff', '#aa66ff', '#ffffff'];
    
    for (let i = 0; i < 80; i++) {
        const confetti = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 6 + Math.random() * 10;
        
        confetti.className = 'confetti';
        confetti.style.position = 'absolute';
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size * 0.7}px`;
        confetti.style.backgroundColor = color;
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.top = '-20px';
        confetti.style.opacity = '0';
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.boxShadow = `0 0 4px ${color}`;
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '10000';
        
        container.appendChild(confetti);
        
        // Animate confetti
        setTimeout(() => {
            confetti.style.opacity = '1';
            confetti.style.transition = `all ${2.5 + Math.random() * 2}s cubic-bezier(0.1, 0.8, 0.3, 1)`;
            confetti.style.transform = `translate(${
                (Math.random() - 0.5) * 300
            }px, ${
                500 + Math.random() * 200
            }px) rotate(${Math.random() * 720}deg)`;
        }, Math.random() * 400);
        
        // Remove confetti after animation
        setTimeout(() => {
            if (confetti.parentNode) {
                confetti.parentNode.removeChild(confetti);
            }
        }, 5000);
    }
};

// Handle touch events for mobile support
const handleTouchStart = (e) => {
    e.preventDefault();
    
    // Update coin cursor position for touch
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    coinCursor.style.left = `${touch.clientX}px`;
    coinCursor.style.top = `${touch.clientY}px`;
    coinCursor.style.display = 'block';
    
    startScratching(e);
};

const handleTouchMove = (e) => {
    e.preventDefault();
    
    // Update coin cursor position for touch
    const touch = e.touches[0];
    coinCursor.style.left = `${touch.clientX}px`;
    coinCursor.style.top = `${touch.clientY}px`;
    
    continueScratch(e);
};

// Setup all event listeners
const setupEventListeners = () => {
    // Button events
    buyBtn.addEventListener('click', buyTicket);
    modalCloseBtn.addEventListener('click', closePrizeModal);
    
    // Mouse events for scratching
    canvas.addEventListener('mousedown', startScratching);
    canvas.addEventListener('mousemove', continueScratch);
    canvas.addEventListener('mouseup', stopScratching);
    canvas.addEventListener('mouseleave', stopScratching);
    
    // Touch events for mobile devices
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', stopScratching);
    
    // Prevent context menu on right click
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Modal backdrop click to close
    winModal.addEventListener('click', (e) => {
        if (e.target === winModal) {
            closePrizeModal();
        }
    });
    
    // Keyboard support for accessibility
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && winModal.classList.contains('show')) {
            closePrizeModal();
        }
        
        // Spacebar to buy ticket when not active
        if (e.key === ' ' && !ticketActive && balance >= 100) {
            e.preventDefault();
            buyTicket();
        }
    });
};

// Create falling chips animation
function spawnChip() {
    const curtain = document.querySelector('.curtain');
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.style.left = Math.random() * 100 + 'vw';
    const size = 12 + Math.random() * 16;
    chip.style.width = chip.style.height = size + 'px';
    chip.style.animationDuration = (4 + Math.random() * 4) + 's';
    curtain.appendChild(chip);
    setTimeout(() => {
        if (chip.parentNode) {
            chip.parentNode.removeChild(chip);
        }
    }, 9000);
}

// Start spawning chips
setInterval(spawnChip, 400 + Math.random() * 400);

// Initialize the game when page loads
window.onload = init;