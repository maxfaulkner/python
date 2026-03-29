import SwiftUI

struct ChatView: View {
    let leagueId: String
    @State private var vm: ChatViewModel
    @Environment(AuthService.self) private var authService

    init(leagueId: String) {
        self.leagueId = leagueId
        _vm = State(initialValue: ChatViewModel(leagueId: leagueId))
    }

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            VStack(spacing: 0) {
                if vm.isLoading && vm.messages.isEmpty {
                    LoadingView()
                } else {
                    messageList
                }
                inputBar
            }
        }
        .task { await vm.loadMessages() }
        .onAppear { vm.startPolling() }
        .onDisappear { vm.stopPolling() }
    }

    private var messageList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 4) {
                    ForEach(vm.messages) { message in
                        MessageBubble(
                            message: message,
                            isOwn: message.userId == authService.currentUser?.id,
                            onReply: { vm.replyingTo = message }
                        )
                        .id(message.id)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
            }
            .onChange(of: vm.messages.count) { _, _ in
                if let last = vm.messages.last {
                    withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                }
            }
        }
    }

    private var inputBar: some View {
        VStack(spacing: 0) {
            Divider().background(Color.appBorder)
            if let reply = vm.replyingTo {
                HStack {
                    Rectangle().fill(Color.appRed).frame(width: 2, height: 28)
                    Text("Replying to \(reply.user?.name ?? "Unknown"): \(reply.content)")
                        .font(.caption).foregroundStyle(.appTextDim).lineLimit(1)
                    Spacer()
                    Button { vm.replyingTo = nil } label: {
                        Image(systemName: "xmark").font(.caption).foregroundStyle(.appTextDim)
                    }
                }
                .padding(.horizontal, 12).padding(.vertical, 6)
                .background(Color.appCard)
            }
            HStack(spacing: 10) {
                TextField("Message...", text: $vm.inputText, axis: .vertical)
                    .lineLimit(4)
                    .padding(10)
                    .background(Color.appCard)
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .foregroundStyle(.appTextPrimary)
                Button {
                    Task { await vm.sendMessage() }
                } label: {
                    Image(systemName: vm.isSending ? "hourglass" : "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundStyle(vm.inputText.isEmpty ? .appTextFaint : .appRed)
                }
                .disabled(vm.inputText.isEmpty || vm.isSending)
            }
            .padding(.horizontal, 12).padding(.vertical, 8)
            .background(Color.appBackground)
        }
    }
}

struct MessageBubble: View {
    let message: LeagueMessage
    let isOwn: Bool
    let onReply: () -> Void

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            if isOwn { Spacer(minLength: 48) }
            if !isOwn {
                AvatarView(name: message.user?.name ?? "?", colorHex: message.user?.avatarColor ?? "e10600", size: 28)
            }
            VStack(alignment: isOwn ? .trailing : .leading, spacing: 3) {
                if !isOwn {
                    Text(message.user?.name ?? "").font(.caption2).foregroundStyle(.appTextDim)
                }
                // Reply preview
                if let reply = message.replyTo {
                    HStack(spacing: 4) {
                        Rectangle().fill(Color.appRed).frame(width: 2)
                        Text(reply.content).font(.caption2).foregroundStyle(.appTextDim).lineLimit(1)
                    }
                    .padding(6)
                    .background(Color.appCardRaised)
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                }
                Text(message.content)
                    .font(.subheadline)
                    .foregroundStyle(isOwn ? .white : .appTextPrimary)
                    .padding(.horizontal, 12).padding(.vertical, 8)
                    .background(isOwn ? Color.appRed : Color.appCard)
                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                // Reactions
                if !message.reactions.isEmpty {
                    let grouped = Dictionary(grouping: message.reactions, by: \.emoji)
                    HStack(spacing: 4) {
                        ForEach(grouped.keys.sorted(), id: \.self) { emoji in
                            Text("\(emoji) \(grouped[emoji]!.count)")
                                .font(.caption2)
                                .padding(.horizontal, 6).padding(.vertical, 2)
                                .background(Color.appCardRaised)
                                .clipShape(Capsule())
                                .foregroundStyle(.appTextDim)
                        }
                    }
                }
                Text(message.createdAt.relativeString)
                    .font(.caption2).foregroundStyle(.appTextFaint)
            }
            if !isOwn { Spacer(minLength: 48) }
        }
        .padding(.vertical, 2)
        .contextMenu {
            Button("Reply", systemImage: "arrowshape.turn.up.left") { onReply() }
        }
    }
}