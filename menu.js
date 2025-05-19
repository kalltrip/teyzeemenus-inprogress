document.addEventListener("DOMContentLoaded", function () {
    Promise.all([
        fetch("veg.json").then(response => response.json()).catch(error => console.error("Error loading veg.json:", error)),
        fetch("Nonveg.json").then(response => response.json()).catch(error => console.error("Error loading Nonveg.json:", error))
    ])
        .then(([vegData, nonvegData]) => {
            if (vegData) populateMenu(vegData, "vegetarian-menu");
            if (nonvegData) populateMenu(nonvegData, "nonvegetarian-menu");
        })
        .catch(error => console.error("Error fetching menu data:", error));
});

function populateMenu(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with ID '${containerId}' not found.`);
        return;
    }

    const currentHour = new Date().getHours();

    data.forEach(dish => {
        if (!dish.category) return;

        const categoryClass = dish.category.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const dishElement = document.createElement("div");
        dishElement.classList.add("dish", categoryClass);

        const isAvailable = currentHour >= dish.startTime && currentHour < dish.endTime;
        const stars = generateStars(dish.rating);

        let shortDesc = dish.description.length > 50 ? dish.description.substring(0, 50) + "..." : dish.description;
        let fullDesc = dish.description;

        dishElement.innerHTML = `
            <i class="fa fa-circle" style="font-size:14px; color: ${dish.veg ? 'green' : 'red'};">
                <span class="${dish.veg ? 'vegetarian' : 'non-vegetarian'}">
                    ${dish.veg ? 'VEGETARIAN' : 'NON-VEGETARIAN'}
                </span>
            </i>
            <div class="dish-content">
                <div class="dish-details">
                    <div class="dish-header">
                        <span class="dish-name">${dish.name}</span>
                    </div>
                    <div class="dish-pricing">
                        <span class="dish-price">Rs ${dish.price} </span>
                        <span class="original-price"> ${(dish.price * 1.2).toFixed(0)} </span>
                        <div class="offer">${dish.offer || ""}</div>
                    </div>
                    <span class="dish-rating">${stars} (${dish.rating})</span>
                    <p class="dish-description" 
                        data-full="${fullDesc}" 
                        data-short="${shortDesc}">
                        ${window.innerWidth < 480 ? shortDesc + ' <span class="read-more" style="color: #31B404; cursor: pointer;">Read More</span>' : fullDesc}
                    </p>
                </div>
                <img alt="${dish.name}" data-src="${dish.image}" class="lazy-img" />
            </div>
            <div class="dish-footer">
                <span class="tag" onclick="filterDishes('${categoryClass}')">${dish.category}</span>
                <button class="btn order-btn" 
                    onclick="selectDish('${dish.name} - Rs ${dish.price}', this)" 
                    ${isAvailable ? "" : "disabled"} 
                    style="${isAvailable ? "" : "opacity: 0.5; cursor: not-allowed;"}">
                    ${isAvailable ? "Add to Order" : "Available Soon"}
                </button>
            </div>
        `;

        container.appendChild(dishElement);
    });

    lazyLoadImages();
    handleReadMore();
}

function lazyLoadImages() {
    const lazyImages = document.querySelectorAll(".lazy-img");

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add("fade-in");
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(img => observer.observe(img));
}

function handleReadMore() {
    if (window.innerWidth >= 480) return;

    document.querySelectorAll(".dish-description").forEach(desc => {
        let shortText = desc.getAttribute("data-short");
        let fullText = desc.getAttribute("data-full");

        desc.innerHTML = shortText + ' <span class="read-more" style="color: #31B404; cursor: pointer;">Read More</span>';

        desc.addEventListener("click", function (event) {
            if (event.target.classList.contains("read-more")) {
                desc.innerHTML = fullText + ' <span class="read-less" style="color: #31B404; cursor: pointer;">Read Less</span>';
            } else if (event.target.classList.contains("read-less")) {
                desc.innerHTML = shortText + ' <span class="read-more" style="color: #31B404; cursor: pointer;">Read More</span>';
            }
        });
    });
}

function handleResize() {
    document.querySelectorAll(".dish-description").forEach(desc => {
        let fullText = desc.getAttribute("data-full");
        let shortText = desc.getAttribute("data-short");

        if (window.innerWidth >= 480) {
            desc.innerHTML = fullText;
        } else {
            desc.innerHTML = shortText + ' <span class="read-more" style="color: #31B404; cursor: pointer;">Read More</span>';
            handleReadMore();
        }
    });
}

window.addEventListener("resize", handleResize);
handleResize();

function filterDishes(category) {
    document.querySelectorAll(".dish").forEach(dish => {
        dish.style.display = category === "all" || dish.classList.contains(category) ? "block" : "none";
    });
}

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(() => {
        const currentHour = new Date().getHours();
        console.log("Current Hour:", currentHour); // Debugging line

        const buttons = document.querySelectorAll(".btn");

        if (currentHour < 7 || currentHour >= 23) {
            console.log("Restaurant is closed. Disabling buttons."); // Debugging line
            buttons.forEach(button => {
                button.disabled = true;
                button.style.opacity = "0.5";
                button.style.cursor = "not-allowed";
                button.textContent = "Restaurant Closed";
            });
        }
    }, 500); // Small delay to ensure elements exist
});

document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll(".btn");
    const currentHour = new Date().getHours();

    if (currentHour >= 23 || currentHour < 7) {
        buttons.forEach(button => {
            button.disabled = true;
            button.style.opacity = "0.5";
            button.style.cursor = "not-allowed";
        });
    }
});

fetch('header.json')
    .then(response => response.json())
    .then(data => {
        document.querySelector('.restaurant-name').textContent = data.restaurantName;
        document.querySelector('.restaurant-details').textContent = `${data.address} | ${data.contact}`;
    })
    .catch(error => console.error('Error loading header data:', error));

function generateStars(rating) {
    let fullStars = Math.floor(rating);
    let halfStar = rating % 1 !== 0;
    let starHTML = "";
    for (let i = 0; i < fullStars; i++) {
        starHTML += `<i class="fa fa-star" style="color: gold;"></i> `;
    }
    if (halfStar) {
        starHTML += `<i class="fa fa-star-half" style="color: gold;"></i> `;
    }
    return starHTML;
}

function sendLocationOnWhatsApp() {
    if (!whatsappNumber) {
        alert("WhatsApp number not found. Please try again later.");
        return;
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var latitude = position.coords.latitude;
            var longitude = position.coords.longitude;

            // Use Google Maps API to get a more readable address (optional)
            var locationURL = `https://maps.google.com/?q=${latitude},${longitude}`;
            var whatsappMessage = `This is my current location: ${locationURL}`;
            var whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

            window.open(whatsappURL, '_blank');
        }, function (error) {
            alert("Unable to retrieve your location. Please enable location access.");
        });
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}

