/* global chrome */
const SVG_MIC_HTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
    </svg>`;
const SVG_MIC_SPINNING_HTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
        <style>
        .spinnerMic { transform-origin: center; animation: spinner_svv2 0.75s infinite linear; }
        @keyframes spinner_svv2 { 100% { transform: rotate(360deg); } }
        </style>
        <path class="spinnerMic" stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
    </svg>`;
const SVG_SPINNER_HTML =
    '<svg viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"> <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="15 85" transform="rotate(0)"> <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 12 12" to="360 12 12" dur="0.75s" repeatCount="indefinite"/> </circle> </svg>';

const TRANSCRIPTION_URL = 'https://api.openai.com/v1/audio/transcriptions';
const TRANSLATION_URL = 'https://api.openai.com/v1/audio/translations';
const MAIN_MICROPHONE_BUTTON_CLASSES =
    'mb-1 mr-1 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:bg-[#D7D7D7] disabled:text-[#f4f4f4] disabled:hover:opacity-100 dark:bg-white dark:text-black dark:focus-visible:outline-white disabled:dark:bg-token-text-quaternary dark:disabled:text-token-main-surface-secondary';
const SECONDARY_MICROPHONE_BUTTON_CLASSES =
    'flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:bg-[#D7D7D7] disabled:text-[#f4f4f4] disabled:hover:opacity-100 dark:bg-white dark:text-black dark:focus-visible:outline-white disabled:dark:bg-token-text-quaternary dark:disabled:text-token-main-surface-secondary';

const TESTING = false;

function logError(message, error) {
    console.error(`[Whisper to ChatGPT] ${message}`, error);
}

async function retrieveFromStorage(key) {
    return new Promise((resolve) => {
        chrome.storage.sync.get(key, function (result) {
            resolve(result[key]);
        });
    });
}

class AudioRecorder {
    constructor() {
        this.recording = false;
        this.mediaRecorder = null;
        this.textarea = null;
        this.micButton = null;
        this.token = null;
        this.snippetButtons = [];
    }

