document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const uploadButton = document.getElementById('uploadButton');
    const status = document.getElementById('status');
    
    const allowedTypes = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.txt', '.doc', '.docx'];
    let filesToUpload = [];

    // Handle click on drop zone
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Handle file selection
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Handle drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    // Check if file type is allowed
    function isAllowedFile(filename) {
        const ext = '.' + filename.split('.').pop().toLowerCase();
        return allowedTypes.includes(ext);
    }

    // Handle files
    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (!isAllowedFile(file.name)) {
                showStatus(`File type not allowed: ${file.name}`, 'error');
                return;
            }
            if (!filesToUpload.some(f => f.name === file.name)) {
                filesToUpload.push(file);
            }
        });
        updateFileList();
        uploadButton.disabled = filesToUpload.length === 0;
    }

    // Update file list display
    function updateFileList() {
        fileList.innerHTML = '';
        filesToUpload.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileInfo = document.createElement('span');
            fileInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;
            
            const removeButton = document.createElement('button');
            removeButton.innerHTML = '<i class="fas fa-times"></i>';
            removeButton.style.border = 'none';
            removeButton.style.background = 'none';
            removeButton.style.cursor = 'pointer';
            removeButton.style.color = '#f44336';
            removeButton.onclick = () => {
                filesToUpload.splice(index, 1);
                updateFileList();
                uploadButton.disabled = filesToUpload.length === 0;
            };

            fileItem.appendChild(fileInfo);
            fileItem.appendChild(removeButton);
            fileList.appendChild(fileItem);
        });
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Show status message
    function showStatus(message, type = 'success') {
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                status.style.display = 'none';
            }, 3000);
        }
    }

    // Handle upload
    uploadButton.addEventListener('click', async () => {
        if (filesToUpload.length === 0) return;

        uploadButton.disabled = true;
        showStatus('Uploading...');

        try {
            for (const file of filesToUpload) {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Upload failed');
                }
            }

            showStatus('Upload successful!');
            filesToUpload = [];
            updateFileList();
            
            // Refresh the page to show the updated file list
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error('Upload error:', error);
            showStatus(error.message || 'Upload failed. Please try again.', 'error');
        } finally {
            uploadButton.disabled = false;
        }
    });

    // Handle file deletion
    window.deleteFile = async (filename) => {
        if (!confirm('Are you sure you want to delete this file?')) {
            return;
        }

        try {
            const response = await fetch(`/delete/${filename}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Delete failed');
            }

            // Refresh the page to update the file list
            window.location.reload();
        } catch (error) {
            console.error('Delete error:', error);
            showStatus(error.message || 'Delete failed. Please try again.', 'error');
        }
    };
}); 