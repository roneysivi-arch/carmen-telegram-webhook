import express from "express";
import axios from "axios";
import multer from "multer";

const app = express();
const upload = multer();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    service: "Carmen Mobile Webhook",
    status: "online"
  });
});

async function enviarTelegram(plate) {
  await axios.post(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: plate
    }
  );
}

function extrairPlaca(obj) {
  return (
    obj?.plate ||
    obj?.licensePlate ||
    obj?.license_plate ||
    obj?.anpr?.plate ||
    obj?.result?.plate ||
    obj?.recognition?.plate ||
    obj?.best_plate ||
    obj?.plateText ||
    obj?.plate_text
  );
}

app.post("/api/event", upload.any(), async (req, res) => {
  try {
    console.log("Evento Carmen recebido em /api/event");
    console.log("Body:", req.body);

    let dados = {};

    if (req.body?.data) {
      dados = JSON.parse(req.body.data);
    } else {
      dados = req.body;
    }

    console.log("JSON interpretado:", JSON.stringify(dados, null, 2));

    const plate = extrairPlaca(dados);

    if (!plate) {
      console.log("Placa não encontrada no evento.");
      return res.status(400).json({ error: "plate not found" });
    }

    await enviarTelegram(plate);

    res.json({ success: true });
  } catch (err) {
    console.error("Erro em /api/event:", err);
    res.status(500).json({ error: "internal error" });
  }
});

app.post("/webhook", async (req, res) => {
  try {
    const plate = extrairPlaca(req.body);

    if (!plate) {
      return res.status(400).json({ error: "plate not found" });
    }

    await enviarTelegram(plate);

    res.json({ success: true });
  } catch (err) {
    console.error("Erro em /webhook:", err);
    res.status(500).json({ error: "internal error" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor online na porta ${PORT}`);
});
