import React from 'react';

const InvoiceScanner = ({ onDataUpdate }) => {
  return (
    <div className="invoice-scanner p-3 sm:p-4 bg-gray-900 rounded-lg border-l-4 border-[#f7a440] max-w-full mx-auto sm:max-w-md">
      <h2 className="text-lg sm:text-xl font-bold text-[#f7a440] mb-3 sm:mb-4">📄 Rechnungsscanner</h2>
      <div className="text-center">
        <p className="text-gray-300 text-sm sm:text-base mb-4">
          Diese Funktion ist derzeit in Entwicklung.
        </p>
        <p className="text-[#f7a440] text-base sm:text-lg font-semibold">
          Coming Soon!
        </p>
        <div className="mt-4">
          <svg
            className="w-16 h-16 mx-auto text-[#f7a440] opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default InvoiceScanner;