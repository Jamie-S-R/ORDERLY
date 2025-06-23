import React, { useMemo } from 'react';

const AutomatisierungPreview = ({ orders = [] }) => {
  const latestOrder = useMemo(() => {
    if (orders.length === 0) return null;
    const sorted = [...orders].sort((a, b) => new Date(b.Bestelldatum) - new Date(a.Bestelldatum));
    return sorted[0];
  }, [orders]);

  return (
    <div className="p-2 text-gray-300 text-sm">
      {latestOrder ? (
        <div className="mb-2">
          <strong className="text-[#f7a440]">{latestOrder.Lieferant}</strong><br />
          <span>{latestOrder.Artikelbeschreibung} ({latestOrder.Artikelnummer})</span><br />
          <span className="text-gray-400">Menge: {latestOrder.Menge} {latestOrder.Einheit}</span><br />
          <span className="text-gray-400">Status: {latestOrder.Bestellstatus}</span><br />
          <span className="text-gray-500">Lieferung: {latestOrder.GeplantesLieferdatum}</span>
        </div>
      ) : (
        <div className="text-gray-400 text-center py-4">Keine Bestellungen verfügbar</div>
      )}
    </div>
  );
};

export default AutomatisierungPreview;