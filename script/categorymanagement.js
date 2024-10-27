// // Import the necessary Firebase modules
// import { db } from "../firebase.js"; // Assuming your firebase.js exports the initialized Firestore instance
// import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// // Function to save category
// async function saveCategory() {
//   const category = document.getElementById('categoryInput').value;

//   // Check if the input is empty
//   if (category.trim() === "") {
//     alert("Please enter a category");
//     return;
//   }

//   try {
//     // Add the new category to the Firestore collection 'skillcategory'
//     await addDoc(collection(db, "skillcategory"), {
//       category: category
//     });
//     alert("Category added successfully!");

//     // Clear the input field after a successful submission
//     document.getElementById('categoryInput').value = "";
//   } catch (error) {
//     console.error("Error adding category:", error);
//     alert("Failed to add category. Try again.");
//   }
// }

// // Attach the saveCategory function to the global window object
// window.saveCategory = saveCategory;
import { db } from "../firebase.js"; // Assuming your firebase.js exports the initialized Firestore instance
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

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

        // Fetch and update the skill categories list
        fetchSkillCategories(); // Refresh the list after adding a new category
    } catch (error) {
        console.error("Error adding category:", error);
        alert("Failed to add category. Try again.");
    }
}

// Function to fetch skill categories
async function fetchSkillCategories() {
    const skillCategoryList = document.getElementById("skillCategoryList");
    skillCategoryList.innerHTML = ""; // Clear the list before fetching

    const skillCategoryCollection = collection(db, "skillcategory");
    const querySnapshot = await getDocs(skillCategoryCollection);

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const listItem = document.createElement("li"); // Create a list item
        listItem.textContent = data.category; // Assuming 'category' is a field in your documents
        skillCategoryList.appendChild(listItem); // Append the item to the list
    });
}

// Initial fetch of skill categories when the page loads
window.onload = fetchSkillCategories;

// Attach the saveCategory function to the global window object
window.saveCategory = saveCategory;
