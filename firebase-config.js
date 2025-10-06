// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDqXN_NjP3OUGhd-ah-hWTO66REtlMqwAk",
  authDomain: "jarvis-e-commerce-a6563.firebaseapp.com",
  projectId: "jarvis-e-commerce-a6563",
  storageBucket: "jarvis-e-commerce-a6563.firebasestorage.app",
  messagingSenderId: "998302088355",
  appId: "1:998302088355:web:36279bf2694647baf05316",
  measurementId: "G-Q9E7Z27L6K"
};

export { firebaseConfig };

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
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
  arrayRemove,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();
const githubProvider = new GithubAuthProvider();

// Make Firebase functions available globally
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseFunctions = {
  getDoc, setDoc, updateDoc, doc, collection, addDoc, query, where, getDocs,
  arrayUnion, arrayRemove, deleteDoc, signOut, updateProfile, onAuthStateChanged
};

// Function to show messages
function showMessage(message, elementId) {
  const messageDiv = document.getElementById(elementId);
  if (!messageDiv) return;

  messageDiv.textContent = message;
  messageDiv.style.display = 'block';
  messageDiv.style.opacity = '1';

  setTimeout(() => {
    messageDiv.style.opacity = '0';
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 500);
  }, 5000);
}

// Function to update user profile
async function updateUserProfile(userId, userData) {
  try {
    await updateDoc(doc(db, "users", userId), userData);
    return true;
  } catch (error) {
    console.error("Error updating user profile:", error);
    return false;
  }
}

// Function to save address to user's address book
async function saveUserAddress(userId, addressData) {
  try {
    // Generate a unique ID for the address
    const addressId = Date.now().toString();
    const addressWithId = { ...addressData, id: addressId };

    // Add address to user's address book
    await updateDoc(doc(db, "users", userId), {
      addresses: arrayUnion(addressWithId)
    });

    // If this is set as default, update all other addresses to not be default
    if (addressData.isDefault) {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const addresses = userData.addresses || [];

        // Update all other addresses to not be default
        const updatedAddresses = addresses.map(addr => {
          if (addr.id !== addressId) {
            return { ...addr, isDefault: false };
          }
          return addr;
        });

        // Update the addresses array
        await updateDoc(doc(db, "users", userId), {
          addresses: updatedAddresses
        });
      }
    }

    return true;
  } catch (error) {
    console.error("Error saving address:", error);
    return false;
  }
}

// Function to delete user address
async function deleteUserAddress(userId, addressId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const addresses = userData.addresses || [];

      // Filter out the address to delete
      const updatedAddresses = addresses.filter(addr => addr.id !== addressId);

      // Update the addresses array
      await updateDoc(doc(db, "users", userId), {
        addresses: updatedAddresses
      });

      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting address:", error);
    return false;
  }
}

// Function to get user's order history
async function getUserOrderHistory(userId) {
  try {
    // Query orders for this user
    const q = query(collection(db, "orders"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);

    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by date (newest first)
    orders.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });

    return orders;
  } catch (error) {
    console.error("Error getting order history:", error);
    return [];
  }
}

// Function to get user's saved addresses
async function getUserAddresses(userId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return userDoc.data().addresses || [];
    }
    return [];
  } catch (error) {
    console.error("Error getting user addresses:", error);
    return [];
  }
}

// Function to set default address
async function setDefaultAddress(userId, addressId) {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const addresses = userData.addresses || [];

      // Update all addresses - set the selected one as default, others as not default
      const updatedAddresses = addresses.map(addr => {
        if (addr.id === addressId) {
          return { ...addr, isDefault: true };
        } else {
          return { ...addr, isDefault: false };
        }
      });

      // Update the addresses array
      await updateDoc(doc(db, "users", userId), {
        addresses: updatedAddresses
      });

      return true;
    }
    return false;
  } catch (error) {
    console.error("Error setting default address:", error);
    return false;
  }
}

// Export functions for use in other files
window.profileFunctions = {
  updateUserProfile,
  saveUserAddress,
  deleteUserAddress,
  getUserOrderHistory,
  getUserAddresses,
  setDefaultAddress
};

// Function to save order history
async function saveOrderHistory(orderData) {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No user logged in");
      return false;
    }

    // Add order to the orders collection
    const orderRef = await addDoc(collection(db, "orders"), {
      ...orderData,
      userId: user.uid,
      createdAt: new Date()
    });

    // Also add to user's order history subcollection
    await updateDoc(doc(db, "users", user.uid), {
      orderHistory: arrayUnion(orderRef.id)
    });

    return true;
  } catch (error) {
    console.error("Error saving order history:", error);
    return false;
  }
}

