// Configurações iniciais
const API_BASE = "https://api.binance.com/api/v3";
const TIME_FRAMES = ["5m", "10m", "1h", "4h"];
const RSI_PERIOD = 14;
const UPDATE_INTERVAL = 60000; // Atualiza a cada 1 minuto

// Função para buscar as moedas disponíveis
async function getAvailableCoins() {
    const response = await fetch(`${API_BASE}/exchangeInfo`);
    const data = await response.json();
    return [...new Set(data.symbols.map(s => s.baseAsset))];
}

// Função para buscar os candles e calcular RSI
async function getRSI(symbol, interval) {
    const response = await fetch(`${API_BASE}/klines?symbol=${symbol}USDT&interval=${interval}&limit=${RSI_PERIOD + 1}`);
    if (!response.ok) return null;
    const candles = await response.json();
    
    let gains = 0, losses = 0;
    for (let i = 1; i < candles.length; i++) {
        let change = parseFloat(candles[i][4]) - parseFloat(candles[i - 1][4]);
        if (change > 0) gains += change;
        else losses -= change;
    }
    
    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
}

// Função para verificar a tendência de RSI
function classifyRSI(rsis) {
    let minRSI = Math.min(...rsis);
    let maxRSI = Math.max(...rsis);
    if (maxRSI - minRSI <= 7) {
        if (minRSI < 30) return "oversold";
        if (maxRSI > 70) return "overbought";
    }
    return "neutral";
}

// Atualizar os dados e exibir na tela
async function updateDashboard() {
    const availableCoins = await getAvailableCoins();
    const container = document.getElementById("crypto-container");
    container.innerHTML = "";
    
    for (let symbol of availableCoins.slice(0, 200)) { // Pegando apenas os top 200
        let rsis = await Promise.all(TIME_FRAMES.map(tf => getRSI(symbol, tf)));
        if (rsis.includes(null)) continue; // Ignorar moedas sem dados
        let status = classifyRSI(rsis);
        let color = status === "oversold" ? "green" : status === "overbought" ? "red" : "gray";
        
        let div = document.createElement("div");
        div.textContent = symbol;
        div.style.backgroundColor = color;
        div.className = "crypto-box";
        container.appendChild(div);
    }
}

// Configurar atualização automática
setInterval(updateDashboard, UPDATE_INTERVAL);
updateDashboard();