    async listenForKeyboardShortcut() {
        if (await this.shortcutEnabled()) {
            const shortcutFirstKey = await retrieveFromStorage('config_shortcut_first_key');
            const shortcutFirstModifier = await retrieveFromStorage('config_shortcut_first_modifier');
            const shortcutSecondModifier = await retrieveFromStorage('config_shortcut_second_modifier');
            document.addEventListener('keydown', (event) => {
                if (event.code === `Key${shortcutFirstKey.toUpperCase()}`) {
                    // console.log(event);
                    if (shortcutFirstModifier && shortcutFirstModifier !== 'none' && !event[shortcutFirstModifier]) return;
                    if (shortcutSecondModifier && shortcutSecondModifier !== 'none' && !event[shortcutSecondModifier]) return;

                    event.preventDefault();
                    const promptTextarea = document.querySelector('#prompt-textarea');
                    if (promptTextarea) {
                        const micButton = promptTextarea.closest('.flex.items-end.gap-1\\.5.md\\:gap-2').querySelector('.microphone_button');
                        if (micButton) {
                            micButton.click();
                        }
                    }
                }
            });
        }
    }
    createMicButton(inputType) {
        this.micButton = document.createElement('button');
        if (inputType === 'main') {
            this.micButton.className = `microphone_button ${MAIN_MICROPHONE_BUTTON_CLASSES}`;
        } else {
            this.micButton.className = `microphone_button ${SECONDARY_MICROPHONE_BUTTON_CLASSES}`;
        }
        this.micButton.innerHTML = SVG_MIC_HTML;
        this.micButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleRecording();
        });
    }

    updateButtonGridPosition() {
        const textareaRows = this.textarea.clientHeight / 24;

        if (this.snippetButtons) {
            this.snippetButtons.forEach((buttonObj, index) => {
                buttonObj.y = buttonObj.initialY - (textareaRows - 1) * 1.5;
                buttonObj.button.style.transform = `translate(${buttonObj.x}rem, ${buttonObj.y}rem)`;
            });
        }
    }

    observeTextareaResize() {
        this.resizeObserver = new ResizeObserver(() => {
            this.updateButtonGridPosition();
        });
        this.resizeObserver.observe(this.textarea);
    }

    async downloadEnabled() {
        return await retrieveFromStorage('config_enable_download');
    }

    async translationEnabled() {
        return await retrieveFromStorage('config_enable_translation');
    }

    // async snippetsEnabled() {
    //     return await retrieveFromStorage('config_enable_snippets');
    // }

    async shortcutEnabled() {
        const shortcutEnabled = await retrieveFromStorage('config_enable_shortcut');
        // initialize the shortcut keys if they are not set (first time user)
        const shortcutFirstKey = await retrieveFromStorage('config_shortcut_first_key');
        const shortcutFirstModifier = await retrieveFromStorage('config_shortcut_first_modifier');
        const shortcutSecondModifier = await retrieveFromStorage('config_shortcut_second_modifier');
        if (!shortcutFirstKey && !shortcutFirstModifier && !shortcutSecondModifier) {
            const platform = navigator.userAgentData.platform.toLowerCase();
            if (platform.indexOf('mac') > -1) {
                await chrome.storage?.sync.set(
                    {
                        config_shortcut_first_modifier: 'ctrlKey',
                        config_shortcut_first_key: 'r',
                    },
                    () => {}
                );
            } else if (platform.indexOf('win') > -1) {
                await chrome.storage?.sync.set(
                    {
                        config_shortcut_first_modifier: 'shiftKey',
                        config_shortcut_second_modifier: 'altKey',
                        config_shortcut_first_key: 'r',
                    },
                    () => {}
                );
            }
        }
        return shortcutEnabled;
    }

    async retrieveToken() {
        return await retrieveFromStorage('openai_token');
    }

    async getSelectedPrompt() {
        const selectedPrompt = await retrieveFromStorage('openai_selected_prompt');
        const prompts = await retrieveFromStorage('openai_prompts');
        // if (!prompts) we initialize the prompts (first time user)
        if (!prompts || !selectedPrompt) {
            // backwards compatibility with 1.0 version
            const previousVersionPrompt = await retrieveFromStorage('openai_prompt');

            const initialPrompt = {
                title: 'Initial prompt',
                content: previousVersionPrompt
                    ? previousVersionPrompt
                    : `The transcript is about OpenAI which makes technology like DALL·E, GPT-3, and ChatGPT with the hope of one day building an AGI system that benefits all of humanity.`,
            };
            await chrome.storage?.sync.set(
                {
                    openai_prompts: [initialPrompt],
                    openai_selected_prompt: 0,
                },
                () => {}
            );
            return initialPrompt;
        } else {
            return prompts[selectedPrompt];
        }
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            let chunks = [];
            this.mediaRecorder.addEventListener('dataavailable', (event) => chunks.push(event.data));

            this.mediaRecorder.addEventListener('stop', async () => {
                this.setButtonState('loading');
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                if (await this.downloadEnabled()) {
                    downloadFile(audioBlob);
                }

                const storedToken = await this.retrieveToken();
                const storedPrompt = await this.getSelectedPrompt();
                const headers = new Headers({
                    Authorization: `Bearer ${storedToken}`,
                });
                const formData = new FormData();
                formData.append('file', audioBlob, 'recording.webm');
                formData.append('model', 'whisper-1');
                formData.append('prompt', storedPrompt.content);

                const requestOptions = {
                    method: 'POST',
                    headers,
                    body: formData,
                    redirect: 'follow',
                };

                const requestUrl = (await this.translationEnabled()) ? TRANSLATION_URL : TRANSCRIPTION_URL;

                const response = await fetch(requestUrl, requestOptions);
                this.setButtonState('ready');
                if (response.status === 200) {
                    const result = await response.json();
                    this.insertTextResult(result.text);
                    this.recording = false;
                    stream.getTracks().forEach((track) => track.stop());
                } else {
                    this.insertTextResult(
                        `${response.status} ERROR! API key not provided or OpenAI Server Error! Check the Pop-up window of the Extension to provide API key.`
                    );
                    this.recording = false;
                    stream.getTracks().forEach((track) => track.stop());
                }
            });
            this.mediaRecorder.start();
            this.setButtonState('recording');
            this.recording = true;
        } catch (error) {
            console.error(error);
        }
    }

    stopRecording() {
        this.mediaRecorder.stop();
        this.micButton.innerHTML = SVG_MIC_HTML;
        this.recording = false;
    }

    toggleRecording() {
        if (!this.recording) {
            this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    insertTextResult(resultText) {
        const inputElement = this.textarea;

        // Check if the input element is focused
        const isInputFocused = document.activeElement === inputElement;

        if (isInputFocused) {
            // If focused, insert at cursor position
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);

            // Create a new text node with the result text
            const textNode = document.createTextNode(resultText);

            // Insert the new text node at the current cursor position
            range.insertNode(textNode);

            // Move the cursor to the end of the inserted text
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // If not focused, append to the end
            const lastParagraph = inputElement.querySelector('p:last-child') || inputElement;

            // Create a new text node with the result text
            const textNode = document.createTextNode(resultText);

            // Append the new text node to the last paragraph
            lastParagraph.appendChild(textNode);

            // Move the cursor to the end of the appended text
            const range = document.createRange();
            range.selectNodeContents(lastParagraph);
            range.collapse(false);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }

        // Trigger an input event to notify any listeners
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        inputElement.dispatchEvent(inputEvent);

        // Set focus to the input element
        inputElement.focus();
    }

    setButtonState(state) {
        const hoverClasses = ['hover:bg-gray-100', 'dark:hover:text-gray-400', 'dark:hover:bg-gray-900'];
        switch (state) {
            case 'recording':
                this.micButton.disabled = false;
                this.micButton.innerHTML = SVG_MIC_SPINNING_HTML;
                break;
            case 'loading':
                this.micButton.disabled = true;
                this.micButton.innerHTML = SVG_SPINNER_HTML;
                this.micButton.classList.remove(...hoverClasses);
                break;
            case 'ready':
            default:
                this.micButton.disabled = false;
                this.micButton.innerHTML = SVG_MIC_HTML;
                this.micButton.classList.add(...hoverClasses);
                break;
        }
    }
}

