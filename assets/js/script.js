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
var chart;
var mktCapContainer = document.querySelector('#mkt-cap-vis')
var mktCapTot = document.querySelector('#total-mkt-cap-comp')
var mktCapDay = document.querySelector('#day-mkt-cap-comp')


// Stock Data Storage
var stockDataContainer = {};

// TODO: implement data addition to this while looking for 9:30 and 4:00 values in the time-series data
var stockTimeSeries = {};

// Error Message Container
var errorMessage = '';

// Recursive loop for determining the post-fix for market cap according to the company's valuation.
var magnitudeIterate = function (val, counter) {
  value = parseInt(val);
  var newMag = value / 1000;
  if (newMag >= 1000) {
    return magnitudeIterate(newMag, counter + 1);
  } else {
    magnitude = { 0: " Thousand", 1: " Million", 2: " Billion", 3: " Trillion" };
    var returnVal = newMag.toString() + magnitude[counter];
    return returnVal;
  }
};


//This executes when the event listener kicks off to handle the button click
var formSubmitHandler = function (event) {
  event.preventDefault();
  var stockInput = document.querySelector("#stock-input").value.trim();
  console.log('Fetching Data for: ',stockInput);
  if (stockInput) {
    getStockInfo(stockInput);
  } else {
    return 1;
  }
};

//fetch call for stockdata from API
var getStockInfo = function (stockInput) {
  var timeSeries =
    "https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=" + stockInput + "&interval=15min&apikey=EME3FI6FSOTMXXLD";
  var overview =
    "https://www.alphavantage.co/query?function=OVERVIEW&symbol=" + stockInput + "&apikey=OUE8TXQ1L0CBMKMQ";
  var clearInput = document.querySelector("#stock-input");
  clearInput.value = "";
  clearOut();
  fetch(timeSeries)
    .then((res) => res)
    .then(function (response) {
      if (response.ok) {
        response.json().then(function (data) {
          if (data['Meta Data']) {
            storeDailyData(data);
          } else {
            console.log('Timeseries API call failed on:', stockInput);
            console.log(data)
            stockDataContainer = {};
          }
        });
      } 
      else {
        console.log('this should cause the chain to break');
        ;
      }
      return fetch(overview);
    })
    .then((res) => res)
    .then(function (response) {
      if (response.ok) {
        response.json().then(function (data) {
          if (stockDataContainer.openPrice && data['Symbol']) {
            storeStockInfo(data);
            rewriteStockInfo();
            mktCapPerspective();
            saveToLocalStorage();
            // createChart(stockDataContainer.timeSeries, stockDataContainer.listOfCloseValues);
          } else {
            console.log('Overview API call failed on: ', stockInput);
            console.log(data)
            errorMessage = "Failed to find data for ticker: "+stockInput;
            stockDataContainer = {};
            outerStockContainerCompanyNameEl.innerHTML = errorMessage+'<br>';
            // $('#total-mkt-cap-comp').html('Please try another ticker or wait for 1 minute before trying another search. See console for details.')
            errorMessage = '';
          }
        });
      }
    })
};

var storeDailyData = function (data) {
  var content = data['Meta Data']
  // if API call succeeds
  if (content){

    // add stuff to stockDataContainer)
    var lastRefreshedTime = data["Meta Data"]["3. Last Refreshed"];
    
    //last day is the date only and not the time in the entire string
    var lastDay = lastRefreshedTime.split(" ")[0];

    var marketOpenPrice = data["Time Series (15min)"][lastDay + " 09:45:00"]["4. close"];
    marketOpenPrice = parseFloat(marketOpenPrice).toFixed(2);
    var marketClosePrice = data["Time Series (15min)"][lastDay + " 16:00:00"]["4. close"];
    marketClosePrice = parseFloat(marketClosePrice).toFixed(2);

    //Objects.keys returns an array of all the keys from the data [time Series]
    var listOfTimes = Object.keys(data["Time Series (15min)"]);
    // .filter loops through listOfTimes and removes anything that doesn't match
    var filteredListOfTimes = listOfTimes.filter(function(time){
      //what does the return do: 
      return time.indexOf(lastDay) > -1  //anything that includes lastDay (ie. 2020-10-20) "-1 means it didn't find anything"
    });

    //get the list of values to create a graph with - Kumash asked for the data stored in a variable
    var listOfCloseValues = filteredListOfTimes.map(function(time){  
      return {
        value:data["Time Series (15min)"][time]["4. close"],
        time:time
      } 
    })



    //calculations start here
    //storing the percentage growth from the currentClosePrice and the dayOpeningPrice from above
    var growthPercentage = (marketClosePrice / marketOpenPrice - 1) * 100;
    growthPercentage = parseFloat(growthPercentage).toFixed(2);

    //storing the difference from currentClosePricee and dayOpeningPrice
    var absoluteGrowth = marketClosePrice - marketOpenPrice;
    absoluteGrowth = parseFloat(absoluteGrowth).toFixed(2);

    stockDataContainer.openPrice = marketOpenPrice;
    stockDataContainer.lastPrice = marketClosePrice;
    stockDataContainer.changePerc = growthPercentage;
    stockDataContainer.changeAbs = absoluteGrowth;
    if (absoluteGrowth < 0) {
      stockDataContainer.loss = true;
    } else {stockDataContainer.loss = false;}
    stockDataContainer.timeSeries = data;
    stockDataContainer.listOfCloseValues = listOfCloseValues;
  }else{
    // Produce Error Message
  }

}

