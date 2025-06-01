import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  NavLink,
  useParams
} from 'react-router-dom';

import {
  FaHome,
  FaBoxOpen,
  FaClipboardList,
  FaCommentDots,
  FaBars,
  FaCogs,
  FaQuestionCircle,
  FaChartLine,
  FaClock,
  FaUndoAlt,
  FaTruckLoading,
  FaEuroSign,
  FaStarHalfAlt
} from 'react-icons/fa';
import Termintreue from './Termintreue';


import Papa from 'papaparse';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import './App.css';
import Sidebar from './Sidebar';
import Retouren from './Retouren';
import Lagerverlauf from './Lagerverlauf';
import Engpaesse from './Engpaesse';
import Finanzen from './Finanzen';
import Lieferantenbewertung from './Lieferantenbewertung';
import Tutorial from './Tutorial';


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


const Home = ({ orders, outputs }) => (
  <div className="home">
    <div className="graph-container">
      <h1>Willkommen bei <span style={{ color: '#ff9800' }}>ORDERLY</span></h1>
      <h2><Link to="/orderlog" className="section-link">Bestellverläufe</Link></h2>
      <div className="graph-placeholder">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={generateMonthlyData(orders, outputs)} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="month" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip contentStyle={{ backgroundColor: '#222', borderColor: '#666', color: '#fff' }} />
            <Legend />
            <Line type="monotone" dataKey="bestellungen" stroke="#ff9800" strokeWidth={3} />
            <Line type="monotone" dataKey="ausgaenge" stroke="#2196f3" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    <div className="orders-preview">
      <h3>Letzte Bestellungen</h3>
      <ul className="order-list">
        {orders.slice(-5).reverse().map((o, i) => (
          <li key={i}>
            <Link to={`/orderlog/${o.BestellID}`} className="section-link">
              <strong>{o.Bestelldatum}</strong> – {o.Lieferant} – {o.Menge} {o.Einheit}<br />
              <em>{o.Artikelbeschreibung}</em>
            </Link>
          </li>
        ))}
      </ul>

      <h3>Letzte Ausgänge</h3>
      <ul className="order-list">
        {outputs.slice(-5).reverse().map((a, i) => (
          <li key={i}>
            <Link to={`/outputlog/${a.AusgangsID}`} className="section-link">
              <strong>{a.Ausgangsdatum}</strong> – {a.Artikelnummer} – {a.VerbrauchteMenge} Stück<br />
              <em>{a.Bemerkungen}</em>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const OrderLog = ({ orders }) => (
  <div>
    <h2>Bestellhistorie</h2>
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
  </div>
);

const OrderDetail = ({ orders }) => {
  const { id } = useParams();
  const order = orders.find((o) => o.BestellID === id);
  if (!order) return <p>Bestellung nicht gefunden.</p>;
  return (
    <div className="detail-view">
      <h2>Details zur Bestellung #{order.BestellID}</h2>
      <p><strong>Datum:</strong> {order.Bestelldatum}</p>
      <p><strong>Lieferant:</strong> {order.Lieferant}</p>
      <p><strong>Artikelnummer:</strong> {order.Artikelnummer}</p>
      <p><strong>Bezeichnung:</strong> {order.Artikelbeschreibung}</p>
      <p><strong>Menge:</strong> {order.Menge} {order.Einheit}</p>
      <p><strong>Preis/Einheit:</strong> {order.PreisProEinheit} €</p>
      <p><strong>Status:</strong> {order.Bestellstatus}</p>
    </div>
  );
};

const OutputLog = ({ outputs }) => (
  <div>
    <h2>Ausgangshistorie</h2>
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
  </div>
);

const OutputDetail = ({ outputs }) => {
  const { id } = useParams();
  const output = outputs.find((a) => a.AusgangsID === id);
  if (!output) return <p>Ausgang nicht gefunden.</p>;
  return (
    <div className="detail-view">
      <h2>Details zu Ausgang #{output.AusgangsID}</h2>
      <p><strong>Datum:</strong> {output.Ausgangsdatum}</p>
      <p><strong>Artikelnummer:</strong> {output.Artikelnummer}</p>
      <p><strong>Bezeichnung:</strong> {output.Artikelbeschreibung}</p>
      <p><strong>Verbrauchte Menge:</strong> {output.VerbrauchteMenge} Stück</p>
      <p><strong>Abteilung:</strong> {output.Abteilung || '–'}</p>
      <p><strong>Bemerkungen:</strong> {output.Bemerkungen}</p>
    </div>
  );
};

const Feedback = () => {
  const [feedbackText, setFeedbackText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (feedbackText.trim()) {
      setSubmitted(true);
      setFeedbackText('');
    }
  };

  return (
    <div className="detail-view">
      <h2>📝 Feedback zu ORDERLY</h2>
      {submitted ? (
        <p>Vielen Dank für dein Feedback! Dein Beitrag hilft uns, <strong>ORDERLY</strong> noch besser zu machen. 🙌</p>
      ) : (
        <>
          <p>Hast du Anregungen, Wünsche oder hast du einen Fehler entdeckt?<br />
            Sende uns direkt hier dein Feedback:</p>

          <form onSubmit={handleSubmit}>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows="6"
              placeholder="Dein Feedback zu ORDERLY..."
              required
            />
            <br />
            <button type="submit">Absenden</button>
          </form>
        </>
      )}

      <div style={{ marginTop: '30px' }}>
        <h3>📧 Direkter Kontakt</h3>
        <p>
          <strong>Jamie Rösler</strong><br />
          Technische Universität Hamburg<br />
          <a href="mailto:Jamie.roesler@tuhh.de" className="email-link">Jamie.roesler@tuhh.de</a>
        </p>
      </div>
    </div>
  );
};

const Help = () => (
  <div className="detail-view">
    <h2>📘 Hilfe zu ORDERLY</h2>
    <p>Willkommen im Hilfebereich von <strong>ORDERLY</strong> – deinem smarten Lager- und Bestellmanagementsystem.</p>

    <h3>📋 FAQ</h3>
    <ul>
      <li><strong>Wie kann ich vergangene Bestellungen einsehen?</strong><br />Über das Menü „Bestelllog“</li>
      <li><strong>Wie sehe ich die Ausgänge?</strong><br />Über „Ausgänge“ in der Seitenleiste</li>
      <li><strong>Wie funktioniert der Graph?</strong><br />Er zeigt Bestellungen und Ausgänge pro Monat.</li>
      <li><strong>Wie kann ich ORDERLY aktualisieren?</strong><br />Bearbeite die CSV-Dateien im <code>/public/data</code> Ordner.</li>
    </ul>

    <h3>📞 Kontakt</h3>
    <p>
      <strong>Jamie Rösler</strong><br />
      Technische Universität Hamburg<br />
      📧 <a href="mailto:Jamie.roesler@tuhh.de" className="email-link">Jamie.roesler@tuhh.de</a>
    </p>
  </div>
);

const generateMonthlyData = (orders, outputs, filterSupplier = '', filterArticle = '') => {
  const monthlyData = {};

  const getMonth = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date) ? null : date.toISOString().slice(0, 7); // YYYY-MM
  };

  orders.forEach(o => {
    const month = getMonth(o.Bestelldatum);
    if (!month) return;

    if (filterSupplier && o.Lieferant !== filterSupplier) return;
    if (filterArticle && o.Artikelnummer !== filterArticle) return;

    const menge = parseFloat(o.Menge) || 0;

    if (!monthlyData[month]) {
      monthlyData[month] = { month, Bestellungen: 0, Ausgänge: 0 };
    }

    monthlyData[month].Bestellungen += menge;
  });

  outputs.forEach(o => {
    const month = getMonth(o.Ausgangsdatum);
    if (!month) return;

    if (filterArticle && o.Artikelnummer !== filterArticle) return;

    const menge = parseFloat(o.VerbrauchteMenge) || 0;

    if (!monthlyData[month]) {
      monthlyData[month] = { month, Bestellungen: 0, Ausgänge: 0 };
    }

    monthlyData[month].Ausgänge += menge;
  });

  return Object.values(monthlyData)
    .map(row => ({
      ...row,
      Bestellungen: Math.round(row.Bestellungen),
      Ausgänge: Math.round(row.Ausgänge),
      Bestand: Math.round(row.Bestellungen - row.Ausgänge)
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
};



const Automation = ({ orders }) => {
  const uniqueSuppliers = [...new Set(orders.map(o => o.Lieferant))].filter(Boolean);
  const [statusMap, setStatusMap] = useState({});
  const [openSupplier, setOpenSupplier] = useState(null);

  const getNextScheduledDate = () => {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);
    return nextDate.toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleAutoOrder = (supplier) => {
    const now = new Date().toLocaleString('de-DE');
    setStatusMap(prev => ({
      ...prev,
      [supplier]: {
        confirmed: true,
        date: now
      }
    }));

    setTimeout(() => {
      setStatusMap(prev => ({
        ...prev,
        [supplier]: {
          confirmed: false,
          date: null
        }
      }));
    }, 10000);
  };

  const toggleSupplier = (supplier) => {
    setOpenSupplier(prev => (prev === supplier ? null : supplier));
  };

  return (
    <div className="detail-view">
      <h2>⚙️ Automatisierung</h2>
      <p>Hier verwaltest du automatische Bestellungen für deine Lieferanten.</p>

      <ul className="automation-list">
        {uniqueSuppliers.map((supplier, i) => {
          const status = statusMap[supplier];
          const isOpen = openSupplier === supplier;
          const supplierOrders = orders.filter(o => o.Lieferant === supplier).slice(-5).reverse();
          const nextAutoDate = getNextScheduledDate();

          return (
            <li key={i} className="automation-entry">
              <div style={{ flex: 1 }}>
                <strong>{supplier}</strong>
                <div className="automation-status">
                  {status?.confirmed ? (
                    <>✅ Letzte manuelle Bestellung: {status.date}</>
                  ) : (
                    <>📅 Nächste planmäßige Bestellung: {nextAutoDate}</>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleAutoOrder(supplier)}
                className={`automation-button ${status?.confirmed ? 'done' : ''}`}
                disabled={status?.confirmed}
              >
                {status?.confirmed ? '✔️ Erledigt' : 'Außerplanmäßig nachbestellen'}
              </button>

              <button
                className="show-more-button"
                onClick={() => toggleSupplier(supplier)}
                style={{
                  marginTop: '10px',
                  background: '#333',
                  color: '#ff9800',
                  border: '1px solid #444',
                  padding: '6px 12px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                {isOpen ? 'Weniger anzeigen' : 'Mehr anzeigen'}
              </button>

              {isOpen && (
                <ul className="dropdown-list">
                  {supplierOrders.length === 0 ? (
                    <li className="dropdown-empty">Keine bisherigen Bestellungen</li>
                  ) : (
                    <>
                      <li className="dropdown-title">🧾 Letzte Bestellungen:</li>
                      {supplierOrders.map((o, idx) => (
                        <li key={idx} className="dropdown-item">
                          {o.Bestelldatum} – {o.Artikelbeschreibung} – {o.Menge} {o.Einheit}
                        </li>
                      ))}
                    </>
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};




const App = () => {
  const [orders, setOrders] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
  parseCSV('/data/bestellungen.csv', 'BestellID').then(setOrders);
  parseCSV('/data/ausgaenge.csv', 'AusgangsID').then(setOutputs);
}, []);

  return (
    <Router>
      <div className="app">
        <div
          className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}
          onMouseEnter={() => setSidebarOpen(true)}
          onMouseLeave={() => setSidebarOpen(false)}
        > 
          <ul className="sidebar-main">
            {/* Allgemein */}
            <li className="sidebar-category">🏠 Allgemein</li>
            <li>
              <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <FaHome className="icon" /><span className="label">Startseite</span>
              </NavLink>
            </li>

            {/* Daten */}
            <li className="sidebar-category">📋 Daten</li>
            <li>
              <NavLink to="/orderlog" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <FaClipboardList className="icon" /><span className="label">Bestelllog</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/outputlog" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <FaBoxOpen className="icon" /><span className="label">Ausgänge</span>
              </NavLink>
            </li>

            {/* Analyse */}
            <li className="sidebar-category">📊 Analyse</li>
            <li>
              <NavLink to="/lagerverlauf" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <FaChartLine className="icon" /><span className="label">Lagerverlauf</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/termintreue" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <FaClock className="icon" /><span className="label">Termintreue</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/retouren" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <FaUndoAlt className="icon" /><span className="label">Retouren</span>
              </NavLink>

            </li>
            <li>
              <NavLink to="/engpaesse">
                <FaTruckLoading className="icon" />
                <span className="label">Engpässe</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/finanzen">
                <FaEuroSign className="icon" /><span className="label">Finanzen</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/bewertung">
                <FaStarHalfAlt className="icon" /><span className="label">Bewertung</span>
              </NavLink>
            </li>

            {/* Verwaltung */}
            <li className="sidebar-category">⚙️ Verwaltung</li>
            <li>
              <NavLink to="/automatisierung" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <FaCogs className="icon" /><span className="label">Automatisierung</span>
              </NavLink>
            </li>
          </ul>

          {/* Footer */}
          <ul className="sidebar-footer">
            <li>
              <NavLink to="/feedback" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <FaCommentDots className="icon" /><span className="label">Feedback</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/help" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <FaQuestionCircle className="icon" /><span className="label">Hilfe</span>
              </NavLink>
            </li>
          </ul>
        </div>


        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home orders={orders} outputs={outputs} />} />
            <Route path="/orderlog" element={<OrderLog orders={orders} />} />
            <Route path="/orderlog/:id" element={<OrderDetail orders={orders} />} />
            <Route path="/outputlog" element={<OutputLog outputs={outputs} />} />
            <Route path="/outputlog/:id" element={<OutputDetail outputs={outputs} />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/help" element={<Help />} />
            <Route path="/automatisierung" element={<Automation orders={orders} />} />
            <Route path="/lagerverlauf" element={<Lagerverlauf orders={orders} outputs={outputs} />} />
            <Route path="/termintreue" element={<Termintreue orders={orders} />} />
            <Route path="/engpaesse" element={<Engpaesse orders={orders} outputs={outputs} />} />
            <Route path="/retouren" element={<Retouren />} />
            <Route path="/finanzen" element={<Finanzen />} />
            <Route path="/bewertung" element={<Lieferantenbewertung />} />
            <Route path="/tutorial" element={<Tutorial />} />

          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
