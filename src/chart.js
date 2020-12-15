import Chart from "chart.js";

function generateChart(parentElement, options) {
  const container = document.createElement("div");
  const ctx = document.createElement("canvas");

  container.appendChild(ctx);

  parentElement.appendChild(container);

  new Chart(ctx, options);
}

export default generateChart;
