let settings = {
    apiKey: '',
    refreshInterval: 900,
    lastUpdate: null
};

let intervalId = null;

// 扩展生命周期
onExtensionLoad(async () => {
    loadSettings();
    createUI();
    startInterval();
});

onExtensionUnload(() => {
    clearInterval(intervalId);
    document.getElementById('deepseek-balance-container')?.remove();
});

function createUI() {
    const container = document.createElement('div');
    container.id = 'deepseek-balance-container';
    container.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        z-index: 9999;
        background: var(--background-secondary-alt);
        padding: 8px;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 8px;
    `;

    container.innerHTML = `
        <span style="color: var(--text-muted); font-size: 0.9em;">DeepSeek:</span>
        <span id="balance-remaining" style="color: var(--text-normal);">...</span>
        <button 
            id="refresh-balance"
            style="${buttonStyle}"
            onclick="refreshBalance()"
            title="刷新余额"
        >↻</button>
        <button
            id="config-balance"
            style="${buttonStyle}"
            onclick="showConfig()"
            title="设置"
        >⚙</button>
    `;

    document.body.appendChild(container);
}

const buttonStyle = `
    padding: 4px 8px;
    background: var(--interactive-accent);
    border: none;
    border-radius: 3px;
    color: white;
    cursor: pointer;
    transition: opacity 0.2s;
    font-size: 0.9em;
`;

async function refreshBalance() {
    if (!settings.apiKey) return showConfig();
    
    try {
        const response = await fetch('https://api.deepseek.com/v1/dashboard/billing/credit', {
            headers: { Authorization: `Bearer ${settings.apiKey}` }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        document.getElementById('balance-remaining').textContent = 
            data.remaining_credits ?? 'N/A';
        settings.lastUpdate = Date.now();
        
    } catch (error) {
        console.error('[DeepSeek] Error:', error);
        document.getElementById('balance-remaining').textContent = '错误';
    }
}

function showConfig() {
    const modal = document.createElement('div');
    modal.id = 'deepseek-config-modal';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--background-primary);
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 0 20px rgba(0,0,0,0.3);
        z-index: 10000;
        min-width: 300px;
    `;

    modal.innerHTML = `
        <h3 style="margin:0 0 15px 0; color: var(--text-normal);">DeepSeek 配置</h3>
        <div style="margin-bottom: 15px;">
            <input 
                type="password" 
                id="api-key-input"
                placeholder="sk-xxxxxxxxxxxxxxxx"
                value="${settings.apiKey}"
                style="width: 100%; padding: 8px; margin-bottom: 10px;"
            >
            <div style="display: flex; gap: 6px; align-items: center;">
                <input 
                    type="number" 
                    id="refresh-interval"
                    value="${settings.refreshInterval}"
                    min="60"
                    style="width: 80px; padding: 6px;"
                >
                <label style="color: var(--text-muted); font-size: 0.9em;">刷新间隔 (秒)</label>
            </div>
        </div>
        <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button 
                onclick="this.parentElement.parentElement.remove()" 
                style="${buttonStyle} background: var(--background-modifier-error);"
            >取消</button>
            <button 
                onclick="saveConfig()" 
                style="${buttonStyle}"
            >保存</button>
        </div>
    `;

    document.body.appendChild(modal);
}

function saveConfig() {
    settings.apiKey = document.getElementById('api-key-input').value;
    settings.refreshInterval = Math.max(
        60, 
        parseInt(document.getElementById('refresh-interval').value) || 900
    );
    localStorage.setItem('deepseek-settings', JSON.stringify(settings));
    document.getElementById('deepseek-config-modal')?.remove();
    clearInterval(intervalId);
    startInterval();
    refreshBalance();
}

function loadSettings() {
    const saved = localStorage.getItem('deepseek-settings');
    if (saved) settings = JSON.parse(saved);
}

function startInterval() {
    intervalId = setInterval(refreshBalance, settings.refreshInterval * 1000);
    refreshBalance(); // 立即执行一次
}
