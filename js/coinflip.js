document.addEventListener('DOMContentLoaded', () => {
  // Game state
  let balance = parseInt(localStorage.getItem('casinoBalance')) || 1000;
  let currentBet = 100;
  let selectedChoice = null;
  let isFlipping = false;
  
  // DOM elements
  const balanceElement = document.getElementById('balance');
  const currentBetElement = document.getElementById('current-bet');
  const flipBtn = document.getElementById('flip-btn');
  const increaseBetBtn = document.getElementById('increase-bet');
  const decreaseBetBtn = document.getElementById('decrease-bet');
  const winMessage = document.getElementById('win-message');
  const headsBtn = document.getElementById('headsBtn');
  const tailsBtn = document.getElementById('tailsBtn');
  const coinEl = document.getElementById('coin');

  // Initialize game
  function init() {
    updateBalance();
    updateBet();
    updateButtons();
    
    // Event listeners
    flipBtn.addEventListener('click', flipCoin);
    increaseBetBtn.addEventListener('click', () => changeBet(50));
    decreaseBetBtn.addEventListener('click', () => changeBet(-50));
    headsBtn.addEventListener('click', () => selectChoice('heads'));
    tailsBtn.addEventListener('click', () => selectChoice('tails'));
  }
  
  // Update balance display and save to localStorage
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
    flipBtn.disabled = !selectedChoice || balance < currentBet || isFlipping;
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
  
  // Select choice (heads or tails)
  function selectChoice(choice) {
    selectedChoice = choice;
    
    // Update button states
    headsBtn.classList.toggle('selected', choice === 'heads');
    tailsBtn.classList.toggle('selected', choice === 'tails');
    
    updateButtons();
  }
  
  // Main flip function
  async function flipCoin() {
    if (isFlipping || !selectedChoice || balance < currentBet) return;

    const coinflipSound = document.getElementById('coinflip-sound');
    coinflipSound.currentTime = 0;
    coinflipSound.play();

    isFlipping = true;
    balance -= currentBet;
    updateBalance();
    updateButtons();
    winMessage.classList.remove('show', 'lose');
    flipBtn.textContent = 'FLIPPING...';

    // Remove any existing animation classes
    coinEl.classList.remove('flipping', 'result-heads', 'result-tails');
    
    // Start flip animation
    coinEl.classList.add('flipping');
    
    // Determine result (slightly favoring house - 48% player win rate)
    const playerWins = Math.random() < 0.48;
    const result = playerWins ? selectedChoice : (selectedChoice === 'heads' ? 'tails' : 'heads');
    
    // Wait for animation to complete
    await delay(3000);
    
    // Set final coin position
    coinEl.classList.remove('flipping');
    coinEl.classList.add(result === 'heads' ? 'result-heads' : 'result-tails');
    
    // Wait a bit more for final position
    await delay(500);
    
    // Calculate result
    const won = result === selectedChoice;
    
    if (won) {
      const winAmount = currentBet * 2; // 2x payout for winning
      balance += winAmount;
      updateBalance();
      updateButtons();
      showWinMessage(winAmount, result);
      celebrate(2); // 2x multiplier for celebration
    } else {
      showLoseMessage(result);
    }
    
    // Reset for next game
    isFlipping = false;
    flipBtn.textContent = 'FLIP';
    updateButtons();
    
    // Check if player is out of money
    if (balance < 100) {
      setTimeout(() => {
        showWinMessage(1000, null, true); // Reset balance message
        balance = 1000;
        updateBalance();
        updateButtons();
      }, 3000);
    }
  }
  
  // Show lose message
  function showLoseMessage(result) {
    winMessage.innerHTML = `
      <div class="lose-label">😔 ${result.toUpperCase()}</div>
      <div style="font-size: 1rem; margin-top: 0.5rem; color: #ff6b6b;">You lost $${currentBet}!</div>
    `;
    winMessage.classList.add('show', 'lose');
    
    setTimeout(() => {
      winMessage.classList.remove('show', 'lose');
    }, 3000);
  }

  // Show win message
  function showWinMessage(amount, result, isReset = false) {
    if (isReset) {
      winMessage.innerHTML = `
        <div class="prize-label">💰 Balance Reset!</div>
        <div style="font-size: 1rem; margin-top: 0.5rem; color: #66ff66;">Your balance has been reset to $1000!</div>
      `;
    } else {
      winMessage.innerHTML = `
        <div class="prize-label">🎊 ${result.toUpperCase()}! 🎊</div>
        <div style="font-size: 1.3rem; margin-top: 0.5rem; color: #66ff66;">You won $${amount}!</div>
      `;
    }
    
    winMessage.classList.add('show');

    setTimeout(() => {
      winMessage.classList.remove('show');
    }, isReset ? 4000 : 3000);
  }
  
  // Enhanced celebration effects based on win
  function celebrate(multiplier) {
    if (multiplier >= 2) {
      createParticles(30, '#ffd700');
      createParticles(20, '#66ff66');
    }
  }
  
  // Create animated celebration particles
  function createParticles(count, color) {
    const container = document.querySelector('.coinflip-machine');
    
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
  
  // Delay utility function
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Initialize the game when page loads
  init();
});