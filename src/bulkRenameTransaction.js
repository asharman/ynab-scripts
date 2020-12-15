// npm run bulkRenameTransaction "oldName" "newName"

const ynab = require("ynab");
const inquirer = require("inquirer");
const BUDGET_ID = process.env.YNAB_BUDGET_ID;
const ynabAPI = new ynab.API(process.env.YNAB_API_ACCESS_TOKEN);

const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");

dayjs.extend(customParseFormat);

const endDate = dayjs("2020-12-1", "YYYY-M-D");

const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).demandCommand(
  2,
  2,
  "This script takes 2 strings, but only received $0",
  "This script takes 2 strings but received $0"
).argv;

const [oldName, newName] = argv._;

const transactionHasOldName = (transaction) =>
  transaction.payee_name === oldName;

const transactionHasNewName = (transaction) =>
  transaction.payee_name === newName;

(async function () {
  let errors = 0;

  if (typeof oldName !== "string") {
    console.log(
      `${oldName} should be a string, instead I got: ${typeof oldName}`
    );

    errors += 1;
  }
  if (typeof newName !== "string") {
    console.log(
      `${newName} should be a string, instead I got: ${typeof newName}`
    );

    errors += 1;
  }

  if (errors > 0) {
    console.log(
      `I have ${errors} ${
        errors === 1 ? "error" : "errors"
      } and had to return early`
    );
    return;
  }

  const transactionResponse = await ynabAPI.transactions.getTransactions(
    BUDGET_ID,
    "2019-12-1"
  );

  const transactionsFound = transactionResponse.data.transactions;

  const transactionsWithOldName = transactionsFound.filter(
    transactionHasOldName
  );

  const transactionsWithNewName = transactionsFound.filter(
    transactionHasNewName
  );

  console.log("Transactions with Old Name");
  console.table(
    transactionsWithOldName.map((transaction) => ({
      payee_id: transaction.payee_id,
      date: transaction.date,
      name: transaction.payee_name,
      amount: ynab.utils.convertMilliUnitsToCurrencyAmount(
        transaction.amount,
        2
      ),
      category: transaction.category_name,
    }))
  );
  console.log("Transactions with New Name");
  console.table(
    transactionsWithNewName.map((transaction) => ({
      payee_id: transaction.payee_id,
      date: transaction.date,
      name: transaction.payee_name,
      amount: ynab.utils.convertMilliUnitsToCurrencyAmount(
        transaction.amount,
        2
      ),
      category: transaction.category_name,
    }))
  );

  inquirer
    .prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Found ${
          transactionsWithOldName.length
        } transactions with the name "${oldName}" would you like to rename them to "${newName}"? You will have ${
          transactionsWithOldName.length + transactionsWithNewName.length
        } transactions named "${newName}"`,
      },
    ])
    .then(async ({ confirm }) => {
      if (!confirm) return;

      const updatedTransactions = transactionsWithOldName.map(
        (transaction) => ({
          ...transaction,
          payee_name: newName,
          payee_id: transactionsWithNewName.length
            ? transactionsWithNewName[0].payee_id
            : transaction.payee_id,
        })
      );

      console.log(updatedTransactions);

      const newTransactions = await ynabAPI.transactions
        .updateTransactions(BUDGET_ID, { transactions: updatedTransactions })
        .catch((err) => console.error(err));

      console.log(newTransactions.data.transactions);
    });
})();
