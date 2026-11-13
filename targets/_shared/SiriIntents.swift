// Siri, Shortcuts and Spotlight (#53): "When is Isha in Adhan Times?" and friends, answered
// without opening the app. Everything in targets/_shared is compiled into every target, so this is
// iOS only: the iPhone app is the one iOS target there (the watch targets are watchOS).
//
// The answers use the same maths as the app: PrayerCore.swift's WatchSettings (the method mapping
// of app/lib/prayerTimes.ts) on the vendored adhan-swift. The settings, with the answer templates
// in the phone's language, are the JSON the phone sends the watch (app/lib/watch.ts), which
// modules/watch-sync also saves in the App Group.
#if os(iOS)
import AppIntents
import Foundation

enum SiriAnswers {
  /// Before the app has saved its settings (never opened since this version).
  static var setUpFirst: String {
    switch Bundle.main.preferredLocalizations.first?.prefix(2) {
    case "ar": return "افتح أوقات الأذان مرة لتحديد موقعك."
    case "ur": return "اپنا مقام منتخب کرنے کے لیے ایک بار اذان ٹائمز کھولیں۔"
    default: return "Open Adhan Times once to set your location."
    }
  }

  /// Yesterday's, today's and tomorrow's times, in order (Sunrise included).
  static func items(_ settings: WatchSettings, around now: Date) -> [PrayerItem] {
    let cal = Calendar.current
    return [-1, 0, 1].flatMap { offset -> [PrayerItem] in
      guard let day = cal.date(byAdding: .day, value: offset, to: now),
        let times = settings.times(on: day)
      else { return [] }
      return PrayerSnapshot.items(times, settings)
    }
  }

  /// "1 hour, 20 minutes", in the phone's language, rounded up to the minute.
  static func left(_ from: Date, _ to: Date) -> String {
    let minutes = max(1, Int((to.timeIntervalSince(from) / 60).rounded(.up)))
    let f = DateComponentsFormatter()
    f.allowedUnits = minutes >= 60 ? [.hour, .minute] : [.minute]
    f.unitsStyle = .full
    var cal = Calendar.current
    cal.locale = Locale.current
    f.calendar = cal
    return f.string(from: TimeInterval(minutes * 60)) ?? "\(minutes) min"
  }

  static func fill(_ template: String, _ args: String...) -> String {
    String(format: template, arguments: args)
  }

  /// Which prayer's time it is, and when it ends. Fajr ends at sunrise; from sunrise to Dhuhr
  /// there's no prayer, so it gives the next one.
  static func current(_ s: WatchSettings, at now: Date = Date()) -> String {
    let all = items(s, around: now)
    guard let last = all.last(where: { $0.time <= now }),
      let next = all.first(where: { $0.time > now })
    else { return setUpFirst }
    if last.key == "sunrise" {
      return fill(
        s.label("siriNone", "It's not a prayer time now. %1$@ is at %2$@, in %3$@."),
        next.name, s.format(next.time), left(now, next.time))
    }
    return fill(
      s.label("siriCurrent", "It's %1$@ time. It ends at %2$@, in %3$@."),
      last.name, s.format(next.time), left(now, next.time))
  }

  /// The next of the five prayers (not Sunrise).
  static func next(_ s: WatchSettings, at now: Date = Date()) -> String {
    guard let next = items(s, around: now).first(where: { $0.time > now && $0.key != "sunrise" })
    else { return setUpFirst }
    return fill(
      s.label("siriNext", "%1$@ is at %2$@, in %3$@."), next.name, s.format(next.time),
      left(now, next.time))
  }

  /// Today's time for that prayer, or tomorrow's if it has passed.
  static func time(of key: String, _ s: WatchSettings, at now: Date = Date()) -> String {
    let cal = Calendar.current
    guard let today = s.times(on: now),
      let tomorrowDay = cal.date(byAdding: .day, value: 1, to: now),
      let tomorrow = s.times(on: tomorrowDay),
      let todays = PrayerSnapshot.items(today, s).first(where: { $0.key == key }),
      let tomorrows = PrayerSnapshot.items(tomorrow, s).first(where: { $0.key == key })
    else { return setUpFirst }
    if todays.time > now {
      return fill(s.label("siriToday", "%1$@ is at %2$@ today."), todays.name, s.format(todays.time))
    }
    return fill(
      s.label("siriTomorrow", "%1$@ is at %2$@ tomorrow."), tomorrows.name,
      s.format(tomorrows.time))
  }

