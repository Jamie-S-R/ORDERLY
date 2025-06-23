import { createClient } from '@supabase/supabase-js';

     const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
     const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

     console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing');
     console.log('Supabase Key:', supabaseKey ? 'Set' : 'Missing');

     if (!supabaseUrl || !supabaseKey) {
       console.error('Supabase configuration missing');
       throw new Error('Supabase configuration missing');
     }

     const supabase = createClient(supabaseUrl, supabaseKey);

     export async function handler(req, res) {
       console.log('Handler invoked:', { url: req.url, method: req.method });

       const { method, query, body } = req;

       console.log('Request details:', { method, query, body });

       if (method === 'GET') {
         const { table } = query;
         console.log('GET request: table=', table);
         if (!table || !['bestellungen', 'ausgaenge', 'retouren'].includes(table)) {
           console.error('Invalid table name:', table);
           res.status(400).json({ error: 'Invalid table name' });
           return;
         }

         try {
           console.log(`Attempting to fetch data from ${table}...`);
           const { data, error } = await supabase.from(table).select('*');
           if (error) {
             console.error(`Supabase GET error for table ${table}:`, error);
             res.status(500).json({
               error: `Supabase error: ${error.message}`,
               details: error,
               table,
             });
             return;
           }
           console.log(`Supabase GET data for ${table}:`, data);
           res.status(200).json(data || []);
         } catch (err) {
           console.error(`Server error for GET ${table}:`, err);
           res.status(500).json({
             error: `Server error: ${err.message}`,
             details: err.stack,
             table,
           });
         }
         return;
       }

       if (method === 'POST') {
         const { table, data } = body;
         console.log('POST request: table=', table, 'data=', data);
         if (!table || !['bestellungen', 'ausgaenge', 'retouren'].includes(table)) {
           console.error('Invalid table name:', table);
           res.status(400).json({ error: 'Invalid table name' });
           return;
         }
         if (!data || typeof data !== 'object') {
           console.error('Invalid data:', data);
           res.status(400).json({ error: 'Invalid data' });
           return;
         }

         try {
           console.log(`Attempting to insert data into ${table}:`, data);
           const { data: insertedData, error } = await supabase.from(table).insert([data]).select();
           if (error) {
             console.error(`Supabase POST error for table ${table}:`, error);
             res.status(500).json({
               error: `Supabase error: ${error.message}`,
               details: error,
               table,
             });
             return;
           }
           console.log(`Supabase POST success for ${table}:`, insertedData);
           res.status(200).json(insertedData);
         } catch (err) {
           console.error(`Server error for POST ${table}:`, err);
           res.status(500).json({
             error: `Server error: ${err.message}`,
             details: err.stack,
             table,
           });
         }
         return;
       }

       if (method === 'DELETE') {
         const { table, id, idField } = body;
         console.log('DELETE request: table=', table, 'id=', id, 'idField=', idField);
         if (!table || !['bestellungen', 'ausgaenge', 'retouren'].includes(table)) {
           console.error('Invalid table name:', table);
           res.status(400).json({ error: 'Invalid table name' });
           return;
         }
         if (!id || !idField) {
           console.error('Invalid id or idField:', { id, idField });
           res.status(400).json({ error: 'Invalid id or idField' });
           return;
         }

         try {
           console.log(`Attempting to delete from ${table} where ${idField} = ${id}...`);
           const { data, error } = await supabase.from(table).delete().eq(idField, id).select();
           if (error) {
             console.error(`Supabase DELETE error for table ${table}:`, error);
             res.status(500).json({
               error: `Supabase error: ${error.message}`,
               details: error,
               table,
             });
             return;
           }
           console.log(`Supabase DELETE success for ${table}:`, data);
           res.status(200).json(data);
         } catch (err) {
           console.error(`Server error for DELETE ${table}:`, err);
           res.status(500).json({
             error: `Server error: ${err.message}`,
             details: err.stack,
             table,
           });
         }
         return;
       }

       console.error('Method not allowed:', method);
       res.status(405).json({ error: 'Method not allowed' });
     }