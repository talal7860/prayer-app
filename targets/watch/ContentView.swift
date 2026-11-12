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
        Text("Open Adhan App on your iPhone to set your location.")
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
      .font(.system(size: 13))
      .padding(.horizontal, 6)

      ZStack(alignment: .bottom) {
        ArcView(snap: snap)
          .frame(height: 92)
        VStack(spacing: 1) {
          Text(snap.next.time, style: .timer)
            .font(.system(size: 30, weight: .semibold))
            .monospacedDigit()
            .minimumScaleFactor(0.6)
            .lineLimit(1)
          Text(String(format: s.label("until", "until %@"), snap.next.name))
            .font(.system(size: 13))
            .foregroundStyle(Palette.soft)
            .lineLimit(1)
        }
        .padding(.bottom, 2)
      }
      .padding(.top, 6)

      Spacer(minLength: 4)
      Text("\(snap.next.name) · \(s.format(snap.next.time))")
        .font(.system(size: 15, weight: .semibold))
        .monospacedDigit()
        .foregroundStyle(Palette.gold)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
    }
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
          .font(.system(size: 13, weight: .semibold))
          .foregroundStyle(Palette.accent)
          .padding(.horizontal, 10)
          .padding(.bottom, 2)
        ForEach(snap.prayers) { p in
          let isNext = p.time == snap.next.time
          let isPast = !isNext && p.time <= now
          HStack {
            Text(p.name)
            Spacer()
            Text(snap.settings.format(p.time, withPeriod: false)).monospacedDigit()
          }
          .font(.system(size: 15, weight: isNext ? .bold : .medium))
          .foregroundStyle(isNext ? Color.black : (isPast ? Palette.past : Color.white))
          .padding(.horizontal, 10)
          .frame(height: 30)
          .background(isNext ? Palette.gold : Palette.row, in: RoundedRectangle(cornerRadius: 12))
        }
      }
    }
    .containerBackground(.black, for: .tabView)
  }
}
