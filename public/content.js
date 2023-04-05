/* global chrome */
const SVG_MIC_HTML =
    '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 512 512" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-1" height="1.2em" width="1.2em" style="margin-left:0.2em;" xmlns="http://www.w3.org/2000/svg"> <line x1="192" y1="448" x2="320" y2="448" style="fill:none;stroke:#8e8ea0;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px"></line> <path d="M384,208v32c0,70.4-57.6,128-128,128h0c-70.4,0-128-57.6-128-128V208" style="fill:none;stroke:#8e8ea0;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px"></path> <line x1="256" y1="368" x2="256" y2="448" style="fill:none;stroke:#8e8ea0;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px"></line> <path d="M256,320a78.83,78.83,0,0,1-56.55-24.1A80.89,80.89,0,0,1,176,239V128a79.69,79.69,0,0,1,80-80c44.86,0,80,35.14,80,80V239C336,283.66,300.11,320,256,320Z" style="fill:none;stroke:#8e8ea0;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px"></path></svg>';
const SVG_MIC_SPINNING_HTML =
    '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 512 512" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-1" height="1.2em" width="1.2em" style="margin-left:0.2em;" xmlns="http://www.w3.org/2000/svg"><style>.spinnerMic{transform-origin:center;animation:spinner_svv2 .75s infinite linear}@keyframes spinner_svv2{100%{transform:rotate(360deg)}}</style><line x1="192" y1="448" x2="320" y2="448" style="fill:none;stroke:#8e8ea0;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px" class="spinnerMic"></line> <path d="M384,208v32c0,70.4-57.6,128-128,128h0c-70.4,0-128-57.6-128-128V208" style="fill:none;stroke:#8e8ea0;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px" class="spinnerMic"></path> <line x1="256" y1="368" x2="256" y2="448" style="fill:none;stroke:#8e8ea0;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px" class="spinnerMic"></line> <path d="M256,320a78.83,78.83,0,0,1-56.55-24.1A80.89,80.89,0,0,1,176,239V128a79.69,79.69,0,0,1,80-80c44.86,0,80,35.14,80,80V239C336,283.66,300.11,320,256,320Z" style="fill:none;stroke:#8e8ea0;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px" class="spinnerMic"></path></svg>';
const SVG_SPINNER_HTML =
    '<div style="position:relative;width:24px;height:16px;"> <svg viewBox="0 0 24 24" style="position:absolute;top:0;left:0;width:100%;height:100%;"> <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="15 85" transform="rotate(0)"> <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 12 12" to="360 12 12" dur="0.75s" repeatCount="indefinite"/> </circle> </svg></div>';
// const SVG_MIC_HTML = "<svg>{irrelevant}</svg>";
// const SVG_MIC_SPINNING_HTML = "<svg>{irrelevant}</svg>";
// const SVG_SPINNER_HTML = "<svg>{irrelevant}</svg>";
const TRANSCRIPTION_URL = 'https://api.openai.com/v1/audio/transcriptions';
const TRANSLATION_URL = 'https://api.openai.com/v1/audio/translations';
const MICROPHONE_BUTTON_CLASSES =
    'absolute p-1 rounded-md text-gray-500 bottom-1.5 right-1 md:bottom-2.5 md:right-2 hover:bg-gray-100 dark:hover:text-gray-400 dark:hover:bg-gray-900';

