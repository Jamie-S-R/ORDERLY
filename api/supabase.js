import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Supabase Key:', supabaseKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase configuration missing');
  return {
    status: 500,
    body: JSON.stringify({ error: 'Supabase configuration missing' }),
  };
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
      console.log(`Attempting to fetch data from ${table}...`);
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.error(`Supabase GET error for table ${table}:`, error);
        return res.status(500).json({
          error: `Supabase error: ${error.message}`,
          details: error,
          table,
        });
      }
      console.log(`Supabase GET data for ${table}:`, data);
      return res.status(200).json(data || []);
    } catch (err) {
      console.error(`Server error for GET ${table}:`, err);
      return res.status(500).json({
        error: `Server error: ${err.message}`,
        details: err.stack,
        table,
      });
    }
  }

  if (method === 'POST') {
    const { table, data } = body;
    console.log('POST request: table=', table, 'data=', data);
    if (!table || !['bestellungen', 'ausgaenge', 'retouren'].includes(table)) {
      console.error('Invalid table name:', table);
      return res.status(400).json({ error: 'Invalid table name' });
    }
    if (!data || typeof data !== 'object') {
      console.error('Invalid data:', data);
      return res.status(400).json({ error: 'Invalid data' });
    }

    try {
      console.log(`Attempting to insert data into ${table}:`, data);
      const { data: insertedData, error } = await supabase.from(table).insert([data]).select();
      if (error) {
        console.error(`Supabase POST error for table ${table}:`, error);
        return res.status(500).json({
          error: `Supabase error: ${error.message}`,
          details: error,
          table,
        });
      }
      console.log(`Supabase POST success for ${table}:`, insertedData);
      return res.status(200).json(insertedData);
    } catch (err) {
      console.error(`Server error for POST ${table}:`, err);
      return res.status(500).json({
        error: `Server error: ${err.message}`,
        details: err.stack,
        table,
      });
    }
  }

  console.error('Method not allowed:', method);
  return res.status(405).json({ error: 'Method not allowed' });
}