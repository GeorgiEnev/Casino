document.addEventListener('DOMContentLoaded', () => {
  // Game state
  let balance = parseInt(localStorage.getItem('casinoBalance')) || 1000;
  let currentBet = 100;
  let isSpinning = false;
  let jackpotAmount = 5000; // Progressive jackpot
  let jackpotIncrement = 0.1; // Percentage of each bet that goes to jackpot
  
  // DOM elements
  const balanceElement = document.getElementById('balance');
  const currentBetElement = document.getElementById('current-bet');
  const spinBtn = document.getElementById('spin-btn');
  const increaseBetBtn = document.getElementById('increase-bet');
  const decreaseBetBtn = document.getElementById('decrease-bet');
  const winMessage = document.getElementById('win-message');
  const reels = [
    document.getElementById('reel1'),
    document.getElementById('reel2'),
    document.getElementById('reel3')
  ];
  
  // Sound elements
  const rollSound = document.getElementById('roll-sound');
  const jackpotSound = document.getElementById('jackpot-sound');

  const SYMBOL_COUNT = 50;

  // Symbol set with weighted probabilities (adjusted for better balance)
  const symbols = ['7', '🍒', '🍋', '🍊', '🍇', '🔔', '💎', '💰'];
  const symbolWeights = {
    '7': 2,        // Jackpot symbol - very rare
    '💰': 3,       // Very rare
    '💎': 4,       // Rare
    '🔔': 6,       // Uncommon
    '🍇': 10,      // Common
    '🍊': 12,      // Common
    '🍋': 15,      // Very common
    '🍒': 18       // Most common
  };
  
  // EXACT PAYOUTS matching the payout table
  const payouts = {
    // Three matching symbols (any position across all 6 visible symbols)
    'match3_7': 50,       // Three 7s - JACKPOT + progressive
    'match3_💰': 25,      // Three money bags
    'match3_💎': 15,      // Three diamonds
    'match3_🔔': 10,      // Three bells
    'match3_🍇': 7,       // Three grapes
    'match3_🍊': 5,       // Three oranges
    'match3_🍋': 3,       // Three lemons
    'match3_🍒': 2,       // Three cherries
    
    // Two matching symbols (any position across all 6 visible symbols)
    'match2_7': 10,       // Two 7s
    'match2_💰': 5,       // Two money bags
    'match2_💎': 3,       // Two diamonds
    'match2_🔔': 2,       // Two bells
    'match2_🍒': 1.5,     // Two cherries (only these fruits give pairs)
    
    // Any three fruits (mixed) - any 3 fruit symbols total
    'fruit_mix': 1.2      // Any 3 fruits (🍒🍋🍊🍇)
  };
  
  // Fruit symbols for mix calculation
  const fruitSymbols = ['🍒', '🍋', '🍊', '🍇'];
  
  // Initialize game
  function init() {
    updateBalance();
    updateBet();
    createReels();
    createPayoutTable();
    updateButtons();
    
    // Event listeners
    spinBtn.addEventListener('click', spin);
    increaseBetBtn.addEventListener('click', () => changeBet(100));
    decreaseBetBtn.addEventListener('click', () => changeBet(-100));
  }
  
  // Create payout table matching actual payouts
  function createPayoutTable() {
    const payoutTable = document.createElement('div');
    payoutTable.className = 'payout-table';
    payoutTable.innerHTML = `
      <h3>Payout Table</h3>
      <table>
        <tr><th>Combination</th><th>Payout</th></tr>
        <tr><td>3 × 7️⃣</td><td>50x + Jackpot</td></tr>
        <tr><td>3 × 💰</td><td>25x</td></tr>
        <tr><td>3 × 💎</td><td>15x</td></tr>
        <tr><td>3 × 🔔</td><td>10x</td></tr>
        <tr><td>3 × 🍇</td><td>7x</td></tr>
        <tr><td>3 × 🍊</td><td>5x</td></tr>
        <tr><td>3 × 🍋</td><td>3x</td></tr>
        <tr><td>3 × 🍒</td><td>2x</td></tr>
        <tr><td>2 × 7️⃣</td><td>10x</td></tr>
        <tr><td>2 × 💰</td><td>5x</td></tr>
        <tr><td>2 × 💎</td><td>3x</td></tr>
        <tr><td>2 × 🔔</td><td>2x</td></tr>
        <tr><td>2 × 🍒</td><td>1.5x</td></tr>
        <tr><td>Any 3 Fruits</td><td>1.2x</td></tr>
      </table>
    `;
    document.querySelector('.slot-container').appendChild(payoutTable);
  }

  // Create initial reel symbols with weighted randomization
  function createReels() {
    reels.forEach((reel, reelIndex) => {
      reel.innerHTML = '';
      reel.dataset.symbols = ''; // Store symbols for reliable reading
      
      // Create symbols array for this reel
      const reelSymbols = [];
      for (let i = 0; i < SYMBOL_COUNT; i++) {
        reelSymbols.push(getWeightedRandomSymbol());
      }
      
      // Store symbols in data attribute
      reel.dataset.symbols = JSON.stringify(reelSymbols);
      
      // Create DOM elements
      reelSymbols.forEach((symbolText, i) => {
        const symbol = document.createElement('div');
        symbol.className = 'symbol';
        symbol.setAttribute('data-symbol', symbolText);
        symbol.textContent = symbolText;
        reel.appendChild(symbol);
      });
      
      // Position reel to show middle symbols initially
      const initialPosition = Math.floor(SYMBOL_COUNT / 2);
      reel.style.transform = `translateY(-${100 * initialPosition}px)`;
      reel.dataset.currentPosition = initialPosition.toString();
    });
  }
  
  // Get weighted random symbol based on probabilities
  function getWeightedRandomSymbol() {
    const weightedSymbols = [];
    for (const symbol in symbolWeights) {
      for (let i = 0; i < symbolWeights[symbol]; i++) {
        weightedSymbols.push(symbol);
      }
    }
    return weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
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
    spinBtn.disabled = balance < currentBet || isSpinning;
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
  
  // Main spin function with reliable positioning
  function spin() {
    if (isSpinning || balance < currentBet) return;

    isSpinning = true;
    balance -= currentBet;
    jackpotAmount += currentBet * jackpotIncrement;
    updateBalance();
    updateButtons();
    winMessage.classList.remove('show');
    spinBtn.textContent = 'SPINNING...';

    const finalPositions = [];
    const spinPromises = [];
    const baseDuration = 2000;
    const extraDuration = 800;

    // Play rolling sound
    if (rollSound) {
      rollSound.currentTime = 0;
      rollSound.play();
    }

    reels.forEach((reel, index) => {
      const promise = new Promise((resolve) => {
        const spinDuration = baseDuration + (index * extraDuration) + (Math.random() * 500);
        
        // Generate new symbols for this reel
        const newSymbols = [];
        for (let i = 0; i < SYMBOL_COUNT; i++) {
          newSymbols.push(getWeightedRandomSymbol());
        }
        
        // Calculate final position (random position that shows 2 symbols clearly)
        const finalPos = 5 + Math.floor(Math.random() * (SYMBOL_COUNT - 10)); // Keep away from edges
        finalPositions[index] = finalPos;
        
        // Store new symbols
        reel.dataset.symbols = JSON.stringify(newSymbols);
        
        // Start spinning animation
        const startTime = Date.now();
        let currentPos = parseInt(reel.dataset.currentPosition) || Math.floor(SYMBOL_COUNT / 2);
        const totalSpins = 20 + Math.random() * 15; // Number of full rotations
        const targetPos = finalPos + (totalSpins * SYMBOL_COUNT);
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / spinDuration, 1);
          const easedProgress = easeOutCubic(progress);
          
          const currentAnimPos = currentPos + (targetPos - currentPos) * easedProgress;
          const displayPos = currentAnimPos % SYMBOL_COUNT;
          
          reel.style.transform = `translateY(-${100 * displayPos}px)`;
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            // Ensure final position is exact
            reel.style.transform = `translateY(-${100 * finalPos}px)`;
            reel.dataset.currentPosition = finalPos.toString();
            
            // Update DOM elements to match stored symbols
            updateReelDOM(reel, newSymbols);
            
            resolve(finalPos);
          }
        };
        
        setTimeout(() => requestAnimationFrame(animate), index * 150);
      });
      
      spinPromises.push(promise);
    });

    Promise.all(spinPromises).then((positions) => {
      setTimeout(() => {
        // Get all visible symbols reliably
        const allVisibleSymbols = [];
        
        reels.forEach((reel, reelIndex) => {
          const symbols = JSON.parse(reel.dataset.symbols);
          const position = positions[reelIndex];
          
          // Get the 2 visible symbols for this reel
          const visibleSymbols = [
            symbols[position % SYMBOL_COUNT],
            symbols[(position + 1) % SYMBOL_COUNT]
          ];
          
          allVisibleSymbols.push(...visibleSymbols);
        });
        
        console.log('Final visible symbols:', allVisibleSymbols);
        checkWin(allVisibleSymbols);
        
        isSpinning = false;
        spinBtn.textContent = 'SPIN';
        updateButtons();
      }, 500);
      
      // Stop rolling sound
      if (rollSound) {
        rollSound.pause();
        rollSound.currentTime = 0;
      }
    });
  }

  // Update reel DOM to match stored symbols
  function updateReelDOM(reel, symbols) {
    const symbolElements = reel.querySelectorAll('.symbol');
    symbolElements.forEach((element, index) => {
      if (symbols[index]) {
        element.textContent = symbols[index];
        element.setAttribute('data-symbol', symbols[index]);
      }
    });
  }

  // Easing function for realistic reel stopping
  function easeOutCubic(t) {
    return (--t) * t * t + 1;
  }

  // CORRECTED WIN CHECKING - Exactly matches payout table
  function checkWin(visibleSymbols) {
    if (visibleSymbols.length !== 6) {
      console.error('Expected 6 symbols, got:', visibleSymbols.length);
      return;
    }
    
    console.log('Checking win for symbols:', visibleSymbols);
    
    let winAmount = 0;
    let winType = '';
    let isJackpot = false;
    let isProgressiveJackpot = false;
    let multiplier = 0;

    // Count all symbol frequencies
    const symbolCounts = {};
    visibleSymbols.forEach(symbol => {
      symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
    });

    console.log('Symbol counts:', symbolCounts);

    // 1. Check for 3+ matching symbols (highest priority)
    for (const symbol of ['7', '💰', '💎', '🔔', '🍇', '🍊', '🍋', '🍒']) {
      if (symbolCounts[symbol] >= 3) {
        const payoutKey = `match3_${symbol}`;
        if (payouts[payoutKey]) {
          multiplier = payouts[payoutKey];
          winAmount = currentBet * multiplier;
          winType = `Three ${getSymbolName(symbol)}s`;
          
          if (symbol === '7') {
            isProgressiveJackpot = true;
            isJackpot = true;
            winType = 'PROGRESSIVE JACKPOT';
            winAmount += jackpotAmount;
            jackpotAmount = 5000; // Reset jackpot
          } else if (['💰', '💎'].includes(symbol)) {
            isJackpot = true;
          }
          
          console.log(`Found 3+ ${symbol}:`, winType, winAmount);
          break;
        }
      }
    }

    // 2. If no three matches, check for pairs (only specific symbols)
    if (winAmount === 0) {
      for (const symbol of ['7', '💰', '💎', '🔔', '🍒']) {
        if (symbolCounts[symbol] >= 2) {
          const payoutKey = `match2_${symbol}`;
          if (payouts[payoutKey]) {
            multiplier = payouts[payoutKey];
            winAmount = currentBet * multiplier;
            winType = `Pair of ${getSymbolName(symbol)}s`;
            
            if (symbol === '7') {
              isJackpot = true;
            }
            
            console.log(`Found pair ${symbol}:`, winType, winAmount);
            break;
          }
        }
      }
    }

    // 3. If no pairs, check for fruit mix (any 3 fruits total)
    if (winAmount === 0) {
      let totalFruits = 0;
      fruitSymbols.forEach(fruit => {
        totalFruits += (symbolCounts[fruit] || 0);
      });
      
      if (totalFruits >= 3) {
        multiplier = payouts['fruit_mix'];
        winAmount = currentBet * multiplier;
        winType = 'Fruit Mix Bonus';
        console.log('Found fruit mix:', totalFruits, 'fruits, payout:', winAmount);
      }
    }

    // Apply win or show loss
    if (winAmount > 0) {
      balance += Math.round(winAmount);
      updateBalance();
      updateButtons();
      showWinMessage(Math.round(winAmount), multiplier, isJackpot, winType, isProgressiveJackpot);
      celebrate(multiplier, isProgressiveJackpot);
      
      if (isProgressiveJackpot && jackpotSound) {
        jackpotSound.currentTime = 0;
        jackpotSound.play();
      }
    } else {
      console.log('No win found');
      showLoseMessage();
    }
  }

  // Get symbol display name
  function getSymbolName(symbol) {
    const symbolNames = {
      '7': 'Seven',
      '💰': 'Money Bag',
      '💎': 'Diamond',
      '🔔': 'Bell',
      '🍇': 'Grape',
      '🍊': 'Orange',
      '🍋': 'Lemon',
      '🍒': 'Cherry'
    };
    return symbolNames[symbol] || symbol;
  }

  // Show lose message
  function showLoseMessage() {
    winMessage.innerHTML = `
      <div class="lose-label">😔 No Match</div>
      <div style="font-size: 1rem; margin-top: 0.5rem; color: #ff6b6b;">Better luck next spin!</div>
    `;
    winMessage.classList.add('show', 'lose');
    
    setTimeout(() => {
      winMessage.classList.remove('show', 'lose');
    }, 2000);
  }

  // Show enhanced win message with different styles
  function showWinMessage(amount, multiplier, isJackpot, winType, isProgressiveJackpot) {
    if (isProgressiveJackpot) {
      winMessage.innerHTML = `
        <div class="jackpot-label">🎉 ${winType} 🎉</div>
        <div class="prize-label">PROGRESSIVE JACKPOT: $${amount}!</div>
        <div style="font-size: 1rem; margin-top: 0.5rem; color: #ffd700;">You've hit the ultimate prize!</div>
      `;
    } else if (isJackpot) {
      winMessage.innerHTML = `
        <div class="jackpot-label">🎉 ${winType} 🎉</div>
        <div class="prize-label">You won $${amount}!</div>
        <div style="font-size: 1rem; margin-top: 0.5rem; color: #ffd700;">${multiplier}x multiplier!</div>
      `;
    } else {
      winMessage.innerHTML = `
        <div class="prize-label">🎊 You won $${amount}! 🎊</div>
        <div style="font-size: 1rem; margin-top: 0.5rem; color: #aaa;">${winType} (${multiplier}x)</div>
      `;
    }
    
    winMessage.classList.add('show');

    setTimeout(() => {
      winMessage.classList.remove('show');
    }, isProgressiveJackpot ? 8000 : isJackpot ? 6000 : 4000);
  }
  
  // Enhanced celebration effects based on win amount
  function celebrate(multiplier, isProgressiveJackpot) {
    if (isProgressiveJackpot) {
      createParticles(100, '#ff6b6b');
      createParticles(80, '#ffd700');
      setTimeout(() => createParticles(60, '#66ff66'), 200);
      setTimeout(() => createParticles(40, '#66ccff'), 400);
      setTimeout(() => createParticles(30, '#aa66ff'), 600);
      createConfetti();
    } else if (multiplier >= 25) {
      createParticles(50, '#ff6b6b');
      createParticles(30, '#ffd700');
      setTimeout(() => createParticles(20, '#66ff66'), 200);
    } else if (multiplier >= 10) {
      createParticles(30, '#ffd700');
      createParticles(15, '#ffffff');
    } else if (multiplier >= 5) {
      createParticles(20, '#ffd700');
    } else if (multiplier >= 2) {
      createParticles(10, '#ffffff');
    } else {
      createParticles(5, '#66ff66');
    }
  }
  
  // Create animated celebration particles
  function createParticles(count, color) {
    const container = document.querySelector('.slot-machine');
    
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
  
  // Create confetti effect for progressive jackpot
  function createConfetti() {
    const container = document.querySelector('.slot-machine');
    const colors = ['#ff6b6b', '#ffd700', '#66ff66', '#66ccff', '#aa66ff', '#ffffff'];
    
    for (let i = 0; i < 150; i++) {
      const confetti = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 6 + Math.random() * 10;
      
      confetti.style.position = 'absolute';
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size * 0.6}px`;
      confetti.style.backgroundColor = color;
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.top = '-20px';
      confetti.style.opacity = '0';
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      confetti.style.boxShadow = `0 0 5px ${color}`;
      confetti.style.zIndex = '1000';
      
      if (Math.random() > 0.5) {
        confetti.style.borderRadius = '50%';
      }
      
      container.appendChild(confetti);
      
      setTimeout(() => {
        confetti.style.opacity = '1';
        confetti.style.transition = `all ${3 + Math.random() * 2}s cubic-bezier(0.1, 0.8, 0.3, 1)`;
        confetti.style.transform = `translate(${
          (Math.random() - 0.5) * 200
        }px, ${
          500 + Math.random() * 200
        }px) rotate(${Math.random() * 720}deg)`;
      }, Math.random() * 300);
      
      setTimeout(() => {
        if (container.contains(confetti)) {
          container.removeChild(confetti);
        }
      }, 5000);
    }
  }
  
  // Initialize the game when page loads
  init();
});