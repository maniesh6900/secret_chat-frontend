type AuthScreenProps = {
  loginKeyInput: string;
  onKeyChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
};

export default function AuthScreen({ loginKeyInput, onKeyChange, onSubmit }: AuthScreenProps) {
  return (
    <main className="terminal-shell">
      <section className="auth-card">
        <p className="prompt">$ secret-chat --login</p>
        <h1>Enter Your Key</h1>
        <p className="hint">Choose any unique string. This acts as your username.</p>
        <form onSubmit={onSubmit}>
          <label htmlFor="key-input">Key</label>
          <input
            id="key-input"
            value={loginKeyInput}
            onChange={(e) => onKeyChange(e.target.value)}
            placeholder="e.g. alice_21"
            autoComplete="off"
          />
          <button type="submit">Continue</button>
        </form>
      </section>
    </main>
  );
}
