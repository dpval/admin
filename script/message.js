import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const allMessagesTable = document.getElementById("allUsers"); // Corrected ID
  const modal = document.getElementById("myModal");
  const modalDetails = document.getElementById("modalDetails");
  const closeBtnModal = document.getElementsByClassName("close")[0];
  const cancelBtn = document.getElementById("cancelBtn");
  const themeToggler = document.querySelector(".theme-toggler");
    

  themeToggler.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme-variables");
    themeToggler.querySelector("span:nth-child(1)").classList.toggle("active");
    themeToggler.querySelector("span:nth-child(2)").classList.toggle("active");
  });

  // Event listener for modal close button
  closeBtnModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Event listener for cancel button
  cancelBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Fetch all messages
  async function fetchAllMessages() {
    try {
      const q = query(
        collection(db, "admin_messageofusers"),
        orderBy("createdtime", "desc")
      );
      const querySnapshot = await getDocs(q);

      // Clear existing table rows
      allMessagesTable.innerHTML = "";

      querySnapshot.forEach((doc) => {
        const message = doc.data();
        const { display_name, message: userMessage } = message;

        // Create table row
        const tr = document.createElement("tr");

        // Create table cells
        const nameTd = document.createElement("td");
        nameTd.textContent = display_name;

        const messageTd = document.createElement("td");
        messageTd.textContent = userMessage;

        const actionTd = document.createElement("td");
        const replyBtn = document.createElement("button");
        replyBtn.textContent = "Reply";
        replyBtn.classList.add("details-btn");

        // Append reply button to action cell
        actionTd.appendChild(replyBtn);

        // Append cells to row
        tr.appendChild(nameTd);
        tr.appendChild(messageTd);
        tr.appendChild(actionTd);

        // Append row to table body
        allMessagesTable.appendChild(tr);

        // Add event listener for reply button
        replyBtn.addEventListener("click", () => {
          showModal(message);
        });
      });

    } catch (error) {
      console.error("Error fetching all messages: ", error);
    }
  }

  // Show modal with message details
  function showModal(message) {
    // Populate modal with message details
    const { display_name, message: userMessage } = message;

    modalDetails.innerHTML = `
      <p><b>Name:</b> ${display_name}</p>
      <p><b>Message:</b> ${userMessage}</p>
      <textarea id="replyMessage" placeholder="Type your reply here..."></textarea>
    `;

    // Show modal
    modal.style.display = "block";
  }

  // Fetch all messages on page load
  fetchAllMessages();
});
