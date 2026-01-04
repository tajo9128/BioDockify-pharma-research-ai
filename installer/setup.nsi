; BioDockify Professional Installer Script
; Uses NSIS Modern User Interface (MUI2)

!include "MUI2.nsh"
!include "LogicLib.nsh"

;--------------------------------
;General

  Name "BioDockify AI"
  OutFile "BioDockify_Setup_v2.0.exe"
  Unicode True

  ; Default installation folder
  InstallDir "$LOCALAPPDATA\BioDockify"
  
  ; Get installation folder from registry if available
  InstallDirRegKey HKCU "Software\BioDockify" ""

  ; Request application privileges for Windows Vista+
  RequestExecutionLevel user

;--------------------------------
;Interface Settings

  !define MUI_ABORTWARNING
  !define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"

;--------------------------------
;Pages

  !define MUI_WELCOMEPAGE_TITLE "Welcome to BioDockify AI Setup"
  !define MUI_WELCOMEPAGE_TEXT "Setup will guide you through the installation of BioDockify AI - The Autonomous PhD Research Assistant.$\r$\n$\r$\nPre-requisites:$\r$\n- Docker Desktop (Required for AI Engine)"
  
  !insertmacro MUI_PAGE_WELCOME
  !insertmacro MUI_PAGE_LICENSE "EULA.txt"
  !insertmacro MUI_PAGE_DIRECTORY
  !insertmacro MUI_PAGE_INSTFILES
  !insertmacro MUI_PAGE_FINISH

  !insertmacro MUI_UNPAGE_CONFIRM
  !insertmacro MUI_UNPAGE_INSTFILES

;--------------------------------
;Languages
 
  !insertmacro MUI_LANGUAGE "English"

;--------------------------------
;Installer Sections

Section "Prerequisites" SecPrereq
  DetailPrint "Checking for Docker Desktop..."
  
  ; Check if Docker CLI is available
  ExecWait 'docker -v' $0
  
  ${If} $0 != 0
    ; Check Registry as fallback
    ReadRegStr $1 HKLM "SOFTWARE\Docker Inc.\Docker\1.0" "AppPath"
    ${If} $1 == ""
       MessageBox MB_YESNO|MB_ICONEXCLAMATION "Docker Desktop is required but not found.$\n$\nBioDockify needs Docker to run the AI engine.$\n$\nWould you like to download it now?" IDYES download IDNO proceed
       
       download:
         ExecShell "open" "https://www.docker.com/products/docker-desktop/"
         MessageBox MB_OK "Please install Docker Desktop and then restart this installer."
         Quit
         
       proceed:
         DetailPrint "Warning: Proceeding without detecting Docker."
    ${EndIf}
  ${EndIf}
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
