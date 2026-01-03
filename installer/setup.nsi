; Pharma Research AI - NSIS Installer Script
; Zero-Cost, Offline-First, Desktop Edition
;--------------------------------

!include "MUI2.nsh"
!include "LogicLib.nsh"

; General
Name "BioDockify Pharma Research AI"
OutFile "BioDockify_Setup.exe"
Unicode True
InstallDir "$LOCALAPPDATA\BioDockify"
InstallDirRegKey HKCU "Software\BioDockify" ""
RequestExecutionLevel user ; Install for current user only

; Branding
BrandingText "BioDockify - Zero-Cost Pharma Research"

;--------------------------------
; Interface Settings

!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"

;--------------------------------
; Pages

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "..\LICENSE" ; Ensure LICENSE exists or comment out
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

;--------------------------------
; Languages

!insertmacro MUI_LANGUAGE "English"

;--------------------------------
; Component: Core Application
Section "BioDockify Core (Required)" SecCore
  SectionIn RO
  
  SetOutPath "$INSTDIR"
  
  ; 1. Install the Tauri Executable (Frontend Wrapper)
  ; Assumes you have run 'npm run tauri build' first
  ; Paths are relative to this .nsi file
  File "..\desktop\tauri\src-tauri\target\release\bio-dockify.exe"
  
  ; 2. Install the Python Backend Source code
  ; We copy the source so the 'python' command can run it.
  ; Alternatively, you could use PyInstaller to make 'main_research.exe' and bundle that.
  
  CreateDirectory "$INSTDIR\api"
  File /r "..\api\*" "$INSTDIR\api"
  
  CreateDirectory "$INSTDIR\modules"
  File /r "..\modules\*" "$INSTDIR\modules"
  
  CreateDirectory "$INSTDIR\orchestration"
  File /r "..\orchestration\*" "$INSTDIR\orchestration"
  
  File "..\main_research.py"
  File "..\requirements.txt"
  
  ; 3. Create Data Directories (The "Brain")
  CreateDirectory "$INSTDIR\brain"
  CreateDirectory "$INSTDIR\brain\models"
  CreateDirectory "$INSTDIR\brain\knowledge_graph"
  CreateDirectory "$INSTDIR\brain\vectors"
  CreateDirectory "$INSTDIR\data\papers"
  
  ; Write Uninstaller
  WriteUninstaller "$INSTDIR\Uninstall.exe"
  
  ; Registry Keys
  WriteRegStr HKCU "Software\BioDockify" "" $INSTDIR
  
  ; Create Shortcuts
  CreateDirectory "$SMPROGRAMS\BioDockify"
  CreateShortcut "$SMPROGRAMS\BioDockify\BioDockify.lnk" "$INSTDIR\bio-dockify.exe"
  CreateShortcut "$SMPROGRAMS\BioDockify\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
  
SectionEnd

;--------------------------------
; Component: Python Environment Check
Section "Python Environment Check" SecPython
    ; Check if Python is available in PATH
    ExecWait "python --version" $0
    ${If} $0 != 0
        MessageBox MB_OK "Warning: Python 3.10+ is required to run the AI features but was not found in your PATH.$\n\nPlease install Python and run: pip install -r $INSTDIR\requirements.txt"
    ${EndIf}
SectionEnd

;--------------------------------
; Descriptions

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
  !insertmacro MUI_DESCRIPTION_TEXT ${SecCore} "The complete BioDockify application."
  !insertmacro MUI_DESCRIPTION_TEXT ${SecPython} "Checks for Python availability."
!insertmacro MUI_FUNCTION_DESCRIPTION_END

;--------------------------------
; Uninstaller Section

Section "Uninstall"

  ; Remove Files
  Delete "$INSTDIR\bio-dockify.exe"
  Delete "$INSTDIR\main_research.py"
  Delete "$INSTDIR\requirements.txt"
  Delete "$INSTDIR\Uninstall.exe"
  
  RMDir /r "$INSTDIR\api"
  RMDir /r "$INSTDIR\modules"
  RMDir /r "$INSTDIR\orchestration"
  
  ; Preserve user data in brain/ and data/
  
  ; Remove Shortcuts
  Delete "$SMPROGRAMS\BioDockify\*.lnk"
  RMDir "$SMPROGRAMS\BioDockify"

  ; Remove Registry
  DeleteRegKey HKCU "Software\BioDockify"

SectionEnd
