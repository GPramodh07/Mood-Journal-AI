/**
 * ============================================================================
 * MOOD JOURNAL AI - Frontend JavaScript
 * 
 * Handles:
 * - User input capture and validation
 * - API communication with backend
 * - Audio Blob processing and playback
 * - UI state management and animations
 * ============================================================================
 */

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const AppState = {
    isListening: false,
    isLoading: false,
    currentAudioBlob: null,
    maxCharacters: 5000,
};

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const DOM = {
    userThoughts: document.getElementById('userThoughts'),
    listenBtn: document.getElementById('listenBtn'),
    clearBtn: document.getElementById('clearBtn'),
    audioPlayer: document.getElementById('audioPlayer'),
    charCount: document.getElementById('charCount'),
    audioStatus: document.getElementById('audioStatus'),
    statusText: document.getElementById('statusText'),
    feedbackSection: document.getElementById('feedbackSection'),
    feedbackMessage: document.getElementById('feedbackMessage'),
};

// ============================================================================
// CHARACTER COUNT TRACKER
// ============================================================================

/**
 * Update character count display and enforce maximum
 */
function updateCharacterCount() {
    const length = DOM.userThoughts.value.length;
    DOM.charCount.textContent = length;

    // Enforce max limit
    if (length > AppState.maxCharacters) {
        DOM.userThoughts.value = DOM.userThoughts.value.substring(
            0,
            AppState.maxCharacters
        );
        DOM.charCount.textContent = AppState.maxCharacters;
    }
}

DOM.userThoughts.addEventListener('input', updateCharacterCount);

// ============================================================================
// AUDIO STATUS INDICATOR
// ============================================================================

/**
 * Update audio status indicator and text
 * @param {boolean} isActive - Whether AI is currently speaking
 * @param {string} text - Status text to display
 */
function setAudioStatus(isActive, text = 'Ready') {
    DOM.audioStatus.classList.toggle('active', isActive);
    DOM.statusText.textContent = text;
}

// ============================================================================
// BUTTON STATE MANAGEMENT
// ============================================================================

/**
 * Update button state and visual feedback
 * @param {string} state - 'idle', 'loading', or 'listening'
 */
function updateButtonState(state) {
    DOM.listenBtn.setAttribute('data-state', state);

    const states = {
        idle: {
            text: 'Listen to AI',
            icon: '🎧',
            disabled: false,
        },
        loading: {
            text: 'Thinking',
            icon: '⏳',
            disabled: true,
        },
        listening: {
            text: 'AI Speaking',
            icon: '🔊',
            disabled: true,
        },
    };

    const config = states[state] || states.idle;
    DOM.listenBtn.querySelector('.button-text').textContent = config.text;
    DOM.listenBtn.querySelector('.button-icon').textContent = config.icon;
    DOM.listenBtn.disabled = config.disabled;
}

// ============================================================================
// FEEDBACK DISPLAY
// ============================================================================

/**
 * Show or hide feedback message
 * @param {string|null} message - Message to display (null to hide)
 * @param {string} type - 'success', 'error', or 'info'
 */
function showFeedback(message, type = 'info') {
    if (!message) {
        DOM.feedbackSection.style.display = 'none';
        DOM.feedbackMessage.textContent = '';
        return;
    }

    DOM.feedbackMessage.textContent = message;
    DOM.feedbackSection.style.display = 'block';
}

// ============================================================================
// API COMMUNICATION
// ============================================================================

/**
 * Send user thoughts to backend and get AI response
 * @returns {Promise<boolean>} - Success status
 */
