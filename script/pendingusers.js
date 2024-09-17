import { db } from "../firebase.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  updateDoc,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const allUsersTable = document.getElementById("allUsers");
  const modal = document.getElementById("myModal");
  const modalDetails = document.getElementById("modalDetails");
  const closeBtnModal = document.getElementById("closeModal");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const clientBtn = document.querySelector('button[data-filter="client"]');
  const applicantBtn = document.querySelector('button[data-filter="applicant"]');
  const themeToggler = document.querySelector(".theme-toggler");

  // Initialize selectedUserType
  let selectedUserType = "";

  // Check if themeToggler exists
  if (themeToggler) {
    themeToggler.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme-variables");
      themeToggler.querySelector("span:nth-child(1)").classList.toggle("active");
      themeToggler.querySelector("span:nth-child(2)").classList.toggle("active");
    });
  }

  // Check if close button exists
  if (closeBtnModal) {
    closeBtnModal.addEventListener("click", () => {
      modal.style.display = "none";
    });
  } else {
    console.error("Close button not found");
  }

  function fetchAndDisplayUsers(searchTerm = "", userType = "") {
    try {
      // Query to get users with 'firsttimestatus' set to 'pending'
      let userQuery = query(
        collection(db, "users"),
        where("firsttimestatus", "==", "pending"), // Filter users with firsttimestatus = pending
        orderBy("created_time", "desc")
      );

      if (userType) {
        userQuery = query(
          collection(db, "users"),
          where("usertype", "==", userType),
          where("firsttimestatus", "==", "pending"),  // Ensure filtering for pending
          orderBy("created_time", "desc")
        );
      }

      onSnapshot(userQuery, (querySnapshot) => {
        allUsersTable.innerHTML = "";

        querySnapshot.forEach((doc) => {
          const user = doc.data();
          const { display_name, lastname, usertype, email, baranggay } = user;

          if (
            display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (baranggay &&
              baranggay.toLowerCase().includes(searchTerm.toLowerCase()))
          ) {
            const tr = document.createElement("tr");

            const nameTd = document.createElement("td");
            nameTd.textContent = `${display_name} ${lastname}`;

            const usertypeTd = document.createElement("td");
            usertypeTd.textContent = usertype;

            const emailTd = document.createElement("td");
            emailTd.textContent = email;

            const actionTd = document.createElement("td");
            const detailsBtn = document.createElement("button");
            detailsBtn.textContent = "Details";
            detailsBtn.classList.add("details-btn");

            actionTd.appendChild(detailsBtn);

            tr.appendChild(nameTd);
            tr.appendChild(usertypeTd);
            tr.appendChild(emailTd);
            tr.appendChild(actionTd);

            allUsersTable.appendChild(tr);

            detailsBtn.addEventListener("click", () => {
              showModal(user, doc.id);
            });
          }
        });
      });
    } catch (error) {
      console.error("Error fetching users: ", error);
    }
  }

  function showModal(user, userId) {
    const {
      display_name,
      lastname,
      usertype,
      email,
      phone_number,
      gender,
      dateofbirth,
      baranggay,
      municipality,
      country,
      streetaddress,
      firsttimestatus,
      photo_url,
      baranggayClearance,
    } = user;

    modalDetails.innerHTML = `
      <div class="profile-photo">
        <img src="${photo_url || ""}" alt="Profile Photo" />
      </div>
      <p><b>User Type:</b> ${usertype}</p>
      <div class="details-content">
        <p><b>Name:</b> ${display_name} ${lastname}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>First Time:</b> ${firsttimestatus}</p>
        <p><b>Phone Number:</b> ${phone_number || "N/A"}</p>
        <p><b>Gender:</b> ${gender || "N/A"}</p>
        <p><b>Date of Birth:</b> ${
          dateofbirth ? dateofbirth.toDate().toDateString() : "N/A"
        }</p>
        <p><b>Baranggay:</b> ${baranggay || "N/A"}</p>
        <p><b>Municipality:</b> ${municipality || "N/A"}</p>
        <p><b>Country:</b> ${country || "N/A"}</p>
        <p><b>Street Address:</b> ${streetaddress || "N/A"}</p>
        <p><b>Status:</b> ${firsttimestatus || "N/A"}</p>
        <p><b>Baranggay Clearance:</b> ${
          baranggayClearance
            ? `<a href="${baranggayClearance}" target="_blank">View Document</a>`
            : "N/A"
        }</p>
      </div>
      <div class="modal-actions">
        ${
          firsttimestatus === "approved"
            ? `
          <button id="editBtn">Edit</button>
        `
            : `
          <button id="approveBtn">Approve</button>
          <button id="disapproveBtn">Disapprove</button>
        `
        }
      </div>
    `;

    const editBtn = document.getElementById("editBtn");
    const approveBtn = document.getElementById("approveBtn");
    const disapproveBtn = document.getElementById("disapproveBtn");

    if (editBtn) {
      editBtn.addEventListener("click", () => {
        editBtn.style.display = "none";
        modalDetails.innerHTML += `
          <div class="modal-actions">
            <button id="holdBtn">Hold</button>
            <button id="blockedBtn">Blocked</button>
          </div>
        `;
    
        const holdBtn = document.getElementById("holdBtn");
        const blockedBtn = document.getElementById("blockedBtn");
    
        holdBtn.addEventListener("click", async () => {
          await updateUserStatus(userId, "hold");
          modal.style.display = "none"; // Automatically hide modal
        });
    
        blockedBtn.addEventListener("click", async () => {
          await updateUserStatus(userId, "blocked");
          modal.style.display = "none"; // Automatically hide modal
        });
      });
    }

    if (approveBtn) {
      approveBtn.addEventListener("click", async () => {
        await updateUserStatus(userId, "approved");
        modal.style.display = "none"; // Automatically hide modal
      });
    }

    if (disapproveBtn) {
      disapproveBtn.addEventListener("click", async () => {
        await updateUserStatus(userId, "disapproved");
        modal.style.display = "none"; // Automatically hide modal
      });
    }

    modal.style.display = "block";
  }

  async function updateUserStatus(userId, newStatus) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { firsttimestatus: newStatus });

      // Fetch user details for sending email
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const userEmail = userData.email;

      // Send email notification based on the new status
      let subject = "";
      let message = "";

      if (newStatus === "approved") {
        subject = "Your application has been approved!";
        message = `<p>Dear ${userData.display_name},</p>
                       <p>Your application has been approved. You can now proceed to the next steps.</p>`;
      } else if (newStatus === "disapproved") {
        subject = "Your application has been disapproved.";
        message = `<p>Dear ${userData.display_name},</p>
                       <p>We regret to inform you that your application has been disapproved. Please contact support for further information.</p>`;
      }

      // Make a POST request to send an email notification
      await fetch("http://localhost:3000/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: userEmail,
          subject: subject,
          html: message,
        }),
      });

      console.log(`User status updated to: ${newStatus}`);
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  }

  // Event listeners for filtering users
  clientBtn.addEventListener("click", () => {
    selectedUserType = "client";
    fetchAndDisplayUsers("", selectedUserType);
  });

  applicantBtn.addEventListener("click", () => {
    selectedUserType = "applicant";
    fetchAndDisplayUsers("", selectedUserType);
  });

  searchBtn.addEventListener("click", () => {
    const searchTerm = searchInput.value;
    fetchAndDisplayUsers(searchTerm, selectedUserType);
  });

  // Initial fetch
  fetchAndDisplayUsers();
});
