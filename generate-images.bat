@echo off
echo Generating placeholder images with ImageMagick...

REM Create directory if it doesn't exist
if not exist "src\assets\generated" mkdir "src\assets\generated"

REM Array of colors for variety
set colors[0]=#FF6B6B
set colors[1]=#4ECDC4
set colors[2]=#45B7D1
set colors[3]=#96CEB4
set colors[4]=#FFEAA7
set colors[5]=#DDA0DD
set colors[6]=#98D8C8
set colors[7]=#6C5CE7
set colors[8]=#A29BFE
set colors[9]=#FD79A8

for /l %%i in (1,1,250) do (
    set /a colorIndex=%%i %% 10
    call set currentColor=%%colors[!colorIndex!]%%
    
    REM Generate image with gradient and text
    magick -size 72x45 gradient:!currentColor!-white -gravity center -pointsize 8 -fill black -annotate +0+0 "%%i" "src\assets\generated\img-%%i.png"
    
    REM Show progress every 50 images
    set /a progress=%%i %% 50
    if !progress!==0 echo Generated %%i/250 images...
)

echo ✅ Successfully generated 250 images in src\assets\generated\
echo 📁 Images saved as: img-1.png, img-2.png, ... img-250.png
pause
