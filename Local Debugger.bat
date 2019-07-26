@echo off
title ThunderDebugger
start C:\Users\Eli\Documents\Battalion\mongo\bin\mongod --dbpath "C:\Users\Eli\Documents\Battalion\mongo\db"
cd C:\Users\Eli\ThunderLite
start heroku local web
start chrome.exe --new-window localhost:5000
