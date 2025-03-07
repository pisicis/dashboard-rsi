// Configurações iniciais
const API_BASE = "https://api.allorigins.win/get?url=" + encodeURIComponent("https://api.coingecko.com/api/v3");
const UPDATE_INTERVAL = 60000; // Atualiza a cada 1 minuto

document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("crypto-container");
    if (!container) {
        console.error("Elemento #crypto-container não encontrado no DOM.");
        return;
    }
    setInterval(updateDashboard, UPDATE_INTERVAL);
    updateDashboard();
});

// Função para buscar as 10 moedas principais
async function getTopCoins() {
    try {
        const response = await fetch(`${API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false`);
        if (!response.ok) throw new Error("Erro ao buscar moedas disponíveis");
        
        const json = await response.json();
        const data = JSON.parse(json.contents); // Ajuste necessário para processar o JSON vindo do proxy

        return data.map(coin => coin.symbol.toUpperCase());
    } catch (error) {
        console.error("Erro ao obter moedas disponíveis:", error);
        return [];
    }
}

// Atualizar os dados e exibir na tela
async function updateDashboard() {
    console.log("Chamando updateDashboard...");
    const container = document.getElementById("crypto-container");
    if (!container) {
        console.error("Elemento #crypto-container não encontrado no DOM.");
        return;
    }
    
    const topCoins = await getTopCoins();
    console.log("Moedas disponíveis:", topCoins);
    container.innerHTML = "";
    
    if (topCoins.length === 0) {
        container.innerHTML = "<p>Erro ao carregar moedas ou nenhuma moeda disponível.</p>";
        return;
    }

    topCoins.forEach(symbol => {
        let div = document.createElement("div");
        div.textContent = symbol;
        div.style.backgroundColor = "gray";
        div.className = "crypto-box";
        container.appendChild(div);
    });
}
