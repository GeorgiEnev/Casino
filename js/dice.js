document.addEventListener('DOMContentLoaded', () => {
  // Game state
  let balance = parseInt(localStorage.getItem('casinoBalance'), 10) || 1000;
  let currentBet = 100;
  let selectedNumber = null;
  let isRolling = false;
  
  // DOM elements
  const balanceElement = document.getElementById('balance');
  const currentBetElement = document.getElementById('current-bet');
  const rollBtn = document.getElementById('roll-btn');
  const increaseBetBtn = document.getElementById('increase-bet');
  const decreaseBetBtn = document.getElementById('decrease-bet');
  const winMessage = document.getElementById('win-message');
  const dice = document.getElementById('dice');
  const numberButtons = document.querySelectorAll('.number-btn');
  
  // Sound elements
  const rollSound = document.getElementById('roll-sound');
  const winSound = document.getElementById('win-sound');
  const loseSound = document.getElementById('lose-sound');

  // Dice rolling mechanics from source code
  const randomDice = () => {
    const random = Math.floor(Math.random() * 6) + 1; // Generate 1-6 directly
    rollDice(random);
  }

  const rollDice = (random) => {
    dice.style.animation = 'rolling 1.5s ease-out';
    
    setTimeout(() => {
      // Use the exact transformations from the working source code
      switch (random) {
        case 1:
          dice.style.transform = 'rotateX(0deg) rotateY(0deg)';
          break;
        case 6:
          dice.style.transform = 'rotateX(180deg) rotateY(0deg)';
          break;
        case 2:
          dice.style.transform = 'rotateX(90deg) rotateY(0deg)';
          break;
        case 5:
          dice.style.transform = 'rotateX(-90deg) rotateY(0deg)';
          break;
        case 3:
          dice.style.transform = 'rotateX(0deg) rotateY(90deg)';
          break;
        case 4:
          dice.style.transform = 'rotateX(0deg) rotateY(-90deg)';
          break;
        default:
          break;
      }
      dice.style.animation = 'none';
      
      // Check win/lose after dice settles
      setTimeout(() => {
        checkWin(random);
        isRolling = false;
        rollBtn.textContent = 'ROLL';
        updateButtons();
        
        // Stop rolling sound
        if (rollSound) {
          rollSound.pause();
          rollSound.currentTime = 0;
        }
      }, 500);
      
    }, 1550); // Slightly longer than animation duration
  }

  // Initialize game
  function init() {
    updateBalance();
    updateBet();
    updateButtons();
    
    // Initialize dice to show 1
    dice.style.transform = 'rotateX(0deg) rotateY(0deg)';
    
    // Event listeners
    rollBtn.addEventListener('click', startRoll);
    increaseBetBtn.addEventListener('click', () => changeBet(100));
    decreaseBetBtn.addEventListener('click', () => changeBet(1000));
    
    numberButtons.forEach(btn => {
      btn.addEventListener('click', () => selectNumber(parseInt(btn.dataset.number)));
    });
  }
  
  // Update balance display - removed localStorage save
  function updateBalance() {
    balanceElement.textContent = balance;
    localStorage.setItem('casinoBalance', balance.toString());
  }
  
  // Update bet display
  function updateBet() {
    currentBetElement.textContent = currentBet;
  }
  
  // Update button states based on game conditions
  function updateButtons() {
    decreaseBetBtn.disabled = currentBet <= 100;
    increaseBetBtn.disabled = currentBet >= Math.min(1000, balance);
    rollBtn.disabled = balance < currentBet || isRolling || selectedNumber === null;
  }
  
  // Change bet amount with validation
  function changeBet(amount) {
    const newBet = currentBet + amount;
    if (newBet >= 100 && newBet <= 1000 && newBet <= balance) {
      currentBet = newBet;
      updateBet();
      updateButtons();
    }
  }
  
  // Select a number to bet on
  function selectNumber(number) {
    // Deselect all buttons first
    numberButtons.forEach(btn => {
      btn.classList.remove('selected');
    });
    
    // Select the clicked button
    const selectedBtn = document.querySelector(`.number-btn[data-number="${number}"]`);
    selectedBtn.classList.add('selected');
    
    selectedNumber = number;
    updateButtons();
  }
  
  // Start the roll process
  function startRoll() {
    if (isRolling || balance < currentBet || selectedNumber === null) return;

    isRolling = true;
    balance -= currentBet;
    updateBalance();
    updateButtons();
    winMessage.classList.remove('show', 'lose');
    rollBtn.textContent = 'ROLLING...';

    // Play rolling sound
    if (rollSound) {
      rollSound.currentTime = 0;
      rollSound.play();
    }

    // Start the dice rolling
    randomDice();
  }
  
  // Check if the player won - FIXED payout calculation
  function checkWin(result) {
    if (result === selectedNumber) {
      // Fixed: Fair payout system - 6x multiplier for 1/6 chance
      const winAmount = currentBet * 6;
      balance += winAmount;
      updateBalance();
      showWinMessage(winAmount, result);
      
      if (winSound) {
        winSound.currentTime = 0;
        winSound.play();
      }
      
      celebrate(result);
    } else {
      showLoseMessage(result);
      
      if (loseSound) {
        loseSound.currentTime = 0;
        loseSound.play();
      }
    }
  }
  
  // Show win message - FIXED to show both numbers
  function showWinMessage(amount, rolledNumber) {
    winMessage.innerHTML = `
      <div class="prize-label">🎊 You won $${amount}! 🎊</div>
      <div style="font-size: 1rem; margin-top: 0.5rem; color: #aaa;">
        Rolled ${rolledNumber}, guessed ${selectedNumber} - 6x payout!
      </div>
    `;
    winMessage.classList.add('show');
    winMessage.classList.remove('lose');

    setTimeout(() => {
      winMessage.classList.remove('show');
    }, 3000);
  }
  
  // Show lose message - FIXED to show both numbers
  function showLoseMessage(rolledNumber) {
    winMessage.innerHTML = `
      <div class="lose-label">😔 No Match</div>
      <div style="font-size: 1rem; margin-top: 0.5rem; color: #ff6b6b;">
        Rolled ${rolledNumber}, guessed ${selectedNumber}. Better luck next roll!
      </div>
    `;
    winMessage.classList.add('show', 'lose');
    
    setTimeout(() => {
      winMessage.classList.remove('show', 'lose');
    }, 2000);
  }
  
  // Celebration effects based on win amount
  function celebrate(multiplier) {
    createParticles(multiplier * 2, '#ffd700');
    
    if (multiplier >= 5) {
      setTimeout(() => createParticles(10, '#ffffff'), 200);
    }
    
    if (multiplier >= 6) {
      setTimeout(() => createParticles(15, '#ff6b6b'), 400);
    }
  }
  
  // Create animated celebration particles
  function createParticles(count, color) {
    const container = document.querySelector('.dice-game');
    
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';
      particle.style.width = `${4 + Math.random() * 8}px`;
      particle.style.height = particle.style.width;
      particle.style.backgroundColor = color;
      particle.style.borderRadius = '50%';
      particle.style.left = `${50 + (Math.random() - 0.5) * 60}%`;
      particle.style.top = '50%';
      particle.style.opacity = '0';
      particle.style.transform = 'translate(-50%, -50%) scale(0)';
      particle.style.boxShadow = `0 0 15px ${color}`;
      particle.style.transition = `all ${1 + Math.random() * 2}s ease-out`;
      particle.style.zIndex = '1000';
      
      container.appendChild(particle);
      
      setTimeout(() => {
        particle.style.opacity = '1';
        particle.style.transform = `translate(${
          (Math.random() - 0.5) * 300
        }px, ${
          (Math.random() - 0.5) * 300 - 150
        }px) scale(${0.5 + Math.random()})`;
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
  
  // Initialize the game when page loads
  init();
});