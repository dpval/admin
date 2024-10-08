// import { db } from "../firebase.js";
// import {
//   collection,
//   getDocs,
//   doc,
//   getDoc,
//   updateDoc,
//   setDoc,
//   query,
//   where,
//   increment,
// } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// document.addEventListener("DOMContentLoaded", async () => {
//   const allUsersTable = document.getElementById("allUsers");

//   async function fetchApplications() {
//     try {
//       // Fetch the list of all users
//       const usersQuerySnapshot = await getDocs(collection(db, "users"));

//       allUsersTable.innerHTML = ""; // Clear the table before adding rows

//       for (const userDoc of usersQuerySnapshot.docs) {
//         const userId = userDoc.id;

//         // Query the 'application' subcollection for this user
//         const applicationQuerySnapshot = await getDocs(
//           collection(db, `users/${userId}/application`)
//         );

//         for (const appDoc of applicationQuerySnapshot.docs) {
//           const applicationData = appDoc.data();
//           const { createdtime, posttaskref, trackofprovider, uid } =
//             applicationData;

//           let clientName = "Unknown";
//           let subcategory = "Unknown";
//           let workerName = "Unknown";
//           let salary = "Unknown";
//           let status = "Not yet Sended"; // Default status

//           console.log("PostTaskRef: ", posttaskref); // Debugging
//           console.log("UID: ", uid); // Debugging

//           if (posttaskref) {
//             let postTaskDoc;

//             // If posttaskref is a DocumentReference, use it directly
//             if (posttaskref instanceof Object && posttaskref.firestore) {
//               postTaskDoc = await getDoc(posttaskref);
//             } else {
//               console.error("Invalid posttaskref format:", posttaskref);
//             }

//             if (postTaskDoc && postTaskDoc.exists()) {
//               const postTaskData = postTaskDoc.data();
//               console.log("Post Task Data:", postTaskData); // Debug data

//               const clientRefPath = postTaskData.uid;
//               if (
//                 clientRefPath &&
//                 clientRefPath instanceof Object &&
//                 clientRefPath.firestore
//               ) {
//                 const clientDoc = await getDoc(clientRefPath);

//                 if (clientDoc.exists()) {
//                   const clientData = clientDoc.data();
//                   clientName = `${clientData.display_name} ${clientData.lastname}`;
//                 }
//               }

//               subcategory = postTaskData.subcategory || "Unknown"; // Get the subcategory
//               salary = postTaskData.salary || "Unknown"; // Get the salary
//             }
//           }

//           if (uid) {
//             let workerDoc;

//             // If uid is a DocumentReference, use it directly
//             if (uid instanceof Object && uid.firestore) {
//               workerDoc = await getDoc(uid);
//             } else {
//               console.error("Invalid uid format:", uid);
//             }

//             if (workerDoc && workerDoc.exists()) {
//               const workerData = workerDoc.data();
//               workerName = `${workerData.display_name} ${workerData.lastname}`;
//             }
//           }

//           // Determine status based on trackofprovider
//           if (trackofprovider === "Done") {
//             status = "Sended";

//             const salaryAmount = Number(salary);

//             if (!isNaN(salaryAmount)) {
//               // Check if there's an existing wallet document with the same userID (as a reference)
//               const walletQuery = query(
//                 collection(db, "wallet"),
//                 where("userID", "==", uid)
//               );

//               const walletQuerySnapshot = await getDocs(walletQuery);

//               if (!walletQuerySnapshot.empty) {
//                 // Update the existing wallet
//                 const existingWalletDoc = walletQuerySnapshot.docs[0]; // Assuming there's only one document per userID
//                 const walletDocRef = doc(db, "wallet", existingWalletDoc.id);

//                 await updateDoc(walletDocRef, {
//                   balance: increment(salaryAmount), // Increment the balance
//                   currentTime: new Date(),
//                   status: "active",
//                 });
//               } else {
//                 // Create a new wallet document if no existing one is found
//                 const walletDocRef = doc(collection(db, "wallet"));

//                 await setDoc(walletDocRef, {
//                   balance: salaryAmount,
//                   userID: uid, // Store the reference
//                   currentTime: new Date(),
//                   status: "active",
//                 });
//               }
//             }
//           }

//           // Create table row
//           const tr = document.createElement("tr");

//           const clientNameTd = document.createElement("td");
//           clientNameTd.textContent = clientName;
//           tr.appendChild(clientNameTd);

//           const subcategoryTd = document.createElement("td");
//           subcategoryTd.textContent = subcategory;
//           tr.appendChild(subcategoryTd);

//           const trackOfProviderTd = document.createElement("td");
//           trackOfProviderTd.textContent = trackofprovider;
//           tr.appendChild(trackOfProviderTd);

//           const salaryTd = document.createElement("td");
//           salaryTd.textContent = salary;
//           tr.appendChild(salaryTd);

//           const statusTd = document.createElement("td");
//           statusTd.textContent = status;

//           if (status === "Sended") {
//             statusTd.style.backgroundColor = "green";
//             statusTd.style.color = "white";
//           } else {
//             statusTd.style.backgroundColor = "orange";
//             statusTd.style.color = "white";
//           }

