Set WshShell = CreateObject("WScript.Shell")
projectDir = "C:\Users\Luci\Desktop\Apiquick"
nodePath = projectDir & "\nodejs\node.exe"
scriptPath = projectDir & "\backend\dist\index.js"

WshShell.Popup "Apiquick is starting..." & vbCrLf & "Browser will open automatically.", 1, "Apiquick", 64

WshShell.Run """" & nodePath & """ """ & scriptPath & """", 0, False

Set WshShell = Nothing