var createChart = function(data, listOfCloseValues){
//new chart here
    //Start of Chart.JS visualization ************
    var listOfTime = [];

    for(var i = 0; i <= listOfCloseValues.length - 1; i++){
      var one = listOfCloseValues[i].time;
      listOfTime.push(one);
      listOfTime.sort();
    }
  
    var listOfValues = [];

    for(var i = 0; i <= listOfCloseValues.length - 1; i++){
      var two = listOfCloseValues[i].value;
      listOfValues.push(parseFloat(two));
    }
  
    var companyNameDisplay = data["Meta Data"]["2. Symbol"]
    var upperComp = companyNameDisplay.toUpperCase();
    
    var ctx = document.getElementById('myChart').getContext('2d');

    //checks to see if chart exists, if it does destroy() is called to render new chart

    Chart.defaults.global.defaultFontColor = 'white';
    //render new chart
    chart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: listOfTime,
          datasets: [{
              label: upperComp,
              backgroundColor:'rgb(148, 189, 255)',
              borderColor: 'rgb(12, 102, 247)',
              data: listOfValues
          }]
      },
        options: {}
  });
}

// function to pull and display the stock overview information
var storeStockInfo = function (data) {

  // if API call succeeds
  if (data.Symbol){
    console.log('Overview API Succeeded')
  
  // Could add in things like description, PE, exchange, others from here
  var marketCap = data.MarketCapitalization;
  var companyName = data["Name"];
  var ticker = data["Symbol"];
  var desc = data["Description"];
  var sharesTotal = data['SharesOutstanding'];
  var emp = data["FullTimeEmployees"];


  var marketCapFormatted = magnitudeIterate(marketCap, 0);
  stockDataContainer.tickerName = ticker;
  stockDataContainer.companyName = companyName;
  stockDataContainer.marketCap = marketCap;
  stockDataContainer.marketCapFormatted = marketCapFormatted;
  stockDataContainer.description = desc;
  stockDataContainer.SharesOutstanding = sharesTotal;
  stockDataContainer.employees = emp;
  } else {
    // Produce Error Message
    console.log(data);
}};

//clear containers
var clearOut = function () {
  outerStockContainerEl.classList.remove("blink_text");
  outerStockContainerEl.style = '';
  // mktCapContainer.style = '';
  outerStockContainerNameEl.textContent = "";
  outerStockContainerCompanyNameEl.textContent = "";
  outerStockContainerOpeningPriceEl.textContent = "";
  outerStockContainerCurrentPriceEl.textContent = "";
  outerStockContainerChangePercentEl.textContent = "";
  outerStockContainerAbsoluteEl.textContent = "";
  outerStockContainerMarketCapEl.textContent = "";
  if(chart){
    chart.destroy()
  }
  // $('#mkt-cap-hdr').html("");
  // mktCapTot.textContent = "";
  // mktCapDay.textContent = "";
};

// rewrites the stock-info and its contents based on info from stockDataContainer
var rewriteStockInfo = function() {
  outerStockContainerNameEl.textContent = stockDataContainer.tickerName;
  outerStockContainerCompanyNameEl.textContent = stockDataContainer.companyName;
  outerStockContainerOpeningPriceEl.textContent = "Opening Price: $" + stockDataContainer.openPrice;
  outerStockContainerCurrentPriceEl.textContent ="Current Price: $" +  stockDataContainer.lastPrice;
  outerStockContainerChangePercentEl.textContent = "Change Percentage: " + stockDataContainer.changePerc +"%";
  outerStockContainerAbsoluteEl.textContent = "Change: " + stockDataContainer.changeAbs +' Dollars';
  outerStockContainerMarketCapEl.textContent =  "Market Cap: $ " + stockDataContainer.marketCapFormatted;

  if (stockDataContainer.loss) {
    outerStockContainerEl.style = 'background-color:hsl(348,100%,61%);';
   } else {
    outerStockContainerEl.style = 'background-color:hsl(171, 100%, 41%);';
   }
}

