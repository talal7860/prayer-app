import Foundation
import SwiftUI

// Shared by the watch app and its complications (#35). The phone sends its settings (and the
// labels in the phone's language) over WatchConnectivity; the watch calculates the times itself
// with the same adhan library the phone uses, so the complications work without the phone.

enum WatchStore {
  static let appGroup = "group.com.conelabs.adhanapp"
  static let settingsKey = "watchSettings"

  static var defaults: UserDefaults { UserDefaults(suiteName: appGroup) ?? .standard }

  static func save(_ json: String) {
    defaults.set(json, forKey: settingsKey)
  }

  static func load() -> WatchSettings? {
    guard let json = defaults.string(forKey: settingsKey), let data = json.data(using: .utf8) else {
      return nil
    }
    return try? JSONDecoder().decode(WatchSettings.self, from: data)
  }
}

/// The phone's settings, as `app/lib/watch.ts` sends them.
struct WatchSettings: Codable {
  struct Location: Codable {
    let lat: Double
    let lng: Double
  }

  let location: Location
  let city: String?
  let calculationMethod: String
  let asr: String
  let highLats: String?
  let adjustments: [String: Int]?
  let timeFormat: String?
  /// Prayer names and UI strings in the phone's language.
  let labels: [String: String]?

  func label(_ key: String, _ fallback: String) -> String {
    labels?[key] ?? fallback
  }

  /// Same mapping as the phone's `app/lib/prayerTimes.ts`.
  var parameters: CalculationParameters {
    var params: CalculationParameters
    switch calculationMethod {
    case "ISNA": params = CalculationMethod.northAmerica.params
    case "Egypt": params = CalculationMethod.egyptian.params
    case "Makkah": params = CalculationMethod.ummAlQura.params
    case "Karachi": params = CalculationMethod.karachi.params
    case "Tehran": params = CalculationMethod.tehran.params
    case "Jafari":
      params = CalculationMethod.other.params
      params.fajrAngle = 16
      params.ishaAngle = 14
      params.maghribAngle = 4
    default: params = CalculationMethod.muslimWorldLeague.params
    }
    params.madhab = asr == "Hanafi" ? .hanafi : .shafi
    switch highLats {
    case "AngleBased": params.highLatitudeRule = .twilightAngle
    case "OneSeventh": params.highLatitudeRule = .seventhOfTheNight
    default: params.highLatitudeRule = .middleOfTheNight
    }
    params.polarCircleResolution = .aqrabBalad
    let adj = adjustments ?? [:]
    params.adjustments = PrayerAdjustments(
      fajr: adj["fajr"] ?? 0, sunrise: adj["sunrise"] ?? 0, dhuhr: adj["dhuhr"] ?? 0,
      asr: adj["asr"] ?? 0, maghrib: adj["maghrib"] ?? 0, isha: adj["isha"] ?? 0)
    return params
  }

  func times(on date: Date) -> PrayerTimes? {
    let day = Calendar.current.dateComponents([.year, .month, .day], from: date)
    return PrayerTimes(
      coordinates: Coordinates(latitude: location.lat, longitude: location.lng),
      date: day, calculationParameters: parameters)
  }

  func format(_ date: Date, withPeriod: Bool = true) -> String {
    let f = DateFormatter()
    f.locale = Locale.current
    f.dateFormat = timeFormat == "24h" ? "HH:mm" : (withPeriod ? "h:mm a" : "h:mm")
    return f.string(from: date)
  }
}

struct PrayerItem: Identifiable {
  let key: String
  let name: String
  let time: Date
  var id: String { key + "\(time.timeIntervalSince1970)" }
}

/// What to show at one moment: the next prayer, the progress since the last one, the day's list
/// and where everything sits on the Fajr → Isha arc.
struct PrayerSnapshot {
  let city: String
  let next: PrayerItem
  let previous: Date
  /// The five prayers of the day the next prayer is on (after Isha, that's tomorrow).
  let prayers: [PrayerItem]
  /// 0 = Fajr, 1 = Isha, for the arc. `now` is clamped to it.
  let nowOnArc: Double
  let marks: [(t: Double, isNext: Bool, isPast: Bool)]
  let settings: WatchSettings

