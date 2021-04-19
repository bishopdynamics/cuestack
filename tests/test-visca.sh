PRESET_LIST="0 1 2 3"
REST_TIME="0.3"

while true; do 
	for NUM in $PRESET_LIST; do
		echo -n "calling preset ${NUM}: "
		curl 'http://localhost:8080/trigger?cue=test_visca_preset_'"$NUM"
		echo ""
		sleep "$REST_TIME"
	done
done
