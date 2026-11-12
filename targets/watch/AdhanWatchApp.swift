import SwiftUI

@main
struct AdhanWatchApp: App {
  @StateObject private var phone = PhoneLink()

  var body: some Scene {
    WindowGroup {
      ContentView()
        .environmentObject(phone)
    }
  }
}
