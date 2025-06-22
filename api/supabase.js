import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('API Request:', { method: req.method, query: req.query, body: req.body });
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  const { method, query, body } = req;
  const { table } = query;

  if (!['bestellungen', 'ausgaenge', 'retouren'].includes(table)) {
    console.error('Invalid table name:', table);
    return res.status(400).json({ error: 'Invalid table name', received: table });
  }

  if (method === 'GET') {
    try {
      console.log(`GET request for table: ${table}`);
      const { data, error } = await supabase
        .from(table)
        .select('*');
      if (error) {
        console.error('GET Error:', error);
        return res.status(500).json({ error: 'Error reading data: ' + error.message });
      }
      res.status(200).json(data);
    } catch (err) {
      console.error('GET Error:', err);
      res.status(500).json({ error: 'Error reading data: ' + err.message });
    }
  } else if (method === 'POST') {
    try {
      const { data } = body;
      if (!data) {
        console.error('No data provided in body');
        return res.status(400).json({ error: 'No data provided' });
      }

      console.log(`Processing POST for ${table}:`, JSON.stringify(data).slice(0, 100));
      const { data: insertedData, error } = await supabase
        .from(table)
        .insert([data])
        .select();
      if (error) {
        console.error('POST Error:', error);
        return res.status(500).json({ error: 'Error writing data: ' + error.message });
      }
      if (insertedData.length === 0) {
        console.error('No data inserted');
        return res.status(400).json({ error: 'No data inserted' });
      }
      res.status(200).json({ success: true, inserted: insertedData[0] });
    } catch (err) {
      console.error('POST Error:', err);
      res.status(500).json({ error: 'Error writing data: ' + err.message });
    }
  } else if (method === 'DELETE') {
    try {
      const { id, idField } = body;
      if (!id || !idField) {
        console.error('Missing id or idField');
        return res.status(400).json({ error: 'Missing id or idField' });
      }

      console.log(`DELETE request for ${table}, ${idField}: ${id}`);
      const { data, error } = await supabase
        .from(table)
        .delete()
        .eq(idField, id)
        .select();
      if (error) {
        console.error('DELETE Error:', error);
        return res.status(500).json({ error: 'Error deleting data: ' + error.message });
      }
      if (data.length === 0) {
        console.log(`No entry found with ${idField}: ${id}`);
        return res.status(404).json({ error: `No entry found with ${idField}: ${id}` });
      }
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