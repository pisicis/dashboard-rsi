const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());

const API_BASE = "https://api.coingecko.com/api/v3";

app.get("/coins", async (req, res) => {
    try {
        const response = await fetch(`${API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar dados" });
    }
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));
