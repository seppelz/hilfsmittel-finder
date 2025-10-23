Param(
  [Parameter(Mandatory = $true)]
  [string]$Group = '09.12',
  [int]$Skip = 0,
  [int]$Take = 50,
  [string]$Output = "products_$($Group.Replace('.', '-'))_skip${Skip}_take${Take}.json"
)

$ErrorActionPreference = 'Stop'

Write-Host "Fetching group $Group (skip=$Skip, take=$Take)..."
$Url = "https://hilfsmittel-api.gkv-spitzenverband.de/api/verzeichnis/Produkt?produktgruppennummer=$Group&skip=$Skip&take=$Take&`$count=true"
$Raw = (Invoke-WebRequest -Uri $Url -UseBasicParsing).Content

$OutputPath = Join-Path -Path (Get-Location) -ChildPath $Output
[System.IO.File]::WriteAllText($OutputPath, $Raw, [System.Text.Encoding]::UTF8)

Write-Host "Saved raw payload to $OutputPath"