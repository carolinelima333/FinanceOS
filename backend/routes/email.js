import { Router } from "express";
import nodemailer  from "nodemailer";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createTransport() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST || "smtp.gmail.com",
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function buildHtml(summary) {
  const fmt = (v) =>
    Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0F172A;font-family:Inter,Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;padding:40px 0">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#1E293B;border-radius:16px;overflow:hidden">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#6366F1,#8B5CF6);padding:32px 40px;text-align:center">
            <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px">💰 FinanceOS</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.8);margin-top:6px">Relatório Financeiro</div>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px">
          <p style="color:#94A3B8;font-size:14px;margin:0 0 28px">
            Olá! Segue o relatório financeiro gerado em
            <strong style="color:#E2E8F0">${summary.date || new Date().toLocaleDateString("pt-BR")}</strong>.
            O arquivo Excel completo está em anexo.
          </p>

          <!-- Cards -->
          <table width="100%" cellpadding="0" cellspacing="12" style="margin-bottom:28px">
            <tr>
              <td width="48%" style="background:#0F172A;border-radius:12px;padding:20px;border:1px solid #334155">
                <div style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Total em Dívidas</div>
                <div style="font-size:22px;font-weight:800;color:#EF4444">${fmt(summary.totalDebt || 0)}</div>
                <div style="font-size:12px;color:#64748B;margin-top:4px">${summary.activeCount || 0} credores ativos</div>
              </td>
              <td width="4%"></td>
              <td width="48%" style="background:#0F172A;border-radius:12px;padding:20px;border:1px solid #334155">
                <div style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Parcelas Mensais</div>
                <div style="font-size:22px;font-weight:800;color:#F59E0B">${fmt(summary.totalMonthly || 0)}</div>
                <div style="font-size:12px;color:#64748B;margin-top:4px">${summary.commitment != null ? summary.commitment + "% da renda" : "salário não configurado"}</div>
              </td>
            </tr>
            <tr><td colspan="3" height="12"></td></tr>
            <tr>
              <td width="48%" style="background:#0F172A;border-radius:12px;padding:20px;border:1px solid #334155">
                <div style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Dívidas Quitadas</div>
                <div style="font-size:22px;font-weight:800;color:#10B981">${summary.paidCount || 0}</div>
                <div style="font-size:12px;color:#64748B;margin-top:4px">dívidas eliminadas</div>
              </td>
              <td width="4%"></td>
              <td width="48%" style="background:#0F172A;border-radius:12px;padding:20px;border:1px solid #334155">
                <div style="font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Saldo Livre</div>
                <div style="font-size:22px;font-weight:800;color:#6366F1">${summary.freeBalance != null ? fmt(summary.freeBalance) : "—"}</div>
                <div style="font-size:12px;color:#64748B;margin-top:4px">mensal estimado</div>
              </td>
            </tr>
          </table>

          <p style="color:#64748B;font-size:12px;margin:0;padding-top:20px;border-top:1px solid #334155;text-align:center">
            Gerado automaticamente pelo FinanceOS · Não responda este e-mail
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

router.post("/send-report", async (req, res) => {
  const { to, xlsxBase64, fileName, summary } = req.body;

  if (!to || !EMAIL_RE.test(to))
    return res.status(400).json({ error: "E-mail de destino inválido." });

  if (!xlsxBase64 || typeof xlsxBase64 !== "string")
    return res.status(400).json({ error: "Arquivo Excel ausente." });

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS)
    return res.status(503).json({ error: "Serviço de e-mail não configurado. Adicione SMTP_USER e SMTP_PASS no .env do backend." });

  try {
    const transport = createTransport();

    await transport.sendMail({
      from:    `"FinanceOS" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: `📊 Relatório FinanceOS — ${new Date().toLocaleDateString("pt-BR")}`,
      html:    buildHtml(summary || {}),
      attachments: [
        {
          filename:    fileName || "FinanceOS-relatorio.xlsx",
          content:     xlsxBase64,
          encoding:    "base64",
          contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      ],
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err.message);
    res.status(500).json({ error: "Falha ao enviar e-mail: " + err.message });
  }
});

export default router;