  /// Fraction of the way from the last prayer to the next.
  func progress(at date: Date) -> Double {
    let span = next.time.timeIntervalSince(previous)
    guard span > 0 else { return 0 }
    return min(1, max(0, date.timeIntervalSince(previous) / span))
  }

  static let listed = ["fajr", "dhuhr", "asr", "maghrib", "isha"]
  static let names = [
    "fajr": "Fajr", "sunrise": "Sunrise", "dhuhr": "Dhuhr", "asr": "Asr", "maghrib": "Maghrib",
    "isha": "Isha",
  ]

  static func make(_ settings: WatchSettings, at now: Date = Date()) -> PrayerSnapshot? {
    let cal = Calendar.current
    guard
      let yesterday = settings.times(on: cal.date(byAdding: .day, value: -1, to: now)!),
      let today = settings.times(on: now),
      let tomorrow = settings.times(on: cal.date(byAdding: .day, value: 1, to: now)!)
    else { return nil }

    func items(_ t: PrayerTimes) -> [PrayerItem] {
      let pairs: [(String, Date)] = [
        ("fajr", t.fajr), ("sunrise", t.sunrise), ("dhuhr", t.dhuhr), ("asr", t.asr),
        ("maghrib", t.maghrib), ("isha", t.isha),
      ]
      return pairs.map { key, time in
        var name = settings.label(key, names[key] ?? key)
        if key == "dhuhr", cal.component(.weekday, from: time) == 6 {
          name = settings.label("jumuah", "Jumu’ah")
        }
        return PrayerItem(key: key, name: name, time: time)
      }
    }

    let all = items(yesterday) + items(today) + items(tomorrow)
    guard let next = all.first(where: { $0.time > now }) else { return nil }
    let previous = all.last(where: { $0.time <= now })?.time ?? now.addingTimeInterval(-3600)

    // After Isha the next prayer is tomorrow's Fajr: list tomorrow's times then.
    let listDay = next.time > today.isha ? tomorrow : today
    let prayers = items(listDay).filter { listed.contains($0.key) }

    // The arc runs Fajr → Isha of the current prayer day (before Fajr, still yesterday's).
    let arcDay = now < today.fajr ? yesterday : today
    let span = arcDay.isha.timeIntervalSince(arcDay.fajr)
    func along(_ d: Date) -> Double { min(1, max(0, d.timeIntervalSince(arcDay.fajr) / span)) }
    let marks = items(arcDay).filter { listed.contains($0.key) }.map { p in
      (t: along(p.time), isNext: p.time == next.time, isPast: p.time <= now && p.time != next.time)
    }

    return PrayerSnapshot(
      city: settings.city?.components(separatedBy: ",").first ?? "",
      next: next, previous: previous, prayers: prayers, nowOnArc: along(now), marks: marks,
      settings: settings)
  }
}

enum Palette {
  static let gold = Color(red: 1, green: 0.824, blue: 0.478)  // #FFD27A
  static let accent = Color(red: 0.561, green: 0.69, blue: 1)  // #8FB0FF
  static let track = Color(red: 0.165, green: 0.192, blue: 0.314)  // #2A3150
  static let row = Color(red: 0.078, green: 0.094, blue: 0.149)  // #141826
  static let muted = Color(red: 0.643, green: 0.671, blue: 0.761)  // #A4ABC2
  static let past = Color(red: 0.549, green: 0.576, blue: 0.667)  // #8C93AA
  static let upcoming = Color(red: 0.435, green: 0.471, blue: 0.596)  // #6F7898
  static let soft = Color(red: 0.788, green: 0.808, blue: 0.867)  // #C9CEDD
}
