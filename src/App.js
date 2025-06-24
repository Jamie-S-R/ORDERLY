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
    const response = await fetch(`/api/supabase?table=${table}&_t=${Date.now()}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
    console.log(`Response status for ${table}:`, response.status);
    const text = await response.text();
    if (!response.ok) {
      console.error(`Error fetching ${table}:`, text);
      return { error: `Fehler beim Abrufen von ${table}: ${response.status} - ${text}`, data: [] };
    }
    let data;
    try {
      data = JSON.parse(text);
      console.log(`Parsed data for ${table} (${data.length} Datensätze):`, data.slice(-5));
      if (table === 'bestellungen') {
        const newEntries = data.filter(item => parseInt(item.BestellID) >= 3000);
        console.log(`New entries (BestellID >= 3000) for ${table}:`, newEntries);
      } else if (table === 'ausgaenge') {
        const newEntries = data.filter(item => parseInt(item.AusgangsID) >= 4000);
        console.log(`New entries (AusgangsID >= 4000) for ${table}:`, newEntries);
      } else if (table === 'retouren') {
        const newEntries = data.filter(item => parseInt(item.RetoureID) >= 5300);
        console.log(`New entries (RetoureID >= 5300) for ${table}:`, newEntries);
      }
    } catch (parseErr) {
      console.error(`JSON parse error for ${table}:`, parseErr, 'Response:', text);
      return { error: `Invalid JSON response: ${parseErr.message}`, data: [] };
    }
    return { data: Array.isArray(data) ? data : [], error: null };
  } catch (err) {
    console.error(`Error fetching ${table}:`, err);
    return { error: err.message, data: [] };
  }
};

const PreviewCard = ({ title, path, children }) => (
  <div className="graph-container mb-6 transition-all hover:shadow-lg hover:-translate-y-1">
    <h3 className="text-lg font-bold text-[#f7a440] mb-2">{title}</h3>
    <Link to={path} className="block">
      <div className="bg-gray-900 p-4 rounded-lg border border-gray-600 hover:border-[#f7a440] transition-all duration-200" style={{ minHeight: '240px' }}>
        {children}
      </div>
    </Link>
  </div>
);

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
        const errorText = await response.text();
        console.error('Delete error response:', errorText);
        throw new Error(`Löschfehler: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Delete success:', data);

      setOrders(prev => prev.filter(o => o.BestellID !== bestellID));
      setTimeout(() => {
        console.log('Calling onDataUpdate after delete (OrderLog)');
        onDataUpdate({ type: 'Eingang', deletedID: bestellID });
      }, 500);
    } catch (err) {
      console.error('Delete Error:', err);
      setError('Fehler beim Löschen: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="detail-view p-4">
      <h2 className="text-2xl font-bold text-[#f7a440] mb-4">Bestellhistorie</h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {isDeleting && <p className="text-[#f7a440] text-center mb-4">Löschen...</p>}
      <div className="flex items-center space-x-2 mb-4">
        <label className="text-white">Sortieren nach:</label>
        <div className="relative inline-block">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="appearance-none bg-gray-700 text-white p-2 rounded-lg pr-8 focus:outline-none focus:ring-2 focus:ring-[#f7a440]"
          >
            <option value="newest">Neueste zuerst</option>
            <option value="oldest">Älteste zuerst</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      <ul className="space-y-2">
        {sortOrders(orders).map((o) => (
          <li key={o.BestellID} className="flex justify-between items-center bg-gray-800 p-3 rounded-lg">
            <Link to={`/orderlog/${o.BestellID}`} className="text-[#f7a440] hover:underline flex-1">
              <strong>{o.Bestelldatum}</strong> – {o.Lieferant} – {o.Menge} {o.Einheit}<br />
              <em className="text-gray-400">{o.Artikelbeschreibung}</em>
            </Link>
            <button
              onClick={() => handleDelete(o.BestellID)}
              disabled={isDeleting}
              className={`bg-red-500 text-white px-3 py-1 rounded-lg ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'}`}
            >
              Löschen
            </button>
          </li>
        ))}
      </ul>
      {selected && (
        <div className="mt-6 bg-gray-900 p-4 rounded-lg border border-gray-600">
          <h3 className="text-xl font-bold text-white mb-2">Bestelldetails</h3>
          <p className="text-gray-300"><strong>Artikel:</strong> {selected.Artikelbeschreibung}</p>
          <p className="text-gray-300"><strong>Menge:</strong> {selected.Menge} {selected.Einheit}</p>
          <p className="text-gray-300"><strong>Einzelpreis:</strong> {selected.PreisProEinheit} €</p>
          <p className="text-gray-300"><strong>Gesamtpreis:</strong> {selected.Gesamtpreis} €</p>
          <p className="text-gray-300"><strong>Lieferant:</strong> {selected.Lieferant}</p>
          <p className="text-gray-300"><strong>Kategorie:</strong> {selected.Kategorie}</p>
          <p className="text-gray-300"><strong>Geplant:</strong> {selected.GeplantesLieferdatum}</p>
          <p className="text-gray-300"><strong>Tatsächlich:</strong> {selected.TatsächlichesLieferdatum}</p>
          <p className="text-gray-300"><strong>Lieferdauer:</strong> {selected.Lieferdauer} Tage</p>
          <button
            onClick={() => setSelected(null)}
            className="mt-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Schließen
          </button>
        </div>
      )}
    </div>
  );
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
        const errorText = await response.text();
        console.error('Delete error response:', errorText);
        throw new Error(`Löschfehler: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Delete success:', data);

      setOutputs(prev => prev.filter(o => o.AusgangsID !== ausgangsID));
      setTimeout(() => {
        console.log('Calling onDataUpdate after delete (OutputLog)');
        onDataUpdate({ type: 'Ausgang', deletedID: ausgangsID });
      }, 500);
    } catch (err) {
      console.error('Delete Error:', err);
      setError('Fehler beim Löschen: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="detail-view p-4">
      <h2 className="text-2xl font-bold text-[#f7a440] mb-4">Ausgangshistorie</h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {isDeleting && <p className="text-[#f7a440] text-center mb-4">Löschen...</p>}
      <div className="flex items-center space-x-2 mb-4">
        <label className="text-white">Sortieren nach:</label>
        <div className="relative inline-block">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="appearance-none bg-gray-700 text-white p-2 rounded-lg pr-8 focus:outline-none focus:ring-2 focus:ring-[#f7a440]"
          >
            <option value="newest">Neueste zuerst</option>
            <option value="oldest">Älteste zuerst</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      <ul className="space-y-2">
        {sortOutputs(outputs).map((a) => (
          <li key={a.AusgangsID} className="flex justify-between items-center bg-gray-800 p-3 rounded-lg">
            <Link to={`/outputlog/${a.AusgangsID}`} className="text-[#f7a440] hover:underline flex-1">
              <strong>{a.Ausgangsdatum}</strong> – {a.Artikelnummer} – {a.VerbrauchteMenge} Stück<br />
              <em className="text-gray-400">{a.Bemerkungen}</em>
            </Link>
            <button
              onClick={() => handleDelete(a.AusgangsID)}
              disabled={isDeleting}
              className={`bg-red-500 text-white px-3 py-1 rounded-lg ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'}`}
            >
              Löschen
            </button>
          </li>
        ))}
      </ul>
      {selected && (
        <div className="mt-6 bg-gray-900 p-4 rounded-lg border border-gray-600">
          <h3 className="text-xl font-bold text-white mb-2">Ausgabendetails</h3>
          <p className="text-gray-300"><strong>Artikelnummer:</strong> {selected.Artikelnummer}</p>
          <p className="text-gray-300"><strong>Menge:</strong> {selected.VerbrauchteMenge}</p>
          <p className="text-gray-300"><strong>Lagerbestand Vor:</strong> {selected.LagerbestandVor}</p>
          <p className="text-gray-300"><strong>Lagerbestand Nach:</strong> {selected.LagerbestandNach}</p>
          <p className="text-gray-300"><strong>Datum:</strong> {selected.Ausgangsdatum}</p>
          <p className="text-gray-300"><strong>Bemerkung:</strong> {selected.Bemerkungen}</p>
          <button
            onClick={() => setSelected(null)}
            className="mt-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Schließen
          </button>
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
        const errorText = await response.text();
        console.error('Delete error response:', errorText);
        throw new Error(`Löschfehler: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Delete success:', data);

      setReturns(prev => prev.filter(r => r.RetoureID !== retoureID));
      setTimeout(() => {
        console.log('Calling onDataUpdate after delete (ReturnLog)');
        onDataUpdate({ type: 'Retoure', deletedID: retoureID });
      }, 500);
    } catch (err) {
      console.error('Delete Error:', err);
      setError('Fehler beim Löschen: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="detail-view p-4">
      <h2 className="text-2xl font-bold text-[#f7a440] mb-4">Retourenhistorie</h2>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {isDeleting && <p className="text-[#f7a440] text-center mb-4">Löschen...</p>}
      <div className="flex items-center space-x-2 mb-4">
        <label className="text-white">Sortieren nach:</label>
        <div className="relative inline-block">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="appearance-none bg-gray-700 text-white p-2 rounded-lg pr-8 focus:outline-none focus:ring-2 focus:ring-[#f7a440]"
          >
            <option value="newest">Neueste zuerst</option>
            <option value="oldest">Älteste zuerst</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      <ul className="space-y-2">
        {sortReturns(returns).map((r) => (
          <li key={r.RetoureID} className="flex justify-between items-center bg-gray-800 p-3 rounded-lg">
            <Link to={`/returnlog/${r.RetoureID}`} className="text-[#f7a440] hover:underline flex-1">
              <strong>{r.Datum}</strong> – {r.Artikelnummer} – {r.Menge} Stück<br />
              <em className="text-gray-400">{r.GrundDerRetoure}</em>
            </Link>
            <button
              onClick={() => handleDelete(r.RetoureID)}
              disabled={isDeleting}
              className={`bg-red-500 text-white px-3 py-1 rounded-lg ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'}`}
            >
              Löschen
            </button>
          </li>
        ))}
      </ul>
      {selected && (
        <div className="mt-6 bg-gray-900 p-4 rounded-lg border border-gray-600">
          <h3 className="text-xl font-bold text-white mb-2">Retourendetails</h3>
          <p className="text-gray-300"><strong>Artikelnummer:</strong> {selected.Artikelnummer}</p>
          <p className="text-gray-300"><strong>Menge:</strong> {selected.Menge}</p>
          <p className="text-gray-300"><strong>Grund:</strong> {selected.GrundDerRetoure}</p>
          <p className="text-gray-300"><strong>Lieferant:</strong> {selected.Lieferant}</p>
          <p className="text-gray-300"><strong>Datum:</strong> {selected.Datum}</p>
          <button
            onClick={() => setSelected(null)}
            className="mt-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
          >
            Schließen
          </button>
        </div>
      )}
    </div>
  );
};

