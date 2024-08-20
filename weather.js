//To make it work just log in to https://openweathermap.org/ wait until your API key is generated and paste it in the 5th line
//disclaimer: works only on FIREFOX. For example on OperaGX it's just complete blob.
//It's not laziness, just the purpose of the project was to provide functional app that works fine with API, not to master it in every aspect, especially design.  
//Don't mind that everything is in one .css and .js file - we've all been there.
const API_KEY = "your api key";
const searchForm = document.querySelector(".search-container");
const cityInput = document.querySelector("#search");
const localizeButton = document.querySelector("#pin-button");
const instructionMessage = document.querySelector(".localize-self")

const selectedWeatherContainer = document.querySelector(".selected-weather-container")
const humidityIndicator = document.querySelector("#day-humidity-indicator")
const selectedDayCard = document.querySelector(".main-card-sub")
const detailsCards = document.querySelectorAll(".details");

const otherDaysCointainer = document.querySelector(".days-weather-container")
const otherDaysButtons = document.querySelectorAll(".day-button");
let isDOMLoadedCompletely = false;  //If not loaded do not execute

const weatherSprites = [
    "./sprites/storm.png",
    "./sprites/drizzle.png",
    "./sprites/rain.png",
    "./sprites/snow.png",
    "./sprites/foggy.png",
    "./sprites/sun.png",
    "./sprites/cloud-sun.png",
    "./sprites/cloudy.png"
];
humidityIndicator.disabled = true;

let currentDayID = 0;
let globalResultsCopy; //Oh please, it's terrible and bone chilling but I want to finish this project whatever sacrifice it takes.
searchForm.addEventListener("submit", async event=>{
    event.preventDefault();
    resetOtherDaysButtonsHighlight();
    const city = cityInput.value;
    cityInput.value = "";
    if(city){
        try{
            const coords = await getCoordinatesFromCity(city);
            const [
                {lat, lon, name}
            ] = coords;
            
            const weatherData = await getWeatherData(lat, lon);
            displayWeatherInfo(weatherData);
        }catch(error){
            displayError(error);
        }
    }else{
        displayError("No city input");
    }
});
otherDaysButtons.forEach(button =>{
    button.addEventListener("click", () =>{
        const buttonID = Number(button.id[4]);
        currentDayID = buttonID;
        otherDaysButtons.forEach(elem => elem.classList.remove("active-button"));
        button.classList.add("active-button");
        updateMainCard(globalResultsCopy);
    })
})
function resetOtherDaysButtonsHighlight(){
    currentDayID = 0;
    otherDaysButtons.forEach(elem => elem.classList.remove("active-button"));
    otherDaysButtons[0].classList.add("active-button");
}
async function getCoordinatesFromCity(city){
    const apiURL = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`;
    const response = await fetch(apiURL);
    if(!response.ok){
        throw new Error(`Couldn't get coordinates from the city called ${city}`);
    }
    return await response.json();
}

async function getWeatherData(lat, lon){
    try{
        const apiURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        const response = await fetch(apiURL);
        return await response.json();
    }
    catch(error){
        console.error(error);
    }
   
}
function displayWeatherInfo(data){
    const cityName = data.city.name;
    const citySunrise = data.city.sunrise;
    const citySunset = data.city.sunset;
    const cityTimeZone = data.city.timezone;
    //[11, 12] godzina
    const results = data.list.map(({ dt_txt, main: { temp, humidity, pressure }, weather: [{ description, id }], wind: { speed } }) => ({
        city: cityName,
        sunrise: citySunrise,
        sunset: citySunset,
        timezone: cityTimeZone,
        date: dt_txt,
        temp,
        humidity,
        pressure,
        description,
        id,
        speed
    })).filter((_, index) => index % 8 === 0).slice(0,5);

    globalResultsCopy = results;

    instructionMessage.style.display = "none";
    selectedWeatherContainer.style.display = "flex";
    otherDaysCointainer.style.display = "flex";
    
    updateMainCard(results);
    updateOtherDays(results);
}

