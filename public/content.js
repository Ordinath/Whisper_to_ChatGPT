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
const POPUP_CLOSE_COUNT_KEY = 'whisper_popup_close_count';
const POPUP_MIN_CLOSES_FOR_DONT_SHOW = 2;

const getPopupHtml = (showDontShowOption = false) => {
    if (showDontShowOption) {
        return `
        <div class="inline-flex h-9 rounded-full border text-[13px] font-medium text-token-text-secondary border-token-border-light dark:border-token-border-light flex items-center justify-center gap-1 bg-token-main-surface-secondary dark:bg-gray-700" style="transform: translateY(-2px);">
            <div class="flex items-center gap-2 pl-2">
                <input type="checkbox" id="whisper-dont-show" class="rounded border-gray-300">
                <label for="whisper-dont-show" class="text-token-text-secondary">Don't show this message again</label>
            </div>
            <button type="button" class="whisper-popup-close ml-1 text-token-text-secondary hover:text-token-text-primary flex items-center justify-center h-5 w-5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>`;
    }

    return `
    <div class="inline-flex h-9 rounded-full border text-[13px] font-medium text-token-text-secondary border-token-border-light dark:border-token-border-light flex items-center justify-center gap-1 bg-token-main-surface-secondary dark:bg-gray-700" style="transform: translateY(-2px);">
        <div class="flex flex-col items-start leading-tight pl-2">
            <div class="text-token-text-secondary">
                Enjoying Whisper To ChatGPT?
            </div>
            <div class="flex items-center gap-1 text-token-text-secondary">
                Try our <a href="https://sonascript.com/?coupon=THANKUWHISPER#pricing" target="_blank" class="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium">Desktop App</a> and dictate anywhere!
            </div>
        </div>
        <button type="button" class="whisper-popup-close ml-1 text-token-text-secondary hover:text-token-text-primary flex items-center justify-center h-5 w-5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    </div>`;
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
        this.activePopup = null;
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

                    // Find our microphone button based on the new UI structure
                    const micButton = document.querySelector('.microphone_button');
                    if (micButton) {
                        micButton.click();
                    } else {
                        // If our button doesn't exist yet, try to find the input and add it
                        const promptTextarea = document.querySelector('div[contenteditable="true"][id="prompt-textarea"]');
                        if (promptTextarea) {
                            addMicrophoneButton(promptTextarea, 'main');
                            // Give a small delay to ensure the button is added
                            setTimeout(() => {
                                const newMicButton = document.querySelector('.microphone_button');
                                if (newMicButton) {
                                    newMicButton.click();
                                }
                            }, 100);
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

    async showPopup(firstTime = false) {
        // If there's already an active popup, don't show another one
        if (this.activePopup && document.contains(this.activePopup)) {
            return;
        }

        // Get the close count
        const closeCount = (await retrieveFromStorage(POPUP_CLOSE_COUNT_KEY)) || 0;

        const popupElement = document.createElement('div');
        popupElement.className = 'whisper-popup';

        // If we've closed it 3 times and this is after closing the promo message
        const showDontShowOption = closeCount > 0 && closeCount % POPUP_MIN_CLOSES_FOR_DONT_SHOW === 0;
        popupElement.innerHTML = getPopupHtml(showDontShowOption);
        const popup = popupElement.firstElementChild;

        if (this.popupContainer) {
            this.popupContainer.appendChild(popup);
            this.activePopup = popup; // Store reference to the active popup
        }

        // Handle popup close and checkbox
        const closeButton = popup.querySelector('.whisper-popup-close');
        if (closeButton) {
            closeButton.addEventListener('click', async (e) => {
                // Prevent event propagation
                e.preventDefault();
                e.stopPropagation();

                if (showDontShowOption) {
                    // If this is the "don't show again" popup, check if the checkbox is checked
                    const checkbox = popup.querySelector('#whisper-dont-show');
                    if (checkbox && checkbox.checked) {
                        await chrome.storage.sync.set({ [POPUP_DISMISSED_KEY]: true });
                    }
                    // Reset close count after showing "don't show again" option
                    await chrome.storage.sync.set({ [POPUP_CLOSE_COUNT_KEY]: 0 });
                } else {
                    // Increment and store close count
                    const newCloseCount = closeCount + 1;
                    await chrome.storage.sync.set({ [POPUP_CLOSE_COUNT_KEY]: newCloseCount });

                    // If we've just hit the threshold, show the "don't show again" popup
                    if (newCloseCount % POPUP_MIN_CLOSES_FOR_DONT_SHOW === 0) {
                        this.activePopup = null; // Clear the active popup reference
                        popup.remove();
                        this.showPopup(false); // Show the "don't show again" popup
                        return;
                    }
                }

                // Update last shown count and remove popup
                const currentCount = (await retrieveFromStorage(USAGE_COUNT_KEY)) || 0;
                await chrome.storage.sync.set({ [POPUP_LAST_SHOWN_KEY]: currentCount });
                this.activePopup = null; // Clear the active popup reference
                popup.remove();
            });
        }

        // Add cleanup when popup is removed from DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.removedNodes.forEach((node) => {
                    if (node === popup) {
                        this.activePopup = null;
                        observer.disconnect();
                    }
                });
            });
        });

        if (popup.parentNode) {
            observer.observe(popup.parentNode, { childList: true });
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
                    this.insertTextResult('Network error! Please check your internet connection and try again.');
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

        // If this is a contenteditable div rather than a textarea
        if (inputElement.isContentEditable) {
            // Set focus to the input element
            inputElement.focus();

            // Insert text at current cursor position or at the end
            const selection = window.getSelection();
            const range = selection.getRangeAt(0);

            // Create a text node with the result
            const textNode = document.createTextNode(resultText);

            // Insert the text node
            range.insertNode(textNode);

            // Move cursor to end of inserted text
            range.setStartAfter(textNode);
            range.setEndAfter(textNode);
            selection.removeAllRanges();
            selection.addRange(range);

            // Trigger an input event to notify ChatGPT that content has changed
            const inputEvent = new Event('input', { bubbles: true, cancelable: true });
            inputElement.dispatchEvent(inputEvent);
        } else {
            // Original logic for standard textareas
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
        // Check if button already exists
        if (document.querySelector('.microphone_button')) {
            return;
        }

        // Find the parent container
        const parentContainer = inputElement.closest('.relative.flex.w-full.items-end');
        if (!parentContainer) return;

        // Find the new buttons area
        const buttonsArea = parentContainer.querySelector('.absolute.end-3.bottom-0 .ms-auto.flex.items-center.gap-1\\.5');
        if (!buttonsArea) {
             // console.log("Buttons area not found for updated popup fix.");
            return;
        }

        // Create or reuse the global recorder
        if (!globalRecorder) {
            globalRecorder = new AudioRecorder();
            globalRecorder.textarea = inputElement;
            globalRecorder.listenForKeyboardShortcut();
        } else {
            globalRecorder.textarea = inputElement;
        }

        // Create the microphone button
        globalRecorder.createMicButton(inputType, 'NON-PRO');

        // Create the wrapper for the mic button and popup
        const micWrapper = document.createElement('div');
        // Make it relative for positioning context, inline-block to fit in flex layout
        micWrapper.className = 'relative';
        micWrapper.style.display = 'inline-block'; // Ensure it behaves well within the flex container

        // Create container for popup messages, positioned absolutely using inline styles
        const popupContainer = document.createElement('div');
        popupContainer.className = 'whitespace-nowrap z-10'; // Keep necessary utility classes
        popupContainer.style.position = 'absolute';
        popupContainer.style.bottom = '0';     // Align bottom edge with micWrapper's bottom edge
        popupContainer.style.right = '100%';   // Place right edge coincident with micWrapper's left edge
        popupContainer.style.marginRight = '0.5rem'; // Add 8px margin to push it left (gap)

        // Create the container for just the mic button
        const micContainer = document.createElement('div');
        micContainer.className = 'min-w-9'; // Keep consistent size
        micContainer.appendChild(globalRecorder.micButton);

        // Append popup and mic containers to the wrapper
        micWrapper.appendChild(popupContainer);
        micWrapper.appendChild(micContainer);

        // Insert the complete wrapper into the buttons area
        buttonsArea.insertBefore(micWrapper, buttonsArea.firstChild);
        globalRecorder.popupContainer = popupContainer; // Assign the correct container

        // Ensure proper width of text area containers
        const textareaContainer = inputElement.closest('.max-w-full.min-w-0.flex-1');
        if (textareaContainer) {
            textareaContainer.style.width = '100%';
            textareaContainer.style.maxWidth = '100%';
        }
    } catch (error) {
        console.log('[Whisper to ChatGPT] Non-critical error in button addition:', error);
    }
}

