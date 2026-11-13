import ExpoModulesCore
import UIKit

/// In a resizable iPadOS 26 window the close / minimise / full-screen controls sit in the window's
/// top leading corner, over the app. They aren't part of the safe area React Native sees, so this
/// reads UIKit's corner-adapted safe area and returns how much more it insets each side.
public class WindowControlsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("WindowControls")

    AsyncFunction("insets") { () -> [String: Double] in
      let none: [String: Double] = ["leading": 0, "trailing": 0]
      guard #available(iOS 26.0, *) else { return none }
      let window = UIApplication.shared.connectedScenes
        .compactMap { ($0 as? UIWindowScene)?.keyWindow }
        .first
      guard let view = window?.rootViewController?.view else { return none }
      let plain = view.directionalEdgeInsets(for: .safeArea())
      let adapted = view.directionalEdgeInsets(for: .safeArea(cornerAdaptation: .horizontal))
      return [
        "leading": Double(max(0, adapted.leading - plain.leading)),
        "trailing": Double(max(0, adapted.trailing - plain.trailing)),
      ]
    }.runOnQueue(.main)
  }
}
