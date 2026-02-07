document.addEventListener("DOMContentLoaded", async () => {

  const container = document.getElementById("tournamentLeaderboard");

  try {
    const [tournamentRes, usersRes] = await Promise.all([
      fetch(URLS.tournament),
      fetch(URLS.users)
    ]);

    const rowsRaw = await tournamentRes.text();
      let rows = [];

     try {
  rows = JSON.parse(rowsRaw);
    } catch {
  throw new Error("Tournament sheet is not returning JSON");
     }
    const usersRaw = await usersRes.json();
    const users = Array.isArray(usersRaw) ? usersRaw : [];

    /* ===============================
       USER MAP
       =============================== */
    const userMap = {};
    users.forEach(u => {
      userMap[u.username.toLowerCase()] = {
        name: u.display_name,
        photo: u.photo_url
      };
    });

    /* ===============================
       AGGREGATE TOTALS
       =============================== */
    const totals = {};

    rows.forEach(r => {
      const uname = r.username.toLowerCase();
      const pts = Number(r.points || 0);
      totals[uname] = (totals[uname] || 0) + pts;
    });

    /* ===============================
       SORT LEADERBOARD
       =============================== */
    const leaderboard = Object.entries(totals)
      .map(([uname, points]) => {
        const info = userMap[uname] || {
          name: uname,
          photo: "https://via.placeholder.com/40"
        };
        return {
          userName: info.name,
          userPhoto: info.photo,
          totalPoints: points
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);

    /* ===============================
       RENDER
       =============================== */
    container.innerHTML = "";

    leaderboard.forEach((u, index) => {
      const badge =
        index === 0 ? "🥇" :
        index === 1 ? "🥈" :
        index === 2 ? "🥉" :
        index + 1;

      const card = document.createElement("div");
      card.className = "team-card";
      if (index === 0) card.classList.add("gold");
      else if (index === 1) card.classList.add("silver");
      else if (index === 2) card.classList.add("bronze");

      card.innerHTML = `
        <div class="rank">${badge}</div>
        <div class="team-content">
          <div class="team-header">
            <div class="team-user-row">
              <img src="${u.userPhoto}" class="user-avatar">
              <span>${u.userName}</span>
            </div>
            <div class="team-total">${u.totalPoints} pts</div>
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
