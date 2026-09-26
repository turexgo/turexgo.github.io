import * as XLSX from 'xlsx-js-style';
import { MonthSchedule } from './schedule';
import { format } from 'date-fns';
import { deliverFile } from './download';

const romanianDaysShort = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];

const COLOR_NAVY = '0A0F1E';
const COLOR_GREEN_BG = 'C6EFCE';
const COLOR_GREEN_TEXT = '0F6E56';
const COLOR_RED_BG = 'FFC7CE';
const COLOR_RED_TEXT = '9C1F1F';
const COLOR_HEADER_BG = '111827';
const COLOR_WHITE = 'FFFFFF';
const COLOR_GRAY_BG = 'E5E7EB';

const thinBorder = { style: 'thin', color: { rgb: 'D1D5DB' } };
const cellBorder = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };

function styleCell(ws: XLSX.WorkSheet, addr: string, style: any) {
  if (!ws[addr]) ws[addr] = { t: 's', v: '' };
  ws[addr].s = style;
}

export function exportToExcel(name: string, schedule: MonthSchedule[], monthsCount: number) {
  const monthsToExport = schedule.slice(0, monthsCount);

  const rows: any[] = [];
  const merges: XLSX.Range[] = [];
  const styledRows: { row: number; type: 'title' | 'meta' | 'monthHeader' | 'colHeader' | 'total' }[] = [];
  const workRowIndices: number[] = [];
  const offRowIndices: number[] = [];

  rows.push([`Grafic Ture - ${name || 'Angajat'}`]);
  styledRows.push({ row: rows.length - 1, type: 'title' });
  merges.push({ s: { r: rows.length - 1, c: 0 }, e: { r: rows.length - 1, c: 7 } });

  rows.push([`Generat la: ${format(new Date(), 'dd.MM.yyyy')}  ·  Creat de: Pavel Dordea`]);
  styledRows.push({ row: rows.length - 1, type: 'meta' });
  merges.push({ s: { r: rows.length - 1, c: 0 }, e: { r: rows.length - 1, c: 7 } });

  rows.push([]);

  monthsToExport.forEach((monthData) => {
    const monthLabel = format(monthData.monthDate, 'MMMM yyyy');

    rows.push([monthLabel.toUpperCase()]);
    styledRows.push({ row: rows.length - 1, type: 'monthHeader' });
    merges.push({ s: { r: rows.length - 1, c: 0 }, e: { r: rows.length - 1, c: 7 } });

    rows.push([
      "Data", "Ziua", "Tip", "Interval", "Pauza 1", "Pauza 2", "Pauza 3", "Ore/zi",
    ]);
    styledRows.push({ row: rows.length - 1, type: 'colHeader' });

    monthData.days.forEach((day) => {
      const isWork = day.type === 'work';
      const dayOfWeek = romanianDaysShort[day.date.getDay()];

      rows.push([
        format(day.date, 'dd.MM.yyyy'),
        dayOfWeek,
        isWork ? 'Lucru' : 'Liber',
        isWork ? day.workHours : '—',
        isWork && day.breaks?.[0] ? day.breaks[0].startTime : '—',
        isWork && day.breaks?.[1] ? day.breaks[1].startTime : '—',
        isWork && day.breaks?.[2] ? day.breaks[2].startTime : '—',
        isWork ? (day.hoursWorked ?? '—') : '—',
      ]);

      if (isWork) workRowIndices.push(rows.length - 1);
      else offRowIndices.push(rows.length - 1);
    });

    rows.push([
      '', '', '', '', '', '',
      'TOTAL ORE LUNA:',
      monthData.totalHours,
    ]);
    styledRows.push({ row: rows.length - 1, type: 'total' });

    rows.push([]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Grafic Ture");

  ws['!cols'] = [
    { wch: 12 }, { wch: 6 }, { wch: 8 }, { wch: 13 },
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 10 },
  ];
  ws['!merges'] = merges;

  styledRows.filter(r => r.type === 'title').forEach(({ row }) => {
    styleCell(ws, XLSX.utils.encode_cell({ r: row, c: 0 }), {
      font: { bold: true, sz: 14, color: { rgb: COLOR_NAVY } },
    });
  });

  styledRows.filter(r => r.type === 'meta').forEach(({ row }) => {
    styleCell(ws, XLSX.utils.encode_cell({ r: row, c: 0 }), {
      font: { italic: true, sz: 10, color: { rgb: '6B7280' } },
    });
  });

  styledRows.filter(r => r.type === 'monthHeader').forEach(({ row }) => {
    styleCell(ws, XLSX.utils.encode_cell({ r: row, c: 0 }), {
      font: { bold: true, sz: 12, color: { rgb: COLOR_WHITE } },
      fill: { fgColor: { rgb: COLOR_HEADER_BG } },
      alignment: { horizontal: 'left', vertical: 'center' },
    });
  });

  styledRows.filter(r => r.type === 'colHeader').forEach(({ row }) => {
    for (let c = 0; c < 8; c++) {
      styleCell(ws, XLSX.utils.encode_cell({ r: row, c }), {
        font: { bold: true, sz: 10, color: { rgb: COLOR_WHITE } },
        fill: { fgColor: { rgb: '374151' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: cellBorder,
      });
    }
  });

  const colorRow = (row: number, bg: string, text: string) => {
    for (let c = 0; c < 8; c++) {
      const addr = XLSX.utils.encode_cell({ r: row, c });
      styleCell(ws, addr, {
        fill: { fgColor: { rgb: bg } },
        font: { color: { rgb: text }, bold: c === 2 },
        alignment: { horizontal: c <= 1 ? 'left' : 'center', vertical: 'center' },
        border: cellBorder,
      });
    }
  };
  workRowIndices.forEach(row => colorRow(row, COLOR_GREEN_BG, COLOR_GREEN_TEXT));
  offRowIndices.forEach(row => colorRow(row, COLOR_RED_BG, COLOR_RED_TEXT));

  styledRows.filter(r => r.type === 'total').forEach(({ row }) => {
    for (let c = 6; c <= 7; c++) {
      styleCell(ws, XLSX.utils.encode_cell({ r: row, c }), {
        font: { bold: true, sz: 11, color: { rgb: COLOR_NAVY } },
        fill: { fgColor: { rgb: COLOR_GRAY_BG } },
        alignment: { horizontal: c === 6 ? 'right' : 'center' },
        border: cellBorder,
      });
    }
  });

  const firstMonth = monthsToExport[0].monthDate;
  const fileName = `Grafic_${name.replace(/\s+/g, '_') || 'Angajat'}_${format(firstMonth, 'MM_yyyy')}.xlsx`;

  const wbout: ArrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  deliverFile(blob, fileName, 'document');
}
