import JSZip from 'jszip';
import { compressWebpMedium } from './image.util';

const processFile = async (zipFile, targetFolder) => {
    console.log('processing file', zipFile.name);

    if (
        zipFile.name.endsWith('.png') ||
        zipFile.name.endsWith('.jpg') ||
        zipFile.name.endsWith('.jpeg')
    ) {
        let blob = await zipFile.async('blob');

        if (zipFile.name.endsWith('.png')) {
            blob = new Blob([blob], { type: 'image/png' });
        } else if (zipFile.name.endsWith('.jpg')) {
            blob = new Blob([blob], { type: 'image/jpg' });
        } else if (zipFile.name.endsWith('.jpeg')) {
            blob = new Blob([blob], { type: 'image/jpeg' });
        }

        console.log('compressing file', zipFile.name, blob);
        try {
            // targetFolder.file(zipFile.name, await zipFile.async('blob'));
            const compressedBlob = await compressWebpMedium(1920, 1920)(blob);
            const fileName = zipFile.name.replace(/\.[^/.]+$/, '.webp');
            targetFolder.file(fileName, compressedBlob);
            // await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err) {
            console.error(zipFile.name, err.message, err);
        }
    } else if (zipFile.name.endsWith('.webp')) {
        // do nothing, we assume we recompress it
    } else {
        const blob = await zipFile.async('blob');
        targetFolder.file(zipFile.name, blob);
    }
};

const countFiles = zip => {
    let count = 0;
    zip.forEach((_, zipEntry) => {
        if (!zipEntry.dir) {
            count++;
        }
    });
    return count;
};

export const processZip = async zipBlob => {
    const targetZip = new JSZip();

    const zip = await JSZip.loadAsync(zipBlob);

    const promises = [];
    zip.forEach((_, zipEntry) => {
        if (!zipEntry.dir) {
            const promise = processFile(zipEntry, targetZip);
            promises.push(promise);
        }
    });
    await Promise.all(promises);

    console.log(`done processing zip, ${countFiles(targetZip)}/${countFiles(zip)} files`);

    return targetZip.generateAsync({ type: 'base64' });
};
