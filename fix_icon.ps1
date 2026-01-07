
Add-Type -AssemblyName System.Drawing
$source = "$PSScriptRoot\desktop\tauri\src-tauri\icons\icon.png"
$dest = "$PSScriptRoot\desktop\tauri\src-tauri\icons\icon_fixed.png"
Write-Host "Reading from: $source"
$img = [System.Drawing.Image]::FromFile($source)
$img.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
$img.Dispose()
Write-Host "Converted to PNG at: $dest"
