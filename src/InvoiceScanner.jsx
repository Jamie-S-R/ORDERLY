// InvoiceScanner.jsx
import React, { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';
import Modal from 'react-modal';

const InvoiceScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [image, setImage] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Starte Kamera für Rechnungsscan
  const startScanner = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch (err) {
      console.error('Camera access error:', err);
      setIsScanning(false);
    }
  };

  // Erfasse Bild
  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/png');
    setImage(imageData);
    stopScanner();
    extractText(imageData);
  };

  // Stoppe Kamera
  const stopScanner = () => {
    setIsScanning(false);
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Extrahiere Text mit Tesseract.js
  const extractText = async (imageData) => {
    const { data: { text } } = await Tesseract.recognize(imageData, 'eng+deu');
    const parsedData = parseInvoiceText(text);
    setExtractedData(parsedData);
    setModalIsOpen(true);
  };

  // Parse Rechnungstext (einfache Heuristik)
  const parseInvoiceText = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const data = {
      Lieferant: '',
      Produkte: [],
      Gesamtpreis: '',
      Datum: '',
    };

    // Einfache reguläre Ausdrücke für Parsing
    const quantityRegex = /(\d+)\s*(?:Stück|Stk|Einheiten)/i;
    const priceRegex = /(\d+\,\d{2})\s*(?:€|EUR)/i;
    const dateRegex = /\b(\d{2}\.\d{2}\.\d{4})\b/;
    const supplierRegex = /(?:Lieferant|Rechnung von|Von)\s*:\s*([^\n]+)/i;

    lines.forEach(line => {
      if (supplierRegex.test(line)) {
        data.Lieferant = line.match(supplierRegex)[1];
      } else if (dateRegex.test(line)) {
        data.Datum = line.match(dateRegex)[1];
      } else if (priceRegex.test(line)) {
        data.Gesamtpreis = line.match(priceRegex)[1];
      } else if (quantityRegex.test(line)) {
        const quantity = line.match(quantityRegex)[1];
        const productName = line.replace(quantityRegex, '').replace(priceRegex, '').trim();
        data.Produkte.push({ Name: productName, Menge: quantity });
      }
    });

    return data;
  };

  // Speichere Rechnungsdaten
  const handleSubmit = () => {
    // TODO: Speichere extractedData in invoices.csv oder bestellungen.csv
    console.log('Rechnungsdaten:', extractedData);
    setModalIsOpen(false);
    setImage(null);
    setExtractedData(null);
  };

  return (
    <div className="invoice-scanner">
      <h2>📄 Rechnungsscanner</h2>
      {!isScanning && (
        <button className="bg-yellow-500 text-white px-4 py-2 rounded" onClick={startScanner}>
          Scanner starten
        </button>
      )}
      {isScanning && (
        <>
          <video ref={videoRef} className="w-full max-w-md border-2 border-yellow-500 rounded" />
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
            <h3 className="text-lg font-bold mb-4">Rechnungsdaten</h3>
            <p><strong>Lieferant:</strong> {extractedData.Lieferant}</p>
            <p><strong>Datum:</strong> {extractedData.Datum}</p>
            <p><strong>Gesamtpreis:</strong> {extractedData.Gesamtpreis} €</p>
            <h4 className="mt-4 font-bold">Produkte:</h4>
            {extractedData.Produkte.map((p, i) => (
              <p key={i}>{p.Name}: {p.Menge} Stück</p>
            ))}
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="bg-green-500 text-white px-4 py-2 rounded"
                onClick={handleSubmit}
              >
                Bestätigen
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