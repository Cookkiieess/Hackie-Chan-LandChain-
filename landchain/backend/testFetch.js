const axios = require("axios");

async function test() {
  try {
    const response = await axios.post("http://localhost:5000/api/property/fetch", {
      ulpin: "KA-MNG-142-3B",
      requesterUserId: "LC-1001"
    });
    console.log("Status:", response.status);
    console.log("RevenueData:", JSON.stringify(response.data.revenueData, null, 2));
    console.log("KaveriData:", JSON.stringify(response.data.kaveriData, null, 2));
  } catch (error) {
    console.error("Error fetching:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
    }
  }
}

test();
