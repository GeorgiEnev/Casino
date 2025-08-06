document.addEventListener('DOMContentLoaded', () => {
  // Game state
  let balance = parseInt(localStorage.getItem('casinoBalance'), 10) || 1000;
  let currentBet = 100;
  let selectedNumber = null;
  let isSpinning = false;
  let totalRotation = 0;

  // EXACT European roulette wheel layout - reading clockwise from top (0 degrees)
  // Based on your image, starting with 0 at the top
  const wheelNumbers = [
    0,   // Green at top (0°)
    32,  // Red
    15,  // Black  
    19,  // Red
    4,   // Black
    21,  // Red
    2,   // Black
    25,  // Red
    17,  // Black
    34,  // Red
    6,   // Black
    27,  // Red
    13,  // Black
    36,  // Red
    11,  // Black
    30,  // Red
    8,   // Black
    23,  // Red
    10,  // Black
    5,   // Red
    24,  // Black
    16,  // Red
    33,  // Black
    1,   // Red
    20,  // Black
    14,  // Red
    31,  // Black
    9,   // Red
    22,  // Black
    18,  // Red
    29,  // Black
    7,   // Red
    28,  // Black
    12,  // Red
    35,  // Black
    3,   // Red
    26   // Black
  ];

  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];

  // DOM elements
  const balanceElement = document.getElementById('balance');
  const currentBetElement = document.getElementById('current-bet');
  const spinBtn = document.getElementById('spin-btn');
  const increaseBetBtn = document.getElementById('increase-bet');
  const decreaseBetBtn = document.getElementById('decrease-bet');
  const winMessage = document.getElementById('win-message');
  const rouletteWheel = document.getElementById('roulette-wheel');
  const wheelNumbersContainer = document.getElementById('wheel-numbers');
  const wheelSeparatorsContainer = document.getElementById('wheel-separators');
  const numberButtons = document.querySelectorAll('.number-btn');

  // Sound elements
  const spinSound = document.getElementById('spin-sound');
  const winSound = document.getElementById('win-sound');
  const loseSound = document.getElementById('lose-sound');

  // Create wheel separators
  function createWheelSeparators() {
    wheelSeparatorsContainer.innerHTML = '';
    const segmentAngle = 360 / wheelNumbers.length;

    for (let i = 0; i < wheelNumbers.length; i++) {
      const separator = document.createElement('div');
      separator.className = 'wheel-separator';
      separator.style.transform = `rotate(${i * segmentAngle}deg)`;
      wheelSeparatorsContainer.appendChild(separator);
    }
  }

  // Create wheel numbers
  function createWheelNumbers() {
    wheelNumbersContainer.innerHTML = '';
    const segmentAngle = 360 / wheelNumbers.length;
    const radius = (Math.min(rouletteWheel.clientWidth, rouletteWheel.clientHeight) / 2) - 20;

    wheelNumbers.forEach((num, i) => {
      const numberElement = document.createElement('div');
      numberElement.className = 'wheel-number';
      numberElement.textContent = num;

      // Calculate position - center of each segment
      const angleDeg = (i * segmentAngle) + (segmentAngle / 2) - 90; // -90 to start from top
      const angleRad = (angleDeg * Math.PI) / 180;
      const x = radius * Math.cos(angleRad);
      const y = radius * Math.sin(angleRad);

      numberElement.style.left = `calc(50% + ${x}px - 12px)`;
      numberElement.style.top = `calc(50% + ${y}px - 12px)`;

      wheelNumbersContainer.appendChild(numberElement);
    });
  }

  // PERFECT pointer calculation
  function getPointerNumber(rotation) {
    const segmentAngle = 360 / wheelNumbers.length;

    // Normalize rotation to 0-360 range
    const normalizedRotation = ((rotation % 360) + 360) % 360;

    // The pointer is at 0 degrees (top of wheel)
    // Find which segment the pointer is in
    const rawSegmentIndex = Math.floor(normalizedRotation / segmentAngle);

    // Since the wheel spins clockwise but our array goes clockwise,
    // we need to find the opposite segment that ends up under the pointer
    const adjustedIndex = (wheelNumbers.length - (rawSegmentIndex + 1)) % wheelNumbers.length;
    return wheelNumbers[adjustedIndex];
  }

  // Update UI functions
  function updateBalance() {
    balanceElement.textContent = balance;
    localStorage.setItem('casinoBalance', balance);
  }

  function updateBet() {
    currentBetElement.textContent = currentBet;
  }

  function updateButtons() {
    decreaseBetBtn.disabled = currentBet <= 100;
    increaseBetBtn.disabled = currentBet >= Math.min(1000, balance);
    spinBtn.disabled = balance < currentBet || isSpinning || selectedNumber === null;
  }

  function changeBet(delta) {
    const newBet = currentBet + delta;
    if (newBet >= 100 && newBet <= 1000 && newBet <= balance) {
      currentBet = newBet;
      updateBet();
      updateButtons();
    }
  }

  function selectNumber(number) {
    numberButtons.forEach(btn => btn.classList.remove('selected'));
    const selectedBtn = document.querySelector(`.number-btn[data-number="${number}"]`);
    if (selectedBtn) {
      selectedBtn.classList.add('selected');
    }
    selectedNumber = number;
    updateButtons();
  }

  // Spin mechanics
  function startSpin() {
    if (isSpinning || balance < currentBet || selectedNumber === null) return;

    isSpinning = true;
    balance -= currentBet;
    updateBalance();
    updateButtons();
    
    winMessage.classList.remove('show', 'lose');
    spinBtn.textContent = 'SPINNING...';

    if (spinSound) {
      try {
        spinSound.currentTime = 0;
        spinSound.play();
      } catch(e) {}
    }

    // Calculate spin: 5-8 full rotations + random final position
    const baseRotations = 5 + Math.random() * 3;
    const finalAngle = Math.random() * 360;
    const spinAmount = baseRotations * 360 + finalAngle;

    totalRotation += spinAmount;
    rouletteWheel.style.transform = `rotate(${totalRotation}deg)`;

    setTimeout(() => {
      const winningNumber = getPointerNumber(totalRotation);
      finishRound(winningNumber);
    }, 4000);
  }

  function finishRound(winningNumber) {
    isSpinning = false;
    spinBtn.textContent = 'SPIN';
    updateButtons();

    if (spinSound) {
      spinSound.pause();
      spinSound.currentTime = 0;
    }

    if (winningNumber === selectedNumber) {
      const winAmount = currentBet * 36;
      balance += winAmount;
      updateBalance();
      showWinMessage(winAmount, winningNumber);
      
      if (winSound) {
        try {
          winSound.currentTime = 0;
          winSound.play();
        } catch(e) {}
      }
      
      celebrate(winningNumber);
    } else {
      showLoseMessage(winningNumber);
      
      if (loseSound) {
        try {
          loseSound.currentTime = 0;
          loseSound.play();
        } catch(e) {}
      }
      
      // Check if player is out of money
      if (balance < 100) {
        setTimeout(() => {
          showResetMessage();
          balance = 1000;
          updateBalance();
          updateButtons();
        }, 5000);
      }
    }
  }

  // Result messages
  function showWinMessage(amount, winningNumber) {
    winMessage.innerHTML = `
      <div style="font-size:1.8rem;margin-bottom:1rem;">🎉 WINNER! 🎉</div>
      <div style="font-size:1.3rem;margin:1rem 0;line-height:1.4;">
        <div>Ball landed on <strong>${winningNumber}</strong> (${getNumberColorName(winningNumber)})</div>
        <div style="color:#aaa;font-size:1rem;">Your bet: <strong>${selectedNumber}</strong> (${getNumberColorName(selectedNumber)})</div>
      </div>
      <div style="font-size:2rem;color:#ffd700;margin:1rem 0;">You won $${amount}!</div>
      <div style="font-size:1rem;color:#aaa;margin-top:1rem;">35:1 payout - congratulations!</div>
    `;
    winMessage.classList.add('show');
    winMessage.classList.remove('lose');
    
    setTimeout(() => winMessage.classList.remove('show'), 5000);
  }

  function showLoseMessage(winningNumber) {
    winMessage.innerHTML = `
      <div style="font-size:1.6rem;margin-bottom:1rem;">😔 Not This Time</div>
      <div style="font-size:1.3rem;margin:1rem 0;line-height:1.4;">
        <div>Ball landed on <strong>${winningNumber}</strong> (${getNumberColorName(winningNumber)})</div>
        <div style="color:#aaa;font-size:1rem;">Your bet: <strong>${selectedNumber}</strong> (${getNumberColorName(selectedNumber)})</div>
      </div>
      <div style="font-size:1.2rem;color:#ff6b6b;margin:1rem 0;">You lost $${currentBet}</div>
      <div style="font-size:1rem;color:#aaa;margin-top:1rem;">Better luck next spin!</div>
    `;
    winMessage.classList.add('show', 'lose');
    
    setTimeout(() => winMessage.classList.remove('show', 'lose'), 4000);
  }

  function showResetMessage() {
    winMessage.innerHTML = `
      <div class="prize-label">💰 Balance Reset!</div>
      <div style="font-size: 1rem; margin-top: 0.5rem; color: #66ff66;">Your balance has been reset to $1000!</div>
    `;
    winMessage.classList.add('show');
    winMessage.classList.remove('lose');
    
    setTimeout(() => {
      winMessage.classList.remove('show');
    }, 4000);
  }

  function getNumberColorName(number) {
    if (number === 0) return 'Green';
    return redNumbers.includes(number) ? 'Red' : 'Black';
  }

  // Celebration effects
  function celebrate(number) {
    const container = document.querySelector('.roulette-game');
    const particleCount = number === 0 ? 30 : 20;
    const colors = number === 0 ? ['#07ac3e', '#ffd700', '#ffffff'] : ['#ffd700', '#ffffff'];
    
    colors.forEach((color, index) => {
      setTimeout(() => createParticles(particleCount / colors.length, color, container), index * 200);
    });
  }

  function createParticles(count, color, container) {
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.style.cssText = `
        position: absolute;
        width: ${4 + Math.random() * 8}px;
        height: ${4 + Math.random() * 8}px;
        background-color: ${color};
        border-radius: 50%;
        left: ${50 + (Math.random() - 0.5) * 60}%;
        top: 40%;
        opacity: 0;
        transform: translate(-50%, -50%) scale(0);
        box-shadow: 0 0 15px ${color};
        transition: all ${1 + Math.random() * 2}s ease-out;
        z-index: 1000;
        pointer-events: none;
      `;
      container.appendChild(particle);

      setTimeout(() => {
        particle.style.opacity = '1';
        particle.style.transform = `translate(${(Math.random() - 0.5) * 400}px, ${(Math.random() - 0.5) * 400 - 200}px) scale(${0.5 + Math.random()})`;
      }, Math.random() * 100);

      setTimeout(() => {
        particle.style.opacity = '0';
        particle.style.transform += ' scale(0)';
        setTimeout(() => {
          if (container.contains(particle)) {
            container.removeChild(particle);
          }
        }, 1000);
      }, 1500 + Math.random() * 1000);
    }
  }

  // Initialize game
  function init() {
    createWheelSeparators();
    createWheelNumbers();
    updateBalance();
    updateBet();
    updateButtons();

    spinBtn.addEventListener('click', startSpin);
    increaseBetBtn.addEventListener('click', () => changeBet(100));
    decreaseBetBtn.addEventListener('click', () => changeBet(-100));
    
    numberButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const number = parseInt(btn.dataset.number, 10);
        selectNumber(number);
      });
    });
  }

  init();
});