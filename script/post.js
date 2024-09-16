import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  runTransaction,
  collectionGroup,
  addDoc
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

  let currentPostId = ""; // Variable to store the current post ID for approval/disapproval
  let currentUserId = ""; // Variable to store the current user ID

  themeToggler.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme-variables");
    themeToggler.querySelector("span:nth-child(1)").classList.toggle("active");
    themeToggler.querySelector("span:nth-child(2)").classList.toggle("active");
  });

  function showSuccessMessage(message) {
    successMessage.innerText = message;
    successMessage.style.display = "block";
    setTimeout(() => {
      successMessage.style.display = "none";
    }, 2000);
  }

  try {
    const usersCollection = collection(db, "users");
    const q = query(usersCollection, where("usertype", "==", "client"));
    const usersSnapshot = await getDocs(q);

    allPosts.innerHTML = "";

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const clientName = `${userData.display_name} ${userData.lastname}`;
      const postTaskCollection = collection(db, `users/${userDoc.id}/postTask`);
      const postTaskSnapshot = await getDocs(postTaskCollection);

      postTaskSnapshot.forEach((postDoc) => {
        const postData = postDoc.data();
        const row = document.createElement("tr");
        row.innerHTML = `
          <tr>
            <td>${new Date(
              postData.createdtime.seconds * 1000
            ).toLocaleDateString()}</td>
            <td>${clientName}</td>
            <td>${postData.category}</td>
            <td>${postData.subcategory}</td>
            <td>${postData.location}</td>
            <td>${postData.salary}</td>
            <td>${postData.status}</td>
            <td>
              <button class="view-details-btn" data-id="${
                postDoc.id
              }" data-user-id="${userDoc.id}">
                <i class="fas fa-list-alt"></i>
              </button>
            </td>
          </tr>
        `;
        allPosts.appendChild(row);

        // Set currentPostId and currentUserId on button click
        row
          .querySelector(".view-details-btn")
          .addEventListener("click", (event) => {
            currentPostId = event.target
              .closest(".view-details-btn")
              .getAttribute("data-id");
            currentUserId = event.target
              .closest(".view-details-btn")
              .getAttribute("data-user-id");

            showModal(postData); // Show modal with post details
          });
      });
    }
  } catch (error) {
    console.error("Error fetching client posts:", error);
  }

  // Show modal with post details
  function showModal(postData) {
    postImage.src = postData.image;
    postDescription.textContent = postData.description;
    postStartingTime.textContent = new Date(
      postData.startingtime.seconds * 1000
    ).toLocaleString();
    postCategory.textContent = postData.category;
    postSubCategory.textContent = postData.subcategory;

    modal.style.display = "block";
  }

  // Approve the post
  approveBtn.addEventListener("click", async () => {
    console.log("Approve button clicked");
    console.log("currentPostId:", currentPostId);
    console.log("currentUserId:", currentUserId);

    try {
      // Step 1: Approve the post and get the category
      const postRef = doc(db, `users/${currentUserId}/postTask`, currentPostId);
      await updateDoc(postRef, { status: "Approved" });

      const postDoc = await getDoc(postRef);
      let postCategory = postDoc.data().category;

      // Sanitize and normalize postCategory: trim spaces and normalize
      postCategory = postCategory.trim().replace(/\s+/g, " ");
      console.log(
        "Sanitized Post category from the post:",
        `"${postCategory}" (Length: ${postCategory.length})"`
      );

      // Step 2: Query all skills across all users using collectionGroup
      const allSkillsSnapshot = await getDocs(collectionGroup(db, "skills"));
      console.log(
        "Fetching all skill documents from 'skills' subcollections across users..."
      );

      let foundMatch = false;

      allSkillsSnapshot.forEach((doc) => {
        const skillData = doc.data();
        const skillCategory = skillData.category.trim().replace(/\s+/g, " ");

        console.log(
          `Skill category: "${skillCategory}" (Length: ${skillCategory.length}), Post category: "${postCategory}" (Length: ${postCategory.length})`
        );

        if (skillCategory === postCategory) {
          console.log("Found matching skill category:", skillCategory);
          foundMatch = true;

          const userRef = skillData.userref;
          if (!userRef) {
            console.log("No user reference found in this skill document.");
            return;
          }

          getDoc(userRef)
            .then((userDoc) => {
              if (userDoc.exists()) {
                const userEmail = userDoc.data().email;
                console.log(`User email: ${userEmail}`);

                // Send email notification
                sendEmail(
                  userEmail,
                  "New Task Available",
                  `A new task matching your skill (${postCategory}) has been approved.`
                );
                console.log(`Email sent to: ${userEmail}`);
              } else {
                console.log("User document not found for the user reference.");
              }
            })
            .catch((error) => {
              console.error("Error fetching user document:", error);
            });
        }
      });

      if (!foundMatch) {
        console.log("No matching skills found for this category.");
      }

      const userEmail = await getUserEmail(currentUserId);
      sendEmail(userEmail, "Post Approved", "Your post has been approved.");
      console.log(`Email sent to post creator: ${userEmail}`);

      showSuccessMessage("Post approved successfully!");
    } catch (error) {
      console.error("Error approving post:", error);
    }
  });

  // Disapprove the post
  // Disapprove the post
