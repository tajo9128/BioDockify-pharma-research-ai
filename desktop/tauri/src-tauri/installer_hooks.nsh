!include LogicLib.nsh

Function CheckDocker
  ClearErrors
  ; Check if Docker CLI is available
  ExecWait 'docker -v' $0
  
  ${If} $0 != 0
    ; Check Registry as fallback
    ReadRegStr $1 HKLM "SOFTWARE\Docker Inc.\Docker\1.0" "AppPath"
    ${If} $1 == ""
      Goto prompt_install
    ${EndIf}
  ${EndIf}
  Goto done

  prompt_install:
    MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "Docker Desktop is required but not installed.$\n$\nBioDockify needs Docker to run the AI engine.$\n$\nClick 'Retry' after installing Docker, or 'Cancel' to exit." IDRETRY retry IDCANCEL abort
    
  retry:
    ExecShell "open" "https://www.docker.com/products/docker-desktop/"
    MessageBox MB_OK "Please verify installation and ensure Docker is running."
    Call CheckDocker
    Return

  abort:
    Abort "Installation cancelled. Docker is required."

  done:
FunctionEnd

Section
  Call CheckDocker
SectionEnd
