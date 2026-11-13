import SwiftUI
import WidgetKit

@main
struct AdhanComplications: WidgetBundle {
  var body: some Widget {
    NextPrayerComplication()
  }
}

struct PrayerEntry: TimelineEntry {
  let date: Date
  let snap: PrayerSnapshot?
}

/// Entries at every prayer time and every 15 minutes for a day, so the ring and bar move and
/// the next prayer changes by itself.
struct PrayerProvider: TimelineProvider {
  func placeholder(in context: Context) -> PrayerEntry {
    PrayerEntry(date: .now, snap: WatchStore.load().flatMap { PrayerSnapshot.make($0) })
  }

  func getSnapshot(in context: Context, completion: @escaping (PrayerEntry) -> Void) {
    completion(placeholder(in: context))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<PrayerEntry>) -> Void) {
    guard let settings = WatchStore.load() else {
      completion(Timeline(entries: [PrayerEntry(date: .now, snap: nil)], policy: .never))
      return
    }
    let now = Date()
    var dates = stride(from: 0.0, through: 24 * 3600, by: 15 * 60).map { now.addingTimeInterval($0) }
    for offset in 0...1 {
      if let t = settings.times(on: Calendar.current.date(byAdding: .day, value: offset, to: now)!) {
        dates += [t.fajr, t.sunrise, t.dhuhr, t.asr, t.maghrib, t.isha].filter { $0 > now }
      }
    }
    let entries = Set(dates).sorted().map { PrayerEntry(date: $0, snap: PrayerSnapshot.make(settings, at: $0)) }
    completion(Timeline(entries: entries, policy: .atEnd))
  }
}

struct NextPrayerComplication: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "NextPrayer", provider: PrayerProvider()) { entry in
      ComplicationView(entry: entry)
        .containerBackground(.black, for: .widget)
    }
    .configurationDisplayName("Next prayer")
    .description("The next prayer and the time left.")
    .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline, .accessoryCorner])
  }
}

struct ComplicationView: View {
  @Environment(\.widgetFamily) private var family
  let entry: PrayerEntry

  var body: some View {
    if let snap = entry.snap {
      let short = String(snap.next.name.prefix(3)).uppercased()
      let progress = snap.progress(at: entry.date)
      let until = String(format: snap.settings.label("until", "until %@"), snap.next.name)
      switch family {
      case .accessoryCircular:
        // The board's ring: gold progress, short name, time left.
        ZStack {
          Group {
            Circle().stroke(Palette.track, lineWidth: 4)
            Circle()
              .trim(from: 0, to: progress)
              .stroke(Palette.gold, style: StrokeStyle(lineWidth: 4, lineCap: .round))
              .rotationEffect(.degrees(-90))
          }
          .accessibilityHidden(true)
          VStack(spacing: 0) {
            // "ASR" is for the eye; VoiceOver says the name, then the time left.
            Text(short).font(.system(size: 9, weight: .bold)).foregroundStyle(Palette.gold)
              .accessibilityLabel(snap.next.name)
            Text(snap.next.time, style: .timer)
              .font(.system(size: 12, weight: .bold))
              .monospacedDigit()
              .multilineTextAlignment(.center)
              .minimumScaleFactor(0.5)
          }
          .padding(4)
          .accessibilityElement(children: .combine)
        }
        .widgetAccentable()
      case .accessoryRectangular:
        VStack(alignment: .leading, spacing: 4) {
          HStack {
            Text("\(snap.next.name) \(snap.settings.format(snap.next.time))")
              .foregroundStyle(Palette.gold)
              .lineLimit(1)
            Spacer(minLength: 2)
          }
          .font(.system(size: 13, weight: .semibold))
          Text(snap.next.time, style: .timer)
            .font(.system(size: 20, weight: .semibold))
            .monospacedDigit()
          ProgressView(value: progress)
            .tint(Palette.gold)
            .accessibilityLabel(until)
        }
      case .accessoryCorner:
        Text(short)
          .font(.system(size: 14, weight: .bold))
          .accessibilityLabel(snap.next.name)
          .widgetLabel {
            ProgressView(value: progress).tint(Palette.gold).accessibilityLabel(until)
          }
      default:
        // Inline: "Asr 3:42 PM"
        Text("\(snap.next.name) \(snap.settings.format(snap.next.time))")
      }
    } else {
      Image(systemName: "moon.stars.fill")
        .accessibilityLabel("Adhan Times")
    }
  }
}