function observeDOM() {
    try {
        const targetNode = document.body;
        const config = { childList: true, subtree: true };

        const callback = function (mutationsList, observer) {
            try {
                // Check if our button exists
                if (!document.querySelector('.microphone_button')) {
                    // Look for the contenteditable div with id="prompt-textarea"
                    const inputElement = document.querySelector('div[contenteditable="true"][id="prompt-textarea"]');
                    if (inputElement) {
                        // Try to find the button container using the updated selector path
                        const parentContainer = inputElement.closest('.relative.flex.w-full.items-end');
                        if (parentContainer) {
                             const buttonContainer = parentContainer.querySelector('.absolute.end-3.bottom-0 .ms-auto.flex.items-center.gap-1\\.5');
                            if (buttonContainer) {
                                addMicrophoneButton(inputElement, 'main');
                            }
                        }
                    }
                }
            } catch (innerError) {
                console.log('[Whisper to ChatGPT] Non-critical error in observer:', innerError);
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(targetNode, config);

        // Initial check for the input element
        const inputElement = document.querySelector('div[contenteditable="true"][id="prompt-textarea"]');
        if (inputElement && !document.querySelector('.microphone_button')) {
             try {
                const parentContainer = inputElement.closest('.relative.flex.w-full.items-end');
                if (parentContainer) {
                    const buttonContainer = parentContainer.querySelector('.absolute.end-3.bottom-0 .ms-auto.flex.items-center.gap-1\\.5');
                    if (buttonContainer) {
                        addMicrophoneButton(inputElement, 'main');
                    }
                }
            } catch (error) {
                console.log('[Whisper to ChatGPT] Non-critical error in initial check:', error);
            }
        }
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
    if (target.id === 'prompt-textarea' || (target.contentEditable === 'true' && target.id === 'prompt-textarea')) {
        if (!document.querySelector('.microphone_button')) {
            addMicrophoneButton(target, 'main');
        }
    }
}

const getErrorMessage = (status) => {
    switch (status) {
        case 401:
            return 'Authentication error! Please check if your OpenAI API key is valid in the extension settings.';
        case 429:
            return 'Too many requests to OpenAI server. Please wait a moment and try again.';
        case 400:
            return 'Bad request! The audio file may be too large or in an unsupported format.';
        case 500:
            return 'OpenAI server error. Please try again later.';
        case 503:
            return 'OpenAI service is temporarily unavailable. Please try again later.';
        default:
            return `Error ${status}: Unable to process audio. Please check your API key or try again later.`;
    }
};

init();
