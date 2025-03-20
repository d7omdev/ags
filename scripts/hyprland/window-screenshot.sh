#!/bin/bash

# Create directory
mkdir -p /tmp/app-screenshot

# Usage information
if [ $# -ne 1 ]; then
	echo "Usage: $0 <pid>"
	echo "Available windows with indices:"
	hyprctl clients -j | jq -r 'to_entries | .[] | "\(.key): PID \(.value.pid) - \(.value.class) - \(.value.title)"'
	exit 1
fi

# Get window PID from argument
win_pid=$1

# Get the window's list index
window_index=$(hyprctl clients -j | jq -r --arg pid "$win_pid" 'to_entries | .[] | select(.value.pid | tostring == $pid) | .key')

if [ -z "$window_index" ] || [ "$window_index" == "null" ]; then
	echo "No window found with PID: $win_pid"
	exit 1
fi

# Get window data using the index
window_json=$(hyprctl clients -j | jq --arg idx "$window_index" '.[$idx | tonumber]')
class=$(echo "$window_json" | jq -r '.class')
x=$(echo "$window_json" | jq -r '.at[0]')
y=$(echo "$window_json" | jq -r '.at[1]')
width=$(echo "$window_json" | jq -r '.size[0]')
height=$(echo "$window_json" | jq -r '.size[1]')
monitor_id=$(echo "$window_json" | jq -r '.monitor')
monitor_name=$(hyprctl monitors -j | jq -r --arg id "$monitor_id" '.[] | select(.id == ($id | tonumber)) | .name')

# Generate output filename
timestamp=$(date +%s)
output_file="/tmp/app-screenshot/${class}-${win_pid}-${timestamp}.png"

echo "Window: $class (PID: $win_pid, Index: $window_index)"
echo "Position: $x,$y on monitor $monitor_name ($monitor_id)"
echo "Size: ${width}x${height}"

# Take the screenshot
echo "Taking screenshot with geometry: ${x},${y} ${width}x${height}"
grim -o "$monitor_name" -g "${x},${y} ${width}x${height}" "$output_file"

if [ -f "$output_file" ]; then
	echo "Screenshot saved to $output_file"
else
	echo "Failed to create screenshot"
fi
