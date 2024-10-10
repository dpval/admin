import { db } from "../firebase.js";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Functions related to posts
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
        const postID = postDoc.id; // Get the document ID for updating later

        // Use postData.date instead of startingTime
        const postDate = new Date(postData.date.seconds * 1000); // Assuming 'date' is a Firestore timestamp
        const currentTime = new Date();

        // Calculate the time difference in hours
        const timeDiff = (postDate - currentTime) / (1000 * 60 * 60); // Time difference in hours

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
        } else if (timeDiff > 1) {
          status = "Super Urgent";
          statusColor = "red";
        } else if (timeDiff <= 0) {
          status = "Archived";
          statusColor = "gray";
        }

        // Format postDate to a readable string format
        const formattedPostDate = postDate.toLocaleString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          hour12: true,
          timeZone: "Asia/Manila", // Setting timezone to Asia/Manila
        });

        // Extract the walletID path from DocumentReference
        const walletIDPath = postData.walletID.path;  // Extract the full document path from DocumentReference

        // Create table row
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${clientName}</td>
          <td>${postData.category}</td>
          <td>${postData.subcategory}</td>
          <td>${formattedPostDate}</td>
          <td style="color: ${statusColor}; font-weight: bold;">${status}</td>
          <td>${
            status === "Archived"
              ? `<button class="send-notification-btn" data-email="${userData.email}" data-client-name="${clientName}" data-status="${status}" data-wallet-id="${walletIDPath}" data-salary="${postData.salary}" data-application-count="${postData.applicationcount}" data-uid="${postData.uid.path}">Update Wallet</button>`
              : ""
          }</td>
        `;
        allPosts.appendChild(row);

        // Attach event listener to the button
        if (status === "Archived") {
          const sendButton = row.querySelector(".send-notification-btn");
          sendButton.addEventListener("click", async () => {
            // Retrieve walletID, salary, application count, and uid
            const walletID = sendButton.getAttribute("data-wallet-id");
            const salary = parseFloat(sendButton.getAttribute("data-salary"));
            const applicationCount = parseInt(sendButton.getAttribute("data-application-count"));
            const uid = sendButton.getAttribute("data-uid");

            // Multiply salary by applicationCount to get the total
            const totalAmount = salary * applicationCount;

            // Call the function to update the wallet and status
            await updateWallet(walletID, totalAmount, postID, uid);
          });
        }
      });
    }
  } catch (error) {
    console.error("Error fetching client posts:", error);
  }
}

// Function to update the wallet balance based on the walletID
// Function to update the wallet balance based on the walletID
async function updateWallet(walletID, amount, postID, uid) {
  try {
    // Ensure that the walletID is correctly formatted
    const walletPath = walletID.startsWith("/") ? walletID.slice(1) : walletID;

    // Ensure walletPath contains exactly two segments (collection/documentID)
    if (walletPath.split("/").length !== 2) {
      throw new Error("Invalid wallet path. Expected format: 'collection/documentID'.");
    }

    // Get the wallet document reference
    const walletRef = doc(db, walletPath);
    const walletDoc = await getDoc(walletRef);

    if (walletDoc.exists()) {
      const walletData = walletDoc.data();

      // Update the wallet balance by adding the amount
      const newBalance = (walletData.balance || 0) + amount;

      // Update the wallet in Firestore with the new balance
      await updateDoc(walletRef, {
        balance: newBalance,
      });

      console.log(`Wallet ${walletPath} updated. New balance: ${newBalance}`);

      // Update the post status to "Salary Sent Back"
      await updateDoc(doc(db, `${uid}/postTask`, postID), {
        status: "Salary Sent Back"
      });
      console.log(`Post ${postID} status updated to 'Salary Sent Back'.`);

      // Create a walletNotification entry
      await addDoc(collection(db, "walletNotification"), {
        currentTime: Timestamp.now(),
        tokenDeduct: amount, // The salary multiplied by the application count
        type: "Plus",
        typeofTransaction: "Salary Sent Back",
        userID: doc(db, uid), // Assuming uid is the path to the user document
        walletID: doc(db, walletPath), // Document reference to the wallet
      });
      console.log("walletNotification created successfully.");
    } else {
      console.error(`Wallet ${walletPath} not found.`);
    }
  } catch (error) {
    console.error("Error updating wallet and status:", error);
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
