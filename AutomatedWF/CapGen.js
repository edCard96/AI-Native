document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('imageUpload');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const generateBtn = document.getElementById('generateBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const captionsOutput = document.getElementById('captionsOutput');
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    const closeErrorModal = document.getElementById('closeErrorModal');
    const toneSelect = document.getElementById('toneSelect');
    const pastGenerations = [];

    // --- Image Preview Logic ---
    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreviewContainer.classList.add('show');
                // Clear previous captions and hide output section
                captionsOutput.innerHTML = '';
                captionsOutput.classList.add('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            imagePreview.src = '#';
            imagePreviewContainer.classList.remove('show');
        }
    });

    // --- Generate Captions Logic ---
    generateBtn.addEventListener('click', async () => {
        const file = imageUpload.files[0];
        if (!file) {
            showErrorModal('Please upload an image first.');
            return;
        }
        const selectedTone = toneSelect.value;
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        generateBtn.disabled = true; // Disable button during generation
        captionsOutput.classList.add('hidden'); // Hide previous captions

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64ImageData = reader.result.split(',')[1]; // Get base64 string without data URI prefix
            const imageDataUrl = reader.result; // Full data URL for storage

            try {
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 2000));

                // --- Simulate API Response (Replace with actual fetch call) ---
                const simulatedResponse = {
                    Funny: "Just filed my taxes — now it's beach vibes only.",
                    Poetic: "Golden fur, warm breeze — the ocean applauds his fashion.",
                    Romantic: "She said yes, and the beach turned into a honeymoon.",
                    Mysterious: "No one knew how he got there, but the waves knew his name.",
                    Realistic: "A retriever in sunglasses and a Hawaiian shirt at the beach.",
                    Inspirational: "Confidence is a dog in shades owning the shoreline."
                };
                // Only show the selected tone
                const captions = {};
                captions[selectedTone] = simulatedResponse[selectedTone];
                displayCaptions(captions); // Only display the selected tone
                captionsOutput.classList.remove('hidden');

                // Store in pastGenerations
                pastGenerations.push({
                    image: imageDataUrl,
                    tone: selectedTone,
                    caption: simulatedResponse[selectedTone]
                });
                console.log('Past Generations:', pastGenerations);

            } catch (error) {
                console.error('Error generating captions:', error);
                showErrorModal(`Failed to generate captions: ${error.message}`);
            } finally {
                // Hide loading indicator and re-enable button
                loadingIndicator.classList.add('hidden');
                generateBtn.disabled = false;
            }
        };
        reader.readAsDataURL(file); // Read the file as a data URL
    });

    // --- Display Captions Function ---
    function displayCaptions(captions) {
        captionsOutput.innerHTML = ''; // Clear previous captions
        for (const [tone, caption] of Object.entries(captions)) {
            const captionCard = document.createElement('div');
            captionCard.className = 'caption-card bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between';
            captionCard.innerHTML = `
                <p class="text-gray-800 font-medium mb-2">${tone}</p>
                <p class="text-gray-700 text-sm mb-4 flex-grow">${caption}</p>
                <button class="copy-btn bg-indigo-500 text-white text-sm py-2 px-4 rounded-full self-end">
                    <i class="fas fa-copy mr-2"></i>Copy
                </button>
            `;
            const copyBtn = captionCard.querySelector('.copy-btn');
            copyBtn.addEventListener('click', () => copyToClipboard(caption, copyBtn));
            captionsOutput.appendChild(captionCard);
        }
    }

    // --- Copy to Clipboard Function ---
    function copyToClipboard(text, buttonElement) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            buttonElement.textContent = 'Copied!';
            buttonElement.classList.add('bg-green-500');
            buttonElement.classList.remove('bg-indigo-500');
            setTimeout(() => {
                buttonElement.innerHTML = '<i class="fas fa-copy mr-2"></i>Copy';
                buttonElement.classList.remove('bg-green-500');
                buttonElement.classList.add('bg-indigo-500');
            }, 1500);
        } catch (err) {
            console.error('Failed to copy text: ', err);
            showErrorModal('Failed to copy text. Please try again manually.');
        }
        document.body.removeChild(textArea);
    }

    // --- Error Modal Functions ---
    function showErrorModal(message) {
        errorMessage.textContent = message;
        errorModal.classList.remove('hidden');
    }

    closeErrorModal.addEventListener('click', () => {
        errorModal.classList.add('hidden');
    });

    // Close modal if clicked outside (optional)
    errorModal.addEventListener('click', (event) => {
        if (event.target === errorModal) {
            errorModal.classList.add('hidden');
        }
    });
});
