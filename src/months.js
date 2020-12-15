import * as ynab from "ynab";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import generateChart from "./chart";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const BUDGET_ID = process.env.YNAB_BUDGET_ID;
const ynabAPI = new ynab.API(process.env.YNAB_API_ACCESS_TOKEN);

dayjs.extend(customParseFormat);

const endDate = dayjs("2020-12-1", "YYYY-M-D");

(async function () {
  const monthResponse = await ynabAPI.transactions.getTransactions(
    process.env.YNAB_BUDGET_ID,
    "2019-12-1"
  );

  const transactions = monthResponse.data.transactions.filter(({ date }) => {
    const parsedDate = dayjs(date, "YYYY-M-D");

    return parsedDate.isBefore(endDate, "day");
  });

  const transactionsByMonth = transactions.reduce((acc, cur) => {
    const parsedDate = dayjs(cur.date, "YYYY-M-D");
    const month = MONTHS[parsedDate.month()];

    acc[month] = acc[month] ? [...acc[month], cur] : [cur];
    return acc;
  }, {});

  console.log(transactionsByMonth);

  // console.table(transactions);
})();
