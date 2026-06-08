export const TH = {
  dark: {
    bg:"#060C18", surface:"#0D1526", card:"#111E33",
    border:"#1A2840", text:"#EDF2FF", muted:"#7B8FA6",
    primary:"#6366F1", primaryDim:"#6366F120",
    success:"#10B981", warning:"#F59E0B", danger:"#EF4444",
    accent:"#0EA5E9", accentDim:"#0EA5E915",
  },
  light: {
    bg:"#F0F4F8", surface:"#FFFFFF", card:"#FFFFFF",
    border:"#E2E8F0", text:"#0F172A", muted:"#64748B",
    primary:"#6366F1", primaryDim:"#6366F115",
    success:"#10B981", warning:"#F59E0B", danger:"#EF4444",
    accent:"#0EA5E9", accentDim:"#0EA5E915",
  },
};

export const SALARY = 0;

export const STATUS_CFG = {
  active:      { label:"Ativa",       color:"#0EA5E9", bg:"#0EA5E912" },
  urgent:      { label:"Urgente",     color:"#EF4444", bg:"#EF444412" },
  overdue:     { label:"Atrasada",    color:"#EF4444", bg:"#EF444412" },
  negotiating: { label:"Negociando",  color:"#F59E0B", bg:"#F59E0B12" },
  paused:      { label:"Pausada",     color:"#8B5CF6", bg:"#8B5CF612" },
  paid:        { label:"Quitada",     color:"#10B981", bg:"#10B98112" },
};

export const MENU = [
  { id:"dashboard",    label:"Dashboard",     icon:"⊞" },
  { id:"dividas",      label:"Dívidas",       icon:"⬡" },
  { id:"planejamento", label:"Planejamento",  icon:"◈" },
  { id:"inteligencia", label:"Inteligência",  icon:"◎" },
  { id:"relatorios",   label:"Relatórios",    icon:"◫" },
  { id:"auditoria",    label:"Auditoria",     icon:"◷" },
];

export const PIE_COLORS = ["#6366F1","#10B981","#F59E0B","#EF4444","#0EA5E9","#8B5CF6","#EC4899"];

export const fmt  = n => `R$ ${Number(n).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
export const fmtK = n => n >= 1000 ? `R$ ${(n/1000).toFixed(1)}k` : fmt(n);
