function daysAgo(days, now) {
  let date = new Date(now || new Date());
  date.setTime(date.getTime() - 24 * 60 * 60 * 1000 * days);
  return date;
}

function formatDate(date) {
  return date ? date.toISOString() : null;
}

module.exports = {
  daysAgo,
  formatDate
};