const OrderDetails = ({ orders }) => {
  const { id } = useParams();
  const order = orders.find(o => o.BestellID === id);

  if (!order) return <div className="detail-view p-4">❌ Bestellung nicht gefunden.</div>;

  return (
    <div className="detail-view p-4">
      <h2 className="text-2xl font-bold text-[#f7a440] mb-4">Bestelldetails</h2>
      <div className="bg-gray-800 p-4 rounded-lg space-y-2">
        <p className="text-gray-300"><strong>Artikel:</strong> {order.Artikelbeschreibung}</p>
        <p className="text-gray-300"><strong>Menge:</strong> {order.Menge} {order.Einheit}</p>
        <p className="text-gray-300"><strong>Einzelpreis:</strong> {order.PreisProEinheit} €</p>
        <p className="text-gray-300"><strong>Gesamtpreis:</strong> {order.Gesamtpreis} €</p>
        <p className="text-gray-300"><strong>Lieferant:</strong> {order.Lieferant}</p>
        <p className="text-gray-300"><strong>Kategorie:</strong> {order.Kategorie}</p>
        <p className="text-gray-300"><strong>Geplant:</strong> {order.GeplantesLieferdatum}</p>
        <p className="text-gray-300"><strong>Tatsächlich:</strong> {order.TatsächlichesLieferdatum}</p>
        <p className="text-gray-300"><strong>Lieferdauer:</strong> {order.Lieferdauer} Tage</p>
        <Link to="/orderlog" className="text-[#f7a440] hover:underline">← Zurück zur Liste</Link>
      </div>
    </div>
  );
};

