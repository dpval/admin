document.addEventListener('DOMContentLoaded', () => {
  const transactionData = JSON.parse(localStorage.getItem('transactionData')) || [];

  updateTable('transactionsTable', transactionData);

  // Clear stored data
  localStorage.removeItem('transactionData');
});

function updateTable(tableId, data) {
  const tableBody = document.getElementById(tableId).getElementsByTagName('tbody')[0];
  tableBody.innerHTML = '';

  data.forEach(row => {
    const newRow = tableBody.insertRow();

    // Status Cell
    const statusCell = newRow.insertCell();
    statusCell.textContent = row.status;

    // User Name Cell
    const userNameCell = newRow.insertCell();
    userNameCell.textContent = row.userName;

    // Number of Account Cell
    const numberofAccountCell = newRow.insertCell();
    numberofAccountCell.textContent = row.numberofAccount;

    // Method Cell
    const methodCell = newRow.insertCell();
    methodCell.textContent = row.method;

    // Amount Cell
    const amountCell = newRow.insertCell();
    amountCell.textContent = row.amount;

    // Transaction Type Cell
    const transactionTypeCell = newRow.insertCell();
    transactionTypeCell.textContent = row.transactionType;
  });
}