document.getElementById("toggle-nav").addEventListener("click", function () {
    document.getElementById("menu-container").style.display = "block";
    document.getElementById("footer-main").style.display = "none";
});

document.getElementById("toggle-nav").addEventListener("click", function () {
    document.getElementById("menu-container").style.display = "block";
    document.getElementById("footer-main").style.display = "none";

    // Hide footer-text when menu is open
    let footerText = document.querySelector(".footer-text");
    if (footerText) {
        footerText.style.display = "none";
    }
});

document.getElementById("hide-nav").addEventListener("click", function () {
    document.getElementById("menu-container").style.display = "none";
    document.getElementById("footer-main").style.display = "flex";

    // Show footer-text again when menu is hidden
    let footerText = document.querySelector(".footer-text");
    if (footerText) {
        footerText.style.display = "block";
    }
});


function filterDishes(category) {
    // Hide all dishes initially
    let allDishes = document.querySelectorAll('.dish');
    allDishes.forEach(dish => {
        dish.style.display = 'none';
    });

    // Show dishes that belong to the selected category
    let selectedDishes = document.querySelectorAll('.dish');
    selectedDishes.forEach(dish => {
        if (dish.classList.contains(category)) {
            dish.style.display = 'block';
        }
    });
}

// Select all menu links
document.querySelectorAll("#menu-nav a").forEach(menuItem => {
    menuItem.addEventListener("click", function () {
        // Hide the menu container
        document.getElementById("menu-container").style.display = "none";
        // Show the footer-main again
        document.getElementById("footer-main").style.display = "flex";
    });
});

