// Sidebar.jsx
function Sidebar({ active, onNavigate }) {
  const Item = ({ id, icon, label, badge }) => (
    <div className={`sidebar-item ${active === id ? "active" : ""}`} onClick={() => onNavigate(id)}>
      <i data-lucide={icon} className="ico"></i>
      <span>{label}</span>
      {badge ? <span className="badge">{badge}</span> : null}
    </div>
  );
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={window.__resources.markSvg} width="28" height="28" alt="" />
        <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>
          Avi<span style={{ color: "#2dd4bf" }}>Learn</span>
        </div>
      </div>
      <div className="sidebar-section">Console</div>
      <div className="sidebar-nav">
        <Item id="dashboard" icon="layout-dashboard" label="Dashboard" />
        <Item id="schedule" icon="calendar" label="Schedule" badge="3" />
        <Item id="roster" icon="users" label="Roster" badge="47" />
        <Item id="courses" icon="book-open" label="Courses" />
        <Item id="grades" icon="clipboard-check" label="Grades" badge="9" />
      </div>
      <div className="sidebar-section">Apps</div>
      <div className="sidebar-nav">
        <Item id="chat" icon="message-square" label="Chat" />
        <Item id="mail" icon="mail" label="Mailbox" />
        <Item id="reports" icon="bar-chart-3" label="Reports" />
      </div>
      <div className="sidebar-section">Operations</div>
      <div className="sidebar-nav">
        <Item id="aircraft" icon="plane" label="Aircraft" />
        <Item id="weather" icon="cloud" label="Weather" />
        <Item id="settings" icon="settings" label="Settings" />
      </div>
      <div className="sidebar-foot">
        <i data-lucide="info" style={{ width: 14, height: 14 }}></i>
        v2.4.1 · last sync 2 min ago
      </div>
    </aside>
  );
}
window.Sidebar = Sidebar;
