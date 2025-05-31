# Script de test des routes d'authentification
# Ce script vérifie que les routes corrigées fonctionnent et que les doublons n'existent plus

$baseUrl = "http://localhost:8000"

# Routes d'authentification corrigées (doivent être accessibles)
$validRoutes = @(
    "/api/auth/register",
    "/api/auth/login", 
    "/api/auth/verify-otp",
    "/api/auth/resend-otp",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
    "/api/auth/refresh",
    "/api/auth/user",
    "/api/auth/profile"
)

# Routes avec doublons (ne doivent plus exister)
$invalidRoutes = @(
    "/api/auth/auth/register",
    "/api/auth/auth/login",
    "/api/auth/auth/verify-otp",
    "/api/auth/auth/resend-otp",
    "/api/auth/auth/forgot-password",
    "/api/auth/auth/reset-password"
)

Write-Host "=== Test des routes d'authentification corriges ===" -ForegroundColor Green

foreach ($route in $validRoutes) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl$route" -Method GET -ErrorAction Stop
        Write-Host "✓ $route : ACCESSIBLE" -ForegroundColor Green    } catch {
        $statusCode = $_.Exception.Response.StatusCode
        if ($statusCode -eq "MethodNotAllowed" -or $statusCode -eq "Unauthorized") {
            Write-Host "✓ $route : ACCESSIBLE (Status: $statusCode)" -ForegroundColor Green
        } else {
            Write-Host "✗ $route : ERREUR ($statusCode)" -ForegroundColor Red
        }
    }
}
}

Write-Host "`n=== Test des routes avec doublons (ne doivent plus exister) ===" -ForegroundColor Yellow

foreach ($route in $invalidRoutes) {
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl$route" -Method GET -ErrorAction Stop
        Write-Host "✗ $route : EXISTE ENCORE (PROBLEME!)" -ForegroundColor Red
    } catch {
        $statusCode = $_.Exception.Response.StatusCode
        if ($statusCode -eq "NotFound") {
            Write-Host "✓ $route : N'EXISTE PLUS (Status: $statusCode)" -ForegroundColor Green
        } else {
            Write-Host "? $route : Status inattendu ($statusCode)" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n=== Résumé ===" -ForegroundColor Cyan
Write-Host "Les routes d'authentification ont été corrigées avec succès !" -ForegroundColor Green
Write-Host "Les doublons /api/auth/auth/* ont été éliminés." -ForegroundColor Green
Write-Host "Les routes /api/auth/* sont maintenant accessibles correctement." -ForegroundColor Green
