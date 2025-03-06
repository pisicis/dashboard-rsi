// Define a quantidade de moedas a serem analisadas
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

// Função para detectar suporte e resistência
function checkSupportResistance(prices, currentPrice) {
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const tolerance = 0.02; // 2% de variação
    if (Math.abs(currentPrice - high) / high < tolerance) return "🔴"; // Resistência
    if (Math.abs(currentPrice - low) / low < tolerance) return "🟢"; // Suporte
    return "";
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

// Buscar RSI, suporte/resistência e divergência
async function fetchAndDisplayRSI(coinId) {
    try {
        const url = `${MARKET_CHART_URL}${coinId}/market_chart?vs_currency=usd&days=15&interval=daily`;
        const response = await fetch(url);
        const data = await response.json();
        const prices = data.prices.map(p => p[1]);
        const currentPrice = prices[prices.length - 1];
        const rsi = calculateRSI(prices);

        let status = "Neutra", statusClass = "neutral";
        if (rsi >= 70) { status = "Sobrecomprada"; statusClass = "overbought"; }
        else if (rsi <= 30) { status = "Sobrevendida"; statusClass = "oversold"; }

        // Divergência RSI
        let divergenceIcon = "";
        const firstPrice = prices[0];
        if (currentPrice > firstPrice && rsi < 50) divergenceIcon = " 🔻";
        else if (currentPrice < firstPrice && rsi > 50) divergenceIcon = " 🔺";

        // Suporte/Resistência
        const supportResistanceIcon = checkSupportResistance(prices, currentPrice);

        // Determinar se a moeda está andando a favor ou contra o BTC
        let trendClass = "neutral-trend";
        let trendText = "Neutra";
        if (rsi > 50 && prices[prices.length - 1] > prices[0]) {
            trendClass = "up-trend";
            trendText = "A favor do BTC 🚀";
        } else if (rsi < 50 && prices[prices.length - 1] < prices[0]) {
            trendClass = "down-trend";
            trendText = "Contra o BTC 📉";
        }

        // Atualiza DOM
        if (coinId === mainCoin) {
            document.getElementById("btc-rsi").innerHTML = `<b>Bitcoin</b> – RSI: ${rsi.toFixed(2)} (${status}) ${divergenceIcon} ${supportResistanceIcon}`;
        } else {
            const li = document.createElement("li");
            li.innerHTML = `<b>${coinId}</b> – RSI: ${rsi.toFixed(2)} (${status}) ${divergenceIcon} ${supportResistanceIcon} <span class="${trendClass}">${trendText}</span>`;
            li.className = statusClass;
            document.getElementById("crypto-list").appendChild(li);
        }
    } catch (error) {
        console.error(`Erro ao buscar dados de ${coinId}:`, error);
    }
}

// Atualizar todas as moedas
async function updateAllCoins() {
    document.getElementById("crypto-list").innerHTML = "";
    await fetchAndDisplayRSI(mainCoin);
    const topCoins = await getTopCoins();
    for (const coin of topCoins) {
        if (coin !== mainCoin) await fetchAndDisplayRSI(coin);
    }
}

// Inicializa o dashboard e atualiza a cada 5 minutos
updateAllCoins();
setInterval(updateAllCoins, 5 * 60 * 1000);
