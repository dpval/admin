import { db } from '../firebase.js'; // Ensure the path is correct
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js';

async function fetchAdminStats() {
  try {
    const adminDocRef = doc(db, 'admin_CashFunds', 'V1eVx88jTZdaaHru6zRK');
    const adminDocSnap = await getDoc(adminDocRef);

    if (adminDocSnap.exists()) {
      const data = adminDocSnap.data();
      document.getElementById('adminCash').textContent = data.adminCash || '0';
      document.getElementById('adminTAUkens').textContent = data.adminTAUkens || '0';
    } else {
      console.log('No such document!');
    }
  } catch (error) {
    console.error('Error fetching admin document:', error);
  }
}

async function fetchWalletData() {
  try {
    const cashOutQuery = query(collection(db, 'walletTopUp'), where('typeoftransaction', '==', 'CashOut'));
    const cashOutSnapshot = await getDocs(cashOutQuery);

    const cashOutData = [];
    for (const doc of cashOutSnapshot.docs) {
      const data = doc.data();
      const userRef = data.userID;
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      cashOutData.push({
        userName: `${userData.display_name} ${userData.lastname}`,
        numberofAccount: data.numberofAccount,
        method: data.method,
        amount: data.amount,
        transactionType: 'CashOut'
      });
    }

    const topUpQuery = query(collection(db, 'walletTopUp'), where('typeoftransaction', '==', 'TopUp'));
    const topUpSnapshot = await getDocs(topUpQuery);

    const topUpData = [];
    for (const doc of topUpSnapshot.docs) {
      const data = doc.data();
      const userRef = data.userID;
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      topUpData.push({
        userName: `${userData.display_name} ${userData.lastname}`,
        numberofAccount: data.numberofAccount,
        method: data.method,
        amount: data.amount,
        transactionType: 'TopUp'
      });
    }

    updateTable('walletTable', cashOutData);
    updateTable('paymentTable', topUpData);

  } catch (error) {
    console.error('Error fetching wallet data:', error);
  }
}

function updateTable(tableId, data) {
  const tableBody = document.getElementById(tableId).getElementsByTagName('tbody')[0];
  tableBody.innerHTML = '';

  data.forEach(row => {
    const newRow = tableBody.insertRow();

    // Created Time Cell
    const createdTimeCell = newRow.insertCell();
    const createdTimeInput = document.createElement('input');
    createdTimeInput.type = 'text';
    createdTimeInput.placeholder = 'Enter Name';
    createdTimeInput.value = row.createdTime || '';
    createdTimeInput.onchange = () => handleCreatedTimeChange(row.walletID, createdTimeInput.value);
    createdTimeCell.appendChild(createdTimeInput);

    // Wallet ID Cell
    const walletIDCell = newRow.insertCell();
    const walletIDInput = document.createElement('input');
    walletIDInput.type = 'text';
    walletIDInput.placeholder = 'Enter Mobile No.';
    walletIDInput.value = row.walletID || '';
    walletIDInput.onchange = () => handleWalletIDChange(row.walletID, walletIDInput.value);
    walletIDCell.appendChild(walletIDInput);

    // User Name Cell
    const userNameCell = newRow.insertCell();
    userNameCell.textContent = row.userName;

    // Number of Account Cell
    const numberofAccountCell = newRow.insertCell();
    numberofAccountCell.textContent = row.numberofAccount;

    // Method Cell
    const methodCell = newRow.insertCell();
    methodCell.textContent = row.method;

    // Amount Cell
    const amountCell = newRow.insertCell();
    amountCell.textContent = row.amount;

    // Reference No Cell
    const referenceNoCell = newRow.insertCell();
    const referenceNoInput = document.createElement('input');
    referenceNoInput.type = 'text';
    referenceNoInput.placeholder = 'Enter Reference No.';
    referenceNoInput.value = row.referenceNo || '';
    referenceNoInput.onchange = () => handleReferenceNoChange(row.walletID, referenceNoInput.value);
    referenceNoCell.appendChild(referenceNoInput);

    // Actions Cell
    const actionsCell = newRow.insertCell();
    const approveBtn = document.createElement('button1');
    approveBtn.innerHTML = '<i class="fas fa-check"></i>'; // Check icon for Approve
    approveBtn.title = 'Approve'; // Tooltip text
    approveBtn.onclick = () => handleApproval(row);

    const declineBtn = document.createElement('button2');
    declineBtn.innerHTML = '<i class="fas fa-times"></i>'; // Times icon for Decline
    declineBtn.title = 'Decline'; // Tooltip text
    declineBtn.onclick = () => handleDecline(row);

    actionsCell.appendChild(approveBtn);
    actionsCell.appendChild(declineBtn);
  });
}

