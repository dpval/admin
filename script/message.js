import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  addDoc,
  Timestamp,
  deleteDoc,
  orderBy,
  limit,
  startAfter
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const allMessagesTable = document.getElementById("allUsers");
  const emailModal = document.getElementById("emailModal");
  const emailSubjectInput = document.getElementById("emailSubject");
  const emailMessageTextarea = document.getElementById("emailMessage");
  const sendEmailBtn = document.getElementById("sendEmailBtn");
  const closeModalBtn = document.getElementsByClassName("close")[0];
  const cancelBtn = document.getElementById("cancelBtn");

  // Pagination elements
  const prevPageButton = document.getElementById("prevPage");
  const nextPageButton = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");

  let currentEmail = ""; // Store current email and name for sending
  let currentClientName = "";

  let pageSize = 5; // Number of messages per page
  let lastVisible = null; // Track the last document of the current page
  let firstVisible = null; // Track the first document for previous button
  let currentPage = 1; // Track the current page

  // Show the modal
  function showModal(email, clientName) {
    currentEmail = email;
    currentClientName = clientName;
    emailModal.style.display = "block";
  }

  // Close the modal
  function closeModal() {
    emailModal.style.display = "none";
  }

  // Fetch all messages from Firestore with pagination
  async function fetchAllMessages(page = 1, direction = 'next') {
    try {
      allMessagesTable.innerHTML = ""; // Clear existing table rows

      let q;
      if (direction === 'next') {
        if (page === 1) {
          // First page query, ordered by createdtime
          q = query(collection(db, "admin_messageofusers"), orderBy("createdtime", "desc"), limit(pageSize));
        } else {
          // For next pages, use `startAfter`
          q = query(collection(db, "admin_messageofusers"), orderBy("createdtime", "desc"), startAfter(lastVisible), limit(pageSize));
        }
      } else if (direction === 'prev' && firstVisible) {
        // For previous page, use the firstVisible to go back
        q = query(collection(db, "admin_messageofusers"), orderBy("createdtime", "desc"), startAfter(firstVisible), limit(pageSize));
      }

      const querySnapshot = await getDocs(q);

      // Track the first and last visible document for pagination
      firstVisible = querySnapshot.docs[0];
      lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

      // Render messages to the table
      for (const docSnap of querySnapshot.docs) {
        const messageData = docSnap.data();
        const userRef = messageData.sender; // Reference to /users/{userId}

        // Fetch the user document
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const { display_name, lastname, email } = userData;
          const userMessage = messageData.message;

          // Create table row
          const tr = document.createElement("tr");
          const nameTd = document.createElement("td");
          nameTd.textContent = `${display_name} ${lastname}`;

          const messageTd = document.createElement("td");
          messageTd.textContent = userMessage;

          const actionTd = document.createElement("td");

          // Create Reply button with Pencil Icon
          const replyBtn = document.createElement("button");
          replyBtn.innerHTML = '<i class="fa fa-pencil" style="color:orange"></i>'; // Assuming FontAwesome is used for the pencil icon
          replyBtn.classList.add("details-btn");

          // Create Delete button with Trash Icon
          const deleteBtn = document.createElement("button");
          deleteBtn.innerHTML = '<i class="fa fa-trash" style="color:red"></i>'; // Assuming FontAwesome is used for the trash icon
          deleteBtn.classList.add("delete-btn");

          // Append buttons to action cell
          actionTd.appendChild(replyBtn);
          actionTd.appendChild(deleteBtn);
          tr.appendChild(nameTd);
          tr.appendChild(messageTd);
          tr.appendChild(actionTd);

          allMessagesTable.appendChild(tr); // Append row to table body

          // Add event listener for reply button to show the modal
          replyBtn.addEventListener("click", () => {
            emailSubjectInput.value = "Concern in Mobile App"; // Set predefined subject
            emailMessageTextarea.value =
              "Thank you for your message. We will get back to you shortly."; // Predefined message
            showModal(email, `${display_name} ${lastname}`);
          });

          // Add event listener for delete button to delete message
          deleteBtn.addEventListener("click", async () => {
            if (confirm(`Are you sure you want to delete the message from ${display_name} ${lastname}?`)) {
              await deleteDoc(doc(db, "admin_messageofusers", docSnap.id));
              alert("Message deleted successfully.");
              fetchAllMessages(currentPage); // Refresh the table after deletion
            }
          });
        }
      }

      // Update pagination controls
      pageInfo.textContent = `Page ${currentPage}`;
      prevPageButton.disabled = currentPage === 1;
      nextPageButton.disabled = querySnapshot.docs.length < pageSize;
    } catch (error) {
      console.error("Error fetching all messages:", error);
      alert("Failed to fetch messages. Please check the console for details.");
    }
  }

  // Event listener for pagination
  prevPageButton.addEventListener("click", async () => {
    if (currentPage > 1) {
      currentPage--;
      await fetchAllMessages(currentPage, 'prev');
    }
  });

  nextPageButton.addEventListener("click", async () => {
    currentPage++;
    await fetchAllMessages(currentPage, 'next');
  });

  // Send email via server
  async function sendEmailNotification(toEmail, clientName, subject, message) {
    try {
      // Create the email message in HTML format
      const emailMessage = `<p>Dear ${clientName},</p><p>${message}</p>`;

      // Store the email information in Firestore
      await addDoc(collection(db, "mail"), {
        to: [toEmail], // 'to' field as an array (Firebase requires this)
        subject: subject,
        message: {
          text: message, // Optional plain text version of the message
          html: emailMessage, // HTML version of the message
        },
        timestamp: Timestamp.now(), // Firestore's timestamp for when the email is created
      });

      console.log(
        `Email data stored in Firestore for ${toEmail} with subject: ${subject}`
      );
      alert(`Email sent successfully to ${toEmail}`);

      closeModal(); // Close the modal after sending email
    } catch (error) {
      console.error("Error storing email in Firestore:", error);
      alert("An error occurred while sending the email.");
    }
  }

  // Event listener for send email button in the modal
  sendEmailBtn.addEventListener("click", async () => {
    const subject = emailSubjectInput.value;
    const message = emailMessageTextarea.value;
    await sendEmailNotification(
      currentEmail,
      currentClientName,
      subject,
      message
    );
  });

  // Event listeners to close modal
  closeModalBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  fetchAllMessages(); // Fetch the first page of messages on page load
});
