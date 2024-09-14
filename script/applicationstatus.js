import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const allUsersTable = document.getElementById("allUsers");

  async function fetchApplications() {
    try {
      // Fetch the list of all users
      const usersQuerySnapshot = await getDocs(collection(db, "users"));

      allUsersTable.innerHTML = ""; // Clear the table before adding rows

      for (const userDoc of usersQuerySnapshot.docs) {
        const userId = userDoc.id;

        // Query the 'application' subcollection for this user
        const applicationQuerySnapshot = await getDocs(collection(db, `users/${userId}/application`));

        for (const appDoc of applicationQuerySnapshot.docs) {
          const applicationData = appDoc.data();
          const {
            createdtime,
            posttaskref,
            statusofprovider,
            statusofseeker,
            trackofprovider,
            trackofseeker,
            uid
          } = applicationData;

          let clientName = "Unknown";
          let category = "Unknown";
          let workerName = "Unknown";

          if (posttaskref) {
            // Directly use the document reference to get the document
            const postTaskDoc = await getDoc(posttaskref);

            if (postTaskDoc.exists()) {
              const postTaskData = postTaskDoc.data();
              console.log("Post Task Data:", postTaskData); // Debug data

              // Check if `uid` field is used for client reference
              const clientRefPath = postTaskData.uid;

              if (clientRefPath) {
                const clientDocRef = doc(db, clientRefPath.path || clientRefPath);
                const clientDoc = await getDoc(clientDocRef);

                if (clientDoc.exists()) {
                  const clientData = clientDoc.data();
                  clientName = `${clientData.display_name} ${clientData.lastname}`;
                } else {
                  console.error("Client document not found at path:", clientRefPath.path || clientRefPath);
                }
              } else {
                console.error("No client reference found in postTask document.");
              }

              category = postTaskData.category || "Unknown";
            } else {
              console.error("Post task document not found.");
            }
          } else {
            console.error("Invalid posttaskref:", posttaskref);
          }

          if (uid) {
            // Ensure `uid` is used correctly
            const workerDocRef = doc(db, uid.path || uid);
            console.log("Worker Document Path:", workerDocRef.path); // Debug path

            const workerDoc = await getDoc(workerDocRef);

            if (workerDoc.exists()) {
              const workerData = workerDoc.data();
              workerName = `${workerData.display_name} ${workerData.lastname}`;
            } else {
              console.error("Gig Worker document not found.");
            }
          } else {
            console.error("Invalid uid:", uid);
          }

          const tr = document.createElement("tr");

          const timeTd = document.createElement("td");
          const createdDate = new Date(createdtime.seconds * 1000);
          // Format the date as "August 23, 2024 at 7:23:01 PM"
          const formattedDate = createdDate.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          });
          timeTd.textContent = formattedDate;
          tr.appendChild(timeTd);

          const clientNameTd = document.createElement("td");
          clientNameTd.textContent = clientName;
          tr.appendChild(clientNameTd);

          const categoryTd = document.createElement("td");
          categoryTd.textContent = category;
          tr.appendChild(categoryTd);

          const statusOfProviderTd = document.createElement("td");
          statusOfProviderTd.textContent = statusofprovider;
          tr.appendChild(statusOfProviderTd);

          const statusOfSeekerTd = document.createElement("td");
          statusOfSeekerTd.textContent = statusofseeker;
          tr.appendChild(statusOfSeekerTd);

          const trackOfProviderTd = document.createElement("td");
          trackOfProviderTd.textContent = trackofprovider;
          tr.appendChild(trackOfProviderTd);

          const trackOfSeekerTd = document.createElement("td");
          trackOfSeekerTd.textContent = trackofseeker;
          tr.appendChild(trackOfSeekerTd);

          const workerNameTd = document.createElement("td");
          workerNameTd.textContent = workerName;
          tr.appendChild(workerNameTd);

          allUsersTable.appendChild(tr);
        }
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
    }
  }

  fetchApplications();
});
