Pod::Spec.new do |s|
  s.name           = 'WatchSync'
  s.version        = '1.0.0'
  s.summary        = 'Sends the app settings to the Apple Watch app over WatchConnectivity.'
  s.description    = s.summary
  s.author         = ''
  s.homepage       = 'https://github.com/talal7860/prayer-app'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks     = 'WatchConnectivity'
  s.source_files   = '**/*.{h,m,swift}'
end
