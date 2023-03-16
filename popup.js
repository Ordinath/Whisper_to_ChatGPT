document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const tokenInput = document.getElementById('token');
    const promptInput = document.getElementById('prompt');
    const snippetsContainer = document.getElementById('snippets');
    const addSnippetBtn = document.getElementById('addSnippet');

    chrome.storage.sync.get(['openai_token', 'openai_prompt', 'openai_snippets'], (result) => {
        if (result.openai_token) {
            tokenInput.value = result.openai_token;
        }
        if (result.openai_prompt) {
            promptInput.value = result.openai_prompt;
        }
        if (result.openai_snippets) {
            result.openai_snippets.forEach((snippet, index) => {
                addSnippetField(snippet, index);
            });
        }
    });

    addSnippetBtn.addEventListener('click', (event) => {
        event.preventDefault();
        addSnippetField('', snippetsContainer.children.length);
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const token = tokenInput.value;
        const prompt = promptInput.value;
        const snippets = Array.from(snippetsContainer.children).map((snippetContainer) => {
            return snippetContainer.querySelector('input').value;
        });
        chrome.storage.sync.set(
            {
                openai_token: token,
                openai_prompt: prompt,
                openai_snippets: snippets,
            },
            () => {
                console.log('Config stored:', { token, prompt, snippets });
                window.close();
            }
        );
    });

    function addSnippetField(value, index) {
        const snippetContainer = document.createElement('div');
        const input = document.createElement('input');
        const removeBtn = document.createElement('button');

        input.type = 'text';
        input.name = `snippet-${index}`;
        input.value = value;
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', (event) => {
            event.preventDefault();
            snippetsContainer.removeChild(snippetContainer);
        });

        snippetContainer.appendChild(input);
        snippetContainer.appendChild(removeBtn);
        snippetsContainer.appendChild(snippetContainer);
    }
});
