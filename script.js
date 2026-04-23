let parsedData = [];

const fileInput = document.getElementById("fileInput");
const statusText = document.getElementById("status");
const threshold = document.getElementById("threshold");
const thresholdValue = document.getElementById("thresholdValue");
const analyzeBtn = document.getElementById("analyzeBtn");
const summary = document.getElementById("summary");
const tbody = document.querySelector("#resultsTable tbody");

threshold.addEventListener("input", () => {
  thresholdValue.textContent = threshold.value;
});

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const text = await file.text();
  parsedData = parseCSV(text);

  statusText.textContent = `Loaded: ${file.name} | Rows: ${parsedData.length}`;
  summary.textContent = "File loaded. Click Analyze.";
  tbody.innerHTML = "";
});

analyzeBtn.addEventListener("click", () => {
  if (!parsedData.length) {
    summary.textContent = "Please upload a CSV first.";
    return;
  }

  const numericRows = parsedData
    .map((row, index) => ({ index: index + 1, values: Object.values(row).map(Number) }))
    .filter(r => r.values.every(v => !Number.isNaN(v)));

  if (!numericRows.length) {
    summary.textContent = "No fully numeric rows found. Use a numeric CSV for this quick version.";
    return;
  }

  const scores = numericRows.map(r => {
    const avg = r.values.reduce((a, b) => a + b, 0) / r.values.length;
    return {
      row: r.index,
      score: Math.abs(avg)
    };
  });

  const maxScore = Math.max(...scores.map(s => s.score)) || 1;

  const normalized = scores.map(s => {
    const risk = Math.round((s.score / maxScore) * 100);
let level = "Low";
if (risk >= Number(threshold.value)) level = "High";
else if (risk >= Number(threshold.value) * 0.6) level = "Medium";
    return { row: s.row, risk, level };
  }).sort((a, b) => b.risk - a.risk);

  tbody.innerHTML = "";
  normalized.slice(0, 10).forEach(item => {
 const tr = document.createElement("tr");
tr.innerHTML = `
  <tr style="background:${
    item.level === "High" ? "#ffcccc" :
    item.level === "Medium" ? "#fff3cd" :
    "#ccffcc"
  }">
    <td>${item.row}</td>
    <td>${item.risk}</td>
    <td>${item.level}</td>
  </tr>
`;
    tbody.appendChild(tr);
  });

  summary.textContent = `Top 10 unusual rows shown using a simple distance-style score.`;
});

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim());
    const row = {};
    headers.forEach((h, i) => row[h] = values[i] ?? "");
    return row;
  });
}
