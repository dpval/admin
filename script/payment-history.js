import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const allUsersTable = document.getElementById("allUsers");
  const exportPdfBtn = document.getElementById("exportPdf");
  const exportExcelBtn = document.getElementById("exportExcel");
  const exportWordBtn = document.getElementById("exportWord");

    // Pagination variables
    let currentPage = 1;
    const recordsPerPage = 6; // Adjust as per your requirement
    let totalPages = 1; // This will be calculated based on the total records
  
    const prevPageBtn = document.getElementById("prevPage");
    const nextPageBtn = document.getElementById("nextPage");
    const pageInfo = document.getElementById("pageInfo");

  // Fetch payment history and populate the table
  async function fetchPaymentHistory(page = 1) {
    try {
      const paymentHistoryQuery = query(
        collection(db, "walletTopUp"),
        orderBy("amount", "desc")
      );
      const querySnapshot = await getDocs(paymentHistoryQuery);
      const totalRecords = querySnapshot.size; // Get the total number of records
      totalPages = Math.ceil(totalRecords / recordsPerPage); // Calculate total pages

      // Paginate records
      const startAtIndex = (page - 1) * recordsPerPage;
      const endAtIndex = startAtIndex + recordsPerPage;

      const paginatedDocs = querySnapshot.docs.slice(startAtIndex, endAtIndex);

      allUsersTable.innerHTML = ""; // Clear the table before adding rows

      // Loop through each payment history record
      for (const docSnap of paginatedDocs) {
        const paymentData = docSnap.data();
        const userRef = paymentData.userID;
        const {
          amount,
          method,
          nameofAccount,
          numberofAccount,
          typeoftransaction,
          status,
        } = paymentData;

        // Fetch the user document to get the client name
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const clientName = `${userData.display_name} ${userData.lastname}`;

          // Create table row
          const tr = document.createElement("tr");

          // Client Name
          const clientNameTd = document.createElement("td");
          clientNameTd.textContent = clientName;
          tr.appendChild(clientNameTd);

          // Amount
          const amountTd = document.createElement("td");
          amountTd.textContent = amount;
          tr.appendChild(amountTd);

          // Method
          const methodTd = document.createElement("td");
          methodTd.textContent = method;
          tr.appendChild(methodTd);

          // Account Name
          const nameofAccountTd = document.createElement("td");
          nameofAccountTd.textContent = nameofAccount;
          tr.appendChild(nameofAccountTd);

          // Account Number
          const numberofAccountTd = document.createElement("td");
          numberofAccountTd.textContent = numberofAccount;
          tr.appendChild(numberofAccountTd);

          // Transaction Type
          const typeoftransactionTd = document.createElement("td");
          typeoftransactionTd.textContent = typeoftransaction;
          tr.appendChild(typeoftransactionTd);

          // Status
          const statusTd = document.createElement("td");
          statusTd.textContent = status;
          tr.appendChild(statusTd);

          allUsersTable.appendChild(tr);
        } else {
          console.error("No user found for reference: ", userRef.id);
        }
      } updatePaginationControls();
    } catch (error) {
      console.error("Error fetching payment history:", error);
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
    fetchPaymentHistory(currentPage);
  }
});

nextPageBtn.addEventListener("click", () => {
  if (currentPage < totalPages) {
    currentPage++;
    fetchPaymentHistory(currentPage);
  }
});
  // Export to PDF
 // Export to PDF
// Export to PDF
exportPdfBtn.addEventListener("click", () => {
  const { jsPDF } = window.jspdf; // Get jsPDF from the global window object
  const doc = new jsPDF();

  // Add text to the PDF
  doc.text("Payment History", 10, 10);

  // Ensure autoTable is accessible
  if (doc.autoTable) {
    doc.autoTable({
      html: '#allUsers',
      startY: 20, // Adjust position as needed
    });

    // Save the PDF
    doc.save("payment_history.pdf");
  } else {
    console.error("AutoTable is not available. Please check if the library is loaded correctly.");
  }
});




  // Export to Excel
  exportExcelBtn.addEventListener("click", () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.table_to_sheet(allUsersTable);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payment History");
    XLSX.writeFile(workbook, "payment_history.xlsx");
  });

  // Export to Word
  exportWordBtn.addEventListener("click", () => {
    const html = allUsersTable.outerHTML;
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "payment_history.doc";
    a.click();
    URL.revokeObjectURL(url);
  });

  // Initial load of payment history
  fetchPaymentHistory();
});
