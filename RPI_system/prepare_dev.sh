#!/bin/sh

# remove current can env
sudo systemctl stop can_server
sudo systemctl disable can_server
sudo rm /etc/systemd/system/can_server.service

sudo systemctl stop vcan_server
sudo systemctl disable vcan_server
sudo rm /etc/systemd/system/vcan_server.service

sudo systemctl stop vcan_setup
sudo systemctl disable vcan_setup
sudo rm /etc/systemd/system/vcan_setup.service

sudo rm /usr/local/bin/start_vcan.sh
sudo chmod u+rw /home/catnix/AutoDashBackEnd/RPI_system/start_vcan.sh
sudo cp /home/catnix/AutoDashBackEnd/RPI_system/start_vcan.sh /usr/local/bin/
sudo chmod u+rw /usr/local/bin/start_vcan.sh

# ccan socket server and web server setup
sudo cp /home/catnix/AutoDashBackEnd/RPI_system/services/vcan/vcan_server.service  /etc/systemd/system/
sudo chmod u+rw /etc/systemd/system/vcan_server.service

sudo cp /home/catnix/AutoDashBackEnd/RPI_system/services/vcan/vcan_setup.service  /etc/systemd/system/
sudo chmod u+rw /etc/systemd/system/vcan_setup.service

sudo systemctl enable vcan_setup
sudo systemctl enable vcan_server
