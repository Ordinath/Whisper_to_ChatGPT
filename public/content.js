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
const PRO_MAIN_MICROPHONE_BUTTON_CLASSES =
    'flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:text-[#f4f4f4] disabled:hover:opacity-100 dark:focus-visible:outline-white disabled:dark:bg-token-text-quaternary dark:disabled:text-token-main-surface-secondary bg-black text-white dark:bg-white dark:text-black disabled:bg-[#D7D7D7]';
const NON_PRO_MAIN_MICROPHONE_BUTTON_CLASSES =
    'flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:bg-[#D7D7D7] disabled:text-[#f4f4f4] disabled:hover:opacity-100 dark:bg-white dark:text-black dark:focus-visible:outline-white disabled:dark:bg-token-text-quaternary dark:disabled:text-token-main-surface-secondary';
const SECONDARY_MICROPHONE_BUTTON_CLASSES =
    'flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition-colors hover:opacity-70 focus-visible:outline-none focus-visible:outline-black disabled:bg-[#D7D7D7] disabled:text-[#f4f4f4] disabled:hover:opacity-100 dark:bg-white dark:text-black dark:focus-visible:outline-white disabled:dark:bg-token-text-quaternary dark:disabled:text-token-main-surface-secondary';

const TESTING = false;

const USAGE_COUNT_KEY = 'whisper_usage_count';
const POPUP_THRESHOLD = 5;
const POPUP_FREQUENCY = 10;
const POPUP_DISMISSED_KEY = 'whisper_popup_dismissed';
const POPUP_LAST_SHOWN_KEY = 'whisper_popup_last_shown';

