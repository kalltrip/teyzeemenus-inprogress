// Add local storage functionality to store last ordered items
let selectedDishes = {};
let whatsappNumber = "";
let upiId = "";
let lastOrderedItems = {};

document.addEventListener("DOMContentLoaded", function () {
    // Try to load last order from localStorage
    const savedOrder = localStorage.getItem('lastOrder');
    if (savedOrder) {
        lastOrderedItems = JSON.parse(savedOrder);
    }

    // Load restaurant info
    fetch('header.json')
        .then(response => response.json())
        .then(data => {
            document.querySelector('.restaurant-name').textContent = data.restaurantName;
            document.querySelector('.restaurant-details').textContent = `${data.address} | ${data.contact}`;
            whatsappNumber = data.whatsappNumber;
            upiId = data.upiId;
        })
        .catch(error => console.error('Error loading header data:', error));

    // Load menu data
    Promise.all([
        fetch("veg.json").then(response => response.json()).catch(error => console.error("Error loading veg.json:", error)),
        fetch("Nonveg.json").then(response => response.json()).catch(error => console.error("Error loading Nonveg.json:", error))
    ])
        .then(([vegData, nonvegData]) => {
            if (vegData) populateMenu(vegData, "vegetarian-menu");
            if (nonvegData) populateMenu(nonvegData, "nonvegetarian-menu");
        })
        .catch(error => console.error("Error fetching menu data:", error));
        
    // Set up event listeners
    setupEventListeners();
});

function setupEventListeners() {
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
    
    // Select all menu links
    document.querySelectorAll("#menu-nav a").forEach(menuItem => {
        menuItem.addEventListener("click", function () {
            // Hide the menu container
            document.getElementById("menu-container").style.display = "none";
            // Show the footer-main again
            document.getElementById("footer-main").style.display = "flex";
        });
    });
}

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
        
        // Add last-ordered class if this dish was in the last order
        if (lastOrderedItems[`${dish.name} - Rs ${dish.price}`]) {
            dishElement.classList.add("last-ordered");
        }

        const isAvailable = currentHour >= dish.startTime && currentHour < dish.endTime;
        const stars = generateStars(dish.rating);

        let shortDesc = dish.description.length > 50 ? dish.description.substring(0, 50) + "..." : dish.description;
        let fullDesc = dish.description;

        // Check if this dish was in the last order
        const dishKey = `${dish.name} - Rs ${dish.price}`;
        const wasOrdered = lastOrderedItems[dishKey] ? true : false;

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
    <div class="dish-footer-left">
        <span class="tag" onclick="filterDishes('${categoryClass}')">${dish.category}</span>
    </div>
    ${wasOrdered ? 
        `<div class="dish-footer-center">
        <span class="previously-ordered-btn" onclick="orderAgainDish('${dishKey}')">Previously Ordered</span>

        </div>` : ''}
    <div class="dish-footer-right">
        <button class="btn order-btn" 
            onclick="selectDish('${dish.name} - Rs ${dish.price}', this)" 
            ${isAvailable ? "" : "disabled"} 
            style="${isAvailable ? "" : "opacity: 0.5; cursor: not-allowed;"}">
            ${isAvailable ? "Add to Order" : "Available Soon"}
        </button>
    </div>
