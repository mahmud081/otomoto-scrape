const ototmotoPuppet = require("./src/otomoto-puppet");
const otomotoCheerio = require("./src/otomoto-cheerio");

// otomoto scraping using cheerio, request-promise

(async () => {
  // get next page url
  const nextPage = await otomotoCheerio.getNextPageUrl();
  console.log("Next page url:");
  console.log(nextPage);
  //
  // add items-- returns items id and urls
  const items = await otomotoCheerio.addItems();
  console.log("Addinng items from initial url");
  console.log(items);
  //
  // scrap truck item
  const truckItem = await otomotoCheerio.scrapeTruckItem(
    "https://www.otomoto.pl/oferta/mercedes-benz-actros-mercedes-actros-6x2-ID6FaY0J.html"
  );
  console.log("scrape truck item");
  console.log(truckItem);
  //
  // get total ad counts from initial page
  const adCount = await otomotoCheerio.getTotalAdsCount();
  console.log(`No of ads for initial url# ${adCount}`);
  //
  //scrape all ads
  const allAdItems = await otomotoCheerio.scrapAllAds();
  console.log("Scraping all ads--->");
  console.log(allAdItems);
})();

// uncomment to use otomoto scraping with puppeteer
// (async () => {
//   await ototmotoPuppet.initialize();

//   // get next page url
//   const nextUrl = await ototmotoPuppet.getNextPageUrl();
//   console.log(nextUrl);

//   // add items-- returns items id and urls
//   const items = await ototmotoPuppet.addItems();
//   console.log(items);

//   // get total ad counts from initial page
//   const noOfAds = await ototmotoPuppet.getTotalAdsCount();
//   console.log(noOfAds);

//   // scrap truck item
//   // const item = await ototmotoPuppet.scrapeTruckItem(
//   //   "https://www.otomoto.pl/oferta/mercedes-benz-1845-mercedes-actros-1845-po-kontrakcie-serwisowym-okazja-ID6ETXsi.html"
//   // );
//   // console.log(item);

//   //scrape all ads
//   // const allData = await ototmotoPuppet.scrapAllAds();
//   // console.log(allData);

//   await ototmotoPuppet.end();
// })();
