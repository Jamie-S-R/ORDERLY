import { getBlob, putBlob } from '@vercel/blob';

export default async function handler(req, res) {
  console.log('API Request:', { method: req.method, query: req.query, body: req.body });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { method, query, body } = req;
  const { file } = query;

  if (!['ausgaenge.csv', 'bestellungen.csv'].includes(file)) {
    console.error('Invalid file name:', file);
    return res.status(400).json({ error: 'Invalid file name', received: file });
  }

  if (method === 'GET') {
    try {
      const blob = await getBlob({ pathname: file });
      if (!blob) {
        console.log('No blob found for:', file);
        return res.status(200).send('');
      }
      const text = await blob.text();
      res.status(200).send(text);
    } catch (err) {
      console.error('GET Error:', err);
      res.status(500).json({ error: 'Error reading file: ' + err.message });
    }
  } else if (method === 'POST') {
    try {
      const { ausgaenge, bestellungen } = body;
      if (ausgaenge) {
        console.log('Saving ausgaenge.csv:', ausgaenge.slice(0, 100));
        await putBlob({ pathname: 'ausgaenge.csv', body: ausgaenge });
      }
      if (bestellungen) {
        console.log('Saving bestellungen.csv:', bestellungen.slice(0, 100));
        await putBlob({ pathname: 'bestellungen.csv', body: bestellungen });
      }
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('POST Error:', err);
      res.status(500).json({ error: 'Error writing file: ' + err.message });
    }
  } else {
    console.error('Method not allowed:', method);
    res.status(405).json({ error: 'Method not allowed' });
  }
}