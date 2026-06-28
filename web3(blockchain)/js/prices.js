/**
 * prices.js — Live Cryptocurrency Price Fetcher
 * Fetches from CoinGecko public API, renders price cards with
 * 24h change indicators, trend bars, and auto-refresh capability.
 * Author: Parth Soni
 */

'use strict';

/* =====================================================
   COIN CONFIGURATION
   Add/remove coins from this array to customize the dashboard.
   ===================================================== */
const COINS = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    emoji: '₿',
    color: '#F7931A',
    bgColor: 'rgba(247,147,26,0.12)',
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    emoji: 'Ξ',
    color: '#627EEA',
    bgColor: 'rgba(98,126,234,0.12)',
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    emoji: '◎',
    color: '#9945FF',
    bgColor: 'rgba(153,69,255,0.12)',
  },
  {
    id: 'matic-network',
    name: 'Polygon',
    symbol: 'POL',
    emoji: '⬡',
    color: '#8247E5',
    bgColor: 'rgba(130,71,229,0.12)',
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    symbol: 'ARB',
    emoji: '🔵',
    color: '#12AAFF',
    bgColor: 'rgba(18,170,255,0.12)',
  },
  {
    id: 'chainlink',
    name: 'Chainlink',
    symbol: 'LINK',
    emoji: '🔗',
    color: '#2A5ADA',
    bgColor: 'rgba(42,90,218,0.12)',
  },
];

/* =====================================================
   API CONFIGURATION
   ===================================================== */