function addMicrophoneButton(inputElement, inputType) {
    try {
        // Check if a microphone button already exists in the parent container
        const parentElement = inputElement.closest('.flex.items-end.gap-1\\.5.pl-4.md\\:gap-2');
        if (parentElement && parentElement.querySelector('.microphone_button')) {
            return; // Button already exists, don't add another one
        }

        const recorder = new AudioRecorder();
        recorder.textarea = inputElement;
        recorder.createMicButton(inputType);

        // Find the send button container
        const sendButtonContainer = parentElement.querySelector('div.min-w-8');

        if (sendButtonContainer) {
            // Insert the microphone button before the send button container
            sendButtonContainer.parentNode.insertBefore(recorder.micButton, sendButtonContainer);
        } else {
            // Fallback: insert before the last child of the parent element
            parentElement.insertBefore(recorder.micButton, parentElement.lastElementChild);
        }
    } catch (error) {
        logError('Failed to add microphone button', error);
    }
}

function observeDOM() {
    try {
        const targetNode = document.body;
        const config = { childList: true, subtree: true };

        const callback = function (mutationsList, observer) {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    const inputElement = document.querySelector('#prompt-textarea');
                    if (inputElement && !inputElement.closest('.flex.items-end.gap-1\\.5.pl-4.md\\:gap-2').querySelector('.microphone_button')) {
                        addMicrophoneButton(inputElement, 'main');
                        const recorder = new AudioRecorder();
                        recorder.textarea = inputElement;
                        recorder.listenForKeyboardShortcut();
                    }
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
    } catch (error) {
        logError('Failed to observe DOM', error);
    }
}

async function init() {
    try {
        if (TESTING) {
            chrome.storage.sync.clear();
        }

        observeDOM();
        document.addEventListener('click', handleClick);

        // Add a log to confirm initialization
        console.log('[Whisper to ChatGPT] Extension initialized successfully');
    } catch (error) {
        logError('Failed to initialize extension', error);
    }
}

function downloadFile(file) {
    // set a fileName containing the current date and time in readable format (e.g. `Recording 24.03.2023 13:00.webm` for German locale, but `Recording 03/24/2023 01:00 PM.webm` for English locale)
    const fileName = `Recording ${new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    })}.webm`;

    // download file
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

async function handleClick(event) {
    const target = event.target;
    const inputType = target.hasAttribute('data-id') ? 'main' : 'secondary';
    if (target.nodeName === 'TEXTAREA' || target.id === 'prompt-textarea') {
        const parentElement = target.closest('.flex.items-end.gap-1\\.5.pl-4.md\\:gap-2');
        if (parentElement && !parentElement.querySelector('.microphone_button')) {
            addMicrophoneButton(target, inputType);
        }
    }
}

init();