// Sign Up Functionality
const signUpBtn = document.getElementById("signup-submit");
if (signUpBtn) {
  signUpBtn.addEventListener("click", (event) => {
    event.preventDefault();

    // Get user inputs
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById("signup-confirm-password").value;
    const fullName = document.getElementById("signup-name").value;

    // Validate inputs
    if (password !== confirmPassword) {
      showMessage("Passwords don't match", "signUpMessage");
      return;
    }

    if (password.length < 6) {
      showMessage("Password should be at least 6 characters", "signUpMessage");
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;

        // Save user data to Firestore
        const userData = {
          fullName: fullName,
          email: email,
          createdAt: new Date(),
          addresses: [], // Initialize empty addresses array
          orderHistory: [] // Initialize empty order history array
        };

        setDoc(doc(db, "users", user.uid), userData)
          .then(() => {
            showMessage('Account created successfully!', 'signUpMessage');
            // Redirect after successful signup
            setTimeout(() => {
              window.location.href = 'home.html';
            }, 2000);
          })
          .catch((error) => {
            console.error("Error saving user data:", error);
            showMessage("Error saving user data", "signUpMessage");
          });
      })
      .catch((error) => {
        const errorCode = error.code;
        if (errorCode === 'auth/email-already-in-use') {
          showMessage("Email already in use", "signUpMessage");
        } else if (errorCode === 'auth/invalid-email') {
          showMessage("Invalid email address", "signUpMessage");
        } else if (errorCode === 'auth/weak-password') {
          showMessage("Password is too weak", "signUpMessage");
        } else {
          showMessage("Unable to create account", "signUpMessage");
          console.error(error);
        }
      });
  });
}

// Sign In Functionality
const signInBtn = document.getElementById("signin-submit");
if (signInBtn) {
  signInBtn.addEventListener("click", (event) => {
    event.preventDefault();

    // Get user inputs
    const email = document.getElementById("signin-email").value;
    const password = document.getElementById("signin-password").value;

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in successfully
        showMessage('Signed in successfully!', 'signIpMessage');
        // Redirect after successful signin
        setTimeout(() => {
          window.location.href = 'home.html';
        }, 2000);
      })
      .catch((error) => {
        const errorCode = error.code;
        if (errorCode === 'auth/invalid-email') {
          showMessage("Invalid email address", "signIpMessage");
        } else if (errorCode === 'auth/user-not-found') {
          showMessage("User not found", "signIpMessage");
        } else if (errorCode === 'auth/wrong-password') {
          showMessage("Wrong password", "signIpMessage");
        } else {
          showMessage("Sign in failed", "signIpMessage");
          console.error(error);
        }
      });
  });
}

// Google Sign In
const googleSignInBtn = document.getElementById("google-signin");
if (googleSignInBtn) {
  googleSignInBtn.addEventListener("click", (event) => {
    event.preventDefault();
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        // This gives you a Google Access Token
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;

        // The signed-in user info
        const user = result.user;

        // Save user data to Firestore if it's their first time signing in
        const userData = {
          fullName: user.displayName,
          email: user.email,
          createdAt: new Date(),
          addresses: [],
          orderHistory: []
        };

        setDoc(doc(db, "users", user.uid), userData, { merge: true })
          .then(() => {
            showMessage('Signed in with Google successfully!', 'signIpMessage');
            setTimeout(() => {
              window.location.href = 'home.html';
            }, 2000);
          })
          .catch((error) => {
            console.error("Error saving user data:", error);
          });
      })
      .catch((error) => {
        const errorCode = error.code;
        showMessage("Google sign in failed", "signIpMessage");
        console.error(error);
      });
  });
}

// Facebook Sign In
const facebookSignInBtn = document.getElementById("facebook-signin");
if (facebookSignInBtn) {
  facebookSignInBtn.addEventListener("click", (event) => {
    event.preventDefault();
    signInWithPopup(auth, facebookProvider)
      .then((result) => {
        // This gives you a Facebook Access Token
        const credential = FacebookAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;

        // The signed-in user info
        const user = result.user;

        // Save user data to Firestore if it's their first time signing in
        const userData = {
          fullName: user.displayName,
          email: user.email,
          createdAt: new Date(),
          addresses: [],
          orderHistory: []
        };

        setDoc(doc(db, "users", user.uid), userData, { merge: true })
          .then(() => {
            showMessage('Signed in with Facebook successfully!', 'signIpMessage');
            setTimeout(() => {
              window.location.href = 'home.html';
            }, 2000);
          })
          .catch((error) => {
            console.error("Error saving user data:", error);
          });
      })
      .catch((error) => {
        const errorCode = error.code;
        showMessage("Facebook sign in failed", "signIpMessage");
        console.error(error);
      });
  });
}