function updateMainCard(results){
    //HUMIDITY
    const humidityLabel = humidityIndicator.parentElement.children[1];
    humidityLabel.textContent = `${results[currentDayID].humidity/100}`;
    humidityIndicator.value = results[currentDayID].humidity;

    //MAIN CARD
        // a) city name
    selectedDayCard.children[0].textContent = results[currentDayID].city;
        // b)weather icon
    let weatherIconPath;
    let id = results[currentDayID].id;
    switch(true){
        case (id >= 200 && id < 300): weatherIconPath = weatherSprites[0];break;
        case (id >= 300 && id < 500): weatherIconPath = weatherSprites[1];break;
        case (id >= 500 && id < 600): weatherIconPath = weatherSprites[2];break;
        case (id >= 600 && id < 700): weatherIconPath = weatherSprites[3];break;
        case (id >= 700 && id < 800): weatherIconPath = weatherSprites[4];break;
        case (id === 800): weatherIconPath = weatherSprites[5]; break;
        case (id === 801): weatherIconPath = weatherSprites[6];break;
        case (id > 801): weatherIconPath = weatherSprites[7];break;
    }
    selectedDayCard.children[1].src = weatherIconPath;

        // c) temperature
    selectedDayCard.children[2].textContent = `${(results[currentDayID].temp-273).toFixed(0)}°C`;

        // d) full date
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + currentDayID);
    let date = currentDate.toLocaleDateString(
        "en-EN", {weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric'}
    ); 
    selectedDayCard.children[3].textContent = `${date}`;


    //DETAILS CARDS
        // a) sunrise
    let sunUp = moment.utc(results[currentDayID].sunrise, 'X').add(results[currentDayID].timezone, 'seconds').format('HH:mm a');
    detailsCards[0].children[1].textContent = `${sunUp}`
        // b) sunset
    let sunDown = moment.utc(results[currentDayID].sunset, 'X').add(results[currentDayID].timezone, 'seconds').format('HH:mm a');
    detailsCards[1].children[1].textContent = `${sunDown}`
        // c) atmospheric pressure
    detailsCards[2].children[1].textContent = `${results[currentDayID].pressure} hPa`;
        // d) wind speed
    detailsCards[3].children[1].textContent = `${(results[currentDayID].speed * 3.6).toFixed(1)} km/h`;


}
function updateOtherDays(results){
    //Man, free OpenWeather actually sucks because It update every 3 hours and always returns 40 values, the previous hours dissappear 
    //so it's hard to calculate average temperature or else, if user logs in at 23:50 he will get the 21:00 temperature.
    otherDaysButtons.forEach((button, index)=> {
        //display day
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + index);
        let day = currentDate.toLocaleDateString("en-EN", {weekday: 'short'});
        button.children[0].textContent = day;
        
        //display weather icon
        let id = results[index].id;
        switch(true){
            case (id >= 200 && id < 300): button.children[1].src=weatherSprites[0];break;
            case (id >= 300 && id < 500): button.children[1].src=weatherSprites[1];break;
            case (id >= 500 && id < 600): button.children[1].src=weatherSprites[2];break;
            case (id >= 600 && id < 700): button.children[1].src=weatherSprites[3];break;
            case (id >= 700 && id < 800): button.children[1].src=weatherSprites[4];break;
            case (id === 800):  button.children[1].src = weatherSprites[5]; break;
            case (id === 801): button.children[1].src = weatherSprites[6];break;
            case (id > 801): button.children[1].src = weatherSprites[7];break;
         }

         //temperature
        button.children[2].textContent = `${(results[index].temp-273).toFixed(0)}°C`;
    })
}


function displayError(error){
    console.error(error);
}

//localize with localization button
localizeButton.addEventListener("click", ()=>{
    if(navigator.geolocation){
        navigator.geolocation.getCurrentPosition(successCallback, errorCallback)
    }else{
        alert("Geolocation not supported");
    }
})
async function successCallback(position){
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    resetOtherDaysButtonsHighlight();
    if(latitude && longitude){
        try{
            cityInput.value = "";
            const weatherData = await getWeatherData(latitude, longitude);
            displayWeatherInfo(weatherData);
        }catch(error){
            displayError(error);
        }
    }
}
function errorCallback(error){
    switch(error.code) {
        case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.");
            break;
    }
}