"use client";

export function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        header, 
        nav, 
        aside, 
        .no-print, 
        [role="navigation"], 
        button:not(.print-only),
        footer {
          display: none !important;
        }
        
        body {
          background-color: white !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        .flex-col {
          display: block !important;
        }

        .grid {
          display: block !important;
        }

        .card, .Card {
          break-inside: avoid;
          margin-bottom: 20px;
          border: 1px solid #e2e8f0 !important;
          box-shadow: none !important;
        }

        .p-4, .p-6, .p-8 {
          padding: 10px !important;
        }

        h1 {
          font-size: 24pt !important;
          margin-bottom: 10pt !important;
        }

        .animate-in {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }

        table {
          width: 100% !important;
          font-size: 9pt !important;
        }

        .xl\\:table {
          display: table !important;
        }

        .xl\\:hidden {
          display: none !important;
        }

        /* Ensure charts are visible in print */
        .recharts-responsive-container {
          width: 100% !important;
          height: 300px !important;
        }
      }
    `}</style>
  );
}
