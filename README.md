# 🎰 Golden Casino

A modern, browser-based virtual casino featuring five interactive mini-games:

- **🎰 Slot Machine**
- **🎲 Dice Roll**
- **🎡 Roulette**
- **🎫 Scratch-Off**
- **🪙 Coin Flip**

Built from the ground up with **vanilla HTML5**, **CSS3**, and **ES6 JavaScript**, and deployed seamlessly via **GitHub Pages**.

---

## ⚙️ Key Features

- **Unified Balance** stored across all games  
- **Progressive Jackpot** on the Slot Machine  
- **Weighted RNG** for fair, predictable payouts  
- **Animated Feedback**: particles, confetti, modal dialogs  
- **Sound Effects**: immersive audio for every action  
- **Responsive Layout**: works on desktop & mobile  

---

## 📁 Project Structure
```
Casino/
├── index.html 
├── css
│ ├── index.css # Homepage styles
│ ├── coinflip.css
│ ├── dice.css
│ ├── roulette.css
│ ├── scratch.css
│ └── slot.css
├── js
│ ├── index.js # Shared balance logic & navbar
│ ├── coinflip.js
│ ├── dice.js
│ ├── roulette.js
│ ├── scratch.js
│ └── slot.js
├── games
│ ├── coinflip.html
│ ├── dice.html
│ ├── roulette.html
│ ├── scratch.html
│ └── slot.html
├── coinflip_sounds/ # Audio assets
│ └── flip.wav
├── dice_sounds/
│ ├── roll.mp3
│ ├── win.wav
│ └── lose.wav
├── roulette_sounds/
│ ├── spin.mp3
│ ├── win.mp3
│ └── lose.mp3
├── slot_sounds/
│ ├── roll.wav
│ └── jackpot.wav
```

---

# Getting Started

### Prerequisites

- **Git** (≥2.20)  
- A modern **web browser** (Chrome, Firefox, Edge, Safari)  

### Clone & Run Locally

```bash
# 1. Clone
git clone https://github.com/GeorgiEnev/Casino.git
cd Casino

# 2. (Optional) Serve with Live Server / any static server
#    - VS Code: Install “Live Server” extension, then “Open with Live Server”
#    - Python: python3 -m http.server 8000

# 3. Open in browser
#    http://localhost:5500     (Live Server default)
#    http://localhost:8000     (Python server default)
```

# 🎮 Detailed Game Descriptions

## 🎰 Slot Machine
- Progressive Jackpot: 0.1% of each bet accumulates

- Weighted Symbols: rarities tuned for balance

- Animations: reel spin with easing, confetti + particles on big wins

- Bet Range: $100 → $1000 (increments of $100)

- Payouts: Up to 50× + jackpot

## 🎲 Dice Roll
- Pick a Number (1–6): 6× payout on correct guess

- 3D CSS Dice: realistic roll animations

- Sound FX: roll, win, lose

## 🎡 Roulette
- European Layout (0–36)

- Color Bets: red, black, green (0)

- Payouts: Single number (35×), color (2×), even/odd (2×)

- Spin Animation + Click-to-Bet UI

## 🎫 Scratch-Off
- Canvas-based Scratch effect

- Random Prizes: defined ticket costs & win tiers

- Modal popup for prize collection

## 🪙 Coin Flip
- Heads or Tails choice

- 2× payout on correct guess

- Smooth CSS flip + sound effect

## 📄 License
MIT License

Copyright (c) 2025 Georgi Enev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
