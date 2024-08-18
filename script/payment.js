import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";
import { firebaseConfig } from "../firebase.js";

// Initialize Firebase
initializeApp(firebaseConfig);
const db = getFirestore();

async function fetchUserData(userID) {
  try {
    const userRef = doc(db, 'users', userID);
    const userDoc = await getDoc(userRef);
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

function calculateTokenAmount(amount) {
  const deduction = 0.05; // 5% deduction
  return amount * (1 - deduction);
}

async function updatePaymentStatus(userID, amount, status) {
  try {
    const userRef = doc(db, 'users', userID);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentWalletBalance = userData.wallet || 0;

      if (status === 'approved') {
        const newWalletBalance = currentWalletBalance + calculateTokenAmount(amount);
        await updateDoc(userRef, { wallet: newWalletBalance });
        return 'successful';
      } else if (status === 'disapproved') {
        return 'disapproved';
      }
    }
    return 'user not found';
  } catch (error) {
    console.error('Error updating payment status:', error);
    return 'error';
  }
}

async function loadPayments() {
  try {
    const paymentsTable = document.getElementById('paymentsTable'); // Ensure this matches your HTML element ID
    if (!paymentsTable) {
      console.error('Payments table element not found');
      return;
    }

    paymentsTable.innerHTML = '';

    // Query for all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    console.log('Users Snapshot:', usersSnapshot.docs); // Debugging log

    // Process each user based on userType
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userID = userDoc.id;

      console.log(`Processing payments for userID: ${userID}`); // Debugging log

      // Fetch payments related to the user
      const paymentsSnapshot = await getDocs(
        query(
          collection(db, 'walletTopUp'),
          where('userID', '==', userID),
          where('status', '==', 'pending') // Assuming pending means awaiting approval
        )
      );
      console.log('Payments Snapshot:', paymentsSnapshot.docs); // Debugging log

      for (const paymentDoc of paymentsSnapshot.docs) {
        const paymentData = paymentDoc.data();
        const balance = paymentData.balance || 'N/A';
        const currentTime = paymentData.currentTime ? new Date(paymentData.currentTime.toDate()).toLocaleString() : 'N/A';
        const amount = paymentData.amount || 0;
        const status = paymentData.status || 'pending'; // Default to pending if not available

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${currentTime}</td>
          <td>${userData.display_name || 'N/A'} ${userData.lastname || 'N/A'}</td>
          <td>${userData.phone_number || 'N/A'}</td>
          <td>${userData.userType || 'N/A'}</td>
          <td>${paymentData.method || 'N/A'}</td>
          <td>${paymentData.account || 'N/A'}</td>
          <td>${paymentData.refNo || 'N/A'}</td>
          <td>${amount}</td>
          <td>${balance}</td>
          <td>${status}</td>
          <td>${userID}</td>
          <td>
            <button class="approveBtn" data-payment-id="${paymentDoc.id}">Approve</button>
            <button class="disapproveBtn" data-payment-id="${paymentDoc.id}">Disapprove</button>
          </td>
        `;
        paymentsTable.appendChild(row);
      }
    }

    // Add event listeners for approve and disapprove buttons
    document.querySelectorAll('.approveBtn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const paymentId = e.target.getAttribute('data-payment-id');
        await handlePaymentApproval(paymentId, 'approved');
      });
    });

    document.querySelectorAll('.disapproveBtn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const paymentId = e.target.getAttribute('data-payment-id');
        await handlePaymentApproval(paymentId, 'disapproved');
      });
    });

  } catch (error) {
    console.error('Error loading payments:', error);
  }
}

async function handlePaymentApproval(paymentId, approvalStatus) {
  try {
    // Get payment details
    const paymentRef = doc(db, 'walletTopUp', paymentId);
    const paymentDoc = await getDoc(paymentRef);

    if (!paymentDoc.exists()) {
      console.error('Payment document not found');
      return;
    }

    const paymentData = paymentDoc.data();
    const { userID, amount } = paymentData;

    // Update payment status
    await updateDoc(paymentRef, { status: approvalStatus });

    // Update wallet balance if approved
    if (approvalStatus === 'approved') {
      await updatePaymentStatus(userID, amount, 'approved');
    }

    // Refresh payment list
    loadPayments();
  } catch (error) {
    console.error('Error handling payment approval:', error);
  }
}

// Initial load of payments
loadPayments();
