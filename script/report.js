import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  getDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Function to generate stars based on review rating
function generateStars(rating) {
  const validRating = Math.max(1, Math.min(Math.round(Number(rating)), 5));
  return `
    <div class="stars">
      ${Array.from({ length: 5 }, (_, i) =>
        `<span style="color: ${i < validRating ? "#f1c40f" : "#bdc3c7"};">★</span>`
      ).join("")}
    </div>
  `;
}

// Function to show or hide loading spinner
function toggleLoading(isLoading) {
  const loadingSpinner = document.getElementById("loadingSpinner");
  loadingSpinner.style.display = isLoading ? "block" : "none";
}

// Function to get all users
async function getUsers() {
  const usersRef = collection(db, "users");
  const querySnapshot = await getDocs(usersRef);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Function to fetch user details by reference path
async function getUserDetails(userRefPath) {
  try {
    const uid = userRefPath.split('/').pop();
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        displayName: `${userData.display_name || "Anonymous"} ${userData.lastname || ""}`,
        userType: userData.usertype || "Unknown User" // Fetching usertype directly
      };
    }
  } catch (error) {
    console.error("Error fetching user details:", error);
  }
  return { displayName: "Unknown User", userType: "Unknown" };
}

// Function to fetch reviews for a user
async function getReviews(uid) {
  const reviewRef = collection(db, `users/${uid}/review`);
  const reviewSnapshot = await getDocs(reviewRef);
  return reviewSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Function to display reviews in a table
async function displayReviews() {
  toggleLoading(true);
  
  const reviewsTableBody = document.getElementById("reviewsTableBody");
  reviewsTableBody.innerHTML = ""; // Clear existing content

  try {
    const users = await getUsers();
    const usersWithReviews = [];

    // Loop through each user to fetch their reviews
    for (const user of users) {
      const { id: uid } = user; // Extract uid
      const reviews = await getReviews(uid);

      // Only proceed if the user has reviews
      if (reviews.length > 0) {
        const latestReviews = await Promise.all(reviews.map(async review => {
          const { 
            commment = "No comment", 
            rating = 0, 
            createdtime, 
            userref, 
            userrefreciever 
          } = review;

          const reviewerDetails = await getUserDetails(userref.path);
          const receiverDetails = await getUserDetails(userrefreciever.path);
          
          return { 
            commment, 
            rating, 
            createdtime, 
            reviewerName: reviewerDetails.displayName, 
            reviewerType: reviewerDetails.userType,
            receiverName: receiverDetails.displayName,
            receiverType: receiverDetails.userType
          };
        }));

        usersWithReviews.push({ ...user, reviews: latestReviews }); // Add user to the list
      }
    }

    toggleLoading(false);

    if (!usersWithReviews.length) {
      reviewsTableBody.innerHTML = "<tr><td colspan='6'>No reviews available.</td></tr>"; // Updated colspan to 6
      return;
    }

    // Populate the table with reviews
    for (const user of usersWithReviews) {
      user.reviews.forEach(review => {
        const createdDate = review.createdtime ? new Date(review.createdtime.seconds * 1000).toLocaleDateString() : "N/A";

        reviewsTableBody.innerHTML += `
          <tr>
            <td>${review.reviewerType}</td> <!-- User Type of Reviewer -->
            <td>${review.reviewerName}</td>
            <td>to</td>
            <td>${review.receiverName}</td>
            <td>${generateStars(review.rating)}</td>
            <td>${review.commment}</td>
            <td>${createdDate}</td>
          </tr>
        `;
      });
    }
  } catch (error) {
    console.error("Error fetching reviews:", error);
    toggleLoading(false);
    reviewsTableBody.innerHTML = "<tr><td colspan='6'>Error loading reviews. Please try again later.</td></tr>"; // Updated colspan to 6
  }
}

// Event listeners for buttons and initial reviews display
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("searchButton").addEventListener("click", async () => {
    const searchQuery = document.getElementById("searchInput").value.toLowerCase();
    const allUsers = await getUsers();
    const filteredUsers = allUsers.filter(user =>
      `${user.display_name} ${user.lastname}`.toLowerCase().includes(searchQuery)
    );
    displayFilteredReviews(filteredUsers); // Define this function to handle filtered reviews
  });

  // Initial call to display all reviews
  displayReviews();
});

