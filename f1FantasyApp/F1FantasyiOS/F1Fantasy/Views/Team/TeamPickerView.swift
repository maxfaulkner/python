import SwiftUI

struct TeamPickerView: View {
    let leagueId: String
    let week: Int
    @State private var vm = TeamPickerViewModel()
    @State private var activeTab = 0
    @State private var browseWeek: Int = 1

    var body: some View {
        ZStack {
            Color.appBackground.ignoresSafeArea()
            if vm.isLoading { LoadingView() }
            else if let err = vm.errorMessage, vm.pricesResponse == nil, vm.existingTeam == nil {
                ErrorView(message: err) { Task { await vm.load(leagueId: leagueId, week: browseWeek) } }
            } else if vm.isTeamLocked {
                lockedResultsView
            } else {
                pickerView
            }
        }
        .onAppear { browseWeek = week }
        .task { await vm.load(leagueId: leagueId, week: week) }
        .onChange(of: browseWeek) { _, newWeek in
            Task { await vm.load(leagueId: leagueId, week: newWeek) }
        }
        .alert("Team Saved!", isPresented: $vm.submitSuccess) {
            Button("OK") {}
        }
    }

    // MARK: - Results view (locked rounds)

    private var lockedResultsView: some View {
        ScrollView {
            VStack(spacing: 12) {
                // Week navigator
                weekNavigator

                // Lock banner
                HStack(spacing: 6) {
                    Image(systemName: "lock.fill").font(.caption2)
                    Text(browseWeek == week ? "Team locked — race weekend active" : "Round \(browseWeek) results")
                        .font(.caption).fontWeight(.semibold)
                }
                .foregroundStyle(.appGold)
                .frame(maxWidth: .infinity)
                .padding(10)
                .background(Color.appGold.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .padding(.horizontal, 16)

                // Chip badge
                if let chip = vm.existingTeam?.chipUsed {
                    HStack(spacing: 8) {
                        Text(chipEmoji(chip))
                        Text("\(chipName(chip)) — Active")
                            .font(.caption).fontWeight(.semibold)
                    }
                    .foregroundStyle(.appGold)
                    .frame(maxWidth: .infinity)
                    .padding(10)
                    .background(Color.appGold.opacity(0.08))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .padding(.horizontal, 16)
                }

                // Total points card
                if let total = vm.existingTeam?.totalRoundPoints, total != 0 {
                    HStack {
                        Text("Round \(browseWeek) Points")
                            .font(.subheadline).foregroundStyle(.appTextDim)
                        Spacer()
                        Text("\(total)")
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                            .foregroundStyle(total > 0 ? Color.appSuccess : Color.appError)
                    }
                    .padding(16)
                    .background(Color.appCard)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal, 16)
                }

                // Drivers section
                if let team = vm.existingTeam, !team.drivers.isEmpty {
                    VStack(spacing: 1) {
                        sectionHeader("Drivers (\(team.drivers.count))")
                        ForEach(team.drivers) { td in
                            ResultDriverRow(entry: td, isCaptain: team.captainId == td.driverId, chipUsed: team.chipUsed)
                        }
                    }
                    .background(Color.appCard)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal, 16)
                }

                // Constructor section
                if let team = vm.existingTeam, let ctor = team.constructors.first {
                    VStack(spacing: 1) {
                        sectionHeader("Constructor")
                        ResultConstructorRow(entry: ctor)
                    }
                    .background(Color.appCard)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal, 16)
                }

                // Empty team state
                if vm.existingTeam == nil || (vm.existingTeam?.drivers.isEmpty ?? true) {
                    VStack(spacing: 12) {
                        Text("🏎").font(.system(size: 40))
                        Text("No team for Round \(browseWeek)")
                            .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                        Text("You didn't pick a team for this round.")
                            .font(.caption).foregroundStyle(.appTextDim)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(40)
                }
            }
            .padding(.top, 16).padding(.bottom, 32)
        }
    }

    // MARK: - Picker view (open rounds)

    private var pickerView: some View {
        VStack(spacing: 0) {
            BudgetBar(used: vm.budgetUsed, total: vm.totalBudget)
                .padding(.horizontal, 16).padding(.vertical, 10)
                .background(Color.appCard)

            if !vm.availableChips.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(vm.availableChips) { chip in chipPill(chip) }
                    }
                    .padding(.horizontal, 16).padding(.vertical, 8)
                }
                .background(Color.appCard)
            }

            Picker("", selection: $activeTab) {
                Text("Drivers").tag(0)
                Text("Constructors").tag(1)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 16).padding(.vertical, 8)

            if activeTab == 0 {
                HStack {
                    Image(systemName: "magnifyingglass").foregroundStyle(.appTextDim)
                    TextField("Search drivers...", text: $vm.searchText)
                        .foregroundStyle(.appTextPrimary)
                }
                .padding(10)
                .background(Color.appCard)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .padding(.horizontal, 16)
            }

            ScrollView {
                LazyVStack(spacing: 8) {
                    if activeTab == 0 {
                        ForEach(vm.filteredDrivers) { entry in
                            DriverCard(
                                entry: entry,
                                isSelected: vm.selectedDriverIds.contains(entry.driverId),
                                isCaptain: vm.captainId == entry.driverId,
                                isLocked: false,
                                chipUsed: vm.chipUsed
                            ) {
                                vm.toggleDriver(entry.driverId)
                            } onSetCaptain: {
                                if vm.selectedDriverIds.contains(entry.driverId) {
                                    vm.captainId = entry.driverId
                                }
                            }
                        }
                    } else {
                        ForEach(vm.pricesResponse?.constructors ?? []) { entry in
                            ConstructorCard(
                                entry: entry,
                                isSelected: vm.selectedConstructorId == entry.constructorId,
                                isLocked: false
                            ) {
                                vm.selectedConstructorId = vm.selectedConstructorId == entry.constructorId
                                    ? nil : entry.constructorId
                            }
                        }
                    }
                }
                .padding(.horizontal, 16).padding(.top, 8).padding(.bottom, 100)
            }

            Button {
                Task { await vm.submit(leagueId: leagueId, week: browseWeek) }
            } label: {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(vm.canSubmit ? Color.appRed : Color.appCard)
                        .frame(height: 50)
                    if vm.isSubmitting { ProgressView().tint(.white) }
                    else {
                        Text(vm.isTeamComplete ? "Save Team" : "Select \(5 - vm.selectedDriverIds.count) more drivers")
                            .fontWeight(.semibold)
                            .foregroundStyle(vm.canSubmit ? .white : .appTextDim)
                    }
                }
            }
            .disabled(!vm.canSubmit || vm.isSubmitting)
            .padding(.horizontal, 16).padding(.bottom, 16)
        }
    }

    // MARK: - Helpers

    private var weekNavigator: some View {
        HStack {
            Button {
                if browseWeek > 1 { browseWeek -= 1 }
            } label: {
                Image(systemName: "chevron.left")
                    .font(.headline)
                    .foregroundStyle(browseWeek > 1 ? .appTextPrimary : .appTextFaint)
            }
            .disabled(browseWeek <= 1)

            Spacer()
            VStack(spacing: 2) {
                Text("ROUND").font(.system(size: 10, weight: .bold)).foregroundStyle(.appTextDim)
                Text("\(browseWeek)")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(.appTextPrimary)
            }
            Spacer()

            Button {
                if browseWeek < week { browseWeek += 1 }
            } label: {
                Image(systemName: "chevron.right")
                    .font(.headline)
                    .foregroundStyle(browseWeek < week ? .appTextPrimary : .appTextFaint)
            }
            .disabled(browseWeek >= week)
        }
        .padding(.horizontal, 32).padding(.vertical, 8)
        .background(Color.appCard)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .padding(.horizontal, 16)
    }

    private func sectionHeader(_ title: String) -> some View {
        Text(title)
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(.appTextFaint)
            .textCase(.uppercase)
            .tracking(1)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 14).padding(.vertical, 10)
            .overlay(alignment: .bottom) {
                Color.appBorder.frame(height: 0.5)
            }
    }

    private func chipPill(_ chip: Chip) -> some View {
        Button {
            vm.chipUsed = vm.chipUsed == chip.type ? nil : chip.type
        } label: {
            HStack(spacing: 4) {
                Text(chipEmoji(chip.type))
                Text(chipName(chip.type)).font(.caption2).fontWeight(.semibold)
            }
            .padding(.horizontal, 10).padding(.vertical, 5)
            .background(vm.chipUsed == chip.type ? Color.appGold.opacity(0.2) : Color.appCardRaised)
            .overlay(Capsule().stroke(vm.chipUsed == chip.type ? Color.appGold : Color.appBorder, lineWidth: 1))
            .foregroundStyle(vm.chipUsed == chip.type ? .appGold : .appTextDim)
            .clipShape(Capsule())
        }
    }
}

