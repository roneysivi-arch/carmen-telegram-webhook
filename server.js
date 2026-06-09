import express from "express";
import axios from "axios";

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function findPlate(data) {
  if (!data) return null;

  // 1) Campos mais comuns em integrações/webhooks
  const possibleFields = [
    "plate",
    "license_plate",
    "licensePlate",
    "number_plate",
    "numberPlate",
    "plate_number",
    "plateNumber",
    "lp",
    "text",
    "result"
  ];

  for (const field of possibleFields) {
    if (typeof data[field] === "string" && data[field].trim()) {
      return data[field].trim().toUpperCase();
    }
  }

  // 2) Estruturas aninhadas comuns
  const nestedPaths = [
    ["vehicle", "plate"],
    ["vehicle", "license_plate"],
    ["vehicle", "licensePlate"],
    ["recognition", "plate"],
    ["recognition", "license_plate"],
    ["recognition", "licensePlate"],
    ["anpr", "plate"],
    ["anpr", "license_plate"],
    ["event", "plate"],
    ["event", "license_plate"],
    ["data", "plate"],
    ["data", "license_plate"],
    ["data", "licensePlate"]
  ];

  for (const path of nestedPaths) {
    let value = data;
    for (const key of path) value = value?.[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim().toUpperCase();
    }
  }

  // 3) Procura recursiva por qualquer campo cujo nome contenha "plate"
  const recursiveResult = searchPlateRecursively(data);
  if (recursiveResult) return recursiveResult;

  return null;
}

function searchPlateRecursively(value) {
  if (!value || typeof value !== "object") return null;

  for (const [key, val] of Object.entries(value)) {
    const keyLower = key.toLowerCase();

    if (
      typeof val === "string" &&
      val.trim() &&
      (keyLower.includes("plate") || keyLower.includes("license"))
    ) {
      return val.trim().toUpperCase();
    }

    if (typeof val === "object") {
      const found = searchPlateRecursively(val);
      if (found) return found;
    }
  }

  return null;
}

async function sendToTelegram(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error("Configure TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID nas variáveis de ambiente.");
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  await axios.post(url, {
    chat_id: TELEGRAM_CHAT_ID,
    text: message
  });
}

app.get("/", (req, res) => {
  res.json({ service: "Carmen Mobile Webhook", status: "online" });
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/webhook", async (req, res) => {
  try {

    console.log("Webhook recebido:");
    console.log(JSON.stringify(req.body, null, 2));
    
    const plate = findPlate(req.body);

    if (!plate) {
      console.log("Placa não encontrada no payload:", JSON.stringify(req.body, null, 2));
      return res.status(400).json({ ok: false, error: "Placa não encontrada no payload recebido." });
    }

    // Envia somente a placa para o Telegram, sem texto extra.
    await sendToTelegram(plate);

    res.json({ ok: true, sent: plate });
  } catch (error) {
    console.error("Erro no webhook:", error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor online na porta ${PORT}`);
});
