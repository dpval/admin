import { db } from "../firebase.js"; 
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const allUsersTable = document.getElementById("allUsers");
  const prevPageButton = document.getElementById("prevPage");
  const nextPageButton = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");

  let pageSize = 10; // Number of items per page
  let lastVisible = null; // Track the last document of the current page
  let firstVisible = null; // Track the first document of the current page
  let currentPage = 1; // Track the current page number

  async function fetchSalaryHistory(page = 1) {
    try {
      allUsersTable.innerHTML = ""; // Clear the table before adding rows

      let historyQuery;
      if (page === 1) {
        // Initial page query, order by timestamp and limit the number of results
        historyQuery = query(
          collection(db, "admin_WalletNotification"),
          where("typeofTransaction", "==", "Salary Pay for PostTask"),
          orderBy("currentTime"),
          limit(pageSize)
        );
      } else if (page > 1 && lastVisible) {
        // If navigating to the next page, use `startAfter` to load the next set of results
        historyQuery = query(
          collection(db, "admin_WalletNotification"),
          where("typeofTransaction", "==", "Salary Pay for PostTask"),
          orderBy("currentTime"),
          startAfter(lastVisible),
          limit(pageSize)
        );
      }

      const historySnapshot = await getDocs(historyQuery);

      // Store the first and last visible documents for navigation
      firstVisible = historySnapshot.docs[0];
      lastVisible = historySnapshot.docs[historySnapshot.docs.length - 1];

      // Loop through each document in the snapshot and create table rows
      historySnapshot.forEach(doc => {
        const data = doc.data();
        const formattedDate = formatDate(data.currentTime); // Format the Firestore Timestamp

        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${data.amount}</td>
          <td>${formattedDate}</td>
          <td>${data.type}</td>
          <td>${data.typeofTransaction}</td>
        `;

        allUsersTable.appendChild(row); // Append the row to the table body
      });

      // Update pagination controls
      pageInfo.textContent = `Page ${currentPage}`;
      prevPageButton.disabled = currentPage === 1;
      nextPageButton.disabled = historySnapshot.empty || historySnapshot.docs.length < pageSize;

    } catch (error) {
      console.error("Error fetching salary history:", error);
    }
  }

  // Helper function to format Firestore Timestamp to desired format
  function formatDate(timestamp) {
    const date = new Date(timestamp.seconds * 1000); // Convert Firestore Timestamp to JavaScript Date
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true,
    }).replace(',', ' at'); // Format to "September 18, 2024 at 5:01:03 PM"
  }

  // Pagination controls
  prevPageButton.addEventListener("click", async () => {
    if (currentPage > 1) {
      currentPage--;
      await fetchSalaryHistory(currentPage);
    }
  });

  nextPageButton.addEventListener("click", async () => {
    currentPage++;
    await fetchSalaryHistory(currentPage);
  });

  // Initial fetch
  await fetchSalaryHistory(currentPage);
});
