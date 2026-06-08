/**
 * Ícone SVG inline da marca FinanceOS.
 * size: largura/altura do ícone (px)
 * showText: mostra "Finance OS" ao lado ou abaixo do ícone
 * layout: "row" | "col"
 */
export function BrandLogo({ size = 48, showText = false, layout = "col", tagline = false, textColor = "#EDF2FF", accentColor = "#818CF8", mutedColor = "#7B8FA6" }) {
  const icon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 128 128"
      width={size}
      height={size}
      style={{ borderRadius: size * 0.2, flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="fosGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366F1"/>
          <stop offset="100%" stopColor="#3730A3"/>
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="26" fill="url(#fosGrad)"/>
      <rect x="22" y="84" width="14" height="22" rx="3" fill="white" opacity="0.55"/>
      <rect x="42" y="66" width="14" height="40" rx="3" fill="white" opacity="0.7"/>
      <rect x="62" y="50" width="14" height="56" rx="3" fill="white" opacity="0.85"/>
      <polyline points="29,78 49,60 69,46 95,26" fill="none" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="80,22 95,26 91,41"     fill="none" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  if (!showText) return icon;

  const isRow  = layout === "row";
  const fs     = isRow ? Math.round(size * 0.52) : Math.round(size * 0.48);
  const tagFs  = isRow ? Math.round(size * 0.22) : Math.round(size * 0.2);

  return (
    <div style={{
      display: "flex",
      flexDirection: isRow ? "row" : "column",
      alignItems: "center",
      gap: isRow ? Math.round(size * 0.28) : Math.round(size * 0.18),
    }}>
      {icon}
      <div style={{ textAlign: isRow ? "left" : "center" }}>
        <div style={{ fontSize: fs, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.5px" }}>
          <span style={{ color: textColor }}>Finance</span>
          <span style={{ color: accentColor }}>OS</span>
        </div>
        {tagline && (
          <div style={{
            fontSize: tagFs,
            color: mutedColor,
            marginTop: isRow ? 3 : 5,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            fontWeight: 500,
          }}>
            Sistema de Gestão Financeira
          </div>
        )}
      </div>
    </div>
  );
}
