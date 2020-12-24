const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const  fs  = require('fs');
const  path  = require('path');

// JANELA PRINCIPAL
var mainWindow = null;
async function createWindow(){
    mainWindow = new BrowserWindow({
        width:800,
        height:600,
        webPreferences:{
            nodeIntegration: true
        }
    })

    await mainWindow.loadFile('src/pages/editor/index.html')
    // mainWindow.webContents.openDevTools()

    createNewFile()

    ipcMain.on('update-content', function(event, data){
        file.content = data;
    })

}

//Arquivo
var file = {}

//Criar Novo Arquivo
function createNewFile(){
    file = {
        name: "novo-arquivo.txt",
        content: '',
        saved: false,
        path: app.getPath('documents')+'/novo-documento.txt'
    }

    mainWindow.webContents.send('set-file', file)
}

// SALVA ARQUIVO NO DISCO
function writeFile(filePath){
    try {
        fs.writeFile(filePath, file.content, function(error){
            // CASO ERRO
            if (error) throw error;

            // ARQUIVO SALVO
            file.path  = filePath,
            file.saved = true,
            file.name  = path.basename(filePath)

            mainWindow.webContents.send('set-file', file)
        })
    } catch (error) {
        console.log(error);
    }
}

//SALVAR COMO
async function saveFileAs(){

    // DIALOG
    let dialogFile = await dialog.showSaveDialog({
        defaultPath: file.path
    })

    //VERIFICAR CANCELAMENTO
    if (dialogFile.canceled) {
        return false;
    }

    //Salvar Arquivo
    writeFile(dialogFile.filePath)
    console.log(dialogFile);
}

// SALVAR ARQUIVO
function saveFile(){
    // SALVAR
    if (file.saved) {
        return writeFile(file.path)
    }

    // SALVAR COMO
    return saveFileAs()
}

//LENDO DOCUMENTO
function readFile(filePath){
    try {
        return fs.readFileSync(filePath,'utf8')
    } catch (error) {
        console.log(error);
        return '';
    }
}

// ABRIR ARQUIVO
async function openFile(){
    // DIALOGO
    let dialogFile = await dialog.showOpenDialog({
        defaultPath: file.path
    })

    //VERIFICAR CANCELAMENTO
    if (dialogFile.canceled) return false;

    // ABRIR O ARQUIVO
    file = {
        name: path.basename(dialogFile.filePaths[0]),
        content: readFile(dialogFile.filePaths[0]),
        saved: true,
        path: dialogFile.filePaths[0]
    }

    mainWindow.webContents.send('set-file', file)

}

// Template Menu
const templateMenu =[
    {
        label:"Arquivo",
        submenu:[
            {
                label: 'Novo',
                accelerator: 'Ctrl+N',
                click(){
                    createNewFile()
                }
            },
            {
                label: 'Abrir',
                accelerator: 'Ctrl+O',
                click(){
                    openFile()
                }
            },
            {
                label: 'Salvar',
                accelerator: 'Ctrl+S',
                click(){
                    saveFile()
                }
            },
            {
                label: 'Salvar Como',
                accelerator: 'Ctrl+Shift+N',
                click(){
                    saveFileAs()
                }
            },
            {label: 'Fechar', role:'quit'},
        ]
    }
]

// Menu
const menu = Menu.buildFromTemplate(templateMenu)
Menu.setApplicationMenu(menu)

// ON READY
app.whenReady().then(createWindow);

app.on("activate", ()=>{
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})