//           tr.appendChild(statusTd);

//           const workerNameTd = document.createElement("td");
//           workerNameTd.textContent = workerName;
//           tr.appendChild(workerNameTd);

//           allUsersTable.appendChild(tr);
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching applications:", error);
//     }
//   }

//   fetchApplications();
// });
import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  query,
  where,
  increment,
  orderBy,
  limit,
  startAfter
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const allUsersTable = document.getElementById("allUsers");
  const prevPageButton = document.getElementById("prevPage");
  const nextPageButton = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");

  let pageSize = 10; // Number of items per page
  let lastVisible = null; // Track the last document of the current page
  let currentPage = 1; // Track the current page number

  async function fetchApplications(page = 1) {
    try {
      allUsersTable.innerHTML = ""; // Clear table before adding rows

      let usersQuery;
      if (page === 1) {
        // First page query
        usersQuery = query(
          collection(db, "users"),
          orderBy("createdtime"),
          limit(pageSize)
        );
      } else if (lastVisible) {
        // Fetch the next set of results starting after the last visible document
        usersQuery = query(
          collection(db, "users"),
          orderBy("createdtime"),
          startAfter(lastVisible),
          limit(pageSize)
        );
      }

      const usersQuerySnapshot = await getDocs(usersQuery);

      // Track the last document of the current page for pagination
      lastVisible = usersQuerySnapshot.docs[usersQuerySnapshot.docs.length - 1];

      for (const userDoc of usersQuerySnapshot.docs) {
        const userId = userDoc.id;

        // Query the 'application' subcollection for this user
        const applicationQuerySnapshot = await getDocs(
          collection(db, `users/${userId}/application`)
        );

        for (const appDoc of applicationQuerySnapshot.docs) {
          const applicationData = appDoc.data();
          const { createdtime, posttaskref, trackofprovider, uid } = applicationData;

          let clientName = "Unknown";
          let subcategory = "Unknown";
          let workerName = "Unknown";
          let salary = "Unknown";
          let status = "Not yet Sended"; // Default status

          if (posttaskref) {
            const postTaskDoc = await getDoc(posttaskref);
            if (postTaskDoc.exists()) {
              const postTaskData = postTaskDoc.data();
              clientName = `${postTaskData.clientName || "Unknown"} ${postTaskData.lastname || ""}`;
              subcategory = postTaskData.subcategory || "Unknown";
              salary = postTaskData.salary || "Unknown";
            }
          }

          if (uid) {
            const workerDoc = await getDoc(uid);
            if (workerDoc.exists()) {
              const workerData = workerDoc.data();
              workerName = `${workerData.display_name} ${workerData.lastname}`;
            }
          }

          if (trackofprovider === "Done") {
            status = "Sended";
            const salaryAmount = Number(salary);

            if (!isNaN(salaryAmount)) {
              const walletQuery = query(collection(db, "wallet"), where("userID", "==", uid));
              const walletQuerySnapshot = await getDocs(walletQuery);

              if (!walletQuerySnapshot.empty) {
                const existingWalletDoc = walletQuerySnapshot.docs[0];
                const walletDocRef = doc(db, "wallet", existingWalletDoc.id);
                await updateDoc(walletDocRef, {
                  balance: increment(salaryAmount),
                  currentTime: new Date(),
                  status: "active",
                });
              } else {
                const walletDocRef = doc(collection(db, "wallet"));
                await setDoc(walletDocRef, {
                  balance: salaryAmount,
                  userID: uid,
                  currentTime: new Date(),
                  status: "active",
                });
              }
            }
          }

          const tr = document.createElement("tr");

          const clientNameTd = document.createElement("td");
          clientNameTd.textContent = clientName;
          tr.appendChild(clientNameTd);

          const subcategoryTd = document.createElement("td");
          subcategoryTd.textContent = subcategory;
          tr.appendChild(subcategoryTd);

          const trackOfProviderTd = document.createElement("td");
          trackOfProviderTd.textContent = trackofprovider;
          tr.appendChild(trackOfProviderTd);

          const salaryTd = document.createElement("td");
          salaryTd.textContent = salary;
          tr.appendChild(salaryTd);

          const statusTd = document.createElement("td");
          statusTd.textContent = status;
          statusTd.style.backgroundColor = status === "Sended" ? "green" : "orange";
          statusTd.style.color = "white";
          tr.appendChild(statusTd);

          const workerNameTd = document.createElement("td");
          workerNameTd.textContent = workerName;
          tr.appendChild(workerNameTd);

          allUsersTable.appendChild(tr);
        }
      }

      // Update pagination controls
      pageInfo.textContent = `Page ${currentPage}`;
      prevPageButton.disabled = currentPage === 1;
      nextPageButton.disabled = usersQuerySnapshot.docs.length < pageSize;
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  }

  // Pagination controls
  prevPageButton.addEventListener("click", async () => {
    if (currentPage > 1) {
      currentPage--;
      await fetchApplications(currentPage);
    }
  });

  nextPageButton.addEventListener("click", async () => {
    currentPage++;
    await fetchApplications(currentPage);
  });

  // Initial fetch
  await fetchApplications(currentPage);
});
