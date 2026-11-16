; Register the installed app, preserving a previously chosen startup opt-out.
!macro customInstall
  ReadINIStr $R0 "$APPDATA\ScreenColor\installed-startup.ini" "Startup" "Enabled"
  StrCmp $R0 "0" screenColorStartupDone
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Screen Color" '"$INSTDIR\Screen Color.exe" --background'
  screenColorStartupDone:
!macroend

; Keep saved profiles/settings on uninstall; remove only the automatic launch.
!macro customUnInstall
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Screen Color"
!macroend
