import { createClient } from '@supabase/supabase-js';
import express from 'express';
import dotenv from 'dotenv';

// Lade Umgebungsvariablen aus .env.local
dotenv.config({ path: '.env.local' });

const app = express();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase configuration missing:', { supabaseUrl, supabaseKey });
  throw new Error('Supabase configuration missing');
}

const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());

app.get('/api/supabase', async (req, res) => {
  const { table, columns, max } = req.query;
  console.log(`GET request: table=${table}, columns=${columns}, max=${max}`);
  try {
    if (!table || !['bestellungen', 'ausgaenge', 'retouren'].includes(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }
    if (max && columns) {
      console.log(`Executing RPC get_max_id for ${table}.${columns}`);
      const { data, error } = await supabase
        .rpc('get_max_id', { table_name: table, column_name: columns })
        .single();
      if (error) {
        console.error(`Supabase RPC error for ${table} max ${columns}:`, {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`RPC error: ${error.message}`);
      }
      console.log(`Maximale ${columns} für ${table}:`, data);
      res.json([{ [columns]: data || '0' }]);
    } else {
      console.log(`Executing SELECT * FROM ${table} ORDER BY ${table === 'bestellungen' ? 'BestellID' : table === 'ausgaenge' ? 'AusgangsID' : 'RetoureID'} DESC`);
      const query = supabase
        .from(table)
        .select(columns || '*')
        .order(table === 'bestellungen' ? 'BestellID' : table === 'ausgaenge' ? 'AusgangsID' : 'RetoureID', { ascending: false });
      const { data, error } = await query;
      if (error) {
        console.error(`Supabase GET error for ${table}:`, {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`GET error: ${error.message}`);
      }
      console.log(`Abgefragte Daten für ${table} (${data.length} Datensätze):`, data.slice(0, 5));
      res.json(data || []);
    }
  } catch (error) {
    console.error('Supabase GET error:', error.message, error);
    res.status(500).json({ error: 'Supabase error: ' + error.message, details: error });
  }
});

app.post('/api/supabase', async (req, res) => {
  const { table, data } = req.body;
  console.log(`POST request for ${table}:`, data);
  try {
    if (!table || !['bestellungen', 'ausgaenge', 'retouren'].includes(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }
    console.log(`Executing INSERT INTO ${table}`);
    const { data: insertedData, error } = await supabase.from(table).insert([data]).select();
    if (error) {
      console.error(`Supabase POST error for ${table}:`, {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`POST error: ${error.message}`);
    }
    console.log(`Inserted data into ${table}:`, insertedData);
    res.json(insertedData || []);
  } catch (error) {
    console.error('Supabase POST error:', error.message, error);
    res.status(500).json({ error: 'Supabase error: ' + error.message, details: error });
  }
});

app.delete('/api/supabase', async (req, res) => {
  const { table, id, idField } = req.body;
  console.log(`DELETE request for ${table} where ${idField} = ${id}`);
  try {
    if (!table || !['bestellungen', 'ausgaenge', 'retouren'].includes(table)) {
      throw new Error(`Invalid table name: ${table}`);
    }
    console.log(`Executing DELETE FROM ${table} WHERE ${idField} = ${id}`);
    const { data, error } = await supabase.from(table).delete().eq(idField, id).select();
    if (error) {
      console.error(`Supabase DELETE error for ${table}:`, {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      throw new Error(`DELETE error: ${error.message}`);
    }
    console.log(`Deleted data from ${table}:`, data);
    res.json(data || []);
  } catch (error) {
    console.error('Supabase DELETE error:', error.message, error);
    res.status(500).json({ error: 'Supabase error: ' + error.message, details: error });
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));