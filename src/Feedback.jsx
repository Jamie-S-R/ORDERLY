import React, { useState } from 'react';

const Feedback = () => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const subject = encodeURIComponent('ORDERLY Feedback');
    const body = encodeURIComponent(text);
    window.location.href = `mailto:Jamie.Roesler@tuhh.de?subject=${subject}&body=${body}`;
  };

  return (
    <div className="detail-view">
      <h2>💬 Feedback geben</h2>
      <p>Wir freuen uns über deine Meinung, Verbesserungsvorschläge oder Fehlerberichte!</p>
      <form onSubmit={handleSubmit}>
        <label>
          <textarea
            rows="8"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Was möchtest du uns mitteilen?"
            required
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#1f1f1f',
              color: '#f0f0f0',
              border: '1px solid #444',
              borderRadius: '8px',
              resize: 'vertical',
              marginBottom: '1rem',
              fontSize: '16px',
            }}
          />
        </label>
        <br />
        <button type="submit">Mail öffnen</button>
      </form>
      <p style={{ marginTop: '2rem', fontSize: '14px', color: '#ccc' }}>
        Kontakt: <a href="mailto:Jamie.Roesler@tuhh.de" className="email-link">Jamie Rösler</a>
      </p>
    </div>
  );
};

export default Feedback;
