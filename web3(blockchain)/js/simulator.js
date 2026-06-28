/**
 * simulator.js — Interactive Blockchain Mining Simulator
 * Uses the Web Crypto API (SubtleCrypto) for real SHA-256 hashing.
 * No external libraries required.
 * Author: Parth Soni
 */

'use strict';

/* =====================================================
   CONSTANTS
   ===================================================== */
const DIFFICULTY_PREFIX = '00'; // Hash must start with this
const MAX_NONCE = 10_000_000;   // Safety cap

/* =====================================================
   STATE
   Store the "committed" (mined) hash for each block
   so we can detect edits after mining.
   ===================================================== */
const blockState = {
  1: { minedHash: null, minedData: null, minedPrevHash: null, mined: false },
  2: { minedHash: null, minedData: null, minedPrevHash: null, mined: false },
};

/* =====================================================
   SHA-256 USING WEB CRYPTO API
   ===================================================== */
/**
 * Compute SHA-256 of a string and return the hex digest.
 * @param {string} message
 * @returns {Promise<string>}
 */
async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* =====================================================
   MINE BLOCK — Core PoW Algorithm
   ===================================================== */
/**
 * Mine a block by finding a nonce whose SHA-256 of
 * (data + prevHash + nonce) begins with DIFFICULTY_PREFIX.
 * @param {number} blockNum - 1 or 2
 */
async function mineBlock(blockNum) {
  const dataEl     = document.getElementById(`b${blockNum}-data`);
  const prevHashEl = document.getElementById(`b${blockNum}-prevhash`);
  const nonceEl    = document.getElementById(`b${blockNum}-nonce`);
  const hashEl     = document.getElementById(`b${blockNum}-hash`);
  const mineBtn    = document.getElementById(`mineBtn${blockNum}`);
  const timeEl     = document.getElementById(`b${blockNum}-time`);
  const attemptsEl = document.getElementById(`b${blockNum}-attempts`);

  const data     = dataEl.value.trim();
  const prevHash = prevHashEl.value.trim();

  // Validate Block 2 can only be mined after Block 1
  if (blockNum === 2 && !blockState[1].mined) {
    showNotification('⚠️ Mine Block 1 first!', 'warning');
    return;
  }

  // Disable button during mining
  mineBtn.disabled = true;
  mineBtn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></span> Mining...';

  setBadge(blockNum, 'pending', '⏳ Mining...');

  const startTime = performance.now();
  let nonce = 0;
  let hash = '';

  // Mining loop — yield to UI every 200 iterations to prevent freezing
  while (nonce < MAX_NONCE) {
    // Process a batch of nonces
    for (let i = 0; i < 200; i++) {
      const candidate = await sha256(`${data}${prevHash}${nonce}`);
      if (candidate.startsWith(DIFFICULTY_PREFIX)) {
        hash = candidate;
        break;
      }
      nonce++;
    }
    if (hash) break;

    // Update nonce display live
    nonceEl.value = nonce;
    // Yield to browser event loop
    await yieldToMain();
  }

  const elapsed = ((performance.now() - startTime) / 1000).toFixed(3);

  if (!hash) {
    // Should rarely happen with "00" difficulty
    setBadge(blockNum, 'invalid', '❌ Failed');
    mineBtn.disabled = false;
    mineBtn.innerHTML = '⛏️ Mine Block';
    return;
  }

  // --- Update UI ---
  nonceEl.value = nonce;
  hashEl.value  = hash;
  hashEl.className = 'hash-display valid-hash';

  if (timeEl)     timeEl.textContent     = `${elapsed}s`;
  if (attemptsEl) attemptsEl.textContent = nonce.toLocaleString();

  // Mark as valid
  setBadge(blockNum, 'valid', '✅ Valid');
  setBlockStyle(blockNum, 'valid');

  // Save mined state
  blockState[blockNum].mined        = true;
  blockState[blockNum].minedHash    = hash;
  blockState[blockNum].minedData    = data;
  blockState[blockNum].minedPrevHash= prevHash;

  // If Block 1 mined → propagate hash to Block 2
  if (blockNum === 1) {
    const b2PrevHash = document.getElementById('b2-prevhash');
    if (b2PrevHash) {
      b2PrevHash.value = hash;
    }
    // Recheck chain integrity (Block 2 may now be valid again)
    checkChainIntegrity();
  }

  if (blockNum === 2) {
    checkChainIntegrity();
  }

  // Re-enable button
  mineBtn.disabled = false;
  mineBtn.innerHTML = '⛏️ Re-Mine';

  showNotification(`✅ Block ${blockNum} mined! Nonce: ${nonce}`, 'success');
}

/* =====================================================
   REAL-TIME EDIT DETECTION
   When user edits block data after mining → invalidate
   ===================================================== */
function attachEditListeners() {
  // Block 1 data → live hash invalidation
  const b1Data = document.getElementById('b1-data');
  if (b1Data) {
    b1Data.addEventListener('input', () => {
      if (blockState[1].mined) {
        onBlock1Tampered();
      }
    });
  }

  // Block 2 data → live hash invalidation
  const b2Data = document.getElementById('b2-data');
  if (b2Data) {
    b2Data.addEventListener('input', () => {
      if (blockState[2].mined) {
        invalidateBlock(2, true);
      }
    });
  }
}

