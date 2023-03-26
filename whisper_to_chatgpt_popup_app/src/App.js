/* global chrome */
import React, { useState, useEffect } from 'react';
import {
    CssBaseline,
    Box,
    TextField,
    Button,
    Typography,
    FormControlLabel,
    Switch,
    FormHelperText,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { themeOptions } from './themeOptions';
import WebFont from 'webfontloader';

// console.log(chrome);

WebFont.load({
    google: {
        families: ['Droid Sans', 'Droid Serif', 'Ubuntu Mono', 'Open Sans', 'Lexend'],
    },
});

const darkTheme = createTheme(themeOptions);

function App() {
    const [token, setToken] = useState('');
    const [prompts, setPrompts] = useState([]);
    const [selectedPrompt, setSelectedPrompt] = useState(-1);
    const [snippetFields, setSnippetFields] = useState([]);
    const [translationEnabled, setTranslationEnabled] = useState(false);
    const [downloadEnabled, setDownloadEnabled] = useState(false);
    const [snippetsEnabled, setSnippetsEnabled] = useState(false);

    const [promptTitle, setPromptTitle] = useState('');
    const [promptContent, setPromptContent] = useState('');

    // retrieve stored data (backwards compatibilly with old version)
    useEffect(() => {
        chrome.storage?.sync.get(
            ['openai_token', 'openai_prompts', 'openai_prompt', 'config_enable_translation', 'config_enable_download', 'config_enable_snippets', 'snippets'],
            (result) => {
                if (result.openai_token) {
                    setToken(result.openai_token);
                }
                // backwards compatibility with old version (only one prompt)
                // load the single prompt as the first prompt
                // if there are no prompts stored yet, meaning this is the first time the extension is used with new version
                if (result.openai_prompt) {
                    if (!result.openai_prompts) {
                        setPrompts([{ title: 'Initial prompt', content: result.openai_prompt }]);
                        setSelectedPrompt(0);
                    }
                }
                if (result.openai_prompts) {
                    setPrompts(result.openai_prompts);
                    setSelectedPrompt(0);
                    setPromptTitle(result.openai_prompts[0]?.title || '');
                    setPromptContent(result.openai_prompts[0]?.content || '');
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
                    // setSnippets(result.snippets);
                    setSnippetFields(result.snippets.map((snippet, index) => ({ id: index, value: snippet })));
                }
            }
        );
    }, []);

    // update prompt title and content when selected prompt changes
    useEffect(() => {
        if (selectedPrompt >= 0) {
            const promptsCopy = [...prompts];
            promptsCopy[selectedPrompt] = { title: promptTitle, content: promptContent };
            setPrompts(promptsCopy);
            console.log('Prompt changed:', { prompts });
            chrome.storage?.sync.set(
                {
                    openai_prompts: prompts,
                },
                () => {
                    console.log('Config stored:', { prompts, selectedPrompt });
                }
            );
        }
    }, [promptTitle, promptContent]);

    // update chrome storage when snippet fields change
    useEffect(() => {
        const snippetsTexts = snippetFields.map((field) => field.value);
        chrome.storage?.sync.set(
            {
                snippets: snippetsTexts,
            },
            () => {
                console.log('Config stored:', { snippets: snippetsTexts });
            }
        );
    }, [snippetFields]);

    const handleSelectedPromptChange = (event) => {
        setSelectedPrompt(event.target.value);
        setPromptTitle(prompts[event.target.value]?.title || '');
        setPromptContent(prompts[event.target.value]?.content || '');
    };

    const handleSavePrompt = () => {};

    const handleRemovePrompt = () => {
        if (selectedPrompt >= 0) {
            const promptsCopy = prompts.filter((_, i) => i !== selectedPrompt);
            setPrompts(promptsCopy);
            setSelectedPrompt(prompts[0] || -1);
            setPromptTitle(prompts[0]?.title || '');
            setPromptContent(prompts[0]?.content || '');

            // eslint-disable-next-line no-undef
            chrome.storage?.sync.set(
                {
                    openai_token: token,
                    openai_prompts: promptsCopy,
                },
                () => {
                    console.log('Config stored:', { token, prompts: promptsCopy });
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
            console.log('Config stored:', { config_enable_translation: event.target.checked });
        });
    };
    const handleToggleDownload = (event) => {
        setDownloadEnabled(event.target.checked);
        chrome.storage?.sync.set({ config_enable_download: event.target.checked }, () => {
            console.log('Config stored:', { config_enable_download: event.target.checked });
        });
    };
    const handleToggleSnippets = (event) => {
        setSnippetsEnabled(event.target.checked);
        chrome.storage?.sync.set({ config_enable_snippets: event.target.checked }, () => {
            console.log('Config stored:', { config_enable_snippets: event.target.checked });
        });
    };
    const handleTokenChange = (event) => {
        setToken(event.target.value);
        chrome.storage?.sync.set({ openai_token: event.target.value }, () => {
            console.log('Config stored:', { openai_token: event.target.value });
        });
    };

    return (
        <>
            <ThemeProvider theme={darkTheme}>
                <CssBaseline />
                <Box display="flex" flexWrap="wrap" width="25rem" gap=".5rem" margin="1rem">
                    <Box width="100%">
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
                    <Box width="100%">
                        {/* <TextField
                            label="Whisper API Prompt"
                            id="prompt"
                            fullWidth
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            helperText="Boost words recognition"
                            size="small"
                            multiline
                            minRows={10}
                        /> */}
                        <FormControl fullWidth>
                            <InputLabel id="select-prompt-label">Select Prompt</InputLabel>
                            <Select labelId="select-prompt-label" value={selectedPrompt} onChange={handleSelectedPromptChange} size="small">
                                {prompts.map((_prompt, index) => (
                                    <MenuItem key={index} value={index}>
                                        {_prompt.title || 'Untitled'}
                                    </MenuItem>
                                ))}
                                <MenuItem value={prompts.length}>Add Prompt</MenuItem>
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
                            helperText="Boost words recognition"
                            size="small"
                            multiline
                            minRows={10}
                        />
                    </Box>
                    <Box flexGrow={1}>
                        <Button onClick={handleSavePrompt} fullWidth variant="outlined">
                            Save Prompt
                        </Button>
                    </Box>
                    <Box>
                        <Button onClick={handleRemovePrompt} variant="outlined">
                            Remove Prompt
                        </Button>
                    </Box>
                    <Box width="100%">
                        <FormControlLabel control={<Switch checked={translationEnabled} onChange={handleToggleTranslation} />} label="Enable Translation" />
                        <FormHelperText>Translate any input language to English</FormHelperText>
                    </Box>
                    <Box width="100%">
                        <FormControlLabel control={<Switch checked={downloadEnabled} onChange={handleToggleDownload} />} label="Enable File Download" />
                        <FormHelperText>Download sound file with recording</FormHelperText>
                    </Box>
                    <Box width="100%">
                        <FormControlLabel control={<Switch checked={snippetsEnabled} onChange={handleToggleSnippets} />} label="Enable Snippets (Beta)" />
                        <FormHelperText>Requires page refresh. Only tested on desktop version.</FormHelperText>
                    </Box>
                    {snippetsEnabled && (
                        <>
                            <Box width="100%">
                                <Typography variant="subtitle1">Predefined Prompts:</Typography>
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
                                        <Button onClick={() => handleRemoveSnippet(field.id)}>Remove</Button>
                                    </Box>
                                </>
                            ))}
                            <Box width="100%">
                                <Button onClick={handleAddSnippet} fullWidth>
                                    Add Prompt
                                </Button>
                            </Box>
                        </>
                    )}
                </Box>
            </ThemeProvider>
        </>
    );
}

export default App;
