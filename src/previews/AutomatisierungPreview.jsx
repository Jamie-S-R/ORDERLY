import React, { useMemo } from 'react';

const AutomatisierungPreview = ({ orders = [] }) => {
  const autoOrders = useMemo(() => {
    const lowStockItems = orders.filter(o => parseInt(o.AktuellerLagerbestand) < 20);
    return lowStockItems.map(o => ({
      lieferant: o.Lieferant,
      artikel: o.Artikelbeschreibung,
      artikelnummer: o.Artikelnummer,
      bestand: parseInt(o.AktuellerLagerbestand) || 0,
      menge: 50,
    })).slice(0, 3); // Nur die ersten 3 anzeigen
  }, [orders]);

  return (
    <div className="p-2 text-gray-300 text-sm">
      {autoOrders.length === 0 ? (
        <div className="text-gray-400 text-center py-4">Keine Bestellungen verfügbar</div>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-700">
              <th className="p-1 text-left">Lieferant</th>
              <th className="p-1 text-left">Artikel</th>
              <th className="p-1 text-right">Menge</th>
            </tr>
          </thead>
          <tbody>
            {autoOrders.map((order, index) => (
              <tr key={index} className="hover:bg-gray-700">
                <td className="p-1">{order.lieferant}</td>
                <td className="p-1">{order.artikel}</td>
                <td className="p-1 text-right">{order.menge}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AutomatisierungPreview;