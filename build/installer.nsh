!include "LogicLib.nsh"
!include "nsDialogs.nsh"

!macro customInit
  ; Remove all download prompts.
  ; Just a single message as requested.
  MessageBox MB_OK "IMPORTANT: After installation is complete, please launch the application and click the 'UPGRADE APP' button to download and install all necessary dependencies (Nmap, Python, Whois, etc.) into the installation folder."
!macroend
