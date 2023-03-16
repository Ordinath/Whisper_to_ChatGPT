const SVG_MIC_HTML =
    '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 512 512" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-1" height="1.2em" width="1.2em" style="margin-left:0.2em;" xmlns="http://www.w3.org/2000/svg"> <line x1="192" y1="448" x2="320" y2="448" style="fill:none;stroke:#8e8ea0;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px"></line> <path d="M384,208v32c0,70.4-57.6,128-128,128h0c-70.4,0-128-57.6-128-128V208" style="fill:none;stroke:#8e8ea0;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px"></path> <line x1="256" y1="368" x2="256" y2="448" style="fill:none;stroke:#8e8ea0;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px"></line> <path d="M256,320a78.83,78.83,0,0,1-56.55-24.1A80.89,80.89,0,0,1,176,239V128a79.69,79.69,0,0,1,80-80c44.86,0,80,35.14,80,80V239C336,283.66,300.11,320,256,320Z" style="fill:none;stroke:#8e8ea0;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px"></path></svg>';
const SVG_MIC_SPINNING_HTML =
    '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 512 512" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 mr-1" height="1.2em" width="1.2em" style="margin-left:0.2em;" xmlns="http://www.w3.org/2000/svg"><style>.spinnerMic{transform-origin:center;animation:spinner_svv2 .75s infinite linear}@keyframes spinner_svv2{100%{transform:rotate(360deg)}}</style><line x1="192" y1="448" x2="320" y2="448" style="fill:none;stroke:#8e8ea0;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px" class="spinnerMic"></line> <path d="M384,208v32c0,70.4-57.6,128-128,128h0c-70.4,0-128-57.6-128-128V208" style="fill:none;stroke:#8e8ea0;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px" class="spinnerMic"></path> <line x1="256" y1="368" x2="256" y2="448" style="fill:none;stroke:#8e8ea0;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px" class="spinnerMic"></line> <path d="M256,320a78.83,78.83,0,0,1-56.55-24.1A80.89,80.89,0,0,1,176,239V128a79.69,79.69,0,0,1,80-80c44.86,0,80,35.14,80,80V239C336,283.66,300.11,320,256,320Z" style="fill:none;stroke:#8e8ea0;stroke-linecap:square;stroke-miterlimit:10;stroke-width:48px" class="spinnerMic"></path></svg>';
const SVG_SPINNER_HTML =
    '<div style="position:relative;width:24px;height:16px;"> <svg viewBox="0 0 24 24" style="position:absolute;top:0;left:0;width:100%;height:100%;"> <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" stroke-dasharray="15 85" transform="rotate(0)"> <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 12 12" to="360 12 12" dur="0.75s" repeatCount="indefinite"/> </circle> </svg></div>';
const TRANSCRIPTION_URL = 'https://api.openai.com/v1/audio/transcriptions';
const TRANSCRIPTION_PROMPT =
    'The transcript is about OpenAI which makes technology like DALL·E, GPT-3, and ChatGPT with the hope of one day building an AGI system that benefits all of humanity.';
const MICROPHONE_BUTTON_CLASSES =
    'absolute p-1 rounded-md text-gray-500 bottom-1.5 right-1 md:bottom-2.5 md:right-2 hover:bg-gray-100 dark:hover:text-gray-400 dark:hover:bg-gray-900';

async function retrieveFromStorage(key) {
    return new Promise((resolve) => {
        chrome.storage.sync.get(key, function (result) {
            resolve(result[key]);
        });
    });
}

async function storeInStorage(key, value) {
    chrome.storage.sync.set({ [key]: value }, function () {
        console.log('Value stored:', value);
    });
}

class AudioRecorder {
    constructor() {
        this.recording = false;
        this.mediaRecorder = null;
        this.textarea = null;
        this.micButton = null;
        this.token = null;
    }

    createMicButton() {
        this.micButton = document.createElement('button');
        this.micButton.className = `microphone_button ${MICROPHONE_BUTTON_CLASSES}`;
        this.micButton.style.marginRight = '2.2rem';
        this.micButton.innerHTML = SVG_MIC_HTML;
        this.micButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleRecording();
        });
    }

    async retrieveToken() {
        return await retrieveFromStorage('openai_token');
    }

    async storePrompt(prompt) {
        await storeInStorage('openai_prompt', prompt);
    }

    async retrievePrompt() {
        return await retrieveFromStorage('openai_prompt');
    }

    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            let chunks = [];
            this.mediaRecorder.addEventListener('dataavailable', (event) => chunks.push(event.data));

            this.mediaRecorder.addEventListener('stop', async () => {
                this.setButtonState('loading');
                console.log('recording stop');
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });

                const file = audioBlob;

                const storedToken = await this.retrieveToken();
                let storedPrompt = await this.retrievePrompt();
                if (!storedPrompt) {
                    storedPrompt = TRANSCRIPTION_PROMPT;
                    await this.storePrompt(storedPrompt);
                }

                const headers = new Headers({
                    Authorization: `Bearer ${storedToken}`,
                });
                const formData = new FormData();
                formData.append('file', file, 'recording.webm');
                formData.append('model', 'whisper-1');
                formData.append('prompt', storedPrompt);

                const requestOptions = {
                    method: 'POST',
                    headers,
                    body: formData,
                    redirect: 'follow',
                };

                // try {
                const response = await fetch(TRANSCRIPTION_URL, requestOptions);
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
            case 'ready':
                this.micButton.disabled = false;
                this.micButton.innerHTML = SVG_MIC_HTML;
                this.micButton.classList.add(...hoverClasses);
                break;
            case 'recording':
                this.micButton.disabled = false;
                this.micButton.innerHTML = SVG_MIC_SPINNING_HTML;
                break;
            case 'loading':
                this.micButton.disabled = true;
                this.micButton.innerHTML = SVG_SPINNER_HTML;
                this.micButton.classList.remove(...hoverClasses);
                break;
        }
    }
}

async function init() {
    const textareas = document.querySelectorAll('textarea');

    textareas.forEach((textarea) => {
        const recorder = new AudioRecorder();
        if (!textarea.parentNode.querySelector('.microphone_button')) {
            recorder.textarea = textarea;
            recorder.createMicButton();
            textarea.parentNode.insertBefore(recorder.micButton, textarea.nextSibling);
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
function handleMutations(mutations) {
    mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
            if (node.tagName === 'TEXTAREA') {
                if (!node.parentNode.querySelector('.microphone_button')) {
                    const recorder = new AudioRecorder();
                    recorder.textarea = node;
                    console.log('TEXTAREA addedNodes');
                    recorder.createMicButton();
                    node.parentNode.insertBefore(recorder.micButton, node.nextSibling);
                }
            }
        });
    });
}

function handleClick(event) {
    const target = event.target;
    if (target.nodeName === 'TEXTAREA' && !target.parentNode.querySelector('.microphone_button')) {
        const recorder = new AudioRecorder();
        recorder.textarea = target;
        recorder.createMicButton();
        target.parentNode.insertBefore(recorder.micButton, target.nextSibling);
    }
}

init();
