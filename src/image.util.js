import createPica from 'pica';

const ibr = require('image-blob-reduce'); // this fixes an issue with image compression in mobile apps

const URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
export const blobToDataUrl = blob => URL.createObjectURL(blob);

export const createImageProcessor = (mimeType, compression = 1) => {
    const pica = createPica();
    const ibrCreateBlob = (quality, callback) => env =>
        pica.toBlob(env.out_canvas, mimeType, quality).then(blob => {
            callback && callback(blob); // to yoink the blob as returning it sometimes messes with it's mime type for some reason
            env.out_blob = blob;
            return env;
        });

    const reduceImageToBlobSize = async (blob, max) => {
        let result = null;
        const imageBlobReduce = ibr({ pica });
        imageBlobReduce._create_blob = ibrCreateBlob(1, b => {
            result = b;
        });
        await imageBlobReduce.toBlob(blob, { max });
        return result;
    };
    const reduceImageToBlobQuality = async (blob, max) => {
        let result = null;
        const imageBlobReduce = ibr({ pica });
        imageBlobReduce._create_blob = ibrCreateBlob(compression, b => {
            result = b;
        });
        await imageBlobReduce.toBlob(blob, { max });
        return result;
    };

    const blobToImg = blob =>
        new Promise(resolve => {
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
                mimeType,
                1,
            );
        });
    };

    const cleanBlob = async (imgBlob, fileName) => {
        const image = await blobToImg(imgBlob);

        const canvas = document.createElement('canvas');
        const pixelRatio = window.devicePixelRatio;
        const ctx = canvas.getContext('2d');

        canvas.width = image.naturalWidth * pixelRatio;
        canvas.height = image.naturalHeight * pixelRatio;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
            image,
            0,
            0,
            image.naturalWidth,
            image.naturalHeight,
            0,
            0,
            image.naturalWidth,
            image.naturalHeight,
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
                mimeType,
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
                x: 0,
                y: yPosition,
                width: image.naturalWidth,
                height: targetHeight,
            };
        }
        if (image.naturalWidth > targetWidth) {
            // crop width
            const xPosition = (image.naturalWidth - targetWidth) / 2;
            return {
                x: xPosition,
                y: 0,
                width: targetWidth,
                height: image.naturalHeight,
            };
        }

        return undefined;
    };

    /**
     * Compresses the image blob to the specified max resolution and quality
     * @returns image blob
     */
    const compress = (maxWidth, maxHeight, aspectRatio) => async blob => {
        const cleanedBlob = await cleanBlob(blob, blob.name);
        // compressing before cropping vastly improves performance
        const onceCompressedBlob = await reduceImageToBlobSize(
            cleanedBlob,
            Math.max(maxWidth, maxHeight),
        );
        const croppedBlob = aspectRatio
            ? await cropImgBlob(onceCompressedBlob, aspectRatio, blob.name)
            : onceCompressedBlob;
        // compressing after cropping vastly decreses blob size
        const compressedBlob = await reduceImageToBlobQuality(
            croppedBlob,
            Math.max(maxWidth, maxHeight),
        );

        return compressedBlob;
    };

    const crop = (maxWidth, maxHeight, aspectRatio) => async blob => {
        const cleanedBlob = await cleanBlob(blob, blob.name);
        const croppedBlob = await cropImgBlob(cleanedBlob, aspectRatio, blob.name);
        // compressing after cropping vastly decreses blob size
        const compressedBlob = await reduceImageToBlobQuality(
            croppedBlob,
            Math.max(maxWidth, maxHeight),
        );

        return compressedBlob;
    };

    return { compress, crop };
};

export const { compress: compressPng, crop: cropPng } = createImageProcessor('image/png', 1);
export const { compress: compressWebp } = createImageProcessor('image/webp', 0.99);
export const { compress: compressWebpMedium } = createImageProcessor('image/webp', 0.9);
