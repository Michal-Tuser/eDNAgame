let waterData = {};
let currentCodes = [];

const speciesList = [
  "Brown Trout", "Otter", "Grayling", "Minnow", "Perch", "Pike"
];

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Script started");

  fetch('data-en.json')
    .then(res => {
      console.log("Fetch status:", res.status);
      if (!res.ok) throw new Error("Failed to fetch data-en.json");
      return res.json();
    })
    .then(data => {
      console.log("✅ JSON loaded:", data);
      waterData = data;
      createWaterButtons(Object.keys(data));
    })
    .catch(err => {
      console.error("❌ Fetch failed:", err);
      document.getElementById('buttons-container').innerHTML =
        '<p style="color:red;">Failed to load data-en.json</p>';
    });
});

function createWaterButtons(sources) {
  const container = document.getElementById("buttons-container");
  sources.forEach(source => {
    const btn = document.createElement("button");
    btn.textContent = source.charAt(0).toUpperCase() + source.slice(1) + " Water";
    btn.onclick = () => showResult(source);
    container.appendChild(btn);
  });
}

function showResult(source) {
  const data = waterData[source];
  document.getElementById("result-title").textContent = data.title;

  const container = document.getElementById("code-container");
  container.innerHTML = "";
  currentCodes = Object.entries(data.codes);

  currentCodes.forEach(([code, correct], index) => {
    const div = document.createElement("div");
    div.className = "code-item";

    const label = document.createElement("label");
    label.textContent = code;

    const select = document.createElement("select");
    select.id = `select-${index}`;

    const defaultOption = document.createElement("option");
    defaultOption.textContent = "--Select species--";
    defaultOption.value = "";
    select.appendChild(defaultOption);

    speciesList.forEach(species => {
      const option = document.createElement("option");
      option.value = species;
      option.textContent = species;
      select.appendChild(option);
    });

    const resultSpan = document.createElement("span");
    resultSpan.id = `result-${index}`;
    resultSpan.style.marginLeft = "10px";

    div.appendChild(label);
    div.appendChild(select);
    div.appendChild(resultSpan);
    container.appendChild(div);
  });

  document.getElementById("result-container").style.display = "block";
}

function checkAnswers() {
  currentCodes.forEach(([code, correct], index) => {
    const selected = document.getElementById(`select-${index}`).value;
    const resultSpan = document.getElementById(`result-${index}`);
    if (selected === correct) {
      resultSpan.textContent = "✅ Correct";
      resultSpan.style.color = "green";
    } else {
      resultSpan.textContent = "❌ Wrong";
      resultSpan.style.color = "red";
    }
  });
}
