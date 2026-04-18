// If user already logged in, skip to the app
if (sessionStorage.getItem('access_granted') === 'true') {
    window.location.href = 'home.html';
}

// Get the form and input elements
const loginForm = document.getElementById('loginForm');
const accessCodeInput = document.getElementById('accessCode');
const errorMessage = document.getElementById('errorMessage');
const submitBtn = document.getElementById('submitBtn');

// Handle when user submits the access code
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const code = accessCodeInput.value.trim();
    const correctCode = 'HACK2026';

    // Check if code is correct
    if (code === correctCode) {
        // Save to session storage so they stay logged in
        sessionStorage.setItem('access_granted', 'true');
        errorMessage.classList.remove('show');
        
        // Change button to show success
        submitBtn.disabled = true;
        submitBtn.textContent = 'Access Granted ✓';

        // Wait then go to main app
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 500);
    } else {
        // Show error
        errorMessage.textContent = 'Invalid access code. Please try again.';
        errorMessage.classList.add('show');
        
        // Clear input and focus back
        accessCodeInput.value = '';
        accessCodeInput.focus();
    }
});
