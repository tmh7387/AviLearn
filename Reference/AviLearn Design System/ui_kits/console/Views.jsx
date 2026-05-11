// Views.jsx — page-level views composed from primitives
function Pill({ kind = "neutral", children }) {
  return <span className={`pill pill-${kind}`}>{children}</span>;
}
function TagPill({ kind = "neutral", children }) {
  return <span className={`pill tag pill-${kind}`}>{children}</span>;
}

// ------------------- DASHBOARD -------------------
function DashboardView() {
  const kpis = [
    { label: "Active students", value: "47", delta: "+3 this week", kind: "" },
    { label: "Hours logged", value: "142.7", delta: "↗ +8.4 vs last week", kind: "k-info" },
    { label: "Pending grades", value: "9", delta: "Oldest 3 days", kind: "k-warn" },
    { label: "Aircraft AOG", value: "1", delta: "N1234A · scheduled return Wed", kind: "k-danger" },
  ];
  const lessons = [
    { n: "01", title: "Principles of flight", sub: "PPL · Module 1", pct: 100 },
    { n: "02", title: "Aircraft systems", sub: "PPL · Module 2", pct: 100 },
    { n: "03", title: "Aerodynamics & loads", sub: "PPL · Module 3", pct: 78 },
    { n: "04", title: "Aviation weather", sub: "PPL · Module 4", pct: 42 },
    { n: "05", title: "Navigation", sub: "PPL · Module 5", pct: 12 },
    { n: "06", title: "Flight rules & regulations", sub: "PPL · Module 6", pct: 0 },
  ];
  const activity = [
    { who: "Sarah Kortney", text: "submitted quiz · Aerodynamics & loads", when: "2 min ago", seed: 0 },
    { who: "Tommy Nash", text: "logged 1.4 hr in N1234A", when: "18 min ago", seed: 1 },
    { who: "Mayra Sibley", text: "requested re-schedule for checkride", when: "1 hr ago", seed: 2 },
    { who: "Williemae Lagasse", text: "completed module · Aircraft systems", when: "3 hr ago", seed: 3 },
    { who: "Kathryn Mengel", text: "uploaded cross-country plan", when: "Today 09:14", seed: 4 },
  ];
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Welcome back, Anne</h1>
          <div className="sub">3 lessons need grading · 1 aircraft AOG · clear weather at KSFO</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary"><i data-lucide="download" style={{ width: 14, height: 14 }}></i> Export</button>
          <button className="btn btn-primary"><i data-lucide="plus" style={{ width: 14, height: 14 }}></i> Schedule lesson</button>
        </div>
      </div>

      <div className="kpi-strip">
        {kpis.map((k, i) => (
          <div key={i} className={`kpi ${k.kind}`}>
            <div className="label">{k.label}</div>
            <div className="value">{k.value}</div>
            <div className="delta">{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="stack">
          <div className="card">
            <div className="card-head">
              <h3>PPL ground school · Cohort A</h3>
              <span className="eye">9 of 24 modules complete</span>
            </div>
            <div>
              {lessons.map((l, i) => (
                <div className="lesson" key={i}>
                  <div className="num">{l.n}</div>
                  <div className="title">
                    <h4>{l.title}</h4>
                    <small>{l.sub}</small>
                  </div>
                  <div className="progress"><div className="bar" style={{ width: `${l.pct}%` }}></div></div>
                  <div className="pct">{l.pct}%</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Today's flights</h3>
              <button className="btn btn-ghost">View schedule</button>
            </div>
            <div style={{ overflow: "hidden", borderRadius: 6 }}>
              <table>
                <thead><tr>
                  <th>Slot</th><th>Student</th><th>Aircraft</th><th>Lesson</th><th>Status</th>
                </tr></thead>
                <tbody>
                  <tr><td className="cell-mono">08:00</td><td className="cell-name"><Avatar name="Sarah Kortney" size="sm" seed={0} /><div className="who">Sarah Kortney</div></td><td className="cell-mono">N1456C</td><td className="cell-muted">Cross-country · KSFO → KSAC</td><td><Pill kind="success">Active</Pill></td></tr>
                  <tr><td className="cell-mono">10:30</td><td className="cell-name"><Avatar name="Tommy Nash" size="sm" seed={1} /><div className="who">Tommy Nash</div></td><td className="cell-mono">N9912B</td><td className="cell-muted">Pattern work · KSFO</td><td><Pill kind="info">Scheduled</Pill></td></tr>
                  <tr><td className="cell-mono">13:00</td><td className="cell-name"><Avatar name="Mayra Sibley" size="sm" seed={2} /><div className="who">Mayra Sibley</div></td><td className="cell-mono">N1234A</td><td className="cell-muted">Checkride prep</td><td><Pill kind="warn">Pending</Pill></td></tr>
                  <tr><td className="cell-mono">15:30</td><td className="cell-name"><Avatar name="Kathryn Mengel" size="sm" seed={4} /><div className="who">Kathryn Mengel</div></td><td className="cell-mono">N1456C</td><td className="cell-muted">Stalls & slow flight</td><td><Pill kind="info">Scheduled</Pill></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-head"><h3>METAR · KSFO</h3><span className="eye">12:45 Z</span></div>
            <div className="card-body" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-2)", lineHeight: 1.7 }}>
              <span style={{ color: "var(--brand)" }}>KSFO 121245Z 27015KT 10SM</span> FEW035 BKN200 14/09 A3002<br />
              <span style={{ color: "var(--fg-3)" }}>RMK AO2 SLP168 T01390094</span>
              <div style={{ marginTop: 12, display: "flex", gap: 16, color: "var(--fg-1)", fontFamily: "var(--font-sans)" }}>
                <div><div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Wind</div><div style={{ fontWeight: 600 }}>270° / 15 kt</div></div>
                <div><div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Vis</div><div style={{ fontWeight: 600 }}>10 SM</div></div>
                <div><div style={{ fontSize: 11, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>Ceiling</div><div style={{ fontWeight: 600 }}>BKN 200</div></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Recent activity</h3><button className="btn btn-ghost">All</button></div>
            <div className="card-body">
              {activity.map((a, i) => (
                <div className="activity" key={i}>
                  <Avatar name={a.who} size="sm" seed={a.seed} />
                  <div style={{ flex: 1 }}>
                    <div className="text"><strong style={{ color: "var(--fg-1)" }}>{a.who}</strong> <span style={{ color: "var(--fg-2)" }}>{a.text}</span></div>
                    <div className="when">{a.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ------------------- ROSTER -------------------
function RosterView() {
  const rows = [
    { name: "Sarah Kortney", email: "sarah.k@avi.school", course: "PPL", hours: "28.4", status: "success", statusLabel: "Active", seed: 0 },
    { name: "Tommy Nash", email: "tommy.n@avi.school", course: "IFR", hours: "12.0", status: "warn", statusLabel: "Pending", seed: 1 },
    { name: "Mayra Sibley", email: "mayra.s@avi.school", course: "PPL", hours: "41.7", status: "success", statusLabel: "Active", seed: 2 },
    { name: "Kathryn Mengel", email: "kathryn.m@avi.school", course: "PPL", hours: "8.2", status: "info", statusLabel: "Scheduled", seed: 4 },
    { name: "Williemae Lagasse", email: "willie.l@avi.school", course: "Ground", hours: "0.0", status: "info", statusLabel: "Scheduled", seed: 5 },
    { name: "Tyler Brun", email: "tyler.b@avi.school", course: "ATPL", hours: "203.5", status: "success", statusLabel: "Active", seed: 0 },
    { name: "Luke Hadley", email: "luke.h@avi.school", course: "PPL", hours: "0.0", status: "danger", statusLabel: "Withdrawn", seed: 1 },
    { name: "Evan Brodeur", email: "evan.b@avi.school", course: "IFR", hours: "67.1", status: "success", statusLabel: "Active", seed: 2 },
  ];
  return (
    <>
      <div className="page-title">
        <div>
          <h1>Student roster</h1>
          <div className="sub">{rows.length} students · 6 active · 1 withdrawn</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary"><i data-lucide="filter" style={{ width: 14, height: 14 }}></i> Filter</button>
          <button className="btn btn-secondary"><i data-lucide="download" style={{ width: 14, height: 14 }}></i> Export</button>
          <button className="btn btn-primary"><i data-lucide="plus" style={{ width: 14, height: 14 }}></i> Add student</button>
        </div>
      </div>

      <div className="card">
        <div style={{ overflow: "hidden", borderTopLeftRadius: 6, borderTopRightRadius: 6 }}>
          <table>
            <thead>
              <tr><th>Student</th><th>Course</th><th>Hours</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="cell-name">
                    <Avatar name={r.name} seed={r.seed} />
                    <div className="who"><span>{r.name}</span><small>{r.email}</small></div>
                  </td>
                  <td><TagPill kind={r.course === "PPL" ? "brand" : "neutral"}>{r.course}</TagPill></td>
                  <td className="cell-mono">{r.hours}</td>
                  <td><Pill kind={r.status}>{r.statusLabel}</Pill></td>
                  <td style={{ textAlign: "right" }}>
                    <button className="icon-btn" title="More"><i data-lucide="more-horizontal" style={{ width: 16, height: 16 }}></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ------------------- CHAT -------------------
function ChatView() {
  const [active, setActive] = React.useState(0);
  const [messages, setMessages] = React.useState([
    { from: "them", who: "Mayra Sibley", when: "09:25", text: "What do you think about pushing the checkride to next Tuesday? Forecast is calling for crosswind today." },
    { from: "me", who: "You", when: "09:28", text: "Agreed — let's move it to Tuesday 14:00. Brief at 13:30." },
    { from: "them", who: "Mayra Sibley", when: "09:31", text: "Perfect. I'll let the DPE know and re-book the aircraft." },
    { from: "me", who: "You", when: "09:32", text: "Take N1456C — N1234A is in for the 100-hour." },
  ]);
  const [draft, setDraft] = React.useState("");

  const contacts = [
    { name: "Mayra Sibley", preview: "Perfect. I'll let the DPE know…", when: "09:31", seed: 2 },
    { name: "Sarah Kortney", preview: "Pre-flight checklist attached.", when: "08:14", seed: 0 },
    { name: "Tommy Nash", preview: "On my way to the FBO.", when: "Yesterday", seed: 1 },
    { name: "Kathryn Mengel", preview: "Cross-country plan v2 ready.", when: "Yesterday", seed: 4 },
    { name: "Williemae Lagasse", preview: "Reschedule for Thursday OK?", when: "Mon", seed: 5 },
    { name: "Tyler Brun", preview: "ATPL theory exam done.", when: "Mon", seed: 0 },
  ];

  const events = [
    { day: "8 Mar", what: "Cohort A · Aviation weather seminar" },
    { day: "9 Mar", what: "Mayra · checkride (DPE: J. Coelho)" },
    { day: "10 Mar", what: "ITone meeting · ground school sync" },
    { day: "11 Mar", what: "Sarah · solo cross-country, KSFO → KSAC" },
    { day: "28 Mar", what: "Cohort B · Navigation block opens" },
  ];

  function send() {
    const t = draft.trim();
    if (!t) return;
    setMessages([...messages, { from: "me", who: "You", when: "now", text: t }]);
    setDraft("");
  }

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Chat</h1>
          <div className="sub">Direct messages with students and instructors</div>
        </div>
        <button className="btn btn-primary"><i data-lucide="plus" style={{ width: 14, height: 14 }}></i> New message</button>
      </div>

      <div className="chat-shell">
        <div className="chat-list">
          <div className="chat-list-head">
            <input placeholder="Search messages" />
          </div>
          <div style={{ overflowY: "auto" }}>
            {contacts.map((c, i) => (
              <div key={i} className={`chat-row ${i === active ? "active" : ""}`} onClick={() => setActive(i)}>
                <Avatar name={c.name} seed={c.seed} />
                <div className="meta">
                  <div className="top"><span className="name">{c.name}</span><span className="when">{c.when}</span></div>
                  <div className="preview">{c.preview}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-pane">
          <div className="chat-head">
            <Avatar name={contacts[active].name} seed={contacts[active].seed} />
            <div className="who">
              <h3>{contacts[active].name}</h3>
              <div className="status">Active · last seen 2 min ago</div>
            </div>
            <div className="actions">
              <button className="icon-btn" title="Call"><i data-lucide="phone" style={{ width: 16, height: 16 }}></i></button>
              <button className="icon-btn" title="Video"><i data-lucide="video" style={{ width: 16, height: 16 }}></i></button>
              <button className="icon-btn" title="More"><i data-lucide="more-vertical" style={{ width: 16, height: 16 }}></i></button>
            </div>
          </div>

          <div className="chat-stream">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.from === "me" ? "me" : ""}`}>
                <Avatar name={m.who} size="sm" seed={m.from === "me" ? 2 : contacts[active].seed} />
                <div className="body">
                  <div className="head"><span className="name">{m.who}</span><span className="when">{m.when}</span></div>
                  <div className={`bubble ${m.from === "me" ? "me" : "them"}`}>{m.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="chat-composer">
            <button className="icon-btn" title="Attach"><i data-lucide="paperclip" style={{ width: 16, height: 16 }}></i></button>
            <input
              placeholder="Message Mayra…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button className="btn btn-primary" onClick={send}>Send</button>
          </div>
        </div>

        <div className="chat-side">
          <h4>My events</h4>
          {events.map((e, i) => (
            <div className="event-item" key={i}>
              <div className="day">{e.day}</div>
              <div className="what">{e.what}</div>
            </div>
          ))}
          <button className="btn btn-outline" style={{ marginTop: 12, width: "100%", justifyContent: "center" }}>Add event</button>
        </div>
      </div>
    </>
  );
}

window.DashboardView = DashboardView;
window.RosterView = RosterView;
window.ChatView = ChatView;
window.Pill = Pill;
window.TagPill = TagPill;
