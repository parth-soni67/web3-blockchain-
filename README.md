# ⛓️ BlockChain Explorer

**A modern, fully-responsive 4-page Web3 educational website** that visually demonstrates how blocks are connected in a blockchain.  
Built with pure HTML5, CSS3, and Vanilla JavaScript — no frameworks required.

---

## 🚀 Live Pages

| Page | File | Description |
|------|------|-------------|
| Home | `index.html` | Landing page with hero section, features, and animated blockchain visual |
| Concepts | `concepts.html` | 4 comparison cards covering core Web3 concepts |
| Live Prices | `prices.html` | Real-time crypto prices via CoinGecko API |
| Block Simulator | `simulator.html` | Interactive SHA-256 mining simulator with chain integrity demo |

---

## ✅ Completed Features

### All Pages
- Sticky navigation bar with active-page highlighting
- Mobile-responsive hamburger menu
- Animated blockchain background (canvas — floating nodes + connecting lines)
- Glassmorphism cards with hover effects
- Smooth fade-in entrance animations
- Consistent footer with author info
- Dark futuristic theme (#0F172A background, blue/cyan accents)
- Semantic HTML5 with ARIA labels

### Home (index.html)
- Hero section with large headline and animated blockchain block visual
- "Explore Concepts" + "Try Simulator" CTA buttons
- 3 feature cards: Immutable Records, Decentralized Network, Secure Verification
- Stats strip (SHA-256, Immutable, P2P)
- Explore CTA section

### Concepts (concepts.html)
- 2×2 responsive grid of comparison cards
  - Web2 vs Web3
  - Ethereum vs Bitcoin
  - Public Key vs Private Key
  - Blockchain vs Traditional Database
- Each card has icon, colour-coded table, and explanatory paragraph
- Key terminology section (6 glossary cards): Mining, Hash Function, Smart Contract, NFT, DeFi, Wallet

### Live Prices (prices.html)
- Fetches from CoinGecko public API
- Displays 6 coins: BTC, ETH, SOL, POL, ARB, LINK
- Shows: coin emoji, name, symbol, USD price, 24h % change (green/red)
- Mini trend bar (decorative sparkline)
- Refresh button with spinning animation
- Loading spinner & error message with fallback text
- Last-updated timestamp
- Market overview panel (top gainer, top loser, coins tracked)

### Block Simulator (simulator.html)
- Real SHA-256 via browser Web Crypto API (no libraries)
- Block 1: editable data, fixed GENESIS previous hash, auto-incremented nonce
- Block 2: editable data, previous hash auto-populated from Block 1's mined hash
- Mining: finds nonce where `SHA256(data + prevHash + nonce).startsWith("00")`
- Displays: final nonce, hash, mining time, attempt count
- Status badges: ✅ Valid / ❌ Invalid / ⏳ Pending
- **Chain Integrity:** editing Block 1 after mining instantly breaks Block 2
- Red connector line + "Chain Broken" alert when tampered
- Educational panel explaining proof-of-work concept
- Toast notifications on mine success

---

## 📁 Project Structure

```
index.html          → Home / Landing
concepts.html       → Web3 Concepts  
prices.html         → Live Crypto Prices
simulator.html      → Block Simulator

css/
  style.css         → All shared styles (5000+ lines)

js/
  main.js           → Shared JS: nav toggle, canvas background, utilities
  prices.js         → CoinGecko API fetch + price card rendering
  simulator.js      → SHA-256 mining loop + chain integrity logic

assets/             → (available for future images/icons)
README.md
```

---

## 🔌 API Used

| API | Endpoint | Auth Required |
|-----|----------|---------------|
| CoinGecko Free | `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,...&vs_currencies=usd&include_24hr_change=true` | ❌ None |

---

## 🛠️ Technical Stack

- **HTML5** — Semantic elements, ARIA accessibility
- **CSS3** — Custom Properties, Flexbox, Grid, Glassmorphism, Animations
- **JavaScript (ES2020)** — Async/Await, Web Crypto API, Canvas API, Intersection Observer
- **Font** — Poppins (Google Fonts CDN)
- **No build tools** — Runs directly in any modern browser

---

## 🔮 Features Not Yet Implemented / Recommended Next Steps

- [ ] More blocks in the simulator (Block 3, 4, …)
- [ ] Adjustable mining difficulty (3 or 4 leading zeros)
- [ ] CoinGecko Pro API key support for higher rate limits
- [ ] Historical price chart (Chart.js or ECharts)
- [ ] Portfolio tracker using the Table API
- [ ] Dark/Light mode toggle
- [ ] Transaction builder UI in the simulator
- [ ] Block explorer page showing a full chain history
- [ ] PWA manifest for offline support

---

## 👤 Author

**Parth Soni**  
🎓 Batch: LDRP-ITR
🔗 [GitHub](https://github.com/parth-soni67)

---

© 2025 Parth Soni. Built with ❤️ for Web3 Education.
