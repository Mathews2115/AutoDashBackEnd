# Raspberry Pi (4) Dash Server
This is the compnent that gets installed on the raspberry Pi. It will run a Node server that will
1. host the AutoDashFrontEnd's dist files from `public/dist`.
2. listen and parse CAN messages from the PiCAN3 hat
3. Communicate with the dash via a websocket


## Tech Stack
* PiCAN 3 drivers
* node 14 (at the time of this and what was available for rpi4)
  
## How to run
### How to run development on your Linux/Mac

### How to run live on a car connected via CAN.
