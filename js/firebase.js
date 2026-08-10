import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCy0S0zr62mqucR02wE6eqqj_z4GjbjKpY",
    authDomain: "nikke-gacha-69684.firebaseapp.com",
    projectId: "nikke-gacha-69684",
    storageBucket: "nikke-gacha-69684.firebasestorage.app",
    messagingSenderId: "364912880739",
    appId: "1:364912880739:web:6c5c4604b8894883be1c56",
    measurementId: "G-RKQ1JM9KM8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);