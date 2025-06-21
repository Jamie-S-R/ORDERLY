// App.js
import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams
} from 'react-router-dom';
import Papa from 'papaparse';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './App.css';
import Sidebar from './Sidebar';
import Retouren from './Retouren';
import Lagerverlauf from './Lagerverlauf';
import Engpaesse from './Engpaesse';
import Finanzen from './Finanzen';
import Lieferantenbewertung from './Lieferantenbewertung';
import Tutorial from './Tutorial';
import Termintreue from './Termintreue';
import Automatisierung from './Automatisierung';
import Feedback from './Feedback';
import Help from './Help';
import LagerverlaufPreview from './previews/LagerverlaufPreview';
import TermintreuePreview from './previews/TermintreuePreview';
import RetourenPreview from './previews/RetourenPreview';
import BewertungPreview from './previews/RadarBewertungPreview';
import AutomatisierungPreview from './previews/AutomatisierungPreview';
import BarcodeScanner from './BarcodeScanner';
import InvoiceScanner from './InvoiceScanner';



const parseCSV = async (filePath, idField) =>
  new Promise((resolve) => {
    Papa.parse(filePath, {
      download: true,
      header: true,
      complete: (results) => {
        const cleaned = results.data.filter(row => row[idField]);
        resolve(cleaned);
      }
    });
  });

const generateMonthlyData = (orders, outputs) => {
  const monthlyData = {};
  const getMonth = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date) ? null : date.toISOString().slice(0, 7);
  };

  orders.forEach(o => {
    const month = getMonth(o.Bestelldatum);
    if (!month) return;
    const menge = parseFloat(o.Menge) || 0;
    monthlyData[month] = monthlyData[month] || { month, Bestellungen: 0, Ausgänge: 0 };
    monthlyData[month].Bestellungen += menge;
  });

  outputs.forEach(o => {
    const month = getMonth(o.Ausgangsdatum);
    if (!month) return;
    const menge = parseFloat(o.VerbrauchteMenge) || 0;
    monthlyData[month] = monthlyData[month] || { month, Bestellungen: 0, Ausgänge: 0 };
    monthlyData[month].Ausgänge += menge;
  });

  return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
};

const OutputLog = ({ outputs }) => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="detail-view">
      <h2>📤 Ausgangshistorie</h2>
      <ul className="order-list">
        {outputs.map((a, i) => (
          <li key={i}>
            <Link to={`/outputlog/${a.AusgangsID}`} className="section-link">
              <strong>{a.Ausgangsdatum}</strong> – {a.Artikelnummer} – {a.VerbrauchteMenge} Stück<br />
              <em>{a.Bemerkungen}</em>
            </Link>
          </li>
        ))}
      </ul>
      {selected && (
        <div style={{
          marginTop: '2rem',
          background: '#1f1f1f',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #444'
        }}>
          <h3>📋 Ausgabendetails</h3>
          <p><strong>Artikelnummer:</strong> {selected.Artikelnummer}</p>
          <p><strong>Menge:</strong> {selected.VerbrauchteMenge}</p>
          <p><strong>Abteilung:</strong> {selected.Abteilung}</p>
          <p><strong>Datum:</strong> {selected.Ausgangsdatum}</p>
          <p><strong>Bemerkung:</strong> {selected.Bemerkungen}</p>
          <button onClick={() => setSelected(null)}>Schließen</button>
        </div>
      )}
    </div>
  );
};

const OrderLog = ({ orders }) => {
  const [selected, setSelected] = useState(null);

  return (
    <div className="detail-view">
      <h2>📦 Bestellhistorie</h2>
      <ul className="order-list">
        {orders.map((o, i) => (
          <li key={i}>
            <Link to={`/orderlog/${o.BestellID}`} className="section-link">
              <strong>{o.Bestelldatum}</strong> – {o.Lieferant} – {o.Menge} {o.Einheit}<br />
              <em>{o.Artikelbeschreibung}</em>
            </Link>
          </li>
        ))}
      </ul>
      {selected && (
        <div style={{
          marginTop: '2rem',
          background: '#1f1f1f',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #444'
        }}>
          <h3>📋 Bestelldetails</h3>
          <p><strong>Artikel:</strong> {selected.Artikelbeschreibung}</p>
          <p><strong>Menge:</strong> {selected.Menge} {selected.Einheit}</p>
          <p><strong>Einzelpreis:</strong> {selected.PreisProEinheit} €</p>
          <p><strong>Gesamtpreis:</strong> {selected.Gesamtpreis} €</p>
          <p><strong>Lieferant:</strong> {selected.Lieferant}</p>
          <p><strong>Kategorie:</strong> {selected.Kategorie}</p>
          <p><strong>Geplant:</strong> {selected.GeplantesLieferdatum}</p>
          <p><strong>Tatsächlich:</strong> {selected.TatsächlichesLieferdatum}</p>
          <p><strong>Lieferdauer:</strong> {selected.Lieferdauer} Tage</p>
          <button onClick={() => setSelected(null)}>Schließen</button>
        </div>
      )}
    </div>
  );
};