</div>

        `;

        container.appendChild(dishElement);
    });

    lazyLoadImages();
    handleReadMore();
}

function orderAgainDish(dishKey) {
    // Find the dish element
    const dishElements = document.querySelectorAll('.dish');
    let targetDishElement;
    
    for (const element of dishElements) {
        const nameElement = element.querySelector('.dish-name');
        const priceElement = element.querySelector('.dish-price');
        
        if (nameElement && priceElement) {
            const name = nameElement.textContent;
            const price = priceElement.textContent.trim();
            const key = `${name} - ${price}`;
            
            if (key === dishKey) {
                targetDishElement = element;
                break;
            }
        }
    }
    
    if (targetDishElement) {
        const orderBtn = targetDishElement.querySelector('.order-btn');
        if (orderBtn && !orderBtn.disabled) {
            // Get the previous quantity
            const quantity = lastOrderedItems[dishKey] || 1;
            selectDish(dishKey, orderBtn, quantity);
        }
    }
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

function filterDishes(category) {
    let allDishes = document.querySelectorAll('.dish');

    if (category === 'all') {
        // Show all dishes if "Show All" is clicked
        allDishes.forEach(dish => {
            dish.style.display = 'block';
        });
    } else if (category === 'last-ordered') {
        // Only show dishes from last order
        allDishes.forEach(dish => {
            dish.style.display = dish.classList.contains('last-ordered') ? 'block' : 'none';
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

function selectDish(dishName, buttonElement, initialQuantity = 1) {
    if (!selectedDishes[dishName]) {
        selectedDishes[dishName] = initialQuantity;
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

// Calculate Total Price and Count
function calculateOrderSummary() {
    let summary = {
        totalItems: 0,       // Number of unique items
        totalQuantity: 0,    // Total quantity of all items
        totalCost: 0         // Total cost
    };

    Object.entries(selectedDishes).forEach(([dish, quantity]) => {
        const price = parseFloat(dish.match(/Rs (\d+)/)?.[1] || 0);
        summary.totalItems++;
        summary.totalQuantity += quantity;
        summary.totalCost += price * quantity;
    });

    return summary;
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

function showOrderModal() {
    if (Object.keys(selectedDishes).length === 0) {
        alert("Please select at least one dish.");
        return;
    }

    const summary = calculateOrderSummary();
    
    // Create order summary modal
    const modalContainer = document.createElement('div');
    modalContainer.className = 'order-summary-modal';
    
    let orderItemsHTML = '';
    Object.entries(selectedDishes).forEach(([dish, quantity], index) => {
        const price = parseFloat(dish.match(/Rs (\d+)/)?.[1] || 0);
        const itemTotal = price * quantity;
        orderItemsHTML += `
            <div class="order-item">
                <span>${index + 1}. ${dish}</span>
                <span>Qty: ${quantity}</span>
                <span>Rs ${itemTotal}</span>
            </div>
        `;
    });
    
    modalContainer.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Order Summary</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="order-items">
                    ${orderItemsHTML}
                </div>
                <div class="order-summary">
                    <div class="summary-row">
                        <span>Total Items:</span>
                        <span>${summary.totalItems}</span>
                    </div>
                    <div class="summary-row">
                        <span>Total Quantity:</span>
                        <span>${summary.totalQuantity}</span>
                    </div>
                    <div class="summary-row total">
                        <span>Total Cost:</span>
                        <span>Rs ${summary.totalCost}</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="cancel-order">Cancel</button>
                <button class="confirm-order">Confirm Order</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalContainer);
    
    // Add event listeners to modal buttons
    modalContainer.querySelector('.close-modal').addEventListener('click', () => {
        modalContainer.remove();
    });
    
    modalContainer.querySelector('.cancel-order').addEventListener('click', () => {
        modalContainer.remove();
    });
    
    modalContainer.querySelector('.confirm-order').addEventListener('click', () => {
        // Save the current order as the last order
        localStorage.setItem('lastOrder', JSON.stringify(selectedDishes));
        lastOrderedItems = {...selectedDishes};
        
         // Send to Google Sheet
     //   sendOrderToGoogleSheet();
        // Send the order to WhatsApp
         shareOnWhatsApp();
         
        
        // Close the modal
        modalContainer.remove();
    });
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

    const summary = calculateOrderSummary();
    
    let orderSummary = Object.entries(selectedDishes)
        .map(([dish, quantity], index) => `${index + 1}. ${dish} - Qty: ${quantity}`)
        .join("\n");

    const upiLink = generateUPILink(summary.totalCost);
    const whatsappMessage = 
        `Order Details:\n${orderSummary}\n
Summary:
Total Items: ${summary.totalItems}
Total Quantity: ${summary.totalQuantity}
Total Cost: Rs ${summary.totalCost}