const TESTING = false;

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
            // console.log({ shortcutFirstKey, shortcutFirstModifier, shortcutSecondModifier });
            document.addEventListener('keydown', (event) => {
                if (event.code === `Key${shortcutFirstKey.toUpperCase()}`) {
                    if (shortcutFirstModifier && shortcutFirstModifier !== 'none' && !event[shortcutFirstModifier]) return;
                    if (shortcutSecondModifier && shortcutSecondModifier !== 'none' && !event[shortcutSecondModifier]) return;

                    event.preventDefault();

                    // const firstModLogStr = shortcutFirstModifier && shortcutFirstModifier !== 'none' ? `${shortcutFirstModifier}+` : '';
                    // const secondModLogStr = shortcutSecondModifier && shortcutSecondModifier !== 'none' ? `${shortcutSecondModifier}+` : '';
                    // console.log(`shortcut ${firstModLogStr}${secondModLogStr}${shortcutFirstKey} pressed`);

                    // recognize the main textarea button by the textarea having the data-id attribute and the sibling microphone button
                    const textarea = document.querySelector('textarea[data-id]');
                    if (textarea) {
                        const micButton = textarea.parentNode.querySelector('.microphone_button');
                        if (micButton) {
                            micButton.click();
                        }
                    }
                }
            });
        }
    }

    createMicButton(inputType) { // 'main' : 'secondary'
        this.micButton = document.createElement('button');
        this.micButton.className = `microphone_button ${MICROPHONE_BUTTON_CLASSES}`;
        this.micButton.style.marginRight = inputType === 'main' ? '2.2rem' : '26.5rem';
        this.micButton.innerHTML = SVG_MIC_HTML;
        this.micButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleRecording();
        });
    }

    async createSnippetButtons() {
        const snippets = await retrieveFromStorage('snippets');
        if (!snippets) return;

        const numberOfRows = Math.ceil(snippets.length / 9);
        // console.log(numberOfRows);
        snippets.forEach((snippet, index) => {
            if (!snippet) return;
            const button = document.createElement('button');
            button.textContent = index + 1;
            button.className = `snippet_button ${MICROPHONE_BUTTON_CLASSES}`;

            // we want to position the buttons in a grid
            // the grid is 9 columns wide and as many rows as needed
            const y = -0.6 - numberOfRows * 2.2 + Math.floor(index / 9) * 2.2;
            const x = -45.7 + (index % 9) * 2;
            button.style.transform = `translate(${x}rem, ${y}rem)`;

            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.insertTextResult(snippet);
            });
            this.textarea.parentNode.insertBefore(button, this.textarea.nextSibling);
            this.snippetButtons.push({ button, x, y, initialY: y });
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
            // console.log('Textarea resized'); // Added console log
            this.updateButtonGridPosition();
        });
        this.resizeObserver.observe(this.textarea);
    }

    async downloadEnabled() {
        const downloadEnabled = await retrieveFromStorage('config_enable_download');
        // console.log('downloadEnabled', downloadEnabled);
        return downloadEnabled;
    }

    async translationEnabled() {
        const translationEnabled = await retrieveFromStorage('config_enable_translation');
        // console.log('translationEnabled', translationEnabled);
        return translationEnabled;
    }

    async snippetsEnabled() {
        const snippetsEnabled = await retrieveFromStorage('config_enable_snippets');
        // console.log('snippetsEnabled', snippetsEnabled);
        return snippetsEnabled;
    }

    async shortcutEnabled() {
        const shortcutEnabled = await retrieveFromStorage('config_enable_shortcut');
        // initialize the shortcut keys if they are not set (first time user)
        const shortcutFirstKey = await retrieveFromStorage('config_shortcut_first_key');
        const shortcutFirstModifier = await retrieveFromStorage('config_shortcut_first_modifier');
        const shortcutSecondModifier = await retrieveFromStorage('config_shortcut_second_modifier');
        if (!shortcutFirstKey && !shortcutFirstModifier && !shortcutSecondModifier) {
            if (navigator.userAgentData.platform.toLowerCase().indexOf('mac') > -1) {
                await chrome.storage?.sync.set(
                    {
                        config_shortcut_first_modifier: 'ctrlKey',
                        config_shortcut_first_key: 'r',
                    },
                    () => {
                        // console.log('Config stored');
                    }
                );
            } else if (navigator.userAgentData.platform.toLowerCase().indexOf('win') > -1) {
                await chrome.storage?.sync.set(
                    {
                        config_shortcut_first_modifier: 'shiftKey',
                        config_shortcut_second_modifier: 'altKey',
                        config_shortcut_first_key: 'r',
                    },
                    () => {
                        // console.log('Config stored');
                    }
                );
            }
        }

        // console.log('shortcutEnabled', shortcutEnabled);
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
                () => {
                    // console.log('Config stored');
                }
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
                // console.log('recording stop');
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });

                const file = audioBlob;

                if (await this.downloadEnabled()) {
                    downloadFile(file);
                }

                const storedToken = await this.retrieveToken();
                const storedPrompt = await this.getSelectedPrompt();
                // console.log('storedPrompt', storedPrompt);

                const headers = new Headers({
                    Authorization: `Bearer ${storedToken}`,
                });
                const formData = new FormData();
                formData.append('file', file, 'recording.webm');
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
                    const resultText = result.text;
                    console.log(resultText);

                    this.insertTextResult(resultText);
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
        const startPos = this.textarea.selectionStart;
        const endPos = this.textarea.selectionEnd;
        const newText = this.textarea.value.substring(0, startPos) + resultText + this.textarea.value.substring(endPos);
        this.textarea.value = newText;
        this.textarea.selectionStart = startPos + resultText.length;
        this.textarea.selectionEnd = this.textarea.selectionStart;
        this.textarea.dispatchEvent(new Event('input', { bubbles: true }));
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

