Set fso = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")
projectDir = fso.GetParentFolderName(WScript.ScriptFullName)
nodePath = projectDir & "\nodejs\node.exe"
scriptPath = projectDir & "\backend\dist\index.js"

WshShell.CurrentDirectory = projectDir
WshShell.Popup "Apiquick is starting..." & vbCrLf & "Browser will open automatically.", 1, "Apiquick", 64
WshShell.Run """" & nodePath & """ """ & scriptPath & """", 0, False

Set WshShell = Nothing
Set fso = Nothing