const OrderDetails = ({ orders }) => {
  const { id } = useParams();
  const order = orders.find(o => o.BestellID === id);

  if (!order) return <div className="detail-view">❌ Bestellung nicht gefunden.</div>;

  return (
    <div className="detail-view">
      <h2>📋 Bestelldetails</h2>
      <p><strong>Artikel:</strong> {order.Artikelbeschreibung}</p>
      <p><strong>Menge:</strong> {order.Menge} {order.Einheit}</p>
      <p><strong>Einzelpreis:</strong> {order.PreisProEinheit} €</p>
      <p><strong>Gesamtpreis:</strong> {order.Gesamtpreis} €</p>
      <p><strong>Lieferant:</strong> {order.Lieferant}</p>
      <p><strong>Kategorie:</strong> {order.Kategorie}</p>
      <p><strong>Geplant:</strong> {order.GeplantesLieferdatum}</p>
      <p><strong>Tatsächlich:</strong> {order.TatsächlichesLieferdatum}</p>
      <p><strong>Lieferdauer:</strong> {order.Lieferdauer} Tage</p>
      <Link to="/orderlog" className="section-link">← Zurück zur Liste</Link>
    </div>
  );
};

const OutputDetails = ({ outputs }) => {
  const { id } = useParams();
  const output = outputs.find(a => a.AusgangsID === id);

  if (!output) return <div className="detail-view">❌ Ausgang nicht gefunden.</div>;

  return (
    <div className="detail-view">
      <h2>📋 Ausgabendetails</h2>
      <p><strong>Artikelnummer:</strong> {output.Artikelnummer}</p>
      <p><strong>Menge:</strong> {output.VerbrauchteMenge}</p>
      <p><strong>Abteilung:</strong> {output.Abteilung}</p>
      <p><strong>Datum:</strong> {output.Ausgangsdatum}</p>
      <p><strong>Bemerkung:</strong> {output.Bemerkungen}</p>
      <Link to="/outputlog" className="section-link">← Zurück zur Liste</Link>
    </div>
  );
};

const PreviewCard = ({ title, path, children }) => (
  <div className="graph-container">
    <h3 style={{ color: '#f7a440' }}>{title}</h3>
    <Link to={path} className="section-link" style={{ textDecoration: 'none' }}>
      <div className="graph-placeholder"
        style={{
          height: '180px',
          overflow: 'hidden',
          backgroundColor: '#1e1e1e',
          padding: '0.5rem',
          borderRadius: '8px',
          border: '1px solid #333',
        }}>
        {children}
      </div>
    </Link>
  </div>
);

const App = () => {
  const [orders, setOrders] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    parseCSV('/data/bestellungen.csv', 'BestellID').then(setOrders);
    parseCSV('/data/ausgaenge.csv', 'AusgangsID').then(setOutputs);

    const handleResize = () => {
      const isNowMobile = window.innerWidth <= 768;
      setIsMobile(isNowMobile);
      setMenuOpen(false); // Sidebar standardmäßig eingeklappt
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial aufrufen

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = () => setMenuOpen(prev => !prev);
  const closeMenu = () => setMenuOpen(false);

  return (
    <Router>
      <button onClick={toggleMenu} className="menu-toggle">☰</button>
      <div className="app">
        {menuOpen && isMobile && <div className="overlay active" onClick={closeMenu}></div>}
        <aside className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
          <Sidebar isOpen={menuOpen} setIsOpen={setMenuOpen} isMobile={isMobile} />
        </aside>
        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                <div className="home">
                  <h1 style={{ color: '#f7a440', marginBottom: '2rem' }}>📊 Dashboard</h1>
                  <PreviewCard title="Lagerentwicklung" path="/lagerverlauf">
                    <LagerverlaufPreview />
                  </PreviewCard>
                  <PreviewCard title="Retourenübersicht" path="/retouren">
                    <RetourenPreview />
                  </PreviewCard>
                  <PreviewCard title="Liefertermintreue" path="/termintreue">
                    <TermintreuePreview />
                  </PreviewCard>
                  <PreviewCard title="Lieferantenbewertung" path="/lieferantenbewertung">
                    <BewertungPreview />
                  </PreviewCard>
                  <PreviewCard title="Automatisierung" path="/automatisierung">
                    <AutomatisierungPreview />
                  </PreviewCard>
                </div>
              }
            />
            <Route path="/live-scannen" element={
                <div className="live-scannen">
                  <h1 style={{ color: '#f7a440', marginBottom: '2rem' }}>📷 Live-Scannen</h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <BarcodeScanner />
                    <InvoiceScanner />
                  </div>
                </div>
              } />
            <Route path="/lagerverlauf" element={<Lagerverlauf orders={orders} outputs={outputs} />} />
            <Route path="/retouren" element={<Retouren />} />
            <Route path="/termintreue" element={<Termintreue orders={orders} />} />
            <Route path="/lieferantenbewertung" element={<Lieferantenbewertung />} />
            <Route path="/automatisierung" element={<Automatisierung />} />
            <Route path="/engpaesse" element={<Engpaesse />} />
            <Route path="/finanzen" element={<Finanzen />} />
            <Route path="/tutorial" element={<Tutorial />} />
            <Route path="/orderlog" element={<OrderLog orders={orders} />} />
            <Route path="/orderlog/:id" element={<OrderDetails orders={orders} />} />
            <Route path="/outputlog" element={<OutputLog outputs={outputs} />} />
            <Route path="/outputlog/:id" element={<OutputDetails outputs={outputs} />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;