// cart-functions.js - Updated version
import { firebaseConfig } from './firebase-config.js';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

// Initialize Firebase directly
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Function to add item to cart
export async function addToCart(product) {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("User not logged in. Cart operations require authentication.");
    }

    // Check if product already exists in cart
    const q = query(
      collection(db, "cart"),
      where("userId", "==", user.uid),
      where("productId", "==", product.id)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // Update quantity if product exists
      const docId = querySnapshot.docs[0].id;
      const existingItem = querySnapshot.docs[0].data();
      await updateDoc(doc(db, "cart", docId), {
        quantity: existingItem.quantity + 1
      });
    } else {
      // Add new item to cart
      await addDoc(collection(db, "cart"), {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
        userId: user.uid,
        addedAt: new Date()
      });
    }

    return true;
  } catch (error) {
    console.error("Error adding to cart:", error);
    return false;
  }
}

// Function to get user's cart items
export async function getUserCart() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not logged in. Cart operations require authentication.");
    }
    // Logged in: always use Firestore as source of truth
    const q = query(collection(db, "cart"), where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);
    const cartItems = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      cartItems.push({
        id: data.productId,
        name: data.name,
        price: data.price,
        image: data.image,
        quantity: data.quantity
      });
    });
    return cartItems;
  } catch (error) {
    console.error("Error getting user cart:", error);
    return JSON.parse(localStorage.getItem('cart')) || [];
  }
}

// Function to update cart item quantity
export async function updateCartItemQuantity(itemId, newQuantity) {
  try {
    // No localStorage update. Only Firestore is used.

    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not logged in. Cart operations require authentication.");
    }

    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      const q = query(
        collection(db, "cart"),
        where("userId", "==", user.uid),
        where("productId", "==", itemId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        await deleteDoc(doc(db, "cart", docId));
      }
    } else {
      // Update quantity
      const q = query(
        collection(db, "cart"),
        where("userId", "==", user.uid),
        where("productId", "==", itemId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docId = querySnapshot.docs[0].id;
        await updateDoc(doc(db, "cart", docId), {
          quantity: newQuantity
        });
      }
    }
    return true;
  } catch (error) {
    console.error("Error updating cart item:", error);
    return false;
  }
}

// Function to remove item from cart
export async function removeFromCart(itemId) {
  try {
    // No localStorage update. Only Firestore is used.
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not logged in. Cart operations require authentication.");
    }

    const q = query(
      collection(db, "cart"),
      where("userId", "==", user.uid),
      where("productId", "==", itemId)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docId = querySnapshot.docs[0].id;
      await deleteDoc(doc(db, "cart", docId));
    }

    return true;
  } catch (error) {
    console.error("Error removing from cart:", error);
    return false;
  }
}

// Function to clear user's cart
export async function clearCart() {
  try {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in. Cart operations require authentication.");

    const q = query(collection(db, "cart"), where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("Cart already empty in Firebase");
      return true;
    }

    const deletePromises = querySnapshot.docs.map(docSnap => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);

    console.log("Firebase cart cleared");
    return true;
  } catch (error) {
    console.error("Error clearing cart:", error);
    return false;
  }
}


// NEW FUNCTION: Clear cart after successful order
// Add this function to cart-functions.js
// NEW FUNCTION: Clear cart after successful order - FIXED VERSION
export async function clearCartAfterOrder() {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("User not logged in. Cart operations require authentication.");
    }

    // Set flag to prevent cart reload
    sessionStorage.setItem('cartJustCleared', 'true');
    
    // Clear Firebase cart collection
    const q = query(collection(db, "cart"), where("userId", "==", user.uid));
    const querySnapshot = await getDocs(q);

    const deletePromises = [];
    querySnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });

    await Promise.all(deletePromises);

    // Also clear cart in user document
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        cart: [],
        lastUpdated: new Date()
      });
    } catch (error) {
      console.log("User document cart field not found or already cleared");
    }

    console.log("Cart cleared successfully after order");
    return true;
  } catch (error) {
    console.error("Error clearing cart after order:", error);
    return false;
  }
}



// Function to sync local cart to Firebase (triggered by Sync button)
export async function syncCartWithFirebase() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not logged in. Cart operations require authentication.");
    }
    // No local cart. Only Firestore is used.
    // After sync, update all devices by reloading cart from Firestore
    await getUserCart();
    return true;
  } catch (error) {
    console.error("Error syncing cart with Firebase:", error);
    return false;
  }
}

// All localStorage and guest cart logic removed. Only Firestore is used for all cart operations.

// Function to sync cart on auth state change



// // Make sure to export all functions
// export {
//   addToCart,
//   getUserCart,
//   updateCartItemQuantity,
//   removeFromCart,
//   clearCart,
//   clearCartAfterOrder,
//   syncCartWithFirebase
// };