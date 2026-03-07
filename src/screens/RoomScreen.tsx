type RoomScreenProps = {
  roomInput: string;
  keyValue: string;
  onRoomChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
};

export default function RoomScreen({ roomInput, keyValue, onRoomChange, onSubmit }: RoomScreenProps) {
  return (
    <main className="terminal-shell">
      <section className="auth-card">
        <p className="prompt">$ secret-chat --join</p>
        <h1>Select Room</h1>
        <p className="hint">
          Logged in as <strong>{keyValue}</strong>. Enter the room id to join chat.
        </p>
        <form onSubmit={onSubmit}>
          <label htmlFor="room-input">Room ID</label>
          <input
            id="room-input"
            value={roomInput}
            onChange={(e) => onRoomChange(e.target.value)}
            placeholder="e.g. team-room-7"
            autoComplete="off"
          />
          <button type="submit">Join Room</button>
        </form>
      </section>
    </main>
  );
}
