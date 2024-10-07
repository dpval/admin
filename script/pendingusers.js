import { db } from "../firebase.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  where,
  updateDoc,
  doc,
  addDoc,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const allUsersTable = document.getElementById("allUsers");
  const modal = document.getElementById("myModal");
  const modalDetails = document.getElementById("modalDetails");
  const closeBtnModal = document.getElementById("closeModal");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const clientBtn = document.querySelector('button[data-filter="client"]');
  const applicantBtn = document.querySelector(
    'button[data-filter="applicant"]'
  );
  const themeToggler = document.querySelector(".theme-toggler");
  const paginationControls = document.getElementById("paginationControls");
  const currentPageInfo = document.getElementById("currentPageInfo");

  let currentPage = 1;
  const itemsPerPage = 6;
  let selectedUserType = "";

  if (themeToggler) {
    themeToggler.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme-variables");
      themeToggler
        .querySelector("span:nth-child(1)")
        .classList.toggle("active");
      themeToggler
        .querySelector("span:nth-child(2)")
        .classList.toggle("active");
    });
  }

  if (closeBtnModal) {
    closeBtnModal.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  function fetchAndDisplayUsers(searchTerm = "", userType = "", page = 1) {
    try {
      let userQuery = query(
        collection(db, "users"),
        where("firsttimestatus", "==", "pending"),
        orderBy("created_time", "desc")
      );

      if (userType) {
        userQuery = query(
          collection(db, "users"),
          where("usertype", "==", userType),
          where("firsttimestatus", "==", "pending"),
          orderBy("created_time", "desc")
        );
      }

      onSnapshot(userQuery, (querySnapshot) => {
        const users = [];
        querySnapshot.forEach((doc) => {
          const user = doc.data();
          users.push({ id: doc.id, ...user });
        });

        const filteredUsers = users.filter((user) => {
          const { display_name, lastname, email, baranggay } = user;
          return (
            display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (baranggay &&
              baranggay.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        });

        const totalUsers = filteredUsers.length;
        const totalPages = Math.ceil(totalUsers / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        allUsersTable.innerHTML = "";
        paginatedUsers.forEach((user) => {
          const { display_name, lastname, usertype, email } = user;
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
            showModal(user, user.id);
          });
        });

        renderPaginationControls(totalPages, page);
        currentPageInfo.textContent = `Page ${page} of ${totalPages}`;
      });
    } catch (error) {
      console.error("Error fetching users: ", error);
    }
  }

  function renderPaginationControls(totalPages, currentPage) {
    paginationControls.innerHTML = "";

    const prevBtn = document.createElement("button");
    prevBtn.textContent = "< Previous";
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", () => {
      fetchAndDisplayUsers(
        searchInput.value,
        selectedUserType,
        currentPage - 1
      );
    });
    paginationControls.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement("button");
      pageBtn.textContent = i;
      pageBtn.classList.add("page-btn");
      if (i === currentPage) {
        pageBtn.classList.add("active");
      }
      pageBtn.addEventListener("click", () => {
        fetchAndDisplayUsers(searchInput.value, selectedUserType, i);
      });
      paginationControls.appendChild(pageBtn);
    }

    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next >";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener("click", () => {
      fetchAndDisplayUsers(
        searchInput.value,
        selectedUserType,
        currentPage + 1
      );
    });
    paginationControls.appendChild(nextBtn);
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
            ? `<button id="editBtn">Edit</button>`
            : `<button id="approveBtn">Approve</button><button id="disapproveBtn">Disapprove</button>`
        }
      </div>
    `;

    const editBtn = document.getElementById("editBtn");
    const approveBtn = document.getElementById("approveBtn");
    const disapproveBtn = document.getElementById("disapproveBtn");

    if (editBtn) {
      editBtn.addEventListener("click", () => {
        editBtn.style.display = "none";
      });
    }

    if (approveBtn && disapproveBtn) {
      approveBtn.addEventListener("click", async () => {
        await updateUserStatus(userId, "approved", email, display_name);
        modal.style.display = "none";
      });

      disapproveBtn.addEventListener("click", async () => {
        await updateUserStatus(userId, "disapproved", email, display_name);
        modal.style.display = "none";
      });
    }

    modal.style.display = "block";
  }

  async function updateUserStatus(userId, status, email, displayName) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, { firsttimestatus: status });

    // Store the email information in Firestore
    let subject, text;
    if (status === "approved") {
      subject = "Account Approved";
      text = `Hi ${displayName}, your account has been approved!`;
    } else if (status === "disapproved") {
      subject = "Account Disapproved";
      text = `Hi ${displayName}, your account has been disapproved. Please contact support for more details.`;
    }

    await sendEmail(email, subject, text);
  }

  async function sendEmail(to, subject, text) {
    const message = {
      text: text, // Plain text email content
      html: `<p>${text}</p>`, // HTML version of the same content
    };

    try {
      // Create a new document in the "mail" collection in Firestore
      await addDoc(collection(db, "mail"), {
        to: [to], // 'to' field as an array (Firebase requires this)
        message: message, // 'message' field containing text and HTML
        subject: subject, // 'subject' of the email
        timestamp: Timestamp.now(), // Firestore's timestamp for when the email is created
      });

      console.log("Email data stored in Firestore for:", to);
    } catch (error) {
      console.error("Error storing email in Firestore:", error);
    }
  }

  searchBtn.addEventListener("click", () => {
    const searchTerm = searchInput.value.trim();
    fetchAndDisplayUsers(searchTerm, selectedUserType, currentPage);
  });

  clientBtn.addEventListener("click", () => {
    selectedUserType = "client";
    fetchAndDisplayUsers(searchInput.value, selectedUserType, currentPage);
  });

  applicantBtn.addEventListener("click", () => {
    selectedUserType = "applicant";
    fetchAndDisplayUsers(searchInput.value, selectedUserType, currentPage);
  });

  fetchAndDisplayUsers();
});
