require("dotenv").config();
const ynab = require("ynab");
const ynabAPI = new ynab.API(process.env.YNAB_API_ACCESS_TOKEN);

(async function () {
  const monthResponse = await ynabAPI.months.getBudgetMonths(
    process.env.YNAB_BUDGET_ID
  );

  console.table(monthResponse.data.months);
})();
