const puppeteer = require("puppeteer");

let browser = null;
let page = null;
let totalPages = null;

const BASE_URL =
  "https://www.otomoto.pl/ciezarowe/uzytkowe/mercedes-benz/od-2014/q-actros? search%5Bfilter_enum_damaged%5D=0&search%5Border%5D=created_at%3Adesc";

const ototmotoPuppet = {
  initialize: async () => {
    console.log("Starting the scraper...");

    browser = await puppeteer.launch({
      headless: true,
    });
    page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (
        req.resourceType() == "stylesheet" ||
        req.resourceType() == "font" ||
        req.resourceType() == "image"
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });
    await page.goto(BASE_URL);
    await page.waitForSelector(
      "#onetrust-button-group #onetrust-accept-btn-handler"
    );
    await page.click("#onetrust-button-group #onetrust-accept-btn-handler");

    await page.waitForSelector('[data-testid="pagination-list"]');
    totalPages = await page.$eval(
      "li.pagination-item:nth-child(6) > a>span",
      (el) => el.innerText
    );

    console.log("Initialization complete...");
  },
  end: async () => {
    console.log("Stopping the scraper...");
    await browser.close();
  },
  getNextPageUrl: async () => {
    await page.waitForSelector('[data-testid="pagination-list"]');
    let activePageNo = parseInt(
      await page.$eval(
        '[data-testid="pagination-list"] .pagination-item__active>a>span',
        (el) => el.innerText
      )
    );
    if (activePageNo + 1 > totalPages) {
      console.log("Last page reached...");
      return null;
    }
    let nextPageNo = activePageNo + 1;
    return BASE_URL + "&page=" + nextPageNo;
  },
  addItems: async () => {
    let items = [];

    await page.waitForSelector('[data-testid="search-results"]');
    items = await page.$$eval(
      '[data-testid="search-results"] [data-testid="listing-ad"]',
      (elements) => {
        return elements.map((el) => {
          let itemLink = el
            .querySelector('[data-testid="ad-title"]>a')
            .getAttribute("href");
          return { itemId: el.id, itemUrl: itemLink };
        });
      }
    );
    return items;
  },
  scrapeTruckItem: async (url = "") => {
    console.log("Scraping deails from\t" + url);
    const detailPage = await ototmotoPuppet.openDetailPage(url);
    try {
      await detailPage.waitForSelector(".page-offer.new-offer-summary");
    } catch (error) {
      return {};
    }
    let truckItem = await detailPage.evaluate(() => {
      let item = {
        id: "",
        title: "",
        price: "",
        registration_date: "",
        production_date: "",
        mileage: "",
        power: "",
      };
      let el = document.querySelector(".page-offer.new-offer-summary");
      item.id = el.querySelector("#ad_id").innerText;
      item.title = el.querySelector("div >.offer-title").innerText.trim();
      item.price = el.querySelector(".offer-price").dataset.price;
      let offerItems = el.querySelectorAll(".offer-params__item");
      offerItems.forEach((offer) => {
        if (
          offer.querySelector(".offer-params__label").innerText ===
          "Pierwsza rejestracja"
        ) {
          item.registration_date = offer.querySelector(
            ".offer-params__value"
          ).innerText;
        }
        if (
          offer.querySelector(".offer-params__label").innerText ===
          "Rok produkcji"
        ) {
          item.production_date = offer.querySelector(
            ".offer-params__value"
          ).innerText;
        }
        if (
          offer.querySelector(".offer-params__label").innerText === "Przebieg"
        ) {
          item.mileage = offer.querySelector(".offer-params__value").innerText;
        }
        if (offer.querySelector(".offer-params__label").innerText === "Moc") {
          item.power = offer.querySelector(".offer-params__value").innerText;
        }
      });
      return item;
    });

    return truckItem;
  },
  getTotalAdsCount: async () => {
    await page.waitForSelector('[data-testid="search-results"]');
    let adCount = await page.$$eval(
      '[data-testid="search-results"] [data-testid="listing-ad"]',
      (el) => el.length
    );
    return adCount;
  },
  scrapAllAds: async () => {
    let allItems = [];
    let initUrl = BASE_URL;
    let nextPage = "";

    do {
      console.log("Navigating to Page-->\t " + initUrl);
      await page.goto(initUrl);
      let currPageItems = await ototmotoPuppet.addItems(initUrl);
      for (let item of currPageItems) {
        let truckItem = await ototmotoPuppet.scrapeTruckItem(item.itemUrl);
        allItems.push(truckItem);
      }
      // console.log(allItems);
      nextPage = await ototmotoPuppet.getNextPageUrl(initUrl);
      if (nextPage != null) {
        initUrl = nextPage;
      }
    } while (nextPage != null);

    return allItems;
  },
  openDetailPage: async (url = "") => {
    const detailPage = await browser.newPage();
    await detailPage.setRequestInterception(true);
    detailPage.on("request", (req) => {
      if (
        req.resourceType() == "stylesheet" ||
        req.resourceType() == "font" ||
        req.resourceType() == "image"
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });
    await detailPage.goto(url);
    return detailPage;
  },
};

module.exports = ototmotoPuppet;
