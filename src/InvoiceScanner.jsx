import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import Modal from 'react-modal';
import Papa from 'papaparse';

const InvoiceScanner = ({ onDataUpdate }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [image, setImage] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Preprocess image for better OCR
  const preprocessImage = (canvas) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Convert to grayscale and increase contrast
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const value = avg > 128 ? 255 : 0; // Binarization
      data[i] = data[i + 1] = data[i + 2] = value;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  };

  // Start camera for invoice scanning
  const startScanner = async () => {
    setIsScanning(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Kamerafehler: ' + err.message);
      setIsScanning(false);
    }
  };

  // Capture image
  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = preprocessImage(canvas);
    setImage(imageData);
    stopScanner();
    extractText(imageData);
  };

  // Stop camera
  const stopScanner = () => {
    setIsScanning(false);
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Extract text with Tesseract.js
  const extractText = async (imageData) => {
    try {
      const { data: { text } } = await Tesseract.recognize(imageData, 'eng+deu', {
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,€-/: ',
        tessedit_pageseg_mode: Tesseract.PSM.AUTO, // Auto page segmentation
      });
      const parsedData = parseInvoiceText(text);
      setExtractedData(parsedData);
      setModalIsOpen(true);
    } catch (err) {
      setError('Texterkennungsfehler: ' + err.message);
    }
  };

  // Parse invoice text with robust heuristics
  const parseInvoiceText = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const data = {
      Lieferant: '',
      Produkte: [],
      Gesamtpreis: '',
      Datum: '',
      BestellID: '',
      Rechnungsnummer: '',
    };

    const quantityRegex = /^(\d+)\s*(?:Stück|Stk|Einheiten|x)\s*(.*)$/i;
    const priceRegex = /(\d+[,.]\d{2})\s*(?:€|EUR)/;
    const dateRegex = /\b(\d{2}\.\d{2}\.\d{4})\b/;
    const supplierRegex = /(?:Lieferant|Rechnung von|Von|Supplier)\s*[:|-]?\s*([^\n]+)/i;
    const invoiceIdRegex = /(?:Rechnungsnummer|Invoice No\.|Nr\.)\s*[:|-]?\s*(\w+)/i;
    const totalRegex = /(?:Gesamt|Total|Summe)\s*[:|-]?\s*(\d+[,.]\d{2})\s*(?:€|EUR)/i;

    let currentProduct = null;
    lines.forEach(line => {
      if (supplierRegex.test(line)) {
        data.Lieferant = line.match(supplierRegex)[1].trim();
      } else if (dateRegex.test(line)) {
        data.Datum = line.match(dateRegex)[1];
      } else if (invoiceIdRegex.test(line)) {
        data.Rechnungsnummer = line.match(invoiceIdRegex)[1];
        data.BestellID = data.Rechnungsnummer || Math.floor(3000 + Math.random() * 10000).toString();
      } else if (totalRegex.test(line)) {
        data.Gesamtpreis = line.match(totalRegex)[1].replace(',', '.');
      } else if (quantityRegex.test(line)) {
        const [, quantity, description] = line.match(quantityRegex);
        currentProduct = { Menge: quantity, Artikelbeschreibung: description.trim(), PreisProEinheit: '' };
        data.Produkte.push(currentProduct);
      } else if (currentProduct && priceRegex.test(line)) {
        currentProduct.PreisProEinheit = line.match(priceRegex)[1].replace(',', '.');
      }
    });

    return data;
  };

  // Handle form changes
  const handleFormChange = (field, value, index = null) => {
    setExtractedData(prev => {
      const updated = { ...prev };
      if (index !== null) {
        updated.Produkte[index][field] = value;
      } else {
        updated[field] = value;
      }
      return updated;
    });
  };

  // Save invoice data
  const handleSubmit = async () => {
    try {
      const newOrder = {
        BestellID: extractedData.BestellID,
        Bestelldatum: extractedData.Datum || new Date().toISOString().split('T')[0],
        Bestellart: 'Standardbestellung',
        Lieferant: extractedData.Lieferant || 'Unbekannt',
        Artikelnummer: extractedData.Produkte[0]?.Artikelbeschreibung.slice(0, 10) || 'INV' + extractedData.BestellID,
        Artikelbeschreibung: extractedData.Produkte[0]?.Artikelbeschreibung || 'Rechnungsartikel',
        Menge: extractedData.Produkte[0]?.Menge || '1',
        Einheit: 'Stück',
        PreisProEinheit: extractedData.Produkte[0]?.PreisProEinheit || extractedData.Gesamtpreis || '0.00',
        Bestellstatus: 'Offen',
        GeplantesLieferdatum: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
        TatsächlichesLieferdatum: extractedData.Datum || new Date().toISOString().split('T')[0],
        AktuellerLagerbestand: extractedData.Produkte[0]?.Menge || '1',
        Engpass: 'false',
        KritischSeit: '',
        Gesamtpreis: extractedData.Gesamtpreis || '0.00',
        Lieferdauer: '7',
        JahrMonat: new Date().toISOString().slice(0, 7),
        Kategorie: 'Sonstiges',
      };

      const newOrderCsv = `${newOrder.BestellID},${newOrder.Bestelldatum},${newOrder.Bestellart},${newOrder.Lieferant},${newOrder.Artikelnummer},${newOrder.Artikelbeschreibung},${newOrder.Menge},${newOrder.Einheit},${newOrder.PreisProEinheit},${newOrder.Bestellstatus},${newOrder.GeplantesLieferdatum},${newOrder.TatsächlichesLieferdatum},${newOrder.AktuellerLagerbestand},${newOrder.Engpass},${newOrder.KritischSeit},${newOrder.Gesamtpreis},${newOrder.Lieferdauer},${newOrder.JahrMonat},${newOrder.Kategorie}`;
      
      const response = await fetch('/api/update-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bestellungen: newOrderCsv }),
      });

      if (!response.ok) {
        const errorText = await response.json();
        throw new Error(`Backend-Fehler: ${response.status} - ${JSON.stringify(errorText)}`);
      }

      if (onDataUpdate) {
        onDataUpdate();
      }

      setModalIsOpen(false);
      setImage(null);
      setExtractedData(null);
    } catch (err) {
      setError('Fehler beim Speichern: ' + err.message);
    }
  };

  return (
    <div className="invoice-scanner">
      <h2>📄 Rechnungsscanner</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {!isScanning && (
        <button className="bg-yellow-500 text-white px-4 py-2 rounded" onClick={startScanner}>
          Scanner starten
        </button>
      )}
      {isScanning && (
        <>
          <video ref={videoRef} className="w-full max-w-md border-2 border-yellow-500 rounded" muted playsInline />
          <button className="bg-blue-500 text-white px-4 py-2 rounded mt-2" onClick={captureImage}>
            Bild aufnehmen
          </button>
          <button className="bg-red-500 text-white px-4 py-2 rounded mt-2" onClick={stopScanner}>
            Scanner stoppen
          </button>
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </>
      )}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        className="bg-gray-800 p-6 rounded-lg max-w-md mx-auto mt-20 text-white"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        {extractedData && (
          <>
            <h3 className="text-lg font-bold mb-4">Rechnungsdaten bearbeiten</h3>
            <label className="block mb-2">
              Lieferant:
              <input
                type="text"
                value={extractedData.Lieferant}
                onChange={(e) => handleFormChange('Lieferant', e.target.value)}
                className="w-full p-2 mt-1 bg-gray-700 text-white rounded"
              />
            </label>
            <label className="block mb-2">
              Datum (DD.MM.YYYY):
              <input
                type="text"
                value={extractedData.Datum}
                onChange={(e) => handleFormChange('Datum', e.target.value)}
                className="w-full p-2 mt-1 bg-gray-700 text-white rounded"
              />
            </label>
            <label className="block mb-2">
              Rechnungsnummer:
              <input
                type="text"
                value={extractedData.Rechnungsnummer}
                onChange={(e) => handleFormChange('Rechnungsnummer', e.target.value)}
                className="w-full p-2 mt-1 bg-gray-700 text-white rounded"
              />
            </label>
            <label className="block mb-2">
              Gesamtpreis (€):
              <input
                type="text"
                value={extractedData.Gesamtpreis}
                onChange={(e) => handleFormChange('Gesamtpreis', e.target.value)}
                className="w-full p-2 mt-1 bg-gray-700 text-white rounded"
              />
            </label>
            <h4 className="mt-4 font-bold">Produkte:</h4>
            {extractedData.Produkte.map((p, i) => (
              <div key={i} className="mb-2">
                <label className="block">
                  Beschreibung:
                  <input
                    type="text"
                    value={p.Artikelbeschreibung}
                    onChange={(e) => handleFormChange('Artikelbeschreibung', e.target.value, i)}
                    className="w-full p-2 mt-1 bg-gray-700 text-white rounded"
                  />
                </label>
                <label className="block">
                  Menge:
                  <input
                    type="number"
                    value={p.Menge}
                    onChange={(e) => handleFormChange('Menge', e.target.value, i)}
                    className="w-full p-2 mt-1 bg-gray-700 text-white rounded"
                  />
                </label>
                <label className="block">
                  Preis pro Einheit (€):
                  <input
                    type="text"
                    value={p.PreisProEinheit}
                    onChange={(e) => handleFormChange('PreisProEinheit', e.target.value, i)}
                    className="w-full p-2 mt-1 bg-gray-700 text-white rounded"
                  />
                </label>
              </div>
            ))}
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={handleSubmit}
              >
                Speichern
              </button>
              <button
                className="bg-red-500 text-white px-4 py-2 rounded"
                onClick={() => setModalIsOpen(false)}
              >
                Abbrechen
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default InvoiceScanner;