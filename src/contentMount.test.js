import fs from 'fs';
import path from 'path';

const settleMounting = async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
};

test('keeps one Whisper control mounted across ChatGPT composer replacements', async () => {
    document.body.innerHTML = `
        <form data-type="unified-composer" id="composer-one">
            <div role="textbox" contenteditable="true" class="ProseMirror" data-editor="one"></div>
            <div class="actions">
                <div>
                    <button type="button" aria-label="Dictate">Dictate</button>
                </div>
                <div>
                    <button type="button" aria-label="Start Voice">Voice</button>
                </div>
            </div>
        </form>
    `;

    Object.defineProperty(HTMLElement.prototype, 'getClientRects', {
        configurable: true,
        value: () => [{ width: 100, height: 36 }],
    });
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
            x: 0,
            y: 0,
            width: 100,
            height: 36,
            top: 0,
            right: 100,
            bottom: 36,
            left: 0,
        }),
    });
    window.requestAnimationFrame = (callback) => window.setTimeout(callback, 0);

    const getUserMedia = jest.fn(() => new Promise(() => {}));
    Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: { getUserMedia },
    });

    const storageValues = {
        config_enable_shortcut: true,
        config_shortcut_first_key: 'r',
        config_shortcut_first_modifier: 'none',
        config_shortcut_second_modifier: 'none',
    };
    window.chrome = {
        runtime: {
            getManifest: () => ({ version: 'test-version' }),
        },
        storage: {
            sync: {
                clear: jest.fn(),
                get: (key, callback) => callback({ [key]: storageValues[key] }),
                set: (_values, callback) => callback?.(),
            },
        },
    };

    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const contentScript = fs.readFileSync(path.resolve(process.cwd(), 'public/content.js'), 'utf8');
    window.eval(contentScript);
    await settleMounting();

    const originalRoot = document.querySelector('[data-whisper-to-chatgpt-root]');
    const originalButton = originalRoot.querySelector('[data-whisper-to-chatgpt-control="button"]');
    expect(originalRoot.dataset.whisperMountStrategy).toBe('native-voice-controls');
    expect(document.querySelectorAll('[data-whisper-to-chatgpt-root]')).toHaveLength(1);
    expect(document.querySelectorAll('#composer-one button[aria-label="Dictate"]')).toHaveLength(1);
    expect(document.querySelectorAll('#composer-one button[aria-label="Start Voice"]')).toHaveLength(1);
    expect(originalRoot.parentElement).toBe(document.querySelector('#composer-one .actions'));

    document.querySelector('#composer-one').hidden = true;
    document.body.insertAdjacentHTML(
        'beforeend',
        `
            <form data-type="unified-composer" id="composer-two">
                <div role="textbox" contenteditable="true" class="ProseMirror" data-editor="two"></div>
                <div class="actions">
                    <div>
                        <button type="button" aria-label="Dictate">Dictate</button>
                    </div>
                    <div>
                        <button type="button" aria-label="Start Voice">Voice</button>
                    </div>
                </div>
            </form>
        `
    );
    await settleMounting();

    expect(document.querySelector('#composer-two [data-whisper-to-chatgpt-root]')).toBe(originalRoot);
    expect(originalRoot.querySelector('[data-whisper-to-chatgpt-control="button"]')).toBe(originalButton);

    document.body.appendChild(originalRoot.cloneNode(true));
    await settleMounting();
    expect(document.querySelectorAll('[data-whisper-to-chatgpt-root]')).toHaveLength(1);

    const secondActions = document.querySelector('#composer-two .actions');
    secondActions.remove();
    document.querySelector('#composer-two').insertAdjacentHTML(
        'beforeend',
        `
            <div class="actions">
                <div>
                    <button type="button" aria-label="Dictate">Dictate</button>
                </div>
                <div>
                    <button type="button" aria-label="Start Voice">Voice</button>
                </div>
            </div>
        `
    );
    await settleMounting();

    expect(document.querySelector('#composer-two [data-whisper-to-chatgpt-root]')).toBe(originalRoot);
    expect(document.querySelectorAll('[data-whisper-to-chatgpt-root]')).toHaveLength(1);
    expect(document.querySelectorAll('#composer-two button[aria-label="Dictate"]')).toHaveLength(1);
    expect(document.querySelectorAll('#composer-two button[aria-label="Start Voice"]')).toHaveLength(1);

    await new Promise((resolve) => setTimeout(resolve, 275));

    const runtimeState = JSON.parse(document.documentElement.getAttribute('data-whisper-to-chatgpt-runtime'));
    expect(runtimeState).toMatchObject({
        version: 'test-version',
        contentScriptLoaded: true,
        initialized: true,
        editorFound: true,
        composerFound: true,
        actionAreaFound: true,
        controlCreated: true,
        controlConnected: true,
        controlVisible: true,
        survivesRerender: true,
    });

    originalButton.click();
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(addEventListenerSpy.mock.calls.filter(([eventName]) => eventName === 'keydown')).toHaveLength(1);
});