async function sendJournalEntry() {
    const thoughts = DOM.userThoughts.value.trim();

    // Validation
    if (!thoughts) {
        showFeedback('Please write something before listening to the AI.', 'error');
        return false;
    }

    if (thoughts.length < 10) {
        showFeedback('Your thoughts seem too short. Share more details!', 'error');
        return false;
    }

    try {
        // Update UI for loading state
        AppState.isLoading = true;
        updateButtonState('loading');
        setAudioStatus(false, 'Requesting...');
        showFeedback(null);

        console.log('📤 Sending journal entry to backend...');

        // Make API request
        const response = await fetch('http://localhost:5000/api/journal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                thoughts: thoughts,
                timestamp: new Date().toISOString(),
            }),
        });

        // Handle HTTP errors
        if (!response.ok) {
            throw new Error(
                `Backend error: ${response.status} ${response.statusText}`
            );
        }

        // Validate content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('audio/mpeg')) {
            throw new Error(
                'Invalid response: Expected audio/mpeg, got ' + contentType
            );
        }

        // Extract audio blob
        const audioBlob = await response.blob();

        if (audioBlob.size === 0) {
            throw new Error('Received empty audio response');
        }

        console.log('✅ Received audio blob:', audioBlob.size, 'bytes');

        // Store and play audio
        AppState.currentAudioBlob = audioBlob;
        playAudio(audioBlob);

        return true;
    } catch (error) {
        console.error('❌ API Error:', error);
        showFeedback(
            `Error: ${error.message}. Check that the backend is running on port 5000.`,
            'error'
        );
        updateButtonState('idle');
        setAudioStatus(false, 'Error');
        return false;
    } finally {
        AppState.isLoading = false;
    }
}

// ============================================================================
// AUDIO PLAYBACK
// ============================================================================

/**
 * Play audio blob with status updates
 * @param {Blob} audioBlob - Audio data to play
 */
function playAudio(audioBlob) {
    try {
        // Create object URL from blob
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('🎧 Playing audio...');

        // Configure audio player
        DOM.audioPlayer.src = audioUrl;
        DOM.audioPlayer.onplay = () => {
            updateButtonState('listening');
            setAudioStatus(true, 'AI Speaking...');
        };

        DOM.audioPlayer.onended = () => {
            updateButtonState('idle');
            setAudioStatus(false, 'Finished');
            showFeedback('✨ AI finished speaking. Feel free to share more!', 'success');
            URL.revokeObjectURL(audioUrl); // Clean up memory
        };

        DOM.audioPlayer.onerror = (event) => {
            console.error('❌ Audio playback error:', event);
            updateButtonState('idle');
            setAudioStatus(false, 'Error');
            showFeedback('Error playing audio. Please try again.', 'error');
        };

        // Start playback
        DOM.audioPlayer.play().catch((err) => {
            console.error('❌ Play error:', err);
            showFeedback('Could not play audio. Browser may have autoplay restrictions.', 'error');
            updateButtonState('idle');
        });
    } catch (error) {
        console.error('❌ Audio setup error:', error);
        showFeedback('Error setting up audio playback.', 'error');
        updateButtonState('idle');
    }
}

// ============================================================================
// CLEAR FUNCTIONALITY
// ============================================================================

/**
 * Clear textarea and reset state
 */
function clearJournal() {
    DOM.userThoughts.value = '';
    updateCharacterCount();
    showFeedback(null);
    updateButtonState('idle');
    setAudioStatus(false, 'Ready');
    
    // Stop any playing audio
    if (!DOM.audioPlayer.paused) {
        DOM.audioPlayer.pause();
        DOM.audioPlayer.src = '';
    }
    
    console.log('🗑️  Journal cleared');
}

DOM.clearBtn.addEventListener('click', clearJournal);

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Send journal entry on button click
 */
DOM.listenBtn.addEventListener('click', async () => {
    // Prevent multiple simultaneous requests
    if (AppState.isLoading || AppState.isListening) {
        console.warn('⚠️  Request already in progress');
        return;
    }

    const success = await sendJournalEntry();
    if (!success && DOM.audioPlayer.src) {
        DOM.audioPlayer.src = '';
    }
});

/**
 * Allow Enter+Shift to submit (optional UX enhancement)
 */
DOM.userThoughts.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && event.shiftKey && !AppState.isLoading) {
        event.preventDefault();
        DOM.listenBtn.click();
    }
});

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize application
 */
function initialize() {
    console.log('🚀 Mood Journal AI loaded');
    console.log('📡 Backend: http://localhost:5000');
    
    updateButtonState('idle');
    setAudioStatus(false, 'Ready');
    updateCharacterCount();
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

// ============================================================================
// DEBUGGING UTILITIES (Development only)
// ============================================================================

/**
 * Log current app state (useful for debugging)
 */
window.debugAppState = () => {
    console.table({
        isLoading: AppState.isLoading,
        isListening: AppState.isListening,
        hasAudio: !!AppState.currentAudioBlob,
        audioSize: AppState.currentAudioBlob?.size || 'N/A',
        textLength: DOM.userThoughts.value.length,
    });
};

console.log('💡 Use debugAppState() in console to check current state');
