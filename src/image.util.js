import createPica from 'pica';

const ibr = require('image-blob-reduce'); // this fixes an issue with image compression in mobile apps

const pica = createPica();
const reduceImageSize = ibr(pica);
reduceImageSize._create_blob = env => pica.toBlob(env.out_canvas, 'image/webp', 1)
    .then(blob => {
        // eslint-disable-next-line no-param-reassign
        env.out_blob = blob;
        return env;
    });
const reduceImageQuality = ibr(pica);
reduceImageQuality._create_blob = env => pica.toBlob(env.out_canvas, 'image/webp', 0.99)
    .then(blob => {
        // eslint-disable-next-line no-param-reassign
        env.out_blob = blob;
        return env;
    });

const reduceImageToBlobSize = (blob, max) => reduceImageSize.toBlob(blob, { max });
const reduceImageToBlobQuality = (blob, max) => reduceImageQuality.toBlob(blob, { max });

const URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
export const blobToDataUrl = blob => URL.createObjectURL(blob);

const blobToImg = blob => new Promise(resolve => {
    const imageUrl = blobToDataUrl(blob);
    const img = document.createElement('img');
    img.src = imageUrl;
    img.onload = () => {
        resolve(img);
    };
});

const cropImgBlob = async (imgBlob, aspectRatio, fileName) => {
    const image = await blobToImg(imgBlob);
    const crop = getCropOptions(aspectRatio)(image);
    if (!crop) {
        return imgBlob;
    }

    const canvas = document.createElement('canvas');
    const pixelRatio = window.devicePixelRatio;
    const ctx = canvas.getContext('2d');

    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height,
    );

    return new Promise(resolve => {
        canvas.toBlob(
            blob => {
                if (!blob) {
                    // reject(new Error('Canvas is empty'));
                    console.error('Canvas is empty');
                    return;
                }
                // eslint-disable-next-line no-param-reassign
                blob.name = fileName;
                resolve(blob);
            },
            'image/webp',
            1,
        );
    });
};

/**
 * Calculates the options for the HTML image to achieve the given aspect ratio
 * @returns options object or undefined if no crop is needed
 */
const getCropOptions = aspectRatio => image => {
    const targetHeight = image.naturalWidth / aspectRatio;
    const targetWidth = image.naturalHeight * aspectRatio;

    if (image.naturalHeight > targetHeight) {
        // crop height
        const yPosition = (image.naturalHeight - targetHeight) / 2;
        return {
            x: 0, y: yPosition, width: image.naturalWidth, height: targetHeight,
        };
    } if (image.naturalWidth > targetWidth) {
        // crop width
        const xPosition = (image.naturalWidth - targetWidth) / 2;
        return {
            x: xPosition, y: 0, width: targetWidth, height: image.naturalHeight,
        };
    }

    return undefined;
};

/**
 * Compresses the image blob to the specified max resolution and quality
 * @returns image blob
 */
export const compress = (maxWidth, maxHeight, aspectRatio) => async blob => {
    // compressing before cropping vastly improves performance
    const onceCompressedBlob = await reduceImageToBlobSize(blob, Math.max(maxWidth, maxHeight));
    const croppedBlob = aspectRatio ? await cropImgBlob(onceCompressedBlob, aspectRatio, blob.name) : onceCompressedBlob;
    // compressing after cropping vastly decreses blob size
    const compressedBlob = await reduceImageToBlobQuality(croppedBlob, Math.max(maxWidth, maxHeight));

    return compressedBlob;
};
