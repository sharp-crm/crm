$env:AWS_ACCESS_KEY_ID = 'AKIA2QG6ASQROAJCY'
$env:AWS_SECRET_ACCESS_KEY = 'TnhC0kuPhyuOE1AH/KMtQHU2S900yUXYNKU1cSTO'
$env:AWS_REGION = 'eu-north-1'
$env:JWT_SECRET = 'sharp-crm-secret-key-2024'
$env:JWT_REFRESH_SECRET = 'sharp-crm-refresh-secret-key-2024'

Write-Host "Environment variables set. Running database initialization..."
npm run init-db 