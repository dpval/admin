import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  addDoc,
  Timestamp,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const allMessagesTable = document.getElementById("allUsers");
  const emailModal = document.getElementById("emailModal");
  const emailSubjectInput = document.getElementById("emailSubject");
  const emailMessageTextarea = document.getElementById("emailMessage");
  const sendEmailBtn = document.getElementById("sendEmailBtn");
  const closeModalBtn = document.getElementsByClassName("close")[0];
  const cancelBtn = document.getElementById("cancelBtn");

  let currentEmail = ""; // Store current email and name for sending
  let currentClientName = "";

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

  // Fetch all messages from Firestore
  async function fetchAllMessages() {
    try {
      const q = query(
        collection(db, "admin_messageofusers"),
        orderBy("createdtime", "desc")
      );
      const querySnapshot = await getDocs(q);

      allMessagesTable.innerHTML = ""; // Clear existing table rows

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
          const replyBtn = document.createElement("button");
          replyBtn.textContent = "Reply";
          replyBtn.classList.add("details-btn");

          actionTd.appendChild(replyBtn); // Append reply button to action cell
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
        }
      }
    } catch (error) {
      console.error("Error fetching all messages:", error);
      alert("Failed to fetch messages. Please check the console for details.");
    }
  }

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

  fetchAllMessages(); // Fetch all messages on page load
});
