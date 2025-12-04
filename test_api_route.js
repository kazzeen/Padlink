/* eslint-disable @typescript-eslint/no-require-imports */
const fetch = require('node-fetch'); // Assuming node-fetch is available or I can use built-in fetch in Node 18+

async function test() {
  // First get a listing ID
  try {
    const listRes = await fetch('http://localhost:3001/api/listings');
    const listData = await listRes.json();
    
    if (!listData.listings || listData.listings.length === 0) {
      console.log("No listings found to test with.");
      return;
    }

    const id = listData.listings[0].id;
    console.log("Testing with listing ID:", id);

    const detailRes = await fetch(`http://localhost:3001/api/listings/${id}`);
    console.log("Detail status:", detailRes.status);
    
    if (detailRes.status === 404) {
        const data = await detailRes.json();
        console.log("Detail error:", data);
    } else if (detailRes.status === 200) {
        const data = await detailRes.json();
        console.log("Detail success:", data.id);
    } else {
        console.log("Detail failed with status:", detailRes.status);
    }

  } catch (e) {
    console.error("Test failed:", e);
  }
}

test();
