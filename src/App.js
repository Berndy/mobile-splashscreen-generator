import "./App.css";
import { useState } from "react";
import { compress } from "./image.util";
import JSZip from "jszip";

const xmlString = `<?xml version="1.0" encoding="utf-8"?>
<bitmap xmlns:android="http://schemas.android.com/apk/res/android"
    android:src="@drawable/splash"
    android:scaleType="centerCrop"
/>`

const pickFiles = async (accept, multiple) =>
  new Promise((resolve) => {
    const inputId = `input-${Math.random().toString(36).substring(2, 15)}`;
    const input = document.createElement("input");
    input.id = inputId;
    input.type = "file";
    input.multiple = multiple;
    input.hidden = true;
    input.value = "";
    input.accept = accept;

    document.body.appendChild(input);
    input.addEventListener("change", async (e) => {
      resolve(e.target.files);
      input.remove();
    });
    input.click();
  });

const downloadDataUri = (fileName, dataUri) => {
  const elementId = `a-${Math.random().toString(36).substring(2, 15)}`;
  const link = document.createElement("a");
  link.id = elementId;
  link.hidden = true;
  link.href = dataUri;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
};

const generateSplashScreens = async (file) => {
  const zip = new JSZip();

  const generateSplashScreen = async (name, width, height) => {
    const blob = await compress(width, height, width / height)(file);
    zip.folder(name).file("splash.webp", blob);
  };

  await generateSplashScreen("drawable", 480, 800);
  zip.folder("drawable").file("launch_splash.xml", xmlString);
  await generateSplashScreen("drawable-land", 800, 480);
  await generateSplashScreen("drawable-land-hdpi", 800, 480);
  await generateSplashScreen("drawable-land-ldpi", 320, 200);
  await generateSplashScreen("drawable-land-mdpi", 480, 320);
  await generateSplashScreen("drawable-land-xhdpi", 1280, 720);
  await generateSplashScreen("drawable-land-xxhdpi", 1600, 960);
  await generateSplashScreen("drawable-land-xxxhdpi", 1920, 1280);
  await generateSplashScreen("drawable-port-hdpi", 480, 800);
  await generateSplashScreen("drawable-port-ldpi", 200, 320);
  await generateSplashScreen("drawable-port-mdpi", 320, 480);
  await generateSplashScreen("drawable-port-xhdpi", 720, 1280);
  await generateSplashScreen("drawable-port-xxhdpi", 960, 1600);
  await generateSplashScreen("drawable-port-xxxhdpi", 1280, 1920);

  const base64string = await zip.generateAsync({ type: "base64" });
  downloadDataUri(
    "splashscreens.zip",
    `data:application/zip;base64,${base64string}`
  );
};

const App = () => {
  const [loading, setLoading] = useState(false);
  return (
    <div className="App h-screen w-screen flex items-center justify-center">
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold text-5xl py-4 px-8 rounded-md"
        onClick={async () => {
          try {
            setLoading(true);
            const files = await pickFiles("image/png", false);
            const file = files[0];
            await generateSplashScreens(file);
          } catch (err) {
            console.log(err);
          } finally {
            setLoading(false);
          }
        }}
      >
        Create Splashscreens
      </button>
      {loading && <p>loading...</p>}
    </div>
  );
};

export default App;
