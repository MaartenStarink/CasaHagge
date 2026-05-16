# Casa Hagge - PowerShell static file server
# Serves website/ files AND resolves ../Hagge foto's/ photo paths

$websiteRoot = $PSScriptRoot
$projectRoot = Split-Path $websiteRoot -Parent
$port        = 8080
$prefix      = "http://localhost:$port/"

$mimeTypes = @{
    '.html'  = 'text/html; charset=utf-8'
    '.css'   = 'text/css; charset=utf-8'
    '.js'    = 'text/javascript; charset=utf-8'
    '.jpg'   = 'image/jpeg'
    '.jpeg'  = 'image/jpeg'
    '.png'   = 'image/png'
    '.gif'   = 'image/gif'
    '.svg'   = 'image/svg+xml'
    '.ico'   = 'image/x-icon'
    '.woff2' = 'font/woff2'
    '.woff'  = 'font/woff'
    '.pdf'   = 'application/pdf'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($prefix)
$listener.Start()
Write-Host "Casa Hagge: http://localhost:$port/index.html" -ForegroundColor Green
Write-Host "Stop server: Ctrl+C" -ForegroundColor DarkGray

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $req     = $context.Request
        $resp    = $context.Response

        try {
            $localPath = $req.Url.LocalPath
            if ($localPath -eq '/' -or $localPath -eq '') { $localPath = '/index.html' }

            $decoded  = [System.Uri]::UnescapeDataString($localPath.TrimStart('/'))
            $decoded  = $decoded.Replace('/', [IO.Path]::DirectorySeparatorChar)

            $filePath = Join-Path $websiteRoot $decoded
            if (-not (Test-Path $filePath -PathType Leaf)) {
                $filePath = Join-Path $projectRoot $decoded
            }

            if (Test-Path $filePath -PathType Leaf) {
                $ext     = [IO.Path]::GetExtension($filePath).ToLower()
                $mime    = if ($mimeTypes[$ext]) { $mimeTypes[$ext] } else { 'application/octet-stream' }
                $content = [IO.File]::ReadAllBytes($filePath)

                $resp.StatusCode      = 200
                $resp.ContentType     = $mime
                $resp.ContentLength64 = [long]$content.LongLength
                $resp.OutputStream.Write($content, 0, $content.Length)
            } else {
                $body = [System.Text.Encoding]::UTF8.GetBytes('404 Not found')
                $resp.StatusCode      = 404
                $resp.ContentType     = 'text/plain; charset=utf-8'
                $resp.ContentLength64 = [long]$body.LongLength
                $resp.OutputStream.Write($body, 0, $body.Length)
            }
        } catch {
            Write-Host "Error $($req.Url.LocalPath): $_" -ForegroundColor Red
            try { $resp.StatusCode = 500 } catch {}
        } finally {
            try { $resp.Close() } catch {}
        }
    }
} finally {
    $listener.Stop()
}
