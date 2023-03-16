document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const tokenInput = document.getElementById('token');
    const promptInput = document.getElementById('prompt');

    chrome.storage.sync.get(['openai_token', 'openai_prompt'], (result) => {
        if (result.openai_token) {
            tokenInput.value = result.openai_token;
        }
        if (result.openai_prompt) {
            promptInput.value = result.openai_prompt;
        }
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const token = tokenInput.value;
        const prompt = promptInput.value;
        chrome.storage.sync.set({ openai_token: token, openai_prompt: prompt }, () => {
            console.log('Config stored:', { token, prompt });
            window.close();
        });
    });
});
