const BASE = "/api";

function getToken() {
  return localStorage.getItem("fos-token");
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error("Sem conexão com o servidor. Verifique se o backend está rodando.");
  }

  const text = await res.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Erro ${res.status}: resposta inválida do servidor.`);
  }

  if (res.status === 401) {
    localStorage.removeItem("fos-token");
    localStorage.removeItem("fos-email");
    window.location.reload();
    throw new Error("Sessão expirada. Faça login novamente.");
  }
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

export const api = {
  login:        (email, password)       => request("POST",   "/auth/login",    { email, password }),
  register:     (email, password, name) => request("POST",   "/auth/register", { email, password, name }),
  getDebts:     ()                      => request("GET",    "/debts"),
  createDebt:   (debt)                  => request("POST",   "/debts",         debt),
  updateDebt:   (id, updates)           => request("PUT",    `/debts/${id}`,   updates),
  deleteDebt:   (id)                    => request("DELETE", `/debts/${id}`),
  payInstallment:   (id)                => request("POST",   `/debts/${id}/pay`),
  getDebtPayments:  (id)                => request("GET",    `/debts/${id}/payments`),
  getSettings:  ()                      => request("GET",    "/settings"),
  saveSettings: (salary, cash_balance, effective_date) => request("PUT", "/settings", { salary, cash_balance, effective_date }),
  getAudit:          (limit = 100)                    => request("GET",    `/audit?limit=${limit}`),
  sendEmailReport:   (to, xlsxBase64, fileName, summary) => request("POST", "/email/send-report", { to, xlsxBase64, fileName, summary }),
};
