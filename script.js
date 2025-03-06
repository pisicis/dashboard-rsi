const COINS_LIMIT = 200;
const API_URL = "https://api.binance.com/api/v3/ticker/24hr"; // API da Binance

const mainCoin = "BTCUSDT"; // Bitcoin como referência

// Lista de stablecoins para ignorar
const STABLECOINS = ["USDT", "BUSD", "USDC", "DAI", "TUSD", "FDUSD"];

// Função para calcular RSI
function calculateRSI(closingPrices) {
    const n = closingPrices.length;
    if (n < 2) return 0;
    let avgUp = 0, avgDown = 0;
    for (let i = 1; i < n; i++) {
        const change = closingPrices[i] - closingPrices[i - 1];
        if (change > 0) avgUp += change;
        else avgDown += Math.abs(change);
    }
    avgUp /= (n - 1);
    avgDown /= (n - 1);
    if (avgDown === 0) return 100;
    const rs = avgUp / avgDown;
    return 100 - (100 / (1 + rs));
}

// Buscar lista das top 200 moedas, removendo stablecoins e garantindo que sejam USDT pairs
async function getTopCoins() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        return data
            .map(coin => coin.symbol)
            .filter(symbol => symbol.endsWith("USDT"))  // Apenas pares USDT
            .filter(symbol => !STABLECOINS.some(stable => symbol.includes(stable))) // Remove stablecoins
            .slice(0, COINS_LIMIT);  // Pega apenas as 200 primeiras moedas

    } catch (error) {
        console.error("Erro ao buscar moedas:", error);
        return [];
    }
}

// Buscar RSI para diferentes tempos gráficos
async function fetchRSI(coinId, interval) {
    try {
        const url = `https://api.binance.com/api/v3/klines?symbol=${coinId}&interval=${interval}&limit=15`;
        const response = await fetch(url);
        const data = await response.json();
        
        const closingPrices = data.map(candle => parseFloat(candle[4])); // Preço de fechamento
        return calculateRSI(closingPrices);
    } catch (error) {
        console.error(`Erro ao buscar RSI de ${coinId} (${interval}):`, error);
        return null;
    }
}

// Buscar RSI em múltiplos tempos gráficos e definir cor
async function fetchAndDisplayRSI(coinId, heatmapContainer) {
    try {
        const [rsi5m, rsi10m, rsi1h, rsi4h] = await Promise.all([
            fetchRSI(coinId, "5m"),
            fetchRSI(coinId, "10m"),
            fetchRSI(coinId, "1h"),
            fetchRSI(coinId, "4h")
        ]);

        // Verificar se os RSIs estão alinhados (diferença máxima de 7 pontos)
        const rsiValues = [rsi5m, rsi10m, rsi1h, rsi4h].filter(rsi => rsi !== null);
        const maxRSI = Math.max(...rsiValues);
        const minRSI = Math.min(...rsiValues);
        const aligned = (maxRSI - minRSI) <= 7;

        let colorClass = "neutral";  // Padrão: cinza

        if (aligned) {
            if (rsiValues.every(rsi => rsi >= 70)) {
                colorClass = "overbought";  // Vermelho → sobrecomprado
            } else if (rsiValues.every(rsi => rsi <= 30)) {
                colorClass = "oversold";  // Verde → sobrevenda
            }
        }

        // Criar elemento no heatmap
        const coinDiv = document.createElement("div");
        coinDiv.className = `heatmap-box ${colorClass}`;
        coinDiv.innerHTML = `<b>${coinId.replace("USDT", "")}</b>`;
        heatmapContainer.appendChild(coinDiv);
    } catch (error) {
        console.error(`Erro ao processar ${coinId}:`, error);
    }
}

// Atualizar heatmap com todas as moedas
async function updateHeatmap() {
    const heatmapContainer = document.getElementById("heatmap");
    heatmapContainer.innerHTML = ""; // Limpa antes de atualizar

    const topCoins = await getTopCoins();
    for (const coin of topCoins) {
        await fetchAndDisplayRSI(coin, heatmapContainer);
    }
}

// Inicializa o heatmap e atualiza a cada 5 minutos
updateHeatmap();
setInterval(updateHeatmap, 5 * 60 * 1000);
