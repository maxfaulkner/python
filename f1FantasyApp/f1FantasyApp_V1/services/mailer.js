// services/mailer.js
const nodemailer = require('nodemailer');

// Initialize transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send admin notification when race import fails
 */
async function sendAdminNotification(adminEmail, options) {
  const { subject, round, season, error } = options;

  const htmlContent = `
    <h2>Fantasy F1 League - Manual Entry Required</h2>
    <p>Race results for <strong>Season ${season}, Round ${round}</strong> could not be automatically imported.</p>
    
    <h3>Error:</h3>
    <p><code>${error}</code></p>
    
    <p>Please log in to the admin dashboard and manually enter the race results.</p>
    
    <p>
      <a href="${process.env.BASE_URL}/admin/races/${round}" 
         style="background-color: #FF3333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Enter Race Results
      </a>
    </p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: adminEmail,
      subject: `[FANTASY F1] ${subject}`,
      html: htmlContent,
    });
    console.log(`✓ Admin notification sent to ${adminEmail}`);
  } catch (error) {
    console.error('Failed to send admin notification:', error);
  }
}

/**
 * Send team selection reminder to user
 */
async function sendTeamPickReminder(userEmail, options) {
  const { leagueName, week, budget } = options;

  const htmlContent = `
    <h2>📋 Time to Pick Your Fantasy F1 Team!</h2>
    
    <p>Hello,</p>
    
    <p>Week <strong>${week}</strong> is now open for team selection in <strong>${leagueName}</strong>.</p>
    
    <h3>Your Budget:</h3>
    <p style="font-size: 18px; font-weight: bold;">$${budget}M</p>
    
    <h3>Remember:</h3>
    <ul>
      <li>Pick 5 drivers</li>
      <li>Pick 1 team (constructor) - they're worth 2.5x more</li>
      <li>Team selections lock when first practice starts on Friday</li>
    </ul>
    
    <p>
      <a href="${process.env.BASE_URL}/leagues/${options.leagueId}/team/${week}" 
         style="background-color: #FF3333; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Pick Your Team
      </a>
    </p>
    
    <p style="color: #666; font-size: 12px;">
      Points come straight from F1 race results. Good luck! 🏁
    </p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: `🏁 Pick Your Team - Week ${week}`,
      html: htmlContent,
    });
    console.log(`✓ Team pick reminder sent to ${userEmail}`);
  } catch (error) {
    console.error('Failed to send team pick reminder:', error);
  }
}

/**
 * Send weekly recap with points earned
 */
async function sendWeeklyRecap(userEmail, options) {
  const { leagueName, week, pointsEarned, weeklyRank, seasonsRank } = options;

  const htmlContent = `
    <h2>📊 Week ${week} Recap - ${leagueName}</h2>
    
    <p>Hello,</p>
    
    <h3>Your Points This Week:</h3>
    <p style="font-size: 24px; font-weight: bold; color: #FF3333;">${pointsEarned} pts</p>
    
    <h3>Standings:</h3>
    <ul>
      <li>Week Rank: <strong>#${weeklyRank}</strong></li>
      <li>Season Rank: <strong>#${seasonsRank}</strong></li>
    </ul>
    
    <p>
      <a href="${process.env.BASE_URL}/leagues/${options.leagueId}/leaderboard" 
         style="background-color: #FF3333; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        View Full Leaderboard
      </a>
    </p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: userEmail,
      subject: `Week ${week} Recap: ${pointsEarned} points`,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Failed to send weekly recap:', error);
  }
}

module.exports = {
  sendAdminNotification,
  sendTeamPickReminder,
  sendWeeklyRecap,
};
