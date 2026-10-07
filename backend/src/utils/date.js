const pad = (value) => String(value).padStart(2, '0');

function formatDateTime(value, includeSeconds = true) {
  if (!value) return '';

  const date = new Date(value);
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  return includeSeconds
    ? `${datePart} ${timePart}:${pad(date.getSeconds())}`
    : `${datePart} ${timePart}`;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

module.exports = { formatDateTime, startOfToday };
