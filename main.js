const AutoLaunch = require('auto-launch');
const {app,BrowserWindow, Tray, Menu,ipcRenderer,globalShortcut,screen,dialog} = require('electron');
const { ipcMain } = require('electron/main');
const fs = require('fs');
const path = require('path');
// const robot = require('robotjs');
var ks = require('node-key-sender');
const keySender = require('node-key-sender');
const SnipWindow = require('./js/SnipScreen')
// ks.sendKey('a');

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
let appWindow,snipWindow;
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
	// console.log(w);
	list = JSON.parse(w);
	appWindow.webContents.on('did-finish-load', () => {
		appWindow.webContents.send('initialList',list)
	})
	
	snipWindow = SnipWindow({mainWindow:appWindow});
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
	tray.setContextMenu(trayContextMenu);
	console.log(screen);
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

ipcMain.on('take-screenshot',()=>{
	snipWindow.init();
})

// function onCopied(appWindow){

// 	appWindow.webContents.send('item-added',)
// }

function takeScreenShot(){
	appWindow.capturePage({ 
		x: 0, 
		y: 0, 
		width: 800, 
		height: 600, 
}).then((img) => { 
	dialog 
			.showSaveDialog({ 
					title: "Select the File Path to save", 
			
					// Default path to assets folder 
					defaultPath: path.join(__dirname,  
																 "../aassets/image.png"), 
			
					// defaultPath: path.join(__dirname,  
					// '../assets/image.jpeg'), 
					buttonLabel: "Save", 
			
					// Restricting the user to only Image Files. 
					filters: [ 
							{ 
									name: "Image Files", 
									extensions: ["png", "jpeg", "jpg"], 
							}, 
					], 
					properties: [], 
			}) 
			.then((file) => { 
					// Stating whether dialog operation was  
					// cancelled or not. 
					console.log(file.canceled); 
					if (!file.canceled) { 
							console.log(file.filePath.toString()); 

							// Creating and Writing to the image.png file 
							// Can save the File as a jpeg file as well, 
							// by simply using img.toJPEG(100); 
							fs.writeFile(file.filePath.toString(),  
													 img.toPNG(), "base64", function (err) { 
									if (err) throw err; 
									console.log("Saved!"); 
							}); 
					} 
			}) 
			.catch((err) => { 
					console.log(err); 
			}); 
		});
}