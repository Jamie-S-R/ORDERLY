import React, { useState } from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import './App.css';

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <Router>
      <div className="app">
        <div className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
          <button onClick={toggleMenu}>☰</button>
          <ul className="sidebar-main">
            <li><Link to="/">Startseite</Link></li>
            <li><Link to="/orderlog">Bestelllog</Link></li>
            <li><Link to="/inventory">Bestand</Link></li>
            <li><Link to="/stock-history">Lagerverlauf</Link></li>
            <li><Link to="/stock-comparison">Soll/Ist Lager</Link></li>
            <li><Link to="/finance">Finanzdaten</Link></li>
            <li><Link to="/delivery-reliability">Liefertermintreue</Link></li>
            <li><Link to="/returns">Retouren</Link></li>
            <li><Link to="/delivery-bottlenecks">Lieferengpässe</Link></li>
            <li><Link to="/supplier-rating">Lieferantenbewertung</Link></li>
            <li><Link to="/feedback">Feedback</Link></li>
          </ul>
        </div>

        <div className="main-content">
          <Switch>
            <Route path="/" exact component={Home} />
            <Route path="/orderlog" component={OrderLog} />
            <Route path="/inventory" component={Inventory} />
            <Route path="/stock-history" component={StockHistory} />
            <Route path="/stock-comparison" component={StockComparison} />
            <Route path="/finance" component={FinanceOverview} />
            <Route path="/delivery-reliability" component={DeliveryReliability} />
            <Route path="/returns" component={Returns} />
            <Route path="/delivery-bottlenecks" component={DeliveryBottlenecks} />
            <Route path="/supplier-rating" component={SupplierRating} />
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

function StockHistory() {
  return (
    <div className="detail-view">
      <h2>Lagerbestandsverlauf</h2>
      <p>Filter nach:</p>
      <input type="text" placeholder="Kunde" />
      <input type="text" placeholder="Produkt" />
      <input type="date" />
      <div className="graph-placeholder">Graph: Verlauf nach Datum (Platzhalter)</div>
    </div>
  );
}

function StockComparison() {
  return (
    <div className="detail-view">
      <h2>Soll vs. Ist-Bestand</h2>
      <p>Produktvergleich bezogen auf Ein- und Ausgänge</p>
      <div className="graph-placeholder">Vergleichs-Chart (Platzhalter)</div>
    </div>
  );
}

function FinanceOverview() {
  return (
    <div className="detail-view">
      <h2>Finanzübersicht</h2>
      <p>Gesamtumsatz des Lagers (value), Soll und Ist</p>
      <div className="graph-placeholder">Umsatzdaten-Visualisierung</div>
    </div>
  );
}

function DeliveryReliability() {
  return (
    <div className="detail-view">
      <h2>Liefertermintreue</h2>
      <p>Auswertung basierend auf Excel-Vorbild (z.B. % termingerechte Lieferungen)</p>
      <div className="graph-placeholder">Balkendiagramm: Termintreue</div>
    </div>
  );
}

function Returns() {
  return (
    <div className="detail-view">
      <h2>Retourenübersicht</h2>
      <p>Analyse und Visualisierung der Rücksendungen</p>
      <div className="graph-placeholder">Retouren-Diagramm (Platzhalter)</div>
    </div>
  );
}

function DeliveryBottlenecks() {
  return (
    <div className="detail-view">
      <h2>Lieferengpässe</h2>
      <p>Filter nach Kunde und Monat</p>
      <input type="text" placeholder="Kunde" />
      <input type="month" />
      <div className="graph-placeholder">Engpass-Zeitleiste (Platzhalter)</div>
    </div>
  );
}

function SupplierRating() {
  return (
    <div className="detail-view">
      <h2>Lieferantenbewertung & Kundenzufriedenheit</h2>
      <p>Basierend auf Lieferengpässen und Termintreue</p>
      <div className="graph-placeholder">Scorecard: Lieferanten</div>
    </div>
  );
}

export default App;
