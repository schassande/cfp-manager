#!/usr/bin/env pwsh
# Test script for createPerson Firebase Cloud Function

$PROJECT_ID = "conference-manager-007"
$REGION = "us-central1"
$EMULATOR_HOST = "localhost:5001"

# Test data - Person object matching frontend person.model.ts
$testPerson1 = @{
    firstName = "Jean"
    lastName = "Dupont"
    email = "jean.dupont@example.com"
    hasAccount = $false
    preferredLanguage = "fr"
} | ConvertTo-Json

$testPerson2 = @{
    firstName = "Marie"
    lastName = "Martin"
    email = "marie.martin@example.com"
    hasAccount = $false
    preferredLanguage = "en"
} | ConvertTo-Json

Write-Host "=== Testing createPerson Cloud Function ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Test 1: Create a new person (should return 201)" -ForegroundColor Yellow
Write-Host "Payload: $testPerson1"
$response1 = Invoke-WebRequest -Uri "http://$EMULATOR_HOST/$PROJECT_ID/$REGION/createPerson" `
    -Method POST `
    -Body $testPerson1 `
    -ContentType "application/json" `
    -PassThru `
    -ErrorAction Continue

Write-Host "Status: $($response1.StatusCode)" -ForegroundColor Green
$result1 = $response1.Content | ConvertFrom-Json
Write-Host "Response: $($result1 | ConvertTo-Json)" -ForegroundColor Green
Write-Host ""

Write-Host "Test 2: Try to create same person again (should return 409 - Email Exists)" -ForegroundColor Yellow
$response2 = Invoke-WebRequest -Uri "http://$EMULATOR_HOST/$PROJECT_ID/$REGION/createPerson" `
    -Method POST `
    -Body $testPerson1 `
    -ContentType "application/json" `
    -PassThru `
    -ErrorAction Continue

Write-Host "Status: $($response2.StatusCode)" -ForegroundColor Green
$result2 = $response2.Content | ConvertFrom-Json
Write-Host "Response: $($result2 | ConvertTo-Json)" -ForegroundColor Green
Write-Host ""

Write-Host "Test 3: Create another person with different email (should return 201)" -ForegroundColor Yellow
Write-Host "Payload: $testPerson2"
$response3 = Invoke-WebRequest -Uri "http://$EMULATOR_HOST/$PROJECT_ID/$REGION/createPerson" `
    -Method POST `
    -Body $testPerson2 `
    -ContentType "application/json" `
    -PassThru `
    -ErrorAction Continue

Write-Host "Status: $($response3.StatusCode)" -ForegroundColor Green
$result3 = $response3.Content | ConvertFrom-Json
Write-Host "Response: $($result3 | ConvertTo-Json)" -ForegroundColor Green
Write-Host ""

Write-Host "Test 4: Test with missing email (should return 400)" -ForegroundColor Yellow
$invalidPerson = @{
    firstName = "Test"
    lastName = "User"
    hasAccount = $false
    preferredLanguage = "en"
} | ConvertTo-Json

$response4 = Invoke-WebRequest -Uri "http://$EMULATOR_HOST/$PROJECT_ID/$REGION/createPerson" `
    -Method POST `
    -Body $invalidPerson `
    -ContentType "application/json" `
    -PassThru `
    -ErrorAction Continue

Write-Host "Status: $($response4.StatusCode)" -ForegroundColor Green
$result4 = $response4.Content | ConvertFrom-Json
Write-Host "Response: $($result4 | ConvertTo-Json)" -ForegroundColor Green
Write-Host ""

Write-Host "=== All tests completed ===" -ForegroundColor Cyan
