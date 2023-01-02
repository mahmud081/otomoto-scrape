const rp = require("request-promise");
const cheerio = require("cheerio");

const BASE_URL =
  "https://www.otomoto.pl/ciezarowe/uzytkowe/mercedes-benz/od-2014/q-actros? search%5Bfilter_enum_damaged%5D=0&search%5Border%5D=created_at%3Adesc";

let options = {
  url: BASE_URL,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/38.0.2125.111 Safari/537.36",
  },
};
const otomotoCheerio = {
  getNextPageUrl: async (url = BASE_URL) => {
    options.url = url;
    const html = await rp(options);

    const $ = cheerio.load(html);
    let pageEl = $('[data-testid="pagination-list"]');
    let activePage = pageEl
      .children(".pagination-item__active")
      .children("a")
      .children("span")
      .text();
    let isNextDisable =
      pageEl.children(".pagination-item__disabled").attr("title") ===
      "Next Page";
    if (isNextDisable) {
      return null;
    }
    let nextPageNo = parseInt(activePage) + 1;
    return BASE_URL + "&page=" + nextPageNo;
  },
  addItems: async (url = BASE_URL) => {
    options.url = url;
    const html = await rp(options);
    const $ = cheerio.load(html);

    let items = [];
    $('[data-testid="search-results"] [data-testid="listing-ad"]').each(
      function (i, el) {
        items.push({
          itemId: el.attribs.id,
          itemUrl: $('[data-testid="ad-title"] a', el).attr("href"),
        });
      }
    );
    return items;
  },
  scrapeTruckItem: async (url) => {
    let item = {
      id: "",
      title: "",
      price: "",
      registration_date: "",
      production_date: "",
      mileage: "",
      power: "",
    };
    options.url = url;
    let html;
    try {
      html = await rp(options);
    } catch (error) {
      return item;
    }
    const $ = cheerio.load(html);

    let el = $(".page-offer.new-offer-summary");
    item.id = $("#ad_id", el).first().text();
    item.title = $("div .offer-title", el).first().text().trim();
    item.price = $(".offer-price", el).data("price");
    $(".offer-params__item", el).each(function (i, element) {
      if (
        $(".offer-params__label", element).text() === "Pierwsza rejestracja"
      ) {
        item.registration_date = $(".offer-params__value", element)
          .text()
          .trim();
      }
      if ($(".offer-params__label", element).text() === "Rok produkcji") {
        item.production_date = $(".offer-params__value", element).text().trim();
      }
      if ($(".offer-params__label", element).text() === "Przebieg") {
        item.mileage = $(".offer-params__value", element).text().trim();
      }
      if ($(".offer-params__label", element).text() === "Moc") {
        item.power = $(".offer-params__value", element).text().trim();
      }
    });
    return item;
  },
  getTotalAdsCount: async () => {
    options.url = BASE_URL;
    const html = await rp(options);
    const $ = cheerio.load(html);
    return $('[data-testid="search-results"] [data-testid="listing-ad"]')
      .length;
  },
  scrapAllAds: async () => {
    let allItems = [];
    let initUrl = BASE_URL;
    let nextPage = "";

    do {
      console.log("Getting Items from--> " + initUrl);
      //   options.url = initUrl;
      //   let html = await rp(options);
      //   const $ = cheerio.load(html);

      let currPageItems = await otomotoCheerio.addItems(initUrl);
      for (let item of currPageItems) {
        console.log(`Fetching details from --> ${item.itemUrl}`);
        let truckItem = await otomotoCheerio.scrapeTruckItem(item.itemUrl);
        allItems.push(truckItem);
      }
      // console.log(allItems);
      nextPage = await otomotoCheerio.getNextPageUrl(initUrl);
      if (nextPage != null) {
        initUrl = nextPage;
      }
    } while (nextPage != null);

    return allItems;
  },
};
module.exports = otomotoCheerio;
