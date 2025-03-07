const COINS_LIMIT = 200;
const API_URL = "https://api.binance.com/api/v3/exchangeInfo";  // API pública da Binance
const KLINES_API = "https://api.binance.com/api/v3/klines";

// Lista de stablecoins para ignorar
const STABLECOINS = ["BUSD", "USDC", "DAI", "TUSD", "FDUSD"];

// Buscar lista das top 200 moedas (filtrando apenas as que são USDT)
async function getTopCoins() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        const topCoins = data.symbols
            .filter(symbolData => symbolData.symbol.endsWith("USDT"))  // Apenas pares USDT
            .filter(symbolData => !STABLECOINS.some(stable => symbolData.symbol.includes(stable))) // Remove stablecoins
            .map(symbolData => symbolData.symbol.replace("USDT", "")) // Remove o sufixo USDT
            .slice(0, COINS_LIMIT); // Pegamos apenas as top 200 moedas

        console.log("✅ Moedas carregadas:", topCoins);
        return topCoins;
    } catch (error) {
        console.error("❌ Erro ao buscar moedas na API da Binance:", error);
        return [];
    }
}

// Função para calcular RSI
function calculateRSI(closingPrices) {
    if (closingPrices.length < 2) return 0;
    let avgUp = 0, avgDown = 0;
    for (let i = 1; i < closingPrices.length; i++) {
        const change = closingPrices[i] - closingPrices[i - 1];
        if (change > 0) avgUp += change;
        else avgDown += Math.abs(change);
    }
    avgUp /= closingPrices.length - 1;
    avgDown /= closingPrices.length - 1;
    if (avgDown === 0) return 100;
    const rs = avgUp / avgDown;
    return 100 - (100 / (1 + rs));
}

// Buscar RSI para diferentes tempos gráficos
async function fetchRSI(coinSymbol, interval) {
    try {
        const symbol = coinSymbol + "USDT"; // Formamos o par para consulta
        const url = `${KLINES_API}?symbol=${symbol}&interval=${interval}&limit=15`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data || data.length === 0) {
            console.warn(`⚠️ Sem dados para ${symbol} (${interval})`);
            return null;
        }

        const closingPrices = data.map(candle => parseFloat(candle[4])); // Preço de fechamento
        return calculateRSI(closingPrices);
    } catch (error) {
        console.error(`❌ Erro ao buscar RSI de ${coinSymbol} (${interval}):`, error);
        return null;
    }
}

// Buscar RSI em múltiplos tempos gráficos e definir cor
async function fetchAndDisplayRSI(coinSymbol, heatmapContainer) {
    try {
        const [rsi5m, rsi10m, rsi1h, rsi4h] = await Promise.all([
            fetchRSI(coinSymbol, "5m"),
            fetchRSI(coinSymbol, "10m"),
            fetchRSI(coinSymbol, "1h"),
            fetchRSI(coinSymbol, "4h")
        ]);

        const rsiValues = [rsi5m, rsi10m, rsi1h, rsi4h].filter(rsi => rsi !== null);
        if (rsiValues.length < 4) return; // Se algum RSI não estiver disponível, pula essa moeda

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
        coinDiv.innerHTML = `<b>${coinSymbol}</b>`;
        heatmapContainer.appendChild(coinDiv);
    } catch (error) {
        console.error(`❌ Erro ao processar ${coinSymbol}:`, error);
    }
}

// Atualizar heatmap com todas as moedas
async function updateHeatmap() {
    const heatmapContainer = document.getElementById("heatmap");
    heatmapContainer.innerHTML = ""; // Limpa antes de atualizar

    const topCoins = await getTopCoins();
    if (topCoins.length === 0) {
        console.error("❌ Nenhuma moeda encontrada! Verifique a API da Binance.");
        return;
    }

    for (const coin of topCoins) {
        await fetchAndDisplayRSI(coin, heatmapContainer);
    }
}

// Função para mostrar botão de atualização a cada 1 minuto
function showUpdateButton() {
    const button = document.getElementById("updateButton");
    button.style.display = "block"; // Exibe o botão
}

// Função para atualizar ao clicar no botão
function manualUpdate() {
    updateHeatmap();
    const button = document.getElementById("updateButton");
    button.style.display = "none"; // Esconde o botão após clicar
}

// Inicializa o heatmap e atualiza automaticamente
updateHeatmap();
setInterval(updateHeatmap, 60000);  // Atualiza a cada 1 minuto
setInterval(showUpdateButton, 60000);  // Mostra o botão a cada 1 minuto