disapproveBtn.addEventListener("click", async () => {
  console.log("Disapprove button clicked");
  console.log("currentPostId:", currentPostId);
  console.log("currentUserId:", currentUserId);

  try {
    // Step 1: Change the post status to "Disapproved"
    const postRef = doc(db, `users/${currentUserId}/postTask`, currentPostId);
    await updateDoc(postRef, { status: "Disapproved" });

    // Step 2: Send email to the post creator
    const userEmail = await getUserEmail(currentUserId); // Get user's email
    sendEmail(
      userEmail,
      "Post Disapproved",
      "Your post has been disapproved."
    );

    // Step 3: Get the post data to access the salary
    const postDoc = await getDoc(postRef);
    if (!postDoc.exists()) {
      throw new Error("Post document does not exist.");
    }

    const postData = postDoc.data();
    const salaryToRefund = postData.salary;

    // Step 4: Get the user's wallet using walletref and refund the salary
    const userRef = doc(db, `users/${currentUserId}`);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new Error("User document does not exist.");
    }

    const walletRef = userDoc.data().walletref; // Assume userDoc has walletref
    if (!walletRef) {
      throw new Error("User does not have a wallet reference.");
    }

    // Fetch the user's wallet
    const walletDoc = await getDoc(walletRef);
    if (!walletDoc.exists()) {
      throw new Error("Wallet document does not exist.");
    }

    const currentBalance = walletDoc.data().balance;

    // Update the wallet's balance by adding the salary back
    const updatedBalance = currentBalance + salaryToRefund;
    await updateDoc(walletRef, { balance: updatedBalance });

    // Step 5: Create a new entry in the walletNotification collection
    const walletNotificationRef = collection(db, "walletNotification");
    await addDoc(walletNotificationRef, {
      currentTime: serverTimestamp(), // Current timestamp
      tokenDeduct: salaryToRefund,    // The salary refunded
      type: "Plus",                   // Type of transaction
      typeofTransaction: "Disapproved Post", // Reason for the transaction
      userID: userRef,                // Reference to the user
      walletID: walletRef             // Reference to the user's wallet
    });

    // Step 6: Show success message and log
    console.log(`Salary of ${salaryToRefund} refunded to user ${currentUserId}`);
    showSuccessMessage("Post disapproved and salary refunded successfully!");
  } catch (error) {
    console.error("Error disapproving post and refunding salary:", error);
  }
});


  async function getUserEmail(userId) {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? userDoc.data().email : null;
  }

  function sendEmail(toEmail, subject, body) {
    fetch("http://localhost:3000/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: toEmail,
        subject: subject,
        message: body,
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

  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });
}

document.addEventListener("DOMContentLoaded", fetchClientPosts);
const ctxPending = document.getElementById('pendingPostsChart').getContext('2d');
new Chart(ctxPending, {
  type: 'doughnut',
  data: {
    labels: ['Pending'],
    datasets: [{
      label: 'Pending Posts',
      data: [10], // Static data
      backgroundColor: ['rgba(75, 192, 192, 0.2)'],
      borderColor: ['rgba(75, 192, 192, 1)'],
      borderWidth: 1
    }]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.label || '';
            if (label) {
              label += ': ' + context.raw;
            }
            return label;
          }
        }
      }
    }
  }
});
const ctxSubmission = document.getElementById('submissionStatusChart').getContext('2d');
new Chart(ctxSubmission, {
  type: 'line',
  data: {
    labels: ['2024-09-01', '2024-09-02', '2024-09-03', '2024-09-04'], // Example dates
    datasets: [
      {
        label: 'Approved',
        data: [5, 10, 7, 15], // Example data
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: false
      },
      {
        label: 'Disapproved',
        data: [2, 3, 4, 6], // Example data
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        fill: false
      },
      {
        label: 'Archived',
        data: [1, 2, 1, 3], // Example data
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 2,
        fill: false
      },
      {
        label: 'Pending',
        data: [3, 7, 5, 10], // Example data
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 2,
        fill: false
      }
    ]
  },
  options: {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day'
        },
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Count'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top'
      }
    }
  }
});
const ctxArchive = document.getElementById('archivePostsChart').getContext('2d');
new Chart(ctxArchive, {
  type: 'bar',
  data: {
    labels: ['Archived', 'Reposted'],
    datasets: [{
      label: 'Archive Posts',
      data: [12, 8], // Example data
      backgroundColor: ['rgba(75, 192, 192, 0.2)', 'rgba(153, 102, 255, 0.2)'],
      borderColor: ['rgba(75, 192, 192, 1)', 'rgba(153, 102, 255, 1)'],
      borderWidth: 1
    }]
  },
  options: {
    responsive: true,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Category'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Count'
        }
      }
    },
    plugins: {
      legend: {
        position: 'top'
      }
    }
  }
});
