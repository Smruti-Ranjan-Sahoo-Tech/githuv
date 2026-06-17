import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GithubAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCe2c9bI7yBJET67d49TIvgAwT3k3q-ymM",
  authDomain: "github-management-ecd2f.firebaseapp.com",
  projectId: "github-management-ecd2f",
  storageBucket: "github-management-ecd2f.firebasestorage.app",
  messagingSenderId: "926988706544",
  appId: "1:926988706544:web:19cf36385c5194baa89835",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const githubProvider = new GithubAuthProvider();
githubProvider.addScope("read:user");
githubProvider.addScope("user:email");
githubProvider.addScope("repo"); // Important
