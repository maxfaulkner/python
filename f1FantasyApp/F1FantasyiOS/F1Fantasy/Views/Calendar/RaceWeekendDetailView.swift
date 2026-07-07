import SwiftUI

// Reuse the private models from CalendarView via fileprivate → they're in the same module, but
// private struct can't be accessed across files. We duplicate the minimal types needed here.

struct RaceWeekendSession: Identifiable {
    let id = UUID()
    let name: String
    let date: String      // yyyy-MM-dd
    let time: String?     // HH:mm:ssZ (UTC)
    let isFeature: Bool   // Race / Sprint
}

struct RaceWeekendDetailView: View {
    let raceName: String
    let circuitName: String
    let locality: String
    let country: String
    let sessions: [RaceWeekendSession]

    private let utcFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd'T'HH:mm:ssZ"
        f.locale = Locale(identifier: "en_US_POSIX")
        return f
    }()

    private let dayFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "EEE d MMM"
        f.locale = Locale.current
        return f
    }()

    private let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .none
        f.timeStyle = .short
        f.locale = Locale.current
        return f
    }()

    private func localDate(date: String, time: String?) -> Date? {
        guard let t = time else { return nil }
        let combined = "\(date)T\(t)"
        return utcFormatter.date(from: combined)
    }

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 16) {
                    // Circuit header
                    VStack(spacing: 6) {
                        Text(raceName)
                            .font(.title3).fontWeight(.bold).foregroundStyle(.appTextPrimary)
                            .multilineTextAlignment(.center)
                        Text(circuitName)
                            .font(.subheadline).foregroundStyle(.appTextDim)
                        Text("\(locality), \(country)")
                            .font(.caption).foregroundStyle(.appTextFaint)
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.appCard)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal)

                    // Sessions
                    VStack(spacing: 0) {
                        ForEach(sessions) { session in
                            sessionRow(session)
                            if session.id != sessions.last?.id {
                                Color.appBorder.frame(height: 0.5).padding(.leading, 16)
                            }
                        }
                    }
                    .background(Color.appCard)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal)
                }
                .padding(.top, 16)
                .padding(.bottom, 32)
            }
        }
        .navigationTitle("Weekend Schedule")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func sessionRow(_ session: RaceWeekendSession) -> some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 2)
                .fill(session.isFeature ? Color.appRed : Color.appGold.opacity(0.6))
                .frame(width: 3, height: 40)

            VStack(alignment: .leading, spacing: 3) {
                Text(session.name)
                    .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                if let d = localDate(date: session.date, time: session.time) {
                    Text("\(dayFormatter.string(from: d)) · \(timeFormatter.string(from: d)) (local)")
                        .font(.caption2).foregroundStyle(.appTextDim)
                } else {
                    Text(session.date)
                        .font(.caption2).foregroundStyle(.appTextDim)
                }
            }

            Spacer()

            if isUpcoming(session) {
                Text("UPCOMING")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(.appRed)
                    .padding(.horizontal, 6).padding(.vertical, 2)
                    .background(Color.appRed.opacity(0.12))
                    .clipShape(Capsule())
            } else if isPast(session) {
                Image(systemName: "checkmark.circle.fill")
                    .font(.caption)
                    .foregroundStyle(.appSuccess)
            }
        }
        .padding(.horizontal, 16).padding(.vertical, 10)
    }

    private func isUpcoming(_ session: RaceWeekendSession) -> Bool {
        guard let d = localDate(date: session.date, time: session.time) else { return false }
        return d > .now && d < .now.addingTimeInterval(48 * 3600)
    }

    private func isPast(_ session: RaceWeekendSession) -> Bool {
        guard let d = localDate(date: session.date, time: session.time) else {
            // fallback: compare date-only
            let df = DateFormatter(); df.dateFormat = "yyyy-MM-dd"
            guard let dayDate = df.date(from: session.date) else { return false }
            return dayDate < Calendar.current.startOfDay(for: .now)
        }
        return d < .now
    }
}
