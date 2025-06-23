import { createClient } from '@supabase/supabase-js';

     const supabaseUrl = 'https://biyjsmjakajsrxsebnbl.supabase.co';
     const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpeWpzbWpha2Fqc3J4c2VibmJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjE3NzEsImV4cCI6MjA2NjE5Nzc3MX0.EjFEfmonScSnCWUgBrG2h9CfNu9qS6_mIss--2m39N8';

     const supabase = createClient(supabaseUrl, supabaseKey);

     async function testSupabase() {
       const tables = [
         { name: 'bestellungen', idField: 'BestellID' },
         { name: 'ausgaenge', idField: 'AusgangsID' },
         { name: 'retouren', idField: 'RetoureID' },
       ];

       for (const { name: table, idField } of tables) {
         console.log(`Testing table: ${table}`);
         try {
           const { data, error } = await supabase.from(table).select('*').limit(1);
           if (error) {
             console.error(`Error for ${table}:`, error);
           } else {
             console.log(`Data for ${table}:`, data);
           }
         } catch (err) {
           console.error(`Unexpected error for ${table}:`, err);
         }
       }

       // Test insert
       console.log('Testing insert into bestellungen...');
       try {
         // Fetch highest BestellID
         const { data: orders, error: fetchError } = await supabase
           .from('bestellungen')
           .select('BestellID')
           .order('BestellID', { ascending: false })
           .limit(1);
         if (fetchError) {
           console.error('Fetch BestellID error:', fetchError);
           return;
         }

         const nextBestellID = orders.length > 0 ? (parseInt(orders[0].BestellID) + 1).toString() : '10000';
         console.log('Next BestellID:', nextBestellID);

         const { data, error } = await supabase.from('bestellungen').insert([
           {
             BestellID: nextBestellID,
             Bestelldatum: '2025-06-23',
             Bestellart: 'Test',
             Lieferant: 'TestLieferant',
             Artikelnummer: 'TEST123',
             Artikelbeschreibung: 'Test Artikel',
             Menge: '1',
             Einheit: 'Stück',
             PreisProEinheit: '0.00',
             Bestellstatus: 'Offen',
             GeplantesLieferdatum: '2025-06-30',
             TatsächlichesLieferdatum: '2025-06-30',
             AktuellerLagerbestand: '1',
             Engpass: 'false',
             KritischSeit: '',
             Gesamtpreis: '0.00',
             Lieferdauer: '7',
             JahrMonat: '2025-06',
             Kategorie: 'Sonstiges',
           },
         ]).select();
         if (error) {
           console.error('Insert error:', error);
         } else {
           console.log('Insert success:', data);
         }
       } catch (err) {
         console.error('Unexpected insert error:', err);
       }
     }

     testSupabase();