import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Driver, Passenger, Trip, CompanyConfig } from '../types';
import { getStoredCompanyConfig } from './storage';

/**
 * Converts Hex color string to [r, g, b] array.
 */
export function hexToRgb(hex: string, fallback: [number, number, number] = [6, 95, 70]): [number, number, number] {
  if (!hex) return fallback;
  let cleaned = hex.replace('#', '').trim();
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((c) => c + c).join('');
  }
  if (cleaned.length !== 6) return fallback;
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return fallback;
  return [r, g, b];
}

/**
 * Truncates and fits text within maxWidth in millimeters, avoiding overflow and collision.
 */
function fitText(doc: jsPDF, text: string, maxWidth: number): string {
  if (!text) return '';
  if (doc.getTextWidth(text) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 3 && doc.getTextWidth(truncated + '...') > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + '...';
}

/**
 * Renders the top brand header banner on Page 1 using company configuration (name, logo, and colors).
 */
function drawPageOneHeader(
  doc: jsPDF,
  subtitle: string,
  emissionDate: string,
  emissionTime: string,
  company: CompanyConfig
): void {
  const primaryRgb = hexToRgb(company.primaryColor, [6, 95, 70]);

  // Top banner with chosen primary color (height 22mm for single-page A4 efficiency)
  doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.rect(0, 0, 210, 22, 'F');

  // Check if company has custom logo
  const hasLogo = Boolean(company.logoUrl && company.logoUrl.trim().length > 20);
  if (hasLogo) {
    try {
      let format = 'PNG';
      if (company.logoUrl.includes('image/jpeg') || company.logoUrl.includes('image/jpg')) {
        format = 'JPEG';
      } else if (company.logoUrl.includes('image/webp')) {
        format = 'WEBP';
      }
      // White backing card for logo
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(180, 2.5, 17, 17, 1.5, 1.5, 'F');
      doc.addImage(company.logoUrl, format, 181, 3.5, 15, 15, undefined, 'FAST');
    } catch (e) {
      console.warn('Erro ao inserir logo no PDF:', e);
    }
  }

  // Company Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  const maxTitleWidth = hasLogo ? 160 : 185;
  const companyNameUpper = (company.companyName || 'OSNIR TURISMO').toUpperCase();
  const safeName = fitText(doc, companyNameUpper, maxTitleWidth);
  doc.text(safeName, 14, 8);

  // Subtitle / Document Title
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(230, 245, 240);
  doc.text(subtitle.toUpperCase(), 14, 14);

  // Emission line & Official document badge
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(240, 253, 244);
  doc.text(`Emissão: ${emissionDate} às ${emissionTime}`, 14, 19);

  if (!hasLogo) {
    doc.text('DOCUMENTO OFICIAL DE TRANSPORTE • PADRÃO FOLHA ÚNICA (A4)', 196, 19, { align: 'right' });
  } else {
    doc.text('FOLHA ÚNICA (A4)', 176, 19, { align: 'right' });
  }
}

/**
 * Calculates optimal font size, padding, and row heights to strictly fit any passenger count on 1 single A4 page.
 */
interface SinglePageTableStyle {
  fontSize: number;
  headFontSize: number;
  cellPadding: { top: number; right: number; bottom: number; left: number };
  minCellHeight: number;
}

function getSinglePageTableStyles(rowCount: number, availableHeightMm: number = 241): SinglePageTableStyle {
  const safeCount = Math.max(rowCount, 1);
  const targetRowHeight = (availableHeightMm - 7) / safeCount;

  if (targetRowHeight >= 8.5) {
    return {
      fontSize: 8.5,
      headFontSize: 8,
      cellPadding: { top: 2.2, right: 2, bottom: 2.2, left: 2 },
      minCellHeight: 6.8,
    };
  } else if (targetRowHeight >= 6.5) {
    return {
      fontSize: 8.0,
      headFontSize: 7.8,
      cellPadding: { top: 1.6, right: 1.8, bottom: 1.6, left: 1.8 },
      minCellHeight: 5.6,
    };
  } else if (targetRowHeight >= 5.0) {
    return {
      fontSize: 7.4,
      headFontSize: 7.2,
      cellPadding: { top: 1.1, right: 1.5, bottom: 1.1, left: 1.5 },
      minCellHeight: 4.6,
    };
  } else if (targetRowHeight >= 4.0) {
    return {
      fontSize: 6.8,
      headFontSize: 6.6,
      cellPadding: { top: 0.65, right: 1.2, bottom: 0.65, left: 1.2 },
      minCellHeight: 3.7,
    };
  } else {
    return {
      fontSize: 6.0,
      headFontSize: 6.0,
      cellPadding: { top: 0.35, right: 1.0, bottom: 0.35, left: 1.0 },
      minCellHeight: 3.0,
    };
  }
}

/**
 * Ensures strict single-page output on A4 and applies single-sheet footer.
 */
function applySinglePageFooter(
  doc: jsPDF,
  company: CompanyConfig
): void {
  // Enforce single-page guarantee: eliminate any accidental extra pages
  while (doc.getNumberOfPages() > 1) {
    doc.deletePage(doc.getNumberOfPages());
  }
  doc.setPage(1);

  const companyNameUpper = (company.companyName || 'OSNIR TURISMO').toUpperCase();

  // Bottom footer dividing line at Y=286
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(14, 286, 196, 286);

  // Footer text
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`${companyNameUpper} • Documento Oficial de Viagem • Formato Folha Única A4`, 14, 290.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Folha Única (1 de 1)', 196, 290.5, { align: 'right' });
}

/**
 * Draws standard page footers and headers for all pages using company config.
 */
function applyFootersAndHeaders(
  doc: jsPDF,
  subtitle: string,
  emissionDate: string,
  emissionTime: string,
  company: CompanyConfig
): void {
  const primaryRgb = hexToRgb(company.primaryColor, [6, 95, 70]);
  const totalPages = doc.getNumberOfPages();
  const companyNameUpper = (company.companyName || 'OSNIR TURISMO').toUpperCase();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // On pages 2+, draw a sleek top header banner with chosen primary color
    if (i > 1) {
      doc.setFillColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      doc.rect(0, 0, 210, 11, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${companyNameUpper} • ${subtitle.toUpperCase()}`, 14, 7.5);

      doc.setFont('helvetica', 'normal');
      doc.text(`${emissionDate} às ${emissionTime}`, 196, 7.5, { align: 'right' });
    }

    // Bottom footer line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, 283, 196, 283);

    // Footer text
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`${companyNameUpper} • Sistema de Gestão de Passageiros e Viagens`, 14, 288.5);
    doc.text(`Página ${i} de ${totalPages}`, 196, 288.5, { align: 'right' });
  }
}

/**
 * 1. Generate Driver Trip Manifest PDF - Strictly 1 Single A4 Page
 */
export function generateDriverTripPdf(
  driver: Driver,
  passengers: Passenger[],
  customCompanyConfig?: CompanyConfig
): void {
  const company = customCompanyConfig || getStoredCompanyConfig();
  const primaryRgb = hexToRgb(company.primaryColor, [6, 95, 70]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const driverPassengers = passengers.filter((p) => p.driverId === driver.id);
  const dataFormatada = new Date().toLocaleDateString('pt-BR');
  const horaFormatada = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const subtitle = 'Manifesto de Viagem por Motorista';

  // Page 1 Header (Height 22mm)
  drawPageOneHeader(doc, subtitle, dataFormatada, horaFormatada, company);

  // Driver Info Card (Compact box from Y=24 to Y=41, height 17mm)
  const boxY = 24;
  const boxH = 17;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, boxY, 182, boxH, 2, 2, 'FD');

  // Row 1 (Y=29.5)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Motorista Designado:', 18, 29.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const safeDriverName = fitText(doc, driver.fullName.toUpperCase(), 80);
  doc.text(safeDriverName, 49, 29.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Passageiros Vinculados:', 130, 29.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text(`${driverPassengers.length} passageiro(s)`, 166, 29.5);

  // Row 2 (Y=36.5)
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Contato Motorista:', 18, 36.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const safeVehicle = fitText(doc, (driver.phone ? `TEL: ${driver.phone}` : 'FROTA REGULAR / OPERACIONAL').toUpperCase(), 75);
  doc.text(safeVehicle, 49, 36.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Situação:', 130, 36.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text('CONFIRMADO (FOLHA ÚNICA)', 145, 36.5);

  // Table Data
  let tableRows: any[] = [];
  if (driverPassengers.length === 0) {
    tableRows = [
      [
        {
          content: 'Nenhum passageiro vinculado a este motorista.',
          colSpan: 6,
          styles: { halign: 'center', fontStyle: 'italic', textColor: [148, 163, 184], minCellHeight: 12 },
        },
      ],
    ];
  } else {
    tableRows = driverPassengers.map((p, index) => [
      (index + 1).toString(),
      p.fullName.toUpperCase(),
      p.origin,
      p.destination,
      p.seller,
      '___/___',
    ]);
  }

  // Dynamic table sizing based on passenger count to strictly guarantee single A4 page
  const tableStyles = getSinglePageTableStyles(tableRows.length, 241);

  // Start table at Y=43 (clearance of 2mm below the info card)
  autoTable(doc, {
    startY: 43,
    head: [['Nº', 'NOME COMPLETO DO PASSAGEIRO', 'ORIGEM', 'DESTINO DA VIAGEM', 'VENDEDOR', 'ASSINATURA / EMBARQUE']],
    body: tableRows,
    styles: {
      font: 'helvetica',
      fontSize: tableStyles.fontSize,
      cellPadding: tableStyles.cellPadding,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
      valign: 'middle',
      overflow: 'ellipsize',
    },
    headStyles: {
      fillColor: primaryRgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: tableStyles.headFontSize,
      halign: 'left',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 55, fontStyle: 'bold' },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 26 },
      5: { cellWidth: 32, halign: 'center' },
    },
    margin: { top: 12, right: 14, bottom: 12, left: 14 },
    pageBreak: 'avoid',
  });

  applySinglePageFooter(doc, company);

  const sanitizedDriverName = driver.fullName.replace(/\s+/g, '_').toLowerCase();
  const safeDate = dataFormatada.replace(/\//g, '-');
  doc.save(`Manifesto_Viagem_${sanitizedDriverName}_${safeDate}.pdf`);
}

/**
 * 2. Generate Official PDF for a registered Trip with Date, Origin, Destination, Driver, and All Passengers
 */
export function generateTripOfficialPdf(
  trip: Trip,
  driver: Driver | undefined,
  passengers: Passenger[],
  customCompanyConfig?: CompanyConfig
): void {
  const company = customCompanyConfig || getStoredCompanyConfig();
  const primaryRgb = hexToRgb(company.primaryColor, [6, 95, 70]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const tripPassengers = passengers.filter((p) => trip.passengerIds.includes(p.id));
  const dataFormatada = new Date().toLocaleDateString('pt-BR');
  const horaFormatada = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const subtitle = 'Relatório Oficial de Viagem Programada';

  // Format trip date (can be YYYY-MM-DD or Brazilian format)
  let displayTripDate = trip.date;
  if (trip.date && trip.date.includes('-')) {
    const parts = trip.date.split('-');
    if (parts.length === 3) {
      displayTripDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  // Page 1 Header (Height 22mm)
  drawPageOneHeader(doc, subtitle, dataFormatada, horaFormatada, company);

  // Trip Summary Box (Compact box from Y=24 to Y=41, height 17mm)
  const boxY = 24;
  const boxH = 17;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, boxY, 182, boxH, 2, 2, 'FD');

  // Row 1 (Y=29.5)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Data da Viagem:', 18, 29.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(displayTripDate, 41, 29.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Origem / Destino:', 75, 29.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const safeRoute = fitText(doc, `${trip.origin} ➔ ${trip.destination}`.toUpperCase(), 55);
  doc.text(safeRoute, 98, 29.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Motorista:', 148, 29.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const safeDriver = fitText(doc, (driver ? driver.fullName : 'A DEFINIR').toUpperCase(), 38);
  doc.text(safeDriver, 163, 29.5);

  // Row 2 (Y=36.5)
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Passageiros:', 18, 36.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text(`${tripPassengers.length} confirmado(s)`, 41, 36.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Tipo de Viagem:', 75, 36.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const safeBus = fitText(doc, 'TRANSPORTE REGULAR / PROGRAMADO', 48);
  doc.text(safeBus, 98, 36.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Situação:', 148, 36.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text('CONFIRMADA (1 FOLHA)', 163, 36.5);

  // Table Data
  let tableRows: any[] = [];
  if (tripPassengers.length === 0) {
    tableRows = [
      [
        {
          content: 'Nenhum passageiro vinculado a esta viagem programada.',
          colSpan: 6,
          styles: { halign: 'center', fontStyle: 'italic', textColor: [148, 163, 184], minCellHeight: 12 },
        },
      ],
    ];
  } else {
    tableRows = tripPassengers.map((p, index) => [
      (index + 1).toString(),
      p.fullName.toUpperCase(),
      p.origin,
      p.destination,
      p.seller,
      '___/___',
    ]);
  }

  // Dynamic table sizing based on passenger count to strictly guarantee single A4 page
  const tableStyles = getSinglePageTableStyles(tableRows.length, 241);

  // Start table at Y=43 (clearance of 2mm below summary box)
  autoTable(doc, {
    startY: 43,
    head: [['Nº', 'NOME COMPLETO DO PASSAGEIRO', 'ORIGEM', 'DESTINO', 'VENDEDOR', 'CHECK-IN / ASSINATURA']],
    body: tableRows,
    styles: {
      font: 'helvetica',
      fontSize: tableStyles.fontSize,
      cellPadding: tableStyles.cellPadding,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
      valign: 'middle',
      overflow: 'ellipsize',
    },
    headStyles: {
      fillColor: primaryRgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: tableStyles.headFontSize,
      halign: 'left',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 55, fontStyle: 'bold' },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 26 },
      5: { cellWidth: 32, halign: 'center' },
    },
    margin: { top: 12, right: 14, bottom: 12, left: 14 },
    pageBreak: 'avoid',
  });

  applySinglePageFooter(doc, company);

  const safeFileOrigin = trip.origin.replace(/\s+/g, '_').toLowerCase();
  const safeFileDest = trip.destination.replace(/\s+/g, '_').toLowerCase();
  const safeDate = displayTripDate.replace(/\//g, '-');
  doc.save(`Relatorio_Viagem_${safeFileOrigin}_${safeFileDest}_${safeDate}.pdf`);
}

/**
 * 3. Generate General Passengers List PDF
 */
export function generateGeneralPassengersListPdf(
  passengers: Passenger[],
  drivers: Driver[],
  filterNote?: string,
  customCompanyConfig?: CompanyConfig
): void {
  const company = customCompanyConfig || getStoredCompanyConfig();
  const primaryRgb = hexToRgb(company.primaryColor, [6, 95, 70]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const dataFormatada = new Date().toLocaleDateString('pt-BR');
  const horaFormatada = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const subtitle = 'Lista Geral de Clientes / Passageiros';

  // Map drivers for quick lookup
  const driverMap = new Map<string, string>();
  drivers.forEach((d) => driverMap.set(d.id, d.fullName));

  // Page 1 Header (Height 22mm)
  drawPageOneHeader(doc, subtitle, dataFormatada, horaFormatada, company);

  // Summary Card (Compact box from Y=24 to Y=41, height 17mm)
  const boxY = 24;
  const boxH = 17;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, boxY, 182, boxH, 2, 2, 'FD');

  // Row 1 (Y=29.5)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Total de Passageiros:', 18, 29.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${passengers.length} passageiro(s) listado(s)`, 49, 29.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Filtro Aplicado:', 125, 29.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  const safeFilter = fitText(doc, filterNote || 'Todos os Registros', 48);
  doc.text(safeFilter, 146, 29.5);

  // Row 2 (Y=36.5)
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Documento / Formato:', 18, 36.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('LISTAGEM OPERACIONAL GERAL', 49, 36.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Situação:', 125, 36.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text('REGULARIZADO (FOLHA ÚNICA)', 146, 36.5);

  // Table Data
  let tableRows: any[] = [];
  if (passengers.length === 0) {
    tableRows = [
      [
        {
          content: 'Nenhum passageiro cadastrado no momento.',
          colSpan: 6,
          styles: { halign: 'center', fontStyle: 'italic', textColor: [148, 163, 184], minCellHeight: 12 },
        },
      ],
    ];
  } else {
    tableRows = passengers.map((p, index) => {
      const driverName = p.driverId ? (driverMap.get(p.driverId) || 'Não localizado') : 'Não destinado';
      return [
        (index + 1).toString(),
        p.fullName.toUpperCase(),
        p.origin,
        p.destination,
        p.seller,
        driverName,
      ];
    });
  }

  // Dynamic table sizing based on passenger count to strictly guarantee single A4 page
  const tableStyles = getSinglePageTableStyles(tableRows.length, 241);

  // Start table at Y=43 (clearance of 2mm)
  autoTable(doc, {
    startY: 43,
    head: [['Nº', 'NOME COMPLETO DO CLIENTE', 'ORIGEM', 'DESTINO DA VIAGEM', 'VENDEDOR', 'MOTORISTA DESTINADO']],
    body: tableRows,
    styles: {
      font: 'helvetica',
      fontSize: tableStyles.fontSize,
      cellPadding: tableStyles.cellPadding,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
      valign: 'middle',
      overflow: 'ellipsize',
    },
    headStyles: {
      fillColor: primaryRgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: tableStyles.headFontSize,
      halign: 'left',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 54, fontStyle: 'bold' },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
      4: { cellWidth: 26 },
      5: { cellWidth: 33, fontStyle: 'italic' },
    },
    margin: { top: 12, right: 14, bottom: 12, left: 14 },
    pageBreak: 'avoid',
  });

  applySinglePageFooter(doc, company);

  const safeDate = dataFormatada.replace(/\//g, '-');
  doc.save(`Lista_Geral_Passageiros_${safeDate}.pdf`);
}

/**
 * 4. Generate Seller Sales Report PDF - Strictly 1 Single A4 Page
 */
export function generateSellerReportPdf(
  sellerStats: { seller: string; count: number }[],
  totalSales: number,
  customCompanyConfig?: CompanyConfig
): void {
  const company = customCompanyConfig || getStoredCompanyConfig();
  const primaryRgb = hexToRgb(company.primaryColor, [6, 95, 70]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const dataFormatada = new Date().toLocaleDateString('pt-BR');
  const horaFormatada = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const subtitle = 'Relatório de Vendas por Vendedor';

  // Page 1 Header (Height 22mm)
  drawPageOneHeader(doc, subtitle, dataFormatada, horaFormatada, company);

  // Summary Card (Compact box from Y=24 to Y=41, height 17mm)
  const boxY = 24;
  const boxH = 17;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, boxY, 182, boxH, 2, 2, 'FD');

  // Row 1 (Y=29.5)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Total Geral de Vendas:', 18, 29.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalSales} passagens`, 54, 29.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Vendedores Ativos:', 125, 29.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text(`${sellerStats.length} vendedor(es)`, 155, 29.5);

  // Row 2 (Y=36.5)
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Tipo de Relatório:', 18, 36.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('DESEMPENHO COMERCIAL & RANKING', 54, 36.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Situação:', 125, 36.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text('CONCLUÍDO (FOLHA ÚNICA)', 155, 36.5);

  // Table Data
  let tableRows: any[] = [];
  if (sellerStats.length === 0) {
    tableRows = [
      [
        {
          content: 'Nenhuma venda de passagem registrada no momento.',
          colSpan: 4,
          styles: { halign: 'center', fontStyle: 'italic', textColor: [148, 163, 184], minCellHeight: 12 },
        },
      ],
    ];
  } else {
    tableRows = sellerStats.map((stat, index) => {
      const percentage = totalSales > 0 ? ((stat.count / totalSales) * 100).toFixed(1) + '%' : '0%';
      return [
        (index + 1).toString(),
        stat.seller.toUpperCase(),
        `${stat.count} ${stat.count === 1 ? 'passagem' : 'passagens'}`,
        percentage,
      ];
    });
  }

  // Dynamic table sizing based on seller count to strictly guarantee single A4 page
  const tableStyles = getSinglePageTableStyles(tableRows.length, 241);

  // Start table at Y=43 (clearance of 2mm)
  autoTable(doc, {
    startY: 43,
    head: [['RANK', 'NOME DO VENDEDOR', 'PASSAGENS VENDIDAS', 'PARTICIPAÇÃO %']],
    body: tableRows,
    styles: {
      font: 'helvetica',
      fontSize: tableStyles.fontSize,
      cellPadding: tableStyles.cellPadding,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
      valign: 'middle',
      overflow: 'ellipsize',
    },
    headStyles: {
      fillColor: primaryRgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: tableStyles.headFontSize,
      halign: 'left',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: 86, fontStyle: 'bold' },
      2: { cellWidth: 44, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 36, halign: 'center' },
    },
    margin: { top: 12, right: 14, bottom: 12, left: 14 },
    pageBreak: 'avoid',
  });

  applySinglePageFooter(doc, company);

  const safeDate = dataFormatada.replace(/\//g, '-');
  doc.save(`Relatorio_Vendas_Vendedores_${safeDate}.pdf`);
}

/**
 * 5. Generate Daily List (Lista do Dia) PDF - Strictly 1 Single A4 Page
 */
export function generateDailyListPdf(
  dateString: string,
  passengers: Passenger[],
  drivers: Driver[],
  customCompanyConfig?: CompanyConfig
): void {
  const company = customCompanyConfig || getStoredCompanyConfig();
  const primaryRgb = hexToRgb(company.primaryColor, [6, 95, 70]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const dataEmissao = now.toLocaleDateString('pt-BR');
  const horaEmissao = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Format the target date (dateString is YYYY-MM-DD or similar)
  let displayDate = dateString;
  if (dateString.includes('-')) {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      displayDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }

  const subtitle = `Lista do Dia - Operação de Viagem (${displayDate})`;

  // Driver map
  const driverMap = new Map<string, string>();
  drivers.forEach((d) => driverMap.set(d.id, d.fullName));

  // Page 1 Header (Height 22mm)
  drawPageOneHeader(doc, subtitle, dataEmissao, horaEmissao, company);

  // Summary Card Box (Compact box from Y=24 to Y=41, height 17mm)
  const boxY = 24;
  const boxH = 17;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, boxY, 182, boxH, 2, 2, 'FD');

  // Row 1 (Y=29.5)
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Data de Operação:', 18, 29.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text(displayDate, 48, 29.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Total de Clientes no Dia:', 115, 29.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${passengers.length} cliente(s) / passageiro(s)`, 152, 29.5);

  // Row 2 (Y=36.5)
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Operação:', 18, 36.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('EMBARQUE DIÁRIO DE PASSAGEIROS', 48, 36.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Situação:', 115, 36.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(6, 95, 70);
  doc.text('CONFIRMADO (FOLHA ÚNICA)', 152, 36.5);

  // Build table rows
  const tableRows = passengers.map((p, index) => {
    const driverName = p.driverId ? driverMap.get(p.driverId) || 'NÃO VINCULADO' : 'A DEFINIR';
    return [
      (index + 1).toString(),
      (p.fullName || '').toUpperCase(),
      (p.origin?.trim() || 'A DEFINIR').toUpperCase(),
      (p.destination?.trim() || 'A DEFINIR').toUpperCase(),
      (p.seller?.trim() || 'BALCÃO').toUpperCase(),
      driverName.toUpperCase(),
      '', // Check-in blank field
    ];
  });

  if (tableRows.length === 0) {
    tableRows.push(['-', 'NENHUM PASSAGEIRO AGENDADO PARA ESTE DIA', '-', '-', '-', '-', '']);
  }

  // Dynamic table sizing based on passenger count to strictly guarantee single A4 page
  const tableStyles = getSinglePageTableStyles(tableRows.length, 241);

  // Start table at Y=43 (clearance of 2mm below box)
  autoTable(doc, {
    startY: 43,
    head: [['Nº', 'NOME DO PASSAGEIRO', 'ORIGEM', 'DESTINO', 'VENDEDOR', 'MOTORISTA', 'CHECK-IN']],
    body: tableRows,
    styles: {
      font: 'helvetica',
      fontSize: tableStyles.fontSize,
      cellPadding: tableStyles.cellPadding,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
      valign: 'middle',
      overflow: 'ellipsize',
    },
    headStyles: {
      fillColor: primaryRgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: tableStyles.headFontSize,
      halign: 'left',
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 50, fontStyle: 'bold' },
      2: { cellWidth: 26 },
      3: { cellWidth: 26 },
      4: { cellWidth: 24 },
      5: { cellWidth: 28 },
      6: { cellWidth: 19, halign: 'center' },
    },
    margin: { top: 12, right: 14, bottom: 12, left: 14 },
    pageBreak: 'avoid',
  });

  applySinglePageFooter(doc, company);

  const safeFileDate = displayDate.replace(/\//g, '-');
  doc.save(`Lista_do_Dia_${safeFileDate}.pdf`);
}

/**
 * 6. Generate Comprehensive Management and Financial Report PDF
 */
export function generateComprehensiveReportsPdf(
  periodLabel: string,
  financialSummary: {
    totalRevenue: number;
    totalDriverPayout: number;
    totalSellerCommission: number;
    netOperatingResult: number;
    totalTickets: number;
    totalTrips: number;
    totalExpenses?: number;
    netRealProfit?: number;
  },
  sellerFinancialStats: {
    seller: string;
    tickets: number;
    commissionPercent: number;
    grossRevenue: number;
    commissionAmount: number;
  }[],
  driverFinancialStats: {
    driverName: string;
    tripsCount: number;
    passengersCount: number;
    totalPayout: number;
  }[],
  topDestinations: {
    destination: string;
    count: number;
    percentage: number;
    ticketPrice?: number;
    totalRevenue?: number;
  }[],
  topClients: {
    name: string;
    tripsCount: number;
    favoriteDestination: string;
    favoriteSeller: string;
  }[],
  customCompanyConfig?: CompanyConfig
): void {
  const company = customCompanyConfig || getStoredCompanyConfig();
  const primaryRgb = hexToRgb(company.primaryColor, [6, 95, 70]);
  const secondaryRgb = hexToRgb(company.secondaryColor, [4, 120, 87]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const dataEmissao = new Date().toLocaleDateString('pt-BR');
  const horaEmissao = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const subtitle = `RELATÓRIO GERAL E FINANCEIRO - ${periodLabel.toUpperCase()}`;

  drawPageOneHeader(doc, subtitle, dataEmissao, horaEmissao, company);

  // Financial summary box (Y=38 to Y=72)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 38, 182, 32, 2.5, 2.5, 'FD');

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`BALANÇO OPERACIONAL, DESPESAS E LUCRO REAL (${periodLabel.toUpperCase()})`, 20, 43.5);

  // Row 1 metrics
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Passagens Vendidas:', 20, 48.5);
  doc.text('Viagens Realizadas:', 75, 48.5);
  doc.text('Faturamento Bruto (+):', 135, 48.5);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${financialSummary.totalTickets} passagens`, 20, 53);
  doc.text(`${financialSummary.totalTrips} viagens`, 75, 53);
  doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
  doc.text(`R$ ${financialSummary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 135, 53);

  // Row 2 metrics: Deductions
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Comissões Vendedores (-):', 20, 57.5);
  doc.text('Repasse Motoristas (-):', 75, 57.5);
  doc.text('Despesas Operacionais (-):', 135, 57.5);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9); // amber 700
  doc.text(`R$ ${financialSummary.totalSellerCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20, 61.5);
  doc.setTextColor(30, 64, 175); // blue 700
  doc.text(`R$ ${financialSummary.totalDriverPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 75, 61.5);
  doc.setTextColor(225, 29, 72); // rose 600
  const expVal = financialSummary.totalExpenses || 0;
  doc.text(`R$ ${expVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 135, 61.5);

  // Row 3: Net Real Profit
  const netProfitVal = financialSummary.netRealProfit !== undefined ? financialSummary.netRealProfit : financialSummary.netOperatingResult;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('LUCRO LÍQUIDO REAL APURADO (=):', 20, 67);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(netProfitVal >= 0 ? primaryRgb[0] : 225, netProfitVal >= 0 ? primaryRgb[1] : 29, netProfitVal >= 0 ? primaryRgb[2] : 72);
  doc.text(`R$ ${netProfitVal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 135, 67);

  // 1. Table: Faturamento e Comissões dos Vendedores
  const sellerRows = sellerFinancialStats.length > 0
    ? sellerFinancialStats.map((s, idx) => [
        (idx + 1).toString(),
        s.seller.toUpperCase(),
        `${s.tickets} ${s.tickets === 1 ? 'passagem' : 'passagens'}`,
        `${s.commissionPercent}%`,
        `R$ ${s.grossRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `R$ ${s.commissionAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ])
    : [['-', 'NENHUMA VENDA REGISTRADA NO PERÍODO', '-', '-', '-', '-']];

  autoTable(doc, {
    startY: 68,
    head: [['Nº', 'VENDEDOR', 'PASSAGENS', 'COMISSÃO %', 'FATURAMENTO GERADO', 'COMISSÃO A RECEBER']],
    body: sellerRows,
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: primaryRgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 46, fontStyle: 'bold' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 38, halign: 'right' },
      5: { cellWidth: 40, halign: 'right', fontStyle: 'bold', textColor: primaryRgb },
    },
    margin: { top: 18, right: 14, bottom: 22, left: 14 },
    showHead: 'everyPage',
  });

  // 2. Table: Faturamento e Viagens por Motorista
  const finalY1 = (doc as any).lastAutoTable?.finalY || 110;
  const driverRows = driverFinancialStats.length > 0
    ? driverFinancialStats.map((d, idx) => [
        (idx + 1).toString(),
        d.driverName.toUpperCase(),
        `${d.tripsCount} ${d.tripsCount === 1 ? 'viagem' : 'viagens'}`,
        `${d.passengersCount} passageiros`,
        `R$ ${d.totalPayout.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ])
    : [['-', 'NENHUMA VIAGEM REGISTRADA NO PERÍODO', '-', '-', '-']];

  autoTable(doc, {
    startY: finalY1 + 8,
    head: [['Nº', 'MOTORISTA', 'VIAGENS REALIZADAS', 'PASSAGEIROS TRANSPORTADOS', 'FATURAMENTO DO MOTORISTA']],
    body: driverRows,
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 54, fontStyle: 'bold' },
      2: { cellWidth: 36, halign: 'center' },
      3: { cellWidth: 42, halign: 'center' },
      4: { cellWidth: 40, halign: 'right', fontStyle: 'bold', textColor: [30, 64, 175] },
    },
    margin: { top: 18, right: 14, bottom: 22, left: 14 },
    showHead: 'everyPage',
  });

  // 3. Table: Destinos Mais Procurados e Faturamento por Destino
  const finalY2 = (doc as any).lastAutoTable?.finalY || 160;
  const destinationRows = topDestinations.length > 0
    ? topDestinations.map((dst, idx) => [
        `#${idx + 1}`,
        dst.destination.toUpperCase(),
        `${dst.count} passageiros`,
        dst.ticketPrice !== undefined ? `R$ ${dst.ticketPrice.toFixed(2)}` : '-',
        dst.totalRevenue !== undefined
          ? `R$ ${dst.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : '-',
        `${dst.percentage.toFixed(1)}%`,
      ])
    : [['-', 'NENHUM DESTINO REGISTRADO', '-', '-', '-', '-']];

  autoTable(doc, {
    startY: finalY2 + 8,
    head: [['POSIÇÃO', 'DESTINO', 'PASSAGEIROS', 'TARIFA', 'TOTAL FATURADO', 'PROPORÇÃO %']],
    body: destinationRows,
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [180, 83, 9], // amber 700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: 50, fontStyle: 'bold' },
      2: { cellWidth: 32, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 34, halign: 'right', fontStyle: 'bold', textColor: [6, 95, 70] },
      5: { cellWidth: 24, halign: 'center' },
    },
    margin: { top: 18, right: 14, bottom: 22, left: 14 },
    showHead: 'everyPage',
  });

  // 4. Table: Clientes Que Mais Viajam (Top Passageiros)
  const finalY3 = (doc as any).lastAutoTable?.finalY || 200;
  const clientRows = topClients.length > 0
    ? topClients.map((c, idx) => [
        `#${idx + 1}`,
        c.name.toUpperCase(),
        `${c.tripsCount} ${c.tripsCount === 1 ? 'viagem' : 'viagens'}`,
        c.favoriteDestination.toUpperCase(),
        c.favoriteSeller.toUpperCase(),
      ])
    : [['-', 'NENHUM REGISTRO DE VIAGENS NO PERÍODO', '-', '-', '-']];

  autoTable(doc, {
    startY: finalY3 + 8,
    head: [['RANK', 'CLIENTE FREQUENTE (VIP)', 'VIAGENS FEITAS', 'DESTINO PRINCIPAL', 'VENDEDOR HABITUAL']],
    body: clientRows,
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: { top: 2.5, right: 2, bottom: 2.5, left: 2 },
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: secondaryRgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: 60, fontStyle: 'bold' },
      2: { cellWidth: 32, halign: 'center' },
      3: { cellWidth: 40 },
      4: { cellWidth: 34 },
    },
    margin: { top: 18, right: 14, bottom: 22, left: 14 },
    showHead: 'everyPage',
  });

  applyFootersAndHeaders(doc, subtitle, dataEmissao, horaEmissao, company);

  const safePeriod = periodLabel.replace(/[\/\s]/g, '_');
  const safeComp = company.companyName.replace(/[\/\s]/g, '_');
  doc.save(`Relatorio_Geral_${safeComp}_${safePeriod}.pdf`);
}
