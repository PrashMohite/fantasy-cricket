document.addEventListener("DOMContentLoaded", async () => {

  const teamsDiv = document.getElementById("teams");
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get("match");

  if (!matchId) {
    teamsDiv.innerText = "Match not specified";
    return;
  }

  try {
    // Fetch all required data
    const [playersRes, teamsRes, statsRes, pointsRes] = await Promise.all([
      fetch(URLS.players),
      fetch(URLS.teams),
      fetch(URLS.liveStats),
      fetch(URLS.points)
    ]);

    const players = await playersRes.json();
    const teams = await teamsRes.json();
    const stats = await statsRes.json();
    const points = await pointsRes.json();

    /* ===============================
       PLAYER & STATS LOOKUPS
       =============================== */

    // Player ID → Name
    const playerMap = {};
    players.forEach(p => {
      playerMap[p.player_id] = p.player_name;
    });

    // Player ID → Live stats
    const statsMap = {};
    stats
      .filter(s => String(s.match_id) === String(matchId))
      .forEach(s => {
        statsMap[s.player_id] = {
          runs: Number(s.runs || 0),
          wickets: Number(s.wickets || 0)
        };
      });

    // Point rules
    let runPoint = 1;
    let wicketPoint = 25;
    points.forEach(p => {
      if (p.action === "run") runPoint = Number(p.points);
      if (p.action === "wicket") wicketPoint = Number(p.points);
    });

    /* ===============================
       DEDUPE TEAMS (LATEST PER USER)
       =============================== */

    // Only teams for this match
    const matchTeamsRaw = teams.filter(
      t => String(t["Match ID"]) === String(matchId)
    );

    if (matchTeamsRaw.length === 0) {
      teamsDiv.innerText = "No teams submitted yet";
      return;
    }

    // Keep latest submission per user
    const teamMap = {};
    matchTeamsRaw.forEach(t => {
      const key = t["User Name"].trim().toLowerCase();
      teamMap[key] = t; // later rows overwrite earlier ones
    });

    const matchTeams = Object.values(teamMap);

    /* ===============================
       CALCULATE POINTS
       =============================== */

    const leaderboard = matchTeams.map(team => {
      const playerIds = team["Player IDs"].split(",");
      const captain = team["Captain ID"];
      const viceCaptain = team["Vice Captain ID"];

      let totalPoints = 0;
      let playerLines = [];

      playerIds.forEach(pid => {
        const stat = statsMap[pid] || { runs: 0, wickets: 0 };

        let pts =
          (stat.runs * runPoint) +
          (stat.wickets * wicketPoint);

        let label = playerMap[pid] || pid;

        if (pid === captain) {
          pts *= 2;
          label += " ⭐ (C)";
        } else if (pid === viceCaptain) {
          pts *= 1.5;
          label += " 🔥 (VC)";
        }

        totalPoints += pts;
        playerLines.push(`${label} — ${pts} pts`);
      });

      return {
        user: team["User Name"],
        totalPoints,
        playerLines
      };
    });

    /* ===============================
       SORT + RENDER
       =============================== */

    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);

    teamsDiv.innerHTML = "";

    leaderboard.forEach((team, index) => {
      let badge = "";
      if (index === 0) badge = "🥇";
      else if (index === 1) badge = "🥈";
      else if (index === 2) badge = "🥉";

      const card = document.createElement("div");
      card.className = "player-card";
      card.innerHTML = `
        <strong>${badge} ${index + 1}. ${team.user}</strong><br>
        <div style="margin-top:6px">
          ${team.playerLines.join("<br>")}
        </div>
        <div style="margin-top:8px;font-weight:bold">
          Total: ${team.totalPoints} pts
        </div>
      `;

      teamsDiv.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    teamsDiv.innerText = "Error loading leaderboard";
  }

});
