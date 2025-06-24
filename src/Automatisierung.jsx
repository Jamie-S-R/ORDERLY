import React, { useState, useEffect, useMemo } from 'react';
import { FaSync, FaCheckCircle, FaExclamationTriangle, FaPlug } from 'react-icons/fa';

// Mock supplier API database
const mockSupplierApis = [
  { name: 'Unbekannt', api: 'https://api.unbekannt.com/v1/orders', supportsAuto: true },
  { name: 'Lieferant A', api: 'https://api.lieferanta.com/v1/orders', supportsAuto: true },
  { name: 'Lieferant B', api: 'https://api.lieferantb.com/v2/orders', supportsAuto: true },
  { name: 'Lieferant C', api: null, supportsAuto: false },
];

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

  // Fetch unique suppliers from Supabase
  const fetchSuppliers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/supabase?suppliers=true&_t=${Date.now()}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Abrufen der Lieferanten');
      }
      const data = await response.json();
      setSuppliers(data);
      console.log(`Fetched unique suppliers (${data.length}):`, data);
    } catch (err) {
      setError(`Fehler beim Laden der Lieferanten: ${err.message}`);
      console.error('Error fetching suppliers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate fetching automated orders
  const fetchAutoOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const lowStockItems = orders.filter(o => parseInt(o.AktuellerLagerbestand) < 20);
      const mockOrders = lowStockItems.map(o => {
        const supplier = mockSupplierApis.find(s => s.name === o.Lieferant) || mockSupplierApis[0];
        return {
          lieferant: o.Lieferant,
          artikel: o.Artikelbeschreibung,
          artikelnummer: o.Artikelnummer,
          bestand: parseInt(o.AktuellerLagerbestand) || 0,
          bestellnummer: `#AUTO-${Math.floor(Math.random() * 100000)}`,
          lieferdatum: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: connectedSuppliers[o.Lieferant] ? 'Bestellt' : 'Wartet auf API',
          progressText: connectedSuppliers[o.Lieferant] ? 'Bestellung platziert' : 'API-Verbindung erforderlich',
          progressPercent: connectedSuppliers[o.Lieferant] ? 80 : 20,
          menge: 50,
        };
      });
      setAutoOrders(mockOrders);
      console.log(`Generated ${mockOrders.length} automated orders`);
    } catch (err) {
      setError('Fehler beim Abrufen der automatisierten Bestellungen');
      console.error('Error fetching auto orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Connect to supplier API
  const connectSupplier = (supplierName) => {
    setIsLoading(true);
    setError(null);
    setTimeout(() => {
      const supplier = mockSupplierApis.find(s => s.name === supplierName);
      if (supplier && supplier.supportsAuto) {
        setConnectedSuppliers(prev => ({
          ...prev,
          [supplierName]: supplier.api,
        }));
        setAutoOrders(prev =>
          prev.map(o =>
            o.lieferant === supplierName
              ? { ...o, status: 'Bestellt', progressText: 'Bestellung platziert', progressPercent: 80 }
              : o
          )
        );
        // Simulate adding a new order to bestellungen
        const lowStockItems = orders.filter(
          o => o.Lieferant === supplierName && parseInt(o.AktuellerLagerbestand) < 20
        );
        lowStockItems.forEach(item => {
          const newOrder = {
            BestellID: `AUTO-${Math.floor(Math.random() * 100000)}`,
            Bestelldatum: new Date().toISOString().split('T')[0],
            Bestellart: 'Automatisch',
            Lieferant: supplierName,
            Artikelnummer: item.Artikelnummer,
            Artikelbeschreibung: item.Artikelbeschreibung,
            Menge: '50',
            Einheit: item.Einheit,
            PreisProEinheit: item.PreisProEinheit,
            Bestellstatus: 'Bestellt',
            GeplantesLieferdatum: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            TatsächlichesLieferdatum: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            AktuellerLagerbestand: '50',
            Engpass: 'false',
            KritischSeit: '',
            Gesamtpreis: (50 * parseFloat(item.PreisProEinheit)).toFixed(2),
            Lieferdauer: '7',
            JahrMonat: new Date().toISOString().slice(0, 7),
            Kategorie: item.Kategorie,
          };
          onDataUpdate({ type: 'Eingang', newEntry: newOrder });
        });
      } else {
        setError(`Keine API für ${supplierName} verfügbar`);
      }
      setIsLoading(false);
    }, 1000);
  };

  useEffect(() => {
    fetchSuppliers();
    fetchAutoOrders();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return autoOrders.filter(o => o.bestand < 20);
  }, [autoOrders]);

  return (
    <div className="detail-view p-4">
      <h2 className="text-2xl font-bold text-[#f7a440] mb-4">🤖 Automatisierte Bestellungen</h2>
      <p className="text-gray-300 mb-4">
        Automatisieren Sie Ihre Bestellungen durch Integration mit Lieferanten-APIs (z. B. SAP, Shopify, eigene APIs).
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
            const supplierApi = mockSupplierApis.find(s => s.name === supplier) || { supportsAuto: false };
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
                  disabled={connectedSuppliers[supplier] || !supplierApi.supportsAuto || isLoading}
                  className={`mt-3 w-full bg-[#10b981] text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
                    connectedSuppliers[supplier] || !supplierApi.supportsAuto || isLoading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-[#059669]'
                  }`}
                >
                  <FaPlug /> {connectedSuppliers[supplier] ? 'Verbunden' : 'API verbinden'}
                </button>
              </div>
            );
          })}
          {suppliers.length === 0 && !isLoading && (
            <p className="text-gray-400">Keine Lieferanten gefunden. Bitte fügen Sie Bestellungen hinzu, um Lieferanten anzuzeigen.</p>
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
            <p className="text-gray-400 text-center mt-4">Keine automatisierten Bestellungen gefunden. Verbinden Sie Lieferanten-APIs oder fügen Sie Bestellungen mit niedrigem Lagerbestand hinzu.</p>
          )}
        </div>
      </AccordionSection>
    </div>
  );
};

export default Automatisierung;