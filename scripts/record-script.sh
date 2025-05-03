#!/usr/bin/env bash

# Directory to store recordings
RECORDINGS_DIR="$HOME/Videos/ScreenRecordings"

# Get current date/time for filename
get_date() {
	date '+%Y-%m-%d_%H.%M.%S'
}

# Get audio output device
get_audio_output() {
	pactl list sources | grep 'Name' | grep 'monitor' | cut -d ' ' -f2
}

# Get the currently active monitor
get_active_monitor() {
	hyprctl monitors -j | jq -r '.[] | select(.focused == true) | .name'
}

# Send notification with optional video open action
send_notification() {
	local title="$1"
	local message="$2"
	local icon="${3:-video-x-generic}"
	local urgency="${4:-normal}"
	local action_file="${5:-}"

	if [[ -n "$action_file" && -f "$action_file" ]]; then
		if command -v dunstify &>/dev/null; then
			dunstify -a "Screen Recorder" -u "$urgency" -t 1500 -i "$icon" "$title" "$message" \
				--action="default,Open Video" \
				--action="open,Open Video"
		else
			notify-send -a "Screen Recorder" -u "$urgency" -t 1500 -i "$icon" "$title" "$message"
		fi
		sleep 0.5
		xdg-open "$action_file" &
	else
		if command -v dunstify &>/dev/null; then
			dunstify -a "Screen Recorder" -u "$urgency" -t 1500 -i "$icon" "$title" "$message"
		else
			notify-send -a "Screen Recorder" -u "$urgency" -t 1500 -i "$icon" "$title" "$message"
		fi
	fi
}

# Create recordings directory if it doesn't exist
mkdir -p "$RECORDINGS_DIR"
cd "$RECORDINGS_DIR" || exit 1

# Generate filename with timestamp
filename="recording_$(get_date).mp4"
recording_file="$RECORDINGS_DIR/$filename"

# Check if wf-recorder is already running
if pgrep wf-recorder >/dev/null; then
	# Stop recording
	pkill -INT wf-recorder

	# Wait for wf-recorder to finish
	while pgrep wf-recorder >/dev/null; do
		sleep 0.1
	done

	# Give a short delay for file to be properly saved
	sleep 0.5

	# Find most recent recording
	recent_video=$(find "$RECORDINGS_DIR" -type f -name "*.mp4" -printf '%T@ %p\n' | sort -n | tail -n 1 | cut -d' ' -f2-)
	recent_filename=$(basename "$recent_video")

	if [[ -f "$recent_video" ]]; then
		send_notification "Recording Stopped" "Saved as: $recent_filename" "video-x-generic" "critical" "$recent_video"
	else
		send_notification "Recording Error" "Could not find saved recording" "dialog-error" "critical"
	fi
else
	# Start recording
	send_notification "Starting Recording" "$filename" "video-x-generic" "critical"
	sleep 0.5

	case "$1" in
	"--stop")
		# Do nothing, just in case this is called directly
		;;
	"--sound")
		# Record region with audio
		wf-recorder --pixel-format yuv420p -f "$recording_file" -t --geometry "$(slurp)" --audio="$(get_audio_output)" &
		;;
	"--fullscreen-sound")
		# Record fullscreen with audio
		wf-recorder --pixel-format yuv420p -f "$recording_file" -t -o "$(get_active_monitor)" --audio="$(get_audio_output)" &
		;;
	"--fullscreen")
		# Record fullscreen without audio
		wf-recorder --pixel-format yuv420p -f "$recording_file" -t -o "$(get_active_monitor)" &
		;;
	*)
		# Default: Record region without audio
		wf-recorder --pixel-format yuv420p -f "$recording_file" -t --geometry "$(slurp)" &
		;;
	esac

	# Get PID of recorder and disown it
	recorder_pid=$!
	disown "$recorder_pid"
fi

exit 0
