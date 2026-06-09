import express from "express";
import axios from "axios";
import multer from "multer";

const app = express();
const upload = multer();

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.get("/", (req, res) => {
  res.json({
    service: "Carmen Mobile Webhook",
    status: "online"
  });
});

async function enviarTelegram(texto) {
  await axios.post(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: texto
    }
  );
}

function tentarParseJson(valor) {
  if (typeof valor !== "string") return valor;

  try {
    return JSON.parse(valor);
  } catch {
    return valor;
  }
}

function buscarPlacaEmQualquerLugar(obj) {
  if (!obj || typeof obj !== "object") return null;

  const possiveisCampos = [
    "plate",
    "Plate",
    "licensePlate",
    "license_plate",
    "plateNumber",
    "plate_number",
    "numberPlate",
    "number_plate",
    "lp",
    "lpn",
    "LP",
    "LPN",
    "registration",
    "registrationNumber",
    "plateText",
    "plate_text"
  ];

  for (const campo of possiveisCampos) {
    if (typeof obj[campo] === "string" && obj[campo].trim()) {
      return obj[campo].trim();
    }
  }

  for (const chave of Object.keys(obj)) {
    const valor = obj[chave];

    if (typeof valor === "string") {
      const texto = valor.trim();

      if (/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/i.test(texto)) {
        return texto.toUpperCase();
      }
    }

    if (typeof valor === "object") {
      const encontrada = buscarPlacaEmQualquerLugar(valor);
      if (encontrada) return encontrada;
    }
  }

  return null;
}

function montarObjetoDoEvento(req) {
  let dados = {};

  if (req.body?.data) {
    dados = tentarParseJson(req.body.data);
  } else if (req.body?.event) {
    dados = tentarParseJson(req.body.event);
  } else if (req.body?.json) {
    dados = tentarParseJson(req.body.json);
  } else {
    dados = req.body || {};
  }

  if (
    dados &&
    typeof dados === "object" &&
    Object.keys(dados).length === 1
  ) {
    const primeiraChave = Object.keys(dados)[0];

    if (
      primeiraChave.trim().startsWith("{") ||
      primeiraChave.trim().startsWith("[")
    ) {
      dados = tentarParseJson(primeiraChave);
    }
  }

  return dados;
}

app.post("/api/event", upload.any(), async (req, res) => {
  console.log("=====================================");
  console.log("Evento recebido do Carmen em /api/event");
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Body bruto:", JSON.stringify(req.body, null, 2));
  console.log("Arquivos:", req.files?.map(f => ({
    fieldname: f.fieldname,
    originalname: f.originalname,
    mimetype: f.mimetype,
    size: f.size
  })));

  try {
    const dados = montarObjetoDoEvento(req);

    console.log("Evento interpretado:");
    console.log(JSON.stringify(dados, null, 2));

    const placa = buscarPlacaEmQualquerLugar(dados);

    if (placa) {
      console.log("Placa encontrada:", placa);
      await enviarTelegram(placa);
    } else {
      console.log("Nenhuma placa encontrada no JSON recebido.");
    }

    return res.status(200).json({
      success: true,
      received: true
    });
  } catch (err) {
    console.error("Erro processando evento:", err);

    return res.status(200).json({
      success: true,
      received: true,
      warning: "event received but not processed"
    });
  }
});

app.post("/webhook", express.json(), async (req, res) => {
  try {
    console.log("Teste recebido em /webhook:");
    console.log(JSON.stringify(req.body, null, 2));

    const placa = buscarPlacaEmQualquerLugar(req.body);

    if (placa) {
      await enviarTelegram(placa);
    }

    return res.status(200).json({
      success: true
    });
  } catch (err) {
    console.error("Erro em /webhook:", err);
    return res.status(200).json({
      success: true
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor online na porta ${PORT}`);
});
