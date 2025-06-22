import React, { useEffect, useRef, useState, useCallback } from 'react';
import Quagga from 'quagga';

const AccordionSection = ({ title, children }) => (
  <section className="mb-6 border border-gray-600 rounded-md">
    <header className="p-3 bg-gray-700 text-white">
      <strong>▼ {title}</strong>
    </header>
    <div className="p-4 bg-gray-800">{children}</div>
  </section>
);

const BarcodeScanner = ({ orders, setOrders, outputs, setOutputs, returns, setReturns, onDataUpdate }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [entryType, setEntryType] = useState('');
  const [newEntry, setNewEntry] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanResult, setScanResult] = useState(null);

  // Fetch next ID from Supabase
  const fetchNextID = useCallback(async (table, idField) => {
    try {
      console.log(`Fetching next ${idField} for ${table}...`);
      const response = await fetch(`/api/supabase?table=${table}&_t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`Fehler beim Abrufen von ${table}: ${response.status}`);
      }
      const data = await response.json();
      const existingIds = data
        .map(row => parseInt(row[idField]))
        .filter(id => !isNaN(id));
      const maxId = existingIds.length > 0 ? Math.max(...existingIds) : (table === 'bestellungen' ? 2999 : table === 'ausgaenge' ? 0 : 4999);
      console.log(`Next ${idField}:`, maxId + 1);
      return maxId + 1;
    } catch (err) {
      console.error(`Fehler beim Abrufen der ${idField}:`, err);
      setError(`Fehler beim Abrufen der ${idField}: ` + err.message);
      return table === 'bestellungen' ? 3000 : table === 'ausgaenge' ? 1 : 5000; // Fallback
    }
  }, []);

  // Initialize newEntry
  useEffect(() => {
    let isMounted = true;
    const initializeNewEntry = async () => {
      if (!entryType) return;
      try {
        console.log('Initializing newEntry for entryType:', entryType);
        const today = new Date();
        const datum = today.toISOString().split('T')[0];
        const monat = today.toISOString().slice(0, 7);
        const geplantesLieferdatum = new Date(today.getTime());
        geplantesLieferdatum.setDate(today.getDate() + 7);
        const nextBestellID = await fetchNextID('bestellungen', 'BestellID');
        const nextAusgangsID = await fetchNextID('ausgaenge', 'AusgangsID');
        const nextRetoureID = await fetchNextID('retouren', 'RetoureID');

        if (isMounted) {
          setNewEntry({
            AusgangsID: nextAusgangsID.toString(),
            BestellID: nextBestellID.toString(),
            RetoureID: nextRetoureID.toString(),
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
        }
      } catch (err) {
        if (isMounted) {
          setError('Initialisierungsfehler: ' + err.message);
        }
      }
    };

    initializeNewEntry();
    return () => {
      isMounted = false;
    };
  }, [entryType, fetchNextID]);

  // Barcode scanning with optimized QuaggaJS
  const startScanning = async () => {
    if (!entryType) {
      setError('Bitte wählen Sie zuerst Eingang, Ausgang oder Retoure.');
      return;
    }
    if (!newEntry) {
      setError('Formular wird geladen, bitte warten.');
      return;
    }
    setIsScanning(true);
    setError(null);

    try {
      console.log('Starting barcode scanner...');
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 },
          aspectRatio: { ideal: 4 / 3 },
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const video = videoRef.current;
      if (!video) {
        setError('Videoreferenz nicht gefunden.');
        setIsScanning(false);
        return;
      }

      video.srcObject = stream;
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });
      await video.play().catch(err => {
        throw new Error('Kamerafehler: ' + err.message);
      });

      Quagga.init({
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: video,
          constraints: {
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 },
            aspectRatio: { ideal: 4 / 3 },
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
          patchSize: 'small',
          halfSample: false,
        },
        numOfWorkers: 1,
        frequency: 20,
        locate: true,
      }, (err) => {
        if (err) {
          console.error('QuaggaJS Init Error:', err);
          setError('QuaggaJS Fehler: ' + err.message);
          setIsScanning(false);
          stopScanning();
          return;
        }
        console.log('QuaggaJS initialized');
        Quagga.start();
      });

      Quagga.onDetected((result) => {
        console.log('Barcode detected:', result);
        const scannedBarcode = result.codeResult.code;
        handleBarcode(scannedBarcode);
        Quagga.stop();
        setIsScanning(false);
        stopScanning();
      });

      Quagga.onProcessed((result) => {
        if (result) {
          console.log('QuaggaJS processing frame:', result);
        }
      });
    } catch (err) {
      console.error('Scanner Error:', err);
      setError('Kamerafehler: ' + err.message);
      setIsScanning(false);
      stopScanning();
    }
  };

  const stopScanning = () => {
    console.log('Stopping scanner...');
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
      console.log('Handling barcode:', barcode);
      const matchingAusgang = outputs.find(item => item.Artikelnummer === barcode);
      const matchingBestellung = orders.find(item => item.Artikelnummer === barcode);
      const matchingRetoure = returns.find(item => item.Artikelnummer === barcode);
      const nextBestellID = await fetchNextID('bestellungen', 'BestellID');
      const nextAusgangsID = await fetchNextID('ausgaenge', 'AusgangsID');
      const nextRetoureID = await fetchNextID('retouren', 'RetoureID');
      const newRecord = {
        ...newEntry,
        Artikelnummer: barcode,
        BestellID: nextBestellID.toString(),
        AusgangsID: nextAusgangsID.toString(),
        RetoureID: nextRetoureID.toString(),
        LagerbestandNach: entryType === 'Ausgang'
          ? (parseInt(newEntry.LagerbestandVor) - parseInt(newEntry.VerbrauchteMenge)).toString()
          : entryType === 'Eingang'
          ? (parseInt(newEntry.LagerbestandVor) + parseInt(newEntry.Menge)).toString()
          : newEntry.LagerbestandVor,
        AktuellerLagerbestand: entryType === 'Eingang' ? newEntry.Menge : newEntry.AktuellerLagerbestand,
      };
      setNewEntry(newRecord);
      setScanResult({
        barcode,
        ausgang: matchingAusgang,
        bestellung: matchingBestellung,
        retoure: matchingRetoure,
        newBestellungCreated: entryType === 'Eingang',
        newAusgangCreated: entryType === 'Ausgang',
        newRetoureCreated: entryType === 'Retoure',
      });
    } catch (err) {
      console.error('Handle Barcode Error:', err);
      setError('Fehler beim Verarbeiten des Barcodes: ' + err.message);
    }
  };

  // Manual barcode input
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!entryType) {
      setError('Bitte wählen Sie zuerst Eingang, Ausgang oder Retoure.');
      return;
    }
    if (!manualBarcode) {
      setError('Bitte geben Sie einen Barcode ein.');
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
      return updated;
    });
  };

  // Handle new entry form submission
  const handleNewEntrySubmit = async (e) => {
    e.preventDefault();
    if (!newEntry?.Artikelnummer) {
      setError('Artikelnummer darf nicht leer sein.');
      return;
    }
    const newRecord = { ...newEntry };
    let updatedOrders = [...orders];
    let updatedOutputs = [...outputs];
    let updatedReturns = [...returns];

    console.log('Submitting new record:', newRecord);

    try {
      if (entryType === 'Eingang') {
        const response = await fetch('/api/supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'bestellungen',
            data: {
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
            },
          }),
        });
        if (!response.ok) {
          const errorText = await response.json();
          throw new Error(`Backend-Fehler: ${response.status} - ${JSON.stringify(errorText)}`);
        }
        updatedOrders.push(newRecord);
        setOrders(updatedOrders);
      } else if (entryType === 'Ausgang') {
        const ausgangRecord = {
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
        const response = await fetch('/api/supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'ausgaenge',
            data: ausgangRecord,
          }),
        });
        if (!response.ok) {
          const errorText = await response.json();
          throw new Error(`Backend-Fehler: ${response.status} - ${JSON.stringify(errorText)}`);
        }
        updatedOutputs.push(ausgangRecord);
        const bestellungIndex = updatedOrders.findIndex(item => item.Artikelnummer === newRecord.Artikelnummer);
        if (bestellungIndex !== -1) {
          updatedOrders[bestellungIndex] = {
            ...updatedOrders[bestellungIndex],
            AktuellerLagerbestand: (parseInt(updatedOrders[bestellungIndex].AktuellerLagerbestand || 0) - parseInt(newRecord.VerbrauchteMenge)).toString(),
          };
        }
        setOutputs(updatedOutputs);
        setOrders(updatedOrders);
        setScanResult({
          barcode: newRecord.Artikelnummer,
          ausgang: ausgangRecord,
          bestellung: null,
          retoure: null,
          newAusgangCreated: true,
        });
      } else if (entryType === 'Retoure') {
        const retoureRecord = {
          RetoureID: newRecord.RetoureID,
          Datum: newRecord.Datum,
          Artikelnummer: newRecord.Artikelnummer,
          GrundDerRetoure: newRecord.GrundDerRetoure,
          Menge: newRecord.Menge,
          Lieferant: newRecord.Lieferant,
        };
        const response = await fetch('/api/supabase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            table: 'retouren',
            data: retoureRecord,
          }),
        });
        if (!response.ok) {
          const errorText = await response.json();
          throw new Error(`Backend-Fehler: ${response.status} - ${JSON.stringify(errorText)}`);
        }
        updatedReturns.push(retoureRecord);
        setReturns(updatedReturns);
        setScanResult({
          barcode: newRecord.Artikelnummer,
          ausgang: null,
          bestellung: null,
          retoure: retoureRecord,
          newRetoureCreated: true,
        });
      }

      setSuccessMessage('Eintrag erfolgreich hinzugefügt!');
      setTimeout(() => setSuccessMessage(null), 3000);

      const nextBestellID = await fetchNextID('bestellungen', 'BestellID');
      const nextAusgangsID = await fetchNextID('ausgaenge', 'AusgangsID');
      const nextRetoureID = await fetchNextID('retouren', 'RetoureID');
      setNewEntry({
        AusgangsID: nextAusgangsID.toString(),
        BestellID: nextBestellID.toString(),
        RetoureID: nextRetoureID.toString(),
        Ausgangsdatum: new Date().toISOString().split('T')[0],
        Bestelldatum: new Date().toISOString().split('T')[0],
        Datum: new Date().toISOString().split('T')[0],
        Artikelnummer: '',
        VerbrauchteMenge: '1',
        Menge: '1',
        LagerbestandVor: '100',
        LagerbestandNach: entryType === 'Ausgang' ? '99' : '101',
        AktuellerLagerbestand: '0',
        Bemerkungen: 'Neuer Eintrag',
        GrundDerRetoure: 'Qualitätsmängel',
        Monat: new Date().toISOString().slice(0, 7),
        JahrMonat: new Date().toISOString().slice(0, 7),
        GeplantesLieferdatum: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
        TatsächlichesLieferdatum: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
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
      setScanResult(null);

      setTimeout(() => {
        console.log('Calling onDataUpdate after submit');
        onDataUpdate();
      }, 500);
    } catch (err) {
      console.error('Submit Error:', err);
      setError('Fehler beim Speichern: ' + err.message);
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
  const sortedLogs = [...outputs.map(item => ({
    ...item,
    type: 'Ausgang',
    date: item.Ausgangsdatum,
  })), ...orders.map(item => ({
    ...item,
    type: 'Eingang',
    date: item.Bestelldatum,
  })), ...returns.map(item => ({
    ...item,
    type: 'Retoure',
    date: item.Datum,
  }))].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  return (
    <div className="p-4 bg-gray-900 rounded-lg border-l-4 border-yellow-500 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-yellow-400 mb-4">📷 Barcode-Scanner</h2>
      <label className="block mb-4">
        Typ auswählen:
        <select
          value={entryType}
          onChange={(e) => setEntryType(e.target.value)}
          className="mt-1 p-2 w-full bg-gray-700 text-white rounded"
        >
          <option value="">-- Bitte wählen --</option>
          <option value="Eingang">Eingang</option>
          <option value="Ausgang">Ausgang</option>
          <option value="Retoure">Retoure</option>
        </select>
      </label>
      {entryType && (
        <div className="flex flex-col gap-2 mb-4">
          {!isScanning ? (
            <button
              onClick={startScanning}
              className="bg-green-500 text-white px-4 py-2 rounded-lg w-full max-w-xs mx-auto"
            >
              Scanner starten
            </button>
          ) : (
            <button
              onClick={stopScanning}
              className="bg-red-500 text-white px-4 py-2 rounded-lg w-full max-w-xs mx-auto"
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
        <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
          <input
            type="text"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            placeholder="Barcode manuell eingeben"
            className="p-2 w-full bg-gray-700 text-white rounded"
          />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg">
            Suchen
          </button>
        </form>
      )}
      {scanResult?.barcode && newEntry && (
        <div className="mt-6">
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
                      BestellID:
                      <input
                        type="text"
                        value={newEntry.BestellID}
                        readOnly
                        className="p-2 mt-1 bg-gray-600 text-white rounded"
                      />
                    </label>
                    <label className="flex flex-col">
                      Bestelldatum:
                      <input
                        type="date"
                        value={newEntry.Bestelldatum}
                        onChange={(e) => handleNewEntryChange('Bestelldatum', e.target.value)}
                        required
                        className="p-2 mt-1 bg-gray-700 text-white rounded"
                      />
                    </label>
                    <label className="flex flex-col">
                      Menge:
                      <input
                        type="number"
                        value={newEntry.Menge}
                        onChange={(e) => handleNewEntryChange('Menge', e.target.value)}
                        required
                        className="p-2 mt-1 bg-gray-700 text-white rounded"
                      />
                    </label>
                    <label className="flex flex-col">
                      Bestellart:
                      <input
                        type="text"
                        value={newEntry.Bestellart}
                        onChange={(e) => handleNewEntryChange('Bestellart', e.target.value)}
                        className="p-2 mt-1 bg-gray-700 text-white rounded"
                      />
                    </label>
                    <label className="flex flex-col">
                      Lieferant:
                      <input
                        type="text"
                        value={newEntry.Lieferant}
                        onChange={(e) => handleNewEntryChange('Lieferant', e.target.value)}
                        className="p-2 mt-1 bg-gray-700 text-white rounded"
                      />
                    </label>
                    <label className="flex flex-col">
                      Artikelbeschreibung:
                      <input
                        type="text"
                        value={newEntry.Artikelbeschreibung}
                        onChange={(e) => handleNewEntryChange('Artikelbeschreibung', e.target.value)}
                        className="p-2 mt-1 bg-gray-700 text-white rounded"
                      />
                    </label>
                    <label className="flex flex-col">
                      Einheit:
                      <input
                        type="text"
                        value={newEntry.Einheit}
                        onChange={(e) => handleNewEntryChange('Einheit', e.target.value)}
                        className="p-2 mt-1 bg-gray-700 text-white rounded"
                      />
                    </label>
                    <label className="flex flex-col">
                      PreisProEinheit:
                      <input
                        type="number"
                        value={newEntry.PreisProEinheit}
                        onChange={(e) => handleNewEntryChange('PreisProEinheit', e.target.value)}
                        className="p-2 mt-1 bg-gray-700 text-white rounded"
                      />
                    </label>
                    <label className="flex flex-col">
                      Bestellstatus:
                      <input
                        type="text"
                        value={newEntry.Bestellstatus}
                        onChange={(e) => handleNewEntryChange('Bestellstatus', e.target.value)}
                        className="p-2 mt-1 bg-gray-700 text-white rounded"
                      />
                    </label>
                    <label className="flex flex-col">
                      JahrMonat:
                      <input
                        type="text"
                        value={newEntry.JahrMonat}
                        onChange={(e) => handleNewEntryChange('JahrMonat', e.target.value)}
                        className="p-2 mt-1 bg-gray-700 text-white rounded"
                      />
                    </label>
                    <label className="flex flex-col">
                      Kategorie:
                      <input
                        type="text"
                        value={newEntry.Kategorie}
                        onChange={(e) => handleNewEntryChange('Kategorie', e.target.value)}
                        className="p-2 mt-1 bg-gray-700 text-white rounded"
                      />
                    </label>
                  </>
                )}
                {entryType === 'Ausgang' && (
                  <>
                    <label className="flex flex-col">
                      AusgangsID:
                      <input
                        type="text"
                        value={newEntry.AusgangsID}
                        onChange={(e) => handleNewEntryChange('AusgangsID', e.target.value)}
                        required
                        className="p-2 mt-1 bg-gray-700 text-white rounded"
                      />
                    </label>
                    <label className="flex flex-col">
                      Ausgangsdatum:
                      <input
                        type="date"
                        value={newEntry.Ausgangsdatum}
                        onChange={(e) => handleNewEntryChange('Ausgangsdatum', e.target.value)}
                        required
                        className="p-2 mt-1 bg-gray-700 text-white rounded"
                      />
                    </label>
                    <label className="flex flex-col">
                      VerbrauchteMenge:
                      <input
                        type="number"
                        value={newEntry.VerbrauchteMenge}
                        onChange={(e) => handleNewEntryChange('VerbrauchteMenge', e.target.value)}
                        required
                        className="p-2 mt-1 bg-gray-700 text-white rounded"
                      />
                    </label>
                  </>
                )}
                {entryType === 'Retoure' && (
                  <>
                    <label className="flex flex-col">
                      RetoureID:
                      <input
                        type="text"
                        value={newEntry.RetoureID}
                        readOnly
                        className="p-2 mt-1 bg-gray-600 text-white rounded"
                      />
                    </label>
                    <label className="flex flex-col">
                      Datum:
                      <input
                        type="date"
                        value={newEntry.Datum}
                        onChange={(e) => handleNewEntryChange('Datum', e.target.value)}
                        required
                        className="p-2 mt-1 bg-gray-700 text-white rounded"
                      />
                    </label>
                    <label className="flex flex-col">
                      Menge:
                      <input
                        type="number"
                        value={newEntry.Menge}
                        onChange={(e) => handleNewEntryChange('Menge', e.target.value)}
                        required
                        className="p-2 mt-1 bg-gray-700 text-white rounded"
                      />
                    </label>
                    <label className="flex flex-col">
                      GrundDerRetoure:
                      <input
                        type="text"
                        value={newEntry.GrundDerRetoure}
                        onChange={(e) => handleNewEntryChange('GrundDerRetoure', e.target.value)}
                        className="p-2 mt-1 bg-gray-700 text-white rounded"
                      />
                    </label>
                    <label className="flex flex-col">
                      Lieferant:
                      <input
                        type="text"
                        value={newEntry.Lieferant}
                        onChange={(e) => handleNewEntryChange('Lieferant', e.target.value)}
                        className="p-2 mt-1 bg-gray-700 text-white rounded"
                      />
                    </label>
                  </>
                )}
                <label className="flex flex-col">
                  Artikelnummer:
                  <input
                    type="text"
                    value={newEntry.Artikelnummer}
                    onChange={(e) => handleNewEntryChange('Artikelnummer', e.target.value)}
                    required
                    className="p-2 mt-1 bg-gray-700 text-white rounded"
                  />
                </label>
                {(entryType === 'Eingang' || entryType === 'Ausgang') && (
                  <>
                    <label className="flex flex-col">
                      LagerbestandVor:
                      <input
                        type="number"
                        value={newEntry.LagerbestandVor}
                        onChange={(e) => handleNewEntryChange('LagerbestandVor', e.target.value)}
                        required
                        className="p-2 mt-1 bg-gray-700 text-white rounded"
                      />
                    </label>
                    <label className="flex flex-col">
                      LagerbestandNach:
                      <input
                        type="number"
                        value={newEntry.LagerbestandNach}
                        readOnly
                        className="p-2 mt-1 bg-gray-600 text-white rounded"
                      />
                    </label>
                  </>
                )}
                {(entryType === 'Eingang' || entryType === 'Ausgang') && (
                  <label className="flex flex-col">
                    Bemerkungen:
                    <input
                      type="text"
                      value={newEntry.Bemerkungen}
                      onChange={(e) => handleNewEntryChange('Bemerkungen', e.target.value)}
                      className="p-2 mt-1 bg-gray-700 text-white rounded"
                    />
                  </label>
                )}
                <label className="flex flex-col">
                  GeplantesLieferdatum:
                  <input
                    type="date"
                    value={newEntry.GeplantesLieferdatum}
                    onChange={(e) => handleNewEntryChange('GeplantesLieferdatum', e.target.value)}
                    className="p-2 mt-1 bg-gray-700 text-white rounded"
                  />
                </label>
                <label className="flex flex-col">
                  TatsächlichesLieferdatum:
                  <input
                    type="date"
                    value={newEntry.TatsächlichesLieferdatum}
                    onChange={(e) => handleNewEntryChange('TatsächlichesLieferdatum', e.target.value)}
                    className="p-2 mt-1 bg-gray-700 text-white rounded"
                  />
                </label>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-2">
                  Eintrag hinzufügen
                </button>
              </form>
            </div>
          )}
        </div>
      )}
      <AccordionSection title="Letzte Einträge">
        <table className="w-full text-gray-300 border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 border-b border-gray-500">Typ</th>
              <th className="text-left p-2 border-b border-gray-500">Artikelnummer</th>
              <th className="text-left p-2 border-b border-gray-500">Datum</th>
              <th className="text-right p-2 border-b border-gray-500">Menge</th>
              <th className="text-right p-2 border-b border-gray-500">Lagerbestand</th>
            </tr>
          </thead>
          <tbody>
            {sortedLogs.map((log, i) => (
              <tr key={i}>
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
      </AccordionSection>
      <button onClick={downloadAllCsvs} className="bg-gray-500 text-white px-4 py-2 rounded-lg w-full mt-4">
        Alle CSVs herunterladen
      </button>
    </div>
  );
};

export default BarcodeScanner;