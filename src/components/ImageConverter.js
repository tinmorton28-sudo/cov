export function setupImageConverter() {
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.getElementById('nav-links');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    const fileInput = document.getElementById('file-input');
    const addMoreFilesInput = document.getElementById('add-more-files-input');
    const initialView = document.getElementById('initial-view');
    const fileListView = document.getElementById('file-list-view');
    const fileListContainer = document.getElementById('file-list-container');
    const fileItemTemplate = document.getElementById('file-item-template');
    const convertAllBtn = document.getElementById('convert-all-btn');
    const dynamicMainTitle = document.getElementById('dynamic-main-title');
    const pageTitle = document.getElementById('page-title');
    const inputFormatSelect = document.getElementById('input-format-select');
    const outputFormatSelect = document.getElementById('output-format-select');

    const contactEmailPlaceholder = document.getElementById('contact-email-placeholder');
    if (contactEmailPlaceholder) {
        const domain = import.meta.env.VITE_PUBLIC_DOMAIN || window.location.hostname;
        const emailLink = document.createElement('a');
        emailLink.href = `mailto:support@${domain}`;
        emailLink.textContent = `support@${domain}`;
        contactEmailPlaceholder.appendChild(emailLink);
    }

    let filesToProcess = [];
    const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

    const formatLabels = {
        'any': 'ANY',
        'image/jpeg': 'JPG',
        'image/png': 'PNG',
        'image/webp': 'WEBP',
        'image/gif': 'GIF',
        'image/bmp': 'BMP'
    };

    function updateTitles() {
        const inputLabel = formatLabels[inputFormatSelect.value];
        const outputLabel = formatLabels[outputFormatSelect.value];
        let mainTitleText = `${inputLabel} to ${outputLabel} Converter`;
        let pageTitleText = `${inputLabel} to ${outputLabel} Converter Online & Free | Converter`;

        dynamicMainTitle.textContent = mainTitleText;
        pageTitle.textContent = pageTitleText;
    }

    function addFiles(fileList) {
        if (fileList.length === 0) return;

        initialView.classList.add('hidden');
        fileListView.classList.remove('hidden');

        Array.from(fileList).forEach(file => {
            if (file.size > MAX_FILE_SIZE_BYTES) {
                alert(`File "${file.name}" is too large (max 100MB).`);
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert(`File "${file.name}" is not a valid image.`);
                return;
            }

            const fileId = `file-${Date.now()}-${Math.random()}`;
            const fileObject = {
                id: fileId,
                file: file,
                status: 'ready',
                outputFormat: outputFormatSelect.value
            };
            filesToProcess.push(fileObject);
            renderFileItem(fileObject);
        });
    }

    function renderFileItem(fileObject) {
        const itemClone = fileItemTemplate.content.cloneNode(true);
        const fileItemElement = itemClone.querySelector('.file-item');
        
        fileItemElement.dataset.id = fileObject.id;
        fileItemElement.querySelector('[data-file-name]').textContent = fileObject.file.name;
        fileItemElement.querySelector('[data-file-size]').textContent = formatFileSize(fileObject.file.size);

        const formatSelect = fileItemElement.querySelector('[data-format-select]');
        formatSelect.value = fileObject.outputFormat;
        formatSelect.addEventListener('change', (e) => {
            fileObject.outputFormat = e.target.value;
        });

        const removeBtn = fileItemElement.querySelector('[data-remove-btn]');
        removeBtn.addEventListener('click', () => {
            filesToProcess = filesToProcess.filter(f => f.id !== fileObject.id);
            fileItemElement.remove();
            if (filesToProcess.length === 0) {
                initialView.classList.remove('hidden');
                fileListView.classList.add('hidden');
            }
        });

        fileListContainer.appendChild(fileItemElement);
    }

    async function convertAllFiles() {
        convertAllBtn.disabled = true;
        convertAllBtn.textContent = 'Converting...';
        
        const conversionPromises = filesToProcess.map(fileObject => {
            if (fileObject.status === 'ready') {
                return convertFile(fileObject);
            }
            return Promise.resolve();
        });

        await Promise.all(conversionPromises);

        convertAllBtn.disabled = false;
        convertAllBtn.innerHTML = `Convert <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`;
    }
    
    async function convertFile(fileObject) {
        const fileItemElement = document.querySelector(`.file-item[data-id="${fileObject.id}"]`);
        const statusContainer = fileItemElement.querySelector('[data-status-container]');
        const statusElement = fileItemElement.querySelector('[data-file-status]');
        const progressBarContainer = fileItemElement.querySelector('[data-progress-bar-container]');
        const downloadContainer = fileItemElement.querySelector('[data-download-container]');

        fileObject.status = 'converting';
        statusElement.classList.add('hidden');
        progressBarContainer.classList.remove('hidden');

        try {
            const imageDataUrl = await readFileAsDataURL(fileObject.file);
            const image = await loadImage(imageDataUrl);

            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);

            const blob = await new Promise(resolve => canvas.toBlob(resolve, fileObject.outputFormat, 0.8));
            
            progressBarContainer.classList.add('hidden');

            const downloadUrl = URL.createObjectURL(blob);
            const formatExtension = fileObject.outputFormat.split('/')[1].replace('jpeg', 'jpg');
            const newFileName = `${fileObject.file.name.split('.').slice(0, -1).join('.')}.${formatExtension}`;

            const downloadLink = document.createElement('a');
            downloadLink.href = downloadUrl;
            downloadLink.download = newFileName;
            downloadLink.textContent = 'DOWNLOAD';
            downloadLink.className = 'download-button';
            
            downloadContainer.innerHTML = '';
            downloadContainer.appendChild(downloadLink);
            downloadContainer.classList.remove('hidden');

            fileObject.status = 'done';
            
        } catch (error) {
            console.error('Conversion error:', error);
            fileObject.status = 'error';
            progressBarContainer.classList.add('hidden');
            statusElement.textContent = 'ERROR';
            statusElement.className = 'file-status error';
            statusElement.classList.remove('hidden');
        }
    }

    function formatFileSize(bytes, decimals = 1) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
            img.src = src;
        });
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => addFiles(e.target.files));
    }
    if (addMoreFilesInput) {
        addMoreFilesInput.addEventListener('change', (e) => addFiles(e.target.files));
    }
    if (convertAllBtn) {
        convertAllBtn.addEventListener('click', convertAllFiles);
    }
    if (inputFormatSelect) {
        inputFormatSelect.addEventListener('change', updateTitles);
    }
    if (outputFormatSelect) {
        outputFormatSelect.addEventListener('change', updateTitles);
    }

    if (dynamicMainTitle) {
        updateTitles();
    }
}