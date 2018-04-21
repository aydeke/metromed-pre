const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const month = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function getDays() {
  const days = [];
  const delta = 24 * 60 * 60 * 1000; // 24h * 60m * 60s * 1000ms
  let date = new Date();
  while (days.length < 5) {
    const day = date.getDay();
    if (day !== 0 && day !== 6) {
      const d = `${weekDays[day]}, ${month[date.getMonth()]} ${date.getDate()}`;
      days.push(d);
    }
    const timestamp = date.getTime();
    date = new Date(timestamp + delta);
  }
  return days;
}
