import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Functions related to posts
export async function fetchClientPosts() {
  const allPosts = document.getElementById("allUsers");

  try {
    const usersCollection = collection(db, "users");
    const q = query(usersCollection, where("usertype", "==", "client"));
    const usersSnapshot = await getDocs(q);

    allPosts.innerHTML = "";

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const clientName = `${userData.display_name} ${userData.lastname}`;
      const postTaskCollection = collection(db, `users/${userDoc.id}/postTask`);

      // Fetch posts for each client with status "Archived"
      const postQuery = query(
        postTaskCollection,
        where("status", "==", "Archived")
      );
      const postTaskSnapshot = await getDocs(postQuery);

      postTaskSnapshot.forEach(async (postDoc) => {
        const postData = postDoc.data();
        const startingTime = new Date(postData.startingtime.seconds * 1000);
        const currentTime = new Date();

        // Calculate the time difference in hours
        const timeDiff = (startingTime - currentTime) / (1000 * 60 * 60); // Time difference in hours

        // Determine the status based on the time difference
        let status = "";
        let statusColor = "";

        if (timeDiff > 48) {
          status = "Excellent";
          statusColor = "green";
        } else if (timeDiff > 24) {
          status = "Good";
          statusColor = "yellow";
        } else if (timeDiff > 5) {
          status = "Urgent";
          statusColor = "orange";
          // Send email notification for Urgent status
          // await sendEmailNotification(userData.email, clientName, status);
        } else if (timeDiff > 1) {
          status = "Super Urgent";
          statusColor = "red";
          // Send email notification for Super Urgent status
          // await sendEmailNotification(userData.email, clientName, status);
        } else if (timeDiff <= 0) {
          status = "Archived";
          statusColor = "gray";
          // Send email notification for Archived status
          await sendEmailNotification(userData.email, clientName, status);
        }

        // Format starting time
        const formattedStartingTime = startingTime.toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          hour12: true,
        });

        // Create table row
        const row = document.createElement("tr");
        row.innerHTML = `
          <tr>
            <td>${clientName}</td>
            <td>${postData.category}</td>
            <td>${postData.subcategory}</td>
            <td>${formattedStartingTime}</td>
            <td style="color: ${statusColor}; font-weight: bold;">${status}</td>
          </tr>
        `;
        allPosts.appendChild(row);
      });
    }
  } catch (error) {
    console.error("Error fetching client posts:", error);
  }
}

// Function to send email notification
async function sendEmailNotification(toEmail, clientName, status) {
  try {
    // Prepare the subject and message
    const subject = `Task Status: ${status}`;
    const message = `<p>Dear ${clientName},</p>
                     <p>Your task is marked as <b>${status}</b>. Please take the necessary actions.</p>`;

    // Store the email information in Firestore
    await addDoc(collection(db, "mail"), {
      to: [toEmail], // 'to' field as an array (Firebase requires this)
      subject: subject,
      message: {
        text: message, // Plain text version of the message (optional)
        html: message, // HTML version of the message
      },
      timestamp: Timestamp.now(), // Firestore's timestamp for when the email is created
    });

    console.log(`Email data stored in Firestore for ${toEmail} with ${status} status.`);
  } catch (error) {
    console.error("Error storing email in Firestore:", error);
  }
}


document.addEventListener("DOMContentLoaded", fetchClientPosts);
