// 扩展主逻辑
const DEFAULT_SETTINGS = {
    apiKey: '',
    autoRefresh: true,
    refreshInterval: 900,
    lastBalance: null
};

let settings = { ...DEFAULT_SETTINGS };
let refreshTimer = null;

function init() {
    loadSettings();
    registerElements();
    startAutoRefresh();
}

function registerElements() {
    ST.registerExtension({
        name: 'DeepSeek Balance Checker',
        id: 'deepseek-balance',
        init: init,
        load: () => ST.showToast('DeepSeek扩展已加载'),
        unload: () => {
            clearInterval(refreshTimer);
            ST.showToast('DeepSeek扩展已卸载');
        }
    });

    ST.registerMenu('DeepSeek配置', (container) => {
        container.innerHTML = `
            <div class="deepseek-config">
                <h3>API 设置</h3>
                <label>API密钥：
                    <input type="password" id="deepseek-api-key" 
                           value="${settings.apiKey}" 
                           placeholder="sk-xxxxxxxxxxxxxxxx">
                </label>
                <label>自动刷新：
                    <input type="checkbox" id="auto-refresh" 
                           ${settings.autoRefresh ? 'checked' : ''}>
                </label>
                <label>刷新间隔(秒)：
                    <input type="number" id="refresh-interval" 
                           value="${settings.refreshInterval}" 
                           min="60" max="86400">
                </label>
                <button class="btn" onclick="saveSettings()">保存设置</button>
            </div>
        `;
    });

    ST.registerPanel('deepseek-balance', (container) => {
        container.innerHTML = `
            <div class="balance-panel">
                <h2><i class="fa fa-coins"></i> DeepSeek余额</h2>
                <div class="balance-info">
                    <p>剩余额度：<span id="remaining-credits">${settings.lastBalance?.remaining || 'N/A'}</span></p>
                    <p>已用额度：<span id="used-credits">${settings.lastBalance?.used || 'N/A'}</span></p>
                    <p>总额度：<span id="total-credits">${settings.lastBalance?.total || 'N/A'}</span></p>
                    <p>有效期至：<span id="expiry-date">${settings.lastBalance?.expiry ? new Date(settings.lastBalance.expiry).toLocaleDateString() : 'N/A'}</span></p>
                </div>
                <button class="btn" onclick="refreshBalance()"><i class="fa fa-sync"></i> 手动刷新</button>
                <div class="warning">
                    <i class="fa fa-exclamation-triangle"></i> 
                    每次查询可能消耗API额度，请谨慎设置刷新频率
                </div>
            </div>
        `;
    });
}

async function checkBalance() {
    if (!settings.apiKey) {
        ST.showToast('请先配置API密钥');
        return null;
    }

    try {
        const response = await fetch('https://api.deepseek.com/v1/dashboard/billing/credit', {
            headers: {
                'Authorization': `Bearer ${atob(settings.apiKey)}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`HTTP错误 ${response.status}`);
        
        const data = await response.json();
        settings.lastBalance = {
            total: data.total_credits,
            used: data.used_credits,
            remaining: data.remaining_credits,
            expiry: data.expiry_date
        };
        
        updateBalanceDisplay();
        return settings.lastBalance;
    } catch (error) {
        console.error('余额查询失败:', error);
        ST.showToast(`查询失败: ${error.message}`);
        return null;
    }
}

function updateBalanceDisplay() {
    const displayElements = {
        remaining: '#remaining-credits',
        used: '#used-credits', 
        total: '#total-credits',
        expiry: '#expiry-date'
    };

    Object.entries(displayElements).forEach(([key, selector]) => {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = settings.lastBalance?.[key] || 'N/A';
        }
    });
}

function startAutoRefresh() {
    clearInterval(refreshTimer);
    if (settings.autoRefresh) {
        refreshTimer = setInterval(() => checkBalance(), settings.refreshInterval * 1000);
    }
}

function loadSettings() {
    const saved = ST.loadExtensionSettings('deepseek_balance');
    if (saved) {
        settings = { ...DEFAULT_SETTINGS, ...saved };
    }
}

function saveSettings() {
    settings.apiKey = document.getElementById('deepseek-api-key').value;
    settings.autoRefresh = document.getElementById('auto-refresh').checked;
    settings.refreshInterval = Math.max(60, 
        parseInt(document.getElementById('refresh-interval').value) || 900);

    // 简单加密存储
    settings.apiKey = btoa(settings.apiKey);
    
    ST.saveExtensionSettings('deepseek_balance', settings);
    ST.showToast('设置已保存');
    settings.apiKey = atob(settings.apiKey); // 还原用于后续使用
    
    startAutoRefresh();
}

// 暴露全局方法供按钮调用
window.refreshBalance = checkBalance;
window.saveSettings = saveSettings;