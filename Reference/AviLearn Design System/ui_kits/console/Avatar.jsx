// Avatar.jsx — gradient circle with initials
function Avatar({ name = "?", size = "md", seed = 0 }) {
  const palettes = [
    ["#2dd4bf", "#3b82f6"],
    ["#8b5cf6", "#ec4899"],
    ["#f59e0b", "#ef4444"],
    ["#22c55e", "#2dd4bf"],
    ["#3b82f6", "#8b5cf6"],
    ["#ec4899", "#f59e0b"],
  ];
  const i = (typeof seed === "number" ? seed : (name.charCodeAt(0) || 0)) % palettes.length;
  const [a, b] = palettes[i];
  const initials = name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className={`avatar ${size}`} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}>
      {initials}
    </div>
  );
}

window.Avatar = Avatar;
