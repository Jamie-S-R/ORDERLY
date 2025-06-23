// api/supabase.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  console.log('API handler invoked:', {
    method: req.method,
    query: req.query,
    body: req.body,
  });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  console.log('Supabase config:', {
    url: supabaseUrl ? 'Set' : 'Missing',
    key: supabaseKey ? 'Set' : 'Missing',
  });

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase configuration missing');
    return res.status(500).json({ error: 'Supabase configuration missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    if (req.method === 'GET') {
      const { table, columns, max } = req.query;
      console.log(`GET request: table=${table}, columns=${columns}, max=${max}`);
      if (!table || !['bestellungen', 'ausgaenge', 'retouren'].includes(table)) {
        console.error('Invalid table name:', table);
        return res.status(400).json({ error: `Invalid table name: ${table}` });
      }

      if (max && columns) {
        console.log(`Executing RPC get_max_id for ${table}.${columns}`);
        const { data, error } = await supabase
          .rpc('get_max_id', { table_name: table, column_name: columns })
          .single();
        if (error) {
          console.error('Supabase RPC error:', error);
          return res.status(500).json({ error: `RPC error: ${error.message}`, details: error });
        }
        console.log(`Max ${columns} for ${table}:`, data);
        return res.status(200).json([{ [columns]: data || '0' }]);
      } else {
        console.log(`Executing SELECT * FROM ${table}`);
        const query = supabase
          .from(table)
          .select(columns || '*')
          .order(
            table === 'bestellungen'
              ? 'BestellID'
              : table === 'ausgaenge'
              ? 'AusgangsID'
              : 'RetoureID',
            { ascending: false }
          );
        const { data, error } = await query;
        if (error) {
          console.error('Supabase GET error:', error);
          return res.status(500).json({ error: `GET error: ${error.message}`, details: error });
        }
        console.log(`Fetched data for ${table} (${data.length} rows):`, data.slice(0, 5));
        return res.status(200).json(data || []);
      }
    }

    if (req.method === 'POST') {
      const { table, data } = req.body;
      console.log(`POST request: table=${table}, data=`, data);
      if (!table || !['bestellungen', 'ausgaenge', 'retouren'].includes(table)) {
        console.error('Invalid table name:', table);
        return res.status(400).json({ error: `Invalid table name: ${table}` });
      }
      console.log(`Executing INSERT INTO ${table}`);
      const { data: insertedData, error } = await supabase.from(table).insert([data]).select();
      if (error) {
        console.error('Supabase POST error:', error);
        return res.status(500).json({ error: `POST error: ${error.message}`, details: error });
      }
      console.log(`Inserted data into ${table}:`, insertedData);
      return res.status(200).json(insertedData || []);
    }

    if (req.method === 'DELETE') {
      const { table, id, idField } = req.body;
      console.log(`DELETE request: table=${table}, id=${id}, idField=${idField}`);
      if (!table || !['bestellungen', 'ausgaenge', 'retouren'].includes(table)) {
        console.error('Invalid table name:', table);
        return res.status(400).json({ error: `Invalid table name: ${table}` });
      }
      console.log(`Executing DELETE FROM ${table} WHERE ${idField} = ${id}`);
      const { data, error } = await supabase.from(table).delete().eq(idField, id).select();
      if (error) {
        console.error('Supabase DELETE error:', error);
        return res.status(500).json({ error: `DELETE error: ${error.message}`, details: error });
      }
      console.log(`Deleted data from ${table}:`, data);
      return res.status(200).json(data || []);
    }

    console.error('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Unexpected error in API handler:', error);
    return res.status(500).json({ error: 'Unexpected server error', details: error.message });
  }
}