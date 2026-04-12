import logoUrl from '../assets/logo.png';

const COMPANY_INFO = "Rabat, Maroc • Tel: 0522-12-34-56";

const buildReceiptHTML = (order, paymentTypeLabel) => {
  const items = order.commandeTapis || [];

  const itemsRows = items.map((item, idx) => {
    // Support both new fields (Feature B) and legacy fields
    const nom = item.nom || item.tapis?.nom || item.name || `Article ${idx + 1}`;

    const largeur = item.largeur ?? item.tapis?.largeur ?? null;
    const hauteur = item.hauteur ?? item.tapis?.hauteur ?? null;
    const dimensions = (largeur && hauteur) ? `${largeur}m × ${hauteur}m` : '—';

    const prixCalcule = item.prixCalcule ?? item.tapis?.prixCalcule ?? null;
    const prixFinal = item.prixFinal ?? item.prixUnitaire ?? item.tapis?.prixUnitaire ?? null;
    const hasDiscount = prixCalcule && prixFinal && parseFloat(prixFinal) < parseFloat(prixCalcule);

    return `
      <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f9fafb'}">
        <td style="padding:10px 12px;font-size:13px;color:#111827;font-weight:600;">${nom}</td>
        <td style="padding:10px 12px;font-size:13px;color:#6b7280;text-align:center;">${dimensions}</td>
        <td style="padding:10px 12px;font-size:13px;color:#6b7280;text-align:center;">${prixCalcule ? prixCalcule + ' DH' : '—'}</td>
        <td style="padding:10px 12px;font-size:13px;text-align:center;font-weight:700;color:${hasDiscount ? '#F97316' : '#111827'};">
          ${prixFinal ? prixFinal + ' DH' : '—'}
          ${hasDiscount ? '<br><span style="font-size:10px;color:#F97316;">⬇ remise</span>' : ''}
        </td>
      </tr>
    `;
  }).join('');

  // Total: use montantTotal from order (authoritative), fallback to sum of prixFinal
  const total = order.montantTotal
    ?? items.reduce((sum, item) => sum + parseFloat(item.prixFinal ?? item.prixUnitaire ?? 0), 0);

  const clientName = order.client?.nom || order.client?.name || order.client?.fullName || 'Client';
  const clientPhone = order.client?.phones?.[0]?.phoneNumber || '—';
  const orderNum = order.numeroCommande || order.id;
  const dateStr = order.dateCreation
    ? new Date(order.dateCreation).toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
    : new Date().toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>${orderNum}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; color: #1a1a1a; }
        .container { width: 100%; max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 20px; }
        .header img { max-height: 50px; margin-bottom: 8px; }
        .header h1 { margin: 0; color: #F97316; font-size: 22px; }
        .header p { margin: 1px 0; color: #666; font-size: 13px; }
        .header .contact { font-size: 11px; color: #888; margin-top: 4px; }
        .divider { border-top: 2px dashed #eee; margin: 15px 0; }
        .info-block { display: flex; flex-wrap: wrap; justify-content: space-between; margin-bottom: 20px; gap: 10px; }
        .info-col { flex: 1; min-width: 140px; }
        .info-col p { margin: 4px 0; font-size: 13px; }
        .info-col strong { color: #555; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px; }
        th, td { padding: 10px 8px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #1a1a1a; color: white; border: none; }
        tr:nth-child(even) { background-color: #fafafa; }
        .total-block { text-align: right; margin-bottom: 30px; }
        .total-block h2 { font-size: 20px; color: #F97316; margin: 0; }
        .footer { text-align: center; border-top: 1px solid #eee; padding-top: 15px; }
        .footer p { margin: 4px 0; font-size: 13px; color: #1a1a1a; }
        .footer small { color: #999; font-size: 10px; }

        @media print {
          body { padding: 0; margin: 0; }
          .container { max-width: 100% !important; }
          /* Optimized for 80mm thermal paper */
          @page { margin: 10mm; }
          .header h1 { color: black !important; }
          .total-block h2 { color: black !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Logo" />
          <h1>PureClean</h1>
          <p>Service de nettoyage de tapis</p>
          <div class="contact">${COMPANY_INFO}</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="info-block">
          <div class="info-col">
            <p><strong>Client:</strong> ${clientName}</p>
            <p><strong>Téléphone:</strong> ${clientPhone}</p>
            <p><strong>Paiement:</strong> ${paymentTypeLabel}</p>
          </div>
          <div class="info-col">
            <p><strong>Commande:</strong> #${orderNum}</p>
            <p><strong>Date:</strong> ${dateStr}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th style="text-align:center;">Dimensions</th>
              <th style="text-align:center;">Prix calculé</th>
              <th style="text-align:center;">Prix final</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="total-block">
          <h2>TOTAL: ${total} DH</h2>
        </div>

        <div class="footer">
          <p>Merci pour votre confiance — PureClean 🧡</p>
          <small>Imprimé le ${dateStr}</small>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const printReceipt = (order, paymentTypeLabel) => {
  const orderNum = order.numeroCommande || order.id;
  const html = buildReceiptHTML(order, paymentTypeLabel);

  // Store original title to restore it later
  const originalTitle = document.title;
  // Set main document title to order number (this pre-fills the filename in the print dialog)
  document.title = orderNum;

  // Create a hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  let isPrinting = false;
  const doPrint = () => {
    if (isPrinting) return;
    isPrinting = true;
    
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    
    // Restore the original website title after a short delay
    setTimeout(() => {
      document.title = originalTitle;
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  };

  // Wait for content to load
  iframe.contentWindow.onload = doPrint;
  setTimeout(doPrint, 2000);
};

export const downloadReceiptPDF = (order, paymentTypeLabel) => {
  const html = buildReceiptHTML(order, paymentTypeLabel);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recu-${order.numeroCommande || order.id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
