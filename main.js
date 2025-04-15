
function triggerVibration() {
    if ("vibrate" in navigator) {
        navigator.vibrate(50);
    }
}

function handleTap(event) {
    triggerVibration();
    // остальная логика
}
