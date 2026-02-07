document.addEventListener("DOMContentLoaded", async () => {

  const container = document.getElementById("tournamentLeaderboard");
  const banner = document.getElementById("tournamentBanner");

  if (!container) {
    console.error("Missing tournamentLeaderboard div");
    return;
  }

  try {
    const [tournamentRes, usersRes] = await Promise.all([
      fetch(URLS.tournament),
      fetch(URLS.users)
    ]);

    const rows = await tournamentRes.json();
    const users = await usersRes.json();

    if (!rows || rows.length === 0) {
      container.innerText = "No tournament data available";
      return;
    }

    /* ===============================
       LAST MATCH (FOR BANNER)
       =============================== */
    const lastRow = rows[rows.length - 1];
    const lastMatch = lastRow["Match Id"] || "latest match";

    if (banner) {
      banner.innerHTML = `
        <div class="tournament-banner">
          📊 Points are updated till <strong>${lastMatch}</strong>
        </div>
      `;
    }

    /* ===============================
       USER MAP (PHOTO + NAME)
       =============================== */
    const userMap = {};
    users.forEach(u => {
      userMap[u.username.toLowerCase()] = {
        name: u.display_name,
        photo: u.photo_url || "https://via.placeholder.com/40"
      };
    });

    /* ===============================
       AGGREGATE TOTALS (COLUMN-WISE)
       =============================== */
    const totals = {};

    rows.forEach(row => {
      Object.keys(row).forEach(col => {

        if (col.toLowerCase() === "match id") return;

        const username = col.toLowerCase();
        const value = Number(row[col]) || 0;

        totals[username] = (totals[username] || 0) + value;
      });
    });

    /* ===============================
       BUILD LEADERBOARD
       =============================== */
    const leaderboard = Object.entries(totals)
      .map(([username, total]) => {
        const info = userMap[username] || {
          name: username,
          photo: "https://via.placeholder.com/40"
        };

        return {
          username,
          name: info.name,
          photo: info.photo,
          total
        };
      })
      .sort((a, b) => b.total - a.total);

    /* ===============================
       RENDER
       =============================== */
    container.innerHTML = "";

    leaderboard.forEach((u, index) => {
      const card = document.createElement("div");
      card.className = "team-card";

      // Color by balance
      if (u.total >= 0) card.classList.add("positive");
      else card.classList.add("negative");

      card.innerHTML = `
        <div class="team-content">
          <div class="team-header">
            <div class="team-user-row">
              <img src="${u.photo}" class="user-avatar">
              <span>${u.name}</span>
            </div>
            <div class="team-total">
              ${u.total} pts
            </div>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    container.innerText = "Error loading tournament leaderboard";
  }
});
