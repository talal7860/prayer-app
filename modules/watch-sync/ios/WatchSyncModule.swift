import ExpoModulesCore
import WatchConnectivity

/// Sends the phone's settings to the Apple Watch app (#35). `updateApplicationContext` keeps
/// only the latest value and delivers it when the watch app next runs, which is what settings need.
/// They're also saved in the App Group, where the Siri intents read them (SiriIntents.swift).
public class WatchSyncModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WatchSync")

    OnCreate {
      WatchLink.shared.activate()
    }

    Function("send") { (json: String) in
      // Same suite and key as WatchStore (targets/_shared/PrayerCore.swift), which this pod can't see.
      UserDefaults(suiteName: "group.com.conelabs.adhanapp")?.set(json, forKey: "watchSettings")
      WatchLink.shared.send(json)
    }
  }
}

final class WatchLink: NSObject, WCSessionDelegate {
  static let shared = WatchLink()
  /// The latest settings, kept so they can be sent again when the session activates or the watch
  /// app gets installed later (a new watch, or the watch app installed after the phone was set up).
  private var latest: String?

  func activate() {
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  func send(_ json: String) {
    latest = json
    flush()
  }

  private func flush() {
    guard WCSession.isSupported(), let json = latest else { return }
    let session = WCSession.default
    guard session.activationState == .activated, session.isPaired, session.isWatchAppInstalled
    else { return }
    try? session.updateApplicationContext(["settings": json])
  }

  func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {
    flush()
  }

  /// Paired, unpaired, or the watch app installed or removed.
  func sessionWatchStateDidChange(_ session: WCSession) {
    flush()
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  func sessionDidDeactivate(_ session: WCSession) {
    // A different watch was paired: start a new session for it.
    WCSession.default.activate()
  }
}
