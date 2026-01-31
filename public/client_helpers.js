// --- LOGS ---
function addLogEntry(entry) {
    let logContainer = document.getElementById('log-container');

    // Create container if missing
    if (!logContainer) {
        logContainer = document.createElement('div');
        logContainer.id = 'log-container';
        logContainer.innerHTML = '<h4>📓 Nhật Ký</h4><div id="log-list"></div>';
        // Style handled in CSS
        document.body.appendChild(logContainer);
    }

    const list = document.getElementById('log-list');
    const item = document.createElement('div');
    item.className = `log-item ${entry.type}`;

    const time = new Date(entry.time).toLocaleTimeString('vi-VN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    item.innerText = `[${time}] ${entry.text}`;

    list.appendChild(item);
    list.scrollTop = list.scrollHeight;

    // Auto-open log on new entry? Optional.
}

// --- REACTIONS ---
function showReaction(data) {
    // data: { sourceId, targetId, emoji }
    const { targetId, emoji } = data;

    // Find Target Element
    // Could be a Player Card or a Scene Tile? 
    // Simplified: Reactions are mostly on PLAYERS (cards).

    // Look for player card by ID? Not easy as we don't put IDs on DOM elements yet.
    // Let's assume we update render to put IDs on elements.

    // Quick fix: Iterate player cards to find matching title?
    // Proper way: Add data-id to player cards in renderLobby/renderSuspects.

    const targetEl = document.querySelector(`.player-card[data-id="${targetId}"]`) ||
        document.querySelector(`.suspect-container[data-id="${targetId}"]`);

    if (targetEl) {
        const floatEl = document.createElement('div');
        floatEl.className = 'floating-emoji';
        floatEl.innerText = emoji;

        // Position relative to target
        const rect = targetEl.getBoundingClientRect();
        floatEl.style.left = (rect.left + rect.width / 2) + 'px';
        floatEl.style.top = (rect.top + rect.height / 2) + 'px';

        document.body.appendChild(floatEl);

        // Remove after animation
        setTimeout(() => floatEl.remove(), 2000);
    }
}

// Context Menu Helper
function showContextMenu(x, y, targetId) {
    // Remove old
    const old = document.getElementById('context-menu');
    if (old) old.remove();

    const menu = document.createElement('div');
    menu.id = 'context-menu';
    menu.style.top = y + 'px';
    menu.style.left = x + 'px';

    const emojis = ['🤔', '👍', '👎', '😂', '🔥', '👀'];

    emojis.forEach(e => {
        const btn = document.createElement('span');
        btn.innerText = e;
        btn.onclick = () => {
            socket.emit('send_reaction', { targetId, emoji: e });
            menu.remove();
        };
        menu.appendChild(btn);
    });

    // Close on click outside
    setTimeout(() => {
        document.addEventListener('click', () => menu.remove(), { once: true });
    }, 10);

    document.body.appendChild(menu);
}