// market-cap Visualizer
var mktCapPerspective = function() {

  // if stockDataContainer.loss is true than use lost instead of gained
  var keyword = 'gained';
  if (stockDataContainer.loss) {keyword = 'lost'}

  // variables for compairson
  var medianIndividualIncome =  36400;
  var exchangeRate = 0.77;


  // input a dollar ammount, get back its proportion to the market cap in terms of 1. total marketcap, 2. change in marketcap for the day
  var diffCalculator = function(value) {
    var totalEquivalence = stockDataContainer.marketCap / value;
    var dailyEquivalence = Math.abs(parseInt((stockDataContainer.changeAbs*stockDataContainer.SharesOutstanding)/value))

    return [totalEquivalence, dailyEquivalence]
  }

  /// mktCap / medianIndividualIncome == num of people funded for a year
  /// (dayChange*sharesOutstanding) / medianHouseholdIncome = num of people that can be funded for a year based on today's movements
  var medianIncomeComp = diffCalculator(medianIndividualIncome*exchangeRate);

  // rewrite the html for the info card
  // $('#mkt-cap-hdr').html("The median Canadian makes $"+medianIndividualIncome+" CAD per year (2018):");
  // mktCapTot.innerHTML = stockDataContainer.tickerName +"'s valuation would be equivalent to the salary of <b>"
  //                       + magnitudeIterate(medianIncomeComp[0], 0) + " Canadians.</b>";
  // mktCapDay.innerHTML = "The daily change in "+stockDataContainer.tickerName+"'s stock price represents <b>"+
  //                      medianIncomeComp[1]+" Canadians income</b> worth of value "
  //                       +keyword+'. In real dollars, that would be <b>$'+
  //                       magnitudeIterate(medianIncomeComp[1]*medianIndividualIncome, 0)+'</b>.';
  

}

// adding a stock to the history dropdown
var appendToHistoryList = function (ticker) {

  // Setting up the link structure
  var link = $('<a>').attr('class','dropdown-item watchlist-item').attr("href","#").attr('id',ticker+'-container');
  var button = $('<span>').attr('class', 'stock-search-button').html(ticker);
  var remove = $('<a>').attr('class', 'icon is-medium p-3 trash-item').attr('id', ticker+'-padding')
              .html('<i class="fa fa-trash" id="'+ticker+'-rmv"></i>');

  // Adding the link to the page
  link.append(button).append(remove);
  $("#inner-history").append(link);

  // attaching on-click event listeners 1 for removal, other for retreiving updated stock info for the clicked element.
  remove.on('click', function(event) {console.log(); removeFromWatchlist($(event.target))});
  button.on('click', function(event) {console.log(); getStockInfo(event.target.textContent)});
};

// Remove the target and its parent link from the watchlist
var removeFromWatchlist = function(target) {
  // Get parent Container and remove it
  var ticker = (target.attr('id').split('-')[0]);
  $('#'+ticker+'-container').remove();  

  // Remove from Localstorage
  watchList = localStorage.getItem('stock-list')
  watchList = JSON.parse(watchList);
  delete watchList[ticker]
  watchList = JSON.stringify(watchList);
  localStorage.setItem('stock-list', watchList);

  // Redraw the Visualization
  visualizeMarketCap();
};

var saveToLocalStorage = function() {
  var searchHistory = localStorage.getItem('stock-list')
  var name = stockDataContainer.tickerName;
  
  // if search history already exists
  if (searchHistory) {
      searchHistory = JSON.parse(searchHistory);
      // and if search-history already has the ticker, then just update that ticker
      // dont include timeseries because that'll make everything too big
      if (searchHistory[name]){
        console.log(name)
        searchHistory[name] = stockDataContainer;
        searchHistory = JSON.stringify(searchHistory);
        localStorage.setItem('stock-list',searchHistory);
        visualizeMarketCap();
      }
      // and if search-history doesnt have the ticker, then add that ticker
      else {
      searchHistory[name] = stockDataContainer;
      searchHistory = JSON.stringify(searchHistory);
      localStorage.setItem('stock-list',searchHistory);
      appendToHistoryList(name);
      visualizeMarketCap();
      }
  }

  else {
    // if search history doesnt exist make a new contianer and add the ticker
      searchHistory = {};
      searchHistory[name] = stockDataContainer;
      searchHistory = JSON.stringify(searchHistory);
      localStorage.setItem('stock-list',searchHistory);
      appendToHistoryList(name);
      visualizeMarketCap();
  }
}

// Load all data
var loadFromLocalStorage = function() {
  searchHistory = localStorage.getItem('stock-list')
  if (searchHistory) {
      searchHistory = JSON.parse(searchHistory);
      for (x in searchHistory) {
        appendToHistoryList(x)
      }
  }
}
loadFromLocalStorage();

//On click form submit even handler
stockSubmit.addEventListener("click", formSubmitHandler);
// Trigger the searchbox function when enter is released
document.addEventListener("keyup", function(event) {
    if (event.code == 'Enter') {
        stockSubmit.click();
    }
});

window.onresize = visualizeMarketCap;

///////////////////