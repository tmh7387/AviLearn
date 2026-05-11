'use client';

import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Plus, Phone, Video, MoreVertical, Paperclip } from 'lucide-react';

const CONTACTS = [
  { name: 'Mayra Sibley', preview: "Perfect. I'll let the DPE know…", when: '09:31', seed: 2 },
  { name: 'Sarah Kortney', preview: 'Pre-flight checklist attached.', when: '08:14', seed: 0 },
  { name: 'Tommy Nash', preview: 'On my way to the FBO.', when: 'Yesterday', seed: 1 },
  { name: 'Kathryn Mengel', preview: 'Cross-country plan v2 ready.', when: 'Yesterday', seed: 4 },
  { name: 'Williemae Lagasse', preview: 'Reschedule for Thursday OK?', when: 'Mon', seed: 5 },
  { name: 'Tyler Brun', preview: 'ATPL theory exam done.', when: 'Mon', seed: 0 },
];

const EVENTS = [
  { day: '8 Mar', what: 'Cohort A · Aviation weather seminar' },
  { day: '9 Mar', what: 'Mayra · checkride (DPE: J. Coelho)' },
  { day: '10 Mar', what: 'ITone meeting · ground school sync' },
  { day: '11 Mar', what: 'Sarah · solo cross-country, KSFO → KSAC' },
  { day: '28 Mar', what: 'Cohort B · Navigation block opens' },
];

const INITIAL_MESSAGES = [
  { from: 'them', who: 'Mayra Sibley', when: '09:25', text: 'What do you think about pushing the checkride to next Tuesday? Forecast is calling for crosswind today.' },
  { from: 'me', who: 'You', when: '09:28', text: "Agreed — let's move it to Tuesday 14:00. Brief at 13:30." },
  { from: 'them', who: 'Mayra Sibley', when: '09:31', text: "Perfect. I'll let the DPE know and re-book the aircraft." },
  { from: 'me', who: 'You', when: '09:32', text: 'Take N1456C — N1234A is in for the 100-hour.' },
];

export default function ChatPage() {
  const [active, setActive] = useState(0);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [draft, setDraft] = useState('');

  function send() {
    const t = draft.trim();
    if (!t) return;
    setMessages([...messages, { from: 'me', who: 'You', when: 'now', text: t }]);
    setDraft('');
  }

  return (
    <>
      <div className="page-title">
        <div>
          <h1>Chat</h1>
          <div className="sub">Direct messages with students and instructors</div>
        </div>
        <button className="btn btn-primary"><Plus size={14} /> New message</button>
      </div>

      <div className="chat-shell">
        {/* Contact list */}
        <div className="chat-list">
          <div className="chat-list-head">
            <input placeholder="Search messages" />
          </div>
          <div style={{ overflowY: 'auto' }}>
            {CONTACTS.map((c, i) => (
              <div key={i} className={`chat-row ${i === active ? 'active' : ''}`} onClick={() => setActive(i)}>
                <Avatar name={c.name} seed={c.seed} />
                <div className="meta">
                  <div className="top"><span className="name">{c.name}</span><span className="when">{c.when}</span></div>
                  <div className="preview">{c.preview}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message pane */}
        <div className="chat-pane">
          <div className="chat-head">
            <Avatar name={CONTACTS[active].name} seed={CONTACTS[active].seed} />
            <div className="who">
              <h3>{CONTACTS[active].name}</h3>
              <div className="status">Active · last seen 2 min ago</div>
            </div>
            <div className="actions">
              <button className="icon-btn" title="Call"><Phone size={16} /></button>
              <button className="icon-btn" title="Video"><Video size={16} /></button>
              <button className="icon-btn" title="More"><MoreVertical size={16} /></button>
            </div>
          </div>

          <div className="chat-stream">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.from === 'me' ? 'me' : ''}`}>
                <Avatar name={m.who} size="sm" seed={m.from === 'me' ? 2 : CONTACTS[active].seed} />
                <div className="body">
                  <div className="head"><span className="name">{m.who}</span><span className="when">{m.when}</span></div>
                  <div className={`bubble ${m.from === 'me' ? 'mine' : 'them'}`}>{m.text}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="chat-composer">
            <button className="icon-btn" title="Attach"><Paperclip size={16} /></button>
            <input
              placeholder={`Message ${CONTACTS[active].name}…`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button className="btn btn-primary" onClick={send}>Send</button>
          </div>
        </div>

        {/* Events sidebar */}
        <div className="chat-side">
          <h4>My events</h4>
          {EVENTS.map((e, i) => (
            <div className="event-item" key={i}>
              <div className="day">{e.day}</div>
              <div className="what">{e.what}</div>
            </div>
          ))}
          <button className="btn btn-outline" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>Add event</button>
        </div>
      </div>
    </>
  );
}
