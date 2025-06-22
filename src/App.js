import React, { useState, useEffect, useCallback } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams
} from 'react-router-dom';
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

const fetchData = async (table) => {
  try {
    console.log(`Fetching data from ${table}...`);
    const response = await fetch(`/api/supabase?table=${table}&_t=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`Fehler beim Abrufen von ${table}: ${response.status}`);
    }
    const data = await response.json();
    console.log(`Data loaded from ${table}:`, data.length);
    return data;
  } catch (err) {
    console.error(`Error fetching ${table}:`, err);
    return [];
  }
};

const generateMonthlyData = (orders, outputs, returns) => {
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
    monthlyData[month] = monthlyData[month] || { month, Bestellungen: 0, Ausgänge: 0, Retouren: 0 };
    monthlyData[month].Bestellungen += menge;
  });

  outputs.forEach(o => {
    const month = getMonth(o.Ausgangsdatum);
    if (!month) return;
    const menge = parseFloat(o.VerbrauchteMenge) || 0;
    monthlyData[month] = monthlyData[month] || { month, Bestellungen: 0, Ausgänge: 0, Retouren: 0 };
    monthlyData[month].Ausgänge += menge;
  });

  returns.forEach(r => {
    const month = getMonth(r.Datum);
    if (!month) return;
    const menge = parseFloat(r.Menge) || 0;
    monthlyData[month] = monthlyData[month] || { month, Bestellungen: 0, Ausgänge: 0, Retouren: 0 };
    monthlyData[month].Retouren += menge;
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
    if (isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      console.log('Deleting AusgangsID:', ausgangsID);
      const response = await fetch('/api/supabase', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'ausgaenge', id: ausgangsID, idField: 'AusgangsID' }),
      });

      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(`Löschfehler: ${response.status} - ${JSON.stringify(errorText)}`);
      }

      setOutputs(prev => prev.filter(o => o.AusgangsID !== ausgangsID));
      setTimeout(() => {
        console.log('Calling onDataUpdate after delete (OutputLog)');
        onDataUpdate();
      }, 500);
    } catch (err) {
      console.error('Delete Error:', err);
      setError('Fehler beim Löschen: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="detail-view">
      <h2>📤 Ausgangshistorie</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {isDeleting && <p style={{ color: 'yellow', textAlign: 'center' }}>Löschen...</p>}
      <label style={{ marginBottom: '10px', display: 'block' }}>
        Sortieren nach:
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ marginLeft: '10px', padding: '5px' }}>
          <option value="newest">Neueste zuerst</option>
          <option value="oldest">Älteste zuerst</option>
        </select>
      </label>
      <ul className="order-list">
        {sortOutputs(outputs).map((a) => (
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
          <p><strong>Lagerbestand Vor:</strong> {selected.LagerbestandVor}</p>
          <p><strong>Lagerbestand Nach:</strong> {selected.LagerbestandNach}</p>
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
    if (isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      console.log('Deleting BestellID:', bestellID);
      const response = await fetch('/api/supabase', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'bestellungen', id: bestellID, idField: 'BestellID' }),
      });

      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(`Löschfehler: ${response.status} - ${JSON.stringify(errorText)}`);
      }

      setOrders(prev => prev.filter(o => o.BestellID !== bestellID));
      setTimeout(() => {
        console.log('Calling onDataUpdate after delete (OrderLog)');
        onDataUpdate();
      }, 500);
    } catch (err) {
      console.error('Delete Error:', err);
      setError('Fehler beim Löschen: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="detail-view">
      <h2>📦 Bestellhistorie</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {isDeleting && <p style={{ color: 'yellow', textAlign: 'center' }}>Löschen...</p>}
      <label style={{ marginBottom: '10px', display: 'block' }}>
        Sortieren nach:
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ marginLeft: '10px', padding: '5px' }}>
          <option value="newest">Neueste zuerst</option>
          <option value="oldest">Älteste zuerst</option>
        </select>
      </label>
      <ul className="order-list">
        {sortOrders(orders).map((o) => (
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

const ReturnLog = ({ returns, setReturns, onDataUpdate }) => {
  const [sortOrder, setSortOrder] = useState('newest');
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortReturns = (data) => {
    return [...data].sort((a, b) => {
      const dateA = new Date(a.Datum);
      const dateB = new Date(b.Datum);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  };

  const handleDelete = async (retoureID) => {
    if (!window.confirm('Retoure wirklich löschen?')) return;
    if (isDeleting) return;

    setIsDeleting(true);
    setError(null);

    try {
      console.log('Deleting RetoureID:', retoureID);
      const response = await fetch('/api/supabase', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'retouren', id: retoureID, idField: 'RetoureID' }),
      });

      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(`Löschfehler: ${response.status} - ${JSON.stringify(errorText)}`);
      }

      setReturns(prev => prev.filter(r => r.RetoureID !== retoureID));
      setTimeout(() => {
        console.log('Calling onDataUpdate after delete (ReturnLog)');
        onDataUpdate();
      }, 500);
    } catch (err) {
      console.error('Delete Error:', err);
      setError('Fehler beim Löschen: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="detail-view">
      <h2>📦 Retourenhistorie</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {isDeleting && <p style={{ color: 'yellow', textAlign: 'center' }}>Löschen...</p>}
      <label style={{ marginBottom: '10px', display: 'block' }}>
        Sortieren nach:
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ marginLeft: '10px', padding: '5px' }}>
          <option value="newest">Neueste zuerst</option>
          <option value="oldest">Älteste zuerst</option>
        </select>
      </label>
      <ul className="order-list">
        {sortReturns(returns).map((r) => (
          <li key={r.RetoureID} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link to={`/returnlog/${r.RetoureID}`} className="section-link">
              <strong>{r.Datum}</strong> – {r.Artikelnummer} – {r.Menge} Stück<br />
              <em>{r.GrundDerRetoure}</em>
            </Link>
            <button
              onClick={() => handleDelete(r.RetoureID)}
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
          <h3>📋 Retourendetails</h3>
          <p><strong>Artikelnummer:</strong> {selected.Artikelnummer}</p>
          <p><strong>Menge:</strong> {selected.Menge}</p>
          <p><strong>Grund:</strong> {selected.GrundDerRetoure}</p>
          <p><strong>Lieferant:</strong> {selected.Lieferant}</p>
          <p><strong>Datum:</strong> {selected.Datum}</p>
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
      <p><strong>Lagerbestand Vor:</strong> {output.LagerbestandVor}</p>
      <p><strong>Lagerbestand Nach:</strong> {output.LagerbestandNach}</p>
      <p><strong>Datum:</strong> {output.Ausgangsdatum}</p>
      <p><strong>Bemerkung:</strong> {output.Bemerkungen}</p>
      <Link to="/outputlog" className="section-link">← Zurück zur Liste</Link>
    </div>
  );
};

const ReturnDetails = ({ returns }) => {
  const { id } = useParams();
  const returnItem = returns.find(r => r.RetoureID === id);

  if (!returnItem) return <div className="detail-view">❌ Retoure nicht gefunden.</div>;

  return (
    <div className="detail-view">
      <h2>📋 Retourendetails</h2>
      <p><strong>Artikelnummer:</strong> {returnItem.Artikelnummer}</p>
      <p><strong>Menge:</strong> {returnItem.Menge}</p>
      <p><strong>Grund:</strong> {returnItem.GrundDerRetoure}</p>
      <p><strong>Lieferant:</strong> {returnItem.Lieferant}</p>
      <p><strong>Datum:</strong> {returnItem.Datum}</p>
      <Link to="/returnlog" className="section-link">← Zurück zur Liste</Link>
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
  const [returns, setReturns] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const loadData = useCallback(async () => {
    console.log('Loading data...');
    try {
      const [loadedOrders, loadedOutputs, loadedReturns] = await Promise.all([
        fetchData('bestellungen'),
        fetchData('ausgaenge'),
        fetchData('retouren'),
      ]);
      setOrders(loadedOrders);
      setOutputs(loadedOutputs);
      setReturns(loadedReturns);
      console.log('Data loaded:', { orders: loadedOrders.length, outputs: loadedOutputs.length, returns: loadedReturns.length });
    } catch (err) {
      console.error('Error loading data:', err);
    }
  }, []);

  useEffect(() => {
    console.log('Initial loadData call');
    loadData();
  }, [loadData]);

  const handleDataUpdate = useCallback(() => {
    console.log('handleDataUpdate called');
    setTimeout(() => {
      loadData();
    }, 500);
  }, [loadData]);

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
                  <BarcodeScanner orders={orders} setOrders={setOrders} outputs={outputs} setOutputs={setOutputs} returns={returns} setReturns={setReturns} onDataUpdate={handleDataUpdate} />
                  <InvoiceScanner onDataUpdate={handleDataUpdate} />
                </div>
              </div>
            } />
            <Route path="/lagerverlauf" element={<Lagerverlauf orders={orders} outputs={outputs} returns={returns} />} />
            <Route path="/retouren" element={<Retouren returns={returns} />} />
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
            <Route path="/returnlog" element={<ReturnLog returns={returns} setReturns={setReturns} onDataUpdate={handleDataUpdate} />} />
            <Route path="/returnlog/:id" element={<ReturnDetails returns={returns} />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/help" element={<Help />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;