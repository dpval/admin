import { db } from "../firebase.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  updateDoc,
  doc
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

  themeToggler.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme-variables");
    themeToggler.querySelector("span:nth-child(1)").classList.toggle("active");
    themeToggler.querySelector("span:nth-child(2)").classList.toggle("active");
  });

  let selectedUserType = "";

  if (closeBtnModal) {
    closeBtnModal.addEventListener("click", () => {
      modal.style.display = "none";
    });
  } else {
    console.error("Close button not found");
  }

  function fetchAndDisplayUsers(searchTerm = "", userType = "") {
    try {
      let userQuery = query(
        collection(db, "users"),
        orderBy("created_time", "desc")
      );

      if (userType) {
        userQuery = query(
          collection(db, "users"),
          where("usertype", "==", userType),
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
            (baranggay && baranggay.toLowerCase().includes(searchTerm.toLowerCase()))
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
      baranggayClearance
    } = user;

    modalDetails.innerHTML = `
      <div class="profile-photo">
        <img src="${photo_url || ''}" alt="Profile Photo" />
      </div>
      <p><b>User Type:</b> ${usertype}</p>
      <div class="details-content">
        <p><b>Name:</b> ${display_name} ${lastname}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone Number:</b> ${phone_number || 'N/A'}</p>
        <p><b>Gender:</b> ${gender || 'N/A'}</p>
        <p><b>Date of Birth:</b> ${dateofbirth ? dateofbirth.toDate().toDateString() : 'N/A'}</p>
        <p><b>Baranggay:</b> ${baranggay || 'N/A'}</p>
        <p><b>Municipality:</b> ${municipality || 'N/A'}</p>
        <p><b>Country:</b> ${country || 'N/A'}</p>
        <p><b>Street Address:</b> ${streetaddress || 'N/A'}</p>
        <p><b>Status:</b> ${firsttimestatus || 'N/A'}</p>
        <p><b>Baranggay Clearance:</b> ${baranggayClearance ? `<a href="${baranggayClearance}" target="_blank">View Document</a>` : 'N/A'}</p>
      </div>
      <div class="modal-actions">
        ${firsttimestatus === "approved" ? `
          <button id="editBtn">Edit</button>
        ` : `
          <button id="approveBtn">Approve</button>
          <button id="disapproveBtn">Disapprove</button>
        `}
      </div>
    `;

    const editBtn = document.getElementById("editBtn");
    const approveBtn = document.getElementById("approveBtn");
    const disapproveBtn = document.getElementById("disapproveBtn");

    if (editBtn) {
      editBtn.addEventListener("click", () => {
        // Hide the Edit button
        editBtn.style.display = "none";

        // Add additional actions for editing
        modalDetails.innerHTML += `
          <div class="modal-actions">
            <button id="holdBtn">Hold</button>
            <button id="blockedBtn">Blocked</button>
          </div>
        `;

        const holdBtn = document.getElementById("holdBtn");
        const blockedBtn = document.getElementById("blockedBtn");

        holdBtn.addEventListener("click", () => updateUserStatus(userId, "hold"));
        blockedBtn.addEventListener("click", () => updateUserStatus(userId, "blocked"));
      });
    }

    if (approveBtn) {
      approveBtn.addEventListener("click", () => updateUserStatus(userId, "approved"));
    }

    if (disapproveBtn) {
      disapproveBtn.addEventListener("click", () => updateUserStatus(userId, "disapproved"));
    }

    modal.style.display = "block";
  }

  async function updateUserStatus(userId, newStatus) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { firsttimestatus: newStatus });
      fetchAndDisplayUsers(searchInput.value.trim(), selectedUserType);
      modal.style.display = "none";
    } catch (error) {
      console.error("Error updating user status: ", error);
    }
  }

  searchBtn.addEventListener("click", () => {
    const searchTerm = searchInput.value.trim();
    fetchAndDisplayUsers(searchTerm, selectedUserType);
  });

  clientBtn.addEventListener("click", () => {
    selectedUserType = "client";
    fetchAndDisplayUsers(searchInput.value.trim(), selectedUserType);
  });

  applicantBtn.addEventListener("click", () => {
    selectedUserType = "applicant";
    fetchAndDisplayUsers(searchInput.value.trim(), selectedUserType);
  });
  

  fetchAndDisplayUsers();
});
