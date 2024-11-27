/* global chrome */
import React, { useState, useEffect } from 'react';
import Link from '@mui/material/Link';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Divider from '@mui/material/Divider';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import createTheme from '@mui/material/styles/createTheme';
import themeOptions from './themeOptions';

const darkTheme = createTheme(themeOptions);

function App() {
    const [token, setToken] = useState('');
    const [prompts, setPrompts] = useState([]);
    const [selectedPrompt, setSelectedPrompt] = useState('');
    const [snippetFields, setSnippetFields] = useState([]);
    const [translationEnabled, setTranslationEnabled] = useState(false);
    const [downloadEnabled, setDownloadEnabled] = useState(false);
    const [snippetsEnabled, setSnippetsEnabled] = useState(false);

    // overdone shortcut feature
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split(''); // hardcoded for now, we can adjust later if alphabet changes
    const [shortcutEnabled, setShortcutEnabled] = useState(false);
    const [shortcutFirstKey, setShortcutFirstKey] = useState('none');
    // const [shortcutSecondKey, setShortcutSecondKey] = useState('none');
    const [shortcutFirstModifier, setShortcutFirstModifier] = useState('none');
    const [shortcutSecondModifier, setShortcutSecondModifier] = useState('none');

    const [promptTitle, setPromptTitle] = useState('');
    const [promptContent, setPromptContent] = useState('');

    // retrieve stored data (backwards compatibilly with old version)
    useEffect(() => {
        const retrieveState = async () => {
            await chrome.storage?.sync.get(
                [
                    'openai_token',
                    'openai_prompts',
                    'openai_selected_prompt',
                    'openai_prompt',
                    'config_enable_translation',
                    'config_enable_download',
                    'config_enable_snippets',
                    'snippets',
                    'config_enable_shortcut',
                    'config_shortcut_first_key',
                    // 'config_shortcut_second_key',
                    'config_shortcut_first_modifier',
                    'config_shortcut_second_modifier',
                ],
                async (result) => {
                    console.log('Config retrieved:', { ...result, openai_token: result.openai_token ? '***' : '' });
                    if (result.openai_token) {
                        setToken(result.openai_token);
                    }

                    // backwards compatibility with old version (only one prompt)
                    // first launch of new version
                    if (result.openai_prompt && !result.openai_prompts && !result.openai_selected_prompt) {
                        setPrompts([{ title: 'Initial prompt', content: result.openai_prompt }]);
                        setSelectedPrompt(0);
                        setPromptTitle('Initial prompt');
                        setPromptContent(result.openai_prompt);
                        await chrome.storage?.sync.set(
                            {
                                openai_prompts: [{ title: 'Initial prompt', content: result.openai_prompt }],
                                openai_selected_prompt: 0,
                            },
                            () => {
                                // console.log('Config stored');
                            }
                        );
                    }

                    // first launch ever
                    if (!result.openai_prompt && !result.openai_prompts && !result.openai_selected_prompt) {
                        const initialPrompt = `The transcript is about OpenAI which makes technology like DALL·E, GPT-3, and ChatGPT with the hope of one day building an AGI system that benefits all of humanity.`;
                        setPrompts([{ title: 'Initial prompt', content: initialPrompt }]);
                        setSelectedPrompt(0);
                        setPromptTitle('Initial prompt');
                        setPromptContent(initialPrompt);
                        await chrome.storage?.sync.set(
                            {
                                openai_prompts: [{ title: 'Initial prompt', content: initialPrompt }],
                                openai_selected_prompt: 0,
                            },
                            () => {
                                // console.log('Config stored');
                            }
                        );
                    }

                    // regular use with saved prompts in new version
                    if (result.openai_prompts && (result.openai_selected_prompt || result.openai_selected_prompt === 0)) {
                        setPrompts(result.openai_prompts);
                        setSelectedPrompt(result.openai_selected_prompt);
                        setPromptTitle(result.openai_prompts[result.openai_selected_prompt]?.title || '');
                        setPromptContent(result.openai_prompts[result.openai_selected_prompt]?.content || '');
                    }

                    // shortcuts config on first launch
                    if (!result.config_shortcut_first_key && !result.config_shortcut_first_modifier && !result.config_shortcut_second_modifier) {
                        // we set default for windows and mac separately
                        if (navigator.userAgentData.platform.toLowerCase().indexOf('mac') > -1) {
                            setShortcutFirstModifier('ctrlKey');
                            setShortcutFirstKey('r');
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
                            setShortcutFirstModifier('shiftKey');
                            setShortcutSecondModifier('altKey');
                            setShortcutFirstKey('r');
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

                    if (result.config_enable_translation) {
                        setTranslationEnabled(result.config_enable_translation);
                    }
                    if (result.config_enable_download) {
                        setDownloadEnabled(result.config_enable_download);
                    }
                    if (result.config_enable_snippets) {
                        setSnippetsEnabled(result.config_enable_snippets);
                    }
                    if (result.snippets) {
                        setSnippetFields(result.snippets.map((snippet, index) => ({ id: index, value: snippet })));
                    }
                    if (result.config_enable_shortcut) {
                        setShortcutEnabled(result.config_enable_shortcut);
                    }
                    if (result.config_shortcut_first_key) {
                        setShortcutFirstKey(result.config_shortcut_first_key);
                    }
                    // if (result.config_shortcut_second_key) {
                    //     setShortcutSecondKey(result.config_shortcut_second_key);
                    // }
                    if (result.config_shortcut_first_modifier) {
                        setShortcutFirstModifier(result.config_shortcut_first_modifier);
                    }
                    if (result.config_shortcut_second_modifier) {
                        setShortcutSecondModifier(result.config_shortcut_second_modifier);
                    }
                }
            );
        };
        retrieveState();
    }, []);

    // update prompt title and content when selected prompt changes (just in case you forget to click save)
    useEffect(() => {
        if (selectedPrompt >= 0) {
            const promptsCopy = [...prompts];
            promptsCopy[selectedPrompt] = { title: promptTitle, content: promptContent };
            setPrompts(promptsCopy);
            // console.log('Prompt changed:', { prompts });
            const timeout = setTimeout(() => {
                chrome.storage?.sync.set(
                    {
                        openai_prompts: prompts,
                    },
                    () => {
                        // console.log('Config stored:', { prompts, selectedPrompt });
                    }
                );
            }, 500);
            return () => clearTimeout(timeout);
        }
    }, [promptTitle, promptContent]);

    // update chrome storage when snippet fields change
    // we need to debounce this because it should not be called on every keystroke
    useEffect(() => {
        const snippetsTexts = snippetFields.map((field) => field.value);
        const timeout = setTimeout(() => {
            chrome.storage?.sync.set(
                {
                    snippets: snippetsTexts,
                },
                () => {
                    // console.log('Config stored:', { snippets: snippetsTexts });
                }
            );
        }, 500);
        return () => clearTimeout(timeout);
    }, [snippetFields]);

    const handleSelectedPromptChange = (event) => {
        setSelectedPrompt(event.target.value);
        setPromptTitle(prompts[event.target.value]?.title || '');
        setPromptContent(prompts[event.target.value]?.content || '');
        const timeout = setTimeout(() => {
            chrome.storage?.sync.set(
                {
                    openai_selected_prompt: event.target.value,
                },
                () => {
                    // console.log('Config stored:', { selectedPrompt: event.target.value });
                }
            );
        }, 500);
        return () => clearTimeout(timeout);
    };

    const handleSavePrompt = () => {
        const promptsCopy = [...prompts];
        promptsCopy[selectedPrompt] = { title: promptTitle, content: promptContent };
        setPrompts(promptsCopy);
        chrome.storage?.sync.set(
            {
                openai_prompts: promptsCopy,
                openai_selected_prompt: selectedPrompt,
            },
            () => {
                // console.log('Config stored:', { token, prompts: promptsCopy });
            }
        );
    };

    const handleRemovePrompt = () => {
        if (selectedPrompt >= 0) {
            const promptsCopy = prompts.filter((_, i) => i !== selectedPrompt);
            setPrompts(promptsCopy);
            setSelectedPrompt('');
            setPromptTitle('');
            setPromptContent('');

            chrome.storage?.sync.set(
                {
                    openai_prompts: promptsCopy,
                },
                () => {
                    // console.log('Config stored:', { token, prompts: promptsCopy });
                }
            );
        }
    };

    const handleAddSnippet = () => {
        setSnippetFields([...snippetFields, { id: snippetFields.length, value: '' }]);
    };

    const handleRemoveSnippet = (id) => {
        setSnippetFields(snippetFields.filter((field) => field.id !== id));
    };

    const handleChangeSnippet = (id, value) => {
        setSnippetFields(snippetFields.map((field) => (field.id === id ? { ...field, value } : field)));
    };

    const handleToggleTranslation = (event) => {
        setTranslationEnabled(event.target.checked);
        chrome.storage?.sync.set({ config_enable_translation: event.target.checked }, () => {
            // console.log('Config stored:', { config_enable_translation: event.target.checked });
        });
    };

    const handleToggleShortcut = (event) => {
        setShortcutEnabled(event.target.checked);
        chrome.storage?.sync.set({ config_enable_shortcut: event.target.checked }, () => {
            // console.log('Config stored:', { config_enable_translation: event.target.checked });
        });
    };

    const handleToggleDownload = (event) => {
        setDownloadEnabled(event.target.checked);
        chrome.storage?.sync.set({ config_enable_download: event.target.checked }, () => {
            // console.log('Config stored:', { config_enable_download: event.target.checked });
        });
    };

    const handleToggleSnippets = (event) => {
        setSnippetsEnabled(event.target.checked);
        chrome.storage?.sync.set({ config_enable_snippets: event.target.checked }, () => {
            // console.log('Config stored:', { config_enable_snippets: event.target.checked });
        });
    };

    const handleTokenChange = (event) => {
        setToken(event.target.value);
        chrome.storage?.sync.set({ openai_token: event.target.value }, () => {
            // console.log('Config stored:', { openai_token: event.target.value });
        });
    };

    const handleShortcutFirstModifierChange = (event) => {
        setShortcutFirstModifier(event.target.value);
        chrome.storage?.sync.set({ config_shortcut_first_modifier: event.target.value }, () => {
            // console.log('Config stored:', { config_shortcut_first_modifier: event.target.value });
        });
    };

    const handleShortcutSecondModifierChange = (event) => {
        setShortcutSecondModifier(event.target.value);
        chrome.storage?.sync.set({ config_shortcut_second_modifier: event.target.value }, () => {
            // console.log('Config stored:', { config_shortcut_second_modifier: event.target.value });
        });
    };
    const handleShortcutFirstKeyChange = (event) => {
        setShortcutFirstKey(event.target.value);
        chrome.storage?.sync.set({ config_shortcut_first_key: event.target.value }, () => {
            // console.log('Config stored:', { config_shortcut_first_key: event.target.value });
        });
    };

    // const handleShortcutSecondKeyChange = (event) => {
    //     setShortcutSecondKey(event.target.value);
    //     chrome.storage?.sync.set({ config_shortcut_second_key: event.target.value }, () => {
    //         // console.log('Config stored:', { config_shortcut_second_key: event.target.value });
    //     });
    // };

    return (
        <>
            <ThemeProvider theme={darkTheme}>
                <CssBaseline />
                <Box display="flex" flexWrap="wrap" width="25rem" gap=".5rem" margin="1rem" paddingRight={2} alignItems="center">
                    <Box width="100%" paddingBottom={1}>
                        <Typography variant="body2" textAlign="center" gutterBottom>
                            Enjoying Whisper to ChatGPT? <br />
                            Try our desktop application to transcribe and paste across any desktop apps with a shortcut! <br />
                            Get one month free with promo code: THANKUWHISPER <br />
                            <Link sx={{ fontSize: '1.2rem' }} color="primary" href="https://sonascript.com" target="_blank">
                                https://sonascript.com
                            </Link>
                        </Typography>
                    </Box>
                    <Box width="100%" paddingBottom={1}>
                        <TextField
                            fullWidth
                            label="OpenAI API Token"
                            id="token"
                            value={token}
                            onChange={handleTokenChange}
                            placeholder="sk-..."
                            size="small"
                            type={token.length > 0 ? 'password' : 'text'}
                        />
                    </Box>
                    <Divider
                        component="div"
                        sx={{
                            width: '100%',
                            height: '1px',
                        }}
                    />
                    <Box width="100%" paddingTop={1}>
                        <FormControl fullWidth>
                            <InputLabel id="select-prompt-label">Select Prompt</InputLabel>
                            <Select
                                label="Select Prompt"
                                labelId="select-prompt-label"
                                value={selectedPrompt}
                                onChange={handleSelectedPromptChange}
                                size="small"
                            >
                                {prompts.map((_prompt, index) => (
                                    <MenuItem key={index} value={index}>
                                        {_prompt.title || 'Untitled'}
                                    </MenuItem>
                                ))}
                                <MenuItem value={prompts.length}>Add New Prompt</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box width="100%">
                        <TextField label="Title" id="title" fullWidth value={promptTitle} onChange={(e) => setPromptTitle(e.target.value)} size="small" />
                    </Box>
                    <Box width="100%">
                        <TextField
                            label="Content"
                            id="content"
                            fullWidth
                            value={promptContent}
                            onChange={(e) => setPromptContent(e.target.value)}
                            helperText="Boost words recognition according to provided context."
                            size="small"
                            multiline
                            minRows={10}
                        />
                    </Box>
                    <Box flexGrow={1} paddingBottom={1}>
                        <Button onClick={handleSavePrompt} fullWidth variant="outlined">
                            Save Prompt
                        </Button>
                    </Box>
                    <Box paddingBottom={1}>
                        <Button onClick={handleRemovePrompt} color="error" variant="outlined">
                            Remove Prompt
                        </Button>
                    </Box>
                    <Divider
                        component="div"
                        sx={{
                            width: '100%',
                            height: '1px',
                        }}
                    />
                    <Box width="100%" paddingTop={1}>
                        <Typography variant="h5" textAlign="center">
                            Config:
                        </Typography>
                    </Box>
                    <Box width="100%">
                        <FormControlLabel
                            control={<Switch checked={shortcutEnabled} onChange={handleToggleShortcut} />}
                            label="Enable Microphone Toggle Shortcut"
                        />
                        <FormHelperText>Requires page refresh on an any change.</FormHelperText>
                    </Box>
                    {shortcutEnabled && (
                        <>
                            <Box width="35%">
                                <FormControl fullWidth>
                                    <InputLabel id="select-modifier1-label">Modifier 1</InputLabel>
                                    <Select
                                        label="Modifier 1"
                                        labelId="select-modifier1-label"
                                        value={shortcutFirstModifier}
                                        onChange={handleShortcutFirstModifierChange}
                                        size="small"
                                    >
                                        <MenuItem value="none">None</MenuItem>
                                        <MenuItem value="ctrlKey">Ctrl</MenuItem>
                                        <MenuItem value="shiftKey">Shift</MenuItem>
                                        <MenuItem value="metaKey">Metakey (⊞ on Windows / ⌘ on Mac)</MenuItem>
                                        <MenuItem value="altKey">Altkey (alt on Windows / ⌥ on Mac)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box width="35%">
                                <FormControl fullWidth>
                                    <InputLabel id="select-modifier2-label">Modifier 2</InputLabel>
                                    <Select
                                        label="Modifier 2"
                                        labelId="select-modifier2-label"
                                        value={shortcutSecondModifier}
                                        onChange={handleShortcutSecondModifierChange}
                                        size="small"
                                    >
                                        <MenuItem value="none">None</MenuItem>
                                        <MenuItem value="ctrlKey">Ctrl</MenuItem>
                                        <MenuItem value="shiftKey">Shift</MenuItem>
                                        <MenuItem value="metaKey">Metakey (⊞ on Windows / ⌘ on Mac)</MenuItem>
                                        <MenuItem value="altKey">Altkey (alt on Windows / ⌥ on Mac)</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box width="15%" flexGrow={1}>
                                <FormControl fullWidth>
                                    <InputLabel id="select-key1-label">Key</InputLabel>
                                    <Select
                                        required={true}
                                        label="Key"
                                        labelId="select-key1-label"
                                        value={shortcutFirstKey}
                                        onChange={handleShortcutFirstKeyChange}
                                        size="small"
                                    >
                                        {/* <MenuItem value="none">None</MenuItem> */}
                                        {alphabet.map((letter) => (
                                            <MenuItem key={letter} value={letter}>
                                                {letter.toUpperCase()}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Box>
                        </>
                    )}
                    <Box width="100%">
                        <FormControlLabel control={<Switch checked={translationEnabled} onChange={handleToggleTranslation} />} label="Enable Translation" />
                        <FormHelperText>Translate any input language to English</FormHelperText>
                    </Box>
                    <Box width="100%">
                        <FormControlLabel control={<Switch checked={downloadEnabled} onChange={handleToggleDownload} />} label="Enable File Download" />
                        <FormHelperText>Download sound file with recording</FormHelperText>
                    </Box>
                    {/* <Box width="100%">
                        <FormControlLabel control={<Switch checked={snippetsEnabled} onChange={handleToggleSnippets} />} label="Enable Snippets (Beta)" />
                        <FormHelperText>Requires page refresh on toggle. Only tested on desktop version.</FormHelperText>
                    </Box> */}
                    {/* {snippetsEnabled && (
                        <>
                            <Box width="100%">
                                <Typography variant="subtitle1">Predefined Snippets:</Typography>
                            </Box>
                            {snippetFields.map((field) => (
                                <>
                                    <Box key={field.id} flexGrow={1}>
                                        <TextField
                                            id={`snippet-${field.id}`}
                                            value={field.value}
                                            onChange={(e) => handleChangeSnippet(field.id, e.target.value)}
                                            size="small"
                                            fullWidth
                                            multiline
                                            maxRows={5}
                                        />
                                    </Box>
                                    <Box>
                                        <Button variant="outlined" color="error" onClick={() => handleRemoveSnippet(field.id)}>
                                            Remove
                                        </Button>
                                    </Box>
                                </>
                            ))}
                            <Box width="100%">
                                <Button variant="outlined" onClick={handleAddSnippet} fullWidth>
                                    Add Snippet
                                </Button>
                            </Box>
                        </>
                    )} */}
                </Box>
            </ThemeProvider>
        </>
    );
}

export default App;
