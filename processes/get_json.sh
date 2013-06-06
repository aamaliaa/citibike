cd /home/amalia/dev/main/citibike/processes/
./get_json_data.php
sleep 10
cd /home/amalia/dev/main/citibike/stationData/
newest_file=$(ls -t | head -n1)
ln -nfs $newest_file current