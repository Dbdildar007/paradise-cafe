# ios/Podfile
use_frameworks! :linkage => :static if ENV['USE_FRAMEWORKS']
# Hermes is the default engine since RN 0.70; keep it explicit so CI can assert it.
:hermes_enabled => true
# Release: strip symbols & enable bitcode-free optimisation
post_install do |installer|
  react_native_post_install(installer, config[:reactNativePath], :mac_catalyst_enabled => false)
  installer.pods_project.build_configurations.each do |c|
    c.build_settings['GCC_GENERATE_DEBUGGING_SYMBOLS'] = 'NO' if c.name == 'Release'
    c.build_settings['STRIP_INSTALLED_PRODUCT'] = 'YES' if c.name == 'Release'
  end
end
