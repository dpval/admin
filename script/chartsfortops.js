// Import Firebase Firestore functions
import { db } from "../firebase.js";
import {
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js";

// Function to fetch postTask data from Firestore
const fetchPostTasks = async (userId) => {
  console.log(`Fetching post tasks for user ID: ${userId}`);
  const snapshot = await getDocs(collection(db, "users", userId, "postTask"));
  const tasks = snapshot.docs.map((doc) => doc.data());
  console.log(`Fetched post tasks:`, tasks);
  return tasks;
};

// Function to process the postTask data
const processPostTasks = (postTasks) => {
  const categoryCount = {};
  const locationCount = {};
  const dateCount = {};

  postTasks.forEach((task) => {
    // Count categories
    const category = task.category; // Example: "Handyman(Tagapag-ayos)"
    categoryCount[category] = (categoryCount[category] || 0) + 1;

    // Count locations
    const location = task.location; // Example: "Narra St, Baliwag, Bulacan, Philippines"
    locationCount[location] = (locationCount[location] || 0) + 1;

    // Count dates
    const date = new Date(task.date).toLocaleDateString(); // Format the date to 'MM/DD/YYYY'
    dateCount[date] = (dateCount[date] || 0) + 1;
  });

  console.log(`Category Count:`, categoryCount);
  console.log(`Location Count:`, locationCount);
  console.log(`Date Count:`, dateCount);

  return {
    categories: Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3),
    locations: Object.entries(locationCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3),
    dates: Object.entries(dateCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3),
  };
};

// Function to create a ranking chart
const createRankingChart = (id, label, data, color) => {
  console.log(`Creating chart for: ${label}`, data);
  const ctx = document.getElementById(id).getContext("2d");
  new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["1st", "2nd", "3rd"], // Example rankings
      datasets: [
        {
          label: label,
          data: data,
          backgroundColor: color,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
};

// Function to create charts using fetched and processed data
const createCharts = async (userId) => {
  const postTasks = await fetchPostTasks(userId);
  const { categories, locations, dates } = processPostTasks(postTasks);

  // Prepare data for charts
  const topCategories = categories.map((item) => item[0]);
  const topCategoryCounts = categories.map((item) => item[1]);

  const topLocations = locations.map((item) => item[0]);
  const topLocationCounts = locations.map((item) => item[1]);

  const topDates = dates.map((item) => item[0]);
  const topDateCounts = dates.map((item) => item[1]);

  // Create the ranking charts
  createRankingChart(
    "topCategorysChart",
    "Category",
    topCategoryCounts,
    "rgba(75, 192, 192, 0.6)"
  );
  createRankingChart(
    "topLocationsChart",
    "Location",
    topLocationCounts,
    "rgba(255, 159, 64, 0.6)"
  );
  createRankingChart(
    "topDatesChart",
    "Date",
    topDateCounts,
    "rgba(153, 102, 255, 0.6)"
  );
};

// Call the function to create charts when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", async () => {
  const userId = "7JdztPLhvnO2rWVgpxdjEubFHox2"; // Replace with the actual user ID
  console.log(`Current User ID: ${userId}`);
  await createCharts(userId); // Pass the user ID to create charts
});
