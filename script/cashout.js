import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  addDoc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const allUsersTable = document.getElementById("allUsers");
  const filterPendingBtn = document.getElementById("filterPending");
  const filterApprovedBtn = document.getElementById("filterApproved");
  const filterDisapprovedBtn = document.getElementById("filterDisapproved");
  const refreshBtn = document.getElementById("refresh");

  // Pagination variables
  let currentPage = 1;
  const recordsPerPage = 9; // Adjust as per your requirement
  let totalPages = 1; // This will be calculated based on the total records

  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");

  // Format Firestore Timestamp into a readable date
  function formatTimestamp(timestamp) {
    const date = timestamp.toDate();
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    };
    return date.toLocaleString("en-US", options);
  }

  // Fetch cash-out requests based on status filter
  async function fetchCashOutRequests(status = null, page = 1) {
    try {
      let cashOutQuery;

      if (status) {
        // Query by status if a filter is applied
        cashOutQuery = query(
          collection(db, "walletTopUp"),
          where("typeoftransaction", "==", "CashOut"),
          where("status", "==", status),
          orderBy("amount", "desc")
        );
      } else {
        // Fetch all records when no status filter is applied
        cashOutQuery = query(
          collection(db, "walletTopUp"),
          where("typeoftransaction", "==", "CashOut"),
          orderBy("amount", "desc")
        );
      }

      const querySnapshot = await getDocs(cashOutQuery);

      const totalRecords = querySnapshot.size; // Get the total number of records
      totalPages = Math.ceil(totalRecords / recordsPerPage); // Calculate total page
      // Paginate records
      const startAtIndex = (page - 1) * recordsPerPage;
      const endAtIndex = startAtIndex + recordsPerPage;

      const paginatedDocs = querySnapshot.docs.slice(startAtIndex, endAtIndex);
      allUsersTable.innerHTML = ""; // Clear the table before adding rows

      // Fetch all related users before processing the cash-out requests
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersMap = new Map();
      usersSnapshot.forEach((userDoc) => {
        usersMap.set(userDoc.id, userDoc.data());
      });

      // Loop through each cash-out request
      for (const docSnap of paginatedDocs) {
        const cashOutData = docSnap.data();
        const cashOutId = docSnap.id;
        const userRef = cashOutData.userID;
        const walletID = cashOutData.walletID;
        const adminID = cashOutData.adminID;
        const {
          amount,
          method,
          nameofAccount,
          numberofAccount,
          note,
          status,
          currentTime,
        } = cashOutData;

        // Get the user data from the map
        const userData = usersMap.get(userRef.id);

        if (userData) {
          const clientName = `${userData.display_name} ${userData.lastname}`;
          const { email } = userData;

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

          // Name of Account
          const nameofAccountTd = document.createElement("td");
          nameofAccountTd.textContent = nameofAccount;
          tr.appendChild(nameofAccountTd);

          // Account Number
          const numberofAccountTd = document.createElement("td");
          numberofAccountTd.textContent = numberofAccount;
          tr.appendChild(numberofAccountTd);

          // Note
          const noteTd = document.createElement("td");
          noteTd.textContent = note;
          tr.appendChild(noteTd);

          // Date (formatted)
          const dateTd = document.createElement("td");
          dateTd.textContent = formatTimestamp(currentTime);
          tr.appendChild(dateTd);

          // Actions: Conditional display of Approve/Disapprove buttons or text
          const actionsTd = document.createElement("td");

          if (status === "pending") {
            // Show Approve and Disapprove buttons for pending status
            const approveBtn = document.createElement("button");
            approveBtn.textContent = "Approve";
            approveBtn.addEventListener("click", async () => {
              const confirmApproval = confirm(
                `Amount: ${amount}\nAre you sure you want to approve this cash-out?`
              );

              if (confirmApproval) {
                await approveCashOut(
                  cashOutId,
                  walletID,
                  adminID,
                  userRef,
                  clientName,
                  email,
                  amount
                );
                alert(`Cash-out approved. Amount deducted: ${amount}.`);
                fetchCashOutRequests("pending"); // Refresh the table after approval
              }
            });

            actionsTd.appendChild(approveBtn);

            const disapproveBtn = document.createElement("button");
            disapproveBtn.textContent = "Disapprove";
            disapproveBtn.addEventListener("click", async () => {
              const confirmDisapproval = confirm(
                "Are you sure you want to disapprove this cash-out?"
              );
              if (confirmDisapproval) {
                await disapproveCashOut(
                  cashOutId,
                  email,
                  method,
                  numberofAccount
                );
                alert("Cash-out disapproved.");
                fetchCashOutRequests("pending"); // Refresh the table after disapproval
              }
            });
            actionsTd.appendChild(disapproveBtn);
          } else if (status === "approved") {
            // Show "Approved" text for approved status
            actionsTd.textContent = "Approved";
          } else if (status === "disapproved") {
            // Show "Disapproved" text for disapproved status
            actionsTd.textContent = "Disapproved";
          }

          tr.appendChild(actionsTd);
          allUsersTable.appendChild(tr);
        } else {
          console.error("No user found for reference: ", userRef);
        }
      }
      updatePaginationControls();
    } catch (error) {
      console.error("Error fetching cash-out requests:", error);
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
      fetchCashOutRequests(null, currentPage);
    }
  });

  nextPageBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchCashOutRequests(null, currentPage);
    }
  });
  // Approve cash-out and update the user's wallet and admin earnings
  // Approve cash-out and update the user's wallet and admin earnings
  async function approveCashOut(
    cashOutId,
    walletID, // Ensure this is either a DocumentReference or a valid path string
    adminID,
    userRef,
    clientName,
    email,
    amount
  ) {
    try {
      // Update cash-out status to "Approved"
      const cashOutRef = doc(db, "walletTopUp", cashOutId);
      await updateDoc(cashOutRef, { status: "approved" });

      // Check if walletID is a DocumentReference or a string path
      let walletRef;
      if (typeof walletID === "object" && walletID.path) {
        // It's a DocumentReference
        walletRef = walletID;
      } else if (typeof walletID === "string") {
        // It's a string, create a DocumentReference
        walletRef = doc(
          db,
          walletID.startsWith("/") ? walletID.slice(1) : walletID
        );
      } else {
        throw new Error("Invalid walletID");
      }

      const walletDoc = await getDoc(walletRef);

      if (walletDoc.exists()) {
        const walletData = walletDoc.data();
        const newBalance = walletData.balance - amount; // Deduct cash-out amount
        await updateDoc(walletRef, { balance: newBalance });
        console.log(
          `Wallet ${walletRef.id} updated. New balance: ${newBalance}`
        );
      } else {
        console.error("No wallet found for user");
      }

      // Create document in /walletNotification collection for user
      const walletNotificationRef = collection(db, "walletNotification");
      await addDoc(walletNotificationRef, {
        currentTime: Timestamp.now(), // Firestore Timestamp for current time
        tokenDeduct: amount,
        type: "Minus",
        typeofTransaction: "Approved CashOut",
        userID: userRef, // Reference to user document
        walletID: walletRef, // Reference to wallet document
      });

      // Create document in /admin_WalletNotification collection
      const adminWalletNotificationRef = collection(
        db,
        "admin_WalletNotification"
      );
      await addDoc(adminWalletNotificationRef, {
        amount: amount, // The cash-out amount
        currentTime: Timestamp.now(), // Firestore Timestamp for current time
        type: "Cash Out",
      });

      // Send email notification for approval
      await sendEmailNotification({
        to: email,
        subject: "Cash-Out Approved",
        message: `Dear ${clientName},<br>Your cash-out of ${amount} TAUken has been approved and deducted from your wallet.`,
      });
    } catch (error) {
      console.error("Error approving cash-out:", error);
    }
  }

  // Disapprove cash-out
  async function disapproveCashOut(cashOutId, email, method, numberofAccount) {
    try {
      // Update cash-out status to "Disapproved"
      const cashOutRef = doc(db, "walletTopUp", cashOutId);
      await updateDoc(cashOutRef, { status: "disapproved" });

      // Send email notification for disapproval
      await sendEmailNotification({
        to: email,
        subject: "Cash-Out Disapproved",
        message: `Dear User,<br>Your cash-out request was disapproved. The admin will process the refund via ${method} to the provided account number: ${numberofAccount}. Please wait for the admin to send the receipt.`,
      });
    } catch (error) {
      console.error("Error disapproving cash-out:", error);
    }
  }

  // Function to send email notification
  async function sendEmailNotification({ to, subject, message }) {
    try {
      // Store the email information in Firestore
      await addDoc(collection(db, "mail"), {
        to: [to], // 'to' field as an array (Firebase requires this)
        subject: subject,
        message: {
          text: message, // Optional plain text version of the message
          html: `<p>${message}</p>`, // HTML version of the message
        },
        timestamp: Timestamp.now(), // Firestore's timestamp for when the email is created
      });

      console.log(
        `Email data stored in Firestore for ${to} with subject: ${subject}`
      );
    } catch (error) {
      console.error("Error storing email in Firestore:", error);
    }
  }

  // Export to PDF
  async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const table = document.getElementById("allUsers");
    const rows = Array.from(table.rows).map((row) =>
      Array.from(row.cells).map((cell) => cell.textContent)
    );

    // Adding rows to the PDF
    rows.forEach((row, index) => {
      doc.text(row.join(" | "), 10, 10 + index * 10);
    });

    doc.save("cash_out_requests.pdf");
  }

  // Export to Excel
  async function exportToExcel() {
    const table = document.getElementById("allUsers");
    const workbook = XLSX.utils.table_to_book(table, {
      sheet: "CashOutRequests",
    });
    XLSX.writeFile(workbook, "cash_out_requests.xlsx");
  }

  // Export to Word
  async function exportToWord() {
    const table = document.getElementById("allUsers");
    let html = table.outerHTML;
    let blob = new Blob([html], {
      type: "application/msword",
    });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "cash_out_requests.doc";
    link.click();
  }

  // Event listeners for export buttons
  document.getElementById("exportPdf").addEventListener("click", exportToPDF);
  document
    .getElementById("exportExcel")
    .addEventListener("click", exportToExcel);
  document.getElementById("exportWord").addEventListener("click", exportToWord);

  // Event listeners for filtering
  filterPendingBtn.addEventListener("click", () => {
    fetchCashOutRequests("pending");
  });

  filterApprovedBtn.addEventListener("click", () => {
    fetchCashOutRequests("approved");
  });

  filterDisapprovedBtn.addEventListener("click", () => {
    fetchCashOutRequests("disapproved");
  });

  refreshBtn.addEventListener("click", () => {
    fetchCashOutRequests(); // Fetch all without filter
  });

  // Initial load of all cash-out requests
  fetchCashOutRequests();
});
