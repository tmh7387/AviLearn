// Header.jsx
function Header({ crumb }) {
  return (
    <header className="header">
      <div className="crumb">
        <span>AviLearn</span>
        <span style={{ color: "var(--fg-3)" }}>›</span>
        <span className="now">{crumb}</span>
      </div>
      <div className="search">
        <i data-lucide="search" className="ico"></i>
        <input placeholder="Search students, lessons, aircraft…" />
      </div>
      <button className="icon-btn" title="Notifications">
        <i data-lucide="bell" style={{ width: 18, height: 18 }}></i>
        <span className="dot"></span>
      </button>
      <button className="icon-btn" title="Help">
        <i data-lucide="help-circle" style={{ width: 18, height: 18 }}></i>
      </button>
      <div className="user-chip">
        <Avatar name="Anne Clarc" seed={2} />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span className="name">Anne Clarc</span>
          <span className="role">Chief instructor</span>
        </div>
      </div>
    </header>
  );
}
window.Header = Header;
