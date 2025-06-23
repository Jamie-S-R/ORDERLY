import React, { useState, useEffect, useMemo } from 'react';
import { FaSync, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const AccordionSection = ({ title, children }) => (
  <section className="mb-6 border border-gray-600 rounded-lg overflow-hidden">
    <header className="p-3 bg-gray-700 text-white font-semibold cursor-pointer">
      ▼ {title}
    </header>
    <div className="p-4 bg-gray-800">{children}</div>
  </section>
);

const Automatisierung = ({ orders = [] }) => {
  const [autoOrders, setAutoOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mock external API call
  const fetchAutoOrders = async () => {
    setIsLoading(true);
    try {
      // Simuliert API-Call zu einem ERP-System (z. B. SAP, Shopify)
      const response = await new Promise(resolve => setTimeout(() => resolve({
        data: orders.map(o => ({
          lieferant: o.Lieferant,
          artikel: o.Artikelbeschreibung,
          artikelnummer: o.Artikelnummer,
          bestand: parseInt(o.AktuellerLagerbestand) || 0,
          letzteBestellung: o.Bestelldatum,
          bestellnummer: `#${o.BestellID}`,
          lieferdatum: o.GeplantesLieferdatum,
          status: o.Bestellstatus,
          progressText: o.Bestellstatus,
          progressPercent: o.Bestellstatus === 'Bestätigt' ? 80 : o.Bestellstatus === 'Offen' ? 20 : 60,
        })).filter(o => o.bestand < 20) // Simuliert Engpass-Logik
      }), 1000));
      setAutoOrders(response.data);
    } catch (err) {
      setError('Fehler beim Abrufen der automatisierten Bestellungen');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAutoOrders();
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return autoOrders.filter(o => o.bestand < 20); // Beispiel für Engpass-Filter
  }, [autoOrders]);

  return (
    <div className="detail-view p-4">
      <h2 className="text-2xl font-bold text-[#f7a440] mb-4">🤖 Automatisierte Bestellungen</h2>
      <p className="text-gray-300 mb-4">Verwaltung von Bestellungen über externe APIs (z. B. SAP, Shopify)</p>

      <div className="flex justify-end mb-4">
        <button
          onClick={fetchAutoOrders}
          className="bg-[#3b82f6] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#2563eb]"
          disabled={isLoading}
        >
          <FaSync className={isLoading ? 'animate-spin' : ''} /> Bestellungen synchronisieren
        </button>
      </div>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      {isLoading && <p className="text-yellow-500 text-center mb-4">Lade Bestellungen...</p>}

      <AccordionSection title="Automatisierte Bestellungen">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((eintrag, index) => (
            <div
              key={index}
              className="border border-gray-600 rounded-lg p-4 bg-gray-900"
            >
              <h3 className="text-lg font-bold text-[#f7a440]">{eintrag.lieferant}</h3>
              <div className="mt-2 p-3 bg-gray-800 rounded-lg">
                <strong className="text-white">{eintrag.artikel} ({eintrag.artikelnummer})</strong>
                <div className="mt-2 text-gray-300 text-sm">
                  <p>Bestand: <span className="text-red-500">{eintrag.bestand} Stück</span></p>
                  <p>Letzte Bestellung: {eintrag.letzteBestellung}</p>
                  <p>Bestellnummer: {eintrag.bestellnummer}</p>
                  <p>Lieferdatum: {eintrag.lieferdatum}</p>
                  <p>Status: <span className="bg-[#f7a440] text-black px-2 py-1 rounded">{eintrag.status}</span></p>
                </div>
                <div className="mt-3">
                  <p className="text-gray-400 text-xs">{eintrag.progressText}</p>
                  <div className="bg-gray-700 rounded-full h-2 mt-1">
                    <div
                      className="bg-[#f7a440] h-2 rounded-full"
                      style={{ width: `${eintrag.progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && !isLoading && (
            <p className="text-gray-400">Keine automatisierten Bestellungen gefunden.</p>
          )}
        </div>
      </AccordionSection>
    </div>
  );
};

export default Automatisierung;