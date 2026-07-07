// services/achievementService.js
// Auto-unlock achievements after race results are imported
const prisma = require('../prisma');

const ACHIEVEMENTS = {
  first_win: {
    title: 'First Win',
    description: 'Win your first round in a league',
    icon: '🏆',
  },
  podium_finish: {
    title: 'Podium Finish',
    description: 'Finish top 3 in any round',
    icon: '🥈',
  },
  perfect_round: {
    title: 'Flawless',
    description: 'Score 80+ points in a single round',
    icon: '🤖',
  },
  on_fire: {
    title: 'On Fire',
    description: 'Lead your league 3 rounds in a row',
    icon: '🔥',
  },
  captain_call: {
    title: "Captain's Call",
    description: 'Your captain finishes P1',
    icon: '🎯',
  },
  veteran: {
    title: 'Veteran',
    description: 'Complete 10 rounds in a league',
    icon: '🏁',
  },
  big_spender: {
    title: 'Big Spender',
    description: 'Use the full $100M budget',
    icon: '💸',
  },
  rocket_start: {
    title: 'Rocket Start',
    description: 'Lead the league after Round 1',
    icon: '🚀',
  },
  social_butterfly: {
    title: 'Social Butterfly',
    description: 'Post 10+ messages in a league chat',
    icon: '🗣️',
  },
  champion: {
    title: 'Champion',
    description: 'Win a full season',
    icon: '👑',
  },
};

async function unlockAchievement(userId, type, leagueId = null) {
  try {
    const def = ACHIEVEMENTS[type];
    if (!def) return;

    await prisma.achievement.upsert({
      where: {
        userId_type_leagueId: {
          userId,
          type,
          leagueId: leagueId || '',
        },
      },
      create: {
        userId,
        type,
        leagueId,
        title: def.title,
        description: def.description,
        icon: def.icon,
      },
      update: {},
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'achievement',
        title: `Achievement Unlocked: ${def.title}`,
        body: def.description,
        data: { achievementType: type },
      },
    });
  } catch (e) {
    // Skip duplicate constraint errors silently
    if (e.code !== 'P2002') console.error('Achievement unlock error:', e);
  }
}

/**
 * Check and unlock achievements for all users after a race result is imported.
 * Called from the results import flow.
 */
async function checkAchievementsAfterRace(leagueId, week) {
  try {
    const league = await prisma.league.findUnique({ where: { id: leagueId } });
    if (!league) return;

    // Get all weekly teams for this round
    const teams = await prisma.userWeeklyTeam.findMany({
      where: { leagueId, week },
      include: {
        drivers: true,
        constructors: true,
      },
    });

    // Calculate points for each team this round
    const roundScores = [];
    for (const team of teams) {
      let pts = 0;
      for (const td of team.drivers) {
        const results = await prisma.raceResult.findMany({
          where: { driverId: td.driverId, leagueId, week },
        });
        for (const r of results) {
          let p = r.points;
          if (team.captainId === td.driverId) {
            p *= team.chipUsed === 'triple_captain' ? 3 : 2;
          }
          pts += p;
        }
      }
      const ctor = team.constructors[0];
      if (ctor) {
        const cr = await prisma.constructorRaceResult.findFirst({
          where: { constructorId: ctor.constructorId, leagueId, week },
        });
        if (cr) pts += cr.totalPoints;
      }
      roundScores.push({ userId: team.userId, points: pts, team });
    }

    // Sort to get rankings
    roundScores.sort((a, b) => b.points - a.points);

    // Check each user's achievements
    for (let i = 0; i < roundScores.length; i++) {
      const { userId, points, team } = roundScores[i];
      const rank = i + 1;

      // Perfect round (80+ pts)
      if (points >= 80) {
        await unlockAchievement(userId, 'perfect_round', leagueId);
      }

      // First win / Win round
      if (rank === 1) {
        // Check if this is their first league win ever
        const prevWins = await prisma.achievement.count({
          where: { userId, type: 'first_win' },
        });
        if (prevWins === 0) {
          await unlockAchievement(userId, 'first_win', leagueId);
        }
      }

      // Podium (top 3)
      if (rank <= 3) {
        await unlockAchievement(userId, 'podium_finish', leagueId);
      }

      // Rocket start (league leader after round 1)
      if (rank === 1 && week === league.startingRound) {
        await unlockAchievement(userId, 'rocket_start', leagueId);
      }

      // Big spender
      if (team.budgetUsed >= 99.9) {
        await unlockAchievement(userId, 'big_spender', leagueId);
      }

      // Veteran (10+ rounds played)
      const roundsPlayed = await prisma.userWeeklyTeam.count({
        where: { userId, leagueId },
      });
      if (roundsPlayed >= 10) {
        await unlockAchievement(userId, 'veteran', leagueId);
      }

      // Captain's call — captain finishes P1
      if (team.captainId) {
        const captainResult = await prisma.raceResult.findFirst({
          where: { driverId: team.captainId, leagueId, week, finishingPosition: 1 },
        });
        if (captainResult) {
          await unlockAchievement(userId, 'captain_call', leagueId);
        }
      }

      // Social butterfly — 10+ chat messages
      const msgCount = await prisma.leagueMessage.count({
        where: { userId, leagueId },
      });
      if (msgCount >= 10) {
        await unlockAchievement(userId, 'social_butterfly', leagueId);
      }
    }

    // On fire — check if someone has been top 1 for 3 consecutive rounds
    if (week >= league.startingRound + 2) {
      const allUsers = roundScores.map(s => s.userId);
      for (const userId of allUsers) {
        let consecutiveLeads = 0;
        for (let w = week; w >= Math.max(league.startingRound, week - 2); w--) {
          const weekTeams = await prisma.userWeeklyTeam.findMany({
            where: { leagueId, week: w },
            include: { drivers: true, constructors: true },
          });
          const weekScores = [];
          for (const t of weekTeams) {
            let p = 0;
            for (const td of t.drivers) {
              const rs = await prisma.raceResult.findMany({
                where: { driverId: td.driverId, leagueId, week: w },
              });
              for (const r of rs) p += t.captainId === td.driverId ? r.points * 2 : r.points;
            }
            weekScores.push({ userId: t.userId, points: p });
          }
          weekScores.sort((a, b) => b.points - a.points);
          if (weekScores[0]?.userId === userId) {
            consecutiveLeads++;
          } else break;
        }
        if (consecutiveLeads >= 3) {
          await unlockAchievement(userId, 'on_fire', leagueId);
        }
      }
    }

    console.log(`✓ Achievements checked for league ${league.name} Round ${week}`);
  } catch (e) {
    console.error('Achievement check error:', e);
  }
}

module.exports = { checkAchievementsAfterRace, unlockAchievement };
