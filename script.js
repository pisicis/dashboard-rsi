// Configurações iniciais
const API_BASE = "https://api.binance.com/api/v3";
const TIME_FRAMES = ["5m", "10m", "1h", "4h"];
const RSI_PERIOD = 14;
const UPDATE_INTERVAL = 60000; // Atualiza a cada 1 minuto

// Função para buscar os pares disponíveis com USDT
async function getAvailableCoins() {
    try {
        const response = await fetch(`${API_BASE}/exchangeInfo`);
        if (!response.ok) throw new Error("Erro ao buscar moedas disponíveis");
        const data = await response.json();
        if (!data.symbols) throw new Error("Formato de resposta inesperado");

        // Filtrando apenas os pares que terminam em USDT
        const usdtPairs = data.symbols
            .filter(s => s.symbol.endsWith("USDT"))
            .map(s => s.baseAsset);

        return [...new Set(usdtPairs)];
    } catch (error) {
        console.error("Erro ao obter moedas disponíveis:", error);
        return [];
    }
}

// Função para buscar os candles e calcular RSI
async function getRSI(symbol, interval) {
    try {
        const response = await fetch(`${API_BASE}/klines?symbol=${symbol}USDT&interval=${interval}&limit=${RSI_PERIOD + 1}`);
        if (!response.ok) throw new Error(`Erro ao buscar candles para ${symbol}`);
        
        const candles = await response.json();
        if (!Array.isArray(candles) || candles.length < RSI_PERIOD + 1) {
            console.warn(`Dados insuficientes para calcular RSI de ${symbol}`);
            return null;
        }

        let gains = 0, losses = 0;
        for (let i = 1; i < candles.length; i++) {
            let change = parseFloat(candles[i][4]) - parseFloat(candles[i - 1][4]);
            if (change > 0) gains += change;
            else losses -= change;
        }

        if (losses === 0) return 100;
        const rs = gains / losses;
        return 100 - (100 / (1 + rs));
    } catch (error) {
        console.error(`Erro ao obter RSI para ${symbol} (${interval}):`, error);
        return null;
    }
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
    console.log("Chamando updateDashboard...");
    const availableCoins = await getAvailableCoins();
    console.log("Moedas disponíveis:", availableCoins);

    const container = document.getElementById("crypto-container");
    container.innerHTML = "";

    if (availableCoins.length === 0) {
        container.innerHTML = "<p>Erro ao carregar moedas ou nenhuma moeda disponível.</p>";
        return;
    }

    for (let symbol of availableCoins.slice(0, 200)) { // Pegando apenas os top 200
        let rsis = await Promise.all(TIME_FRAMES.map(tf => getRSI(symbol, tf)));
        console.log(`RSIs para ${symbol}:`, rsis);

        if (rsis.includes(null)) {
            let div = document.createElement("div");
            div.textContent = `${symbol} (Sem dados)`;
            div.style.backgroundColor = "gray";
            div.className = "crypto-box";
            container.appendChild(div);
            continue; // Pula a moeda se os dados estiverem ausentes
        }

        let status = classifyRSI(rsis);
        let color = status === "oversold" ? "green" : status === "overbought" ? "red" : "gray";

        let div = document.createElement("div");
        div.textContent = symbol;
        div.style.backgroundColor = color;
        div.className = "crypto-box";
        container.appendChild(div);
    }
}

// Adicionar uma mensagem se a API falhar
function showError(message) {
    const container = document.getElementById("crypto-container");
    container.innerHTML = `<p style="color: red; font-weight: bold;">${message}</p>`;
}

// Configurar atualização automática
setInterval(updateDashboard, UPDATE_INTERVAL);
updateDashboard();
