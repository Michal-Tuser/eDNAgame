let waterData = {};
let currentCodes = [];
let lang = document.documentElement.lang || 'en';

const speciesList = []; // Will be populated dynamically per water source

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Script started (lang:", lang, ")");

  fetch('data.json')
    .then(res => {
      console.log("Fetch status:", res.status);
      if (!res.ok) throw new Error("Failed to fetch data.json");
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
        '<p style="color:red;">Failed to load data.json</p>';
    });
});

function createWaterButtons(sources) {
  const container = document.getElementById("buttons-container");
  container.innerHTML = "";
  sources.forEach(source => {
    const btn = document.createElement("button");
    btn.textContent = capitalize(source) + (lang === 'cz' ? " voda" : " Water");
    btn.onclick = () => showResult(source);
    container.appendChild(btn);
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showResult(source) {
  const data = waterData[source];
  document.getElementById("result-title").textContent = data.title[lang];

  const container = document.getElementById("code-container");
  container.innerHTML = "";
  currentCodes = data.codes;

  // Rebuild speciesList dynamically based on available species in this source
  const speciesSet = new Set();
  data.codes.forEach(entry => speciesSet.add(entry.species[lang]));
  const localSpeciesList = Array.from(speciesSet);

  currentCodes.forEach((entry, index) => {
    const div = document.createElement("div");
    div.className = "code-item";

    const label = document.createElement("label");
    label.textContent = entry.code;

    const select = document.createElement("select");
    select.id = `select-${index}`;

    const defaultOption = document.createElement("option");
    defaultOption.textContent = lang === 'cz' ? "--Vyberte druh--" : "--Select species--";
    defaultOption.value = "";
    select.appendChild(defaultOption);

    localSpeciesList.forEach(species => {
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
  currentCodes.forEach((entry, index) => {
    const correct = entry.species[lang];
    const selected = document.getElementById(`select-${index}`).value;
    const resultSpan = document.getElementById(`result-${index}`);
    if (selected === correct) {
      resultSpan.textContent = "✅ " + (lang === 'cz' ? "Správně" : "Correct");
      resultSpan.style.color = "green";
    } else {
      resultSpan.textContent = "❌ " + (lang === 'cz' ? "Špatně" : "Wrong");
      resultSpan.style.color = "red";
    }
  });
}