function filterDishes(category) {
    let allDishes = document.querySelectorAll('.dish');

    if (category === 'all') {
        // Show all dishes if "Show All" is clicked
        allDishes.forEach(dish => {
            dish.style.display = 'block';
        });
    } else {
        // Hide all dishes first
        allDishes.forEach(dish => {
            dish.style.display = 'none';
        });

        // Show only dishes that match the selected category
        document.querySelectorAll(`.dish.${category}`).forEach(dish => {
            dish.style.display = 'block';
        });
    }
}
let selectedDishes = {};
let whatsappNumber = "";
let upiId = "";
fetch("header.json")
    .then(response => response.json())
    .then(data => {
        document.querySelector(".restaurant-name").textContent = data.restaurantName;
        document.querySelector(".restaurant-details").textContent = `${data.address} | ${data.contact}`;
        whatsappNumber = data.whatsappNumber;
        upiId = data.upiId;
    })
    .catch(error => console.error("Error loading header data:", error));

function selectDish(dishName, buttonElement) {
    if (!selectedDishes[dishName]) {
        selectedDishes[dishName] = 1;
        toggleCounter(buttonElement, dishName);
    }
}

function toggleCounter(buttonElement, dishName) {
    const wrapper = document.createElement("div");
    wrapper.className = "dish-counter";
    wrapper.innerHTML = `
<button class="minus" onclick="updateCount('${dishName}', -1, this)">-</button>
<span class="count">${selectedDishes[dishName]}</span>
<button class="plus" onclick="updateCount('${dishName}', 1, this)">+</button>
`;

    buttonElement.style.display = "none";
    buttonElement.parentNode.appendChild(wrapper);
}

function updateCount(dishName, change, buttonElement) {
    selectedDishes[dishName] = (selectedDishes[dishName] || 0) + change;

    if (selectedDishes[dishName] <= 0) {
        delete selectedDishes[dishName];

        const counterElement = buttonElement.parentNode;
        const addButton = counterElement.parentNode.querySelector(".btn");

        counterElement.remove();
        addButton.style.display = "inline-block";
    } else {
        buttonElement.parentNode.querySelector(".count").textContent = selectedDishes[dishName];
    }
}


// Update Order List & Show Total Price
function updateOrderList() {
    const orderList = document.getElementById("order-list");
    const totalPriceElement = document.getElementById("total-price");

    if (orderList) {
        orderList.innerHTML = ""; // Clear before updating

        Object.entries(selectedDishes).forEach(([dish, quantity]) => {
            const orderItem = document.createElement("li");
            orderItem.textContent = `${dish} - Qty: ${quantity}`;
            orderList.appendChild(orderItem);
        });
    }

    if (totalPriceElement) {
        totalPriceElement.innerText = `Total: Rs ${calculateTotal()}`;
    }
}

// Calculate Total Price
function calculateTotal() {
    let total = 0;

    Object.entries(selectedDishes).forEach(([dish, quantity]) => {
        const price = parseFloat(dish.match(/Rs (\d+)/)?.[1] || 0);
        total += price * quantity;
    });

    return total;
}

// Generate UPI Link
function generateUPILink(amount) {
    const isGooglePay = true; // Set this flag if you want to generate the Google Pay link
    let upiLink = "";

    if (isGooglePay) {
        upiLink = `upi://pay?pa=${upiId}&pn=%20&tr=%20&am=${amount}&cu=INR`;
    } else {
        upiLink = `upi://pay?pa=${upiId}&am=${amount}&cu=INR`;
    }
    return upiLink;
}

function shareOnWhatsApp() {
    if (Object.keys(selectedDishes).length === 0) {
        alert("Please select at least one dish.");
        return;
    }

    if (!whatsappNumber || !upiId) {
        alert("WhatsApp number or UPI ID not found. Please try again later.");
        return;
    }

    let orderSummary = Object.entries(selectedDishes)
        .map(([dish, quantity], index) => `${index + 1}. ${dish} - Qty: ${quantity}`)
        .join("\n");

    let orderTotal = calculateTotal();
    const upiLink = generateUPILink(orderTotal);
    const whatsappMessage = `Order Details:\n${orderSummary}\n\nPay Total Rs ${orderTotal} to Restaurant on UPI ID ${upiLink}`;
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappURL, "_blank");
}
function updateTheme() {
    const currentHour = new Date().getHours();
    const isLightMode = currentHour >= 7 && currentHour < 19; // 7 AM to 7 PM

    document.body.classList.toggle("light-mode", isLightMode);
    document.body.classList.toggle("dark-mode", !isLightMode);

    document.querySelectorAll(".content, .header, .footer, .dish").forEach(element => {
        element.classList.toggle("dark-content", !isLightMode);
        element.classList.toggle("light-content", isLightMode);
    });
}

updateTheme();
setInterval(updateTheme, 60000);