# Gera o APK assinado em frontend/dist-apk/Runarcana.apk.
# Ferramentas e chave ficam fora do repositorio (ANDROID_BUILD_ROOT, padrao E:\AndroidBuild).
$ErrorActionPreference = 'Stop'
$root = if ($env:ANDROID_BUILD_ROOT) { $env:ANDROID_BUILD_ROOT } else { 'E:\AndroidBuild' }
$env:JAVA_HOME = "$root\jdk21"
$env:ANDROID_HOME = "$root\sdk"
$env:GRADLE_USER_HOME = "$root\gradle"

$props = @{}
Get-Content "$root\keystore.properties" | ForEach-Object {
  $k, $v = $_ -split '=', 2
  $props[$k] = $v
}

$frontend = Split-Path $PSScriptRoot -Parent
Set-Location $frontend
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw 'cap sync falhou' }

Set-Location "$frontend\android"
.\gradlew.bat assembleRelease --no-daemon `
  "-Pandroid.injected.signing.store.file=$root\runarcana-release.jks" `
  "-Pandroid.injected.signing.store.password=$($props['password'])" `
  "-Pandroid.injected.signing.key.alias=runarcana" `
  "-Pandroid.injected.signing.key.password=$($props['password'])"
if ($LASTEXITCODE -ne 0) { throw 'build do APK falhou' }

New-Item -ItemType Directory -Force "$frontend\dist-apk" | Out-Null
Copy-Item 'app\build\outputs\apk\release\app-release.apk' "$frontend\dist-apk\Runarcana.apk" -Force
Write-Host "APK gerado em $frontend\dist-apk\Runarcana.apk"
