// Lista de criptomoedas a exibir (IDs da CoinGecko)
const coins = ["bitcoin", "ethereum", "cardano", "binancecoin", "solana", "ripple"];
const mainCoin = "bitcoin";  // BTC como principal destaque

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

// Função para detectar suporte e resistência
function checkSupportResistance(prices, currentPrice) {
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const tolerance = 0.02; // 2% de variação
  if (Math.abs(currentPrice - high) / high < tolerance) return "🔴"; // Resistência
  if (Math.abs(currentPrice - low) / low < tolerance) return "🟢"; // Suporte
  return "";
}

// Função para buscar RSI e atualizar DOM
async function fetchAndDisplayRSI(coinId) {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=15&interval=daily`;
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

    // Atualiza DOM
    const coinNames = { bitcoin: "Bitcoin", ethereum: "Ethereum", cardano: "Cardano", binancecoin: "BNB", solana: "Solana", ripple: "XRP" };
    const coinName = coinNames[coinId] || coinId;
    
    if (coinId === mainCoin) {
      const btcDiv = document.getElementById("btc-rsi");
      btcDiv.textContent = `${coinName} – RSI: ${rsi.toFixed(2)} (${status}) ${divergenceIcon} ${supportResistanceIcon}`;
      btcDiv.className = statusClass;
    } else {
      const li = document.createElement("li");
      li.textContent = `${coinName} – RSI: ${rsi.toFixed(2)} (${status}) ${divergenceIcon} ${supportResistanceIcon}`;
      li.className = statusClass;
      document.getElementById("crypto-list").appendChild(li);
    }
  } catch (error) {
    console.error("Erro ao buscar dados de", coinId, error);
  }
}

// Atualizar todas as moedas
async function updateAllCoins() {
  document.getElementById("crypto-list").innerHTML = "";
  await fetchAndDisplayRSI(mainCoin);
  for (const coin of coins) {
    if (coin !== mainCoin) await fetchAndDisplayRSI(coin);
  }
}
updateAllCoins();
setInterval(updateAllCoins, 5 * 60 * 1000);
