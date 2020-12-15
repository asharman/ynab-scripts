import * as ynab from "ynab";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import generateChart from "./chart";

const BUDGET_ID = process.env.YNAB_BUDGET_ID;
const ynabAPI = new ynab.API(process.env.YNAB_API_ACCESS_TOKEN);

dayjs.extend(customParseFormat);

const endDate = dayjs("2020-12-1", "YYYY-M-D");

(async function () {
  const transactionResponse = await ynabAPI.transactions.getTransactions(
    BUDGET_ID,
    "2019-12-1"
  );

  const transactions = transactionResponse.data.transactions
    .filter(({ date }) => {
      const parsedDate = dayjs(date, "YYYY-M-D");

      return parsedDate.isBefore(endDate, "day");
    })
    .reduce((acc, cur) => {
      const payeeInfo = acc[cur.payee_name];
      const totalSpent = ynab.utils.convertMilliUnitsToCurrencyAmount(
        cur.amount,
        0
      );

      acc[cur.payee_name] = {
        visits: payeeInfo ? payeeInfo.visits + 1 : 1,
        totalSpent: payeeInfo ? payeeInfo.totalSpent + totalSpent : totalSpent,
      };

      return acc;
    }, {});

  const transactionData = Object.entries(transactions)
    .sort((a, b) => b[1].visits - a[1].visits)
    .filter(([_, { totalSpent }]) => totalSpent <= 0)
    .filter(([name, _]) => !name.includes("Transfer"))
    .filter(([name, _]) => !name.includes("Discover Payment"))
    .filter(([name, _]) => !name.includes("Olga Arroyo"))
    .filter(([name, _]) => !name.includes("Starting Balance"))
    .filter(([name, { visits, totalSpent }]) => visits >= 2);

  const visits = transactionData.map(([_, { visits }]) => visits);

  const totalSpent = transactionData.map(([_, { totalSpent }]) => totalSpent);

  const names = transactionData.map(([name, _]) => name);

  const container = document.getElementById("app");

  generateChart(container, {
    type: "bar",
    data: {
      labels: names,
      datasets: [
        {
          type: "bar",
          label: "Amount Spent",
          backgroundColor: "hsla(144, 100%, 38%, 0.5)",
          borderColor: "hsla(144, 100%, 10%, 0.8)",
          borderWidth: 1,
          data: totalSpent.map(Math.abs),
        },
      ],
    },
    options: {
      scales: {
        yAxes: [
          {
            ticks: {
              // Include a dollar sign in the ticks
              callback: function (value, index, values) {
                return "$" + value;
              },
            },
          },
        ],
      },
      tooltips: {
        callbacks: {
          label: function (tooltipItem) {
            return `$${tooltipItem.value}`;
          },
        },
      },
    },
  });

  generateChart(container, {
    type: "bar",
    data: {
      labels: names,
      datasets: [
        {
          type: "bar",
          fill: false,
          label: "# of Visits",
          data: visits,
          backgroundColor: "hsla(279, 100%, 38%, 0.5)",
          borderColor: "hsla(279, 100%, 10%, 0.8)",
          borderWidth: 1,
        },
      ],
    },
    options: {},
  });
})();
