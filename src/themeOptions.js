const themeOptions = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#0f0',
        },
        background: {
            default: '#333135',
            paper: '#212121',
        },
        secondary: {
            main: '#4a0c3a',
        },
    },
    typography: {
        fontFamily: 'Ubuntu Mono, Open Sans',
        h1: {
            fontFamily: 'Ubuntu Mono',
        },
        h2: {
            fontFamily: 'Ubuntu Mono',
        },
        h3: {
            fontFamily: 'Ubuntu Mono',
        },
        h4: {
            fontFamily: 'Ubuntu Mono',
        },
        h6: {
            fontFamily: 'Ubuntu Mono',
        },
        h5: {
            fontFamily: 'Ubuntu Mono',
        },
        subtitle1: {
            fontFamily: 'Ubuntu Mono',
        },
        subtitle2: {
            fontFamily: 'Ubuntu Mono',
        },
        button: {
            fontFamily: 'Ubuntu Mono',
            fontWeight: 700,
            lineHeight: 1.75,
        },
        overline: {
            fontFamily: 'Ubuntu Mono',
        },
        input: {
            fontFamily: 'Ubuntu Mono',
        }
    },
    overrides: {
        MuiButton: {
            root: {
                background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                border: 0,
                borderRadius: 3,
                boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
                color: 'white',
                height: 48,
                padding: '0 30px',
            },
        },
    },
    props: {
        MuiButton: {
            size: 'small',
        },
        MuiButtonGroup: {
            size: 'small',
        },
        MuiCheckbox: {
            size: 'small',
        },
        MuiFab: {
            size: 'small',
        },
        MuiFormControl: {
            margin: 'dense',
            size: 'small',
        },
        MuiFormHelperText: {
            margin: 'dense',
        },
        MuiIconButton: {
            size: 'small',
        },
        MuiInputBase: {
            margin: 'dense',
            // fontFamily: 'Ubuntu Mono',
        },
        MuiInputLabel: {
            margin: 'dense',
        },
        MuiRadio: {
            size: 'small',
        },
        MuiSwitch: {
            size: 'small',
        },
        MuiTextField: {
            margin: 'dense',
            size: 'small',
        },
    },
    shape: {
        borderRadius: 4,
    },
    spacing: 8,
};

export default themeOptions;