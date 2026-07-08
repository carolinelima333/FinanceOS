import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes     from "./routes/auth.js";
import debtRoutes     from "./routes/debts.js";
import settingsRoutes from "./routes/settings.js";
import auditRoutes    from "./routes/audit.js";
import emailRoutes    from "./routes/email.js";

const app = express();

// Remove header que anuncia que o servidor usa Express
app.disable("x-powered-by");

// Headers de segurança HTTP
app.use(helmet({
  crossOriginResourcePolicy: { policy: "same-origin" },
}));

// CORS restrito à origem configurada
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Limite de tamanho do body — evita DoS via payload gigante (padrão Express é 100kb, aqui é explícito)
app.use(express.json({ limit: "32kb" }));

// Rate limit geral: 200 requisições por IP a cada 15 min
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Tente novamente em alguns minutos." },
});

// Rate limit para autenticação: 15 tentativas por IP a cada 15 min — bloqueia brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login. Aguarde 15 minutos." },
});

app.use(generalLimiter);

app.use("/api/auth",     authLimiter, authRoutes);
app.use("/api/debts",    debtRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/audit",    auditRoutes);
app.use("/api/email",    emailRoutes);

app.get("/api/health", (_, res) => res.json({ ok: true }));

export default app;
