import {
  startOfWeek,
  addDays,
  differenceInDays,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfDay,
  getDate,
  getDay
} from "date-fns";

export type DayType = "work" | "off";
export type RotationType = "2/2" | "5/2";

export interface BreakInfo {
  startTime: string;
  duration: number;
}

export interface DayInfo {
  date: Date;
  type: DayType;
  workHours?: string;
  breaks?: BreakInfo[];
  hoursWorked?: number;
}

export interface MonthSchedule {
  monthDate: Date;
  days: DayInfo[];
  totalHours: number;
}

function addHoursToTime(time: string, hours: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + hours * 60;
  const th = Math.floor(total / 60) % 24;
  const tm = total % 60;
  return `${th.toString().padStart(2, "0")}:${tm.toString().padStart(2, "0")}`;
}

function getBaseDate22(lastWeekPattern: boolean[]): Date | null {
  const today = startOfDay(new Date());
  const thisMonday = startOfWeek(today, { weekStartsOn: 1 });
  const lastMonday = addDays(thisMonday, -7);

  let anchorIdx = -1;
  let isCycleDay1 = false;

  for (let i = 0; i < 7; i++) {
    if (lastWeekPattern[i]) {
      anchorIdx = i;
      if (i > 0 && lastWeekPattern[i - 1]) {
        isCycleDay1 = true;
      } else if (i < 6 && !lastWeekPattern[i + 1]) {
        isCycleDay1 = true;
      } else if (i === 6) {
        isCycleDay1 = false;
      }
      break;
    }
  }

  if (anchorIdx === -1) return null;

  const anchorDate = addDays(lastMonday, anchorIdx);
  const cycleOffset = isCycleDay1 ? 1 : 0;
  return addDays(anchorDate, -cycleOffset);
}

export function calculateBreaks(startTime: string): BreakInfo[] {
  const parseTime = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const startMins = parseTime(startTime);
  const fmt = (mins: number) => {
    const total = (mins + 24 * 60) % (24 * 60);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };
  return [
    { startTime: fmt(startMins + 150), duration: 30 },
    { startTime: fmt(startMins + 330), duration: 30 },
    { startTime: fmt(startMins + 510), duration: 30 },
  ];
}

export interface GenerateParams {
  rotationType: RotationType;
  lastWeekPattern?: boolean[];
  startTime: string;
  hoursPerDay?: 6 | 8;
  monthsCount?: number;
}

export function generateSchedule(params: GenerateParams): MonthSchedule[] {
  const {
    rotationType,
    lastWeekPattern = Array(7).fill(false),
    startTime,
    hoursPerDay = 8,
    monthsCount = 6,
  } = params;

  const today = startOfDay(new Date());
  const currentMonthStart = startOfMonth(today);
  const schedule: MonthSchedule[] = [];

  if (rotationType === "2/2") {
    const baseDate = getBaseDate22(lastWeekPattern) || today;
    const endTime = addHoursToTime(startTime, 12);
    const workHoursStr = `${startTime}–${endTime}`;
    const breaksCache = calculateBreaks(startTime);

    for (let m = 0; m < monthsCount; m++) {
      const monthDate = addMonths(currentMonthStart, m);
      const daysInMonth = getDate(endOfMonth(monthDate));
      let totalHours = 0;
      const days: DayInfo[] = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const date = addDays(monthDate, d - 1);
        const diff = differenceInDays(date, baseDate);
        const cycleIndex = ((diff % 4) + 4) % 4;
        const isWork = cycleIndex === 0 || cycleIndex === 1;

        if (isWork) totalHours += 12;

        days.push({
          date,
          type: isWork ? "work" : "off",
          workHours: isWork ? workHoursStr : undefined,
          breaks: isWork ? breaksCache : undefined,
          hoursWorked: isWork ? 12 : 0,
        });
      }

      schedule.push({ monthDate, days, totalHours });
    }
  } else {
    const endTime = addHoursToTime(startTime, hoursPerDay);
    const workHoursStr = `${startTime}–${endTime}`;

    for (let m = 0; m < monthsCount; m++) {
      const monthDate = addMonths(currentMonthStart, m);
      const daysInMonth = getDate(endOfMonth(monthDate));
      let totalHours = 0;
      const days: DayInfo[] = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const date = addDays(monthDate, d - 1);
        const dow = getDay(date);
        const isWork = dow >= 1 && dow <= 5;

        if (isWork) totalHours += hoursPerDay;

        days.push({
          date,
          type: isWork ? "work" : "off",
          workHours: isWork ? workHoursStr : undefined,
          hoursWorked: isWork ? hoursPerDay : 0,
        });
      }

      schedule.push({ monthDate, days, totalHours });
    }
  }

  return schedule;
}