async function init() {
    if (TESTING) {
        chrome.storage.sync.clear();
    }

    const textareas = document.querySelectorAll('textarea');

    textareas.forEach(async (textarea) => {
        const recorder = new AudioRecorder();
        await recorder.listenForKeyboardShortcut();
        if (!textarea.parentNode.querySelector('.microphone_button')) {
            recorder.textarea = textarea;
            recorder.createMicButton('main');
            textarea.parentNode.insertBefore(recorder.micButton, textarea.nextSibling);
            if (await recorder.snippetsEnabled()) {
                await recorder.createSnippetButtons();
                recorder.observeTextareaResize();
            }
        }
    });

    // Add microphone button to textareas added later
    const observer = new MutationObserver(handleMutations);

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    document.addEventListener('click', handleClick);
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

let previousPathname = '';
// make the mic adding process seamless with a crutch
let timeout1Id = null;
let timeout2Id = null;
let timeout3Id = null;

function addMicButtonToTextareas() {
    const textareas = document.querySelectorAll('textarea[data-id]');

    textareas.forEach((textarea) => {
        if (!textarea.parentNode.querySelector('.microphone_button')) {
            const recorder = new AudioRecorder();
            recorder.textarea = textarea;
            recorder.createMicButton('main');
            textarea.parentNode.insertBefore(recorder.micButton, textarea.nextSibling);
        }
    });
}

function handleMutations(mutations) {
    mutations.forEach((mutation) => {
        // console.log(mutation);
        // console.log(window.location.pathname);
        if (previousPathname !== window.location.pathname) {
            // console.log('path changed');
            previousPathname = window.location.pathname;

            addMicButtonToTextareas();
            // backup crutch
            if (timeout1Id) clearTimeout(timeout1Id);
            if (timeout2Id) clearTimeout(timeout2Id);
            if (timeout3Id) clearTimeout(timeout3Id);
            timeout1Id = setTimeout(() => {
                addMicButtonToTextareas();
            }, 333);
            timeout2Id = setTimeout(() => {
                addMicButtonToTextareas();
            }, 666);
            timeout3Id = setTimeout(() => {
                addMicButtonToTextareas();
            }, 1000);
        }
    });
}

async function handleClick(event) {
    const target = event.target;
    if (target.nodeName === 'TEXTAREA' && !target.parentNode.querySelector('.microphone_button')) {
        const recorder = new AudioRecorder();
        recorder.textarea = target;

        const inputType = target.hasAttribute('data-id') ? 'main' : 'secondary';
        recorder.createMicButton(inputType);
        target.parentNode.insertBefore(recorder.micButton, target.nextSibling);
        if (await recorder.snippetsEnabled()) {
            await recorder.createSnippetButtons();
            recorder.observeTextareaResize();
        }
    }
}

init();
