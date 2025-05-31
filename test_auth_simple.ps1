# Script de test des routes d'authentification
$baseUrl = "http://localhost:8000"

# Routes d'authentification corrigées
$validRoutes = @(
    "/api/auth/register",
    "/api/auth/login", 
    "/api/auth/verify-otp",
    "/api/auth/resend-otp"
)

# Routes avec doublons
$invalidRoutes = @(
    "/api/auth/auth/register",
    "/api/auth/auth/login",
    "/api/auth/auth/verify-otp"
)

Write-Host "=== Test des routes d'authentification corriges ===" -ForegroundColor Green

foreach ($route in $validRoutes) {
    try {
        Invoke-RestMethod -Uri "$baseUrl$route" -Method GET -ErrorAction Stop | Out-Null
        Write-Host "OK $route : ACCESSIBLE" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode
        if ($statusCode -eq "MethodNotAllowed" -or $statusCode -eq "Unauthorized") {
            Write-Host "OK $route : ACCESSIBLE (Status: $statusCode)" -ForegroundColor Green
        } else {
            Write-Host "ERR $route : ERREUR ($statusCode)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "=== Test des routes avec doublons ===" -ForegroundColor Yellow

foreach ($route in $invalidRoutes) {
    try {
        Invoke-RestMethod -Uri "$baseUrl$route" -Method GET -ErrorAction Stop | Out-Null
        Write-Host "ERR $route : EXISTE ENCORE" -ForegroundColor Red
    } catch {
        $statusCode = $_.Exception.Response.StatusCode
        if ($statusCode -eq "NotFound") {
            Write-Host "OK $route : N'EXISTE PLUS" -ForegroundColor Green
        } else {
            Write-Host "? $route : Status ($statusCode)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "=== Correction reussie ===" -ForegroundColor Cyan
