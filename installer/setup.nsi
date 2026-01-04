; BioDockify Professional Installer Script
; Uses NSIS Modern User Interface (MUI2)

!include "MUI2.nsh"
!include "LogicLib.nsh"

;--------------------------------
;General

  Name "BioDockify AI"
  OutFile "BioDockify_Professional_Setup_v2.0.exe"

  ; ... (header omitted)

Section "Prerequisites" SecPrereq
  DetailPrint "Checking for Docker Desktop..."
  
  ; Strategy 1: Check Registry (Most Reliable)
  ReadRegStr $0 HKLM "SOFTWARE\Docker Inc.\Docker\1.0" "AppPath"
  StrCmp $0 "" check_cli docker_found
  
  check_cli:
  ; Strategy 2: Check active CLI command
  ExecWait 'docker -v' $1
  ${If} $1 == 0
    Goto docker_found
  ${EndIf}
  
  ; If both failed:
  MessageBox MB_YESNO|MB_ICONEXCLAMATION "Docker Desktop is REQUIRED but not found.$\n$\nBioDockify needs Docker to run the AI engine.$\n$\nClick YES to download Docker Desktop now.$\nClick NO to proceed anyway (Not Recommended)." IDYES download IDNO proceed
  
  download:
    ExecShell "open" "https://www.docker.com/products/docker-desktop/"
    MessageBox MB_OK "Please install Docker Desktop, then run this installer again."
    Abort "Installation cancelled by user."
    
  proceed:
    DetailPrint "Warning: Proceeding without detecting Docker."
    Goto done

  docker_found:
    DetailPrint "Docker Desktop found."

  done:
SectionEnd

Section "Install Files" SecInstall

  SetOutPath "$INSTDIR"
  
  ; Install the Main Application Binary
  File "..\desktop\tauri\src-tauri\target\release\biodockify-ai.exe"
  
  ; Install the Sidecar (AI Engine)
  ; Note: Tauri expects sidecars to be named specifically with architecture in target triple
  ; We manually renamed it in the workflow to: biodockify-engine-x86_64-pc-windows-msvc.exe
  File "..\desktop\tauri\src-tauri\binaries\biodockify-engine-x86_64-pc-windows-msvc.exe"
  
  ; Copy any other resources/dlls if needed
  ; (Usually Tauri statically links mostly, but WebView2 is system dep)
  
  ; Store installation folder
  WriteRegStr HKCU "Software\BioDockify" "" $INSTDIR
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Create Shortcuts
  CreateDirectory "$SMPROGRAMS\BioDockify"
  CreateShortcut "$SMPROGRAMS\BioDockify\BioDockify AI.lnk" "$INSTDIR\biodockify-ai.exe"
  CreateShortcut "$SMPROGRAMS\BioDockify\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  
SectionEnd

;--------------------------------
;Uninstaller Section

Section "Uninstall"

  Delete "$INSTDIR\biodockify-ai.exe"
  Delete "$INSTDIR\Uninstall.exe"
  RMDir /r "$INSTDIR"

  Delete "$SMPROGRAMS\BioDockify\BioDockify AI.lnk"
  Delete "$SMPROGRAMS\BioDockify\Uninstall.lnk"
  RMDir "$SMPROGRAMS\BioDockify"

  DeleteRegKey /ifempty HKCU "Software\BioDockify"

SectionEnd
