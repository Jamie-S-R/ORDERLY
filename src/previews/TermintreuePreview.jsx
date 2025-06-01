import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Shimano GmbH', Pünktlich: 14, Verspätet: 2 },
  { name: 'SRAM Corp.', Pünktlich: 11, Verspätet: 5 },
  { name: 'Magura GmbH', Pünktlich: 16, Verspätet: 0 },
];

const TermintreuePreview = () => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
      <XAxis dataKey="name" stroke="#ccc" />
      <YAxis stroke="#ccc" />
      <Tooltip />
      <Bar dataKey="Pünktlich" fill="#4caf50" />
      <Bar dataKey="Verspätet" fill="#f44336" />
    </BarChart>
  </ResponsiveContainer>
);

export default TermintreuePreview;
