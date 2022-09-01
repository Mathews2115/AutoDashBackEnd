# Raspberry Pi (4) Digital Dash Server
![PXL_20220831_171948354 TS](https://user-images.githubusercontent.com/6019208/188015514-fbd4a566-37e8-45a7-9b83-0294ed8e6451.jpg)

![PXL_20210808_010642720](https://user-images.githubusercontent.com/6019208/137767684-6434229c-4fc2-47d6-8813-407d13573b93.jpg)
# This is the backend of the [Racepak/Holley Auto Digital Dash](https://github.com/Mathews2115/AutoDashFrontEnd). This pairs with the AutoDashFrontEnd
**WARNING - BUILDING THIS WHILE WE ARE FLYING - EXPECT MASSIVE STUPID CHANGES ON A WHIM**
## Check out this boilerplate dash
* https://github.com/Mathews2115/AutoDashFrontEndBoilerPlate - Feel free to clone this and make your own - it is a simple Tach display with no more bells or whistles

## Why?
My personal Digital Dash project for a heavily modified 1972 Ford LTD - communicating via CAN with a Holley EFI ECU and other goodies my car needs such as GPS speedo, fuel tank remaining estimation and whatever the heck else I'm gonna start throwing at it in the future.

## What?
This is the compnent that gets installed on the raspberry Pi. It will run a Node server that will:
1. Will host HTML/JS web content for chromium browser, (AutoDashFrontEnd)
2. Parse CAN messages via a CAN hat from the Holley ECU
3. Communicate with the dash via a websocket
4. Parse GPS messages from a GPS chip via USB serial
5. ...more to be added in the future!

## PRE-REQUISITES:
1. 64bit Bullseye OS
2. Node16 - 64 bit (just get ARMv8)

## NOTICE!
1. waveshare monitor (when on separate power source from pi) is not getting signal on initial power on
2. While I am building this specifically to fit on my project; I'm trying to make this modular enough for other people to pick and choose for their own needs if necessary. Feel free to fork this repo and go hog wild - just be sure to share some photos of your project because I love this stuff.


# Setup Hardware

## Hardware Used
* [waveshare 7.9 monitor](https://www.waveshare.com/wiki/7.9inch_HDMI_LCD)
* 3.0+ USB flash drive (optional)
* [Waveshare dual CAN hat](https://www.waveshare.com/wiki/2-CH_CAN_HAT) - CAN data from Holley ECU
* [Geekworm x715 Power/Fan](https://wiki.geekworm.com/X715_Software) - for 12-40v input to 5v output conversion
* [SparkFun GPS - NEO-M8U](https://www.sparkfun.com/products/16329) - Speedo and odometer
* Buttons / LEDS (optional)
  * A momentary switch to reset the fuel readings (because my fuel sender is non functional) (optional obviously)
  * [Adafruit i2c LED/Switch board](https://www.adafruit.com/product/5296) (to handle buttons/leds)
  * [i2c hat from sparkfun](https://www.sparkfun.com/products/14459)
* Check this out for safe shutdown stuff - it uses a timed relay to stop parasitic draw
  * https://www.youtube.com/watch?v=rPQ5pLYV1TA&t=328s
## Update PI EEPROM for new Bootloader
if you dont care about booting from USB, just skip to Setting up Image.
1. Download RPI's official [Imager](https://www.raspberrypi.org/software/)
2. Follow the steps for setting up your initial pi image from Setup Pi Image below
3. SSH in and lets have some fun
4.  (update bootloader stuff: watch this https://www.youtube.com/watch?v=8tTFgrOCsig)


## Setup Pi Image
1. Download RPI's official [Imager](https://www.raspberrypi.org/software/)
2. Image USB (or SD if you dont want usb) card with a rasp lite image
### Setup Headless
3. We are going to add SSH/Wifi so we can just ssh straight into it without needing a monitor (if desired) 
   1. Go into volume Boot of the card:
   2. [enable SSH](https://desertbot.io/blog/headless-raspberry-pi-4-ssh-wifi-setup):
      1. `sudo touch ssh`
   3. WiFi network 
      1. `sudo touch wpa_supplicant.conf`
      2. add the contents to that file:
```
country=US
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1

network={
    ssid="NETWORK-NAME"
    psk="NETWORK-PASSWORD"
}

```

### 7.9 Inch Monitor Support:
4. Edit the `/boot/config.txt`
5. add 
```
# waveshare 7.9 screen - https://www.waveshare.com/wiki/7.9inch_HDMI_LCD
hdmi_group=2
hdmi_mode=87
hdmi_timings=400 0 100 10 140 1280 10 20 20 2 0 0 0 60 0 43000000 3
bootcode_delay=1
```
The boot code delay is so the monitor has time to fully power on (if powered by a separate power supply - otherwise feel free to omit that line)
### Boot up
6. Pop the USB/SD in the pi and boot up
7. login pi/raspberry
8. (note: at some point set auto login to true, I still dont know how to do that without going to raspi-config) 
9. ssh from your computer:
   * `ssh-keygen -R raspberrypi.local`
   * `ssh pi@raspberrypi.local` 
   * (default password is raspberry)
10. Update everything: `sudo apt -y update && sudo apt -y upgrade ; sudo apt autoremove ; sudo apt dist-upgrade -y ; sudo reboot`
11. `sudo raspi-config`
    1.  turn on auto login

## CAN Handling
Don't bother doing any of this if you dont have the hat hooked up - it will cause issues on bootup - like no wifi
1. `sudo nano /boot/config.txt`
2.  uncomment `dtparam=spi=on`
3.  add below:

### PICAN2/3 CAN Hat
```
dtoverlay=mcp2515-can0,oscillator=16000000,interrupt=25
dtoverlay=spi-bcm2835-overlay
```

### Setup WaveShare Dual CAN hat
https://www.waveshare.com/wiki/2-CH_CAN_HAT

```
dtoverlay=mcp2515-can1,oscillator=16000000,interrupt=25
dtoverlay=mcp2515-can0,oscillator=16000000,interrupt=23
```
### CAN Software/Drivers
```
sudo apt -y install can-utils libsocketcan2 libsocketcan-dev
```

### Raising the CAN interface
1. `sudo nano /etc/network/interfaces`
2. THIS IS IMPORTANT - FOUND OUT THE REQUIRE BITSPEED  - THIS ONE IS SETTING IT TO 1000k: - paste the below
```
auto can0
iface can0 inet manual
   pre-up /sbin/ip link set can0 type can bitrate 1000000
   up /sbin/ifconfig can0 up
   up /sbin/ifconfig can0 txqueuelen 65536
   down /sbin/ifconfig can0 down
```
7. `sudo reboot`

## Safe Shutdown / Battery Backup
IMPORTANT - implement a way for your pi to shutdown safely - else make sure you put it in read only mode

## Chromium
### Install Chromium in Kiosk Mode

#### Install x11 xserver and Chromium
1. `sudo apt install --no-install-recommends xserver-xorg x11-xserver-utils xinit openbox --assume-yes`
2. `sudo apt install --no-install-recommends chromium-browser --assume-yes`
1. Now setup chromium with all the hardware enabled crap

#### Setup chromium and all the needed flags for hardware accelerated kiosk mode
1. `sudo nano /etc/xdg/openbox/autostart`
* Note:  Waveshare settings; uncomment that line (turning on the accelerated video driver will cause it to ignore the display-rotate - so we need to use xrander to rotate it in xserver)
```
# Disable any form of screen saver / screen blanking / power management
xset s off
xset s noblank
xset -dpms

xrandr --output HDMI-1 --rotate right
#xrandr --output HDMI-2 --rotate right
#xrandr --output HDMI-2 --same-as HDMI-1
#xrandr --output HDMI-1 --panning 1280x1280+0+0/0x0+0+0/0/0/0/0
#xrandr --output HDMI-1 --fb 1280x800
#xrandr --output HDMI-2 --pos 0x400

# Allow quitting the X server with CTRL-ATL-Backspace
setxkbmap -option terminate:ctrl_alt_bksp

# Start Chromium in kiosk mode
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' ~/.config/chromium/'Local State'
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/; s/"exit_type":"[^"]\+"/"exit_type":"Normal"/' ~/.config/chromium/Default/Preferences

# IF THE WEBGL DISPLAY IS FLIPPED: use this line (from here https://forums.raspberrypi.com/viewtopic.php?f=91&t=274315 )
#MESA_EXTENSION_OVERRIDE=-GL_MESA_framebuffer_flip_y chromium-browser --noerrdialogs --disable-infobars --disable-full-history-sync \

chromium-browser --window-position=0,0 --user-data-dir="/home/pi/Documents/Profiles/0" --noerrdialogs --disable-infobars --disable-full-history-sync \
--kiosk http:\\localhost:3000 
```

#### AutoStart Chromium 
Add this when/if you want chromium to start upon boot
1. `sudo nano /home/pi/.bash_profile`
2. Add this: 
   1. `[[ -z $DISPLAY && $XDG_VTNR -eq 1 ]] && startx -- -nocursor`
3. Reboot 

# Setup Dash firmware
## Prereqs to build AutoDasahBackEnd
## Install Node16 for Armv8(arm64)
1. Instructions from: https://www.officialrajdeepsingh.dev/install-node-js-and-npm-latest-version-on-raspberry-pi-4/
```
wget https://nodejs.org/dist/v16.14.0/node-v16.14.0-linux-arm64.tar.xz
tar -xf node-v16.14.0-linux-arm64.tar.xz
rm node-v16.14.0-linux-arm64.tar.xz
cd node-v16.14.0-linux-arm64
sudo cp -R * /usr/local/
sudo reboot
node -v
```

1. install yarn 
  ```
  curl -sL https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | sudo tee /usr/share/keyrings/yarnkey.gpg >/dev/null
     echo "deb [signed-by=/usr/share/keyrings/yarnkey.gpg] https://dl.yarnpkg.com/debian stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
     sudo apt update && sudo apt install yarn
  ```
2. From your Local Computer, copy the Dash BackEnd software over. (sans the node_modules)


## Yarn Install
1. `cd AutoDashBackEnd/`
2. `rm yarn.lock`
3. `cp yarn.lock.rpi_64 yarn.lock`
4. `yarn`

### Notes on Yarn.lock
* yarn.lock - Linux desktop file
* yarn.lock.rpi - 32 Bit version of raspi 
* yarn.lock.rpi_64 - x64 version of raspi <- current for raspberry pi 4

## Setup CAN on the PI
* Setup the PI to automatically start server (read from CAN, not VCAN) `RPI_system/prepare_preduction.sh`

## Simulate CAN in dev on the Pi
1. Start Dev CAN service `RPI_system/prepare_dev.sh`
   1. see that file to configure what canfile to run
   2. If you haven't ran the production version, you'll see a lot of Cannot do this/that - feel free to ignore them, it is just trying to undo the things `prepare_production` did.
2. reboot, it will automatically run the node test_server command
3. ssh in and play a canfile
   1. `canplayer vcan0=can0  -I ./can_dumps/candump-racepack-running.log -li`

## Setup Can/Vcan Auto interface
1. For Development mode: `RPI_system/start_vcan.sh`
   
### Simulate CAN in dev on your Mac / Linux
1. Start the virtual CAN interface: `.RPI_system/start_vcan.sh`
2. Start playing CAN messages from a captured can log: `canplayer vcan0=can0  -I ./can_dumps/candump-racepack-running.log -li`
3. Run the server: `npm run test_server`


## Helpful links
* [can util stuff](https://www.hackers-arise.com/post/2017/08/08/automobile-hacking-part-2-the-can-utils-or-socketcan)
* [NodeCan](https://github.com/sebi2k1/node-can)
* [uWebSockets](https://unetworking.github.io/uWebSockets.js/generated/interfaces/templatedapp.html#ws)
* https://desertbot.io/blog/headless-raspberry-pi-4-ssh-wifi-setup
* https://www.makeuseof.com/raspberry-pi-set-static-ip/
* https://roboticsbackend.com/raspberry-pi-3-pins/
* https://desertbot.io/blog/headless-raspberry-pi-4-ssh-wifi-setup

# Speed up Boot times
## consider disable services??
Consider disabling services to make boot time faster (if you dont need them) - havent curated the list below, disable at your own risk
* `sudo systemctl disable raspi-config.service`
* `sudo systemctl disable apt-daily-upgrade.service`
* `sudo systemctl disable rpi-eeprom-update.service`
* `sudo systemctl disable keyboard-setup.service`
* `sudo systemctl disable hciuart.service` 
* `sudo systemctl disable bluealsa.service`
* `sudo systemctl disable bluetooth.service`
* disable wifi/touch?

### disabling bluetooth
* https://di-marco.net/blog/it/2020-04-18-tips-disabling_bluetooth_on_raspberry_pi/

## Also remove overlays for disabled stuff
1. `sudo nano /boot/config.txt`
2. add 
```
#Disable Bluetooth 
dtoverlay=disable-bt
#dtparam=audio=on
# Disable Wifi (disable this when the dash is ready to go in; eliminate time waiting for Wifi to raise)
dtoverlay=disable-wifi
disable_touchscreen=1
```   


# CAN Protocol
1. Only supports two protocols currently, Racepak and PE3
2. make sure to specify the protocol in the settings.yaml file

## PE3
* [Protocol](https://pe-ltd.com/assets/AN400_CAN_Protocol_C.pdf)
* CAN data rate is 250kbps
## Holley / Racepak / NHRA

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
  * The RTC is sent as an u32 showing milliseconds since power on, or if the RTC was set will it will be the current time of 

# GPS
If you can, try to configure your GPS chip to only send the required messages.  In my instance, since I am using USB, I turned off all messages for other protocols (I2C, SPI, etc).   I also only enabled `NAV-ODO`, and  `HNR-PVT` messages.
* make sure settings.yaml, GPS settings are turned on if you require GPS functionality

# Cheatsheets
* log file of service
  * `journalctl `
Logs:
* `dmesg`
* `systemd-analyze`
* `systemd-analyze critical-chain`
*  `lsmod` - list of loaded modules

Monitoring
* Monitor CPU Clock Speed - `watch -n1 vcgencmd measure_clock arm`
* Measure Temperature -     `watch -n1 vcgencmd measure_temp`

# Personal Scratch Board/Notes:
* making quick src updates: `scp -r ../AutoDashBackEnd/src pi@pi.local:/home/pi/AutoDashBackEnd/src` 
* copy dist 
  *  `scp -r ../AutoDashFrontEnd/dist pi@pi.local:/home/pi/AutoDashBackEnd/dist/ `
```
~ cd development/AutoDashBackEnd                                       
➜  AutoDashBackEnd git:(main) ✗ canplayer vcan0=can0  -I ./can_dumps/candump-racepack-running.log -li

```
To run device related commands via SSH:
`DISPLAY=:0 <command like xandr or wmctrl>`
* two separate windows
```
chromium-browser --window-position=0,0 --user-data-dir="/home/pi/Documents/Profiles/0" --noerrdialogs --disable-infobars --disable-full-history-sync  --kiosk http:\\localhost:3000 --enable-features=CanvasOop>
51 chromium-browser --window-position=0,400 --user-data-dir="/home/pi/Documents/Profiles/1" --noerrdialogs --disable-infobars --disable-full-history-sync  --kiosk http:\\localhost:3000 --enable-features=CanvasO>
52 
#dtoverlay=gpio-shutdown
#dtoverlay=gpio-shutdown,debounce=5000
#dtoverlay=gpio-shutdown,gpio_pin=3,active_low=1,gpio_pull=up,debounce=5000
```
