import './App.css';
import { useState } from 'react';
import { compressWebp, cropPng } from './image.util';
import JSZip from 'jszip';
<<<<<<< HEAD
import { processZip } from './process-zip';
=======
>>>>>>> master

const androidXmlString = `<?xml version="1.0" encoding="utf-8"?>
<bitmap xmlns:android="http://schemas.android.com/apk/res/android"
    android:src="@drawable/splash"
    android:scaleType="centerCrop"
/>`;

const iosJsonString = `{
  "images" : [
    {
      "idiom" : "universal",
      "filename" : "splash-2732x2732-2.png",
      "scale" : "1x"
    },
    {
      "idiom" : "universal",
      "filename" : "splash-2732x2732-1.png",
      "scale" : "2x"
    },
    {
      "idiom" : "universal",
      "filename" : "splash-2732x2732.png",
      "scale" : "3x"
    }
  ],
  "info" : {
    "version" : 1,
    "author" : "xcode"
  }
}`;

const pickFiles = async (accept, multiple) =>
    new Promise(resolve => {
        const inputId = `input-${Math.random().toString(36).substring(2, 15)}`;
        const input = document.createElement('input');
        input.id = inputId;
        input.type = 'file';
        input.multiple = multiple;
        input.hidden = true;
        input.value = '';
        input.accept = accept;

        document.body.appendChild(input);
        input.addEventListener('change', async e => {
            resolve(e.target.files);
            input.remove();
        });
        input.click();
    });

const downloadDataUri = (fileName, dataUri) => {
    const elementId = `a-${Math.random().toString(36).substring(2, 15)}`;
    const link = document.createElement('a');
    link.id = elementId;
    link.hidden = true;
    link.href = dataUri;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
};

const generateSplashScreens = async file => {
    const zip = new JSZip();

    const generateSplashScreenAndroid = async (name, width, height) => {
        const blob = await compressWebp(width, height, width / height)(file);
        zip.folder('android').folder(name).file('splash.webp', blob);
    };

    const generateSplashScreenIos = async (name, width, height) => {
        const blob = await cropPng(width, height, width / height)(file);
        zip.folder('ios').folder('Splash.imageset').file(name, blob);
    };

    //android
    zip.folder('android').folder('drawable').file('launch_splash.xml', androidXmlString);
    await generateSplashScreenAndroid('drawable', 480, 800);
    await generateSplashScreenAndroid('drawable-land', 800, 480);
    await generateSplashScreenAndroid('drawable-land-hdpi', 800, 480);
    await generateSplashScreenAndroid('drawable-land-ldpi', 320, 200);
    await generateSplashScreenAndroid('drawable-land-mdpi', 480, 320);
    await generateSplashScreenAndroid('drawable-land-xhdpi', 1280, 720);
    await generateSplashScreenAndroid('drawable-land-xxhdpi', 1600, 960);
    await generateSplashScreenAndroid('drawable-land-xxxhdpi', 1920, 1280);
    await generateSplashScreenAndroid('drawable-port-hdpi', 480, 800);
    await generateSplashScreenAndroid('drawable-port-ldpi', 200, 320);
    await generateSplashScreenAndroid('drawable-port-mdpi', 320, 480);
    await generateSplashScreenAndroid('drawable-port-xhdpi', 720, 1280);
    await generateSplashScreenAndroid('drawable-port-xxhdpi', 960, 1600);
    await generateSplashScreenAndroid('drawable-port-xxxhdpi', 1280, 1920);

    // ios
    zip.folder('ios').folder('Splash.imageset').file('Contents.json', iosJsonString);
    await generateSplashScreenIos('splash-2732x2732-2.png', 2732, 2732);
    await generateSplashScreenIos('splash-2732x2732-1.png', 2732, 2732);
    await generateSplashScreenIos('splash-2732x2732.png', 2732, 2732);

    // playstore
    zip.folder('playstore').file(
        'playstoreIntroductionPlaceholder.png',
        await cropPng(1024, 500, 1024 / 500)(file),
    );

    const base64string = await zip.generateAsync({ type: 'base64' });
    downloadDataUri('splashscreens.zip', `data:application/zip;base64,${base64string}`);
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
                        const files = await pickFiles('image/png', false);
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
            <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold text-5xl py-4 px-8 rounded-md"
                onClick={async () => {
                    try {
                        setLoading(true);
                        const files = await pickFiles('application/zip', false);
                        const file = files[0];
                        const base64 = await processZip(file);
                        downloadDataUri('processed.zip', `data:application/zip;base64,${base64}`);
                    } catch (err) {
                        console.log(err);
                    } finally {
                        setLoading(false);
                    }
                }}
            >
                Process Zip
            </button>
            {loading && <p>loading...</p>}
        </div>
    );
};

export default App;
