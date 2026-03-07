import type { ChatMessage, ConnectionState, User } from "../types/chat";

type ChatScreenProps = {
  roomid: string;
  keyValue: string;
  connection: ConnectionState;
  statusLabel: string;
  users: User[];
  messages: ChatMessage[];
  error: string;
  text: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onClear: () => void;
  onLogout: () => void;
  onTextChange: (value: string) => void;
  onSend: () => void;
};

export default function ChatScreen({
  roomid,
  keyValue,
  connection,
  statusLabel,
  users,
  messages,
  error,
  text,
  messagesEndRef,
  onClear,
  onLogout,
  onTextChange,
  onSend,
}: ChatScreenProps) {
  return (
    <main className="terminal-shell">
      <section className="chat-terminal">
        <header className="terminal-header">
          <div>
            <p className="prompt">$ secret-chat --room {roomid}</p>
            <h2>
              user: {keyValue} <span className={`status ${connection}`}>[{statusLabel}]</span>
            </h2>
          </div>
          <div className="header-actions">
            <button type="button" onClick={onClear}>
              clear
            </button>
            <button type="button" onClick={onLogout}>
              logout
            </button>
          </div>
        </header>

        <div className="terminal-body">
          <aside className="users-panel">
            <p>Active Users ({users.length})</p>
            {users.length === 0 ? (
              <span className="muted">No users listed yet.</span>
            ) : (
              users.map((user) => (
                <div className="user-line" key={user.key}>
                  &gt; {user.key}
                </div>
              ))
            )}
          </aside>

          <section className="messages-panel">
            {messages.length === 0 ? (
              <p className="muted">No messages yet.</p>
            ) : (
              messages.map((msg) => (
                <article className={`line ${msg.system ? "system" : "chat"}`} key={msg.id}>
                  <span className="time">{msg.time}</span>
                  <span className="sender">{msg.sender}</span>
                  <span className="body">{msg.text}</span>
                </article>
              ))
            )}
            <div ref={messagesEndRef} />
          </section>
        </div>

        {error ? <p className="error-line">! {error}</p> : null}

        <footer className="input-row">
          <span>&gt;</span>
          <input
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Type message and press Enter"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <button type="button" onClick={onSend}>
            send
          </button>
        </footer>
      </section>
    </main>
  );
}
