import React, { useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';
import Quagga from 'quagga';

const AccordionSection = ({ title, children }) => (
  <section style={{ marginBottom: '1.5rem', border: '1px solid #444', borderRadius: '6px' }}>
    <header style={{ padding: '0.8rem 1rem', background: '#333', color: '#fff' }}>
      <strong>▼ {title}</strong>
    </header>
    <div style={{ padding: '1rem', background: '#1e1e1e' }}>{children}</div>
  </section>
);

const BarcodeScanner = ({ orders, setOrders, outputs, setOutputs, onDataUpdate }) => {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [entryType, setEntryType] = useState('');
  const [newEntry, setNewEntry] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const animationFrameRef = useRef(null);

  // Fetch bestellungen.csv to get the next available BestellID
  const fetchNextBestellID = async () => {
    try {
      const response = await fetch('/api/update-csv?file=bestellungen.csv');
      if (!response.ok) {
        throw new Error(`Fehler beim Abrufen von bestellungen.csv: ${response.status}`);
      }
      const csvText = await response.text();
      if (!csvText) {
        return 3000; // Start at 3000 if no data exists
      }
      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      const existingIds = parsed.data
        .map(row => parseInt(row.BestellID))
        .filter(id => !isNaN(id));
      const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 2999;
      return maxId + 1;
    } catch (err) {
      console.error('Fehler beim Abrufen der BestellID:', err);
      setError('Fehler beim Abrufen der BestellID: ' + err.message);
      return 3000; // Fallback
    }
  };

  // Initialize newEntry with dynamic BestellID
  useEffect(() => {
    const initializeNewEntry = async () => {
      const today = new Date();
      const datum = today.toISOString().split('T')[0];
      const monat = today.toISOString().slice(0, 7);
      const geplantesLieferdatum = new Date(today.getTime());
      geplantesLieferdatum.setDate(today.getDate() + 7);
      const maxAusgangsID = outputs.length > 0 ? Math.max(...outputs.map(item => parseInt(item.AusgangsID || 0))) + 1 : 1;
      const nextBestellID = await fetchNextBestellID();

      setNewEntry({
        AusgangsID: maxAusgangsID.toString(),
        BestellID: nextBestellID.toString(),
        Ausgangsdatum: datum,
        Bestelldatum: datum,
        Artikelnummer: '',
        VerbrauchteMenge: '1',
        Menge: '1',
        LagerbestandVor: '100',
        LagerbestandNach: entryType === 'Ausgang' ? '99' : '101',
        AktuellerLagerbestand: '0',
        Bemerkungen: 'Neuer Eintrag',
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
    };

    initializeNewEntry();
  }, [entryType, outputs]);

  // Barcode scanning with optimized QuaggaJS
  const startScanning = async () => {
    if (!entryType) {
      setError('Bitte wählen Sie zuerst Eingang oder Ausgang.');
      return;
    }
    if (!newEntry) {
      setError('Formular wird geladen, bitte warten.');
      return;
    }
    setIsScanning(true);
    setError(null);

    try {
      // Optimierte Constraints für schnellere Verarbeitung
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

      // Optimierte QuaggaJS-Konfiguration
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
          multiple: true, // Erlaubt Erkennung mehrerer Barcodes
        },
        locator: {
          patchSize: 'small', // Schnellere Erkennung
          halfSample: false, // Verbessert Orientierungstoleranz
        },
        numOfWorkers: 1, // Einzelner Worker für bessere iOS-Performance
        frequency: 20, // Häufigere Scans
        locate: true,
      }, (err) => {
        if (err) {
          setError('QuaggaJS Fehler: ' + err.message);
          setIsScanning(false);
          stopScanning();
          return;
        }
        Quagga.start();
      });

      Quagga.onDetected((result) => {
        const scannedBarcode = result.codeResult.code;
        handleBarcode(scannedBarcode);
        Quagga.stop();
        setIsScanning(false);
        stopScanning();
      });
    } catch (err) {
      setError('Kamerafehler: ' + err.message);
      setIsScanning(false);
      stopScanning();
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (Quagga) {
      Quagga.stop();
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Handle barcode
  const handleBarcode = async (barcode) => {
    const matchingAusgang = outputs.find(item => item.Artikelnummer === barcode);
    const nextBestellID = await fetchNextBestellID();
    setScanResult({
      barcode,
      ausgang: matchingAusgang,
      bestellung: null,
      newBestellungCreated: true,
    });
    setNewEntry(prev => ({
      ...prev,
      Artikelnummer: barcode,
      BestellID: nextBestellID.toString(),
      LagerbestandNach: entryType === 'Ausgang'
        ? (parseInt(prev.LagerbestandVor) - parseInt(prev.VerbrauchteMenge)).toString()
        : (parseInt(prev.LagerbestandVor) + parseInt(prev.Menge)).toString(),
      AktuellerLagerbestand: entryType === 'Eingang' ? prev.Menge : prev.AktuellerLagerbestand,
    }));
  };

  // Manual barcode input
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!entryType) {
      setError('Bitte wählen Sie zuerst Eingang oder Ausgang.');
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
        updated.LagerbestandNach = entryType === 'Ausgang' ? (vor - menge).toString() : (vor + menge).toString();
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

    console.log('New Record:', newRecord);

    // Prepare new order data
    const newOrder = {
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

    // Save to backend
    try {
      if (process.env.NODE_ENV !== 'development') {
        // Send only the new order as a single row
        const newOrderCsv = `${newRecord.BestellID},${newRecord.Bestelldatum},${newRecord.Bestellart},${newRecord.Lieferant},${newRecord.Artikelnummer},${newRecord.Artikelbeschreibung},${newRecord.Menge},${newRecord.Einheit},${newRecord.PreisProEinheit},${newRecord.Bestellstatus},${newRecord.GeplantesLieferdatum},${newRecord.TatsächlichesLieferdatum},${newRecord.AktuellerLagerbestand},${newRecord.Engpass},${newRecord.KritischSeit},${newRecord.Gesamtpreis},${newRecord.Lieferdauer},${newRecord.JahrMonat},${newRecord.Kategorie}`;
        console.log('POST Body:', { bestellungen: newOrderCsv.slice(0, 100) });
        const response = await fetch('/api/update-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bestellungen: newOrderCsv,
          }),
        });
        if (!response.ok) {
          const errorText = await response.json();
          throw new Error(`Backend-Fehler: ${response.status} - ${JSON.stringify(errorText)}`);
        }

        // Update local state only after successful backend save
        if (entryType === 'Eingang') {
          updatedOrders.push(newOrder);
          setOrders(updatedOrders);
        } else {
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
            Abteilung: 'Unbekannt',
          };
          updatedOutputs = [...outputs, ausgangRecord];
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
          });
        }

        // Trigger data reload in App.js
        if (onDataUpdate) {
          onDataUpdate();
        }

        setSuccessMessage('Eintrag erfolgreich hinzugefügt!');
        setTimeout(() => setSuccessMessage(null), 3000);

        // Fetch the next BestellID for the new form
        const nextBestellID = await fetchNextBestellID();
        const maxAusgangsID = parseInt(newRecord.AusgangsID) + 1;
        setNewEntry({
          AusgangsID: maxAusgangsID.toString(),
          BestellID: nextBestellID.toString(),
          Ausgangsdatum: new Date().toISOString().split('T')[0],
          Bestelldatum: new Date().toISOString().split('T')[0],
          Artikelnummer: '',
          VerbrauchteMenge: '1',
          Menge: '1',
          LagerbestandVor: '100',
          LagerbestandNach: entryType === 'Ausgang' ? '99' : '101',
          AktuellerLagerbestand: '0',
          Bemerkungen: 'Neuer Eintrag',
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
      }
    } catch (err) {
      console.error('Submit Error:', err);
      setError('Fehler beim Speichern: ' + err.message);
    }
  };

  // Download all CSVs
  const downloadAllCsvs = () => {
    const ausgaengeFields = [
      'AusgangsID', 'Ausgangsdatum', 'BestellID', 'Artikelnummer', 'VerbrauchteMenge',
      'LagerbestandVor', 'LagerbestandNach', 'Bemerkungen', 'Monat',
      'GeplantesLieferdatum', 'TatsächlichesLieferdatum', 'Abteilung'
    ];
    const bestellungenFields = [
      'BestellID', 'Bestelldatum', 'Bestellart', 'Lieferant', 'Artikelnummer', 'Artikelbeschreibung',
      'Menge', 'Einheit', 'PreisProEinheit', 'Bestellstatus', 'GeplantesLieferdatum',
      'TatsächlichesLieferdatum', 'AktuellerLagerbestand', 'Engpass', 'KritischSeit',
      'Gesamtpreis', 'Lieferdauer', 'JahrMonat', 'Kategorie'
    ];
    downloadCsv(outputs, 'ausgaenge.csv', ausgaengeFields);
    downloadCsv(orders, 'bestellungen.csv', bestellungenFields);
  };

  // Download CSV file
  const downloadCsv = (data, filename, fields) => {
    const csv = Papa.unparse(data, { header: true, columns: fields });
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
  }))].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Lagerverwaltung</h2>
      <label style={{ display: 'block', marginBottom: '10px' }}>
        Typ auswählen:
        <select
          value={entryType}
          onChange={(e) => setEntryType(e.target.value)}
          style={{ padding: '5px', width: '100%', marginTop: '5px' }}
        >
          <option value="">-- Bitte wählen --</option>
          <option value="Ausgang">Ausgang</option>
          <option value="Eingang">Eingang</option>
        </select>
      </label>
      {entryType && (
        <div style={{ marginBottom: '10px' }}>
          {!isScanning ? (
            <button onClick={startScanning} style={{ padding: '5px 10px', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>
              Scanner starten
            </button>
          ) : (
            <button onClick={stopScanning} style={{ padding: '5px 10px', background: '#f44336', color: 'white', border: 'none', cursor: 'pointer' }}>
              Scanner stoppen
            </button>
          )}
        </div>
      )}
      <video ref={videoRef} style={{ width: '100%', border: '1px solid #ccc', display: isScanning ? 'block' : 'none' }} muted playsInline />
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {successMessage && <p style={{ color: 'green', textAlign: 'center' }}>{successMessage}</p>}
      {entryType && (
        <form onSubmit={handleManualSubmit} style={{ marginTop: '10px' }}>
          <input
            type="text"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            placeholder="Barcode manuell eingeben"
            style={{ padding: '5px', width: '70%', marginRight: '10px' }}
          />
          <button type="submit" style={{ padding: '5px 10px', background: '#2196F3', color: 'white', border: 'none', cursor: 'pointer' }}>
            Suchen
          </button>
        </form>
      )}
      {scanResult?.barcode && newEntry && (
        <div style={{ marginTop: '20px' }}>
          <h3>Gescannter Barcode: {scanResult.barcode}</h3>
          {scanResult.ausgang && (
            <p>
              Ausgang: {scanResult.ausgang.VerbrauchteMenge} Einheiten verbraucht am {scanResult.ausgang.Ausgangsdatum}, 
              Lagerbestand: {scanResult.ausgang.LagerbestandVor} → {scanResult.ausgang.LagerbestandNach}
            </p>
          )}
          {scanResult.bestellung && (
            <p>
              Eingang: {scanResult.bestellung.Menge} Einheiten eingegangen am {scanResult.bestellung.Bestelldatum}, 
              Lagerbestand: {scanResult.bestellung.AktuellerLagerbestand}
            </p>
          )}
          {!scanResult.ausgang && !scanResult.bestellung && (
            <div>
              <p>
                {entryType === 'Eingang' && scanResult.newBestellungCreated
                  ? `Neuer Artikel: ${scanResult.barcode}. Wird in bestellungen.csv hinzugefügt.`
                  : `Kein passender Eintrag gefunden: ${scanResult.barcode}`}
              </p>
              <h4>Neuen Eintrag hinzufügen</h4>
              <form onSubmit={handleNewEntrySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {entryType === 'Ausgang' ? (
                  <>
                    <label>
                      AusgangsID:
                      <input
                        type="text"
                        value={newEntry.AusgangsID}
                        onChange={(e) => handleNewEntryChange('AusgangsID', e.target.value)}
                        required
                        style={{ padding: '5px', width: '100%' }}
                      />
                    </label>
                    <label>
                      Ausgangsdatum:
                      <input
                        type="date"
                        value={newEntry.Ausgangsdatum}
                        onChange={(e) => handleNewEntryChange('Ausgangsdatum', e.target.value)}
                        required
                        style={{ padding: '5px', width: '100%' }}
                      />
                    </label>
                    <label>
                      VerbrauchteMenge:
                      <input
                        type="number"
                        value={newEntry.VerbrauchteMenge}
                        onChange={(e) => handleNewEntryChange('VerbrauchteMenge', e.target.value)}
                        required
                        style={{ padding: '5px', width: '100%' }}
                      />
                    </label>
                  </>
                ) : (
                  <>
                    <label>
                      BestellID:
                      <input
                        type="text"
                        value={newEntry.BestellID}
                        readOnly
                        style={{ padding: '5px', width: '100%', background: '#e0e0e0' }}
                      />
                    </label>
                    <label>
                      Bestelldatum:
                      <input
                        type="date"
                        value={newEntry.Bestelldatum}
                        onChange={(e) => handleNewEntryChange('Bestelldatum', e.target.value)}
                        required
                        style={{ padding: '5px', width: '100%' }}
                      />
                    </label>
                    <label>
                      Menge:
                      <input
                        type="number"
                        value={newEntry.Menge}
                        onChange={(e) => handleNewEntryChange('Menge', e.target.value)}
                        required
                        style={{ padding: '5px', width: '100%' }}
                      />
                    </label>
                    <label>
                      Bestellart:
                      <input
                        type="text"
                        value={newEntry.Bestellart}
                        onChange={(e) => handleNewEntryChange('Bestellart', e.target.value)}
                        style={{ padding: '5px', width: '100%' }}
                      />
                    </label>
                    <label>
                      Lieferant:
                      <input
                        type="text"
                        value={newEntry.Lieferant}
                        onChange={(e) => handleNewEntryChange('Lieferant', e.target.value)}
                        style={{ padding: '5px', width: '100%' }}
                      />
                    </label>
                    <label>
                      Artikelbeschreibung:
                      <input
                        type="text"
                        value={newEntry.Artikelbeschreibung}
                        onChange={(e) => handleNewEntryChange('Artikelbeschreibung', e.target.value)}
                        style={{ padding: '5px', width: '100%' }}
                      />
                    </label>
                    <label>
                      Einheit:
                      <input
                        type="text"
                        value={newEntry.Einheit}
                        onChange={(e) => handleNewEntryChange('Einheit', e.target.value)}
                        style={{ padding: '5px', width: '100%' }}
                      />
                    </label>
                    <label>
                      PreisProEinheit:
                      <input
                        type="number"
                        value={newEntry.PreisProEinheit}
                        onChange={(e) => handleNewEntryChange('PreisProEinheit', e.target.value)}
                        style={{ padding: '5px', width: '100%' }}
                      />
                    </label>
                    <label>
                      Bestellstatus:
                      <input
                        type="text"
                        value={newEntry.Bestellstatus}
                        onChange={(e) => handleNewEntryChange('Bestellstatus', e.target.value)}
                        style={{ padding: '5px', width: '100%' }}
                      />
                    </label>
                    <label>
                      JahrMonat:
                      <input
                        type="text"
                        value={newEntry.JahrMonat}
                        onChange={(e) => handleNewEntryChange('JahrMonat', e.target.value)}
                        style={{ padding: '5px', width: '100%' }}
                      />
                    </label>
                    <label>
                      Kategorie:
                      <input
                        type="text"
                        value={newEntry.Kategorie}
                        onChange={(e) => handleNewEntryChange('Kategorie', e.target.value)}
                        style={{ padding: '5px', width: '100%' }}
                      />
                    </label>
                  </>
                )}
                <label>
                  Artikelnummer:
                  <input
                    type="text"
                    value={newEntry.Artikelnummer}
                    onChange={(e) => handleNewEntryChange('Artikelnummer', e.target.value)}
                    required
                    style={{ padding: '5px', width: '100%' }}
                  />
                </label>
                <label>
                  LagerbestandVor:
                  <input
                    type="number"
                    value={newEntry.LagerbestandVor}
                    onChange={(e) => handleNewEntryChange('LagerbestandVor', e.target.value)}
                    required
                    style={{ padding: '5px', width: '100%' }}
                  />
                </label>
                <label>
                  LagerbestandNach:
                  <input
                    type="number"
                    value={newEntry.LagerbestandNach}
                    readOnly
                    style={{ padding: '5px', width: '100%', background: '#e0e0e0' }}
                  />
                </label>
                <label>
                  Bemerkungen:
                  <input
                    type="text"
                    value={newEntry.Bemerkungen}
                    onChange={(e) => handleNewEntryChange('Bemerkungen', e.target.value)}
                    style={{ padding: '5px', width: '100%' }}
                  />
                </label>
                <label>
                  GeplantesLieferdatum:
                  <input
                    type="date"
                    value={newEntry.GeplantesLieferdatum}
                    onChange={(e) => handleNewEntryChange('GeplantesLieferdatum', e.target.value)}
                    style={{ padding: '5px', width: '100%' }}
                  />
                </label>
                <label>
                  TatsächlichesLieferdatum:
                  <input
                    type="date"
                    value={newEntry.TatsächlichesLieferdatum}
                    onChange={(e) => handleNewEntryChange('TatsächlichesLieferdatum', e.target.value)}
                    style={{ padding: '5px', width: '100%' }}
                  />
                </label>
                <button type="submit" style={{ padding: '5px 10px', background: '#2196F3', color: 'white', border: 'none', cursor: 'pointer' }}>
                  Eintrag hinzufügen
                </button>
              </form>
            </div>
          )}
        </div>
      )}
      <AccordionSection title="Letzte Einträge">
        <table style={{ width: '100%', color: '#ccc', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #555' }}>Typ</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #555' }}>Artikelnummer</th>
              <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #555' }}>Datum</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #555' }}>Menge</th>
              <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #555' }}>Lagerbestand</th>
            </tr>
          </thead>
          <tbody>
            {sortedLogs.map((log, i) => (
              <tr key={i}>
                <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>{log.type}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>{log.Artikelnummer}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #333' }}>{log.date}</td>
                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #333' }}>
                  {log.type === 'Ausgang' ? log.VerbrauchteMenge : log.Menge}
                </td>
                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #333' }}>
                  {log.type === 'Ausgang' ? log.LagerbestandNach : log.AktuellerLagerbestand}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AccordionSection>
    </div>
  );
};

export default BarcodeScanner;