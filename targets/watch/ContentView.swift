import SwiftUI

/// The "Apple Watch" board of the design canvas: countdown home, then today's times below.
struct ContentView: View {
  @EnvironmentObject private var phone: PhoneLink

  var body: some View {
    if let settings = phone.settings {
      TimelineView(.periodic(from: .now, by: 1)) { context in
        if let snap = PrayerSnapshot.make(settings, at: context.date) {
          TabView {
            HomeView(snap: snap, now: context.date)
            TodayView(snap: snap, now: context.date)
          }
          .tabViewStyle(.verticalPage)
        }
      }
    } else {
      VStack(spacing: 8) {
        Image(systemName: "iphone")
          .font(.title2)
          .foregroundStyle(Palette.accent)
        Text("Open Adhan Times on your iPhone to set your location.")
          .font(.footnote)
          .multilineTextAlignment(.center)
          .foregroundStyle(Palette.soft)
      }
      .padding()
    }
  }
}

/// Home: the arc from Fajr to Isha filled up to now, the countdown and the next prayer.
struct HomeView: View {
  let snap: PrayerSnapshot
  let now: Date

  var body: some View {
    let s = snap.settings
    VStack(spacing: 0) {
      HStack {
        Text(s.label("app", "Adhan")).foregroundStyle(Palette.accent).fontWeight(.semibold)
        Spacer()
        Text(snap.city).foregroundStyle(Palette.muted).lineLimit(1)
      }
      .font(.footnote)
      .padding(.horizontal, 6)
      .accessibilityElement(children: .combine)

      ZStack(alignment: .bottom) {
        // The arc is a picture of the day so far; VoiceOver gets the same as words below.
        ArcView(snap: snap)
          .frame(height: 92)
          .accessibilityHidden(true)
        VStack(spacing: 1) {
          // A timer Text reads as a duration ("1 hour, 23 minutes") with VoiceOver.
          Text(snap.next.time, style: .timer)
            .font(.system(.title2, weight: .semibold))
            .monospacedDigit()
            .minimumScaleFactor(0.6)
            .lineLimit(1)
          Text(String(format: s.label("until", "until %@"), snap.next.name))
            .font(.footnote)
            .foregroundStyle(Palette.soft)
            .lineLimit(1)
            .minimumScaleFactor(0.7)
        }
        .padding(.bottom, 2)
        .accessibilityElement(children: .combine)
      }
      .padding(.top, 6)

      Spacer(minLength: 4)
      Text("\(snap.next.name) · \(s.format(snap.next.time))")
        .font(.system(.headline, weight: .semibold))
        .monospacedDigit()
        .foregroundStyle(Palette.gold)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
        .accessibilityLabel("\(snap.next.name), \(s.format(snap.next.time))")
    }
    // Text styles follow the watch's text size; the arc is fixed-size art, so the home page stops
    // growing at the largest non-accessibility size (the list on the next page doesn't).
    .dynamicTypeSize(...DynamicTypeSize.xxxLarge)
    .containerBackground(.black, for: .tabView)
  }
}

/// A thick half circle: track, the day so far in gold, and a dot per prayer.
struct ArcView: View {
  let snap: PrayerSnapshot

  var body: some View {
    GeometryReader { geo in
      ArcCanvas(snap: snap, size: geo.size)
    }
  }
}

private struct ArcCanvas: View {
  let snap: PrayerSnapshot
  let size: CGSize

  private var radius: CGFloat { min(size.width / 2 - 8, size.height - 8) }
  private var center: CGPoint { CGPoint(x: size.width / 2, y: size.height - 4) }

  private func point(_ t: Double) -> CGPoint {
    let angle = Double.pi * (1 - t)
    return CGPoint(x: center.x + radius * CGFloat(cos(angle)), y: center.y - radius * CGFloat(sin(angle)))
  }

  private func arc(to fraction: Double) -> Path {
    var path = Path()
    path.addArc(
      center: center, radius: radius, startAngle: .degrees(180),
      endAngle: .degrees(180 + 180 * fraction), clockwise: false)
    return path
  }

  private func dotColor(isNext: Bool, isPast: Bool) -> Color {
    if isNext { return .white }
    return isPast ? .black : Palette.upcoming
  }

  var body: some View {
    let style = StrokeStyle(lineWidth: 6, lineCap: .round)
    ZStack {
      arc(to: 1).stroke(Palette.track, style: style)
      arc(to: snap.nowOnArc).stroke(Palette.gold, style: style)
      ForEach(0..<snap.marks.count, id: \.self) { i in
        let mark = snap.marks[i]
        let side: CGFloat = mark.isNext ? 10 : 6
        Circle()
          .fill(dotColor(isNext: mark.isNext, isPast: mark.isPast))
          .frame(width: side, height: side)
          .position(point(mark.t))
      }
    }
  }
}

/// Swipe: today's times, the next one in gold.
struct TodayView: View {
  let snap: PrayerSnapshot
  let now: Date

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 3) {
        Text(snap.settings.label("today", "Today"))
          .font(.system(.footnote, weight: .semibold))
          .foregroundStyle(Palette.accent)
          .padding(.horizontal, 10)
          .padding(.bottom, 2)
          .accessibilityAddTraits(.isHeader)
        ForEach(snap.prayers) { p in
          let isNext = p.time == snap.next.time
          let isPast = !isNext && p.time <= now
          PrayerRow(
            name: p.name, time: snap.settings.format(p.time, withPeriod: false),
            spokenTime: snap.settings.format(p.time), isNext: isNext, isPast: isPast,
            nextLabel: snap.settings.label("next", "Next"))
        }
      }
    }
    .containerBackground(.black, for: .tabView)
  }
}

/// One line of the list. Small views keep the Swift type checker fast.
private struct PrayerRow: View {
  let name: String
  let time: String
  let spokenTime: String
  let isNext: Bool
  let isPast: Bool
  let nextLabel: String

  var body: some View {
    // At large text sizes the time goes under the name instead of squeezing it.
    ViewThatFits(in: .horizontal) {
      HStack {
        Text(name)
        Spacer()
        Text(time).monospacedDigit()
      }
      VStack(alignment: .leading, spacing: 0) {
        Text(name)
        Text(time).monospacedDigit()
      }
    }
    .font(.system(.body, weight: isNext ? .bold : .medium))
    .foregroundStyle(isNext ? Color.black : (isPast ? Palette.past : Color.white))
    .padding(.horizontal, 10)
    .padding(.vertical, 4)
    .frame(minHeight: 30)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(isNext ? Palette.gold : Palette.row, in: RoundedRectangle(cornerRadius: 12))
    // "Asr, 3:04 PM, next": one stop per prayer, with AM/PM spoken.
    .accessibilityElement(children: .ignore)
    .accessibilityLabel("\(name), \(spokenTime)")
    .accessibilityValue(isNext ? nextLabel : "")
  }
}
