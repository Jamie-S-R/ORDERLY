import React, { useState, useEffect, useMemo } from 'react';
import { FaSync, FaCheckCircle, FaExclamationTriangle, FaPlug } from 'react-icons/fa';

const mockSupplierApis = {
  'Continental AG': 'https://api.continental.com/v1/orders',
  'Magura Bosch Parts & Services GmbH': 'https://api.magurabosch.com/v1/orders',
  'Selle Italia S.r.l.': 'https://api.selleitalia.com/v1/orders',
  'SRAM Corporation': 'https://api.sram.com/v1/orders',
  'Shimano GmbH': 'https://api.shimano.com/v1/orders',
};

const AccordionSection = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <section className="mb-6 border border-gray-600 rounded-lg overflow-hidden">
      <header
        className="p-3 bg-gray-700 text-white font-semibold cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <svg
          className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </header>
      <div
        className={`p-4 bg-gray-800 transition-max-height duration-300 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0 overflow-hidden'}`}
      >
        {children}
      </div>
    </section>
  );
};

const Automatisierung = ({ orders = [], onDataUpdate }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [autoOrders, setAutoOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectedSuppliers, setConnectedSuppliers] = useState({});

  const fetchSuppliers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/supabase?suppliers=true&_t=${Date.now()}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) throw new Error(`Fehler: ${response.status}`);
      const data = await response.json();
      setSuppliers(data);
    } catch (err) {
      setError('Fehler beim Abrufen der Lieferanten: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConnectedSuppliers = async () => {
    try {
      const response = await fetch(`/api/supabase?table=connected_suppliers&_t=${Date.now()}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) throw new Error(`Serverfehler: ${response.status}`);
      const data = await response.json();
      const connected = data.reduce((acc, { supplier, api }) => {
        acc[supplier] = api;
        return acc;
      }, {});
      setConnectedSuppliers(connected);
    } catch (err) {
      console.error('Fehler beim Laden des Verbindungsstatus:', err);
      setError('Fehler beim Laden der Daten: ' + err.message);
    }
  };

  const fetchAutoOrders = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/supabase?table=bestellungen&_t=${Date.now()}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) throw new Error(`Fehler: ${response.status}`);
      const data = await response.json();
      const lowStockItems = data.filter(o => parseInt(o.AktuellerLagerbestand) < 20);
      const mockOrders = lowStockItems.map(o => {
        const supplierApi = mockSupplierApis[o.Lieferant];
        const isConnected = !!connectedSuppliers[o.Lieferant];
        return {
          lieferant: o.Lieferant,
          artikel: o.Artikelbeschreibung,
          artikelnummer: o.Artikelnummer,
          bestand: parseInt(o.AktuellerLagerbestand) || 0,
          bestellnummer: `#AUTO-${Math.floor(Math.random() * 100000)}`,
          lieferdatum: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: isConnected ? 'Bestellt' : 'Wartet auf API',
          progressText: isConnected ? 'Bestellung platziert' : 'API-Verbindung erforderlich',
          progressPercent: isConnected ? 80 : 20,
          menge: 50,
        };
      });
      setAutoOrders(mockOrders);
    } catch (err) {
      setError('Fehler beim Abrufen der Bestellungen');
    } finally {
      setIsLoading(false);
    }
  };

  const connectSupplier = async (supplierName) => {
    setIsLoading(true);
    setError(null);
    try {
      const api = mockSupplierApis[supplierName];
      if (!api) throw new Error(`Keine API für ${supplierName} gefunden`);
      setConnectedSuppliers(prev => ({ ...prev, [supplierName]: api }));
      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'connected_suppliers', data: { supplier: supplierName, api } }),
      });
      if (!response.ok) throw new Error(`Fehler beim Speichern: ${response.status}`);
      setAutoOrders(prev =>
        prev.map(o =>
          o.lieferant === supplierName
            ? { ...o, status: 'Bestellt', progressText: 'Bestellung platziert', progressPercent: 80 }
            : o
        )
      );
    } catch (err) {
      console.error('Fehler beim Verbinden:', err);
      setError('Fehler beim Verbinden der API: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetConnections = async () => {
    setIsLoading(true);
    try {
      await Promise.all(
        Object.keys(connectedSuppliers).map(supplier =>
          fetch('/api/supabase', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ table: 'connected_suppliers', id: supplier, idField: 'supplier' }),
          })
        )
      );
      setConnectedSuppliers({});
      setAutoOrders(prev =>
        prev.map(o => ({ ...o, status: 'Wartet auf API', progressText: 'API-Verbindung erforderlich', progressPercent: 20 }))
      );
    } catch (err) {
      setError('Fehler beim Zurücksetzen der Verbindungen');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchConnectedSuppliers();
    fetchAutoOrders();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return autoOrders.filter(o => o.bestand < 20);
  }, [autoOrders]);

  return (
    <div className="detail-view p-4">
      <h2 className="text-2xl font-bold text-[#f7a440] mb-4">🤖 Automatisierte Bestellungen</h2>
      <p className="text-gray-300 mb-4">
        Automatisieren Sie Ihre Bestellungen durch Integration mit Lieferanten-APIs.
      </p>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            fetchSuppliers();
            fetchAutoOrders();
          }}
          className="bg-[#3b82f6] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#2563eb]"
          disabled={isLoading}
        >
          <FaSync className={isLoading ? 'animate-spin' : ''} /> Daten synchronisieren
        </button>
      </div>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {isLoading && <p className="text-yellow-500 text-center mb-4">Lade Daten...</p>}

      <AccordionSection title="Lieferanten verbinden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {suppliers.map((supplier, index) => {
            const supplierApi = mockSupplierApis[supplier];
            return (
              <div key={index} className="border border-gray-600 rounded-lg p-4 bg-gray-900">
                <h3 className="text-lg font-bold text-[#f7a440]">{supplier}</h3>
                <p className="text-gray-300 text-sm mt-2">
                  Status: {connectedSuppliers[supplier] ? (
                    <span className="text-green-500 flex items-center gap-1">
                      <FaCheckCircle /> Verbunden
                    </span>
                  ) : (
                    <span className="text-yellow-500 flex items-center gap-1">
                      <FaExclamationTriangle /> Nicht verbunden
                    </span>
                  )}
                </p>
                <button
                  onClick={() => connectSupplier(supplier)}
                  disabled={connectedSuppliers[supplier] || !supplierApi || isLoading}
                  className={`mt-3 w-full bg-[#10b981] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                    connectedSuppliers[supplier] || !supplierApi || isLoading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-[#059669]'
                  }`}
                >
                  <FaPlug /> {connectedSuppliers[supplier] ? 'Verbunden' : 'API verbinden'}
                </button>
                {!supplierApi && (
                  <p className="text-red-500 text-sm mt-2">Keine API für diesen Lieferanten verfügbar</p>
                )}
              </div>
            );
          })}
          {suppliers.length === 0 && !isLoading && (
            <p className="text-gray-400">Keine Lieferanten gefunden.</p>
          )}
        </div>
      </AccordionSection>

      <AccordionSection title="Automatisierte Bestellungen">
        <div className="overflow-x-auto">
          <table className="w-full text-gray-300 text-sm border-collapse">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-2 text-left border-b border-gray-500">Lieferant</th>
                <th className="p-2 text-left border-b border-gray-500">Artikel</th>
                <th className="p-2 text-left border-b border-gray-500">Bestellnummer</th>
                <th className="p-2 text-right border-b border-gray-500">Menge</th>
                <th className="p-2 text-right border-b border-gray-500">Bestand</th>
                <th className="p-2 text-left border-b border-gray-500">Status</th>
                <th className="p-2 text-left border-b border-gray-500">Fortschritt</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, index) => (
                <tr key={index} className="hover:bg-gray-700">
                  <td className="p-2 border-b border-gray-600">{order.lieferant}</td>
                  <td className="p-2 border-b border-gray-600">{order.artikel} ({order.artikelnummer})</td>
                  <td className="p-2 border-b border-gray-600">{order.bestellnummer}</td>
                  <td className="p-2 text-right border-b border-gray-600">{order.menge}</td>
                  <td className="p-2 text-right border-b border-gray-600">{order.bestand}</td>
                  <td className="p-2 border-b border-gray-600">
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.status === 'Bestellt' ? 'bg-green-500 text-black' : 'bg-yellow-500 text-black'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-2 border-b border-gray-600">
                    <div className="bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-[#f7a440] h-2 rounded-full"
                        style={{ width: `${order.progressPercent}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && !isLoading && (
            <p className="text-gray-400 text-center mt-4">Keine automatisierten Bestellungen gefunden.</p>
          )}
        </div>
      </AccordionSection>

      {/* Versteckter Reset-Button für Testzwecke - vor dem Pitch entfernen oder auskommentieren */}
      <button
        onClick={resetConnections}
        className="mt-4 bg-red-500 text-white px-4 py-2 rounded-lg hidden"
      >
        Reset Verbindungen (Test)
      </button>
    </div>
  );
};

export default Automatisierung;