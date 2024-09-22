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
  addDoc,
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

  // Check if the themeToggler exists before attaching the event listener
  if (themeToggler) {
    themeToggler.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme-variables");
      themeToggler.querySelector("span:nth-child(1)").classList.toggle("active");
      themeToggler.querySelector("span:nth-child(2)").classList.toggle("active");
    });
  }

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

      // Filter posts where status is "pending"
      const pendingPostsQuery = query(postTaskCollection, where("status", "==", "Pending"));
      const postTaskSnapshot = await getDocs(pendingPostsQuery);

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
            <td>
              <button class="view-details-btn" data-id="${postDoc.id}" data-user-id="${userDoc.id}">
                <i class="fas fa-list-alt"></i>
              </button>
            </td>
          </tr>
        `;
        allPosts.appendChild(row);

        // Set currentPostId and currentUserId on button click
        row.querySelector(".view-details-btn").addEventListener("click", (event) => {
          currentPostId = event.target.closest(".view-details-btn").getAttribute("data-id");
          currentUserId = event.target.closest(".view-details-btn").getAttribute("data-user-id");

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
    postStartingTime.textContent = new Date(postData.startingtime.seconds * 1000).toLocaleString();
    postCategory.textContent = postData.category;
    postSubCategory.textContent = postData.subcategory;

    modal.style.display = "block";
  }

  // Approve the post
  approveBtn?.addEventListener("click", async () => {
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
      console.log("Sanitized Post category from the post:", `"${postCategory}" (Length: ${postCategory.length})"`);

      // Step 2: Query all skills across all users using collectionGroup
      const allSkillsSnapshot = await getDocs(collectionGroup(db, "skills"));
      console.log("Fetching all skill documents from 'skills' subcollections across users...");

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
  disapproveBtn?.addEventListener("click", async () => {
    console.log("Disapprove button clicked");
    console.log("currentPostId:", currentPostId);
    console.log("currentUserId:", currentUserId);

    try {
      // Step 1: Change the post status to "Disapproved"
      const postRef = doc(db, `users/${currentUserId}/postTask`, currentPostId);
      await updateDoc(postRef, { status: "Disapproved" });

      // Step 2: Send email to the post creator
      const userEmail = await getUserEmail(currentUserId); // Get user's email
      sendEmail(userEmail, "Post Disapproved", "Your post has been disapproved.");

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

      // Fetch the user's wallet data
      await runTransaction(db, async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        if (!walletDoc.exists()) {
          throw new Error("Wallet document does not exist.");
        }

        const walletData = walletDoc.data();
        const currentBalance = walletData.balance;

        // Step 5: Refund the salary to the user's wallet
        const newBalance = currentBalance + salaryToRefund;
        transaction.update(walletRef, { balance: newBalance });

        // Step 6: Add a wallet notification
        const walletNotificationRef = collection(db, "walletNotification");
        await addDoc(walletNotificationRef, {
          balance: salaryToRefund,
          description: "Salary refund from disapproved post",
          userID: currentUserId,
          createdtime: serverTimestamp(),
        });
      });

      showSuccessMessage("Post disapproved, and salary refunded successfully!");
    } catch (error) {
      console.error("Error disapproving post:", error);
    }
  });

  // Close modal event
  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // Function to send email via Node.js backend
  function sendEmail(to, subject, text) {
    fetch("http://localhost:3000/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, subject, text }),
    })
      .then((response) => {
        if (response.ok) {
          console.log("Email sent successfully");
        } else {
          console.error("Failed to send email:", response.statusText);
        }
      })
      .catch((error) => {
        console.error("Error sending email:", error);
      });
  }

  // Helper function to get user email
  async function getUserEmail(userId) {
    const userRef = doc(db, `users/${userId}`);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data().email;
    }
    throw new Error("User document does not exist.");
  }
  // Function to export data to PDF
function exportToPDF(posts) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Client Posts", 10, 10);
  posts.forEach((post, index) => {
    doc.text(`Post ${index + 1}: ${post.category}, ${post.location}, ${post.salary}`, 10, 20 + index * 10);
  });
  
  doc.save("client_posts.pdf");
}

// Function to export data to Word
function exportToWord(posts) {
  const doc = new window.docx.Document();
  const tableRows = posts.map(post => [
    new window.docx.TableCell({ text: post.category }),
    new window.docx.TableCell({ text: post.location }),
    new window.docx.TableCell({ text: post.salary }),
  ]);

  const table = new window.docx.Table({
    rows: tableRows,
  });

  doc.addSection({ children: [table] });

  window.docx.Packer.toBlob(doc).then((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = "client_posts.docx";
    link.click();
  });
}

// Function to export data to Excel
function exportToExcel(posts) {
  const ws = XLSX.utils.json_to_sheet(posts);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Client Posts");

  XLSX.writeFile(wb, "client_posts.xlsx");
}

// Add event listeners for export buttons
document.addEventListener("DOMContentLoaded", () => {
  fetchClientPosts();
  
  // Add event listeners for export buttons here
  document.getElementById("exportPdf")?.addEventListener("click", () => {
    const posts = getPostsData(); // Implement this function to retrieve the current posts data
    exportToPDF(posts);
  });

  document.getElementById("exportWord")?.addEventListener("click", () => {
    const posts = getPostsData(); // Implement this function to retrieve the current posts data
    exportToWord(posts);
  });

  document.getElementById("exportExcel")?.addEventListener("click", () => {
    const posts = getPostsData(); // Implement this function to retrieve the current posts data
    exportToExcel(posts);
  });
});

function getPostsData() {
  const rows = document.querySelectorAll("#allUsers tr");
  const posts = [];

  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    if (cells.length) {
      posts.push({
        createdTime: cells[0].innerText,
        clientName: cells[1].innerText,
        category: cells[2].innerText,
        subcategory: cells[3].innerText,
        location: cells[4].innerText,
        salary: cells[5].innerText,
        status: cells[6].innerText,
      });
    }
  });

  return posts;
}

}

document.addEventListener("DOMContentLoaded", fetchClientPosts);
