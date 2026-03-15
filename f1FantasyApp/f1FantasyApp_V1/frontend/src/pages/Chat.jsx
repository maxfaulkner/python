import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { getSession } from '../auth';
import Navbar from '../components/Navbar';

const QUICK_REACTIONS = ['👍', '🔥', '😭', '🏆', '😂', '👀', '🚀', '❤️'];

function Avatar({ name, color, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: color || '#e10600',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.38, color: '#fff',
      flexShrink: 0,
    }}>
      {name?.[0]?.toUpperCase()}
    </div>
  );
}

function ReactionBar({ reactions, messageId, leagueId, onReact, currentUserId }) {
  const grouped = {};
  for (const r of reactions) {
    if (!grouped[r.emoji]) grouped[r.emoji] = { count: 0, users: [], hasMe: false };
    grouped[r.emoji].count++;
    grouped[r.emoji].users.push(r.user.name);
    if (r.user.id === currentUserId) grouped[r.emoji].hasMe = true;
  }

  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
      {Object.entries(grouped).map(([emoji, data]) => (
        <button
          key={emoji}
          onClick={() => onReact(messageId, emoji)}
          title={data.users.join(', ')}
          style={{
            background: data.hasMe ? 'rgba(225,6,0,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${data.hasMe ? 'rgba(225,6,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 12, padding: '2px 8px', cursor: 'pointer',
            fontSize: 13, color: '#fff', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {emoji} <span style={{ fontSize: 11, opacity: 0.8 }}>{data.count}</span>
        </button>
      ))}
    </div>
  );
}

function Message({ msg, currentUserId, leagueId, onReact, onDelete, onReply, onPin, isCommissioner }) {
  const [showActions, setShowActions] = useState(false);
  const [showQuickReact, setShowQuickReact] = useState(false);
  const isOwn = msg.userId === currentUserId;

  return (
    <div
      className="chat-message"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowQuickReact(false); }}
      style={{
        display: 'flex', gap: 10, padding: '8px 12px',
        borderRadius: 8, position: 'relative',
        background: msg.pinned ? 'rgba(225,6,0,0.06)' : 'transparent',
        borderLeft: msg.pinned ? '2px solid var(--red)' : '2px solid transparent',
        transition: 'background 0.15s',
      }}
    >
      <Avatar name={msg.user.name} color={msg.user.avatarColor} size={34} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: isOwn ? 'var(--red)' : '#fff' }}>
            {msg.user.name}
          </span>
          {msg.pinned && (
            <span style={{ fontSize: 10, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 1 }}>
              📌 pinned
            </span>
          )}
          <span style={{ fontSize: 11, opacity: 0.4, marginLeft: 'auto' }}>
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {msg.replyTo && (
          <div style={{
            background: 'rgba(255,255,255,0.05)', borderLeft: '2px solid rgba(255,255,255,0.2)',
            borderRadius: 4, padding: '3px 8px', marginBottom: 4, fontSize: 12, opacity: 0.6,
          }}>
            <span style={{ fontWeight: 600 }}>{msg.replyTo.user.name}: </span>
            {msg.replyTo.content.substring(0, 80)}{msg.replyTo.content.length > 80 ? '…' : ''}
          </div>
        )}

        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.9)', wordBreak: 'break-word' }}>
          {msg.content}
        </p>

        {msg.reactions?.length > 0 && (
          <ReactionBar
            reactions={msg.reactions}
            messageId={msg.id}
            leagueId={leagueId}
            onReact={onReact}
            currentUserId={currentUserId}
          />
        )}
      </div>

      {showActions && (
        <div style={{
          position: 'absolute', right: 8, top: 6,
          display: 'flex', gap: 4,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '3px 6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowQuickReact(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '2px 4px' }}
              title="React"
            >😊</button>
            {showQuickReact && (
              <div style={{
                position: 'absolute', bottom: '100%', right: 0,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 8, padding: 6, display: 'flex', gap: 4, flexWrap: 'wrap',
                width: 160, boxShadow: '0 4px 12px rgba(0,0,0,0.4)', zIndex: 10,
              }}>
                {QUICK_REACTIONS.map(e => (
                  <button
                    key={e}
                    onClick={() => { onReact(msg.id, e); setShowQuickReact(false); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 3 }}
                  >{e}</button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onReply(msg)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: '2px 4px', color: '#aaa' }}
            title="Reply"
          >↩</button>

          {(isOwn || isCommissioner) && (
            <button
              onClick={() => onDelete(msg.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: '2px 4px', color: '#e10600' }}
              title="Delete"
            >✕</button>
          )}

          {isCommissioner && (
            <button
              onClick={() => onPin(msg.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: '2px 4px', color: '#aaa' }}
              title={msg.pinned ? 'Unpin' : 'Pin'}
            >📌</button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Chat() {
  const { leagueId } = useParams();
  const { id: currentUserId } = getSession();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [leagueName, setLeagueName] = useState('');
  const [isCommissioner, setIsCommissioner] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const pollRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const data = await api.getChat(leagueId, 100);
      setMessages(data);
    } catch (e) {
      console.error('Chat load error:', e);
    }
  }, [leagueId]);

  useEffect(() => {
    // Load league name + membership
    api.getLeagues().then(leagues => {
      const l = leagues.find(l => l.id === leagueId);
      if (l) setLeagueName(l.name);
    }).catch(() => {});

    api.getLeagueMembers(leagueId).then(members => {
      const me = members.find(m => m.userId === currentUserId);
      if (me?.role === 'commissioner') setIsCommissioner(true);
    }).catch(() => {});

    setLoading(true);
    loadMessages().finally(() => setLoading(false));

    // Poll for new messages every 8s
    pollRef.current = setInterval(loadMessages, 8000);
    return () => clearInterval(pollRef.current);
  }, [leagueId, currentUserId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const msg = await api.sendMessage(leagueId, input.trim(), replyTo?.id || null);
      setMessages(prev => [...prev, msg]);
      setInput('');
      setReplyTo(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  };

  const handleReact = async (msgId, emoji) => {
    try {
      await api.reactToMessage(leagueId, msgId, emoji);
      await loadMessages();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (msgId) => {
    if (!confirm('Delete this message?')) return;
    try {
      await api.deleteMessage(leagueId, msgId);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (e) {
      alert(e.message);
    }
  };

  const handlePin = async (msgId) => {
    try {
      await api.pinMessage(leagueId, msgId);
      await loadMessages();
    } catch (e) {
      alert(e.message);
    }
  };

  const pinnedMessages = messages.filter(m => m.pinned);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', padding: '0 16px 16px' }}>
        {/* Header */}
        <div style={{ padding: '20px 0 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)' }}>
          <Link to="/leagues" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontSize: 13 }}>← Back</Link>
          <div>
            <div style={{ fontSize: 11, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'var(--font-display)' }}>
              {leagueName}
            </div>
            <h1 style={{ margin: 0, fontSize: 22, fontFamily: 'var(--font-display)', color: '#fff' }}>League Chat</h1>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            Auto-refreshes every 8s
          </div>
        </div>

        {/* Pinned messages */}
        {pinnedMessages.length > 0 && (
          <div style={{ margin: '12px 0', background: 'rgba(225,6,0,0.06)', border: '1px solid rgba(225,6,0,0.2)', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ fontSize: 10, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>📌 Pinned</div>
            {pinnedMessages.map(m => (
              <div key={m.id} style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>
                <span style={{ fontWeight: 600, color: '#fff' }}>{m.user.name}: </span>{m.content}
              </div>
            ))}
          </div>
        )}

        {/* Messages area */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '8px 0', minHeight: 400, maxHeight: 'calc(100vh - 320px)',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
              Loading chat...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 16, marginBottom: 6 }}>No messages yet</div>
              <div style={{ fontSize: 13 }}>Be the first to say something!</div>
            </div>
          ) : (
            messages.map(msg => (
              <Message
                key={msg.id}
                msg={msg}
                currentUserId={currentUserId}
                leagueId={leagueId}
                onReact={handleReact}
                onDelete={handleDelete}
                onReply={(m) => { setReplyTo(m); inputRef.current?.focus(); }}
                onPin={handlePin}
                isCommissioner={isCommissioner}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Reply preview */}
        {replyTo && (
          <div style={{
            background: 'rgba(255,255,255,0.05)', borderLeft: '2px solid var(--red)',
            borderRadius: 4, padding: '6px 12px', marginBottom: 4, fontSize: 12,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>
              Replying to <strong style={{ color: '#fff' }}>{replyTo.user.name}</strong>: {replyTo.content.substring(0, 60)}
            </span>
            <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e10600', fontSize: 16 }}>✕</button>
          </div>
        )}

        {/* Input */}
        <div style={{
          display: 'flex', gap: 8, padding: '12px 0 0',
          borderTop: '1px solid var(--border)',
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Type a message... (Enter to send)"
            maxLength={1000}
            style={{
              flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14,
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            style={{
              background: input.trim() && !sending ? 'var(--red)' : 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: 8, padding: '10px 20px',
              color: '#fff', fontWeight: 700, cursor: input.trim() && !sending ? 'pointer' : 'default',
              fontSize: 14, transition: 'all 0.2s',
            }}
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>

        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
          {input.length}/1000 · Hover messages to react, reply, or delete
        </div>
      </div>
    </div>
  );
}
