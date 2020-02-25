const path = require('path')
const {app, BrowserWindow, shell, globalShortcut, dialog, Menu, ipcMain} = require('electron')
const electron = require('electron');
const name = electron.app.getName();

let mainWindow = null

const template = [{
    label: 'window',
    role: 'window',
    submenu: [{
        label: 'minimize',
        accelerator: 'CmdOrCtrl+M',
        role: 'minimize'
    }, {
        label: 'close',
        accelerator: 'CmdOrCtrl+W',
        role: 'close'
    }, {
        label: 'Toggle Full Screen',
        accelerator: (function() {
            if (process.platform === 'darwin') {
                return 'Ctrl+Command+F'
            } else {
                return 'F11'
            }
        })(),
        click: function(item, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.setFullScreen(!focusedWindow.isFullScreen())
            }
        }
    }, {
        label: 'Toggle Developer Tools',
        accelerator: (function() {
            if (process.platform === 'darwin') {
                return 'Alt+Command+I'
            } else {
                return 'Ctrl+Shift+I'
            }
        })(),
        click: function(item, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.toggleDevTools()
            }
        }
    }]
}, {
    label: 'help',
    role: 'help',
    submenu: [{
        label: 'Learn More',
        click: function() {
            electron.shell.openExternal('https://github.com/nemfoundation/nem2-desktop-wallet')
        },
    }, {
        label: 'NEM',
        click: function() {
            electron.shell.openExternal('https://nem.io/')
        },
    }]
}]
if (process.platform === 'darwin') {
    template.unshift({
        label: name,
        submenu: [{
            label: `About ${name}`,
            role: 'about'
        }, {
            type: 'separator'
        }, {
            label: 'Services',
            role: 'services',
            submenu: []
        }, {
            type: 'separator'
        }, {
            label: `Hide ${name}`,
            accelerator: 'Command+H',
            role: 'hide'
        }, {
            label: 'Hide others',
            accelerator: 'Command+Alt+H',
            role: 'hideothers'
        }, {
            label: 'Show',
            role: 'unhide'
        }, {
            type: 'separator'
        }, {
            label: 'Quit',
            accelerator: 'Command+Q',
            click: function() {
                app.quit()
            }
        }]
    });
    if (process.mas) app.setName('·')
    ipcMain.on('app', (event, arg) => {
        switch (arg) {
            case 'quit':
                mainWindow.close();
                break;
            case 'max':
                if (mainWindow.isMaximized()) {
                    mainWindow.restore();
                } else {
                    mainWindow.maximize();
                }
                break;
            case 'min':
                mainWindow.minimize();
                break;
        }
    })
}
if (process.platform === 'win32') {

    const gotTheLock = app.requestSingleInstanceLock()

    if (!gotTheLock) {
        app.quit()
    } else {
        app.on('second-instance', (event, commandLine, workingDirectory) => {
            // Someone tried to run a second instance, we should focus our window.
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore()
                mainWindow.focus()
            }
        })

        // Create myWindow, load the rest of the app, etc...
        app.on('ready', () => {})
    }

    ipcMain.on('app', (event, arg) => {
        switch (arg) {
            case 'quit':
                mainWindow.close();
                break;
            case 'max':
                mainWindow.maximize();
                break;
            case 'unMaximize':
                mainWindow.unmaximize();
                break;
            case 'min':
                mainWindow.minimize();
                break;
            default:
                mainWindow.unmaximize();
        }
    })
}


function initialize() {
    function createMac() {
        let size = require('electron').screen.getPrimaryDisplay().workAreaSize;
        let width = parseInt(size.width);
        let widthTag = width * 0.3;
        let height = width * 0.45;
        if (width >= 1920) {
            mainWindow = new BrowserWindow({
                width: width - widthTag,
                height: height,
                autoHideMenuBar: false,
                resizable: true,
            })
        } else {
            height = parseInt(1080 * size.width / 1920 + 30);
            mainWindow = new BrowserWindow({
                width: width - 100,
                height: height - 50,
                autoHideMenuBar: false,
                resizable: true,
            })
        }
        mainWindow.loadFile('www/index.html')
        mainWindow.on('closed', function() {
            mainWindow = null
        })
        const menu = Menu.buildFromTemplate(template)
        Menu.setApplicationMenu(menu)
    }

    function createWindow() {

        let size = electron.screen.getPrimaryDisplay().workAreaSize

        const originWidth = size.width

        let width = originWidth

        if (originWidth > 1080) {
            width = parseInt(1080 + (originWidth - 1080) * 0.5)
        }
        const height = parseInt(width / (1920 / 1080))

        let windowOptions = {
            minWidth: width,
            minHeight: height,
            width: width,
            height: height,
            title: app.getName(),
            webPreferences: {
                nodeIntegration: true,
            },
            titleBarStyle: 'hidden',
            autoHideMenuBar: true,
            resizable: true,
            frame: true,
        }
        windowOptions.icon = path.join(__dirname, './logo.png')
        mainWindow = new BrowserWindow(windowOptions)
        mainWindow.loadURL(path.join(__dirname, 'www/index.html'))
            // Launch fullscreen with DevTools open, usage: npm run debug
        // if (debug) {
        //     mainWindow.webContents.openDevTools()
        //     mainWindow.maximize()
        //     require('devtron').install()
        // }
        mainWindow.once('ready-to-show', () => {
            mainWindow.show()
        })
        mainWindow.on('closed', () => {
            mainWindow = null
        })
        mainWindow.on('will-resize', (event, newBounds) => {
            event.preventDefault()
        })
    }

    if (process.platform === 'darwin') {
        app.on('ready', createMac)
    } else {
        app.on('ready', createWindow)
        app.on('ready', function() {
            globalShortcut.register('CommandOrControl+R', function() {
                // do nothing to fobiden default refresh
            })
        })
    }
    app.on('window-all-closed', function() {
        app.quit()
    })
    app.on('web-contents-created', (e, webContents) => {
        webContents.on('new-window', (event, url) => {
            event.preventDefault();
            shell.openExternal(url);
        });
    });
}


initialize()
