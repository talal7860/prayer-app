Pod::Spec.new do |s|
  s.name           = 'CloudSettings'
  s.version        = '1.0.0'
  s.summary        = 'Keeps a copy of the app settings in iCloud key-value storage.'
  s.description    = s.summary
  s.author         = ''
  s.homepage       = 'https://github.com/talal7860/prayer-app'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files   = '**/*.{h,m,swift}'
end
