Spring 2026 I took Dr. Blikstein’s “Beyond Bits and Atoms: Fabrication and Physical Computing for Education.”  
https://bba.tltlab.org/syllabus/

I created “Circuit Tiles,” wooden tile manipulatives to help apprentices learn:

- Circuit Polarity
- Single/Parallel Circuits
- Ohm’s Law

I created 4 different tiles to represent a circuit:
- Battery
- LED
- Resistor
- Wire

To begin this "Modeling an Interactive Appliance" activity, I took photos of the wooden tiles. /img

My initial thought was to try again the Qwen/Llama procedure I tried in /5003-02.  I made an annotation.csv of the .jpgs. /data

But, as the /chat shows, again no success generating a state machine.  But looking at the .json code I did see that the orientation of the edges of the tiles, and the user rotating the tiles were the primary rules I had to encode. /out/qwen

So I made svgs of the Battery, LED, resistor and wire tiles. /svg

One thing that worked for me in 5003-02 was the Mingei Crafts Ontology (CrO) and Mingei Online Platform (MOP) Activity Diagramming Hammering
https://github.com/rl3280/5003_02/blob/main/src/2_mingei-hammering-activity-diagram.md

The activity-diagram generated for this assignment looks pretty good here as well. 

The code-report documents the variables/states/transitions/control flow.

I didn't master or even comprehend most of the JS code.  But I was able to go back and forth with CoPilot watching the svg tiles rotate back and forth, knowing intimately when the LED should go on, based on my working with the wood tiles back in the spring.  And having a basic vocabulary about computational thinking, I believe, kept the AI from drifting out of my sandbox.
