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
  return date.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
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

  // Fetch earnings history and populate the table
  async function fetchEarningsHistory() {
    try {
      totalEarnings = 0; // Reset total earnings each time the data is fetched

      const walletTopUpQuery = query(
        collection(db, "walletTopUp"),
        where("status", "==", "approved"), // Filter by approved status
        orderBy("currentTime") // Order by the current time
      );
      const walletTopUpSnapshot = await getDocs(walletTopUpQuery);

      allUsersTable.innerHTML = ""; // Clear the table before adding rows

      // Loop through each approved transaction in walletTopUp
      for (const docSnap of walletTopUpSnapshot.docs) {
        const transactionData = docSnap.data();
        const userRef = transactionData.userID;
        const { amount, method, typeoftransaction, date, currentTime } = transactionData;

        // Apply filters (search, date, transaction type)
        const searchTerm = searchInput.value.toLowerCase();
        const selectedType = statusFilter.value;
        const fromDate = dateFrom.value ? new Date(dateFrom.value) : null;
        const toDate = dateTo.value ? new Date(dateTo.value) : null;
        const transactionDate = currentTime ? new Date(currentTime.seconds * 1000) : null; // Convert Firestore Timestamp to Date

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

        // Calculate earnings based on method (100% for E-Wallet, 5% for others)
        const earnings = method === "E-Wallet" ? amount : amount * 0.05;

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

        // Method
        const methodTd = document.createElement("td");
        methodTd.textContent = method;
        tr.appendChild(methodTd);

        // Earnings (5% of amount or 100% if E-Wallet)
        const earningsTd = document.createElement("td");
        earningsTd.textContent = earnings.toFixed(2); // Display earnings with 2 decimal places
        tr.appendChild(earningsTd);

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

      // Display the total earnings
      totalEarningsHeader.textContent = `Total Earnings: ${totalEarnings.toFixed(2)}`;
    } catch (error) {
      console.error("Error fetching earnings history:", error);
    }
  }

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

  // Export to PDF
  exportPDFBtn.addEventListener("click", () => {
    const pdf = new jsPDF();
    pdf.text(20, 20, "Earnings Report");
    pdf.autoTable({ html: "#allUsers" });
    pdf.save("earnings-report.pdf");
  });

  // Export to Excel
  exportExcelBtn.addEventListener("click", () => {
    const workbook = XLSX.utils.table_to_book(document.getElementById("allUsers"));
    XLSX.writeFile(workbook, "earnings-report.xlsx");
  });

  // Export to Word
  exportWordBtn.addEventListener("click", () => {
    const table = document.getElementById("allUsers").outerHTML;
    const blob = new Blob(["\ufeff", table], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "earnings-report.doc";
    link.click();
  });

  // Initial load of earnings history
  fetchEarningsHistory();
});
