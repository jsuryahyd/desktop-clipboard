const { BrowserWindow, screen } = require("electron");
const { ipcMain } = require("electron/main");
const path = require('path');
function SnipScreen({ mainWindow }) {


	
  function largestScreens() {
    console.log("screens", screen.getAllDisplays());
  }

  function init({ video } = { video: false }) {
    mainWindow.hide();

    //todo: multiple displays => multiple windows
    const captureWindow = new BrowserWindow({
      transparent: true,
      frame: false,
      width: screen.getPrimaryDisplay().size.width,
			height: screen.getPrimaryDisplay().size.width,
			// kiosk: true
		});
		
		captureWindow.on('close',()=>{
			captureWindow.destroy();
		})

		ipcMain.once('snip',(event,data)=>{
			captureScreen(data)
		})

		ipcMain.once('cancelled',(event)=>{
			mainWindow.show()
		})

		captureWindow.loadURL(path.join(__dirname,"../pages/snipwindow.html"));
		captureWindow.setResizable(true);
	}
	

	function captureScreen(data){
console.log(data);
	}


	return {
		init,captureScreen
	}
}

module.exports = SnipScreen;