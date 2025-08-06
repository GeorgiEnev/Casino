document.addEventListener('DOMContentLoaded', () => {
  // Game state - no localStorage usage
  let balance = parseInt(localStorage.getItem('casinoBalance')) || 1000;;;
  let currentBet = 100;
  let isSpinning = false;
  let jackpotAmount = 10000; // Progressive jackpot
  let jackpotIncrement = 0.02; // Small percentage that goes to jackpot
  
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
  const loseSound = document.getElementById('lose-sound');

  const SYMBOL_COUNT = 50;

  // Simplified symbol set with heavy bias toward losing combinations
  const symbols = ['7', '🍒', '🍋', '🍊', '🍇', '🔔', '💎', '💰', '⭐', '🎰', '❌', '💸'];
  const symbolWeights = {
    '7': 1,        // Ultra rare jackpot
    '💰': 2,       // Rare big win
    '🍒': 3,       // Small win
    '💎': 4,       // Medium win
    '🍊': 15,      // Common losing symbol
    '🍋': 15,      // Common losing symbol
    '🍇': 15,      // Common losing symbol
    '🔔': 15,      // Common losing symbol
    '⭐': 15,      // Common losing symbol
    '🎰': 15,      // Common losing symbol
    '❌': 25,      // Very common losing symbol
    '💸': 25       // Very common losing symbol
  };
  
  // ONLY 4 WINNING COMBINATIONS
  const payouts = {
    // Only these 4 combinations win - everything else loses
    'match3_7': 50,       // Three 7s - JACKPOT + progressive
    'match3_💰': 8,       // Three money bags - big win
    'match3_💎': 3,       // Three diamonds - medium win
    'match3_🍒': 1.5      // Three cherries - small win
  };
  
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
  
  // Create simplified payout table
  function createPayoutTable() {
    const payoutTable = document.createElement('div');
    payoutTable.className = 'payout-table';
    payoutTable.innerHTML = `
      <h3>Payout Table</h3>
      <table>
        <tr><th>Combination</th><th>Payout</th></tr>
        <tr><td>3 × 7️⃣</td><td>50x + JACKPOT!</td></tr>
        <tr><td>3 × 💰</td><td>8x</td></tr>
        <tr><td>3 × 💎</td><td>3x</td></tr>
        <tr><td>3 × 🍒</td><td>1.5x</td></tr>
      </table>
      <p style="font-size: 0.8rem; color: #888; text-align: center; margin-top: 1rem;">
        *All other combinations result in a loss - House Edge applies
      </p>
    `;
    document.querySelector('.slot-container').appendChild(payoutTable);
  }

  // Create initial reel symbols with heavy losing bias
  function createReels() {
    reels.forEach((reel, reelIndex) => {
      reel.innerHTML = '';
      reel.dataset.symbols = '';
      
      const reelSymbols = [];
      for (let i = 0; i < SYMBOL_COUNT; i++) {
        reelSymbols.push(getWeightedRandomSymbol());
      }
      
      reel.dataset.symbols = JSON.stringify(reelSymbols);
      
      reelSymbols.forEach((symbolText, i) => {
        const symbol = document.createElement('div');
        symbol.className = 'symbol';
        symbol.setAttribute('data-symbol', symbolText);
        symbol.textContent = symbolText;
        reel.appendChild(symbol);
      });
      
      const initialPosition = Math.floor(SYMBOL_COUNT / 2);
      reel.style.transform = `translateY(-${100 * initialPosition}px)`;
      reel.dataset.currentPosition = initialPosition.toString();
    });
  }
  
  // Get weighted random symbol with heavy house edge
  function getWeightedRandomSymbol() {
    const weightedSymbols = [];
    for (const symbol in symbolWeights) {
      for (let i = 0; i < symbolWeights[symbol]; i++) {
        weightedSymbols.push(symbol);
      }
    }
    return weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
  }
  
  // Update balance display
  function updateBalance() {
    balanceElement.textContent = balance;
    localStorage.setItem('casinoBalance', balance);
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
  
  // Main spin function with heavy losing mechanics
  function spin() {
    if (isSpinning || balance < currentBet) return;

    isSpinning = true;
    balance -= currentBet;
    jackpotAmount += currentBet * jackpotIncrement;
    updateBalance();
    updateButtons();
    winMessage.classList.remove('show', 'lose');
    spinBtn.textContent = 'SPINNING...';

    const finalPositions = [];
    const spinPromises = [];
    const baseDuration = 2000;
    const extraDuration = 800;

    // Play rolling sound
    if (rollSound) {
      rollSound.currentTime = 0;
      rollSound.play().catch(() => {}); // Handle audio errors gracefully
    }

    reels.forEach((reel, index) => {
      const promise = new Promise((resolve) => {
        const spinDuration = baseDuration + (index * extraDuration) + (Math.random() * 500);
        
        // Generate symbols with heavy house edge bias (85% chance of losing combinations)
        const newSymbols = generateReelWithHouseEdge();
        
        const finalPos = 5 + Math.floor(Math.random() * (SYMBOL_COUNT - 10));
        finalPositions[index] = finalPos;
        
        reel.dataset.symbols = JSON.stringify(newSymbols);
        
        const startTime = Date.now();
        let currentPos = parseInt(reel.dataset.currentPosition) || Math.floor(SYMBOL_COUNT / 2);
        const totalSpins = 20 + Math.random() * 15;
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
            reel.style.transform = `translateY(-${100 * finalPos}px)`;
            reel.dataset.currentPosition = finalPos.toString();
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
        const allVisibleSymbols = [];
        
        reels.forEach((reel, reelIndex) => {
          const symbols = JSON.parse(reel.dataset.symbols);
          const position = positions[reelIndex];
          
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
      
      if (rollSound) {
        rollSound.pause();
        rollSound.currentTime = 0;
      }
    });
  }

  // Generate reel symbols with controlled winning chances
  function generateReelWithHouseEdge() {
    const symbols = [];
    for (let i = 0; i < SYMBOL_COUNT; i++) {
      // 70% chance of losing symbols, 30% chance of potentially winning symbols
      if (Math.random() < 0.7) {
        const loseSymbols = ['❌', '💸', '🍊', '🍋', '🍇', '🔔', '⭐', '🎰'];
        symbols.push(loseSymbols[Math.floor(Math.random() * loseSymbols.length)]);
      } else {
        // 30% chance of potentially winning symbol
        // Ensure winning symbols appear with reasonable frequency
        const winChance = Math.random();
        if (winChance < 0.15) {
          symbols.push('🍒'); // Most common winner - small prize
        } else if (winChance < 0.08) {
          symbols.push('💎'); // Medium prize
        } else if (winChance < 0.03) {
          symbols.push('💰'); // Big prize
        } else if (winChance < 0.005) {
          symbols.push('7');   // Jackpot - very rare
        } else {
          // Fill remaining with losing symbols
          const loseSymbols = ['❌', '💸', '🍊', '🍋', '🍇', '🔔', '⭐', '🎰'];
          symbols.push(loseSymbols[Math.floor(Math.random() * loseSymbols.length)]);
        }
      }
    }
    return symbols;
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

  // STRICT WIN CHECKING - only 4 combinations win, but with near-miss detection
  function checkWin(visibleSymbols) {
    if (visibleSymbols.length !== 6) {
      console.error('Expected 6 symbols, got:', visibleSymbols.length);
      return;
    }
    
    console.log('Checking win for symbols:', visibleSymbols);
    
    let winAmount = 0;
    let winType = '';
    let isJackpot = false;
    let multiplier = 0;
    let isNearMiss = false;

    // Count symbol frequencies
    const symbolCounts = {};
    visibleSymbols.forEach(symbol => {
      symbolCounts[symbol] = (symbolCounts[symbol] || 0) + 1;
    });

    console.log('Symbol counts:', symbolCounts);

    // ONLY CHECK FOR THE 4 WINNING COMBINATIONS
    const winningSymbols = ['7', '💰', '💎', '🍒'];
    
    for (const symbol of winningSymbols) {
      if (symbolCounts[symbol] >= 3) {
        const payoutKey = `match3_${symbol}`;
        if (payouts[payoutKey]) {
          multiplier = payouts[payoutKey];
          winAmount = currentBet * multiplier;
          winType = `Three ${getSymbolName(symbol)}s`;
          
          if (symbol === '7') {
            isJackpot = true;
            winType = 'MEGA JACKPOT';
            winAmount += jackpotAmount;
            jackpotAmount = 10000; // Reset jackpot
          }
          
          console.log(`Found 3+ ${symbol}:`, winType, winAmount);
          break;
        }
      }
      // Check for near miss (2 matching winning symbols)
      else if (symbolCounts[symbol] === 2) {
        isNearMiss = true;
        console.log(`Near miss with 2 ${symbol}`);
      }
    }

    // Apply win or show loss (most common outcome)
    if (winAmount > 0) {
      balance += Math.round(winAmount);
      updateBalance();
      updateButtons();
      showWinMessage(Math.round(winAmount), multiplier, isJackpot, winType);
      celebrate(multiplier, isJackpot);
      
      if (isJackpot && jackpotSound) {
        jackpotSound.currentTime = 0;
        jackpotSound.play().catch(() => {});
      }
    } else {
      console.log('No win - House wins (as expected)');
      showLoseMessage(isNearMiss);
      
      // Play lose sound
      if (loseSound) {
        loseSound.currentTime = 0;
        loseSound.play().catch(() => {});
      }
      
      // Check if player is out of money
      if (balance < 100) {
        setTimeout(() => {
          showResetMessage();
          balance = 1000;
          updateBalance();
          updateButtons();
        }, 3000);
      }
    }
  }

  // Get symbol display name
  function getSymbolName(symbol) {
    const symbolNames = {
      '7': 'Seven',
      '💰': 'Money Bag',
      '💎': 'Diamond',
      '🍒': 'Cherry'
    };
    return symbolNames[symbol] || symbol;
  }

  // Enhanced lose messages with proper variety and near-miss detection
  function showLoseMessage(isNearMiss = false) {
    let loseMessages;
    
    if (isNearMiss) {
      loseMessages = [
        { emoji: '😤', text: 'So Close!', subtitle: 'Two matching! One more next time!' },
        { emoji: '🎯', text: 'Almost There!', subtitle: 'You nearly had it!' },
        { emoji: '💫', text: 'Close Call!', subtitle: 'The win is within reach!' },
        { emoji: '🔥', text: 'Nearly Won!', subtitle: 'Keep spinning - you\'re hot!' }
      ];
    } else {
      loseMessages = [
        { emoji: '💸', text: 'House Wins', subtitle: 'Better luck next spin!' },
        { emoji: '😔', text: 'No Match', subtitle: 'Keep trying for that jackpot!' },
        { emoji: '🎰', text: 'Try Again', subtitle: 'The big win is coming!' },
        { emoji: '💔', text: 'Not This Time', subtitle: 'Fortune favors the persistent!' },
        { emoji: '🎲', text: 'Roll Again', subtitle: 'Your lucky spin awaits!' },
        { emoji: '⚡', text: 'Missed', subtitle: 'Lightning might strike twice!' },
        { emoji: '🌟', text: 'Keep Going', subtitle: 'Stars will align soon!' },
        { emoji: '🍀', text: 'No Luck', subtitle: 'Your moment is coming!' }
      ];
    }
    
    const randomMessage = loseMessages[Math.floor(Math.random() * loseMessages.length)];
    
    winMessage.innerHTML = `
      <div class="lose-label">${randomMessage.emoji} ${randomMessage.text}</div>
      <div style="font-size: 1rem; margin-top: 0.5rem; color: #ff6b6b;">${randomMessage.subtitle}</div>
      <div style="font-size: 0.8rem; margin-top: 0.3rem; color: #888;">Current Jackpot: ${jackpotAmount.toLocaleString()}</div>
    `;
    winMessage.classList.add('show', 'lose');
    
    setTimeout(() => {
      winMessage.classList.remove('show', 'lose');
    }, isNearMiss ? 3500 : 3000);
  }

  // Show balance reset message
  function showResetMessage() {
    winMessage.innerHTML = `
      <div class="prize-label">💰 Fresh Start!</div>
      <div style="font-size: 1rem; margin-top: 0.5rem; color: #66ff66;">Your balance has been reset to $1000!</div>
      <div style="font-size: 0.9rem; margin-top: 0.3rem; color: #aaa;">Time to hit that jackpot!</div>
    `;
    winMessage.classList.add('show');
    winMessage.classList.remove('lose');
    
    setTimeout(() => {
      winMessage.classList.remove('show');
    }, 4000);
  }

  // Show win message for the rare wins
  function showWinMessage(amount, multiplier, isJackpot, winType) {
    if (isJackpot) {
      winMessage.innerHTML = `
        <div class="jackpot-label">🎉 ${winType} 🎉</div>
        <div class="prize-label">JACKPOT: $${amount.toLocaleString()}!</div>
        <div style="font-size: 1rem; margin-top: 0.5rem; color: #ffd700;">You hit the ultimate prize!</div>
        <div style="font-size: 0.9rem; margin-top: 0.3rem; color: #aaa;">Incredible luck!</div>
      `;
    } else if (multiplier >= 5) {
      winMessage.innerHTML = `
        <div class="jackpot-label">🎊 ${winType} 🎊</div>
        <div class="prize-label">Big Win: $${amount}!</div>
        <div style="font-size: 1rem; margin-top: 0.5rem; color: #ffd700;">${multiplier}x multiplier!</div>
      `;
    } else {
      winMessage.innerHTML = `
        <div class="prize-label">🎊 ${winType} 🎊</div>
        <div style="font-size: 1.5rem; margin-top: 0.5rem; color: #66ff66;">+$${amount}</div>
        <div style="font-size: 1rem; margin-top: 0.3rem; color: #aaa;">${multiplier}x your bet!</div>
      `;
    }
    
    winMessage.classList.add('show');

    setTimeout(() => {
      winMessage.classList.remove('show');
    }, isJackpot ? 8000 : multiplier >= 5 ? 6000 : 4000);
  }
  
  // Celebration effects based on win amount
  function celebrate(multiplier, isJackpot) {
    if (isJackpot) {
      // Massive celebration for jackpot
      createParticles(200, '#ff6b6b');
      createParticles(150, '#ffd700');
      setTimeout(() => createParticles(100, '#66ff66'), 200);
      createConfetti();
    } else if (multiplier >= 5) {
      // Good win celebration
      createParticles(60, '#ffd700');
      createParticles(40, '#66ff66');
    } else {
      // Small win celebration
      createParticles(30, '#66ff66');
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
  
  // Create confetti effect for jackpot
  function createConfetti() {
    const container = document.querySelector('.slot-machine');
    const colors = ['#ff6b6b', '#ffd700', '#66ff66', '#66ccff', '#aa66ff', '#ffffff'];
    
    for (let i = 0; i < 200; i++) {
      const confetti = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 6 + Math.random() * 12;
      
      confetti.style.position = 'absolute';
      confetti.style.width = `${size}px`;
      confetti.style.height = `${size * 0.6}px`;
      confetti.style.backgroundColor = color;
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.top = '-20px';
      confetti.style.opacity = '0';
      confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
      confetti.style.boxShadow = `0 0 8px ${color}`;
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
      }, 6000);
    }
  }
  
  // Initialize the game when page loads
  init();
});