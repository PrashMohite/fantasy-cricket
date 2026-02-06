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
        card.className = "player-card";

        let actionHtml = "";

        // 🟢 UPCOMING
        if (status === "upcoming") {
          actionHtml = `
            <a href="team.html?match=${match.match_id}" class="btn">
              Create Team
            </a>
          `;
        }

        // 🔴 LIVE
        else if (status === "live") {
          actionHtml = `
            <button class="btn disabled" disabled>
              Match Live 🔒
            </button>
          `;
        }

        // ⚫ COMPLETED
        else if (status === "completed") {
          actionHtml = `
            <button class="btn disabled" disabled>
              Completed 🏁
            </button>
          `;
        }

        card.innerHTML = `
          <strong>${match.match_name}</strong><br>
          <small>Status: ${status.toUpperCase()}</small><br><br>
          ${actionHtml}
          <br><br>
          <a href="live.html?match=${match.match_id}" class="btn secondary">
            View Leaderboard
          </a>
        `;

        matchesDiv.appendChild(card);
      });

    })
    .catch(err => {
      console.error(err);
      matchesDiv.innerHTML = "<p>Error loading matches</p>";
    });

});
