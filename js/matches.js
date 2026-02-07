document.addEventListener("DOMContentLoaded", async () => {

  const matchesDiv = document.getElementById("matches");
  const userName = getUserName();

  if (!userName) {
    matchesDiv.innerHTML = "<p>User name required</p>";
    return;
  }

  try {
    const [matchesRes, teamsRes] = await Promise.all([
      fetch(URLS.matches),
      fetch(URLS.teams)
    ]);

    const matches = await matchesRes.json();
    const teams = await teamsRes.json();

    matches.forEach(match => {
      const status = match.status.toLowerCase();
      const card = document.createElement("div");
      card.className = "match-card";

      // Has user already submitted?
      const hasTeam = teams.some(t =>
        String(t["Match ID"]) === String(match.match_id) &&
        t["User Name"].trim().toLowerCase() === userName.toLowerCase()
      );

      let actionHtml = "";

      if (status === "upcoming") {
        actionHtml = `
         <a href="team.html?match=${match.match_id}"
   class="btn ${hasTeam ? "edit-btn" : "create-btn"}">
  ${hasTeam ? "Edit Team" : "Create Team"}
</a>
        `;
      } else {
        actionHtml = `
          <a href="live.html?match=${match.match_id}"
             class="btn secondary">
            View Leaderboard
          </a>
        `;
      }

      card.innerHTML = `
        <div class="match-row">
          <div>
            <div class="match-name">${match.match_name}</div>
            <div class="match-status">
              Status:
              <span class="status ${status}">
                ${status.toUpperCase()}
              </span>
            </div>
          </div>
          ${actionHtml}
        </div>
      `;

      matchesDiv.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    matchesDiv.innerHTML = "<p>Error loading matches</p>";
  }
});
