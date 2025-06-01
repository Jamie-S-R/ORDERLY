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

import LagerverlaufPreview from './previews/LagerverlaufPreview';
import TermintreuePreview from './previews/TermintreuePreview';
import RetourenPreview from './previews/RetourenPreview';
import BewertungPreview from './previews/RadarBewertungPreview';
import AutomatisierungPreview from './previews/AutomatisierungPreview';

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

const OrderLog = ({ orders }) => (
  <div className="detail-view">
    <h2>📦 Bestellhistorie</h2>
    <ul className="order-list">
      {orders.map((o, i) => (
        <li key={i}>
          <strong>{o.Bestelldatum}</strong> – {o.Lieferant} – {o.Menge} {o.Einheit}<br />
          <em>{o.Artikelbeschreibung}</em>
        </li>
      ))}
    </ul>
  </div>
);

const OutputLog = ({ outputs }) => (
  <div className="detail-view">
    <h2>📤 Ausgangshistorie</h2>
    <ul className="order-list">
      {outputs.map((a, i) => (
        <li key={i}>
          <strong>{a.Ausgangsdatum}</strong> – {a.Artikelnummer} – {a.VerbrauchteMenge} Stück<br />
          <em>{a.Bemerkungen}</em>
        </li>
      ))}
    </ul>
  </div>
);


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

  useEffect(() => {
    parseCSV('/data/bestellungen.csv', 'BestellID').then(setOrders);
    parseCSV('/data/ausgaenge.csv', 'AusgangsID').then(setOutputs);
  }, []);

  return (
    <Router>
      <div className="app">
        <Sidebar />
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

            <Route path="/lagerverlauf" element={<Lagerverlauf orders={orders} outputs={outputs} />} />
            <Route path="/retouren" element={<Retouren />} />
            <Route path="/termintreue" element={<Termintreue orders={orders} />} />
            <Route path="/lieferantenbewertung" element={<Lieferantenbewertung />} />
            <Route path="/automatisierung" element={<Automatisierung />} />
            <Route path="/engpaesse" element={<Engpaesse />} />
            <Route path="/finanzen" element={<Finanzen />} />
            <Route path="/tutorial" element={<Tutorial />} />
            <Route path="/orderlog" element={<OrderLog orders={orders} />} />
            <Route path="/outputlog" element={<OutputLog outputs={outputs} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
