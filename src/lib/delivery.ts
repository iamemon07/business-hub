/**
 * Adds N working days to a date, skipping configured weekend days
 * (0 = Sunday … 6 = Saturday). Default weekend for Bangladesh is Friday.
 */
export function addWorkingDays(start: Date, days: number, weekendDays: number[] = [5]) {
  const d = new Date(start);
  let added = 0;
  // Guard against a misconfigured "every day is weekend" setting.
  const safeWeekend = weekendDays.length >= 7 ? [] : weekendDays;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (!safeWeekend.includes(d.getDay())) added++;
  }
  return d;
}

export function estimateDelivery(orderDate: Date, minDays: number, maxDays: number, weekendDays: number[]) {
  return {
    from: addWorkingDays(orderDate, minDays, weekendDays),
    to: addWorkingDays(orderDate, Math.max(minDays, maxDays), weekendDays),
  };
}
