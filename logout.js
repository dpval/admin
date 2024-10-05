// Import Firebase auth
import { getAuth, signOut } from "firebase/auth";

// Function to log out the user
const logoutUser = async () => {
  const auth = getAuth();
  try {
    await signOut(auth);
    console.log("User logged out successfully.");
    // Redirect to the login page or perform any other action
    window.location.href = "/login.html"; // Adjust the path as needed
  } catch (error) {
    console.error("Error logging out: ", error);
    // Optionally, show an error message to the user
    alert("An error occurred while logging out. Please try again.");
  }
};

// Adding an event listener to a logout button (assuming there's a button with id 'logoutBtn')
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", logoutUser);
}
