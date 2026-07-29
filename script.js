// API Endpoint (Free real-time exchange rates, no API key required)
const API_URL = "https://open.er-api.com/v6/latest/USD";

// DOM Elements
const amountInput = document.getElementById("amount");
const convertedInput = document.getElementById("converted-amount");
const fromCurrencySelect = document.getElementById("from-currency");
const toCurrencySelect = document.getElementById("to-currency");
const swapBtn = document.getElementById("swap-btn");
const copyBtn = document.getElementById("copy-btn");
const rateText = document.getElementById("rate-text");
const lastUpdated = document.getElementById("last-updated");
const connectionBanner = document.getElementById("connection-banner");
const popularGrid = document.getElementById("popular-grid");
const baseCurrencyLabel = document.getElementById("base-currency-label");
const filterChips = document.querySelectorAll(".filter-chip");
const toast = document.getElementById("toast");

// Currency Flags and Descriptions Mapping
const currencyData = {
    USD: { name: "United States Dollar", flag: "🇺🇸" },
    EUR: { name: "Euro", flag: "🇪🇺" },
    GBP: { name: "British Pound", flag: "🇬🇧" },
    IQD: { name: "Iraqi Dinar", flag: "🇮🇶" },
    AED: { name: "UAE Dirham", flag: "🇦🇪" },
    SAR: { name: "Saudi Riyal", flag: "🇸🇦" },
    TRY: { name: "Turkish Lira", flag: "🇹🇷" },
    JPY: { name: "Japanese Yen", flag: "🇯🇵" },
    CNY: { name: "Chinese Yuan", flag: "🇨🇳" },
    CAD: { name: "Canadian Dollar", flag: "🇨🇦" },
    AUD: { name: "Australian Dollar", flag: "🇦🇺" },
    CHF: { name: "Swiss Franc", flag: "🇨🇭" },
    KWD: { name: "Kuwaiti Dinar", flag: "🇰🇼" },
    QAR: { name: "Qatari Riyal", flag: "🇶🇦" },
    BHD: { name: "Bahraini Dinar", flag: "🇧🇭" },
    JOD: { name: "Jordanian Dinar", flag: "🇯🇴" },
    EGP: { name: "Egyptian Pound", flag: "🇪🇬" },
    INR: { name: "Indian Rupee", flag: "🇮🇳" },
    SEK: { name: "Swedish Krona", flag: "🇸🇪" },
    NZD: { name: "New Zealand Dollar", flag: "🇳🇿" }
};

let exchangeRates = {};
let currentPopularBase = "USD";

// Initialize Application
async function initApp() {
    setupEventListeners();
    checkConnectivity();
    await fetchExchangeRates();
}

// Fetch Exchange Rates with LocalStorage Fallback
async function fetchExchangeRates() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error("Failed to fetch rates");
        const data = await response.json();
        
        exchangeRates = data.rates;
        
        // Ensure IQD is present and fallback if needed
        if (!exchangeRates.IQD) {
            exchangeRates.IQD = 1310.0; // Standard fixed peg fallback
        }

        // Cache rates locally
        localStorage.setItem("cached_rates", JSON.stringify(exchangeRates));
        localStorage.setItem("cached_time", data.time_last_update_utc || new Date().toUTCString());

        updateLastUpdatedTime(data.time_last_update_utc || new Date());
        populateDropdowns();
        convertCurrency();
        renderPopularRates();
    } catch (error) {
        console.warn("API fetch failed, loading from cache...", error);
        const cachedRates = localStorage.getItem("cached_rates");
        const cachedTime = localStorage.getItem("cached_time");

        if (cachedRates) {
            exchangeRates = JSON.parse(cachedRates);
            updateLastUpdatedTime(cachedTime || "Cached data");
            populateDropdowns();
            convertCurrency();
            renderPopularRates();
        } else {
            lastUpdated.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:var(--danger)"></i> Failed to load rates`;
        }
    }
}

// Populate Currency Dropdowns
function populateDropdowns() {
    const currencies = Object.keys(exchangeRates).sort();
    
    // Remember current selections if any
    const currentFrom = fromCurrencySelect.value || "USD";
    const currentTo = toCurrencySelect.value || "IQD";

    fromCurrencySelect.innerHTML = "";
    toCurrencySelect.innerHTML = "";

    currencies.forEach(currency => {
        const flag = currencyData[currency]?.flag || "🏳️";
        const optionText = `${flag} ${currency} - ${currencyData[currency]?.name || currency}`;

        const option1 = document.createElement("option");
        option1.value = currency;
        option1.textContent = optionText;

        const option2 = document.createElement("option");
        option2.value = currency;
        option2.textContent = optionText;

        fromCurrencySelect.appendChild(option1);
        toCurrencySelect.appendChild(option2);
    });

    // Set defaults
    fromCurrencySelect.value = currencies.includes(currentFrom) ? currentFrom : "USD";
    toCurrencySelect.value = currencies.includes(currentTo) ? currentTo : "IQD";
}