/**
 * Called when Block 1 data is edited after mining.
 * Invalidates Block 1 AND Block 2, shows chain alert.
 */
function onBlock1Tampered() {
  invalidateBlock(1, false);
  invalidateBlock(2, false);

  // Update visual connector
  setConnectorBroken(true);

  // Show chain alert
  const alert = document.getElementById('chainAlert');
  if (alert) alert.classList.add('show');
}

/**
 * Invalidate a block's visual state.
 * @param {number} blockNum
 * @param {boolean} preserveHash - keep old hash displayed
 */
function invalidateBlock(blockNum, preserveHash) {
  setBadge(blockNum, 'invalid', '❌ Invalid');
  setBlockStyle(blockNum, 'invalid');

  if (!preserveHash) {
    const hashEl = document.getElementById(`b${blockNum}-hash`);
    if (hashEl) {
      hashEl.className = 'hash-display invalid-hash';
    }
  }

  blockState[blockNum].mined = false;
}

/* =====================================================
   CHAIN INTEGRITY CHECK
   ===================================================== */
/**
 * After Block 1 is re-mined, check if Block 2's stored
 * prevHash matches Block 1's new mined hash.
 */
function checkChainIntegrity() {
  const b1Hash   = blockState[1].minedHash;
  const b2Prev   = document.getElementById('b2-prevhash')?.value;
  const b2Mined  = blockState[2].mined;
  const b2MinedPrev = blockState[2].minedPrevHash;
  const alert    = document.getElementById('chainAlert');

  if (!b1Hash) return; // Block 1 not mined yet

  // Both blocks mined — check if Block 2's prevHash matches Block 1's current hash
  if (b2Mined && b2MinedPrev === b1Hash) {
    // Chain is valid
    setConnectorBroken(false);
    if (alert) alert.classList.remove('show');
    setBadge(2, 'valid', '✅ Valid');
    setBlockStyle(2, 'valid');
  } else if (b2Mined && b2MinedPrev !== b1Hash) {
    // Block 2 was mined before block 1 was re-mined — still broken
    setConnectorBroken(true);
    if (alert) alert.classList.add('show');
    invalidateBlock(2, false);
  } else {
    // Block 2 not yet mined — connector can be normal if block 1 is valid
    if (blockState[1].mined) {
      setConnectorBroken(false);
      if (alert) alert.classList.remove('show');
    }
  }
}

/* =====================================================
   UI HELPERS
   ===================================================== */

/** Set the status badge for a block */
function setBadge(blockNum, type, text) {
  const badge = document.getElementById(`block${blockNum}-badge`);
  if (!badge) return;
  badge.className = `badge badge-${type}`;
  badge.textContent = text;
}

/** Apply valid/invalid/neutral CSS classes to the block card */
function setBlockStyle(blockNum, state) {
  const block = document.getElementById(`block${blockNum}`);
  if (!block) return;
  block.classList.remove('valid-block', 'invalid-block');
  if (state === 'valid')   block.classList.add('valid-block');
  if (state === 'invalid') block.classList.add('invalid-block');
}

/** Toggle the chain connector's visual between valid/broken */
function setConnectorBroken(broken) {
  const line  = document.getElementById('connectorLine');
  const arrow = document.getElementById('connectorArrow');
  if (!line || !arrow) return;
  if (broken) {
    line.classList.add('broken');
    arrow.classList.add('broken');
  } else {
    line.classList.remove('broken');
    arrow.classList.remove('broken');
  }
}

/**
 * Show a transient notification toast.
 * @param {string} msg
 * @param {'success'|'warning'|'error'} type
 */
function showNotification(msg, type = 'success') {
  // Remove any existing toast
  const old = document.getElementById('sim-toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.id = 'sim-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.style.cssText = `
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 9999;
    padding: 14px 22px;
    border-radius: 50px;
    font-family: var(--font, 'Poppins', sans-serif);
    font-size: 0.88rem;
    font-weight: 600;
    color: #fff;
    backdrop-filter: blur(12px);
    animation: fadeInUp 0.35s ease forwards;
    box-shadow: 0 8px 30px rgba(0,0,0,0.4);
    max-width: 320px;
  `;

  const colors = {
    success: 'linear-gradient(135deg,#10B981,#059669)',
    warning: 'linear-gradient(135deg,#EAB308,#D97706)',
    error:   'linear-gradient(135deg,#EF4444,#DC2626)',
  };
  toast.style.background = colors[type] || colors.success;
  toast.textContent = msg;

  document.body.appendChild(toast);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

/**
 * Yield execution back to the browser event loop.
 * Prevents UI freezing during intensive mining loops.
 */
function yieldToMain() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/* =====================================================
   INITIALISE
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {
  attachEditListeners();

  // Expose mineBlock globally for HTML onclick attributes
  window.mineBlock = mineBlock;
});

// Also expose immediately in case DOMContentLoaded already fired
window.mineBlock = mineBlock;
