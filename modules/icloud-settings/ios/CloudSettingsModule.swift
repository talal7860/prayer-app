import ExpoModulesCore

/// A copy of the settings in iCloud key-value storage (`NSUbiquitousKeyValueStore`), so they come
/// back after deleting and reinstalling the app, or on a new iPhone with the same Apple ID.
/// Needs the `com.apple.developer.ubiquity-kvstore-identifier` entitlement (app.json). Without it,
/// or signed out of iCloud, the store still works but stays on this device.
public class CloudSettingsModule: Module {
  private var observer: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("CloudSettings")

    // Values written on another device, or downloaded after a fresh install (iCloud's first sync
    // often finishes after launch).
    Events("onChange")

    OnCreate {
      NSUbiquitousKeyValueStore.default.synchronize()
    }

    Function("get") { (key: String) -> String? in
      NSUbiquitousKeyValueStore.default.string(forKey: key)
    }

    Function("set") { (key: String, value: String) in
      let store = NSUbiquitousKeyValueStore.default
      guard store.string(forKey: key) != value else { return }
      store.set(value, forKey: key)
      store.synchronize()
    }

    OnStartObserving { [weak self] in
      guard let self else { return }
      self.observer = NotificationCenter.default.addObserver(
        forName: NSUbiquitousKeyValueStore.didChangeExternallyNotification,
        object: NSUbiquitousKeyValueStore.default,
        queue: .main
      ) { [weak self] note in
        let keys = note.userInfo?[NSUbiquitousKeyValueStoreChangedKeysKey] as? [String] ?? []
        self?.sendEvent("onChange", ["keys": keys])
      }
    }

    OnStopObserving { [weak self] in
      if let self, let observer = self.observer {
        NotificationCenter.default.removeObserver(observer)
        self.observer = nil
      }
    }
  }
}
