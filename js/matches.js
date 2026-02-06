document.addEventListener("DOMContentLoaded", () => {

  const matchesDiv = document.getElementById("matches");

  fetch(URLS.matches)
    .then(res => res.json())
    .then(matches => {

      if (!matches || matches.length === 0) {
        matchesDiv.innerHTML = "<p>No matches available</p>";
        return;
      }

      matches.forEach(match => {
        const status = (match.status || "").toLowerCase().trim();

        const card = document.createElement("div");
        card.className = "match-card";

        let actionHtml = "";

        // 🟢 UPCOMING → ONLY Create Team
        if (status === "upcoming") {
          actionHtml = `
            <a href="team.html?match=${match.match_id}" class="btn primary">
              Create Team
            </a>
          `;
        }

        // 🔴 LIVE / ⚫ COMPLETED → ONLY View Leaderboard
        else {
          actionHtml = `
            <a href="live.html?match=${match.match_id}" class="btn secondary">
              View Leaderboard
            </a>
          `;
        }

        card.innerHTML = `
          <div class="match-row">
            <div class="match-info">
              <div class="match-name">${match.match_name}</div>

              <div class="match-status">
                Status:
                <span class="status ${status}">
                  ${status.toUpperCase()}
                </span>
              </div>
            </div>

            <div class="match-action">
              ${actionHtml}
            </div>
          </div>
        `;

        matchesDiv.appendChild(card);
      });

    })
    .catch(err => {
      console.error(err);
      matchesDiv.innerHTML = "<p>Error loading matches</p>";
    });

});
