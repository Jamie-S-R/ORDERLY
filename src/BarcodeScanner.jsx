// BarcodeScanner.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Quagga from 'quagga';

const AccordionSection = ({ title, children }) => (
  <section className="mb-4 border border-gray-600 rounded-lg overflow-hidden">
    <header className="p-3 bg-gray-700 text-white font-semibold cursor-pointer">
      ▼ {title}
    </header>
    <div className="p-3 bg-gray-800">{children}</div>
  </section>
);

const BarcodeScanner = ({ orders = [], setOrders, outputs = [], setOutputs, returns = [], setReturns, onDataUpdate }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [entryType, setEntryType] = useState('Eingang');
  const [newEntry, setNewEntry] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedIds, setGeneratedIds] = useState({ BestellID: '', AusgangsID: '', RetoureID: '' });

  // Fetch next ID from Supabase
  const fetchNextID = useCallback(async (table, idField) => {
    try {
      console.log(`Hole nächste ${idField} für Tabelle ${table}...`);
      const response = await fetch(`/api/supabase?table=${table}&columns=${idField}&max=true&_t=${Date.now()}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) {
        const text = await response.text();
        console.error(`Fehler beim Abrufen von ${table}:`, text);
        throw new Error(`Fehler beim Abrufen von ${table}: ${response.status} - ${text}`);
      }
      const data = await response.json();
      console.log(`Abgefragte ${idField}-Daten für ${table} (${data.length} Datensätze):`, data);

      let nextId;
      if (data.length === 0 || !data[0][idField]) {
        nextId = table === 'bestellungen' ? 3000 : table === 'ausgaenge' ? 4000 : 5300;
        console.log(`Keine Datensätze in ${table}, starte mit ID: ${nextId}`);
      } else {
        const maxId = parseInt(data[0][idField], 10);
        if (isNaN(maxId)) {
          throw new Error(`Ungültige ${idField} in ${table}: ${data[0][idField]}`);
        }
        nextId = maxId + 1;
        if (table === 'bestellungen' && nextId < 3000) {
          nextId = 3000;
          console.log(`BestellID ${maxId + 1} zu niedrig, setze auf ${nextId}`);
        } else if (table === 'ausgaenge' && nextId < 4000) {
          nextId = 4000;
          console.log(`AusgangsID ${maxId + 1} zu niedrig, setze auf ${nextId}`);
        } else if (table === 'retouren' && nextId < 5300) {
          nextId = 5300;
          console.log(`RetoureID ${maxId + 1} zu niedrig, setze auf ${nextId}`);
        }
        console.log(`Maximale ${idField} für ${table}: ${maxId}, nächste ID: ${nextId}`);
      }
      return nextId;
    } catch (err) {
      console.error(`Fehler beim Abrufen der ${idField}:`, err);
      setError(`Fehler beim Abrufen der ${idField}: ${err.message}`);
      const fallbackId = table === 'bestellungen' ? 3000 : table === 'ausgaenge' ? 4000 : 5300;
      console.log(`Verwende Fallback-ID für ${table}: ${fallbackId}`);
      return fallbackId;
    }
  }, []);

  // Fetch IDs when entryType or newEntry changes
  useEffect(() => {
    let isMounted = true;
    const fetchIds = async () => {
      if (!entryType || !newEntry) return;
      try {
        console.log('Hole IDs für entryType:', entryType);
        const nextBestellID = await fetchNextID('bestellungen', 'BestellID');
        const nextAusgangsID = await fetchNextID('ausgaenge', 'AusgangsID');
        const nextRetoureID = await fetchNextID('retouren', 'RetoureID');
        if (isMounted) {
          setGeneratedIds({
            BestellID: nextBestellID.toString(),
            AusgangsID: nextAusgangsID.toString(),
            RetoureID: nextRetoureID.toString(),
          });
          console.log('Generierte IDs:', { nextBestellID, nextAusgangsID, nextRetoureID });
        }
      } catch (err) {
        if (isMounted) {
          setError('Fehler beim Laden der IDs: ' + err.message);
        }
      }
    };
    fetchIds();
    return () => {
      isMounted = false;
    };
  }, [entryType, newEntry, fetchNextID]);

  // Initialize newEntry without fetching IDs
  useEffect(() => {
    let isMounted = true;
    const initializeNewEntry = async () => {
      if (!entryType) {
        console.log('Kein entryType ausgewählt, überspringe Initialisierung');
        return;
      }
      console.log('Initialisiere newEntry für entryType:', entryType);
      try {
        const today = new Date();
        const datum = today.toISOString().split('T')[0];
        const monat = today.toISOString().slice(0, 7);
        const geplantesLieferdatum = new Date(today.getTime());
        geplantesLieferdatum.setDate(today.getDate() + 7);

        if (isMounted) {
          setNewEntry({
            AusgangsID: '',
            BestellID: '',
            RetoureID: '',
            Ausgangsdatum: datum,
            Bestelldatum: datum,
            Datum: datum,
            Artikelnummer: '',
            VerbrauchteMenge: '1',
            Menge: '1',
            LagerbestandVor: '100',
            LagerbestandNach: entryType === 'Ausgang' ? '99' : '101',
            AktuellerLagerbestand: '0',
            Bemerkungen: 'Neuer Eintrag',
            GrundDerRetoure: 'Qualitätsmängel',
            Monat: monat,
            JahrMonat: monat,
            GeplantesLieferdatum: geplantesLieferdatum.toISOString().split('T')[0],
            TatsächlichesLieferdatum: geplantesLieferdatum.toISOString().split('T')[0],
            Bestellart: 'Standardbestellung',
            Lieferant: 'Unbekannt',
            Artikelbeschreibung: 'Neuer Artikel',
            Einheit: 'Stück',
            PreisProEinheit: '0.00',
            Bestellstatus: 'Offen',
            Engpass: 'false',
            KritischSeit: '',
            Gesamtpreis: '0.00',
            Lieferdauer: '7',
            Kategorie: 'Sonstiges',
          });
          console.log('newEntry initialisiert');
        }
      } catch (err) {
        if (isMounted) {
          setError('Initialisierungsfehler: ' + err.message);
          console.error('Fehler bei Initialisierung von newEntry:', err);
        }
      }
    };

    initializeNewEntry();
    return () => {
      isMounted = false;
    };
  }, [entryType]);

  // Barcode scanning with optimized QuaggaJS
  const startScanning = async () => {
    if (!entryType) {
      setError('Bitte wählen Sie zuerst Eingang, Ausgang oder Retoure.');
      console.log('startScanning: Kein entryType ausgewählt');
      return;
    }
    if (!newEntry) {
      setError('Formular wird geladen, bitte warten.');
      console.log('startScanning: newEntry nicht initialisiert');
      return;
    }
    setIsScanning(true);
    setError(null);

    try {
      console.log('Starte Barcode-Scanner für entryType:', entryType);
      console.log('Fordere Kamera-Zugriff an...');
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 16 / 9 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Kamera-Zugriff gewährt:', stream.getVideoTracks()[0].getSettings());
      const video = videoRef.current;
      if (!video) {
        setError('Videoreferenz nicht gefunden.');
        setIsScanning(false);
        console.log('startScanning: Video-Referenz nicht gefunden');
        return;
      }

      video.srcObject = stream;
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          console.log('Video-Metadaten geladen:', video.videoWidth, 'x', video.videoHeight);
          resolve();
        };
      });
      await video.play().catch(err => {
        throw new Error('Kamerafehler: ' + err.message);
      });
      console.log('Video-Wiedergabe gestartet');

      Quagga.init({
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: video,
          constraints: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
            aspectRatio: { ideal: 16 / 9 },
          },
        },
        decoder: {
          readers: [
            'ean_reader',
            'code_128_reader',
            'ean_8_reader',
            'upc_reader',
            'upc_e_reader',
          ],
          multiple: false,
        },
        locator: {
          patchSize: 'medium',
          halfSample: true,
        },
        numOfWorkers: navigator.hardwareConcurrency || 4,
        frequency: 30,
        locate: true,
      }, (err) => {
        if (err) {
          console.error('QuaggaJS Init-Fehler:', err);
          setError('QuaggaJS Fehler: ' + err.message);
          setIsScanning(false);
          stopScanning();
          return;
        }
        console.log('QuaggaJS initialisiert');
        Quagga.start();
      });

      Quagga.onDetected((result) => {
        console.log('Barcode erkannt:', result);
        const scannedBarcode = result.codeResult.code;
        handleBarcode(scannedBarcode);
        Quagga.stop();
        setIsScanning(false);
        stopScanning();
      });

      Quagga.onProcessed((result) => {
        if (result) {
          console.log('QuaggaJS verarbeitet Frame:', result);
        }
      });
    } catch (err) {
      console.error('Scanner-Fehler:', err);
      setError('Kamerafehler: ' + err.message);
      setIsScanning(false);
      stopScanning();
    }
  };

  const stopScanning = () => {
    console.log('Stoppe Scanner...');
    setIsScanning(false);
    if (Quagga) {
      Quagga.stop();
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Handle barcode
  const handleBarcode = async (barcode) => {
    try {
      console.log('Verarbeite Barcode:', barcode, 'mit entryType:', entryType);
      setNewEntry(prev => {
        const updated = {
          ...prev,
          Artikelnummer: barcode,
          LagerbestandNach: entryType === 'Ausgang'
            ? (parseInt(prev.LagerbestandVor) - parseInt(prev.VerbrauchteMenge)).toString()
            : entryType === 'Eingang'
            ? (parseInt(prev.LagerbestandVor) + parseInt(prev.Menge)).toString()
            : prev.LagerbestandVor,
          AktuellerLagerbestand: entryType === 'Eingang' ? prev.Menge : prev.AktuellerLagerbestand,
        };
        console.log('newEntry in handleBarcode aktualisiert:', updated);
        return updated;
      });
      setScanResult({
        barcode,
        ausgang: outputs.find(item => item.Artikelnummer === barcode),
        bestellung: orders.find(item => item.Artikelnummer === barcode),
        retoure: returns.find(item => item.Artikelnummer === barcode),
        newBestellungCreated: entryType === 'Eingang',
        newAusgangCreated: entryType === 'Ausgang',
        newRetoureCreated: entryType === 'Retoure',
      });
    } catch (err) {
      console.error('Fehler beim Verarbeiten des Barcodes:', err);
      setError('Fehler beim Verarbeiten des Barcodes: ' + err.message);
    }
  };

  // Manual barcode input
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    console.log('handleManualSubmit: entryType=', entryType, 'manualBarcode=', manualBarcode);
    if (!entryType) {
      setError('Bitte wählen Sie zuerst Eingang, Ausgang oder Retoure.');
      console.log('handleManualSubmit: Kein entryType ausgewählt');
      return;
    }
    if (!manualBarcode) {
      setError('Bitte geben Sie einen Barcode ein.');
      console.log('handleManualSubmit: Kein Barcode eingegeben');
      return;
    }
    await handleBarcode(manualBarcode);
    setManualBarcode('');
  };

  // Update LagerbestandNach
  const handleNewEntryChange = (field, value) => {
    setNewEntry(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'VerbrauchteMenge' || field === 'Menge' || field === 'LagerbestandVor') {
        const vor = parseInt(updated.LagerbestandVor) || 0;
        const menge = entryType === 'Ausgang' ? parseInt(updated.VerbrauchteMenge) || 0 : parseInt(updated.Menge) || 0;
        updated.LagerbestandNach = entryType === 'Ausgang' ? (vor - menge).toString() : entryType === 'Eingang' ? (vor + menge).toString() : vor.toString();
        if (field === 'Menge' && entryType === 'Eingang') {
          updated.AktuellerLagerbestand = updated.Menge;
        }
      }
      console.log('newEntry in handleNewEntryChange aktualisiert:', updated);
      return updated;
    });
  };

  // Handle new entry form submission
  const handleNewEntrySubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) {
      console.log('handleNewEntrySubmit: Einreichung läuft, ignoriere');
      return;
    }
    console.log('handleNewEntrySubmit: entryType=', entryType);
    if (!entryType || !['Eingang', 'Ausgang', 'Retoure'].includes(entryType)) {
      setError('Ungültiger Typ ausgewählt. Bitte wählen Sie Eingang, Ausgang oder Retoure.');
      console.log('handleNewEntrySubmit: Ungültiger entryType:', entryType);
      return;
    }
    if (!newEntry?.Artikelnummer) {
      setError('Artikelnummer darf nicht leer sein.');
      console.log('handleNewEntrySubmit: Artikelnummer fehlt');
      return;
    }
    if (!generatedIds.BestellID || !generatedIds.AusgangsID || !generatedIds.RetoureID) {
      setError('IDs konnten nicht generiert werden. Bitte versuchen Sie es erneut.');
      console.log('handleNewEntrySubmit: Fehlende generierte IDs');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    try {
      const newRecord = {
        ...newEntry,
        BestellID: generatedIds.BestellID,
        AusgangsID: generatedIds.AusgangsID,
        RetoureID: generatedIds.RetoureID,
      };
      console.log('Sende neuen Datensatz mit BestellID:', newRecord.BestellID);

      console.log('Aktueller orders State vor Update:', orders.length, orders.slice(0, 5));
      console.log('Aktueller outputs State vor Update:', outputs.length, outputs.slice(0, 5));
      console.log('Aktueller returns State vor Update:', returns.length, returns.slice(0, 5));

      let tableName;
      let data;
      if (entryType === 'Eingang') {
        tableName = 'bestellungen';
        data = {
          BestellID: newRecord.BestellID,
          Bestelldatum: newRecord.Bestelldatum,
          Bestellart: newRecord.Bestellart,
          Lieferant: newRecord.Lieferant,
          Artikelnummer: newRecord.Artikelnummer,
          Artikelbeschreibung: newRecord.Artikelbeschreibung,
          Menge: newRecord.Menge,
          Einheit: newRecord.Einheit,
          PreisProEinheit: newRecord.PreisProEinheit,
          Bestellstatus: newRecord.Bestellstatus,
          GeplantesLieferdatum: newRecord.GeplantesLieferdatum,
          TatsächlichesLieferdatum: newRecord.TatsächlichesLieferdatum,
          AktuellerLagerbestand: newRecord.Menge,
          Engpass: newRecord.Engpass,
          KritischSeit: newRecord.KritischSeit,
          Gesamtpreis: newRecord.Gesamtpreis,
          Lieferdauer: newRecord.Lieferdauer,
          JahrMonat: newRecord.JahrMonat,
          Kategorie: newRecord.Kategorie,
        };
      } else if (entryType === 'Ausgang') {
        tableName = 'ausgaenge';
        data = {
          AusgangsID: newRecord.AusgangsID,
          Ausgangsdatum: newRecord.Ausgangsdatum,
          BestellID: newRecord.BestellID,
          Artikelnummer: newRecord.Artikelnummer,
          VerbrauchteMenge: newRecord.VerbrauchteMenge,
          LagerbestandVor: newRecord.LagerbestandVor,
          LagerbestandNach: newRecord.LagerbestandNach,
          Bemerkungen: newRecord.Bemerkungen,
          Monat: newRecord.Monat,
          GeplantesLieferdatum: newRecord.GeplantesLieferdatum,
          TatsächlichesLieferdatum: newRecord.TatsächlichesLieferdatum,
        };
      } else if (entryType === 'Retoure') {
        tableName = 'retouren';
        data = {
          RetoureID: newRecord.RetoureID,
          Datum: newRecord.Datum,
          Artikelnummer: newRecord.Artikelnummer,
          GrundDerRetoure: newRecord.GrundDerRetoure,
          Menge: newRecord.Menge,
          Lieferant: newRecord.Lieferant,
        };
      }

      console.log('POST-Anfrage-Body:', { table: tableName, data });

      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ table: tableName, data }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('Backend-Fehler-Antwort:', text);
        throw new Error(`Backend-Fehler: ${response.status} - ${text}`);
      }

      const insertedData = await response.json();
      console.log('POST erfolgreich:', insertedData);

      if (entryType === 'Eingang') {
        setOrders(prev => {
          const newOrders = [...prev, insertedData[0]];
          console.log('Neuer orders State nach Hinzufügen:', newOrders.length, newOrders.slice(-5));
          return newOrders;
        });
      } else if (entryType === 'Ausgang') {
        setOutputs(prev => {
          const newOutputs = [...prev, insertedData[0]];
          console.log('Neuer outputs State nach Hinzufügen:', newOutputs.length, newOutputs.slice(-5));
          return newOutputs;
        });
        setOrders(prev => {
          const bestellungIndex = prev.findIndex(item => item.Artikelnummer === newRecord.Artikelnummer);
          if (bestellungIndex !== -1) {
            const updatedOrders = [...prev];
            updatedOrders[bestellungIndex] = {
              ...updatedOrders[bestellungIndex],
              AktuellerLagerbestand: (parseInt(updatedOrders[bestellungIndex].AktuellerLagerbestand || 0) - parseInt(newRecord.VerbrauchteMenge)).toString(),
            };
            console.log('Neuer orders State nach Lagerbestand-Update:', updatedOrders.length, updatedOrders.slice(-5));
            return updatedOrders;
          }
          console.log('Keine Bestellung für Artikelnummer gefunden, orders unverändert:', prev.length);
          return prev;
        });
        setScanResult({
          barcode: newRecord.Artikelnummer,
          ausgang: insertedData[0],
          bestellung: null,
          retoure: null,
          newAusgangCreated: true,
        });
      } else if (entryType === 'Retoure') {
        setReturns(prev => {
          const newReturns = [...prev, insertedData[0]];
          console.log('Neuer returns State nach Hinzufügen:', newReturns.length, newReturns.slice(-5));
          return newReturns;
        });
        setScanResult({
          barcode: newRecord.Artikelnummer,
          ausgang: null,
          bestellung: null,
          retoure: insertedData[0],
          newRetoureCreated: true,
        });
      }

      setSuccessMessage('Eintrag erfolgreich hinzugefügt!');
      console.log('Erfolg: Eintrag hinzugefügt für', entryType);
      setTimeout(() => setSuccessMessage(null), 3000);

      // Re-initialize newEntry and reset IDs
      const today = new Date();
      const datum = today.toISOString().split('T')[0];
      const monat = today.toISOString().slice(0, 7);
      const geplantesLieferdatum = new Date(today.getTime());
      geplantesLieferdatum.setDate(today.getDate() + 7);
      setNewEntry({
        AusgangsID: '',
        BestellID: '',
        RetoureID: '',
        Ausgangsdatum: datum,
        Bestelldatum: datum,
        Datum: datum,
        Artikelnummer: '',
        VerbrauchteMenge: '1',
        Menge: '1',
        LagerbestandVor: '100',
        LagerbestandNach: entryType === 'Ausgang' ? '99' : '101',
        AktuellerLagerbestand: '0',
        Bemerkungen: 'Neuer Eintrag',
        GrundDerRetoure: 'Qualitätsmängel',
        Monat: monat,
        JahrMonat: monat,
        GeplantesLieferdatum: geplantesLieferdatum.toISOString().split('T')[0],
        TatsächlichesLieferdatum: geplantesLieferdatum.toISOString().split('T')[0],
        Bestellart: 'Standardbestellung',
        Lieferant: 'Unbekannt',
        Artikelbeschreibung: 'Neuer Artikel',
        Einheit: 'Stück',
        PreisProEinheit: '0.00',
        Bestellstatus: 'Offen',
        Engpass: 'false',
        KritischSeit: '',
        Gesamtpreis: '0.00',
        Lieferdauer: '7',
        Kategorie: 'Sonstiges',
      });
      setGeneratedIds({ BestellID: '', AusgangsID: '', RetoureID: '' });
      console.log('newEntry neu initialisiert');
      setScanResult(null);

      setTimeout(() => {
        console.log('Rufe onDataUpdate nach dem Absenden auf');
        onDataUpdate({ type: entryType, newEntry: insertedData[0] });
      }, 500);
    } catch (err) {
      console.error('Fehler beim Absenden:', err);
      setError('Fehler beim Speichern: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download all data as CSV
  const downloadAllCsvs = () => {
    const ausgaengeFields = [
      'AusgangsID', 'Ausgangsdatum', 'BestellID', 'Artikelnummer', 'VerbrauchteMenge',
      'LagerbestandVor', 'LagerbestandNach', 'Bemerkungen', 'Monat',
      'GeplantesLieferdatum', 'TatsächlichesLieferdatum'
    ];
    const bestellungenFields = [
      'BestellID', 'Bestelldatum', 'Bestellart', 'Lieferant', 'Artikelnummer', 'Artikelbeschreibung',
      'Menge', 'Einheit', 'PreisProEinheit', 'Bestellstatus', 'GeplantesLieferdatum',
      'TatsächlichesLieferdatum', 'AktuellerLagerbestand', 'Engpass', 'KritischSeit',
      'Gesamtpreis', 'Lieferdauer', 'JahrMonat', 'Kategorie'
    ];
    const retourenFields = [
      'RetoureID', 'Datum', 'Artikelnummer', 'GrundDerRetoure', 'Menge', 'Lieferant'
    ];
    downloadCsv(outputs, 'ausgaenge.csv', ausgaengeFields);
    downloadCsv(orders, 'bestellungen.csv', bestellungenFields);
    downloadCsv(returns, 'retouren.csv', retourenFields);
  };

  // Download CSV file
  const downloadCsv = (data, filename, fields) => {
    const csv = [
      fields.join(','),
      ...data.map(row => fields.map(field => `"${row[field] || ''}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sort logs by date (newest first)
  const sortedLogs = [
    ...(outputs || []).map(item => ({
      ...item,
      type: 'Ausgang',
      date: item.Ausgangsdatum,
    })),
    ...(orders || []).map(item => ({
      ...item,
      type: 'Eingang',
      date: item.Bestelldatum,
    })),
    ...(returns || []).map(item => ({
      ...item,
      type: 'Retoure',
      date: item.Datum,
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  console.log('Aktuelle sortedLogs:', sortedLogs.length, sortedLogs);

  return (
    <div className="barcode-scanner p-4 bg-gray-900 rounded-lg border-l-4 border-yellow-500 max-w-full mx-auto sm:max-w-lg">
      <h2 className="text-xl font-bold text-yellow-400 mb-4">📷 Barcode-Scanner</h2>
      <div className="mb-4">
        <label className="block text-white mb-1">Typ auswählen:</label>
        <div className="relative">
          <select
            value={entryType}
            onChange={(e) => {
              console.log('Auswahl geändert: neuer entryType=', e.target.value);
              setEntryType(e.target.value);
            }}
            className="w-full p-2 bg-gray-700 text-white rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="Eingang">Eingang</option>
            <option value="Ausgang">Ausgang</option>
            <option value="Retoure">Retoure</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
      {entryType && (
        <div className="flex flex-col gap-2 mb-4">
          {!isScanning ? (
            <button
              onClick={startScanning}
              className="bg-green-500 text-white px-4 py-2 rounded-lg w-full sm:max-w-xs mx-auto hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              Scanner starten
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="bg-red-500 text-white px-4 py-2 rounded-lg w-full sm:max-w-xs mx-auto hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Scanner stoppen
            </button>
          )}
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full max-w-md mx-auto border-2 border-yellow-500 rounded-lg"
        style={{ height: 'auto', maxHeight: '50vh', objectFit: 'contain', display: isScanning ? 'block' : 'none' }}
        muted
        playsInline
      />
      {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      {successMessage && <p className="text-green-500 text-center mt-4">{successMessage}</p>}
      {entryType && (
        <form onSubmit={handleManualSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            placeholder="Barcode manuell eingeben"
            className="p-2 flex-1 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Suchen
          </button>
        </form>
      )}
      {scanResult?.barcode && newEntry && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Gescannter Barcode: {scanResult.barcode}</h3>
          {scanResult.ausgang && (
            <p className="text-gray-300">
              Ausgang: {scanResult.ausgang.VerbrauchteMenge} Einheiten verbraucht am {scanResult.ausgang.Ausgangsdatum},
              Lagerbestand: {scanResult.ausgang.LagerbestandVor} → {scanResult.ausgang.LagerbestandNach}
            </p>
          )}
          {scanResult.bestellung && (
            <p className="text-gray-300">
              Eingang: {scanResult.bestellung.Menge} Einheiten eingegangen am {scanResult.bestellung.Bestelldatum},
              Lagerbestand: {scanResult.bestellung.AktuellerLagerbestand}
            </p>
          )}
          {scanResult.retoure && (
            <p className="text-gray-300">
              Retoure: {scanResult.retoure.Menge} Einheiten zurückgesendet am {scanResult.retoure.Datum},
              Grund: {scanResult.retoure.GrundDerRetoure}
            </p>
          )}
          {!scanResult.ausgang && !scanResult.bestellung && !scanResult.retoure && (
            <div>
              <p className="text-gray-300">
                {entryType === 'Eingang' && scanResult.newBestellungCreated
                  ? `Neuer Artikel: ${scanResult.barcode}. Wird in bestellungen hinzugefügt.`
                  : entryType === 'Ausgang' && scanResult.newAusgangCreated
                  ? `Neuer Artikel: ${scanResult.barcode}. Wird in ausgaenge hinzugefügt.`
                  : entryType === 'Retoure' && scanResult.newRetoureCreated
                  ? `Neuer Artikel: ${scanResult.barcode}. Wird in retouren hinzugefügt.`
                  : `Kein passender Eintrag gefunden: ${scanResult.barcode}`}
              </p>
              <h4 className="text-lg font-bold text-white mt-4">Neuen Eintrag hinzufügen</h4>
              <form onSubmit={handleNewEntrySubmit} className="flex flex-col gap-4 mt-2">
                {entryType === 'Eingang' && (
                  <>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">BestellID:</span>
                      <input
                        type="text"
                        value={generatedIds.BestellID || 'Lade ID...'}
                        readOnly
                        className="p-2 bg-gray-600 text-white rounded-lg"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">Bestelldatum:</span>
                      <input
                        type="date"
                        value={newEntry.Bestelldatum}
                        onChange={(e) => handleNewEntryChange('Bestelldatum', e.target.value)}
                        required
                        className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">Menge:</span>
                      <input
                        type="number"
                        value={newEntry.Menge}
                        onChange={(e) => handleNewEntryChange('Menge', e.target.value)}
                        required
                        className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">Bestellart:</span>
                      <input
                        type="text"
                        value={newEntry.Bestellart}
                        onChange={(e) => handleNewEntryChange('Bestellart', e.target.value)}
                        className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">Lieferant:</span>
                      <input
                        type="text"
                        value={newEntry.Lieferant}
                        onChange={(e) => handleNewEntryChange('Lieferant', e.target.value)}
                        className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">Artikelbeschreibung:</span>
                      <input
                        type="text"
                        value={newEntry.Artikelbeschreibung}
                        onChange={(e) => handleNewEntryChange('Artikelbeschreibung', e.target.value)}
                        className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">Einheit:</span>
                      <input
                        type="text"
                        value={newEntry.Einheit}
                        onChange={(e) => handleNewEntryChange('Einheit', e.target.value)}
                        className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">PreisProEinheit:</span>
                      <input
                        type="number"
                        value={newEntry.PreisProEinheit}
                        onChange={(e) => handleNewEntryChange('PreisProEinheit', e.target.value)}
                        className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">Bestellstatus:</span>
                      <input
                        type="text"
                        value={newEntry.Bestellstatus}
                        onChange={(e) => handleNewEntryChange('Bestellstatus', e.target.value)}
                        className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">JahrMonat:</span>
                      <input
                        type="text"
                        value={newEntry.JahrMonat}
                        onChange={(e) => handleNewEntryChange('JahrMonat', e.target.value)}
                        className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">Kategorie:</span>
                      <input
                        type="text"
                        value={newEntry.Kategorie}
                        onChange={(e) => handleNewEntryChange('Kategorie', e.target.value)}
                        className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </label>
                  </>
                )}
                {entryType === 'Ausgang' && (
                  <>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">AusgangsID:</span>
                      <input
                        type="text"
                        value={generatedIds.AusgangsID || 'Lade ID...'}
                        readOnly
                        className="p-2 bg-gray-600 text-white rounded-lg"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">Ausgangsdatum:</span>
                      <input
                        type="date"
                        value={newEntry.Ausgangsdatum}
                        onChange={(e) => handleNewEntryChange('Ausgangsdatum', e.target.value)}
                        required
                        className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">VerbrauchteMenge:</span>
                      <input
                        type="number"
                        value={newEntry.VerbrauchteMenge}
                        onChange={(e) => handleNewEntryChange('VerbrauchteMenge', e.target.value)}
                        required
                        className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </label>
                  </>
                )}
                {entryType === 'Retoure' && (
                  <>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">RetoureID:</span>
                      <input
                        type="text"
                        value={generatedIds.RetoureID || 'Lade ID...'}
                        readOnly
                        className="p-2 bg-gray-600 text-white rounded-lg"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">Datum:</span>
                      <input
                        type="date"
                        value={newEntry.Datum}
                        onChange={(e) => handleNewEntryChange('Datum', e.target.value)}
                        required
                        className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">Menge:</span>
                      <input
                        type="number"
                        value={newEntry.Menge}
                        onChange={(e) => handleNewEntryChange('Menge', e.target.value)}
                        required
                        className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">GrundDerRetoure:</span>
                      <input
                        type="text"
                        value={newEntry.GrundDerRetoure}
                        onChange={(e) => handleNewEntryChange('GrundDerRetoure', e.target.value)}
                        className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">Lieferant:</span>
                      <input
                        type="text"
                        value={newEntry.Lieferant}
                        onChange={(e) => handleNewEntryChange('Lieferant', e.target.value)}
                        className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </label>
                  </>
                )}
                <label className="flex flex-col">
                  <span className="text-white mb-1">Artikelnummer:</span>
                  <input
                    type="text"
                    value={newEntry.Artikelnummer}
                    onChange={(e) => handleNewEntryChange('Artikelnummer', e.target.value)}
                    required
                    className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </label>
                {(entryType === 'Eingang' || entryType === 'Ausgang') && (
                  <>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">LagerbestandVor:</span>
                      <input
                        type="number"
                        value={newEntry.LagerbestandVor}
                        onChange={(e) => handleNewEntryChange('LagerbestandVor', e.target.value)}
                        required
                        className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-white mb-1">LagerbestandNach:</span>
                      <input
                        type="number"
                        value={newEntry.LagerbestandNach}
                        readOnly
                        className="p-2 bg-gray-600 text-white rounded-lg"
                      />
                    </label>
                  </>
                )}
                {(entryType === 'Eingang' || entryType === 'Ausgang') && (
                  <label className="flex flex-col">
                    <span className="text-white mb-1">Bemerkungen:</span>
                    <input
                      type="text"
                      value={newEntry.Bemerkungen}
                      onChange={(e) => handleNewEntryChange('Bemerkungen', e.target.value)}
                      className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </label>
                )}
                <label className="flex flex-col">
                  <span className="text-white mb-1">GeplantesLieferdatum:</span>
                  <input
                    type="date"
                    value={newEntry.GeplantesLieferdatum}
                    onChange={(e) => handleNewEntryChange('GeplantesLieferdatum', e.target.value)}
                    className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </label>
                <label className="flex flex-col">
                  <span className="text-white mb-1">TatsächlichesLieferdatum:</span>
                  <input
                    type="date"
                    value={newEntry.TatsächlichesLieferdatum}
                    onChange={(e) => handleNewEntryChange('TatsächlichesLieferdatum', e.target.value)}
                    className="p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                </label>
                <button
                  type="submit"
                  disabled={isSubmitting || !generatedIds.BestellID || generatedIds.BestellID === 'Lade ID...'}
                  className={`bg-blue-500 text-white px-4 py-2 rounded-lg mt-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    isSubmitting || !generatedIds.BestellID || generatedIds.BestellID === 'Lade ID...' ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Wird gespeichert...' : 'Eintrag hinzufügen'}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
      <AccordionSection title="Letzte Einträge">
        <div className="overflow-x-auto">
          <table className="w-full text-gray-300 text-sm border-collapse">
            <thead>
              <tr className="bg-gray-700">
                <th className="p-2 text-left border-b border-gray-500">Typ</th>
                <th className="p-2 text-left border-b border-gray-500">Artikelnummer</th>
                <th className="p-2 text-left border-b border-gray-500">Datum</th>
                <th className="p-2 text-right border-b border-gray-500">Menge</th>
                <th className="p-2 text-right border-b border-gray-500">Lagerbestand</th>
              </tr>
            </thead>
            <tbody>
              {sortedLogs.map((log, i) => (
                <tr key={`${log.type}-${log.AusgangsID || log.BestellID || log.RetoureID}-${i}`} className="hover:bg-gray-700">
                  <td className="p-2 border-b border-gray-600">{log.type}</td>
                  <td className="p-2 border-b border-gray-600">{log.Artikelnummer}</td>
                  <td className="p-2 border-b border-gray-600">{log.date}</td>
                  <td className="p-2 text-right border-b border-gray-600">
                    {log.type === 'Ausgang' ? log.VerbrauchteMenge : log.Menge}
                  </td>
                  <td className="p-2 text-right border-b border-gray-600">
                    {log.type === 'Ausgang' ? log.LagerbestandNach : log.type === 'Eingang' ? log.AktuellerLagerbestand : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AccordionSection>
      <button
        onClick={downloadAllCsvs}
        className="bg-gray-500 text-white px-4 py-2 rounded-lg w-full mt-4 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
      >
        Alle CSVs herunterladen
      </button>
    </div>
  );
};

export default BarcodeScanner;