import { db } from "../firebase.js";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const sideMenu = document.querySelector("aside");
  const menuBtn = document.querySelector("#menu_bar");
  const closeMenuBtn = document.querySelector("#close_btn");
  const themeToggler = document.querySelector(".theme-toggler");
  const dateLabel = document.getElementById("dateLabel");
  const totalApplicants = document.getElementById("totalApplicants");
  const totalClients = document.getElementById("totalClients");
  const totalGigWorkers = document.getElementById("totalGigWorkers"); // Added for gig workers
  const recentJoinUpdates = document.getElementById("recentJoinUpdates");
  const recentApplications = document.getElementById("recentApplications");
  const modal = document.getElementById("myModal");
  const modalDetails = document.getElementById("modalDetails");
  const closeBtnModal = document.getElementsByClassName("close")[0];
  const totalUsersElement = document.getElementById("totalUsers");
  let currentUserId = null;

  // Event listeners
  menuBtn.addEventListener("click", () => {
    sideMenu.style.display = "block";
  });

  closeMenuBtn.addEventListener("click", () => {
    sideMenu.style.display = "none";
  });

  themeToggler.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme-variables");
    themeToggler.querySelector("span:nth-child(1)").classList.toggle("active");
    themeToggler.querySelector("span:nth-child(2)").classList.toggle("active");
  });

  // Function to format the date and time
  function updateDateTime() {
    const now = new Date();
    
    // Options for date formatting
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

    const date = now.toLocaleDateString(undefined, dateOptions);
    const time = now.toLocaleTimeString(undefined, timeOptions);

    // Update the label with formatted date and time
    document.getElementById('dateLabel').textContent = `Today: ${date} Time is ${time}`;
  }

  // Update the date and time every second
  setInterval(updateDateTime, 1000);

  // Initial call to display date and time immediately on page load
  updateDateTime();
  
  // Modal functionality
  closeBtnModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Set the date label to today's date
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  const todayDate = `${year}-${month}-${day}`;
  dateLabel.textContent = todayDate;

  // Real-time listener for total users count
  function listenToTotalUsers() {
    const usersCollection = collection(db, "users");
    onSnapshot(usersCollection, (snapshot) => {
      totalUsersElement.textContent = snapshot.size;
    }, (error) => {
      console.error("Error fetching total users: ", error);
    });
  }

  // Real-time listener for applicant count
  function listenToApplicantCount() {
    const q = query(collection(db, "users"), where("usertype", "==", "applicant"));
    onSnapshot(q, (snapshot) => {
      totalApplicants.textContent = snapshot.size;
    }, (error) => {
      console.error("Error fetching applicant count: ", error);
    });
  }

  // Real-time listener for client count
  function listenToClientCount() {
    const q = query(collection(db, "users"), where("usertype", "==", "client"));
    onSnapshot(q, (snapshot) => {
      totalClients.textContent = snapshot.size;
    }, (error) => {
      console.error("Error fetching client count: ", error);
    });
  }

  // Real-time listener for gig worker count
  function listenToGigWorkerCount() {
    const q = query(collection(db, "users"), where("usertype", "==", "applicant")); // Adjust if different field
    onSnapshot(q, (snapshot) => {
      totalGigWorkers.textContent = snapshot.size;
    }, (error) => {
      console.error("Error fetching gig worker count: ", error);
    });
  }

  // Real-time listener for recent joins
  function listenToRecentJoins() {
    const q = query(collection(db, "users"), orderBy("created_time", "desc"), limit(3));
    onSnapshot(q, (snapshot) => {
      recentJoinUpdates.innerHTML = "";

      snapshot.forEach((doc) => {
        const user = doc.data();
        const { display_name, usertype, photo_url, created_time } = user;

        // Calculate time ago
        const timeAgo = getTimeAgoString(created_time.toDate());

        // Create update elements
        const updateDiv = document.createElement("div");
        updateDiv.classList.add("update");

        const profilePhotoDiv = document.createElement("div");
        profilePhotoDiv.classList.add("profile-photo");
        const profilePhotoImg = document.createElement("img");
        profilePhotoImg.src = photo_url || "./images/default-profile-photo.jpg"; // Default photo if no URL

        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message");
        const messageContent = `<p><b>${display_name}</b> joined as <b>${usertype}</b></p><small>${timeAgo}</small>`;
        messageDiv.innerHTML = messageContent;

        // Append elements
        profilePhotoDiv.appendChild(profilePhotoImg);
        updateDiv.appendChild(profilePhotoDiv);
        updateDiv.appendChild(messageDiv);
        recentJoinUpdates.appendChild(updateDiv);
      });
    }, (error) => {
      console.error("Error fetching recent joins: ", error);
    });
  }

  // Real-time listener for recent applications
  function listenToRecentApplications() {
    const q = query(collection(db, "users"), where("firsttimestatus", "==", "pending"), orderBy("created_time", "desc"));
    onSnapshot(q, (snapshot) => {
      recentApplications.innerHTML = "";

      snapshot.forEach((doc) => {
        const user = doc.data();
        const { display_name, lastname, usertype, email, firsttimestatus } = user;

        // Create table row
        const tr = document.createElement("tr");

        // Create table cells
        const nameTd = document.createElement("td");
        nameTd.textContent = `${display_name} ${lastname}`;

        const usertypeTd = document.createElement("td");
        usertypeTd.textContent = usertype;

        const emailTd = document.createElement("td");
        emailTd.textContent = email;

        const statusTd = document.createElement("td");
        statusTd.classList.add("warning");
        statusTd.textContent = firsttimestatus;

        const actionTd = document.createElement("td");
        actionTd.classList.add("primary");
        actionTd.textContent = "Details";

        // Append cells to row
        tr.appendChild(nameTd);
        tr.appendChild(usertypeTd);
        tr.appendChild(emailTd);
        tr.appendChild(statusTd);
        tr.appendChild(actionTd);

        // Append row to table body
        recentApplications.appendChild(tr);

        // Add event listener for the "Details" button
        actionTd.addEventListener("click", () => {
          showModal(doc.id, user);
        });
      });
    }, (error) => {
      console.error("Error fetching recent applications: ", error);
    });
  }

  // Show modal with user details
  function showModal(userId, user) {
    currentUserId = userId;
    const {
      display_name, lastname, usertype, email, phone_number, gender,
      dateofbirth, baranggay, municipality, country, streetaddress, 
      status, photo_url, baranggayClearance
    } = user;

    modalDetails.innerHTML = `
      <p><b>Name:</b> ${display_name} ${lastname}</p>
      <p><b>Type:</b> ${usertype}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Phone:</b> ${phone_number}</p>
      <p><b>Gender:</b> ${gender}</p>
      <p><b>Date of Birth:</b> ${dateofbirth.toDate().toLocaleDateString()}</p>
      <p><b>Address:</b> ${streetaddress}, ${baranggay}, ${municipality}, ${country}</p>
      <p><b>Status:</b> ${status}</p>
      ${photo_url ? `<img src="${photo_url}" alt="Profile Photo" class="modal-photo">` : ''}
      ${baranggayClearance ? `<img src="${baranggayClearance}" alt="Barangay Clearance" class="modal-photo">` : ''}
    `;

    modal.style.display = "block";
  }

  // Calculate time ago string
  function getTimeAgoString(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    const interval = Math.floor(seconds / 31536000);

    if (interval > 1) return `${interval} years ago`;
    if (interval === 1) return `1 year ago`;

    const months = Math.floor(seconds / 2592000);
    if (months > 1) return `${months} months ago`;
    if (months === 1) return `1 month ago`;

    const days = Math.floor(seconds / 86400);
    if (days > 1) return `${days} days ago`;
    if (days === 1) return `1 day ago`;

    const hours = Math.floor(seconds / 3600);
    if (hours > 1) return `${hours} hours ago`;
    if (hours === 1) return `1 hour ago`;

    const minutes = Math.floor(seconds / 60);
    if (minutes > 1) return `${minutes} minutes ago`;
    if (minutes === 1) return `1 minute ago`;

    return `${Math.floor(seconds)} seconds ago`;
  }

  // Initialize listeners
  listenToTotalUsers();
  listenToApplicantCount();
  listenToClientCount();
  listenToGigWorkerCount(); // Added for gig workers
  listenToRecentJoins();
  listenToRecentApplications();
});
