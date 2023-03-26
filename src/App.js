/* global chrome */
import React, { useState, useEffect } from 'react';
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
            [
                'openai_token',
                'openai_prompts',
                'openai_selected_prompt',
                'openai_prompt',
                'config_enable_translation',
                'config_enable_download',
                'config_enable_snippets',
                'snippets',
            ],
            (result) => {
                // console.log('Config retrieved:', result);
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
                        setPromptTitle('Initial prompt');
                        setPromptContent(result.openai_prompt);
                        chrome.storage?.sync.set(
                            {
                                openai_prompts: [{ title: 'Initial prompt', content: result.openai_prompt }],
                            },
                            () => {
                                // console.log('Config stored');
                            }
                        );
                    }
                }
                if (result.openai_prompts) {
                    setPrompts(result.openai_prompts);
                    setSelectedPrompt(0);
                    setPromptTitle(result.openai_prompts[0]?.title || '');
                    setPromptContent(result.openai_prompts[0]?.content || '');
                }
                // fisrt launch of extention
                if (!result.openai_prompts && !result.openai_prompt) {
                    const initialPrompt = `The transcript is about OpenAI which makes technology like DALL·E, GPT-3, and ChatGPT with the hope of one day building an AGI system that benefits all of humanity.`;
                    setPrompts([{ title: 'Initial prompt', content: initialPrompt }]);
                    setSelectedPrompt(0);
                    setPromptTitle('Initial prompt');
                    setPromptContent(initialPrompt);
                    chrome.storage?.sync.set(
                        {
                            openai_prompts: [{ title: 'Initial prompt', content: initialPrompt }],
                        },
                        () => {
                            // console.log('Config stored');
                        }
                    );
                }
                if (result.openai_selected_prompt) {
                    setSelectedPrompt(result.openai_selected_prompt);
                    setPromptTitle(result.openai_prompts[result.openai_selected_prompt]?.title || '');
                    setPromptContent(result.openai_prompts[result.openai_selected_prompt]?.content || '');
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
            setSelectedPrompt(-1);
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

    return (
        <>
            <ThemeProvider theme={darkTheme}>
                <CssBaseline />
                <Box display="flex" flexWrap="wrap" width="25rem" gap=".5rem" margin="1rem" paddingRight={2} alignItems="center">
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
                        <FormControlLabel control={<Switch checked={translationEnabled} onChange={handleToggleTranslation} />} label="Enable Translation" />
                        <FormHelperText>Translate any input language to English</FormHelperText>
                    </Box>
                    <Box width="100%">
                        <FormControlLabel control={<Switch checked={downloadEnabled} onChange={handleToggleDownload} />} label="Enable File Download" />
                        <FormHelperText>Download sound file with recording</FormHelperText>
                    </Box>
                    <Box width="100%">
                        <FormControlLabel control={<Switch checked={snippetsEnabled} onChange={handleToggleSnippets} />} label="Enable Snippets (Beta)" />
                        <FormHelperText>Requires page refresh on toggle. Only tested on desktop version.</FormHelperText>
                    </Box>
                    {snippetsEnabled && (
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
                                        <Button variant="outlined" color='error' onClick={() => handleRemoveSnippet(field.id)}>
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
                    )}
                </Box>
            </ThemeProvider>
        </>
    );
}

export default App;
