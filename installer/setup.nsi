; BioDockify Professional Installer Script
; Uses NSIS Modern User Interface (MUI2)

!include "MUI2.nsh"
!include "LogicLib.nsh"

;--------------------------------
;General

  !define APPNAME "BioDockify"
  !define PRODUCT_NAME "BioDockify"
  !define PRODUCT_VERSION "2.13.38"
  !define PRODUCT_PUBLISHER "BioDockify Team"
  Name "${APPNAME} AI"
  OutFile "..\BioDockify_Professional_Setup_v2.13.38.exe"
  
  ; safe install directory
  InstallDir "$PROGRAMFILES64\${APPNAME}"
  
  ; Get installation folder from registry if available
  InstallDirRegKey HKCU "Software\${APPNAME}" ""

  ; Request admin privileges for installation
  RequestExecutionLevel admin

  !define MUI_ABORTWARNING
  
  ; --- BRANDING ---
  !define MUI_ICON "..\desktop\tauri\src-tauri\icons\icon.ico"
  !define MUI_UNICON "..\desktop\tauri\src-tauri\icons\icon.ico"
  !define MUI_HEADERIMAGE
  !define MUI_HEADERIMAGE_BITMAP "..\desktop\tauri\src-tauri\icons\icon.bmp"
  
  ; Pages

  !insertmacro MUI_PAGE_WELCOME
  !insertmacro MUI_PAGE_LICENSE "..\LICENSE"
  !insertmacro MUI_PAGE_COMPONENTS
  !insertmacro MUI_PAGE_DIRECTORY
  !insertmacro MUI_PAGE_INSTFILES
  !insertmacro MUI_PAGE_FINISH
  
  !insertmacro MUI_UNPAGE_CONFIRM
  !insertmacro MUI_UNPAGE_INSTFILES
  
  !insertmacro MUI_LANGUAGE "English"

  ; ... (header omitted)

Section "Prerequisites" SecPrereq
  DetailPrint "Checking for Docker Desktop..."
  
  ; Strategy 1: Check Uninstall Registry Key (Standard for Apps)
  ReadRegStr $0 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Docker Desktop" "InstallLocation"
  StrCmp $0 "" check_default_path docker_found_reg
  
  check_default_path:
  ; Strategy 2: Check Default Install Path
  IfFileExists "$PROGRAMFILES\Docker\Docker\Docker Desktop.exe" docker_found_file check_cli
  
  check_cli:
  ; Strategy 3: Check active CLI command (Last Resort)
  ClearErrors
  ExecWait 'docker -v' $1
  IfErrors docker_missing ; Command not found
  ${If} $1 == 0
    Goto docker_found_cli
  ${EndIf}
  
  docker_missing:
  ; If ALL checks failed:
  MessageBox MB_YESNO|MB_ICONEXCLAMATION "Docker Desktop is REQUIRED but not found.$\n$\nBioDockify needs Docker to run the AI engine.$\n$\nClick YES to download Docker Desktop now.$\nClick NO to proceed anyway (Not Recommended)." IDYES download IDNO proceed
  
  download:
    ExecShell "open" "https://www.docker.com/products/docker-desktop/"
    MessageBox MB_OK "Please install Docker Desktop, then run this installer again."
    Abort "Installation cancelled by user."
    
  proceed:
    DetailPrint "Warning: Proceeding without detecting Docker."
    Goto done

  docker_found_reg:
    DetailPrint "Docker Registry Key found."
    Goto done
    
  docker_found_file:
    DetailPrint "Docker Executable found."
    Goto done
    
  docker_found_cli:
    DetailPrint "Docker CLI found."

  done:
SectionEnd

Section "Install Files" SecInstall

  SetOutPath "$INSTDIR"
  
  ; Install the Main Application Binary
  File "..\desktop\tauri\src-tauri\target\release\BioDockify.exe"
  
  ; Install the Sidecar (AI Engine)
  File "..\desktop\tauri\src-tauri\binaries\biodockify-engine-x86_64-pc-windows-msvc.exe"
  
  ; Install README
  File "..\README.txt"
  
  ; Create Structure Directories
  CreateDirectory "$INSTDIR\data"
  CreateDirectory "$INSTDIR\assets"
  CreateDirectory "$INSTDIR\certs"

  ; Store installation folder
  WriteRegStr HKCU "Software\BioDockify" "" $INSTDIR
  
  ; Create uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"

  ; Create Shortcuts
  CreateDirectory "$SMPROGRAMS\BioDockify"
  CreateShortcut "$SMPROGRAMS\BioDockify\BioDockify AI.lnk" "$INSTDIR\BioDockify.exe"
  CreateShortcut "$SMPROGRAMS\BioDockify\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  
  ; Auto-Start on System Boot
  CreateShortcut "$SMSTARTUP\BioDockify AI.lnk" "$INSTDIR\BioDockify.exe"
  
SectionEnd

Section "Desktop Shortcut" SecDesktop
  CreateShortcut "$DESKTOP\BioDockify AI.lnk" "$INSTDIR\BioDockify.exe"
SectionEnd


;--------------------------------
;Uninstaller Section

Section "Uninstall"

  ; Remove Files
  Delete "$INSTDIR\BioDockify.exe"
  Delete "$INSTDIR\biodockify-engine-x86_64-pc-windows-msvc.exe"
  Delete "$INSTDIR\README.txt"
  Delete "$INSTDIR\Uninstall.exe"
  
  ; Remove Directories (empty only)
  RMDir "$INSTDIR\data"
  RMDir "$INSTDIR\assets"
  RMDir "$INSTDIR\certs"
  
  ; Remove the installation directory ONLY if it's empty
  RMDir "$INSTDIR"

  ; Remove Shortcuts
  Delete "$SMPROGRAMS\BioDockify\BioDockify AI.lnk"
  Delete "$SMPROGRAMS\BioDockify\Uninstall.lnk"
  RMDir "$SMPROGRAMS\BioDockify"
  Delete "$SMSTARTUP\BioDockify AI.lnk"
  Delete "$DESKTOP\BioDockify AI.lnk"

  ; Remove Registry Keys
  DeleteRegKey /ifempty HKCU "Software\BioDockify"

SectionEnd