const COINGECKO_API = (() => {
  const ids = COINS.map(c => c.id).join(',');
  return `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
})();

/* =====================================================
   DOM REFERENCES
   ===================================================== */
const loadingEl     = document.getElementById('loadingState');
const errorEl       = document.getElementById('errorMessage');
const errorDetailEl = document.getElementById('errorDetail');
const pricesGridEl  = document.getElementById('pricesGrid');
const lastUpdatedEl = document.getElementById('lastUpdated');
const refreshBtn    = document.getElementById('refreshBtn');
const refreshIcon   = document.getElementById('refreshIcon');
const marketPanel   = document.getElementById('marketOverview');
const topGainerEl   = document.getElementById('topGainer');
const topLoserEl    = document.getElementById('topLoser');
const coinsTrackedEl= document.getElementById('coinsTracked');

/* =====================================================
   STATE
   ===================================================== */
let isFetching = false;
let lastData = null;

/* =====================================================
   FETCH PRICES
   ===================================================== */
async function loadPrices() {
  if (isFetching) return;
  isFetching = true;

  // Show loading state
  showLoading();

  try {
    const response = await fetch(COINGECKO_API, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      // Avoid stale cache
      cache: 'no-cache',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    lastData = data;
    renderPrices(data);
    updateMarketOverview(data);
    showPricesGrid();

    // Update timestamp
    const now = new Date();
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = `Last updated: ${formatTimestamp(now)}`;
    }

  } catch (err) {
    console.error('[prices.js] Fetch error:', err);
    showError(err.message || 'Network error. Check your connection.');
  } finally {
    isFetching = false;
    stopRefreshSpin();
  }
}

/* =====================================================
   RENDER PRICE CARDS
   ===================================================== */
function renderPrices(data) {
  if (!pricesGridEl) return;
  pricesGridEl.innerHTML = '';

  COINS.forEach((coin, idx) => {
    const coinData = data[coin.id];
    if (!coinData) return; // API didn't return this coin

    const price  = coinData.usd;
    const change = coinData.usd_24h_change;

    // Skip card if core data is missing or not a number
    if (price == null || isNaN(price) || change == null || isNaN(change)) return;

    const isPositive = change >= 0;

    // Mini trend bar (decorative sparkline-style)
    const trendHTML = buildTrendBar(change, coin.color, isPositive);

    const card = document.createElement('article');
    card.className = 'glass-card price-card fade-in';
    card.style.animationDelay = `${idx * 0.08}s`;
    card.setAttribute('aria-label', `${coin.name} price card`);
    card.style.setProperty('--card-top-color', coin.color);
    card.style.cssText += `--card-top-color:${coin.color};`;

    // Override the ::before gradient color per card
    card.innerHTML = `
      <style>
        #price-card-${coin.id}::before {
          background: linear-gradient(90deg, ${coin.color}, ${coin.bgColor.replace('0.12', '0.8')});
        }
      </style>
      <div class="price-card-top">
        <div class="coin-logo-placeholder" style="background:${coin.bgColor};color:${coin.color};font-size:1.4rem;font-weight:700;font-family:monospace;">
          ${coin.emoji}
        </div>
        <div>
          <div class="coin-name">${coin.name}</div>
          <div class="coin-symbol">${coin.symbol}</div>
        </div>
      </div>

      <div class="price-value" id="price-${coin.id}">${formatUSD(price)}</div>

      <div>
        <span class="price-change ${isPositive ? 'positive' : 'negative'}" aria-label="${isPositive ? 'up' : 'down'} ${Math.abs(change).toFixed(2)} percent in 24 hours">
          ${isPositive ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%
        </span>
        <span style="font-size:0.75rem;color:var(--text-muted);margin-left:8px;">24h</span>
      </div>

      ${trendHTML}
    `;

    card.id = `price-card-${coin.id}`;
    pricesGridEl.appendChild(card);
  });
}

/* =====================================================
   MINI TREND BAR (decorative sparkline)
   ===================================================== */
function buildTrendBar(change, color, isPositive) {
  // Generate 10 pseudo-random bar heights based on the change value
  const bars = [];
  const seed = Math.abs(change * 100);
  const baseline = 40;

  for (let i = 0; i < 10; i++) {
    // Use a deterministic pseudo-random so bars don't flicker on re-render
    const pseudo = ((seed * (i + 1) * 7) % 60) + 10;
    bars.push(pseudo);
  }

  const barColor = isPositive ? 'var(--accent-green)' : 'var(--accent-red)';
  const barsHTML = bars.map(h =>
    `<div class="trend-bar-item" style="height:${h}%;background:${barColor};" aria-hidden="true"></div>`
  ).join('');

  return `<div class="trend-bar" role="img" aria-label="Price trend visualization">${barsHTML}</div>`;
}

/* =====================================================
   MARKET OVERVIEW PANEL
   ===================================================== */
function updateMarketOverview(data) {
  if (!marketPanel) return;

  let topGainerCoin = null, topLoserCoin = null;
  let maxChange = -Infinity, minChange = Infinity;
  let tracked = 0;

  COINS.forEach(coin => {
    const coinData = data[coin.id];
    if (!coinData) return;
    tracked++;
    const change = coinData.usd_24h_change;

    if (change > maxChange) {
      maxChange = change;
      topGainerCoin = coin;
    }
    if (change < minChange) {
      minChange = change;
      topLoserCoin = coin;
    }
  });

  if (topGainerEl && topGainerCoin && isFinite(maxChange)) {
    topGainerEl.textContent = `${topGainerCoin.emoji} ${topGainerCoin.symbol} +${maxChange.toFixed(2)}%`;
  }
  if (topLoserEl && topLoserCoin && isFinite(minChange)) {
    topLoserEl.textContent = `${topLoserCoin.emoji} ${topLoserCoin.symbol} ${minChange.toFixed(2)}%`;
  }
  if (coinsTrackedEl) {
    coinsTrackedEl.textContent = `${tracked} coins`;
  }

  marketPanel.style.display = 'block';
}

/* =====================================================
   UI STATE HELPERS
   ===================================================== */
function showLoading() {
  if (loadingEl)    { loadingEl.style.display = 'flex'; }
  if (errorEl)      { errorEl.classList.remove('show'); }
  if (pricesGridEl) { pricesGridEl.style.display = 'none'; }
  if (marketPanel)  { marketPanel.style.display = 'none'; }

  // Spin the refresh icon
  if (refreshIcon)  { refreshIcon.style.animation = 'spin 0.8s linear infinite'; }
  if (refreshBtn)   { refreshBtn.disabled = true; }
}

function showPricesGrid() {
  if (loadingEl)    { loadingEl.style.display = 'none'; }
  if (errorEl)      { errorEl.classList.remove('show'); }
  if (pricesGridEl) { pricesGridEl.style.display = 'grid'; }
}

function showError(message) {
  if (loadingEl)    { loadingEl.style.display = 'none'; }
  if (pricesGridEl) { pricesGridEl.style.display = 'none'; }
  if (errorEl)      { errorEl.classList.add('show'); }
  if (errorDetailEl){ errorDetailEl.textContent = message; }
  if (lastUpdatedEl){ lastUpdatedEl.textContent = 'Failed to load'; }
}

function stopRefreshSpin() {
  if (refreshIcon) { refreshIcon.style.animation = 'none'; }
  if (refreshBtn)  { refreshBtn.disabled = false; }
}

/* =====================================================
   AUTO-LOAD ON PAGE READY
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  loadPrices();
});

// Expose loadPrices globally so the Refresh button can call it
window.loadPrices = loadPrices;
