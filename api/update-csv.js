import { getBlob, putBlob } from '@vercel/blob';

export default async function handler(req, res) {
  const { method, query, body } = req;
  const { file } = query;

  if (!['ausgaenge.csv', 'bestellungen.csv'].includes(file)) {
    return res.status(400).json({ error: 'Invalid file name' });
  }

  if (method === 'GET') {
    try {
      const blob = await getBlob({ pathname: file });
      if (!blob) {
        return res.status(200).send('');
      }
      const text = await blob.text();
      res.status(200).send(text);
    } catch (err) {
      res.status(500).json({ error: 'Error reading file: ' + err.message });
    }
  } else if (method === 'POST') {
    try {
      const { ausgaenge, bestellungen } = body;
      if (ausgaenge) await putBlob({ pathname: 'ausgaenge.csv', body: ausgaenge });
      if (bestellungen) await putBlob({ pathname: 'bestellungen.csv', body: bestellungen });
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Error writing file: ' + err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}