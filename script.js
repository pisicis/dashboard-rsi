const COINS_LIMIT = 200;
const API_URL = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=" + COINS_LIMIT + "&page=1&sparkline=false";
const MARKET_CHART_URL = "https://api.coingecko.com/api/v3/coins/";

const mainCoin = "bitcoin"; // BTC em destaque

// Função para calcular RSI baseado em preços de fechamento
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

// Buscar lista das top 200 moedas pelo Market Cap
async function getTopCoins() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        return data.map(coin => coin.id);
    } catch (error) {
        console.error("Erro ao buscar top moedas:", error);
        return [];
    }
}

// Buscar RSI e preencher heatmap
async function fetchAndDisplayRSI(coinId, heatmapContainer) {
    try {
        const url = `${MARKET_CHART_URL}${coinId}/market_chart?vs_currency=usd&days=15&interval=daily`;
        const response = await fetch(url);
        const data = await response.json();
        const prices = data.prices.map(p => p[1]);
        const rsi = calculateRSI(prices);

        // Definir cor do heatmap baseado no RSI
        let colorClass = "neutral";
        if (rsi >= 70) colorClass = "overbought";
        else if (rsi >= 60) colorClass = "strong";
        else if (rsi <= 30) colorClass = "oversold";
        else if (rsi <= 40) colorClass = "weak";

        // Criar elemento para o heatmap
        const coinDiv = document.createElement("div");
        coinDiv.className = `heatmap-box ${colorClass}`;
        coinDiv.innerHTML = `<b>${coinId.toUpperCase()}</b><br>RSI: ${rsi.toFixed(2)}`;
        heatmapContainer.appendChild(coinDiv);
    } catch (error) {
        console.error(`Erro ao buscar dados de ${coinId}:`, error);
    }
}

// Atualizar todas as moedas no heatmap
async function updateHeatmap() {
    const heatmapContainer = document.getElementById("heatmap");
    heatmapContainer.innerHTML = ""; // Limpa o heatmap antes de atualizar

    const topCoins = await getTopCoins();
    for (const coin of topCoins) {
        await fetchAndDisplayRSI(coin, heatmapContainer);
    }
}

// Inicializa o heatmap e atualiza a cada 5 minutos
updateHeatmap();
setInterval(updateHeatmap, 5 * 60 * 1000);
