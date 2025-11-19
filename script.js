const API_KEY = MY_API_KEY;
const API_URL = 'https://api.weatherapi.com/v1';
// WEATHER ICONS MAP
const weatherIcons = {'Sunny':'wi-day-sunny','Clear':'wi-night-clear','Partly cloudy':'wi-day-cloudy','Cloudy':'wi-cloudy','Overcast':'wi-cloudy',
    'Mist':'wi-fog','Patchy rain possible':'wi-day-rain','Patchy snow possible':'wi-day-snow','Patchy sleet possible':'wi-day-sleet',
    'Patchy freezing drizzle possible':'wi-day-sleet','Thundery outbreaks possible':'wi-day-thunderstorm','Blowing snow':'wi-snow-wind','Blizzard':'wi-snow-wind','Fog':
    'wi-fog','Freezing fog':'wi-fog','Patchy light drizzle':'wi-sprinkle','Light drizzle':'wi-sprinkle','Freezing drizzle':'wi-sleet','Heavy freezing drizzle':'wi-sleet','Patchy light rain':
    'wi-rain','Light rain':'wi-rain','Moderate rain at times':'wi-rain','Moderate rain':'wi-rain','Heavy rain at times':'wi-rain','Heavy rain':'wi-rain','Light freezing rain':'wi-rain-mix','Moderate or heavy freezing rain':'wi-rain-mix','Light sleet':'wi-sleet','Moderate or heavy sleet':'wi-sleet',
    'Patchy light snow':'wi-snow','Light snow':'wi-snow','Patchy moderate snow':'wi-snow','Moderate snow':'wi-snow','Patchy heavy snow':'wi-snow',
    'Heavy snow':'wi-snow','Ice pellets':'wi-hail','Light rain shower':'wi-showers','Moderate or heavy rain shower':'wi-showers','Torrential rain shower':
    'wi-showers','Light sleet showers':'wi-sleet','Moderate or heavy sleet showers':'wi-sleet','Light snow showers':'wi-snow','Moderate or heavy snow showers':'wi-snow','Light showers of ice pellets':'wi-hail','Moderate or heavy showers of ice pellets':'wi-hail','Patchy light rain with thunder':
    'wi-thunderstorm','Moderate or heavy rain with thunder':'wi-thunderstorm','Patchy light snow with thunder':'wi-thunderstorm','Moderate or heavy snow with thunder':'wi-thunderstorm'};

// ============================================
// GLOBAL VARIABLES
let weatherChart = null;

function $(id) {
    return document.getElementById(id);
}

// Set text content of an element
function setText(id, text) {
    const element = $(id);
    if (element) {
        element.textContent = text;
    }
}

// Get weather icon class based on condition
function getWeatherIcon(condition, isDay) {
    // Try to find exact match
    let iconClass = weatherIcons[condition];
    
    // If no match, search for keywords
    if (!iconClass) {
        const lower = condition.toLowerCase();
        if (lower.includes('rain')) iconClass = 'wi-rain';
        else if (lower.includes('snow')) iconClass = 'wi-snow';
        else if (lower.includes('cloud')) iconClass = 'wi-cloudy';
        else if (lower.includes('sun') || lower.includes('clear')) {
            iconClass = isDay ? 'wi-day-sunny' : 'wi-night-clear';
        }
        else iconClass = 'wi-day-cloudy';
    }
    
    return iconClass;
}

// ============================================
// THEME FUNCTIONS


function toggleTheme() {
    // Toggle light mode class
    document.body.classList.toggle('light-mode');
    
    // Update theme icon
    const themeIcon = $('themeIcon');
    const isLight = document.body.classList.contains('light-mode');
    themeIcon.className = isLight ? 'far fa-moon' : 'fas fa-sun';
    themeIcon.style.color = isLight ? '#000000ff' : '#ffffffff';   
    
    // Update chart colors if chart exists
    if (weatherChart) {
        updateChartColors();
    }
}

function updateChartColors() {
    const isLight = document.body.classList.contains('light-mode');
    const textColor = isLight ? '#666' : '#b0b0b0';
    const gridColor = isLight ? '#e0e0e0' : '#3a3a3a';
    
    
    // Update chart colors
    weatherChart.options.scales.x.ticks.color = textColor;
    weatherChart.options.scales.y.ticks.color = textColor;
    weatherChart.options.scales.y.grid.color = gridColor;
    weatherChart.update();
}

// ============================================
// UI FUNCTIONS

function showLoading() {
    $('loading').style.display = 'block';
    $('weatherData').style.display = 'none';
}

function hideLoading() {
    $('loading').style.display = 'none';
}

function showError(message) {
    $('error').textContent = message;
    $('error').style.display = 'block';
    $('weatherData').style.display = 'none';
}

function hideError() {
    $('error').style.display = 'none';
}

// ============================================
// API FUNCTIONS


function isValidAPIKey() {
    if (!API_KEY.trim()) {
        showError('Please enter a valid WeatherAPI key.');
        return false;
    }
    return true;
}

async function fetchWeather(city) {
    const url = `${API_URL}/forecast.json?key=${API_KEY}&q=${city}&days=7&aqi=yes`;
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error(response.status);
    }
    
    return response.json();
}

function getErrorMessage(statusCode) {
    if (statusCode === '401') return 'Invalid API key';
    if (statusCode === '400') return 'City not found';
    return 'Unable to fetch weather data';
}

// ============================================
// SEARCH FUNCTION

async function searchWeather() {
    // Validate API key
    if (!isValidAPIKey()) return;
    
    // Get city name
    const city = $('cityInput').value.trim();
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    // Show loading
    showLoading();
    hideError();
    
    try {
        // Fetch weather data
        const data = await fetchWeather(city);
        
        // Display data
        displayWeatherData(data);
        $('weatherData').style.display = 'block';
    } catch (error) {
        // Show error
        const errorMessage = getErrorMessage(error.message);
        showError(errorMessage);
    }
    
    // Hide loading
    hideLoading();
}

