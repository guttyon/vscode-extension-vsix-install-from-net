// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vsix-install-from-net" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('vsix-install-from-net.install', async () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		//vscode.window.showInformationMessage('Hello World from vsix-install-from-net!');

		//let url = 'https://github.com/guttyon/vscode-extension-kuromaru/releases/download/v0.0.1/kuromaru-0.0.1.vsix';
		//let url = 'https://github.com/guttyon/vscode-extension-vsix-install-from-net/releases/download/v0.0.1/vsix-install-from-net-0.0.1.vsix';
		let ib = vscode.window.createInputBox();
		//ib.placeholder = 'https://github.com/';
		ib.prompt = 'enter url';
		ib.title = 'vsix-install-from-net';

		let url: string;
		function gethome(){
			let userhome = process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"];
			return userhome!;
		}
		function delay(ms: number){
			return new Promise(resolve => setTimeout(resolve, ms));
		}
		function getUriFile(fpath:string){
			let uri = vscode.Uri.from({path: fpath, scheme: 'file'});
			return uri;
		}
		function getexist(fpath:string){
			return fs.existsSync(fpath);
		}
		async function getsize(fpath:string){
			//let st = await vscode.workspace.fs.stat(getUriFile(fpath));
			let st = fs.statSync(fpath);
			return st.size;
		}
		function execTerminal(cmds:string[], dpath: string){
			const term = vscode.window.createTerminal ({name: 'vsix-install-from-net', cwd:dpath});
			//await term.processId;
			term.show(false);
			for(let cmdstr of cmds){
				term.sendText(cmdstr);
			}
			term.sendText('exit');
			return new Promise((resolve, reject) => {
				let disposeToken = vscode.window.onDidCloseTerminal((closeterm) => {
					if(closeterm === term){
						disposeToken.dispose();
						if(term.exitStatus !== undefined){
							resolve(term.exitStatus);
						}else{
							reject('terminal exit with undefined status.');
						}
					}
				});
			})
		}
		function validUrl(url:string){
			let uri = vscode.Uri.parse(url);
			console.log('valid?', uri);
			let isURL = (uri.scheme == 'http' || uri.scheme == 'https') && uri.path && uri.authority;
			let isVsix = uri.path.endsWith('.vsix');
			return isURL && isVsix;
		}
		async function dl_and_install(url : string){
			console.log('dl_and_install.1');
			//const term = vscode.window.createTerminal ({name: 'vsix-install-from-net', cwd:dpath});
			//await term.processId;
			
			let vsixname = url.split('/').at(-1);
			if(!vsixname)return;

			let home = gethome();
			let dpath = fs.mkdtempSync(path.join(home, 'vsix-install-from-net'));
			console.log('dl_and_install.2');
			let cmdstr_dl = [
				//`curl -o $env:temp/vscode-extension-vsix-install-from-net/ ${url}`
				//'cd $env:temp',
				//`echo "DOWNLOAD"`,
				//'pushd',
				//'mkdir $env:temp/vscode-extension-vsix-install-from-net',
				//'cd $env:temp/vscode-extension-vsix-install-from-net',
				//`cd ${dpath}`,
				`curl -OL ${url}`, // L:for redirect, O:filename
				//'popd',
			];
			console.log('dl_and_install.3');
			//term.show(false);
			let exitStatus = await execTerminal(cmdstr_dl, dpath);
			//term.state.isInteractedWith
			console.log(`dl_and_install.4, ${exitStatus}`);
			let vsixpath = path.join(dpath, vsixname);
			console.log(`dl_and_install.5, ${vsixpath}`);

			if(!getexist(vsixpath)){
				fs.rmSync(dpath, {recursive:true});
				vscode.window.showErrorMessage('failed download.');
				return;
			}
			let sz = await getsize(vsixpath);
			if(sz < 20){
				fs.rmSync(dpath, {recursive:true});
				vscode.window.showErrorMessage('failed download. file size less than 20 Bytes');
				return; // sizeが小さいとDL失敗とみなす。
			}

			console.log('dl_and_install.6');
			let msg = `install ${vsixname}? (${vsixpath})`;
			let sel = await vscode.window.showQuickPick(['yes', 'no'], {title: msg,});
			if(sel !== 'yes')return;
			console.log('dl_and_install.7');
			let cmdstr_install = [
				//`echo "INSTALL"`,
				//'pushd',
				//'cd $env:temp/vscode-extension-vsix-install-from-net',
				//`ls ${vsixname}`,
				//`cd ${dpath}`,
				`code --install-extension ${vsixname}`,
				//'popd',
			]
			exitStatus = await execTerminal(cmdstr_install, dpath);
			console.log('dl_and_install.8', exitStatus);
			fs.rmSync(dpath, {recursive:true});
			vscode.window.showInformationMessage('success install.');
		}

		ib.onDidChangeValue(e => {
			url = e;
		});
		//ib.validationMessage
		ib.onDidAccept(async e => {
			if(validUrl(url)){
				dl_and_install(url);
			}else{
				vscode.window.showErrorMessage('invalid url.');
			}
			ib.dispose();
		});
		ib.value = 'https://github.com/';
		ib.show();

	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