// MARK: - Result rows

struct ResultDriverRow: View {
    let entry: TeamDriverEntry
    let isCaptain: Bool
    let chipUsed: String?

    private var multiplier: String {
        chipUsed == "triple_captain" ? "3×" : "2×"
    }

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 2)
                .fill(constructorColor(for: entry.driver?.constructor?.name))
                .frame(width: 3, height: 40)

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(entry.driver?.name ?? "Unknown")
                        .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                    if isCaptain {
                        Text("👑 \(multiplier)")
                            .font(.system(size: 9, weight: .bold))
                            .padding(.horizontal, 5).padding(.vertical, 2)
                            .background(Color.appGold.opacity(0.2))
                            .foregroundStyle(.appGold)
                            .clipShape(Capsule())
                    }
                }
                Text(entry.driver?.constructor?.name ?? "")
                    .font(.caption2).foregroundStyle(.appTextDim)
            }

            Spacer()

            if let pts = entry.roundPoints {
                Text(pts > 0 ? "+\(pts)" : "\(pts)")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(pts > 0 ? Color.appSuccess : pts < 0 ? Color.appError : Color.appTextDim)
            } else {
                Text("—").font(.subheadline).foregroundStyle(.appTextFaint)
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 10)
        .background(isCaptain ? Color.appGold.opacity(0.04) : Color.clear)
    }
}