const OutputDetails = ({ outputs }) => {
  const { id } = useParams();
  const output = outputs.find(a => a.AusgangsID === id);

  if (!output) return <div className="detail-view p-4">❌ Ausgang nicht gefunden.</div>;

  return (
    <div className="detail-view p-4">
      <h2 className="text-2xl font-bold text-[#f7a440] mb-4">Ausgabendetails</h2>
      <div className="bg-gray-800 p-4 rounded-lg space-y-2">
        <p className="text-gray-300"><strong>Artikelnummer:</strong> {output.Artikelnummer}</p>
        <p className="text-gray-300"><strong>Menge:</strong> {output.VerbrauchteMenge}</p>
        <p className="text-gray-300"><strong>Lagerbestand Vor:</strong> {output.LagerbestandVor}</p>
        <p className="text-gray-300"><strong>Lagerbestand Nach:</strong> {output.LagerbestandNach}</p>
        <p className="text-gray-300"><strong>Datum:</strong> {output.Ausgangsdatum}</p>
        <p className="text-gray-300"><strong>Bemerkung:</strong> {output.Bemerkungen}</p>
        <Link to="/outputlog" className="text-[#f7a440] hover:underline">← Zurück zur Liste</Link>
      </div>
    </div>
  );
};

const ReturnDetails = ({ returns }) => {
  const { id } = useParams();
  const returnItem = returns.find(r => r.RetoureID === id);

  if (!returnItem) return <div className="detail-view p-4">❌ Retoure nicht gefunden.</div>;

  return (
    <div className="detail-view p-4">
      <h2 className="text-2xl font-bold text-[#f7a440] mb-4">Retourendetails</h2>
      <div className="bg-gray-800 p-4 rounded-lg space-y-2">
        <p className="text-gray-300"><strong>Artikelnummer:</strong> {returnItem.Artikelnummer}</p>
        <p className="text-gray-300"><strong>Menge:</strong> {returnItem.Menge}</p>
        <p className="text-gray-300"><strong>Grund:</strong> {returnItem.GrundDerRetoure}</p>
        <p className="text-gray-300"><strong>Lieferant:</strong> {returnItem.Lieferant}</p>
        <p className="text-gray-300"><strong>Datum:</strong> {returnItem.Datum}</p>
        <Link to="/returnlog" className="text-[#f7a440] hover:underline">← Zurück zur Liste</Link>
      </div>
    </div>
  );
};

