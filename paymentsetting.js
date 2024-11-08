import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Reference to the document in Firestore
const docRef = doc(db, "percetnage", "CZT2QUYEzMtZxJDSZV8V");

// Function to fetch and display the percentage
async function loadPercentage() {
  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const percentageValue = docSnap.data().percentage;
      // Display the existing value in the input field
      document.getElementById("additionalInput").placeholder = `Percentage: ${percentageValue}`;
      document.getElementById("additionalInput").value = percentageValue; // Optional: set it as value if needed
    } else {
      console.log("No such document!");
    }
  } catch (error) {
    console.error("Error fetching document:", error);
  }
}

// Function to update the percentage in Firestore
async function updatePercentage() {
  const newPercentage = document.getElementById("additionalInput").value;
  try {
    if (newPercentage.trim() !== "") { // Check for non-empty input
      await updateDoc(docRef, {
        percentage: parseFloat(newPercentage) // Ensure it's a number
      });
      alert("Percentage updated successfully!");
    } else {
      alert("Please enter a valid percentage.");
    }
  } catch (error) {
    console.error("Error updating document:", error);
    alert("Failed to update the percentage.");
  }
}

// Event listener for input field change
document.getElementById("additionalInput").addEventListener("change", updatePercentage);

// Load the initial data when the page loads
window.onload = loadPercentage;
