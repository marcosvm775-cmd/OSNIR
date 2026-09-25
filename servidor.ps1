# Servidor Local Ultraleve Offline OSNIR TURISMO para Windows
# Roda em segundo plano sem gastar CPU e garante 100% que o sistema nunca de tela branca no computador.

$port = 38450
$folder = "$PSScriptRoot\sistema"
if (-not (Test-Path $folder)) { $folder = "$PSScriptRoot\dist" }
if (-not (Test-Path $folder)) { $folder = $PSScriptRoot }

# 1. Verifica se o servidor ja esta em execucao
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", $port)
    $tcp.Close()
    exit 0
} catch {
    # Nao esta rodando, prossegue para iniciar o servico local
}

# 2. Inicia o HttpListener nativo do Windows
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$port/")
try {
    $listener.Start()
} catch {
    exit 0
}

# 3. Loop de atendimento a requisicoes
while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $localPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($localPath)) { $localPath = "index.html" }
        $filePath = Join-Path $folder $localPath

        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = switch ($ext) {
                ".html"  { "text/html; charset=utf-8" }
                ".js"    { "application/javascript; charset=utf-8" }
                ".mjs"   { "application/javascript; charset=utf-8" }
                ".css"   { "text/css; charset=utf-8" }
                ".png"   { "image/png" }
                ".jpg"   { "image/jpeg" }
                ".jpeg"  { "image/jpeg" }
                ".svg"   { "image/svg+xml" }
                ".ico"   { "image/x-icon" }
                ".json"  { "application/json; charset=utf-8" }
                ".woff"  { "font/woff" }
                ".woff2" { "font/woff2" }
                default  { "application/octet-stream" }
            }
            $response.ContentType = $mime
            $response.Headers.Add("Access-Control-Allow-Origin", "*")
            $response.Headers.Add("Cache-Control", "no-cache")
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    } catch {
        # Silencia erros transientes
    }
}
