// The tests use Calgary, and the app shows times in the phone's time zone. Pin Jest to
// Calgary's zone so results don't depend on the machine (CI runs in UTC).
module.exports = () => {
  process.env.TZ = 'America/Edmonton';
};