function handleCreatedTimeChange(walletID, newCreatedTime) {
  console.log(`Created Time for Wallet ID ${walletID} changed to: ${newCreatedTime}`);
}

function handleWalletIDChange(oldWalletID, newWalletID) {
  console.log(`Wallet ID changed from ${oldWalletID} to ${newWalletID}`);
}

function handleReferenceNoChange(walletID, referenceNo) {
  console.log(`Reference No. for Wallet ID ${walletID}: ${referenceNo}`);
}

async function handleApproval(row) {
  try {
    const adminDocRef = doc(db, 'admin_CashFunds', 'V1eVx88jTZdaaHru6zRK');
    const adminDocSnap = await getDoc(adminDocRef);
    
    if (adminDocSnap.exists()) {
      let { adminCash, adminTAUkens, earnings } = adminDocSnap.data();
      let amount = parseFloat(row.amount);

      if (row.transactionType === 'TopUp') {
        // Deduct 90% of TopUp amount from TAUkens
        const deductedAmount = amount * 0.90;
        adminTAUkens -= deductedAmount;

        // Add 10% of TopUp amount to earnings
        const earningsAmount = amount * 0.10;
        earnings += earningsAmount;

        // Add full TopUp amount to adminCash
        adminCash += amount;

      } else if (row.transactionType === 'CashOut') {
        // Deduct CashOut amount from adminCash
        adminCash -= amount;

        // Add CashOut amount to TAUkens
        adminTAUkens += amount;
      }

      await updateDoc(adminDocRef, {
        adminCash,
        adminTAUkens,
        earnings
      });

      console.log(`Transaction Approved: ${row.transactionType}`);
      fetchAdminStats(); // Update UI with the latest admin stats
      fetchEarnings(); // Update earnings display
    }
  } catch (error) {
    console.error('Error approving transaction:', error);
  }
}

async function fetchEarnings() {
  try {
    const adminDocRef = doc(db, 'admin_CashFunds', 'V1eVx88jTZdaaHru6zRK');
    const adminDocSnap = await getDoc(adminDocRef);

    if (adminDocSnap.exists()) {
      const data = adminDocSnap.data();
      document.getElementById('earnings').textContent = data.earnings ? data.earnings.toFixed(2) : '0.00';
    } else {
      console.log('No such document!');
      document.getElementById('earnings').textContent = '0.00';
    }
  } catch (error) {
    console.error('Error fetching earnings:', error);
    document.getElementById('earnings').textContent = '0.00';
  }
}

async function handleDecline(row) {
  try {
    const userRef = row.userID;
    const declineMessage = "Sorry, Please check all the details to proceed";

    // Assuming you have a way to send notifications to users
    // sendNotification(userRef, declineMessage);

    console.log(`Transaction Declined: ${row.transactionType}`);
    console.log(`Notification sent to user: ${declineMessage}`);
  } catch (error) {
    console.error('Error declining transaction:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAdminStats();
  fetchWalletData();
  fetchEarnings(); // Fetch and display earnings on page load
});
