const path = require('path');
const os = require('os');
const fs = require('fs');
const resizeImg = require('resize-img')
const { app, BrowserWindow, Menu , ipcMain, shell} = require('electron');


process.env.NODE_ENV = 'production';

const isDev = process.env.NODE_ENV !=='production';
const isMac = process.platform === 'darwin';

let mainWindow;
// create the main window
function createMainWindow(){
     mainWindow = new BrowserWindow({
        title: 'Image Resizer',
        width: isDev ? 1000 : 600,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // open devtools if in dev env
    if (isDev){
        mainWindow.webContents.openDevTools();
    }
    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}

// create about window
function createAboutWindow(){
    const aboutWindow = new BrowserWindow({
        title: 'About Image Resizer',
        width: 300,
        height: 300
    });

   
    aboutWindow.loadFile(path.join(__dirname, './renderer/about.html'));
}


// app is ready
app.whenReady().then(() => {
    createMainWindow();

    //implement menu
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    // remove main window from memory on close
    mainWindow.on('closed', () => {mainWindow: null})

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createMainWindow()
        }
      })

    });

//menu template
const menu = [
    ...(isMac ? [{
        label: app.name,
        submenu: [
            {
                label: 'About',
                click: createAboutWindow
            },
        ]
    }] : []),
    {
       role: 'fileMenu',
    },
    ...(!isMac ? [{
        label: 'Help',
        submenu: [{
            label: 'About',
            click:createAboutWindow
        }]
    }] : [])
]

// respond to ipcRenderer resize
ipcMain.on('image:resize', (e, options) => {
    options.dest = path.join(os.homedir(), 'footy');
    resizeImage(options);
});

// resize the image function

async function resizeImage( {imgPath, width, height, dest}) {
    try{
        const newPath = await resizeImg(fs.readFileSync(imgPath), {
            width: +width,
            height: +height
        });


        // create file name
        const filename = path.basename(imgPath);

        // create destination folder if not exists
        if(!fs.existsSync(dest)){
            fs.mkdirSync(dest);
        }

        //write file to destination folder
        fs.writeFileSync(path.join(dest, filename), newPath);


        // send success to renderer
        mainWindow.webContents.send('image:done');


        // open dest folder 
        shell.openPath(dest);

    }
    catch(error){
        console.log(error);
    }
}

app.on('window-all-closed', () => {
    if (!isMac) {
      app.quit()
    }
  })