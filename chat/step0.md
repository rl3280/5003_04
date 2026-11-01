# Step 0 CLI commands

## Create folders
```powershell
mkdir out\qwen, web
```

## List cached models
```powershell
geniex list
```

## Start the GenieX server (leave this terminal open)
```powershell
geniex serve --nctx 8192
```

## Verify the server (run in a second terminal)
```powershell
netstat -ano | Select-String 18181
curl.exe http://127.0.0.1:18181/v1/models
```
