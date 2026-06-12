const firebaseConfig = {
  apiKey: "AIzaSyCr1E15vm1plODoJzY4_oU2C50Kkxymxco",
  authDomain: "finan-981b3.firebaseapp.com",
  projectId: "finan-981b3",
  storageBucket: "finan-981b3.firebasestorage.app",
  messagingSenderId: "387175228025",
  appId: "1:387175228025:web:751927cad80704b58aeaa8",
  measurementId: "G-JHH9WXC1L7"
};

if (typeof firebase !== "undefined") {
  firebase.initializeApp(firebaseConfig);
}

window.App = window.App || {};
