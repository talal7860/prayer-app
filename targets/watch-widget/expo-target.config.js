/** Watch face complications (#35). Read the settings the watch app saved in the App Group. */
/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: 'watch-widget',
  name: 'AdhanComplications',
  displayName: 'Adhan',
  bundleIdentifier: '.watchkitapp.complications',
  deploymentTarget: '10.0',
  frameworks: ['SwiftUI', 'WidgetKit'],
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
