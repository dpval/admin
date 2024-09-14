// Import the necessary Firebase modules
import { db } from "../firebase.js"; // Assuming your firebase.js exports the initialized Firestore instance
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Function to save category
async function saveCategory() {
  const category = document.getElementById('categoryInput').value;

  // Check if the input is empty
  if (category.trim() === "") {
    alert("Please enter a category");
    return;
  }

  try {
    // Add the new category to the Firestore collection 'skillcategory'
    await addDoc(collection(db, "skillcategory"), {
      category: category
    });
    alert("Category added successfully!");

    // Clear the input field after a successful submission
    document.getElementById('categoryInput').value = "";
  } catch (error) {
    console.error("Error adding category:", error);
    alert("Failed to add category. Try again.");
  }
}

// Attach the saveCategory function to the global window object
window.saveCategory = saveCategory;
