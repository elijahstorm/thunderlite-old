@echo off
title ThunderDebugger
del "C:\Users\Eli\Documents\Battalion\mongo\db\mongod.lock"

start C:\Users\Eli\Documents\Battalion\mongo\bin\mongod --dbpath "C:\Users\Eli\Documents\Battalion\mongo\db"
cd C:\Users\Eli\ThunderLite
start heroku local web
