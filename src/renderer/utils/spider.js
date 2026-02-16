const scrape = window.require('website-scraper');
const path = window.require('path');
const os = window.require('os');

export const runSpider = async (url, depth, onProgress) => {
    // Define output directory in Documents/CyberStrike_Scrapes
    const documentsPath = path.join(os.homedir(), 'Documents', 'CyberStrike_Scrapes');
    const domain = new URL(url).hostname;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const directory = path.join(documentsPath, `${domain}_${timestamp}`);

    const options = {
        urls: [url],
        directory: directory,
        recursive: true,
        maxDepth: depth,
        filenameGenerator: 'bySiteStructure',
        sources: [
            { selector: 'img', attr: 'src' },
            { selector: 'link[rel="stylesheet"]', attr: 'href' },
            { selector: 'script', attr: 'src' }
        ],
        onResourceSaved: (resource) => {
            onProgress(`Saved: ${resource.filename}`);
        },
        onResourceError: (resource, err) => {
            onProgress(`ERROR: ${resource.url} - ${err.message}`);
        }
    };

    try {
        onProgress(`Starting scrape of ${url}`);
        onProgress(`Output Directory: ${directory}`);

        await scrape(options);

        onProgress('Scrape completed successfully.');
        return directory;
    } catch (error) {
        throw error;
    }
};
