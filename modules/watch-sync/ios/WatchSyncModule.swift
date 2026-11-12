import ExpoModulesCore
import WatchConnectivity

/// Sends the phone's settings to the Apple Watch app (#35). `updateApplicationContext` keeps
/// only the latest value and delivers it when the watch app next runs, which is what settings need.
public class WatchSyncModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WatchSync")

    OnCreate {
      WatchLink.shared.activate()
    }

    Function("send") { (json: String) in
      WatchLink.shared.send(json)
    }
  }
}

final class WatchLink: NSObject, WCSessionDelegate {
  static let shared = WatchLink()
  private var pending: String?

  func activate() {
    guard WCSession.isSupported() else { return }
    WCSession.default.delegate = self
    WCSession.default.activate()
  }

  func send(_ json: String) {
    guard WCSession.isSupported() else { return }
    let session = WCSession.default
    guard session.activationState == .activated else {
      pending = json
      return
    }
    guard session.isPaired, session.isWatchAppInstalled else { return }
    try? session.updateApplicationContext(["settings": json])
  }

  func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {
    if state == .activated, let json = pending {
      pending = nil
      send(json)
    }
  }

  func sessionDidBecomeInactive(_ session: WCSession) {}

  func sessionDidDeactivate(_ session: WCSession) {
    // A different watch was paired: start a new session for it.
    WCSession.default.activate()
  }
}
