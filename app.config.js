// app.json holds the config. The Apple team id is kept out of the (public) repo: it comes from
// EXPO_APPLE_TEAM_ID, set in .env.release / ~/.config/adhan-app/env locally, in the
// APPLE_TEAM_ID GitHub secret for CI, and as an EAS environment variable for cloud builds.
// Prebuild uses it to sign the app, widget and watch targets.
module.exports = ({config}) => ({
  ...config,
  ios: {...config.ios, appleTeamId: process.env.EXPO_APPLE_TEAM_ID},
});
