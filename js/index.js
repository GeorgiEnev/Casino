document.addEventListener('DOMContentLoaded', () => {
  // Create falling chips
  const curtain = document.querySelector('.curtain');
  function spawnChip() {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.style.left = Math.random() * 100 + 'vw';
    const size = 12 + Math.random() * 16;
    chip.style.width = chip.style.height = size + 'px';
    chip.style.animationDuration = (4 + Math.random() * 4) + 's';
    curtain.appendChild(chip);
    setTimeout(() => curtain.removeChild(chip), 9000);
  }
  setInterval(spawnChip, 400 + Math.random() * 400);

  // Animate jackpot counter
  const jackpotElement = document.querySelector('.jackpot-amount .counter');
  if (jackpotElement) {
    let currentValue = 1234567;
    setInterval(() => {
      const increment = Math.floor(Math.random() * 100) + 1;
      currentValue += increment;
      jackpotElement.textContent = currentValue.toLocaleString();
    }, 2000);
  }

  // Add ripple effect to game cards
  const gameCards = document.querySelectorAll('.game-card');
  gameCards.forEach(card => {
    card.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 1000);
    });
  });

  // Animate social icons on hover
  const socialIcons = document.querySelectorAll('.social-icon');
  socialIcons.forEach(icon => {
    icon.addEventListener('mouseenter', () => {
      icon.style.transform = 'translateY(-5px)';
    });
    icon.addEventListener('mouseleave', () => {
      icon.style.transform = 'translateY(0)';
    });
  });
});