Pay Total Rs ${summary.totalCost} to Restaurant on UPI ID ${upiId}`;

    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappURL, "_blank");
}

function sendOrderToGoogleSheet() {
const sheetURL = 'https://script.google.com/macros/s/AKfycbyziGoKC1931sf6ws1F8PItiu5khiR4oz4UBSmRBHHsLKeLS0HCSeoYy8oxk1GpyVl7Rg/exec'; // your full script URL

// Optional user info (collect from form or keep blank)
const fullName = ""; // or document.getElementById('fullName').value
const mobile = "";
const pincode = "";
const locationURL = capturedLocationURL || ""; // optional, from location capture

const payload = Object.entries(selectedDishes).map(([dishKey, quantity]) => {
const match = dishKey.match(/(.*) - Rs (\d+)/);
return {
uuid: generateUUID(), // ensure you have generateUUID() function available
name: match ? match[1].trim() : dishKey,
price: match ? match[2] : '',
quantity: quantity,
category: '', // optional
fullName: fullName,
mobile: mobile,
pincode: pincode,
locationURL: locationURL
};
});

fetch(sheetURL, {
method: 'POST',
body: JSON.stringify(payload),
headers: {
'Content-Type': 'application/json'
}
})
.then(res => res.json())
.then(data => {
console.log(" Sheet Update:", data);
if (data.orderNumbers) {
alert("Order submitted successfully. Order ID(s): " + data.orderNumbers.join(", "));
}
})
.catch(err => {
console.error(" Sheet Error:", err);
alert("Failed to submit order. Please try again.");
});
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

// Update the placeorder button to show the order summary modal
document.addEventListener('DOMContentLoaded', function() {
    const placeOrderButton = document.querySelector('.placeorder');
    if (placeOrderButton) {
        placeOrderButton.removeAttribute('onclick');
        placeOrderButton.addEventListener('click', showOrderModal);
    }
});

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
//===================================================//
//charmi added code//
//======================================================//
// Function to create and show dish detail modal when image is clicked
function showDishDetailModal(dishName, price, description, imageUrl, category, rating, veg,) {
    // Check if modal already exists and remove it
    const existingModal = document.querySelector('.dish-detail-modal');
    if (existingModal) existingModal.remove();
    
    // Get related dishes (3 dishes from the same category)
    const relatedDishes = findRelatedDishes(category, dishName, 3);
    
    // Create modal container
    const modalContainer = document.createElement('div');
    modalContainer.className = 'dish-detail-modal';
    
    // Generate stars for rating
    const stars = generateStars(rating);
    
    // Format dish price
    const priceNumber = parseFloat(price.match(/Rs (\d+)/)?.[1] || 0);
    const originalPrice = (priceNumber * 1.2).toFixed(0);

  

    // Create related dishes HTML
    let relatedDishesHTML = '';
    if (relatedDishes.length > 0) {
        relatedDishes.forEach(dish => {
            relatedDishesHTML += `
                <div class="related-dish" onclick="showDishDetailModal('${dish.name}', 'Rs ${dish.price}', '${dish.description.replace(/'/g, "\\'")}', '${dish.image}', '${dish.category}', ${dish.rating}, ${dish.veg})">
                    <img src="${dish.image}" alt="${dish.name}" />
                    <div class="related-dish-info">
                        <span class="related-dish-name">${dish.name}</span>
                        <span class="related-dish-price">Rs ${dish.price}</span>
                    </div>
                </div>
            `;
        });
    } else {
        relatedDishesHTML = '<p>No related dishes found.</p>';
    }
    
    // Modal content
    modalContainer.innerHTML = `
        <div class="dish-detail-content">
            <div class="dish-detail-header">
                <h2>${dishName}</h2>
                <button class="close-dish-modal">&times;</button>
            </div>
            <div class="dish-detail-body">
                <div class="dish-detail-image-container">
                    <img src="${imageUrl}" alt="${dishName}" class="dish-detail-image" />
                    <span class="dish-detail-veg-indicator">
                        <i class="fa fa-circle" style="font-size:14px; color: ${veg ? 'green' : 'red'};">
                            <span class="${veg ? 'vegetarian' : 'non-vegetarian'}">${veg ? 'VEGETARIAN' : 'NON-VEGETARIAN'}</span>
                        </i>
                    </span>
                </div>
                <div class="dish-detail-info">
                    <div class="dish-detail-price">
                        <span class="detail-current-price">Rs ${priceNumber}</span>
                        <span class="detail-original-price">Rs ${originalPrice}</span>
                    </div>
                    <div class="dish-detail-rating">${stars} (${rating})</div>
                    <p class="dish-detail-description">${description}</p>
                    <div class="dish-detail-category">
                        <span class="detail-tag">${category}</span>
                    </div>
                    <button class="btn detail-order-btn" 
                        onclick="selectDish('${dishName} - Rs ${priceNumber}', this)">
                        Add to Order
                    </button>
                </div>
            </div>
            <div class="dish-detail-related">
                <h3>Related Dishes</h3>
                <div class="related-dishes-container">
                    ${relatedDishesHTML}
                </div>
            </div>
        </div>
    `;
    
    // Append modal to body
    document.body.appendChild(modalContainer);
    
    // Add event listeners
    modalContainer.querySelector('.close-dish-modal').addEventListener('click', () => {
        modalContainer.classList.add('fade-out');
        setTimeout(() => modalContainer.remove(), 300);
    });
    
    // Close modal when clicking outside of it
    modalContainer.addEventListener('click', (event) => {
        if (event.target === modalContainer) {
            modalContainer.classList.add('fade-out');
            setTimeout(() => modalContainer.remove(), 300);
        }
    });
    
    // Add fade-in animation
    setTimeout(() => modalContainer.classList.add('active'), 10);
}

// Function to find related dishes based on category
function findRelatedDishes(category, currentDishName, count) {
    const allDishes = [];
    const dishes = document.querySelectorAll('.dish');
    
    dishes.forEach(dish => {
        const nameElement = dish.querySelector('.dish-name');
        const priceElement = dish.querySelector('.dish-price');
        const descElement = dish.querySelector('.dish-description');
        const imgElement = dish.querySelector('img');
        const tagElement = dish.querySelector('.tag');
        const ratingElement = dish.querySelector('.dish-rating');
        const vegIcon = dish.querySelector('.fa-circle');
        
        if (nameElement && priceElement && descElement && imgElement && tagElement) {
            const name = nameElement.textContent.trim();
            
            // Skip current dish
            if (name === currentDishName) return;
            
            // Check if dish is in the same category
            if (tagElement.textContent.trim() === category) {
                const price = priceElement.textContent.match(/\d+/)[0];
                const description = descElement.getAttribute('data-full') || descElement.textContent.trim();
                const image = imgElement.getAttribute('src') || imgElement.getAttribute('data-src');
                const rating = ratingElement ? parseFloat(ratingElement.textContent.match(/\d+(\.\d+)?/)[0]) : 4.0;
                const isVeg = vegIcon ? vegIcon.style.color.includes('green') : true;
                
                allDishes.push({
                    name,
                    price,
                    description,
                    image,
                    category,
                    rating,
                    veg: isVeg
                });
            }
        }
    });
    
    // Shuffle array to get random related dishes
    for (let i = allDishes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allDishes[i], allDishes[j]] = [allDishes[j], allDishes[i]];
    }
    
    return allDishes.slice(0, count);
}

// Modify the populateMenu function to add click events to dish images
function addImageClickEvents() {
    // Get all dish images
    const dishImages = document.querySelectorAll('.dish img');
    
    // Add click event to each image
    dishImages.forEach(img => {
        img.style.cursor = 'pointer'; // Add pointer cursor
        
        // Remove any existing event listeners
        img.removeEventListener('click', handleImageClick);
        
        // Add new click event listener
        img.addEventListener('click', handleImageClick);
    });
}

// Handle image click event
function handleImageClick(event) {
    const img = event.target;
    const dishElement = img.closest('.dish');
    
    if (dishElement) {
        const nameElement = dishElement.querySelector('.dish-name');
        const priceElement = dishElement.querySelector('.dish-price');
        const descElement = dishElement.querySelector('.dish-description');
        const tagElement = dishElement.querySelector('.tag');
        const ratingElement = dishElement.querySelector('.dish-rating');
        const vegIcon = dishElement.querySelector('.fa-circle');
        
        if (nameElement && priceElement && descElement && tagElement) {
            const name = nameElement.textContent.trim();
            const price = priceElement.textContent.trim();
            const description = descElement.getAttribute('data-full') || descElement.textContent.trim();
            const category = tagElement.textContent.trim();
            const image = img.getAttribute('src') || img.getAttribute('data-src');
            const rating = ratingElement ? parseFloat(ratingElement.textContent.match(/\d+(\.\d+)?/)[0]) : 4.0;
            const isVeg = vegIcon ? vegIcon.style.color.includes('green') : true;
            
            showDishDetailModal(name, price, description, image, category, rating, isVeg);
        }
    }
}

// Modify the existing populateMenu function to call our new function
const originalPopulateMenu = populateMenu;
populateMenu = function(data, containerId) {
    originalPopulateMenu(data, containerId);
    addImageClickEvents();
};

// Call this initially to add click events to images that are already loaded
document.addEventListener("DOMContentLoaded", function() {
    // This will be called after the original DOMContentLoaded handler
    setTimeout(addImageClickEvents, 1000);
});
updateTheme();
setInterval(updateTheme, 60000);
