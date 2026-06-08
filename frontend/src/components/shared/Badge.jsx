import { STATUS_CFG } from "../../constants.js";

export function Badge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.active;
  return (
    <span style={{
      fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:20,
      color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.color}30`,
      whiteSpace:"nowrap",
    }}>{cfg.label}</span>
  );
}
