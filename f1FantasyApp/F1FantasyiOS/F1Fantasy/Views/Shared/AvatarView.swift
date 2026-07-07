import SwiftUI

struct AvatarView: View {
    let name: String
    let colorHex: String
    var size: CGFloat = 36

    var body: some View {
        ZStack {
            Circle()
                .fill(Color(hex: colorHex))
            Text(name.prefix(1).uppercased())
                .font(.system(size: size * 0.38, weight: .bold))
                .foregroundStyle(.white)
        }
        .frame(width: size, height: size)
    }
}