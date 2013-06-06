#!/usr/bin/php
<?php

copy('http://citibikenyc.com/stations/json', '/home/amalia/dev/main/citibike/stationData/'.date('Ymd_His').'.json');

?>