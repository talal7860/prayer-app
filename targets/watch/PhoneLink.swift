import Foundation
import WatchConnectivity
import WidgetKit

/// Receives the phone's settings (app/lib/watch.ts → modules/watch-sync) and keeps them in the
/// App Group, where the complications read them too.
final class PhoneLink: NSObject, ObservableObject, WCSessionDelegate {
  @Published private(set) var settings: WatchSettings? = WatchStore.load()

  override init() {
    super.init()
    if WCSession.isSupported() {
      WCSession.default.delegate = self
      WCSession.default.activate()
    }
  }

  private func receive(_ context: [String: Any]) {
    guard let json = context["settings"] as? String else { return }
    WatchStore.save(json)
    DispatchQueue.main.async {
      self.settings = WatchStore.load()
      WidgetCenter.shared.reloadAllTimelines()
    }
  }

  func session(_ session: WCSession, activationDidCompleteWith state: WCSessionActivationState, error: Error?) {
    // The phone may have sent settings while the watch app wasn't running.
    receive(session.receivedApplicationContext)
  }

  func session(_ session: WCSession, didReceiveApplicationContext context: [String: Any]) {
    receive(context)
  }
}
