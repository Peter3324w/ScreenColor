'use strict';
module.exports={
 appId:'Peter.ScreenColor',productName:'Screen Color',asar:true,npmRebuild:false,
 directories:{output:'release',buildResources:'build'},
 files:['package.json','out/electron/**/*','out/lib/**/*','out/ui/**/*','out/shared/**/*','licenses/**/*'],
 extraResources:[{from:'native/bin/ColorHost.exe',to:'native/ColorHost.exe'}],
 win:{target:[{target:'nsis',arch:['x64']}],icon:'build/icon.ico',artifactName:'Screen-Color-Setup-${version}-${arch}.${ext}'},
 nsis:{oneClick:false,perMachine:false,allowElevation:false,allowToChangeInstallationDirectory:true,createDesktopShortcut:true,createStartMenuShortcut:true,shortcutName:'Screen Color',runAfterFinish:true,deleteAppDataOnUninstall:false,include:'build/installer.nsh',installerIcon:'build/icon.ico',uninstallerIcon:'build/icon.ico'},
 publish:null
};
