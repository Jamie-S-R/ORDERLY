import { put, list } from '@vercel/blob';
import fetch from 'node-fetch';
import Papa from 'papaparse';

export default async function handler(req, res) {
  console.log('API Request:', { method: req.method, query: req.query, body: req.body });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const { method, query, body } = req;
  const { file } = query;
  const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

  if (!token) {
    console.error('BLOB_READ_WRITE_TOKEN is not set');
    return res.status(500).json({ error: 'Missing BLOB_READ_WRITE_TOKEN' });
  }

  if (method === 'GET') {
    if (!['ausgaenge.csv', 'bestellungen.csv'].includes(file)) {
      console.error('Invalid file name:', file);
      return res.status(400).json({ error: 'Invalid file name', received: file });
    }
    try {
      const blobs = await list({ token });
      const targetBlob = blobs.blobs.find(blob => blob.pathname === file);
      if (!targetBlob) {
        console.log('No blob found for:', file);
        return res.status(200).send('');
      }
      const response = await fetch(targetBlob.downloadUrl);
      const text = await response.text();
      res.status(200).send(text);
    } catch (err) {
      console.error('GET Error:', err);
      res.status(500).json({ error: 'Error reading file: ' + err.message });
    }
  } else if (method === 'POST') {
    try {
      const { ausgaenge, bestellungen } = body;
      if (!ausgaenge && !bestellungen) {
        console.error('No CSV data provided in body');
        return res.status(400).json({ error: 'No CSV data provided' });
      }

      const blobs = await list({ token });

      if (ausgaenge) {
        console.log('Processing ausgaenge.csv:', ausgaenge.slice(0, 100));
        const existingAusgaengeBlob = blobs.blobs.find(blob => blob.pathname === 'ausgaenge.csv');
        let existingAusgaenge = '';
        if (existingAusgaengeBlob) {
          const response = await fetch(existingAusgaengeBlob.downloadUrl);
          existingAusgaenge = await response.text();
        }
        const newAusgaenge = existingAusgaenge ? `${existingAusgaenge.trim()}\n${ausgaenge.trim()}` : ausgaenge;
        await put('ausgaenge.csv', newAusgaenge, { access: 'public', token, addRandomSuffix: false });
      }

      if (bestellungen) {
        console.log('Processing bestellungen.csv:', bestellungen.slice(0, 100));
        const existingBestellungenBlob = blobs.blobs.find(blob => blob.pathname === 'bestellungen.csv');
        let existingBestellungen = '';
        let existingIds = [];
        if (existingBestellungenBlob) {
          const response = await fetch(existingBestellungenBlob.downloadUrl);
          existingBestellungen = await response.text();
          const parsed = Papa.parse(existingBestellungen, { header: true, skipEmptyLines: true });
          existingIds = parsed.data.map(row => parseInt(row.BestellID)).filter(id => !isNaN(id));
        }

        // Parse neue Daten ohne Kopfzeile
        const newData = Papa.parse(bestellungen, { header: false, skipEmptyLines: true }).data;
        for (const row of newData) {
          const newId = parseInt(row[0]); // BestellID ist erste Spalte
          if (isNaN(newId)) {
            console.error('Invalid BestellID:', row[0]);
            return res.status(400).json({ error: 'Invalid BestellID: ' + row[0] });
          }
          if (existingIds.includes(newId)) {
            console.error('Duplicate BestellID:', newId);
            return res.status(400).json({ error: 'Duplicate BestellID: ' + newId });
          }
          if (newId >= 1000 && newId <= 2999) {
            console.error('BestellID in reserved range:', newId);
            return res.status(400).json({ error: 'BestellID in reserved range (1000-2999): ' + newId });
          }
        }

        // Anhängen ohne Kopfzeile
        const newBestellungenRows = newData.map(row => row.join(',')).join('\n');
        const newBestellungen = existingBestellungen ? `${existingBestellungen.trim()}\n${newBestellungenRows}` : `BestellID,Bestelldatum,Bestellart,Lieferant,Artikelnummer,Artikelbeschreibung,Menge,Einheit,PreisProEinheit,Bestellstatus,GeplantesLieferdatum,TatsächlichesLieferdatum,AktuellerLagerbestand,Engpass,KritischSeit,Gesamtpreis,Lieferdauer,JahrMonat,Kategorie\n${newBestellungenRows}`;
        await put('bestellungen.csv', newBestellungen, { access: 'public', token, addRandomSuffix: false });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      console.error('POST Error:', err);
      res.status(500).json({ error: 'Error writing file: ' + err.message });
    }
  } else if (method === 'DELETE') {
    try {
      const { file, id, idField } = body;
      if (!['ausgaenge.csv', 'bestellungen.csv'].includes(file)) {
        console.error('Invalid file name:', file);
        return res.status(400).json({ error: 'Invalid file name', received: file });
      }
      if (!id || !idField) {
        console.error('Missing id or idField');
        return res.status(400).json({ error: 'Missing id or idField' });
      }

      const blobs = await list({ token });
      const targetBlob = blobs.blobs.find(blob => blob.pathname === file);
      if (!targetBlob) {
        console.log('No blob found for:', file);
        return res.status(404).json({ error: 'File not found' });
      }

      // Fetch existing CSV
      const response = await fetch(targetBlob.downloadUrl);
      const existingCsv = await response.text();
      if (!existingCsv) {
        return res.status(404).json({ error: 'No data in file' });
      }

      // Parse CSV and remove the row with the specified ID
      const parsed = Papa.parse(existingCsv, { header: true, skipEmptyLines: true });
      const filteredData = parsed.data.filter(row => row[idField] !== id.toString());
      if (parsed.data.length === filteredData.length) {
        console.log(`No entry found with ${idField}: ${id}`);
        return res.status(404).json({ error: `No entry found with ${idField}: ${id}` });
      }

      // Convert back to CSV, ensuring no trailing empty lines
      const newCsv = Papa.unparse(filteredData, { header: true }).trim();
      await put(file, newCsv, { access: 'public', token, addRandomSuffix: false });

      res.status(200).json({ success: true });
    } catch (err) {
      console.error('DELETE Error:', err);
      res.status(500).json({ error: 'Error deleting data: ' + err.message });
    }
  } else {
    console.error('Method not allowed:', method);
    res.status(405).json({ error: 'Method not allowed' });
  }
}