// DISPLAY FUNCTIONS
// ============================================

function displayWeatherData(data) {
    const { current, location, forecast } = data;
    const today = forecast.forecastday[0];
    
    // Display current weather
    displayCurrentWeather(current, location);
    
    // Display weather details
    displayWeatherDetails(current);
    
    // Display sunrise/sunset
    setText('sunrise', today.astro.sunrise);
    setText('sunset', today.astro.sunset);
    
    // Display air quality
    const aqi = Math.round(current.air_quality?.['us-epa-index'] * 100 || 0);
    setText('aqiValue', aqi > 999 ? (aqi / 1000).toFixed(2) + 'K' : aqi);
    
    // Display forecast
    displayForecast(forecast.forecastday);
    
    // Display rain chances
    displayRainChances(forecast.forecastday);
    
    // Display chart
    displayChart(forecast.forecastday);
}

function displayCurrentWeather(current, location) {
    // Location and temperature
    setText('mainLocation', location.name + ', ' + location.country);
    setText('mainTemp', Math.round(current.temp_c) + ' °C');
    setText('mainCondition', current.condition.text);
    
    // Last updated
    const date = new Date(location.localtime);
    const formattedDate = date.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short' 
    });
    setText('lastUpdated', 'Last Updated: ' + formattedDate);
    
    // Weather icon
    const iconClass = getWeatherIcon(current.condition.text, current.is_day);
    $('mainWeatherIcon').className = 'wi ' + iconClass;
}

function displayWeatherDetails(current) {
    setText('humidity', current.humidity);
    setText('windSpeed', Math.round(current.wind_kph) + ' km/h');
    setText('visibility', current.vis_km + ' km');
    setText('pressure', (current.pressure_mb / 33.86).toFixed(2) + ' Hg');
    setText('uvIndex', current.uv);
    setText('precipitation', current.precip_mm.toFixed(2) + ' mm');
}

function displayForecast(forecastDays) {
    const grid = $('forecastGrid');
    grid.innerHTML = '';
    
    forecastDays.forEach(day => {
        // Get day name
        const dayName = new Date(day.date).toLocaleDateString('en-US', { 
            weekday: 'short' 
        });
        
        // Calculate average cloud coverage
        const avgCloud = day.hour ? 
            Math.round(day.hour.reduce((sum, h) => sum + h.cloud, 0) / day.hour.length) : 0;
        
        // Get icon
        const iconClass = getWeatherIcon(day.day.condition.text, 1);
        
        // Create card HTML
        const cardHTML = `
            <div class="forecast-day-card">
                <div class="day-name">${dayName}</div>
                <div class="day-icon"><i class="wi ${iconClass}"></i></div>
                <div class="day-temp">${Math.round(day.day.avgtemp_c)}°C</div>
                <div class="day-details">
                    <div>
                        <span><i class="fas fa-cloud"></i></span>
                        <span>${avgCloud}%</span>
                    </div>
                    <div>
                        <span><i class="fas fa-wind"></i></span>
                        <span>${Math.round(day.day.maxwind_kph)} km/h</span>
                    </div>
                    <div>
                        <span><i class="fas fa-tint"></i></span>
                        <span>${day.day.avghumidity}%</span>
                    </div>
                    <div>
                        <span><i class="fas fa-cloud-rain"></i></span>
                        <span>${day.day.daily_chance_of_rain}%</span>
                    </div>
                </div>
            </div>
        `;
        
        grid.innerHTML += cardHTML;
    });
}

function displayRainChances(forecastDays) {
    const container = $('rainChance');
    container.innerHTML = '';
    
    forecastDays.forEach(day => {
        // Get day name
        const dayName = new Date(day.date).toLocaleDateString('en-US', { 
            weekday: 'short' 
        });
        
        // Get rain chance
        const rainChance = day.day.daily_chance_of_rain;
        
        // Create rain item HTML
        const itemHTML = `
            <div class="rain-item">
                <div class="rain-day">${dayName}</div>
                <div class="rain-bar">
                    <div class="rain-fill" style="width: ${rainChance}%"></div>
                    <div class="rain-percentage">${rainChance}%</div>
                </div>
            </div>
        `;
        
        container.innerHTML += itemHTML;
    });
}

function displayChart(forecastDays) {
    const canvas = $('weatherChart');
    const isLight = document.body.classList.contains('light-mode');
    
    // Get data
    const labels = forecastDays.map(d => 
        new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
    );
    const temperatures = forecastDays.map(d => Math.round(d.day.avgtemp_c));
    
    // Get colors based on theme
    const textColor = isLight ? '#666' : '#b0b0b0';
    const gridColor = isLight ? '#e0e0e0' : '#3a3a3a';
    
    // Destroy old chart if exists
    if (weatherChart) {
        weatherChart.destroy();
    }
    
    // Create new chart
    weatherChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: temperatures,
                borderColor: '#ff7b54',
                backgroundColor: 'rgba(255, 123, 84, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#ff7b54',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    grid: { color: gridColor },
                    ticks: { color: textColor }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textColor }
                }
            }
        }
    });
}

// ============================================
// EVENT LISTENERS

// Search when Enter is pressed
$('cityInput')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchWeather();
    }
});

// Search on page load
document.addEventListener('DOMContentLoaded', function() {
    if (isValidAPIKey()) {
        searchWeather();
    }
});

// Function to change city (can be called from outside)
function changeCity(city) {
    $('cityInput').value = city;
    searchWeather();
}
