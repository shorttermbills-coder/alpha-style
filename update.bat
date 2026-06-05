@echo off

python generate.py

git add .

git commit -m "catalog update"

git push

pause