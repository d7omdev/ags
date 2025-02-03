#!/usr/bin/env bash

getdate() {
	date '+%Y-%m-%d_%H.%M.%S'
}
getaudiooutput() {
	pactl list sources | grep 'Name' | grep 'monitor' | cut -d ' ' -f2
}
getactivemonitor() {
	hyprctl monitors -j | jq -r '.[] | select(.focused == true) | .name'
}

mkdir -p $HOME/Videos/ScreenRecordings
cd $HOME/Videos/ScreenRecordings || exit

# Variable to store the recording file path
recording_file="$HOME/Videos/ScreenRecordings/recording_$(getdate).mp4"

# Check if wf-recorder is already running (i.e., recording is ongoing)
if pgrep wf-recorder >/dev/null; then
	# Stop the recording
	pkill wf-recorder &
	# Send notification that recording has stopped with an action to open the video
	notify-send -a "record-script.sh" \
		"Recording Stopped" \
		"Click to open the recorded video." \
		-i "video" \
		--action="open_video=Open Video" \
		&

	# Sleep for a while to give the notification time to show up
	sleep 1

	# Prompt the user to open the video folder if the action was clicked
	# We use a simple polling loop to detect the action (no external tools)
	read -p "Press enter to open the recording folder..." &&
		xdg-open "$HOME/Videos/ScreenRecordings" &
	sleep 0.5 &&
		recent_video=$(ls -t $HOME/Videos/ScreenRecordings | head -n 1) &&
		xdg-open "$HOME/Videos/ScreenRecordings/$recent_video"
else
	# If not already recording, start a new recording
	notify-send "Starting recording" "recording_$(getdate).mp4" -a 'record-script.sh'
	sleep 1
	if [[ "$1" == "--sound" ]]; then
		wf-recorder --pixel-format yuv420p -f "$recording_file" -t --geometry "$(slurp)" --audio="$(getaudiooutput)" &
		disown
	elif [[ "$1" == "--fullscreen-sound" ]]; then
		wf-recorder -o $(getactivemonitor) --pixel-format yuv420p -f "$recording_file" -t --audio="$(getaudiooutput)" &
		disown
	elif [[ "$1" == "--fullscreen" ]]; then
		wf-recorder -o $(getactivemonitor) --pixel-format yuv420p -f "$recording_file" -t &
		disown
	else
		wf-recorder --pixel-format yuv420p -f "$recording_file" -t --geometry "$(slurp)" &
		disown
	fi
fi
