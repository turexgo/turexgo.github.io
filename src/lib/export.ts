import * as XLSX from 'xlsx';
import { MonthSchedule } from './schedule';
import { format } from 'date-fns';

const romanianDaysShort = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];

export function exportToExcel(name: string, schedule: MonthSchedule[], monthsCount: number) {
  const monthsToExport = schedule.slice(0, monthsCount);

  const rows: any[] = [];

  rows.push([`Grafic Ture - ${name || 'Angajat'}`]);
  rows.push([`Generat la: ${format(new Date(), 'dd.MM.yyyy')}`]);
  rows.push([`Creat de: Pavel Dordea`]);
  rows.push([]);

  monthsToExport.forEach((monthData) => {
    const monthLabel = format(monthData.monthDate, 'MMMM yyyy');

    rows.push([`── ${monthLabel.toUpperCase()} ──`]);
    rows.push([
      "Data",
      "Ziua",
      "Tip",
      "Interval",
      "Pauza 1",
      "Pauza 2",
      "Pauza 3",
      "Ore/zi",
    ]);

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
    });

    rows.push([
      '', '', '', '', '', '',
      'TOTAL ORE LUNA:',
      monthData.totalHours,
    ]);

    rows.push([]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Grafic Ture");

  ws['!cols'] = [
    { wch: 12 },
    { wch: 6 },
    { wch: 8 },
    { wch: 13 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
  ];

  const firstMonth = monthsToExport[0].monthDate;
  const fileName = `Grafic_${name.replace(/\s+/g, '_') || 'Angajat'}_${format(firstMonth, 'MM_yyyy')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
