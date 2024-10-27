import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-auth.js";
import {
  getDoc,
  doc,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { auth, db } from "./firebase.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const errorMessage = document.getElementById("errorMessage");

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = emailInput.value;
    const password = passwordInput.value;

    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        console.log("Login successful:", user);

        // Fetch user information from Firestore
        const userDocRef = doc(db, "users", user.uid); // Adjust the collection name if needed
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userType = userDoc.data().usertype;

          // Redirect based on usertype
          if (userType === "admin") {
            window.location.href = "homepage.html"; // Admin redirect
          } else if (userType === "verifier") {
            window.location.href = "paymentverifier.html"; // Admin redirect
          } else {
            window.location.href = "payment.html"; // Non-admin redirect (e.g., client or applicant)
          }
        } else {
          console.error("No such user in Firestore!");
          errorMessage.textContent =
            "User information not found. Please contact support.";
          errorMessage.style.display = "block";
        }
      })
      .catch((error) => {
        console.error("Error during login:", error);
        console.error("Error code:", error.code); // This will give you the error code
        console.error("Error message:", error.message); // This will give you the detailed error message
        errorMessage.textContent = error.message; // Show this to the user
        errorMessage.style.display = "block";
      });
  });
});