const getPopupHtml = (firstTime = false) => {
    return `
    <div class="whisper-popup min-w-fit left-full top-0 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-1 mx-2 dark:border-gray-600 dark:bg-[#202123]">
        <div class="flex flex-col text-xs leading-3">
            <span class="text-gray-600 dark:text-gray-400">Find <b>Whisper to ChatGPT</b> useful? Consider our <a href="https://sonascript.com/?coupon=THANKUWHISPER" target="_blank" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"><b>desktop app</b></a></span>
            <span class="text-gray-600 dark:text-gray-400">and get 1 free month with promo code: <b>THANKUWHISPER</b></span>
        </div>
        <div class="ml-auto flex items-center gap-2 border-l border-gray-200 pl-2 dark:border-gray-600 min-w-fit">
            ${
                firstTime
                    ? ''
                    : `
            <div class="flex items-center gap-2">
                <input id="whisper-dont-show" type="checkbox" value="" class="w-3 h-3 rounded">
                <div class="flex flex-col text-xs leading-3">
                    <span class="text-gray-600 dark:text-gray-400">Don't</span>
                    <span class="text-gray-600 dark:text-gray-400">show</span>
                </div>
            </div>
            `
            }
            <button class="whisper-popup-close text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    </div>
`;
};

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
        this.popupContainer = null;
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
                        const proMicButton = promptTextarea.closest('.group.relative.flex.w-full.items-center')?.querySelector('.microphone_button');
                        const nonProMicButton = promptTextarea.closest('.flex.items-end.gap-1\\.5.md\\:gap-2')?.querySelector('.microphone_button');

                        if (proMicButton) {
                            proMicButton.click();
                        } else if (nonProMicButton) {
                            nonProMicButton.click();
                        }
                    }
                }
            });
        }
    }

    createMicButton(inputType, version) {
        this.micButton = document.createElement('button');
        if (inputType === 'main') {
            this.micButton.className = `microphone_button ${version === 'PRO' ? PRO_MAIN_MICROPHONE_BUTTON_CLASSES : NON_PRO_MAIN_MICROPHONE_BUTTON_CLASSES}`;
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

    async incrementUsageCount() {
        // console.log('incrementUsageCount');
        const currentCount = (await retrieveFromStorage(USAGE_COUNT_KEY)) || 0;
        const newCount = currentCount + 1;
        await chrome.storage.sync.set({ [USAGE_COUNT_KEY]: newCount });

        const dismissed = await retrieveFromStorage(POPUP_DISMISSED_KEY);
        const lastShown = (await retrieveFromStorage(POPUP_LAST_SHOWN_KEY)) || 0;

        if (!dismissed) {
            // Show popup for first time users at threshold
            if (newCount >= POPUP_THRESHOLD && lastShown === 0) {
                this.showPopup(true);
                await chrome.storage.sync.set({ [POPUP_LAST_SHOWN_KEY]: newCount });
            }
            // After threshold, show popup every POPUP_FREQUENCY uses
            else if (newCount >= POPUP_THRESHOLD && newCount - lastShown >= POPUP_FREQUENCY) {
                this.showPopup(false);
                await chrome.storage.sync.set({ [POPUP_LAST_SHOWN_KEY]: newCount });
            }
        }
    }

    showPopup(firstTime = false) {
        // console.log('showPopup');
        const existingPopup = document.querySelector('.whisper-popup');
        if (existingPopup) return;

        const popupElement = document.createElement('div');
        popupElement.innerHTML = getPopupHtml(firstTime);
        const popup = popupElement.firstElementChild;

        if (this.popupContainer) {
            this.popupContainer.appendChild(popup);
        }

        popup.querySelector('.whisper-popup-close').addEventListener('click', async () => {
            popup.remove();
            // Update last shown count when popup is manually closed
            const currentCount = (await retrieveFromStorage(USAGE_COUNT_KEY)) || 0;
            await chrome.storage.sync.set({ [POPUP_LAST_SHOWN_KEY]: currentCount });
        });

        popup.querySelector('#whisper-dont-show')?.addEventListener('change', async (e) => {
            if (e.target.checked) {
                await chrome.storage.sync.set({ [POPUP_DISMISSED_KEY]: true });
            } else {
                await chrome.storage.sync.set({ [POPUP_DISMISSED_KEY]: false });
            }
        });
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

                try {
                    const response = await fetch(requestUrl, requestOptions);
                    this.setButtonState('ready');
                    if (response.status === 200) {
                        const result = await response.json();
                        this.insertTextResult(result.text);
                    } else {
                        const errorMessage = getErrorMessage(response.status);
                        this.insertTextResult(errorMessage);
                    }
                } catch (error) {
                    this.insertTextResult("Network error! Please check your internet connection and try again.");
                } finally {
                    this.recording = false;
                    stream.getTracks().forEach((track) => track.stop());
                }

                await this.incrementUsageCount();
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

// First, let's create a singleton recorder instance
let globalRecorder = null;

function addMicrophoneButton(inputElement, inputType) {
    try {
        let parentElement = inputElement.closest('.group.relative.flex.w-full.items-center');

        // let buttonContainer = parentElement?.querySelector('.flex.h-\\[44px\\].items-center.justify-between');
        // let buttonContainer = parentElement?.querySelector('.flex.gap-x-1');
        let buttonContainer = parentElement?.querySelectorAll('.flex[class*="gap-x-1.5"]')[1];

        // Create or reuse the global recorder
        if (!globalRecorder) {
            globalRecorder = new AudioRecorder();
            globalRecorder.textarea = inputElement;
            globalRecorder.listenForKeyboardShortcut();
        } else {
            globalRecorder.textarea = inputElement;
        }

        if (buttonContainer) {
            if (buttonContainer.querySelector('.microphone_button')) {
                return;
            }

            globalRecorder.createMicButton(inputType, 'NON-PRO');

            const spacerDiv = document.createElement('div');
            spacerDiv.className = 'min-w-fit w-full';

            buttonContainer.parentNode.insertBefore(spacerDiv, buttonContainer.parentNode.lastChild);

            globalRecorder.popupContainer = spacerDiv;

            const micContainer = document.createElement('div');
            micContainer.className = 'min-w-9';
            micContainer.appendChild(globalRecorder.micButton);

            buttonContainer.insertBefore(micContainer, buttonContainer.firstChild);
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
                    if (inputElement) {
                        const parentElement = inputElement.closest('.group.relative.flex.w-full.items-center');
                        if (parentElement && !parentElement.querySelector('.microphone_button')) {
                            addMicrophoneButton(inputElement, 'main');
                        }
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
        // Try both layouts
        const proParent = target.closest('.group.relative.flex.w-full.items-center');
        const nonProParent = target.closest('.flex.items-end.gap-1\\.5.pl-4.md\\:gap-2');
        const parent = proParent || nonProParent;

        if (parent && !parent?.querySelector('.microphone_button')) {
            addMicrophoneButton(target, inputType);
        }
    }
}

const getErrorMessage = (status) => {
    switch (status) {
        case 401:
            return "Authentication error! Please check if your OpenAI API key is valid in the extension settings.";
        case 429:
            return "Too many requests to OpenAI server. Please wait a moment and try again.";
        case 400:
            return "Bad request! The audio file may be too large or in an unsupported format.";
        case 500:
            return "OpenAI server error. Please try again later.";
        case 503:
            return "OpenAI service is temporarily unavailable. Please try again later.";
        default:
            return `Error ${status}: Unable to process audio. Please check your API key or try again later.`;
    }
};

init();
