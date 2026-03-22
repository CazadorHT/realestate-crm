export function combineDateTime(date: string, time: string) {
  const dateTime = new Date(`${date}T${time}:00`);
  return dateTime.toISOString();
}