struct ResultConstructorRow: View {
    let entry: TeamConstructorEntry

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 2)
                .fill(constructorColor(for: entry.constructor?.name))
                .frame(width: 3, height: 40)

            VStack(alignment: .leading, spacing: 2) {
                Text(entry.constructor?.name ?? "Unknown")
                    .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                Text("Constructor")
                    .font(.caption2).foregroundStyle(.appRed)
            }

            Spacer()

            if let pts = entry.roundPoints {
                Text(pts > 0 ? "+\(pts)" : "\(pts)")
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundStyle(pts > 0 ? Color.appSuccess : pts < 0 ? Color.appError : Color.appTextDim)
            } else {
                Text("—").font(.subheadline).foregroundStyle(.appTextFaint)
            }
        }
        .padding(.horizontal, 14).padding(.vertical, 10)
    }
}

// MARK: - Picker cards (unchanged)

struct DriverCard: View {
    let entry: DriverPriceEntry
    let isSelected: Bool
    let isCaptain: Bool
    let isLocked: Bool
    let chipUsed: String?
    let onTap: () -> Void
    let onSetCaptain: () -> Void

    private var captainMultiplier: String {
        chipUsed == "triple_captain" && isCaptain ? "3x" : "2x"
    }

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 2)
                .fill(constructorColor(for: entry.driver?.constructor?.name))
                .frame(width: 3, height: 44)

            VStack(alignment: .leading, spacing: 2) {
                Text(entry.driver?.name ?? "Unknown")
                    .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                Text(entry.driver?.constructor?.name ?? "")
                    .font(.caption2).foregroundStyle(.appTextDim)
            }
            Spacer()

            if isSelected {
                Button(isCaptain ? captainMultiplier : "C") {
                    onSetCaptain()
                }
                .font(.caption2).fontWeight(.bold)
                .frame(width: 28, height: 28)
                .background(isCaptain ? Color.appGold : Color.appCardRaised)
                .foregroundStyle(isCaptain ? .black : .appTextDim)
                .clipShape(Circle())
            }

            Text(entry.price.priceString)
                .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)

            Image(systemName: isSelected ? "checkmark.circle.fill" : "plus.circle")
                .foregroundStyle(isSelected ? .appRed : .appTextFaint)
                .font(.title3)
        }
        .padding(12)
        .background(isSelected ? Color.appRed.opacity(0.08) : Color.appCard)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(isSelected ? Color.appRed.opacity(0.3) : Color.clear, lineWidth: 1))
        .onTapGesture { if !isLocked { onTap() } }
    }
}

struct ConstructorCard: View {
    let entry: ConstructorPriceEntry
    let isSelected: Bool
    let isLocked: Bool
    let onTap: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            RoundedRectangle(cornerRadius: 2)
                .fill(constructorColor(for: entry.constructor?.name))
                .frame(width: 3, height: 44)
            VStack(alignment: .leading, spacing: 2) {
                Text(entry.constructor?.name ?? "Unknown")
                    .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
                Text(entry.constructor?.nationality ?? "")
                    .font(.caption2).foregroundStyle(.appTextDim)
            }
            Spacer()
            Text(entry.price.priceString)
                .font(.subheadline).fontWeight(.semibold).foregroundStyle(.appTextPrimary)
            Image(systemName: isSelected ? "checkmark.circle.fill" : "plus.circle")
                .foregroundStyle(isSelected ? .appRed : .appTextFaint)
                .font(.title3)
        }
        .padding(12)
        .background(isSelected ? Color.appRed.opacity(0.08) : Color.appCard)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(isSelected ? Color.appRed.opacity(0.3) : Color.clear, lineWidth: 1))
        .onTapGesture { if !isLocked { onTap() } }
    }
}
