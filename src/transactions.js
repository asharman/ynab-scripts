require("dotenv").config();
const ynab = require("ynab");
const BUDGET_ID = process.env.YNAB_BUDGET_ID;
const ynabAPI = new ynab.API(process.env.YNAB_API_ACCESS_TOKEN);

const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");

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

      acc[cur.payee_name] = {
        visits: payeeInfo ? payeeInfo.visits + 1 : 1,
        totalSpent: payeeInfo ? payeeInfo.totalSpent + cur.amount : cur.amount,
      };

      return acc;
    }, {});
  // .map((transaction) => ({
  //   name: transaction.payee_name,
  //   amount: transaction.amount,
  //   category: transaction.category_name,
  // }));

  const transactionData = Object.entries(transactions)
    .sort((a, b) => b[1].visits - a[1].visits)
    .map(([name, { visits, totalSpent }]) => ({
      name,
      visits,
      totalSpent: ynab.utils.convertMilliUnitsToCurrencyAmount(totalSpent, 2),
    }));

  console.table(transactionData);
})();
