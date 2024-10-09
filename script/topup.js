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
  addDoc,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const allUsersTable = document.getElementById("allUsers");
  const filterPendingBtn = document.getElementById("filterPending");
  const filterApprovedBtn = document.getElementById("filterApproved");
  const filterDisapprovedBtn = document.getElementById("filterDisapproved");
  const refreshBtn = document.getElementById("refresh");
  let currentPage = 1;
  const recordsPerPage = 5; // Adjust as per your requirement
  let totalPages = 1; // This will be calculated later

  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");

  // Fetch wallet top-ups based on status filter
  async function fetchWalletTopUps(status = null, page = 1) {
    try {
      let walletTopUpQuery;

      if (status) {
        // Query by status if a filter is applied
        walletTopUpQuery = query(
          collection(db, "walletTopUp"),
          where("typeoftransaction", "==", "TopUp"),
          where("status", "==", status),
          orderBy("currentTime", "desc")
        );
      } else {
        // Fetch all records when no status filter is applied
        walletTopUpQuery = query(
          collection(db, "walletTopUp"),
          where("typeoftransaction", "==", "TopUp"),
          orderBy("currentTime", "desc")
        );
      }

      const querySnapshot = await getDocs(walletTopUpQuery);

      const totalRecords = querySnapshot.size; // Get the total number of records
      totalPages = Math.ceil(totalRecords / recordsPerPage); // Calculate total pages

      // Paginate records
      const startAtIndex = (page - 1) * recordsPerPage;
      const endAtIndex = startAtIndex + recordsPerPage;

      const paginatedDocs = querySnapshot.docs.slice(startAtIndex, endAtIndex);


      allUsersTable.innerHTML = ""; // Clear the table before adding rows

      // Loop through each top-up entry
      // Loop through each top-up entry
      for (const docSnap of paginatedDocs) {
        const walletData = docSnap.data();
        const walletTopUpId = docSnap.id;
        const userRef = walletData.userID;
        const walletID = walletData.walletID;
        const adminID = walletData.adminID;
        const {
          amount,
          method,
          nameofAccount,
          numberofAccount,
          note,
          recepit,
          status,
          currentTime, // Include currentTime
        } = walletData;

        // Fetch the user document to get the display_name, lastname, and email
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
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

          // Receipt (Link to the image, opens in a new tab)
          const receiptTd = document.createElement("td");
          const receiptLink = document.createElement("a");
          receiptLink.href = recepit;
          receiptLink.textContent = "View Receipt";
          receiptLink.target = "_blank";
          receiptTd.appendChild(receiptLink);
          tr.appendChild(receiptTd);

          // Date
          const dateTd = document.createElement("td");
          // Format the currentTime to a readable format
          const formattedDate = currentTime.toDate().toLocaleString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            hour12: true,
          });
          dateTd.textContent = formattedDate; // Set the formatted date
          tr.appendChild(dateTd);

          // Actions: Conditional display of Approve/Disapprove buttons or text
          const actionsTd = document.createElement("td");

          if (status === "pending") {
            // Show Approve and Disapprove buttons for pending status
            const approveBtn = document.createElement("button");
            approveBtn.textContent = "Approve";
            approveBtn.addEventListener("click", async () => {
              const deduction = amount * 0.05; // 5% deduction
              const finalAmount = amount - deduction;
              const confirmApproval = confirm(
                `Amount: ${amount}\nDeduct 5%: ${deduction}\nFinal Amount: ${finalAmount}\nAre you sure you want to approve?`
              );

              if (confirmApproval) {
                await approveTopUp(
                  walletTopUpId,
                  walletID,
                  adminID,
                  userRef,
                  finalAmount,
                  deduction,
                  clientName,
                  email,
                  amount
                );
                alert(
                  `Top-up approved. Amount added to wallet: ${finalAmount}. 5% (${deduction}) sent to admin earnings.`
                );
                fetchWalletTopUps("pending"); // Refresh the table after approval
              }
            });

            actionsTd.appendChild(approveBtn);

            const disapproveBtn = document.createElement("button");
            disapproveBtn.textContent = "Disapprove";
            disapproveBtn.addEventListener("click", async () => {
              const confirmDisapproval = confirm(
                "Are you sure you want to disapprove this top-up?"
              );
              if (confirmDisapproval) {
                await disapproveTopUp(
                  walletTopUpId,
                  email,
                  method,
                  numberofAccount
                );
                alert("Top-up disapproved.");
                fetchWalletTopUps("pending"); // Refresh the table after disapproval
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
          console.error("No user found for reference: ", userRef.id);
        }
      }updatePaginationControls();
    } catch (error) {
      console.error("Error fetching wallet top-ups:", error);
    }
  }
   // Update pagination controls based on current state
   function updatePaginationControls() {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
  }

  // Event listeners for pagination buttons
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      fetchWalletTopUps(null, currentPage);
    }
  });

  nextPageBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchWalletTopUps(null, currentPage);
    }
  });


  // Approve top-up and update the user's wallet and admin earnings  // Approve top-up and update the user's wallet and admin earnings
  // Approve top-up and update the user's wallet and admin earnings
  async function approveTopUp(
    walletTopUpId,
    walletID,
    adminID,
    userRef,
    finalAmount,
    deduction,
    clientName,
    email,
    amount
  ) {
    try {
      // Update top-up status to "Approved"
      const topUpRef = doc(db, "walletTopUp", walletTopUpId);
      await updateDoc(topUpRef, { status: "approved" });

      // Update user's wallet balance using the walletID from walletTopUp collection
      const walletRef = doc(db, walletID.path);
      const walletDoc = await getDoc(walletRef);

      if (walletDoc.exists()) {
        const walletData = walletDoc.data();
        const newBalance = walletData.balance + finalAmount;
        await updateDoc(walletRef, { balance: newBalance });
      } else {
        console.error("No wallet found for user");
      }

      // Update admin cash fund using adminID reference
      const adminCashRef = doc(db, adminID.path);
      const adminCashDoc = await getDoc(adminCashRef);

      if (adminCashDoc.exists()) {
        const adminData = adminCashDoc.data();
        const newEarnings = adminData.earnings + deduction;
        await updateDoc(adminCashRef, { earnings: newEarnings });
      } else {
        console.error("No admin earnings record found");
      }

      // Create document in /walletNotification collection for user
      const walletNotificationRef = collection(db, "walletNotification");
      await addDoc(walletNotificationRef, {
        currentTime: Timestamp.now(), // Firestore Timestamp for current time
        tokenDeduct: finalAmount,
        type: "Plus",
        typeofTransaction: "Approved TopUp",
        userID: userRef, // Reference to user document
        walletID: walletRef, // Reference to wallet document
      });

      // Create document in /admin_WalletNotification collection
      const adminWalletNotificationRef = collection(
        db,
        "admin_WalletNotification"
      );
      await addDoc(adminWalletNotificationRef, {
        amount: deduction, // The 5% deduction
        currentTime: Timestamp.now(), // Firestore Timestamp for current time
        type: "Top Up",
      });

      // Send email notification for approval
      await sendEmailNotification({
        to: email,
        subject: "Top-Up Approved",
        message: `Dear ${clientName},<br>Your top-up of ${amount} has been approved. After a 5% deduction, a total of ${finalAmount} TAUken has been added to your wallet.`,
      });
    } catch (error) {
      console.error("Error approving top-up:", error);
    }
  }

  // Disapprove top-up
  async function disapproveTopUp(
    walletTopUpId,
    email,
    method,
    numberofAccount
  ) {
    try {
      // Update top-up status to "Disapproved"
      const topUpRef = doc(db, "walletTopUp", walletTopUpId);
      await updateDoc(topUpRef, { status: "disapproved" });

      // Send email notification for disapproval
      await sendEmailNotification({
        to: email,
        subject: "Top-Up Disapproved",
        message: `Dear User,<br>Your top-up request was disapproved. The admin will send the amount via ${method} to the provided account number: ${numberofAccount}. Please wait for the admin to send the receipt.`,
      });
    } catch (error) {
      console.error("Error disapproving top-up:", error);
    }
  }

  // Function to send email notification
  async function sendEmailNotification({ to, subject, message }) {
    try {
      // Create the email message in HTML format
      const emailMessage = `<p>${message}</p>`; // Simple HTML message

      // Store the email information in Firestore
      await addDoc(collection(db, "mail"), {
        to: [to], // 'to' field as an array (Firebase requires this)
        subject: subject,
        message: {
          text: message, // Plain text version of the message
          html: emailMessage, // HTML version of the message
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

  // Filter and Refresh button event listeners
  filterPendingBtn.addEventListener("click", () =>
    fetchWalletTopUps("pending")
  );
  filterApprovedBtn.addEventListener("click", () =>
    fetchWalletTopUps("approved")
  );
  filterDisapprovedBtn.addEventListener("click", () =>
    fetchWalletTopUps("disapproved")
  );
  refreshBtn.addEventListener("click", () => fetchWalletTopUps());

  // Function to export to Word
  function exportToWord() {
    const table = document.querySelector("table").outerHTML;
    const blob = new Blob(
      [
        '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' +
          table +
          "</body></html>",
      ],
      {
        type: "application/msword",
      }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wallet_top_up_list.doc";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Function to export to Excel
  function exportToExcel() {
    const table = document.querySelector("table").outerHTML;
    const blob = new Blob(["\uFEFF" + table], {
      type: "application/vnd.ms-excel",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wallet_top_up_list.xls";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Add event listener for the button

  document.getElementById("exportWord").addEventListener("click", exportToWord);
  document
    .getElementById("exportExcel")
    .addEventListener("click", exportToExcel);

  // Initial fetch to show all data
  fetchWalletTopUps();
});
