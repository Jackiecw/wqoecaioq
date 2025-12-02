$files = Get-ChildItem -Path "frontend/src/components" -Recurse -Filter "*.vue"
foreach ($file in $files) {
    if ($file.Directory.Name -ne "components") {
        $content = Get-Content $file.FullName -Raw
        $newContent = $content -replace "(['`"])\.\./api", "`$1../../api" `
                               -replace "(['`"])\.\./stores", "`$1../../stores" `
                               -replace "(['`"])\.\./utils", "`$1../../utils" `
                               -replace "(['`"])\.\./assets", "`$1../../assets"
        if ($content -ne $newContent) {
            Write-Host "Updating $($file.Name)"
            Set-Content -Path $file.FullName -Value $newContent -NoNewline
        }
    }
}