const App = () => {
  const [orders, setOrders] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [returns, setReturns] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [dataError, setDataError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    console.log('Loading data...');
    try {
      const [ordersResult, outputsResult, returnsResult] = await Promise.all([
        fetchData('bestellungen'),
        fetchData('ausgaenge'),
        fetchData('retouren'),
      ]);

      const errors = [
        ordersResult.error && `Bestellungen: ${ordersResult.error}`,
        outputsResult.error && `Ausgänge: ${outputsResult.error}`,
        returnsResult.error && `Retouren: ${returnsResult.error}`,
      ].filter(Boolean).join('; ');

      if (errors) {
        setDataError(`Fehler beim Laden der Daten: ${errors}`);
        console.error('Load data errors:', errors);
      } else {
        setDataError(null);
      }

      setOrders(ordersResult.data || []);
      setOutputs(outputsResult.data || []);
      setReturns(returnsResult.data || []);
      console.log('Data loaded:', {
        orders: (ordersResult.data || []).length,
        outputs: (outputsResult.data || []).length,
        returns: (returnsResult.data || []).length,
        newestOrder: (ordersResult.data || []).slice(-1)[0]?.BestellID,
        newestOutput: (outputsResult.data || []).slice(-1)[0]?.AusgangsID,
        newestReturn: (returnsResult.data || []).slice(-1)[0]?.RetoureID,
      });
    } catch (err) {
      console.error('Error loading data:', err);
      setDataError(`Fehler beim Laden der Daten: ${err.message}`);
      setOrders([]);
      setOutputs([]);
      setReturns([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    console.log('Initial loadData call');
    loadData();
  }, [loadData]);

  const handleDataUpdate = useCallback(({ type, newEntry, deletedID }) => {
    console.log('handleDataUpdate called with:', { type, newEntry, deletedID });
    if (newEntry) {
      if (type === 'Eingang') {
        setOrders(prev => {
          const exists = prev.some(o => o.BestellID === newEntry.BestellID);
          if (exists) {
            console.log('BestellID already exists in orders:', newEntry.BestellID);
            return prev;
          }
          const newOrders = [...prev, newEntry];
          console.log('Updated orders state:', newOrders.length, newOrders.slice(-5));
          return newOrders;
        });
      } else if (type === 'Ausgang') {
        setOutputs(prev => {
          const exists = prev.some(o => o.AusgangsID === newEntry.AusgangsID);
          if (exists) {
            console.log('AusgangsID already exists in outputs:', newEntry.AusgangsID);
            return prev;
          }
          const newOutputs = [...prev, newEntry];
          console.log('Updated outputs state:', newOutputs.length, newOutputs.slice(-5));
          return newOutputs;
        });
      } else if (type === 'Retoure') {
        setReturns(prev => {
          const exists = prev.some(r => r.RetoureID === newEntry.RetoureID);
          if (exists) {
            console.log('RetoureID already exists in returns:', newEntry.RetoureID);
            return prev;
          }
          const newReturns = [...prev, newEntry];
          console.log('Updated returns state:', newReturns.length, newReturns.slice(-5));
          return newReturns;
        });
      }
    } else if (deletedID) {
      if (type === 'Eingang') {
        setOrders(prev => {
          const newOrders = prev.filter(o => o.BestellID !== deletedID);
          console.log('Updated orders state after delete:', newOrders.length, newOrders.slice(-5));
          return newOrders;
        });
      } else if (type === 'Ausgang') {
        setOutputs(prev => {
          const newOutputs = prev.filter(o => o.AusgangsID !== deletedID);
          console.log('Updated outputs state after delete:', newOutputs.length, newOutputs.slice(-5));
          return newOutputs;
        });
      } else if (type === 'Retoure') {
        setReturns(prev => {
          const newReturns = prev.filter(r => r.RetoureID !== deletedID);
          console.log('Updated returns state after delete:', newReturns.length, newReturns.slice(-5));
          return newReturns;
        });
      }
    } else {
      console.log('No newEntry or deletedID provided, no state update performed');
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const isNowMobile = window.innerWidth <= 768;
      setIsMobile(isNowMobile);
      setMenuOpen(!isNowMobile);
      console.log('Resize:', { isMobile: isNowMobile, menuOpen: !isNowMobile });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Router>
      <button
        onClick={() => setMenuOpen(prev => !prev)}
        className="menu-toggle"
      >
        ☰
      </button>
      <div className="app">
        <aside
          className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}
        >
          <Sidebar isOpen={menuOpen} setIsOpen={setMenuOpen} isMobile={isMobile} />
        </aside>
        {menuOpen && isMobile && (
          <div
            className="overlay active"
            onClick={() => setMenuOpen(false)}
          ></div>
        )}
        <main className="main-content">
          {dataError && (
            <div className="text-red-500 text-center p-4 mb-4 bg-red-100 rounded-lg">
              {dataError}
            </div>
          )}
          {isLoading && (
            <div className="text-[#f7a440] text-center p-4 mb-4 bg-[#1b1f23] rounded-lg">
              Daten werden geladen...
            </div>
          )}
          <button
            onClick={loadData}
            className="reload-data-button"
          >
            Daten neu laden
          </button>
          <Routes>
            <Route
              path="/"
              element={
                <div className="home space-y-8">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#f7a440] mb-6">Dashboard</h1>
                  {isLoading ? (
                    <div className="text-gray-400 text-center">Lade Vorschauen...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {orders.length === 0 && outputs.length === 0 && returns.length === 0 ? (
                        <div className="text-gray-400 text-center col-span-full">
                          Keine Daten verfügbar. Bitte überprüfen Sie die Datenbankverbindung oder laden Sie die Daten erneut.
                        </div>
                      ) : (
                        <>
                          <PreviewCard title="Lagerentwicklung" path="/lagerverlauf">
                            <LagerverlaufPreview orders={orders} outputs={outputs} />
                          </PreviewCard>
                          <PreviewCard title="Retourenübersicht" path="/retouren">
                            <RetourenPreview retouren={returns} />
                          </PreviewCard>
                          <PreviewCard title="Liefertermintreue" path="/termintreue">
                            <TermintreuePreview orders={orders} />
                          </PreviewCard>
                          <PreviewCard title="Lieferantenbewertung" path="/lieferantenbewertung">
                            <BewertungPreview orders={orders} retouren={returns} />
                          </PreviewCard>
                          <PreviewCard title="Automatisierung" path="/automatisierung">
                            <AutomatisierungPreview orders={orders} />
                          </PreviewCard>
                        </>
                      )}
                    </div>
                  )}
                </div>
              }
            />
            <Route
              path="/live-scannen"
              element={
                <div className="live-scannen space-y-6">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#f7a440] mb-6">Live-Scannen</h1>
                  <div className="grid">
                    <BarcodeScanner
                      orders={orders}
                      setOrders={setOrders}
                      outputs={outputs}
                      setOutputs={setOutputs}
                      returns={returns}
                      setReturns={setReturns}
                      onDataUpdate={handleDataUpdate}
                    />
                    <InvoiceScanner onDataUpdate={handleDataUpdate} />
                  </div>
                </div>
              }
            />
            <Route
              path="/lagerverlauf"
              element={<Lagerverlauf orders={orders} outputs={outputs} />}
            />
            <Route path="/retouren" element={<Retouren returns={returns} />} />
            <Route path="/termintreue" element={<Termintreue orders={orders} />} />
            <Route path="/lieferantenbewertung" element={<Lieferantenbewertung orders={orders} retouren={returns} />} />
            <Route path="/automatisierung" element={<Automatisierung orders={orders} onDataUpdate={handleDataUpdate} />} />
            <Route path="/engpaesse" element={<Engpaesse orders={orders} />} />
            <Route path="/finanzen" element={<Finanzen orders={orders} />} />
            <Route path="/tutorial" element={<Tutorial />} />
            <Route
              path="/orderlog"
              element={<OrderLog orders={orders} setOrders={setOrders} onDataUpdate={handleDataUpdate} />}
            />
            <Route path="/orderlog/:id" element={<OrderDetails orders={orders} />} />
            <Route
              path="/outputlog"
              element={<OutputLog outputs={outputs} setOutputs={setOutputs} onDataUpdate={handleDataUpdate} />}
            />
            <Route path="/outputlog/:id" element={<OutputDetails outputs={outputs} />} />
            <Route
              path="/returnlog"
              element={<ReturnLog returns={returns} setReturns={setReturns} onDataUpdate={handleDataUpdate} />}
            />
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