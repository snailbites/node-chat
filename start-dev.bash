#!/bin/bash

SERVER_LOG="server.log"
GRUNT_LOG="grunt.log"
NEWLINE=""
ARROW="===>"

echo $NEWLINE
echo "Starting server with supervisor and sending output to $SERVER_LOG..."
echo "$ARROW nohup supervisor -i public,client server > $SERVER_LOG &"
nohup supervisor -i public,client server > $SERVER_LOG &

echo $NEWLINE
echo "Watching public source files for changes and sending output to $GRUNT_LOG..."
echo "$ARROW nohup grunt watch > $GRUNT_LOG &"
nohup grunt watch > grunt.log &

echo $NEWLINE
echo "Tailing $SERVER_LOG and $GRUNT_LOG..."
echo "$ARROW tail -f $SERVER_LOG $GRUNT_LOG"
echo "(exit: ^C)"
echo $NEWLINE
tail -f $SERVER_LOG $GRUNT_LOG

