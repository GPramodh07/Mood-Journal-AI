// App state to keep track of things
const AppState = {
    isListening: false,
    isLoading: false,
    currentAudioBlob: null,
    maxCharacters: 5000,
};

// Get DOM elements
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

// Update character count display
function updateCharacterCount() {
    const length = DOM.userThoughts.value.length;
    DOM.charCount.textContent = length;

    // Don't let them type more than max
    if (length > AppState.maxCharacters) {
        DOM.userThoughts.value = DOM.userThoughts.value.substring(
            0,
            AppState.maxCharacters
        );
        DOM.charCount.textContent = AppState.maxCharacters;
    }
}

DOM.userThoughts.addEventListener('input', updateCharacterCount);

// Update the audio status thing
function setAudioStatus(isActive, text = 'Ready') {
    DOM.audioStatus.classList.toggle('active', isActive);
    DOM.statusText.textContent = text;
}

// Change button appearance based on state
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

// Show feedback messages
function showFeedback(message, type = 'info') {
    if (!message) {
        DOM.feedbackSection.style.display = 'none';
        DOM.feedbackMessage.textContent = '';
        return;
    }

    DOM.feedbackMessage.textContent = message;
    DOM.feedbackSection.style.display = 'block';
}

// Send journal entry to backend
async function sendJournalEntry() {
    const thoughts = DOM.userThoughts.value.trim();

    // Check if they wrote something
    if (!thoughts) {
        showFeedback('Please write something before listening to the AI.', 'error');
        return false;
    }

    if (thoughts.length < 10) {
        showFeedback('Your thoughts seem too short. Share more details!', 'error');
        return false;
    }

    try {
        // Show loading
        AppState.isLoading = true;
        updateButtonState('loading');
        setAudioStatus(false, 'Requesting...');
        showFeedback(null);

        console.log('Sending journal entry...');

        // Make the API call
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

        // Check for errors
        if (!response.ok) {
            throw new Error(
                `Backend error: ${response.status} ${response.statusText}`
            );
        }

        // Make sure it's audio
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('audio/mpeg')) {
            throw new Error(
                'Invalid response: Expected audio/mpeg, got ' + contentType
            );
        }

        // Get the audio data
        const audioBlob = await response.blob();

        if (audioBlob.size === 0) {
            throw new Error('Received empty audio response');
        }

        console.log('Got audio blob:', audioBlob.size, 'bytes');

        // Play the audio
        AppState.currentAudioBlob = audioBlob;
        playAudio(audioBlob);

        return true;
    } catch (error) {
        console.error('API Error:', error);
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

// Play the audio
function playAudio(audioBlob) {
    try {
        // Create URL for the blob
        const audioUrl = URL.createObjectURL(audioBlob);
        console.log('Playing audio...');

        // Set up the player
        DOM.audioPlayer.src = audioUrl;
        DOM.audioPlayer.onplay = () => {
            updateButtonState('listening');
            setAudioStatus(true, 'AI Speaking...');
        };

        DOM.audioPlayer.onended = () => {
            updateButtonState('idle');
            setAudioStatus(false, 'Finished');
            showFeedback('AI finished speaking. Feel free to share more!', 'success');
            URL.revokeObjectURL(audioUrl); // Clean up
        };

        DOM.audioPlayer.onerror = (event) => {
            console.error('Audio playback error:', event);
            updateButtonState('idle');
            setAudioStatus(false, 'Error');
            showFeedback('Error playing audio. Please try again.', 'error');
        };

        // Start playing
        DOM.audioPlayer.play().catch((err) => {
            console.error('Play error:', err);
            showFeedback('Could not play audio. Browser may have autoplay restrictions.', 'error');
            updateButtonState('idle');
        });
    } catch (error) {
        console.error('Audio setup error:', error);
        showFeedback('Error setting up audio playback.', 'error');
        updateButtonState('idle');
    }
}

// Clear the journal
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

    console.log('Journal cleared');
}

DOM.clearBtn.addEventListener('click', clearJournal);

// Handle button click
DOM.listenBtn.addEventListener('click', async () => {
    // Don't let them click twice
    if (AppState.isLoading || AppState.isListening) {
        console.warn('Request already in progress');
        return;
    }

    const success = await sendJournalEntry();
    if (!success && DOM.audioPlayer.src) {
        DOM.audioPlayer.src = '';
    }
});

// Allow Shift+Enter to submit
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
