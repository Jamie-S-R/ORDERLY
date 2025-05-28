import React, { useState } from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import './App.css';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <Router>
      <div className="app">
        <div className={`sidebar ${menuOpen ? 'open' : ''}`}>
          <button onClick={toggleMenu}>☰</button>
          <ul>
            <li><Link to="/">Startseite</Link></li>
            <li><Link to="/orderlog">Bestelllog</Link></li>
            <li><Link to="/inventory">Bestand</Link></li>
            <li><Link to="/feedback">Feedback</Link></li>
          </ul>
        </div>
        <div className="main-content">
          <Switch>
            <Route path="/" exact component={Home} />
            <Route path="/orderlog" component={OrderLog} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/feedback" component={Feedback} />
          </Switch>
        </div>
      </div>
    </Router>
  );
}

function Home() {
  return (
    <div className="home">
      <h1>Startseite</h1>
      <div className="graph-placeholder">Graph: Bestellverläufe (Platzhalter)</div>
      <h2>Bestellhistorie</h2>
      <ul className="order-list">
        <li>Bestellung #1 - 10.10.2023</li>
        <li>Bestellung #2 - 11.10.2023</li>
        <li>Bestellung #3 - 12.10.2023</li>
      </ul>
    </div>
  );
}

function OrderLog() {
  return <h1>Bestelllog (vollständige Liste hier)</h1>;
}

function Inventory() {
  return <h1>Bestand</h1>;
}

function Feedback() {
  return <h1>Feedback</h1>;
}

export default App;