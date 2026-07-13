import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subWeeks,
} from "date-fns";

export type Period = "today" | "week" | "month" | "year" | "custom";

export type DateRange = { from: Date; to: Date };

export function getDateRange(period: Period, custom?: DateRange): DateRange {
  const now = new Date();
  switch (period) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "week":
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }),
        to: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case "month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "year":
      return { from: startOfYear(now), to: endOfYear(now) };
    case "custom":
      if (!custom) throw new Error("Custom range requires from/to");
      return { from: startOfDay(custom.from), to: endOfDay(custom.to) };
  }
}

/** Same-length range immediately preceding `range`, for period-over-period comparison. */
export function getPreviousRange(range: DateRange): DateRange {
  const lengthMs = range.to.getTime() - range.from.getTime();
  return {
    from: new Date(range.from.getTime() - lengthMs - 1),
    to: new Date(range.from.getTime() - 1),
  };
}

export function getPreviousWeekRange(): DateRange {
  const now = new Date();
  const lastWeek = subWeeks(now, 1);
  return {
    from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
    to: endOfWeek(lastWeek, { weekStartsOn: 1 }),
  };
}
