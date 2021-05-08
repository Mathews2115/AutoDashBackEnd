# Raspberry Pi (4) Dash Server
This is the compnent that gets installed on the raspberry Pi. It will run a Node server that will
1. host the AutoDashFrontEnd's dist files from `public/dist`.
2. listen and parse CAN messages from the PiCAN3 hat
3. Communicate with the dash via a websocket

## Tech Stack
* PiCAN 3 drivers
* node 14 (at the time of this and what was available for rpi4)
* Based off of older [build](https://gist.github.com/Mathews2115/ed3dbd8623ee815a7bed363dbc7c73a6)

## Setting Raspberry Pi 4
* [install Node](https://medium.com/officialrajdeepsingh/install-node-js-latest-version-on-raspberry-pi-4-14012ec93901)
* install yarn 
  ```
  curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | sudo tee /usr/share/keyrings/yarnkey.gpg >/dev/null
     echo "deb [signed-by=/usr/share/keyrings/yarnkey.gpg] https://dl.yarnpkg.com/debian stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
     sudo apt-get update && sudo apt-get install yarn
  ```
* `sudo apt install git`
* Copy files from you dev computer to the pi
  * Copy the latest ` scp -r ../AutoDashBackEnd pi@raspberrypi.local:/home/pi`
* `yarn install`
* lol `scp -r ../AutoDashBackEnd/uws_linux_arm_88.node pi@raspberrypi.local:/home/pi/AutoDashBackEnd/node_modules/uWebSockets.js/ `

## After you install packages on the pi
1. Copy the lock file back to our project

## Development on your Linux/Mac

### Install needed libraries
1. install can utils
2. `sudo chmod u+rw RPI_system/start_vcan.sh`

### Simulate CAN in dev
3. Start the virtual CAN interface: `./start_vcan.sh`
4. Start playing CAN messages from a captured can log: `canplayer vcan0=can0  -I ./can_dumps/candump-racepack-running.log -li`
5. Run the server: `npm run test_server`


## Simulate CAN in dev on the Pi
1. Start Dev CAN service `~/AutoDashBackEnd$ RPI_system/prepare_dev.sh`
   1. see that file to configure what canfile to run
2. reboot, it will automatically run the node test_server command

## Live on a car connected via CANBUS.



## Helpful links
* [can util stuff](https://www.hackers-arise.com/post/2017/08/08/automobile-hacking-part-2-the-can-utils-or-socketcan)
* [NodeCan](https://github.com/sebi2k1/node-can)
* [uWebSockets](https://unetworking.github.io/uWebSockets.js/generated/interfaces/templatedapp.html#ws)
* [Node14](https://nodejs.org/dist/latest-v14.x/docs/api/process.html#process_event_beforeexit)
  


# CAN Protocol
## Holley / NHRA

### General Decoding Info
* Found [here](http://www.nhraracer.com/Files/Tech/NHRA_EFI_Specifications_Rev8.pdf) towards the bottom
* The CAN data rate:  1 Mbit/sec 
* Holley uses the ID as bit-wise structure:   
  * Bits 31:29 – CAN flags (normally filtered out and read as 0)   
  * Bits 28 – command bit (=1)   
  * Bits 27:25 – Target ID (= 111, broadcast)   
  * Bits 24:14 – Target Serial (used as a channel # index)   
  * Bits 13:11 – source ID (= 010, hefi)  
  * Bits 10:0 – source serial (the lower 11 bits of the serial # of the device as printed on the back of the ECU)
* using extended identifier (CANID) format.   
  * To decode data: mask out the lower 11 bits of the CANID 
  * (i.e., logical AND with 0xFFFFF800)
### Monitor Packets
Monitor data is continuously broadcast by the HEFI.  
* The monitor packets contain an index in their CAN id and values in the data field.  
* rate: approximately 10mS intervals. 
* All monitor packets have a DLC of 8 bytes.  
  * payload contains two values.  
  * Each set of 4 bytes (with the exception of RTC) is in a signed “fixed 24.8” format (essentially fixed 24.8 = float *256) 
  * The RTC is sent as an u32 showing milliseconds since power on, or if the RTC was set will it will be the current time of day.



# Cheatsheets
* log file of service
  * `journalctl `