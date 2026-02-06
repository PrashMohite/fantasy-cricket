fetch(URLS.matches)
  .then(res => res.json())
  .then(data => {
    const div = document.getElementById("matches");

    if (!data || data.length === 0) {
      div.innerHTML = "<p>No matches available</p>";
      return;
    }

    data.forEach(m => {
      if (m.status === "Live") {
        div.innerHTML += `
          <div class="card">
            <h3>${m.match_name}</h3>
            <p>${m.team1} vs ${m.team2}</p>
            <a href="team.html?match=${m.match_id}">Create Team</a>
          </div>`;
      }
    });
  })
  .catch(() => {
    document.getElementById("matches").innerText =
      "Error loading matches";
  });
