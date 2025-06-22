import React, { useState, useEffect, useCallback } from 'react';
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

import Sidebar from './Sidebar.jsx';
import Retouren from './Retouren.jsx';
import Lagerverlauf from './Lagerverlauf.jsx';
import Engpaesse from './Engpaesse.jsx';
import Finanzen from './Finanzen.jsx';
import Lieferantenbewertung from './Lieferantenbewertung.jsx';
import Tutorial from './Tutorial.jsx';
import Termintreue from './Termintreue.jsx';
import Automatisierung from './Automatisierung.jsx';
import Feedback from './Feedback.jsx';
import Help from './Help.jsx';
import LagerverlaufPreview from './previews/LagerverlaufPreview.jsx';
import TermintreuePreview from './previews/TermintreuePreview.jsx';
import RetourenPreview from './previews/RetourenPreview.jsx';
import BewertungPreview from './previews/RadarBewertungPreview.jsx';
import AutomatisierungPreview from './previews/AutomatisierungPreview.jsx';
import BarcodeScanner from './BarcodeScanner.jsx';
import InvoiceScanner from './InvoiceScanner.jsx';

const parseCSV = async (filePath, idField) =>
  new Promise((resolve) => {
    const isLocal = process.env.NODE_ENV === 'development';
    const url = isLocal ? `/data/${filePath.split('/').pop()}` : `/api/update-csv?file=${filePath.split('/').pop()}`;
    Papa.parse(url, {
      download: true,
      header: true,
      complete: (results) => {
        const cleaned = results.data.filter(row => row[idField]);
        resolve(cleaned);
      },
      error: (err) => {
        console.error('CSV Parse Error:', err);
        resolve([]);
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

const OutputLog = ({ outputs, setOutputs, onDataUpdate }) => {
  const [sortOrder, setSortOrder] = useState('newest');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortOutputs = (data) => {
    return [...data].sort((a, b) => {
      const dateA = new Date(a.Ausgangsdatum);
      const dateB = new Date(b.Ausgangsdatum);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  const handleDelete = async (ausgangsID) => {
    if (!window.confirm('Ausgang wirklich löschen?')) return;
    if (isDeleting) return; // Prevent multiple deletions

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/update-csv', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: 'ausgaenge.csv', id: ausgangsID, idField: 'AusgangsID' }),
      });

      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(`Löschfehler: ${response.status} - ${JSON.stringify(errorText)}`);
      }

      // Update local state immediately
      setOutputs(prev => prev.filter(o => o.AusgangsID !== ausgangsID));
      // Trigger data reload
      if (onDataUpdate) {
        onDataUpdate();
      }
    } catch (err) {
      setError('Fehler beim Löschen: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="detail-view">
      <h2>📤 Ausgangshistorie</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      <label style={{ marginBottom: '10px', display: 'block' }}>
        Sortieren nach:
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ marginLeft: '10px', padding: '5px' }}>
          <option value="newest">Neueste zuerst</option>
          <option value="oldest">Älteste zuerst</option>
        </select>
      </label>
      <ul className="order-list">
        {sortOutputs(outputs).map((a, i) => (
          <li key={a.AusgangsID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to={`/outputlog/${a.AusgangsID}`} className="section-link">
              <strong>{a.Ausgangsdatum}</strong> – {a.Artikelnummer} – {a.VerbrauchteMenge} Stück<br />
              <em>{a.Bemerkungen}</em>
            </Link>
            <button
              onClick={() => handleDelete(a.AusgangsID)}
              disabled={isDeleting}
              style={{ padding: '5px 10px', background: '#f44336', color: 'white', border: 'none', cursor: isDeleting ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
            >
              Löschen
            </button>
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
          <p><strong>Abteilung:</strong> {selected.Abteilung || 'Unbekannt'}</p>
          <p><strong>Datum:</strong> {selected.Ausgangsdatum}</p>
          <p><strong>Bemerkung:</strong> {selected.Bemerkungen}</p>
          <button onClick={() => setSelected(null)}>Schließen</button>
        </div>
      )}
    </div>
  );
};

const OrderLog = ({ orders, setOrders, onDataUpdate }) => {
  const [sortOrder, setSortOrder] = useState('newest');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortOrders = (data) => {
    return [...data].sort((a, b) => {
      const dateA = new Date(a.Bestelldatum);
      const dateB = new Date(b.Bestelldatum);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  const handleDelete = async (bestellID) => {
    if (!window.confirm('Bestellung wirklich löschen?')) return;
    if (isDeleting) return; // Prevent multiple deletions

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/update-csv', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: 'bestellungen.csv', id: bestellID, idField: 'BestellID' }),
      });

      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(`Löschfehler: ${response.status} - ${JSON.stringify(errorText)}`);
      }

      // Update local state immediately
      setOrders(prev => prev.filter(o => o.BestellID !== bestellID));
      // Trigger data reload
      if (onDataUpdate) {
        onDataUpdate();
      }
    } catch (err) {
      setError('Fehler beim Löschen: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="detail-view">
      <h2>📦 Bestellhistorie</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      <label style={{ marginBottom: '10px', display: 'block' }}>
        Sortieren nach:
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ marginLeft: '10px', padding: '5px' }}>
          <option value="newest">Neueste zuerst</option>
          <option value="oldest">Älteste zuerst</option>
        </select>
      </label>
      <ul className="order-list">
        {sortOrders(orders).map((o, i) => (
          <li key={o.BestellID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to={`/orderlog/${o.BestellID}`} className="section-link">
              <strong>{o.Bestelldatum}</strong> – {o.Lieferant} – {o.Menge} {o.Einheit}<br />
              <em>{o.Artikelbeschreibung}</em>
            </Link>
            <button
              onClick={() => handleDelete(o.BestellID)}
              disabled={isDeleting}
              style={{ padding: '5px 10px', background: '#f44336', color: 'white', border: 'none', cursor: isDeleting ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
            >
              Löschen
            </button>
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
      <p><strong>Abteilung:</strong> {output.Abteilung || 'Unbekannt'}</p>
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
  const [dataUpdated, setDataUpdated] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (isLoading) return; // Prevent multiple simultaneous loads
    setIsLoading(true);
    try {
      const loadedOrders = await parseCSV('/data/bestellungen.csv', 'BestellID');
      const loadedOutputs = await parseCSV('/data/ausgaenge.csv', 'AusgangsID');
      setOrders(loadedOrders);
      setOutputs(loadedOutputs);
    } catch (err) {
      console.error('Error loading CSV data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    loadData();
  }, [dataUpdated, loadData]);

  // Trigger data reload after orders/outputs change
  const handleDataUpdate = () => {
    setDataUpdated(prev => prev + 1);
  };

  useEffect(() => {
    const handleResize = () => {
      const isNowMobile = window.innerWidth <= 768;
      setIsMobile(isNowMobile);
      setMenuOpen(isNowMobile ? false : true);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Router>
      <button onClick={() => setMenuOpen(prev => !prev)} className="menu-toggle">☰</button>
      <div className="app">
        {menuOpen && isMobile && <div className="overlay active" onClick={() => setMenuOpen(false)}></div>}
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
                  <BarcodeScanner orders={orders} setOrders={setOrders} outputs={outputs} setOutputs={setOutputs} onDataUpdate={handleDataUpdate} />
                  <InvoiceScanner onDataUpdate={handleDataUpdate} />
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
            <Route path="/orderlog" element={<OrderLog orders={orders} setOrders={setOrders} onDataUpdate={handleDataUpdate} />} />
            <Route path="/orderlog/:id" element={<OrderDetails orders={orders} />} />
            <Route path="/outputlog" element={<OutputLog outputs={outputs} setOutputs={setOutputs} onDataUpdate={handleDataUpdate} />} />
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