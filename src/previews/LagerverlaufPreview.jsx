// src/previews/LagerverlaufPreview.jsx
import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

const LagerverlaufPreview = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    let outputs = [];
    let orders = [];

    // Erst Ausgänge laden
    Papa.parse('/data/ausgaenge.csv', {
      header: true,
      download: true,
      complete: (result) => {
        outputs = result.data.filter(r => r.Ausgangsdatum);
        loadOrders(outputs);
      }
    });

    const loadOrders = (outputs) => {
      Papa.parse('/data/bestellungen.csv', {
        header: true,
        download: true,
        complete: (result) => {
          orders = result.data.filter(r => r.Bestelldatum);
          processData(outputs, orders);
        }
      });
    };

    const processData = (outputs, orders) => {
      const monthly = {};

      const getMonth = (dateStr) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        return isNaN(d) ? null : d.toISOString().slice(0, 7);
      };

      outputs.forEach((o) => {
        const month = getMonth(o.Ausgangsdatum);
        const menge = parseFloat(o.VerbrauchteMenge) || 0;
        if (!month) return;
        monthly[month] = monthly[month] || { month, Verbrauch: 0, Bestellungen: 0 };
        monthly[month].Verbrauch += menge;
      });

      orders.forEach((o) => {
        const month = getMonth(o.Bestelldatum);
        const menge = parseFloat(o.Menge) || 0;
        if (!month) return;
        monthly[month] = monthly[month] || { month, Verbrauch: 0, Bestellungen: 0 };
        monthly[month].Bestellungen += menge;
      });

      const dataArray = Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month));
      setData(dataArray);
    };
  }, []);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="month" stroke="#ccc" />
        <YAxis stroke="#ccc" />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Verbrauch" stroke="#ff9800" strokeWidth={2} />
        <Line type="monotone" dataKey="Bestellungen" stroke="#2196f3" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LagerverlaufPreview;
