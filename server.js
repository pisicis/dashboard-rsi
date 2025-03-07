require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Habilita CORS para permitir requisições do frontend
app.use(cors());

// Endpoint para buscar as 10 moedas principais da CoinGecko
app.get("/api/top-coins", async (req, res) => {
    try {
        const response = await axios.get("https://api.coingecko.com/api/v3/coins/markets", {
            params: {
                vs_currency: "usd",
                order: "market_cap_desc",
                per_page: 10,
                page: 1,
                sparkline: false
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error("Erro ao buscar dados da CoinGecko:", error);
        res.status(500).json({ error: "Erro ao buscar dados da API" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
