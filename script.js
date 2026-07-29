const API_URL = "https://open.er-api.com/v6/latest/USD";

let exchangeRates = {};
let supportedCurrencies = {};

const amountInput = document.getElementById("amount");
const convertedInput = document.getElementById("converted-amount");
const fromSelect = document.getElementById("from-currency");
const toSelect = document.getElementById("to-currency");
const swapBtn = document.getElementById("swap-btn");
const rateText = document.getElementById("rate-text");
const lastUpdated = document.getElementById("last-updated");
const connectionBanner = document.getElementById("connection-banner");
const popularGrid = document.getElementById("popular-grid");
const filterChips = document.querySelectorAll(".filter-chip");
const baseCurrencyLabel = document.getElementById("base-currency-label");
const copyBtn = document.getElementById("copy-btn");
const toast = document.getElementById("toast");

let currentPopularBase = "USD";

async function fetchRates() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (data && data.rates) {
            exchangeRates = data.rates;
            supportedCurrencies = Object.keys(exchangeRates);
            populateSelects();
            convert();
            renderPopularRates(currentPopularBase);
            
            const date = new Date(data.time_last_update_unix * 1000);
            lastUpdated.innerHTML = `<i class="fa-solid fa-clock-rotate-left"></i> Updated: ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            connectionBanner.classList.add("hidden");
        }
    } catch (error) {
        connectionBanner.classList.remove("hidden");
        // استخدام بيانات افتراضية في حال انقطع النت
        exchangeRates = { USD: 1, EUR: 0.92, IQD: 1310.42, GBP: 0.78, AED: 3.67 };
        supportedCurrencies = Object.keys(exchangeRates);
        populateSelects();
        convert();
        renderPopularRates(currentPopularBase);
    }
}

function populateSelects() {
    const currencies = Object.keys(exchangeRates);
    const fromVal = fromSelect.value || "USD";
    const toVal = toSelect.value || "IQD";

    fromSelect.innerHTML = "";
    toSelect.innerHTML = "";

    currencies.forEach(currency => {
        const option1 = document.createElement("option");
        option1.value = currency;
        option1.textContent = currency;
        if (currency === fromVal) option1.selected = true;
        fromSelect.appendChild(option1);

        const option2 = document.createElement("option");
        option2.value = currency;
        option2.textContent = currency;
        if (currency === toVal) option2.selected = true;
        toSelect.appendChild(option2);
    });
}

function convert() {
    const amount = parseFloat(amountInput.value);
    const from = fromSelect.value;
    const to = toSelect.value;

    if (isNaN(amount) || !exchangeRates[from] || !exchangeRates[to]) {
        convertedInput.value = "";
        rateText.textContent = "Enter a valid amount";
        return;
    }

    const rateInUSD = amount / exchangeRates[from];
    const result = rateInUSD * exchangeRates[to];
    
    convertedInput.value = result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

    const singleRate = (1 / exchangeRates[from]) * exchangeRates[to];
    rateText.textContent = `1 ${from} = ${singleRate.toFixed(4)} ${to}`;
}

function renderPopularRates(base) {
    currentPopularBase = base;
    baseCurrencyLabel.textContent = base;
    popularGrid.innerHTML = "";

    const baseRate = exchangeRates[base] || 1;

    Object.keys(exchangeRates).forEach(currency => {
        if (currency === base) return;

        const rate = (1 / baseRate) * exchangeRates[currency];
        
        const item = document.createElement("div");
        item.className = "popular-item";
        item.innerHTML = `
            <div class="popular-item-top">
                <span class="currency-badge">${currency}</span>
                <span class="popular-rate">${rate > 10 ? rate.toFixed(2) : rate.toFixed(4)}</span>
            </div>
            <span class="popular-name">Exchange rate</span>
        `;
        popularGrid.appendChild(item);
    });
}

amountInput.addEventListener("input", convert);
fromSelect.addEventListener("change", convert);
toSelect.addEventListener("change", convert);

swapBtn.addEventListener("click", () => {
    const temp = fromSelect.value;
    fromSelect.value = toSelect.value;
    toSelect.value = temp;
    convert();
});

filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
        filterChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        renderPopularRates(chip.dataset.base);
    });
});

copyBtn.addEventListener("click", () => {
    if (!convertedInput.value) return;
    navigator.clipboard.writeText(convertedInput.value);
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
});

fetchRates();
