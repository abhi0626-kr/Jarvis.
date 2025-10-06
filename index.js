// index.js - Cart Sync Implementation
import { syncCartWithFirebase } from './cart-functions.js';

// DOM Elements
const syncCartBtn = document.getElementById('sync-cart');
const cartSyncNotification = document.getElementById('cart-sync-notification');

// Initialize the page
function init() {
    // Load products from Firebase
    loadProducts();
    
    // Update cart display
    updateCart();
    
    // Initialize offer gallery
    goToSlide(0);
    
    // Set up auth state listener
    setupAuthListener();
}

// Sync cart button functionality
if (syncCartBtn) {
    syncCartBtn.addEventListener('click', async () => {
        try {
            // Show loading state
            syncCartBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Syncing...';
            syncCartBtn.disabled = true;

            // Use the proper sync function from cart-functions.js
            const success = await syncCartWithFirebase();

            if (success) {
                showNotification('Cart synchronized across all your devices!', false);
                // Reload the cart display after sync
                updateCart();
            } else {
                showNotification('Failed to sync cart. Please try again.', true);
            }
        } catch (error) {
            console.error('Error syncing cart:', error);
            showNotification('Failed to sync cart. Please try again.', true);
        } finally {
            // Reset button state
            syncCartBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Sync Cart Across Devices';
            syncCartBtn.disabled = false;
        }
    });
}

// Function to show notification
function showNotification(message, isError = false) {
    if (!cartSyncNotification) return;
    
    cartSyncNotification.textContent = message;
    cartSyncNotification.className = 'cart-sync-notification';
    
    if (isError) {
        cartSyncNotification.classList.add('error');
    }
    
    cartSyncNotification.classList.add('show');

    setTimeout(() => {
        cartSyncNotification.classList.remove('show');
    }, 3000);
}

// Set up auth state listener
function setupAuthListener() {
    // This would typically use Firebase auth state listener
    // For now, we'll simulate it
    console.log("Auth state listener set up");
}

// Load products from Firebase (existing function)
function loadProducts() {
    // Your existing product loading logic
    console.log("Loading products...");
}

// Update cart display (existing function)
function updateCart() {
    // Your existing cart update logic
    console.log("Updating cart display...");
}

// Offer gallery functions (existing)
function goToSlide(index) {
    // Your existing offer gallery logic
    console.log("Going to slide:", index);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);