  /// Runs `answer` on the saved settings, or asks to open the app first.
  static func answer(_ answer: (WatchSettings) -> String) -> String {
    guard let settings = WatchStore.load() else { return setUpFirst }
    return answer(settings)
  }
}

@available(iOS 16.0, *)
enum PrayerParameter: String, AppEnum {
  case fajr, sunrise, dhuhr, asr, maghrib, isha

  static let typeDisplayRepresentation: TypeDisplayRepresentation = "Prayer"
  static let caseDisplayRepresentations: [PrayerParameter: DisplayRepresentation] = [
    .fajr: "Fajr",
    .sunrise: "Sunrise",
    .dhuhr: "Dhuhr",
    .asr: "Asr",
    .maghrib: "Maghrib",
    .isha: "Isha",
  ]
}

@available(iOS 16.0, *)
struct CurrentPrayerIntent: AppIntent {
  static let title: LocalizedStringResource = "Current prayer"
  static let description = IntentDescription("Which prayer's time it is now, and when it ends.")

  func perform() async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog {
    let text = SiriAnswers.answer { SiriAnswers.current($0) }
    return .result(value: text, dialog: IntentDialog(stringLiteral: text))
  }
}

@available(iOS 16.0, *)
struct NextPrayerIntent: AppIntent {
  static let title: LocalizedStringResource = "Next prayer"
  static let description = IntentDescription("The next prayer, its time and the time left.")

  func perform() async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog {
    let text = SiriAnswers.answer { SiriAnswers.next($0) }
    return .result(value: text, dialog: IntentDialog(stringLiteral: text))
  }
}

@available(iOS 16.0, *)
struct PrayerTimeIntent: AppIntent {
  static let title: LocalizedStringResource = "Prayer time"
  static let description = IntentDescription(
    "When a prayer is today, or tomorrow if it has passed.")

  @Parameter(title: "Prayer")
  var prayer: PrayerParameter

  static var parameterSummary: some ParameterSummary {
    Summary("When is \(\.$prayer)")
  }

  func perform() async throws -> some IntentResult & ReturnsValue<String> & ProvidesDialog {
    let key = prayer.rawValue
    let text = SiriAnswers.answer { SiriAnswers.time(of: key, $0) }
    return .result(value: text, dialog: IntentDialog(stringLiteral: text))
  }
}

/// Phrases that work with no setup. Apple requires the app's name in each one; Info.plist's
/// INAlternativeAppNames adds "Adhan" (app.json).
@available(iOS 16.0, *)
struct AdhanShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: CurrentPrayerIntent(),
      phrases: [
        "What prayer time is it in \(.applicationName)",
        "What prayer time is it now in \(.applicationName)",
        "Which prayer is it in \(.applicationName)",
        "Current prayer in \(.applicationName)",
        "\(.applicationName) current prayer",
      ],
      shortTitle: "Current prayer",
      systemImageName: "clock")
    AppShortcut(
      intent: NextPrayerIntent(),
      phrases: [
        "When is the next prayer in \(.applicationName)",
        "Next prayer in \(.applicationName)",
        "What's the next prayer in \(.applicationName)",
        "\(.applicationName) next prayer",
      ],
      shortTitle: "Next prayer",
      systemImageName: "bell")
    AppShortcut(
      intent: PrayerTimeIntent(),
      phrases: [
        "When is \(\.$prayer) in \(.applicationName)",
        "What time is \(\.$prayer) in \(.applicationName)",
        "\(\.$prayer) time in \(.applicationName)",
        "\(.applicationName) \(\.$prayer) time",
        "Prayer times in \(.applicationName)",
      ],
      shortTitle: "Prayer time",
      systemImageName: "sun.horizon")
  }
}
#endif