// GitHub Sign In
const githubSignInBtn = document.getElementById("github-signin");
if (githubSignInBtn) {
  githubSignInBtn.addEventListener("click", (event) => {
    event.preventDefault();
    signInWithPopup(auth, githubProvider)
      .then((result) => {
        // This gives you a GitHub Access Token
        const credential = GithubAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;

        // The signed-in user info
        const user = result.user;

        // Save user data to Firestore if it's their first time signing in
        const userData = {
          fullName: user.displayName,
          email: user.email,
          createdAt: new Date(),
          addresses: [],
          orderHistory: []
        };

        setDoc(doc(db, "users", user.uid), userData, { merge: true })
          .then(() => {
            showMessage('Signed in with GitHub successfully!', 'signIpMessage');
            setTimeout(() => {
              window.location.href = 'home.html';
            }, 2000);
          })
          .catch((error) => {
            console.error("Error saving user data:", error);
          });
      })
      .catch((error) => {
        const errorCode = error.code;
        showMessage("GitHub sign in failed", "signIpMessage");
        console.error(error);
      });
  });
}

// Forgot Password Functionality
const forgotPasswordLink = document.querySelector(".forgot-password");
if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", (event) => {
    event.preventDefault();

    // Create a modal/popup for email input
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0,0,0,0.5)";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.zIndex = "1000";

    modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 10px; width: 300px;">
                <h3 style="margin-bottom: 15px;">Reset Password</h3>
                <p style="margin-bottom: 15px;">Enter your email to receive a password reset link</p>
                <input type="email" id="reset-email" placeholder="Your email" style="width: 100%; padding: 8px; margin-bottom: 15px;">
                <button id="send-reset-link" style="background: var(--primary-color); color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">Send Link</button>
                <button id="cancel-reset" style="background: #ccc; margin-left: 10px; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">Cancel</button>
            </div>
        `;

    document.body.appendChild(modal);

    // Handle send reset link
    document.getElementById("send-reset-link").addEventListener("click", () => {
      const email = document.getElementById("reset-email").value;

      if (!email) {
        alert("Please enter your email");
        return;
      }

      sendPasswordResetEmail(auth, email)
        .then(() => {
          alert("Password reset email sent! Check your inbox.");
          document.body.removeChild(modal);
        })
        .catch((error) => {
          const errorCode = error.code;
          if (errorCode === 'auth/user-not-found') {
            alert("No user found with this email");
          } else {
            alert("Error sending reset email: " + error.message);
          }
        });
    });

    // Handle cancel
    document.getElementById("cancel-reset").addEventListener("click", () => {
      document.body.removeChild(modal);
    });
  });
}

// Auth State Listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    const userProfileBtn = document.getElementById("user-profile");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");

    if (userProfileBtn) userProfileBtn.style.display = "block";
    if (loginBtn) loginBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "block";
  } else {
    // User is signed out
    const userProfileBtn = document.getElementById("user-profile");
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");

    if (userProfileBtn) userProfileBtn.style.display = "none";
    if (loginBtn) loginBtn.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
});

// Logout Functionality
const logoutBtn = document.getElementById("logout-btn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        showMessage("Signed out successfully", "signIpMessage");
        // Redirect to home page after logout
        window.location.href = "home.html";
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  });
}

// Function to clear user's cart
// Function to clear user's cart - ENHANCED VERSION
async function clearUserCart() {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("No user logged in");
      return false;
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

    console.log("Cart cleared successfully");
    return true;
  } catch (error) {
    console.error("Error clearing cart:", error);
    return false;
  }
}

// Function to get user's cart items
async function getUserCartItems() {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not logged in. Cart operations require authentication.");
    }

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
    throw error;
  }
}

// Make functions available globally
window.cartFunctions = {
  clearUserCart,
  getUserCartItems
};

// Export the auth and db for use in other files
export { app, auth, db, saveOrderHistory, clearUserCart, getUserCartItems };







// Enhanced logout function with cart sync
async function logoutUser() {
  try {
    const user = auth.currentUser;
    
    if (user) {
      // Save cart to Firebase before logging out
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      if (cart.length > 0) {
        await saveCartToFirebase(cart, user.uid);
      }
    }
    
    // Sign out from Firebase Auth
    await signOut(auth);
    
    // Clear local storage
    localStorage.removeItem('cart');

    // Redirect to account page
    window.location.href = "index.html";
    
    return true;
  } catch (error) {
    console.error("Error during logout:", error);
    return false;
  }
}

// Helper function to save cart to Firebase
async function saveCartToFirebase(cart, userId) {
  try {
    // Clear existing cart in Firebase
    const q = query(collection(db, "cart"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const deletePromises = [];
    querySnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    await Promise.all(deletePromises);
    
    // Add all items from local cart to Firebase
    for (const item of cart) {
      await addDoc(collection(db, "cart"), {
        productId: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        userId: userId,
        addedAt: new Date()
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error saving cart to Firebase:", error);
    return false;
  }
}

// Make the logout function available globally
window.logoutUser = logoutUser;