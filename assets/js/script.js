//Initiated Global Variables
var stockSubmit = document.querySelector("#stock-search");
var outerStockContainerEl = document.querySelector("#stock-info");
var outerStockContainerNameEl = document.querySelector("#stock-ticker-name");
var outerStockContainerCompanyNameEl = document.querySelector("#stock-company-name");
var outerStockContainerOpeningPriceEl = document.querySelector("#stock-open-price");
var outerStockContainerCurrentPriceEl = document.querySelector("#stock-last-price");
var outerStockContainerChangePercentEl = document.querySelector("#stock-change-percent");
var outerStockContainerAbsoluteEl = document.querySelector("#stock-change-absolute");
var outerStockContainerMarketCapEl = document.querySelector("#stock-market-cap");


// Stock Data Storage
var dataContainer = {companyName:'', tickerName:''}

//This executes when the event listener kicks off to handle the button click
var formSubmitHandler = function (event) {
  event.preventDefault();
  var stockInput = document.querySelector("#stock-input").value.trim();
  if (stockInput) {
    clearOut();
    getStockData(stockInput);
    getMarketCap(stockInput);
    var clearInput = document.querySelector("#stock-input");
    clearInput.value = "";
  } else {
    outerStockContainerEl.classList.add("blink_text");
    outerStockContainerNameEl.textContent = "Symbol does not exist";
  }
};

//clear containers
var clearOut = function () {
    outerStockContainerEl.classList.remove("blink_text");
    outerStockContainerNameEl.textContent = "";
    outerStockContainerCompanyNameEl.textContent = "";
    outerStockContainerOpeningPriceEl.textContent = "";
    outerStockContainerCurrentPriceEl.textContent = "";
    outerStockContainerChangePercentEl.textContent = "";
    outerStockContainerAbsoluteEl.textContent = "";
    outerStockContainerMarketCapEl.textContent = "";
};

//fetch call for stockdata from API
var getStockData = function (stockInput) {
  var ApiKey =
    "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=" + stockInput + "&interval=5min&apikey=EME3FI6FSOTMXXLD";
  fetch(ApiKey)
    .then((res) => res)
    .then(function (response) {
      if (response.ok) {
        response.json().then(function (data) {
          displayStockData(data, stockInput);
        });
      } 
      else {
        outerStockContainerNameEl.textContent = "No Stock Data Returned: XXXX";
        console.log('1')
      }
    })
};
//fetch call for marketcap data from API
var getMarketCap = function (stockInput) {
  var ApiKey =
    "https://www.alphavantage.co/query?function=OVERVIEW&symbol=" + stockInput + "&apikey=EME3FI6FSOTMXXLD";
  fetch(ApiKey)
    .then((res) => res)
    .then(function (response) {
      if (response.ok) {
        response.json().then(function (data) {
          displayMarketCap(data);
        });
      } else {
        outerStockContainerNameEl.textContent = "No Market Cap Returned: YYYY";
        console.log('2')
      }
    });
};

