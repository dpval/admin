import { db } from "../firebase.js";

import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Functions related to posts
export async function fetchClientPosts() {
  const allPosts = document.getElementById("allUsers");
  const modal = document.getElementById("myModal");
  const closeModal = document.querySelector(".modal .close");
  const postImage = document.getElementById("postImage");
  const postDescription = document.getElementById("postDescription");
  const postStartingTime = document.getElementById("postStartingTime");
  const postCategory = document.getElementById("postCategory");
  const postSubCategory = document.getElementById("postSubCategory");
  const approveBtn = document.querySelector(".approve-btn");
  const disapproveBtn = document.querySelector(".disapprove-btn");
  const successMessage = document.getElementById("successMessage");
  const themeToggler = document.querySelector(".theme-toggler");
    

    themeToggler.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme-variables");
      themeToggler.querySelector("span:nth-child(1)").classList.toggle("active");
      themeToggler.querySelector("span:nth-child(2)").classList.toggle("active");
    });


  let currentPostId = ''; // Variable to store the current post ID for approval/disapproval
  let currentUserId = ''; // Variable to store the current user ID

  // Function to display success message
  function showSuccessMessage(message) {
    successMessage.innerText = message;
    successMessage.style.display = "block";
    setTimeout(() => {
      successMessage.style.display = "none";
    }, 2000);
  }

  // Fetch all posts with usertype 'client' from 'users' -> 'postTask'
  try {
    const usersCollection = collection(db, "users");
    const q = query(usersCollection, where("usertype", "==", "client"));
    const usersSnapshot = await getDocs(q);

    allPosts.innerHTML = "";

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      currentUserId = userDoc.id;
      const clientName = `${userData.display_name} ${userData.lastname}`;
      const postTaskCollection = collection(db, `users/${userDoc.id}/postTask`);
      const postTaskSnapshot = await getDocs(postTaskCollection);

      postTaskSnapshot.forEach((postDoc) => {
        const postData = postDoc.data();
        const row = document.createElement("tr");
        row.innerHTML = `
         <tr>
  <td>${new Date(postData.createdtime.seconds * 1000).toLocaleDateString()}</td>
  <td>${clientName}</td>
  <td>${postData.category}</td>
  <td>${postData.subcategory}</td>
  <td>${postData.location}</td>
  <td>${postData.salary}</td>
  <td>${postData.status}</td>
 <td><button class="view-details-btn" data-id="${postDoc.id}"><i class="fas fa-list-alt"></i></button></td>
       
</tr>

        `;
        allPosts.appendChild(row);

        row.querySelector(".view-details-btn").addEventListener("click", () => {
          showModal(postData, postDoc.id);
        });
      });
    }
  } catch (error) {
    console.error("Error fetching client posts:", error);
  }

  // Show the modal with post details
  function showModal(postData, postId) {
    currentPostId = postId;
    postImage.src = postData.image;
    postDescription.textContent = postData.description;
    postStartingTime.textContent = new Date(postData.startingtime.seconds * 1000).toLocaleString();
    postCategory.textContent = postData.category;
    postSubCategory.textContent = postData.subcategory;

    modal.style.display = "block";
  }



  //TESTING FOR PHPMAILER
  // Approve the post
approveBtn.addEventListener("click", async () => {
  console.log("Approve button clicked");
  console.log("currentPostId:", currentPostId);
  console.log("currentUserId:", currentUserId);
  try {
    const postRef = doc(db, `users/${currentUserId}/postTask`, currentPostId);
    await updateDoc(postRef, { status: "Approved" });

    // Send email notification
    const userEmail = await getUserEmail(currentUserId); // Function to get user email
    sendEmail(userEmail, "Post Approved", "Your post has been approved.");

    showSuccessMessage("Post approved successfully!");
  } catch (error) {
    console.error("Error approving post:", error);
  }
});

// Disapprove the post
disapproveBtn.addEventListener("click", async () => {
  console.log("Disapprove button clicked");
  console.log("currentPostId:", currentPostId);
  console.log("currentUserId:", currentUserId);
  try {
    const postRef = doc(db, `users/${currentUserId}/postTask`, currentPostId);
    await updateDoc(postRef, { status: "Disapproved" });

    // Send email notification
    const userEmail = await getUserEmail(currentUserId); // Function to get user email
    sendEmail(userEmail, "Post Disapproved", "Your post has been disapproved.");

    showSuccessMessage("Post disapproved.");
  } catch (error) {
    console.error("Error disapproving post:", error);
  }
});

// Function to get user email from Firestore
async function getUserEmail(userId) {
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);
  return userDoc.exists() ? userDoc.data().email : null;
}

// Function to send email via PHP
function sendEmail(toEmail, subject, body) {
  fetch("sendEmail.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      toEmail: toEmail,
      subject: subject,
      body: body,
    }),
  })
    .then((response) => response.text())
    .then((data) => {
      console.log("Email sent:", data);
    })
    .catch((error) => {
      console.error("Error sending email:", error);
    });
}


  // Close the modal
  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });
}

// Initialize fetchClientPosts on DOMContentLoaded
document.addEventListener("DOMContentLoaded", fetchClientPosts);