// Convert Currency Logic
function convertCurrency() {
    const amount = parseFloat(amountInput.value) || 0;
    const from = fromCurrencySelect.value;
    const to = toCurrencySelect.value;

    if (!exchangeRates[from] || !exchangeRates[to]) return;

    // Convert through USD base
    const amountInUSD = amount / exchangeRates[from];
    const result = amountInUSD * exchangeRates[to];

    // Format output based on magnitude
    const decimals = result < 1 ? 4 : 2;
    convertedInput.value = result.toLocaleString('en-US', { 
        minimumFractionDigits: decimals, 
        maximumFractionDigits: decimals 
    });

    // Update single unit exchange rate info text
    const unitRate = (1 / exchangeRates[from]) * exchangeRates[to];
    const formattedUnitRate = unitRate < 1 ? unitRate.toFixed(4) : unitRate.toFixed(2);
    rateText.innerHTML = `1 ${from} = <span>${formattedUnitRate} ${to}</span>`;
}

// Render Popular Exchange Rates Grid
function renderPopularRates() {
    popularGrid.innerHTML = "";
    baseCurrencyLabel.textContent = currentPopularBase;

    const baseRate = exchangeRates[currentPopularBase];
    if (!baseRate) return;

    // Currencies to highlight in popular section
    const popularCurrencies = ["USD", "EUR", "GBP", "IQD", "AED", "SAR", "TRY", "JPY", "CAD", "AUD", "CHF", "KWD"]
        .filter(c => c !== currentPopularBase && exchangeRates[c]);

    popularCurrencies.forEach(currency => {
        const ratePerBase = exchangeRates[currency] / baseRate;
        const formattedRate = ratePerBase < 1 ? ratePerBase.toFixed(4) : ratePerBase.toFixed(2);
        const flag = currencyData[currency]?.flag || "🏳️";
        const name = currencyData[currency]?.name || currency;

        const card = document.createElement("div");
        card.className = "popular-item";
        card.innerHTML = `
            <div class="popular-item-top">
                <div class="currency-badge">
                    <span class="currency-flag">${flag}</span>
                    <span>${currency}</span>
                </div>
                <span class="popular-rate">${formattedRate}</span>
            </div>
            <span class="popular-name">${name}</span>
        `;
        popularGrid.appendChild(card);
    });
}

// Update Last Updated Timestamp
function updateLastUpdatedTime(timeString) {
    const date = new Date(timeString);
    const timeFormatted = isNaN(date) ? timeString : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    lastUpdated.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> Updated: ${timeFormatted}`;
}

// Event Listeners Setup
function setupEventListeners() {
    amountInput.addEventListener("input", convertCurrency);
    fromCurrencySelect.addEventListener("change", convertCurrency);
    toCurrencySelect.addEventListener("change", convertCurrency);

    // Swap Currencies
    swapBtn.addEventListener("click", () => {
        const temp = fromCurrencySelect.value;
        fromCurrencySelect.value = toCurrencySelect.value;
        toCurrencySelect.value = temp;
        convertCurrency();
    });

    // Copy Result
    copyBtn.addEventListener("click", () => {
        if (!convertedInput.value) return;
        navigator.clipboard.writeText(convertedInput.value);
        showToast();
    });

    // Popular Filter Chips
    filterChips.forEach(chip => {
        chip.addEventListener("click", (e) => {
            filterChips.forEach(c => c.classList.remove("active"));
            e.target.classList.add("active");
            currentPopularBase = e.target.getAttribute("data-base");
            renderPopularRates();
        });
    });

    // Online/Offline Listeners
    window.addEventListener("online", () => {
        connectionBanner.classList.add("hidden");
        fetchExchangeRates();
    });

    window.addEventListener("offline", () => {
        connectionBanner.classList.remove("hidden");
    });
}

// Show Toast Notification
function showToast() {
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// Check initial connection status
function checkConnectivity() {
    if (!navigator.onLine) {
        connectionBanner.classList.remove("hidden");
    }
}

// Run app on load
document.addEventListener("DOMContentLoaded", initApp);
