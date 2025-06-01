// src/previews/RetourenPreview.jsx
import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

const RetourenPreview = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    Papa.parse('/data/retouren.csv', {
      header: true,
      download: true,
      complete: (results) => {
        const cleaned = results.data.filter(r => r.RetoureID);
        const map = {};
        cleaned.forEach(r => {
          const name = r.Lieferant || 'Unbekannt';
          map[name] = (map[name] || 0) + 1;
        });
        const transformed = Object.entries(map).map(([lieferant, count]) => ({ lieferant, count }));
        setData(transformed);
      }
    });
  }, []);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#444" />
        <XAxis dataKey="lieferant" stroke="#ccc" interval={0} tick={{ fontSize: 10 }} />
        <YAxis stroke="#ccc" />
        <Tooltip />
        <Bar dataKey="count" fill="#ff9800" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RetourenPreview;
