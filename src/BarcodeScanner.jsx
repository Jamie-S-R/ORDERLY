import React, { useEffect, useRef, useState } from 'react';
import Papa from 'papaparse';

const BarcodeScanner = () => {
  const videoRef = useRef(null);
  const [csvData, setCsvData] = useState({ ausgaenge: [], bestellungen: [], eingaenge: [] });
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [entryType, setEntryType] = useState('');
  const [newEntry, setNewEntry] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const animationFrameRef = useRef(null);

  // Load CSVs
  useEffect(() => {
    const loadCsvs = async () => {
      try {
        const isLocal = process.env.NODE_ENV === 'development';
        const baseUrl = isLocal ? '/data' : '/api/update-csv';
        const files = [
          { name: 'ausgaenge.csv', key: 'ausgaenge' },
          { name: 'bestellungen.csv', key: 'bestellungen' },
          { name: 'eingaenge.csv', key: 'eingaenge' },
        ];
        let newCsvData = { ausgaenge: [], bestellungen: [], eingaenge: [] };

        for (const file of files) {
          const url = isLocal ? `${baseUrl}/${file.name}` : `${baseUrl}?file=${file.name}`;
          const res = await fetch(url).catch(() => ({ ok: false }));
          if (res.ok) {
            const text = await res.text();
            Papa.parse(text, {
              header: true,
              complete: (result) => {
                newCsvData[file.key] = result.data;
              },
            });
          }
        }

        setCsvData(newCsvData);
      } catch (err) {
        setError('Fehler beim Laden der CSV-Dateien: ' + err.message);
      }
    };
    loadCsvs();
  }, []);

  // Initialize newEntry
  useEffect(() => {
    if (csvData.ausgaenge.length > 0 || csvData.bestellungen.length > 0 || csvData.eingaenge.length > 0) {
      const maxAusgangsID = csvData.ausgaenge.length > 0 ? Math.max(...csvData.ausgaenge.map(item => parseInt(item.AusgangsID || 0))) + 1 : 1;
      const maxEingangsID = csvData.eingaenge.length > 0 ? Math.max(...csvData.eingaenge.map(item => parseInt(item.EingangsID || 0))) + 1 : 1;
      const maxBestellID = csvData.bestellungen.length > 0 ? Math.max(...csvData.bestellungen.map(item => parseInt(item.BestellID || 0))) + 1 : 1000;
      const today = new Date();
      const datum = today.toISOString().split('T')[0];
      const monat = today.toISOString().slice(0, 7);
      const geplantesLieferdatum = new Date(today.getTime());
      geplantesLieferdatum.setDate(today.getDate() + 7);
      setNewEntry({
        AusgangsID: maxAusgangsID.toString(),
        EingangsID: maxEingangsID.toString(),
        Ausgangsdatum: datum,
        Eingangsdatum: datum,
        BestellID: maxBestellID.toString(),
        Artikelnummer: '',
        VerbrauchteMenge: '1',
        Eingangsmenge: '1',
        LagerbestandVor: '100',
        LagerbestandNach: entryType === 'Ausgang' ? '99' : '101',
        Bemerkungen: 'Neuer Eintrag',
        Monat: monat,
        GeplantesLieferdatum: geplantesLieferdatum.toISOString().split('T')[0],
        TatsächlichesLieferdatum: geplantesLieferdatum.toISOString().split('T')[0],
      });
    }
  }, [csvData, entryType]);

  // Barcode scanning
  const startScanning = async () => {
    if (!entryType) {
      setError('Bitte wählen Sie zuerst Eingang oder Ausgang.');
      return;
    }
    if ('BarcodeDetector' in window) {
      setIsScanning(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await new Promise((resolve) => {
          video.onloadedmetadata = resolve;
        });
        await video.play().catch(err => {
          throw new Error('Kamerafehler: ' + err.message);
        });

        // eslint-disable-next-line no-undef
        const barcodeDetector = new BarcodeDetector({ formats: ['qr_code', 'ean_13', 'code_128'] });

        const detect = async () => {
          try {
            if (video.readyState >= 2) {
              const barcodes = await barcodeDetector.detect(video);
              if (barcodes.length > 0) {
                const scannedBarcode = barcodes[0].rawValue;
                handleBarcode(scannedBarcode);
                stopScanning(); // Stop scanning after detection
              }
            }
            animationFrameRef.current = requestAnimationFrame(detect);
          } catch (err) {
            setError('Erkennungsfehler: ' + err.message);
          }
        };
        detect();
      } catch (err) {
        setError('Kamerafehler: ' + err.message);
        setIsScanning(false);
      }
    } else {
      setError('BarcodeDetector API wird in diesem Browser nicht unterstützt.');
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
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
  const handleBarcode = (barcode) => {
    if (!newEntry) {
      setError('Formular noch nicht initialisiert. Bitte warten.');
      return;
    }
    const matchingAusgang = csvData.ausgaenge.find(item => item.Artikelnummer === barcode);
    const matchingEingang = csvData.eingaenge.find(item => item.Artikelnummer === barcode);
    const matchingBestellung = csvData.bestellungen.find(item => item.Artikelnummer === barcode);
    let bestellID = matchingBestellung?.BestellID;
    let newBestellungCreated = false;
    let updatedCsvData = { ...csvData };

    if (entryType === 'Eingang' && !matchingBestellung) {
      const newBestellID = (Math.max(...csvData.bestellungen.map(item => parseInt(item.BestellID || 0)), 999) + 1).toString();
      const today = new Date();
      const geplantesLieferdatum = new Date(today.getTime());
      geplantesLieferdatum.setDate(today.getDate() + 7);
      const newBestellung = {
        BestellID: newBestellID,
        Bestelldatum: today.toISOString().split('T')[0],
        Bestellart: 'Standardbestellung',
        Lieferant: 'Unbekannt',
        Artikelnummer: barcode,
        Artikelbeschreibung: 'Neuer Artikel',
        Menge: '1',
        Einheit: 'Stück',
        PreisProEinheit: '0.00',
        Bestellstatus: 'Offen',
        GeplantesLieferdatum: geplantesLieferdatum.toISOString().split('T')[0],
        TatsächlichesLieferdatum: geplantesLieferdatum.toISOString().split('T')[0],
        AktuellerLagerbestand: '0',
        Engpass: 'false',
        KritischSeit: '',
        Gesamtpreis: '0.00',
        Lieferdauer: '7',
        JahrMonat: today.toISOString().slice(0, 7),
        Kategorie: 'Sonstiges',
      };
      updatedCsvData = {
        ...updatedCsvData,
        bestellungen: [...csvData.bestellungen, newBestellung],
      };
      bestellID = newBestellID;
      newBestellungCreated = true;
    }

    setCsvData(updatedCsvData);
    setScanResult({
      barcode,
      ausgang: matchingAusgang,
      eingang: matchingEingang,
      bestellung: matchingBestellung,
      newBestellungCreated,
    });
    setNewEntry(prev => ({
      ...prev,
      Artikelnummer: barcode,
      BestellID: bestellID || prev.BestellID,
      LagerbestandNach: entryType === 'Ausgang'
        ? (parseInt(prev.LagerbestandVor) - parseInt(prev.VerbrauchteMenge)).toString()
        : (parseInt(prev.LagerbestandVor) + parseInt(prev.Eingangsmenge)).toString(),
    }));
  };

  // Manual barcode input
  const [manualBarcode, setManualBarcode] = useState('');
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!entryType) {
      setError('Bitte wählen Sie zuerst Eingang oder Ausgang.');
      return;
    }
    if (!manualBarcode) {
      setError('Bitte geben Sie einen Barcode ein.');
      return;
    }
    handleBarcode(manualBarcode);
    setManualBarcode('');
  };

  // Update LagerbestandNach
  const handleNewEntryChange = (field, value) => {
    setNewEntry(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'VerbrauchteMenge' || field === 'Eingangsmenge' || field === 'LagerbestandVor') {
        const vor = parseInt(updated.LagerbestandVor) || 0;
        const menge = entryType === 'Ausgang' ? parseInt(updated.VerbrauchteMenge) || 0 : parseInt(updated.Eingangsmenge) || 0;
        updated.LagerbestandNach = entryType === 'Ausgang' ? (vor - menge).toString() : (vor + menge).toString();
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
    let updatedCsvData = { ...csvData };
    let updatedBestellungen = [...csvData.bestellungen];

    if (entryType === 'Eingang' && scanResult?.newBestellungCreated) {
      const bestellungIndex = updatedBestellungen.findIndex(item => item.BestellID === newRecord.BestellID);
      if (bestellungIndex !== -1) {
        updatedBestellungen[bestellungIndex] = {
          ...updatedBestellungen[bestellungIndex],
          AktuellerLagerbestand: newRecord.Eingangsmenge,
        };
        updatedCsvData = { ...updatedCsvData, bestellungen: updatedBestellungen };
      }
    }

    if (entryType === 'Ausgang') {
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
      updatedCsvData = {
        ...updatedCsvData,
        ausgaenge: [...csvData.ausgaenge, ausgangRecord],
      };
      setScanResult({
        barcode: newRecord.Artikelnummer,
        ausgang: ausgangRecord,
        eingang: null,
        bestellung: null,
      });
    } else {
      const eingangRecord = {
        EingangsID: newRecord.EingangsID,
        Eingangsdatum: newRecord.Eingangsdatum,
        BestellID: newRecord.BestellID,
        Artikelnummer: newRecord.Artikelnummer,
        Eingangsmenge: newRecord.Eingangsmenge,
        LagerbestandVor: newRecord.LagerbestandVor,
        LagerbestandNach: newRecord.LagerbestandNach,
        Bemerkungen: newRecord.Bemerkungen,
        Monat: newRecord.Monat,
        GeplantesLieferdatum: newRecord.GeplantesLieferdatum,
        TatsächlichesLieferdatum: newRecord.TatsächlichesLieferdatum,
      };
      updatedCsvData = {
        ...updatedCsvData,
        eingaenge: [...csvData.eingaenge, eingangRecord],
      };
      setScanResult({
        barcode: newRecord.Artikelnummer,
        ausgang: null,
        eingang: eingangRecord,
        bestellung: null,
      });
    }

    // Save to backend (or local state)
    try {
      if (process.env.NODE_ENV !== 'development') {
        const response = await fetch('/api/update-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ausgaenge: Papa.unparse(updatedCsvData.ausgaenge, { header: true }),
            eingaenge: Papa.unparse(updatedCsvData.eingaenge, { header: true }),
            bestellungen: Papa.unparse(updatedCsvData.bestellungen, { header: true }),
          }),
        });
        if (!response.ok) throw new Error('Backend-Fehler: ' + response.statusText);
      }
      setCsvData(updatedCsvData);
      setSuccessMessage('Eintrag erfolgreich hinzugefügt!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Fehler beim Speichern: ' + err.message);
    }

    const maxAusgangsID = parseInt(newRecord.AusgangsID) + 1;
    const maxEingangsID = parseInt(newRecord.EingangsID) + 1;
    const maxBestellID = parseInt(newRecord.BestellID) + 1;
    setNewEntry({
      AusgangsID: maxAusgangsID.toString(),
      EingangsID: maxEingangsID.toString(),
      Ausgangsdatum: new Date().toISOString().split('T')[0],
      Eingangsdatum: new Date().toISOString().split('T')[0],
      BestellID: maxBestellID.toString(),
      Artikelnummer: '',
      VerbrauchteMenge: '1',
      Eingangsmenge: '1',
      LagerbestandVor: '100',
      LagerbestandNach: entryType === 'Ausgang' ? '99' : '101',
      Bemerkungen: 'Neuer Eintrag',
      Monat: new Date().toISOString().slice(0, 7),
      GeplantesLieferdatum: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
      TatsächlichesLieferdatum: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
    });
    setScanResult(null);
  };

  // Download all CSVs
  const downloadAllCsvs = () => {
    const ausgaengeFields = [
      'AusgangsID', 'Ausgangsdatum', 'BestellID', 'Artikelnummer', 'VerbrauchteMenge',
      'LagerbestandVor', 'LagerbestandNach', 'Bemerkungen', 'Monat',
      'GeplantesLieferdatum', 'TatsächlichesLieferdatum'
    ];
    const eingaengeFields = [
      'EingangsID', 'Eingangsdatum', 'BestellID', 'Artikelnummer', 'Eingangsmenge',
      'LagerbestandVor', 'LagerbestandNach', 'Bemerkungen', 'Monat',
      'GeplantesLieferdatum', 'TatsächlichesLieferdatum'
    ];
    const bestellungenFields = [
      'BestellID', 'Bestelldatum', 'Bestellart', 'Lieferant', 'Artikelnummer', 'Artikelbeschreibung',
      'Menge', 'Einheit', 'PreisProEinheit', 'Bestellstatus', 'GeplantesLieferdatum',
      'TatsächlichesLieferdatum', 'AktuellerLagerbestand', 'Engpass', 'KritischSeit',
      'Gesamtpreis', 'Lieferdauer', 'JahrMonat', 'Kategorie'
    ];
    downloadCsv(csvData.ausgaenge, 'ausgaenge.csv', ausgaengeFields);
    downloadCsv(csvData.eingaenge, 'eingaenge.csv', eingaengeFields);
    downloadCsv(csvData.bestellungen, 'bestellungen.csv', bestellungenFields);
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
      <video ref={videoRef} style={{ width: '100%', border: '1px solid #ccc', display: isScanning ? 'block' : 'none' }} muted />
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {successMessage && <p style={{ color: 'green', textAlign: 'center' }}>{successMessage}</p>}
      {!('BarcodeDetector' in window) && entryType && (
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
          {scanResult.eingang && (
            <p>
              Eingang: {scanResult.eingang.Eingangsmenge} Einheiten eingegangen am {scanResult.eingang.Eingangsdatum}, 
              Lagerbestand: {scanResult.eingang.LagerbestandVor} → {scanResult.eingang.LagerbestandNach}
            </p>
          )}
          {scanResult.bestellung && (
            <p>
              Bestellung: {scanResult.bestellung.Menge} Einheiten bestellt am {scanResult.bestellung.Bestelldatum}, 
              Status: {scanResult.bestellung.Bestellstatus}
            </p>
          )}
          {!scanResult.ausgang && !scanResult.eingang && (
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
                      EingangsID:
                      <input
                        type="text"
                        value={newEntry.EingangsID}
                        onChange={(e) => handleNewEntryChange('EingangsID', e.target.value)}
                        required
                        style={{ padding: '5px', width: '100%' }}
                      />
                    </label>
                    <label>
                      Eingangsdatum:
                      <input
                        type="date"
                        value={newEntry.Eingangsdatum}
                        onChange={(e) => handleNewEntryChange('Eingangsdatum', e.target.value)}
                        required
                        style={{ padding: '5px', width: '100%' }}
                      />
                    </label>
                    <label>
                      Eingangsmenge:
                      <input
                        type="number"
                        value={newEntry.Eingangsmenge}
                        onChange={(e) => handleNewEntryChange('Eingangsmenge', e.target.value)}
                        required
                        style={{ padding: '5px', width: '100%' }}
                      />
                    </label>
                  </>
                )}
                <label>
                  BestellID:
                  <input
                    type="text"
                    value={newEntry.BestellID}
                    onChange={(e) => handleNewEntryChange('BestellID', e.target.value)}
                    style={{ padding: '5px', width: '100%' }}
                  />
                </label>
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
                    style={{ padding: '5px', width: '100%' }}
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
                  Monat:
                  <input
                    type="text"
                    value={newEntry.Monat}
                    onChange={(e) => handleNewEntryChange('Monat', e.target.value)}
                    required
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
      {(csvData.ausgaenge.length > 0 || csvData.eingaenge.length > 0 || csvData.bestellungen.length > 0) && (
        <button
          onClick={downloadAllCsvs}
          style={{ marginTop: '20px', padding: '5px 10px', background: '#FF9800', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          Alle CSVs herunterladen
        </button>
      )}
    </div>
  );
};

export default BarcodeScanner;