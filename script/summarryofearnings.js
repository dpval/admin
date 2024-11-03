import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Format the date to "September 28, 2024 at 9:11:28 AM"
function formatDate(firebaseDate) {
  const date = new Date(firebaseDate.seconds * 1000); // Convert Firebase Timestamp to JavaScript Date
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const allUsersTable = document.getElementById("allUsers");
  const totalEarningsHeader = document.querySelector("h2#totalEarnings");

  let totalEarnings = 0; // Variable to track total earnings

  const searchInput = document.getElementById("searchInput");
  const dateFrom = document.getElementById("dateFrom");
  const dateTo = document.getElementById("dateTo");
  const statusFilter = document.getElementById("statusFilter");
  const searchBtn = document.getElementById("searchBtn");
  const refreshBtn = document.querySelector(".userTypeBtn");
  const exportPDFBtn = document.getElementById("exportPDF");
  const exportExcelBtn = document.getElementById("exportExcel");
  const exportWordBtn = document.getElementById("exportWord");
  // Pagination variables
  let currentPage = 1;
  const recordsPerPage = 10; // Adjust as per your requirement
  let totalPages = 1; // This will be calculated based on the total records

  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");

  // Fetch earnings history and populate the table
  async function fetchEarningsHistory(page = 1) {
    try {
      totalEarnings = 0; // Reset total earnings each time the data is fetched

      const walletTopUpQuery = query(
        collection(db, "walletTopUp"),
        where("status", "==", "approved"), // Filter by approved status
        orderBy("currentTime") // Order by the current time
      );
      const walletTopUpSnapshot = await getDocs(walletTopUpQuery);
      const totalRecords = walletTopUpSnapshot.size; // Get the total number of records
      totalPages = Math.ceil(totalRecords / recordsPerPage); // Calculate total pages

      // Paginate records
      const startAtIndex = (page - 1) * recordsPerPage;
      const endAtIndex = startAtIndex + recordsPerPage;

      const paginatedDocs = walletTopUpSnapshot.docs.slice(
        startAtIndex,
        endAtIndex
      );
      allUsersTable.innerHTML = ""; // Clear the table before adding rows

      // Loop through each approved transaction in walletTopUp
      for (const docSnap of paginatedDocs) {
        const transactionData = docSnap.data();
        const userRef = transactionData.userID;
        const { amount, token, earnings, method, typeoftransaction, date, currentTime } =
          transactionData;

        // Apply filters (search, date, transaction type)
        const searchTerm = searchInput.value.toLowerCase();
        const selectedType = statusFilter.value;
        const fromDate = dateFrom.value ? new Date(dateFrom.value) : null;
        const toDate = dateTo.value ? new Date(dateTo.value) : null;
        const transactionDate = currentTime
          ? new Date(currentTime.seconds * 1000)
          : null; // Convert Firestore Timestamp to Date

        // Skip if the transaction type doesn't match the selected filter (if any filter is selected)
        if (selectedType && selectedType !== typeoftransaction) continue;
        if (fromDate && transactionDate < fromDate) continue;
        if (toDate && transactionDate > toDate) continue;

        // Fetch the user document to get the client name
        const userDoc = await getDoc(userRef);
        let clientName = "Unknown"; // Default value if user not found
        let userEmail = ""; // To store the email for search

        if (userDoc.exists()) {
          const userData = userDoc.data();
          clientName = `${userData.display_name} ${userData.lastname}`;
          userEmail = userData.email; // Store user email
        }

        // Check if the search term matches the client name or email
        if (
          searchTerm &&
          !clientName.toLowerCase().includes(searchTerm) &&
          !userEmail.toLowerCase().includes(searchTerm) // Corrected variable name to userEmail
        ) {
          continue;
        }

        // // Calculate earnings based on method (100% for E-Wallet, 5% for others)
        // const earnings = method === "E-Wallet" ? amount : amount * 0.05;

        // Add the earnings to the total earnings
        totalEarnings += earnings;

        // Create table row
        const tr = document.createElement("tr");

        // Client Name
        const clientNameTd = document.createElement("td");
        clientNameTd.textContent = clientName;
        tr.appendChild(clientNameTd);

        // Amount
        const amountTd = document.createElement("td");
        amountTd.textContent = amount.toFixed(2);
        tr.appendChild(amountTd);
        // Amount
        const tokenTd = document.createElement("td");
        tokenTd.textContent = token;
        tr.appendChild(tokenTd);
        // Amount
        const earningsTd = document.createElement("td");
        earningsTd.textContent = earnings;
        tr.appendChild(earningsTd);

        // Method
        const methodTd = document.createElement("td");
        methodTd.textContent = method;
        tr.appendChild(methodTd);

        // // Earnings (5% of amount or 100% if E-Wallet)
        // const earningsTd = document.createElement("td");
        // earningsTd.textContent = earnings.toFixed(2); // Display earnings with 2 decimal places
        // tr.appendChild(earningsTd);

        // Transaction Type
        const transactionTypeTd = document.createElement("td");
        transactionTypeTd.textContent = typeoftransaction;
        tr.appendChild(transactionTypeTd);

        // Current Time (formatted)
        const currentTimeTd = document.createElement("td");
        currentTimeTd.textContent = formatDate(currentTime); // Display the formatted date
        tr.appendChild(currentTimeTd);

        allUsersTable.appendChild(tr);
      }
      updatePaginationControls();
      // Display the total earnings
      totalEarningsHeader.textContent = `Total Earnings: ${totalEarnings.toFixed(
        2
      )}`;
    } catch (error) {
      console.error("Error fetching earnings history:", error);
    }
  }
  // Update pagination controls
  function updatePaginationControls() {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
  }

  // Event listeners for pagination buttons
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      fetchEarningsHistory(currentPage);
    }
  });

  nextPageBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchEarningsHistory(currentPage);
    }
  });
  // Event listener for search/filter button
  searchBtn.addEventListener("click", fetchEarningsHistory);

  // Event listener for dateFrom input to load table automatically
  dateFrom.addEventListener("change", fetchEarningsHistory);

  // Event listener for dateTo input to load table automatically
  dateTo.addEventListener("change", fetchEarningsHistory);

  // Refresh button to reload the data
  refreshBtn.addEventListener("click", () => {
    searchInput.value = "";
    dateFrom.value = "";
    dateTo.value = "";
    statusFilter.value = "";
    fetchEarningsHistory();
  });

  // // Export to PDF
  // exportPDFBtn.addEventListener("click", () => {
  //   const pdf = new jsPDF();
  //   pdf.text(20, 20, "Earnings Report");
  //   pdf.autoTable({ html: "#allUsers" });
  //   pdf.save("earnings-report.pdf");
  // });

  // // Export to Excel
  // exportExcelBtn.addEventListener("click", () => {
  //   const workbook = XLSX.utils.table_to_book(
  //     document.getElementById("allUsers")
  //   );
  //   XLSX.writeFile(workbook, "earnings-report.xlsx");
  // });<!-- Include this script in your HTML file -->

  // const exportExcelBtn = document.getElementById("exportExcelBtn");

  exportExcelBtn.addEventListener("click", () => {
    // Get the table element and clone it to avoid modifying the original table in the UI
    const originalTable = document.getElementById("allUsers");
    const clonedTable = originalTable.cloneNode(true);

    // Calculate totals and counts
    let totalAmount = 0;
    let totalTokens = 0;
    let totalEarnings = 0;
    let cashOutCount = 0;
    let topUpCount = 0;

    // Iterate through the rows to gather totals and counts
    Array.from(clonedTable.querySelectorAll("tbody tr")).forEach(row => {
      const amount = parseFloat(row.cells[1].textContent) || 0;
      const tokens = parseInt(row.cells[2].textContent) || 0;
      const earnings = parseFloat(row.cells[3].textContent) || 0;
      const transactionType = row.cells[5].textContent;

      totalAmount += amount;
      totalTokens += tokens;
      totalEarnings += earnings;

      if (transactionType === "CashOut") cashOutCount++;
      else if (transactionType === "TopUp") topUpCount++;
    });

    // Add a new row for the summary at the bottom of the table
    const summaryRow = clonedTable.insertRow(-1);
    summaryRow.insertCell(0).textContent = "Total";
    summaryRow.insertCell(1).textContent = totalAmount.toFixed(2);
    summaryRow.insertCell(2).textContent = totalTokens;
    summaryRow.insertCell(3).textContent = totalEarnings.toFixed(2);
    summaryRow.insertCell(4).textContent = ""; // Empty cell for "Method" column
    summaryRow.insertCell(5).textContent = `TopUp: ${topUpCount}, CashOut: ${cashOutCount}`;
    summaryRow.insertCell(6).textContent = ""; // Empty cell for "Date" column

    // Create the workbook and add a title row
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.table_to_sheet(clonedTable);
    XLSX.utils.sheet_add_aoa(worksheet, [["Summary of Earnings"]], { origin: "A1" });
    XLSX.utils.book_append_sheet(workbook, worksheet, "Earnings Summary");

    // Save the file with the desired filename
    XLSX.writeFile(workbook, "earnings-report.xlsx");
  });


  // // Export to Word
  // exportWordBtn.addEventListener("click", () => {
  //   const table = document.getElementById("allUsers").outerHTML;
  //   const blob = new Blob(["\ufeff", table], {
  //     type: "application/msword",
  //   });
  //   const url = URL.createObjectURL(blob);
  //   const link = document.createElement("a");
  //   link.href = url;
  //   link.download = "earnings-report.doc";
  //   link.click();
  // });

  // Initial load of earnings history
  fetchEarningsHistory();
});
