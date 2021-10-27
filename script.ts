import extractEbikeData from "./scraper/extractData";

extractEbikeData(131)
  .then((data) => {
    console.log(data);
  })
  .catch((reason) => {
    console.log(reason);
  });
