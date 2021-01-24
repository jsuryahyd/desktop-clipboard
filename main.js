const AutoLaunch = require('auto-launch');
const {app,BrowserWindow, Tray, Menu,ipcRenderer,globalShortcut} = require('electron');
const { ipcMain } = require('electron/main');
const fs = require('fs');
// const robot = require('robotjs');
var ks = require('node-key-sender');
const keySender = require('node-key-sender');
ks.sendKey('a');

//start on system startup
const autoLaunch = new AutoLaunch({name:"Clipboard"});
autoLaunch.isEnabled()
.then(function(isEnabled){
    if(isEnabled){
        return;
    }
    autoLaunch.enable();
})
.catch(function(err){
		// handle error
		console.error(err)
});
// Enable live reload for Electron too
require('electron-reload')(__dirname, {
    // Note that the path to electron may vary according to the main file
		electron: require(`${__dirname}/node_modules/electron`)
});
let isQuiting;
let list = []
app.on('before-quit', function () {
	isQuiting = true;
	globalShortcut.unregisterAll();
	fs.writeFileSync('./db/database.json',JSON.stringify(list));
});
let appWindow;
function CreateWindow(){
	appWindow = new BrowserWindow({
		width:1280,
		height:720,
		webPreferences:{
			nodeIntegration:true,
			enableRemoteModule:false,
			allowRunningInsecureContent:false
		},
		show:false,
		modal:true
	})

	appWindow.loadFile('index.html');
	appWindow.on('close', function (event) {
		if(isQuiting) return false;
		event.preventDefault();
		appWindow.hide();
	});
	appWindow.on('blur', () => appWindow.hide());//gives focus back to previous window/application

	const w = fs.readFileSync('./db/database.json','utf-8');
	console.log(w);
	list = JSON.parse(w);
	appWindow.webContents.on('did-finish-load', () => {
		appWindow.webContents.send('initialList',list)
  })
}
let tray;
app.whenReady().then(()=>{
	CreateWindow();
	tray = new Tray('./images/copy.png');
	globalShortcut.register('Super+V',()=>{//not working
		appWindow.show();
	})
	globalShortcut.register('Shift+V',()=>{
		appWindow.show();
	})
	const trayContextMenu =  Menu.buildFromTemplate([
		{label:"Open",click:()=>{appWindow.show()}},
		{label:"Quit",click:()=>{isQuiting=true;appWindow.destroy();app.quit();}},
	])
	tray.setToolTip("Clipboard")	
	tray.setContextMenu(trayContextMenu)
});



app.on('window-all-closed',()=>{
	//save list to db
	//get list
	// const deets = fs.writeFileSync('./db/database.json',JSON.stringify(list));

	// if(process.platform != "darwin") app.quit()
})

app.on('activate',()=>{
	if(BrowserWindow.getAllWindows().length == 0) CreateWindow()
})

ipcMain.on('hide',(...args)=>{
	// console.log(args)
	appWindow.hide();
});

ipcMain.on('paste',(e,{content})=>{
	// robot.keyTap('v', process.platform==='darwin' ? 'command' : 'control');
	
	appWindow.hide();
	setTimeout(()=>{
		keySender.sendText(content);
	},200)
});

ipcMain.on('copied',(e,d)=>{
	list.push(d);
})

// function onCopied(appWindow){

// 	appWindow.webContents.send('item-added',)
// }

