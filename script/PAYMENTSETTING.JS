import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Reference to Firestore collections
const topUpCollectionRef = collection(db, "topUpconverstionRate");
const cashOutCollectionRef = collection(db, "cashoutConcerstionrate");

// Function to load and display data for the top-up table
async function loadTopUpTable() {
  // Create a query to order by amount in ascending order
  const topUpQuery = query(topUpCollectionRef, orderBy("amount"));
  const topUpSnapshot = await getDocs(topUpQuery);
  const topUpTableBody = document.getElementById("topuptable").querySelector("tbody");

  topUpTableBody.innerHTML = ""; // Clear existing rows

  topUpSnapshot.forEach((doc) => {
    const data = doc.data();
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${data.numberofTAUkens}</td>
      <td>${data.amount}</td>
      <td>${data.earnings}</td>
      <td>
        <button onclick="editTopUp('${doc.id}')">Edit</button>
        <button onclick="deleteTopUp('${doc.id}')">Delete</button>
      </td>
    `;
    topUpTableBody.appendChild(row);
  });
}

// Function to load and display data for the cash-out table
async function loadCashOutTable() {
  // Create a query to order by amount in ascending order
  const cashOutQuery = query(cashOutCollectionRef, orderBy("amount"));
  const cashOutSnapshot = await getDocs(cashOutQuery);
  const cashOutTableBody = document.getElementById("cashouttable").querySelector("tbody");

  cashOutTableBody.innerHTML = ""; // Clear existing rows

  cashOutSnapshot.forEach((doc) => {
    const data = doc.data();
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${data.numberofTAUkens}</td>
      <td>${data.amount}</td>
      <td>${data.earnings}</td>
      <td>
        <button onclick="editCashOut('${doc.id}')">Edit</button>
        <button onclick="deleteCashOut('${doc.id}')">Delete</button>
      </td>
    `;
    cashOutTableBody.appendChild(row);
  });
}

// Load data when the page loads
document.addEventListener("DOMContentLoaded", () => {
  loadTopUpTable();
  loadCashOutTable();
});

// Delete a top-up document
async function deleteTopUp(docId) {
  await deleteDoc(doc(db, "topUpconverstionRate", docId));
  loadTopUpTable(); // Refresh the table
}

// Delete a cash-out document
async function deleteCashOut(docId) {
  await deleteDoc(doc(db, "cashoutConcerstionrate", docId));
  loadCashOutTable(); // Refresh the table
}

// Edit a top-up document
async function editTopUp(docId) {
  const docRef = doc(db, "topUpconverstionRate", docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const newNumberofTAUkens = prompt("Enter new Number of TAUkens:", data.numberofTAUkens);
    const newAmount = prompt("Enter new Amount:", data.amount);
    const newEarnings = prompt("Enter new Earnings:", data.earnings);

    await updateDoc(docRef, {
      numberofTAUkens: Number(newNumberofTAUkens),
      amount: Number(newAmount),
      earnings: Number(newEarnings),
    });

    loadTopUpTable(); // Refresh the table
  } else {
    console.error("No such document!");
  }
}

// Edit a cash-out document
async function editCashOut(docId) {
  const docRef = doc(db, "cashoutConcerstionrate", docId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const newNumberofTAUkens = prompt("Enter new Number of TAUkens:", data.numberofTAUkens);
    const newAmount = prompt("Enter new Amount:", data.amount);
    const newEarnings = prompt("Enter new Earnings:", data.earnings);

    await updateDoc(docRef, {
      numberofTAUkens: Number(newNumberofTAUkens),
      amount: Number(newAmount),
      earnings: Number(newEarnings),
    });

    loadCashOutTable(); // Refresh the table
  } else {
    console.error("No such document!");
  }
}

// Add a new entry to the top-up collection
async function addTopUp() {
  const numberofTAUkens = prompt("Enter Number of TAUkens:");
  const amount = prompt("Enter Amount:");

  if (numberofTAUkens && amount) {
    const earnings = Number(amount) - Number(numberofTAUkens); // Calculate earnings as the difference

    await addDoc(topUpCollectionRef, {
      numberofTAUkens: Number(numberofTAUkens),
      amount: Number(amount),
      earnings: earnings, // Use the calculated earnings
    });

    loadTopUpTable(); // Refresh the table
  }
}

// Add a new entry to the cash-out collection
async function addCashOut() {
  const numberofTAUkens = prompt("Enter Number of TAUkens:");
  const amount = prompt("Enter Amount:");

  if (numberofTAUkens && amount) {
    const earnings = Number(numberofTAUkens) - Number(amount); // Calculate earnings as the difference

    await addDoc(cashOutCollectionRef, {
      numberofTAUkens: Number(numberofTAUkens),
      amount: Number(amount),
      earnings: earnings, // Use the calculated earnings
    });

    loadCashOutTable(); // Refresh the table
  }
}

window.editTopUp = editTopUp;
window.deleteTopUp = deleteTopUp;
window.editCashOut = editCashOut;
window.deleteCashOut = deleteCashOut;
window.addTopUp = addTopUp;
window.addCashOut = addCashOut;
