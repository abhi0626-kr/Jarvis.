// checkout.js
import { clearCartAfterOrder, getUserCart } from './cart-functions.js';
import { firebaseConfig } from './firebase-config.js';

import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Place order button
const placeOrderBtn = document.getElementById("place-order");

if (placeOrderBtn) {
    placeOrderBtn.addEventListener("click", async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                alert("You must be logged in to place an order.");
                return;
            }

            // Get cart items
            const cartItems = await getUserCart();
            if (cartItems.length === 0) {
                alert("Your cart is empty!");
                return;
            }

            // Collect address info (assuming you have inputs in checkout.html)
            const address = {
                fullName: document.getElementById("first-name").value + " " + document.getElementById("last-name").value,
                phone: document.getElementById("phone").value,
                addressLine: document.getElementById("address").value,
                city: document.getElementById("city").value,
                state: document.getElementById("state").value,
                zip: document.getElementById("zip").value,   // ✅ use "zip" instead of "pincode"
            };


            // Calculate total price
            const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

            // Create order object
            const orderData = {
                userId: user.uid,
                items: cartItems,
                address,
                total,
                status: "Placed",
                createdAt: serverTimestamp()
            };

            // Save order in Firestore
            await addDoc(collection(db, "orders"), orderData);

            // Clear cart (Firebase + localStorage)
            await clearCartAfterOrder();

            // Success message
            alert("Order placed successfully! Cart has been cleared.");

            // Redirect
            window.location.href = "order-confirmation.html";

        } catch (error) {
            console.error("Error placing order:", error);
            alert("Something went wrong. Please try again.");
        }
    });
}
