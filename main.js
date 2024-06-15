// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, shell } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const { popupContextMenu } = require('./modules/contextmenu.js')

const mainWindowOptions = {
	width: 800,
	height: 600,
	frame: false,
	titleBarStyle: 'hidden',
	transparent: true,
	icon: 'build/icon.png',
	webPreferences: {
		preload: path.join(__dirname, 'preload.js'),
		nodeIntegration: false,
		enableRemoteModule: false,
		contextIsolation: true,
		sandbox: true,
		autoHideMenuBar: true
	}
}
const appOptions = {
	windowX: undefined,
	windowY: undefined,
	windowWidth: undefined,
	windowHeight: undefined
}
const appConfig = path.join(app.getPath('userData'), 'config.json')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let moveTimeout
let resizeTimeout
let windowMaximized = false

async function getOptions() {
	if (fs.existsSync(appConfig)) {
		const result = fs.readFileSync(appConfig)
		const options = JSON.parse(result)
		appOptions.windowX = options.windowX || undefined
		appOptions.windowY = options.windowY || undefined
		appOptions.windowWidth = options.windowWidth || undefined
		appOptions.windowHeight = options.windowHeight || undefined
		console.log(appOptions)
	}
}

async function setOptions() {
	fs.writeFileSync(appConfig, JSON.stringify(appOptions, null, '\t'))
}

function getWindowOptions() {
	const windowPosition = mainWindow.getBounds()
	appOptions.windowX = windowPosition.x
	appOptions.windowY = windowPosition.y
	appOptions.windowWidth = windowPosition.width
	appOptions.windowHeight = windowPosition.height
	setOptions()
	// console.log(appOptions)
}

function createWindow() {
	// console.log(mainWindowOptions)
	// Create the browser window.
	mainWindow = new BrowserWindow(mainWindowOptions)

	mainWindow.setMenu(null)
	// and load the index.html of the app.
	mainWindow.loadFile('index.html')

	// Open the DevTools.
	// mainWindow.webContents.openDevTools()

	mainWindow.on('maximize', () => {
		windowMaximized = true
	})

	mainWindow.on('unmaximize', () => {
		windowMaximized = false
	})

	mainWindow.on('resize', () => {
		if (!windowMaximized) {
			clearTimeout(resizeTimeout)
			resizeTimeout = setTimeout(function () {
				getWindowOptions()
			}, 350)
		}
	})

	mainWindow.on('move', () => {
		if (!windowMaximized) {
			clearTimeout(moveTimeout)
			moveTimeout = setTimeout(function () {
				getWindowOptions()
			}, 350)
		}
	})

	mainWindow.webContents.on('context-menu', (event, params) => {
		popupContextMenu(mainWindow.webContents, params)
	})

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null
	})
}

async function startup() {
	console.log(appConfig)
	await getOptions()
	if (appOptions.windowX) {
		mainWindowOptions.x = appOptions.windowX
		mainWindowOptions.y = appOptions.windowY
		mainWindowOptions.width = appOptions.windowWidth
		mainWindowOptions.height = appOptions.windowHeight
	}
	createWindow()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', startup)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
ipcMain.handle('action:openUrl', (event, url) => {
	console.log(`opening external link ${url}`)
	shell.openExternal(url)
})