var displayStockData = function (data, stockInput) {

  //check if api returned any repos
  if (data.length === 0) {
    outerStockContainerNameEl.textContent = "No repos found, try again";
    return;
  }
  //get symbol name
  var stockName = stockInput;
  var StockNameEl = document.createElement("div");
  StockNameEl.textContent = "Ticker: " + stockName.toUpperCase();

  //get price starts here
  //getting this from the returned API
  

  try {
    var lastRefreshedTime = data["Meta Data"]["3. Last Refreshed"];
  }
  catch(err) {
    outerStockContainerNameEl.textContent = "No Stock Data Returned";
    return 0;
  }  
  
  var lastRefreshFail = data["Error Message"];

  if(lastRefreshFail){
     console.log('I FAILED')
  }
  else{
    //getting this from returned data using lastRefreshedTime
    var currentClosePrice = data["Time Series (5min)"][lastRefreshedTime]["4. close"];
    currentClosePrice = parseFloat(currentClosePrice).toFixed(2);
    var currentClosePriceEl = document.createElement("div");
    currentClosePriceEl.textContent = "Current Price: $" + currentClosePrice;

    //Objects.keys returns an array of all the keys from the data [time Series]
    var listOfTimes = Object.keys(data["Time Series (5min)"]);

    //sorting the data returned and the default is asc alphabitcally
    listOfTimes.sort();

    //returning the earliest time from the listOfTimes sort in this case the [0] array item
    var openingTime = listOfTimes[0];

    //getting the opening time using the opening time from the array above
    var dayOpeningPrice = data["Time Series (5min)"][openingTime]["4. close"];
    var dayOpeningPrice = parseFloat(dayOpeningPrice).toFixed(2);
    var dayOpeningPriceEl = document.createElement("div");
    dayOpeningPriceEl.textContent = "Opening Day Price: $" + dayOpeningPrice;

    //calculations start here
    //storing the percentage growth from the currentClosePrice and the dayOpeningPrice from above
    var growthPercentage = (currentClosePrice / dayOpeningPrice - 1) * 100;
    growthPercentage = parseFloat(growthPercentage).toFixed(2);
    var growthPercentageEl = document.createElement("div");
    growthPercentageEl.textContent =
        "Change Percentage: " + growthPercentage + "%";

    //storing the difference from currentClosePricee and dayOpeningPrice
    var absoluteGrowth = currentClosePrice - dayOpeningPrice;
    absoluteGrowth = parseFloat(absoluteGrowth).toFixed(2);
    var absoluteGrowthEl = document.createElement("div");
    if (absoluteGrowth < 1) {
        absoluteGrowthEl.textContent = "Change: " + absoluteGrowth + " dollars";
    } else {
        absoluteGrowthEl.textContent = "Change: $" + absoluteGrowth;
    }

    //append to outer container
    outerStockContainerNameEl.appendChild(StockNameEl);
    outerStockContainerOpeningPriceEl.appendChild(dayOpeningPriceEl);
    outerStockContainerCurrentPriceEl.appendChild(currentClosePriceEl);
    outerStockContainerChangePercentEl.appendChild(growthPercentageEl);
    outerStockContainerAbsoluteEl.appendChild(absoluteGrowthEl);

    //outer container big one
    outerStockContainerEl.appendChild(outerStockContainerCompanyNameEl);
    outerStockContainerEl.appendChild(outerStockContainerNameEl);
    outerStockContainerEl.appendChild(outerStockContainerOpeningPriceEl);
    outerStockContainerEl.appendChild(outerStockContainerCurrentPriceEl);
    outerStockContainerEl.appendChild(outerStockContainerChangePercentEl);
    outerStockContainerEl.appendChild(outerStockContainerAbsoluteEl);
    outerStockContainerEl.appendChild(outerStockContainerMarketCapEl);
  }




};

// function to pull and display the market capitalization information
var displayMarketCap = function (data) {
  var marketCap = data.MarketCapitalization;
  var companyName = data["Name"];
  // Could add in things like description, PE, exchange, others from here

  // Recursive loop for determining the post-fix for market cap according to the company's valuation.
  var marketCapIterate = function (data, counter) {
    data = parseInt(data);
    var testVal = data / 1000;
    if (testVal > 999) {
      return marketCapIterate(data / 1000, counter + 1);
    } else {
      caps = { 0: " Thousand", 1: " Million", 2: " Billion", 3: " Trillion" };
      var returnVal = testVal.toString() + caps[counter];
      return returnVal.toString();
    }
  };

  var marketCapFormatted = marketCapIterate(marketCap, 0);
  
  outerStockContainerCompanyNameEl.textContent = companyName;
  outerStockContainerMarketCapEl.textContent = "Market Cap: $ " + marketCapFormatted;
};

//On click form submit even handler
stockSubmit.addEventListener("click", formSubmitHandler);
// Trigger the searchbox function when enter is released
document.addEventListener("keyup", function(event) {
    // Number 13 is the "Enter" key on the keyboard?? why doesnt that work?
    if (event.code == 'Enter') {
        stockSubmit.click()
    }
});
