import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Supabase Key:', supabaseKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase configuration missing');
  throw new Error('REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY must be set');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { method, query, body } = req;

  console.log('Request received:', { method, query, body });

  if (method === 'GET') {
    const { table } = query;
    console.log('GET request: table=', table);
    if (!table || !['bestellungen', 'ausgaenge', 'retouren'].includes(table)) {
      console.error('Invalid table name:', table);
      return res.status(400).json({ error: 'Invalid table name' });
    }

    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.error('Supabase GET error:', error);
        return res.status(500).json({ error: error.message });
      }
      console.log('Supabase GET data:', data);
      return res.status(200).json(data);
    } catch (err) {
      console.error('Server error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  if (method === 'POST') {
    const { table, data } = body;
    console.log('POST request: table=', table, 'data=', data);
    if (!table || !['bestellungen', 'ausgaenge', 'retouren'].includes(table)) {
      console.error('Invalid table name:', table);
      return res.status(400).json({ error: 'Invalid table name' });
    }

    try {
      const { data: insertedData, error } = await supabase.from(table).insert([data]).select();
      if (error) {
        console.error('Supabase POST error:', error);
        return res.status(500).json({ error: error.message });
      }
      console.log('Supabase POST success:', insertedData);
      return res.status(200).json(insertedData);
    } catch (err) {
      console.error('Server error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}